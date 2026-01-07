import { Component, computed, inject, signal } from '@angular/core';
import { Prediction } from '../../core/models/predictions';
import { Match } from '../../core/models/match';
import { MatchService } from '../../core/services/match.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { PredictionRules } from '../../core/use-cases/predictions-rules';
import { CommonModule } from '@angular/common';
import { Profile } from '../../core/models/profile';

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
  user = signal<Profile | null>(null);

  ngOnInit() {
    this.matchService.getMatchesWithNames().subscribe((matches) => {
      this.matches.set(matches);
    });

    const user = this.authService.currentUserId;
    if (user) {
      this.predictionService.getCurrentUserPredictions().subscribe((predictions) => {
        this.predictions.set(predictions);
      });
      this.authService.currentUserProfile$ .subscribe((profile) => {
        this.user.set(profile);
      });
    }
  }

  isExpert = computed(() => this.history().every(h => h.prono.proof_url !== ''));

  history = computed(() => {
    const userPredictions = this.predictions();
    const allMatches = this.matches();

    return allMatches
      .filter(m => m.status === 'terminé')
      .map(match => {
        const prono = userPredictions.find(p => p.match_id === match.id);
        if (!prono) return null;

        const points = PredictionRules.calculatePointsEarned(prono, match);

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
      if (!prono) return null;

      let earnedPoints = 0;
      if (match.status === 'terminé') {
        earnedPoints = PredictionRules.calculatePointsEarned(prono, match);
      }

      return {
        match,
        prono,
        earnedPoints,
        isModifiable: PredictionRules.canSubmitOrModify(match)
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => new Date(b!.match.kickoff_time).getTime() - new Date(a!.match.kickoff_time).getTime());
});

 stats = computed(() => {
  const h = this.history();

  if (!h || h.length === 0) {
    return { totalPoints: 0, exactScores: 0, correctWinners: 0, efficiency: 0 };
  }

  return {
    totalPoints: h.reduce((acc, curr) => acc + (curr?.points || 0), 0),

    exactScores: h.filter(x =>
      x.prono.score_a === x.match.score_a &&
      x.prono.score_b === x.match.score_b
    ).length,

    correctWinners: h.filter(x => {
      const pronoResult = Math.sign(x.prono.score_a - x.prono.score_b);
      const realResult = Math.sign(x.match.score_a - x.match.score_b);
      return pronoResult === realResult;
    }).length,

    efficiency: Math.round((h.filter(x => x.points > 0).length / h.length) * 100)
  };
});
}
