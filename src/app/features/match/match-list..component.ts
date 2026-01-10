import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { Match } from '../../core/models/match';
import { AuthService } from '../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PredictionService } from '../../core/services/prediction.service';
import { Prediction } from '../../core/models/predictions';
import { PredictionRules } from '../../core/use-cases/predictions-rules';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { MatchFormComponent } from './match-form/match-form.component';
import { MatchCardComponent } from './match-card/match-card.component';
import { firstValueFrom } from 'rxjs';


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
  imports: [CommonModule, ReactiveFormsModule, MatchFormComponent, MatchCardComponent],
  templateUrl: './match-list.component.html',
})
export class MatchComponent implements OnInit {
  private matchService = inject(MatchService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private predictionService = inject(PredictionService);
  canViewOthers: Map<string, boolean> = new Map();
  othersPredictions = signal<any[]>([]);
  selectedMatchId = signal<string | null>(null);
  toastService = inject(ToastService);
  protected readonly Math = Math;

  matches = signal<Match[]>([]);
  isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false });
  loading = signal(false);
  teams = signal<any[]>([]);
  myPredictions = signal<Prediction[] | null>(null);
  isUploading = false;
  readonly statusOrder = ['en direct', 'à venir', 'terminé'];


  async handleUploadAndSubmit(event: {
  match: Match,
  scoreA: number | null,
  scoreB: number | null,
  proofUrl: File | undefined
}) {
  const { match, scoreA, scoreB, proofUrl } = event;
  const userId = this.authService.currentUserId;

  if (!userId || scoreA === null || scoreB === null) {
    this.toastService.show('Données manquantes pour le pronostic', 'error');
    return;
  }

  try {
    this.isUploading = true;
    let finalProofPath = '';

    if (proofUrl) {
      // 🔒 Sanitize du nom de fichier (OBLIGATOIRE pour Supabase)
      const sanitizedFileName = proofUrl.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // accents
        .replace(/['"]/g, '')            // quotes
        .replace(/\s+/g, '_')            // espaces → _
        .replace(/[^a-zA-Z0-9._-]/g, '') // chars interdits
        .toLowerCase();

      // 🆕 Recréation du fichier avec un nom valide
      const safeFile = new File(
        [proofUrl],
        sanitizedFileName,
        { type: proofUrl.type }
      );

      finalProofPath =
        (await firstValueFrom(
          this.supabase.uploadProof(safeFile, userId)
        )) || '';
    }

    const newPrediction: Prediction = {
      id: '',
      userId,
      match_id: match.id!,
      score_a: scoreA,
      score_b: scoreB,
      proof_url: finalProofPath,
      timestamp: new Date(),
    };

    await firstValueFrom(
      this.predictionService.submitPrediction(match, newPrediction)
    );

    this.toastService.show('Pronostic soumis avec succès !', 'success');
    this.loadMyPredictions();

  } catch (error) {
    console.error('Erreur lors du traitement du pronostic:', error);
    this.toastService.show('Une erreur est survenue lors de l\'envoi.', 'error');
  } finally {
    this.isUploading = false;
  }
}


  getMatchesByStatus(status: string) {
    return this.matches().filter(m => m.status === status);
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'en direct': return '🔴 Matchs en Direct';
      case 'à venir': return '📅 Matchs à venir';
      case 'terminé': return '🏁 Matchs terminés';
      default: return status;
    }
  }

  ngOnInit() {
    this.loadMatches();
    this.loadMyPredictions();
  }

  getOthersPredictions(matchId: string | undefined): Prediction[] {
    if (!matchId) return [];
    return this.othersPredictions().filter(p => p.match_id === matchId);
  }

  viewOtherPredictions(matchId: string) {
    this.predictionService.getAllOtherUsersPredictionsByMatch(matchId).subscribe(data => {
      this.othersPredictions.set(data);
      this.selectedMatchId.set(matchId);
    });
  }

  loadMatches() {
    this.loading.set(true);
    this.matchService.getTeams().subscribe((data) => {
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

  handleStatusChange(event: { id: string; status: string }) {
    if (event.status === 'en direct') {
      this.startMatch(event.id);
    } else if (event.status === 'terminé') {
      this.finishMatch(event.id);
    }
  }

  finishMatch(matchId: string) {
    this.matchService.updateMatchStatus(matchId, 'terminé').subscribe(() => {
      this.loadMatches();
    });
  }

  onSubmitNewMatch(matchForm: FormGroup) {
    if (matchForm.valid && this.isAdmin()) {
      const newMatch = { ...matchForm.value, status: 'à venir' } as Partial<Match>;

      this.matchService.createMatch(newMatch).subscribe(() => {
        this.loadMatches();
        this.toastService.show('Match créé avec succès !', 'success');
      });
    }
  }

  deleteMatch(id: string | undefined) {
    if (id && this.isAdmin()) {
      this.matchService.deleteMatch(id).subscribe(() => this.loadMatches());
    }
  }

  updateScore(event: { id: string, side: 'a' | 'b', change: number }) {
    const { id, side, change } = event;
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

  deletePrediction(predictionId: string) {
    this.predictionService.deletePrediction(predictionId).subscribe(() => {
      this.toastService.show('Pronostic supprimé avec succès !', 'success');
      this.loadMyPredictions();
    });
  }

  getMatchPrediction(matchId: string | undefined): Prediction | null {
    if (!matchId || !this.myPredictions()) return null;
    return this.myPredictions()!.find((p) => p.match_id === matchId) ?? null;
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








}
