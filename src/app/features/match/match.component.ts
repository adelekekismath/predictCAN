import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { Match } from '../../core/models/match';
import { AuthService } from '../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PredictionService } from '../../core/services/prediction.service';
import { Prediction } from '../../core/models/predictions';
import { PredictionRules } from '../../core/use-cases/predictions-rules';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

export interface Result {
  id: string;
  matchId: string;
  actualTeamAScore: number;
  actualTeamBScore: number;
  determinedAt: Date;
}

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.css'],
})
export class MatchComponent implements OnInit {
  private matchService = inject(MatchService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private predictionService = inject(PredictionService);
  private fb = inject(FormBuilder);
  canViewOthers :Map<string, boolean> = new Map();
  othersPredictions = signal<any[]>([]);
  selectedMatchId = signal<string | null>(null);
  toastService = inject(ToastService);

  matches = signal<Match[]>([]);
  isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false });
  loading = signal(false);
  teams = signal<any[]>([]);
  myPredictions = signal<Prediction[]>([]);

  selectedFiles = signal<Map<string, File>>(new Map());

  isUploading = false;

  onFileSelected(event: any, matchId: string) {
    const file = event.target.files[0];
    if (file) {
      // On met à jour le Map avec le nouveau fichier pour ce match précis
      this.selectedFiles.update((map) => {
        const newMap = new Map(map);
        newMap.set(matchId, file);
        return newMap;
      });
    }
  }

  async handleUploadAndSubmit(match: Match, sA: string, sB: string) {
    let selectedFile = this.selectedFiles().get(match.id!);
    if (!selectedFile) return;

    try {
      this.isUploading = true;
      const userId = this.authService.currentUserId;

      const storagePath = this.supabase
        .uploadProof(selectedFile, userId!)
        .subscribe({
          next: (path = '') => {
            const newPrediction: Prediction = {
              id: '',
              userId: userId!,
              match_id: match.id!,
              score_a: parseInt(sA),
              score_b: parseInt(sB),
              proofUrl: path,
              timestamp: new Date(),
            };

            this.predictionService
              .submitPrediction(match, newPrediction)
              .subscribe({
                next: () => {
                  this.isUploading = false;
                  selectedFile = undefined;
                },
              });
          },
          error: () => {
            this.isUploading = false;
          },
        });
    } catch (error) {
      this.isUploading = false;
      alert("Erreur lors de l'upload de l'image");
    }
  }

  matchForm = this.fb.group({
    team_a: [null, [Validators.required]],
    team_b: [null, [Validators.required]],
    kickoff_time: ['', [Validators.required]],
    stage: ['8ème de finale', [Validators.required]],
    status: ['à venir'],
    score_a: [0],
    score_b: [0],
  });

  stages = [
    '8ème de finale',
    'Quart de finale',
    'Demi-finale',
    'Match pour la 3ème place',
    'Finale',
  ];

  ngOnInit() {
    this.loadMatches();
    this.loadMyPredictions();
  }

  viewOtherPredictions(matchId: string) {
    if (this.selectedMatchId() === matchId) {
      this.selectedMatchId.set(null);
      return;
    }

    this.predictionService.getAllOtherUsersPredictionsByMatch(matchId).subscribe(data => {
      this.othersPredictions.set(data);
      this.selectedMatchId.set(matchId);
    });
  }

  loadMatches() {
    this.loading.set(true);
    this.matchService.getTeams().subscribe((data) => {
      console.log(data);
      this.teams.set(data);
    });
    this.matchService.getMatchesWithNames().subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
        data.forEach(match => {
          this.canViewOthers.set(match.id!, false);
        });
      },
      error: () => this.loading.set(false),
    });
  }

  loadMyPredictions() {
    const user = this.authService.currentUserId;
    if (user) {
      this.predictionService
        .getCurrentUserPredictions()
        .subscribe((predictions) => {
          this.myPredictions.set(predictions);
        });
    }
  }

  startMatch(matchId: string) {
    this.matchService.updateMatchStatus(matchId, 'en direct').subscribe(() => {
      this.loadMatches();
    });
  }

  finishMatch(matchId: string) {
    if (confirm('Voulez-vous vraiment terminer ce match ?')) {
      this.matchService.updateMatchStatus(matchId, 'terminé').subscribe(() => {
        this.loadMatches();
      });
    }
  }

  onSubmit() {
    if (this.matchForm.valid && this.isAdmin()) {
      const newMatch = this.matchForm.value as Partial<Match>;
      this.matchService.createMatch(newMatch).subscribe(() => {
        this.matchForm.reset({ score_a: 0, score_b: 0, status: 'à venir' });
        this.loadMatches();
      });
    }
  }

  deleteMatch(id: string | undefined) {
    if (id && confirm('Supprimer ce match ?') && this.isAdmin()) {
      this.matchService.deleteMatch(id).subscribe(() => this.loadMatches());
    }
  }

  updateScore(id: string | undefined, side: 'a' | 'b', change: number) {
    const match = this.matches().find((m) => m.id === id);
    if (!match || !id || !this.isAdmin()) return;

    const updates = {
      score_a:
        side === 'a'
          ? Math.max(0, (match.score_a || 0) + change)
          : match.score_a,
      score_b:
        side === 'b'
          ? Math.max(0, (match.score_b || 0) + change)
          : match.score_b,
    };

    this.matchService
      .updateMatch(id, updates)
      .subscribe(() => this.loadMatches());
  }

  predict(matchId: string, scoreA: string, scoreB: string) {
    const valA = parseInt(scoreA);
    const valB = parseInt(scoreB);

    if (isNaN(valA) || isNaN(valB)) {
      alert('Veuillez entrer des scores valides.');
      return;
    }

    this.matchService.savePrediction(matchId, valA, valB).subscribe({
      next: () => this.toastService.show('Pronostic enregistré avec succès !', 'success'),
      error: (err) => console.error('Erreur:', err),
    });
  }

  async onPredict(
    match: Match,
    sA: HTMLInputElement,
    sB: HTMLInputElement,
    pUrl: HTMLInputElement
  ) {
    await this.handleUploadAndSubmit(match, sA.value, sB.value);
    this.predictionService
      .submitPrediction(match, {
        match_id: match.id!,
        score_a: parseInt(sA.value),
        score_b: parseInt(sB.value),
        proofUrl: pUrl.value,
        timestamp: new Date(),
      })
      .subscribe({
        next: () => {
          this.toastService.show('Pronostic soumis avec succès !', 'success');
          this.loadMyPredictions();
          this.matchForm.reset();
          sA.value = '';
          sB.value = '';
          pUrl.value = '';
          this.selectedFiles.update((map) => {
            const newMap = new Map(map);
            newMap.delete(match.id!);
            return newMap;
          });
        },
        error: (err) => {
          console.error(
            'Erreur lors de la soumission du pronostic:',
            err.message
          );
        },
      });
  }

  getMatchPrediction(matchId: string | undefined): Prediction | undefined {
    if (!matchId) return undefined;
    return this.myPredictions().find((p) => p.match_id === matchId);
  }

  getPoints(match: Match, prediction: Prediction): number {
    const result: Result = {
      id: '',
      matchId: match.id!,
      actualTeamAScore: match.score_a,
      actualTeamBScore: match.score_b,
      determinedAt: new Date(),
    };
    return PredictionRules.calculatePointsEarned(prediction, match);
  }

  checkCanPredict(match: Match): boolean {
    return PredictionRules.canSubmitOrModify(match);
  }



  getFileForMatch(matchId: string | undefined): File | undefined {
    if (!matchId) return undefined;
    return this.selectedFiles().get(matchId);
  }





}
