import { Component, computed, inject, signal } from '@angular/core';
import { Prediction } from '../../core/models/predictions';
import { Match } from '../../core/models/match';
import { MatchService } from '../../core/services/match.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { PredictionRules } from '../../core/use-cases/predictions-rules';
import { CommonModule } from '@angular/common';

export interface PointHistory {
  matchDate: string;
  pointsEarned: number;
  cumulativePoints: number;
  matchLabel: string;
}

@Component({
  selector: 'app-stats',
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent {
  private matchService = inject(MatchService);
  private predictionService = inject(PredictionService);
  private authService = inject(AuthService);

  matches = signal<Match[]>([]);
  predictions = signal<Prediction[]>([]);

  ngOnInit() {
    this.matchService.getMatchesWithNames().subscribe((matches) => {
      this.matches.set(matches);
    });

    const user = this.authService.currentUserId;
    if (user) {
      this.predictionService.getCurrentUserPredictions().subscribe((predictions) => {
        this.predictions.set(predictions);
      });
    }
  }

  // 1. Calcul de l'historique détaillé
  history = computed(() => {
    const userPredictions = this.predictions();
    const allMatches = this.matches();

    // On ne garde que les matchs terminés où l'utilisateur a fait un prono
    return allMatches
      .filter(m => m.status === 'terminé')
      .map(match => {
        const prono = userPredictions.find(p => p.match_id === match.id);
        if (!prono) return null;

        const points = PredictionRules.calculatePointsEarned(prono, {
          id: '', matchId: match.id!,
          actualTeamAScore: match.score_a,
          actualTeamBScore: match.score_b,
          determinedAt: new Date()
        });

        return {
          match,
          prono,
          points,
          date: new Date(match.kickoff_time)
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => a!.date.getTime() - b!.date.getTime());
  });

  allUserPredictions = computed(() => {
  const userPredictions = this.predictions();
  const allMatches = this.matches();

  return allMatches
    .map(match => {

      const prono = userPredictions.find(p =>{return p.match_id === match.id});
      if (!prono) return null; // On n'affiche que les matchs où il y a un prono

      // Calcul des points seulement si terminé
      let earnedPoints = 0;
      if (match.status === 'terminé') {
        earnedPoints = PredictionRules.calculatePointsEarned(prono, {
          id: '', matchId: match.id!,
          actualTeamAScore: match.score_a,
          actualTeamBScore: match.score_b,
          determinedAt: new Date()
        });
      }

      return {
        match,
        prono,
        earnedPoints,
        // On utilise ta règle 1 pour savoir si c'est encore modifiable
        isModifiable: PredictionRules.canSubmitOrModify(match)
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => new Date(b!.match.kickoff_time).getTime() - new Date(a!.match.kickoff_time).getTime()); // Plus récent en haut
});

  stats = computed(() => {
    const h = this.history();
    return {
      totalPoints: h.reduce((acc, curr) => acc + curr!.points, 0),
      exactScores: h.filter(x => x!.points === 5).length,
      correctWinners: h.filter(x => x!.points === 2).length,
      efficiency: h.length > 0 ? Math.round((h.filter(x => x!.points > 0).length / h.length) * 100) : 0
    };
  });
}
