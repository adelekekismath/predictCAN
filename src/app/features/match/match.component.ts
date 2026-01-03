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
  styleUrls: ['./match.component.css']
})
export class MatchComponent implements OnInit {
  private matchService = inject(MatchService);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private predictionService = inject(PredictionService);
  private fb = inject(FormBuilder);

  // Signaux et Observables
  matches = signal<Match[]>([]);
  isAdmin = toSignal(this.authService.isAdmin$, { initialValue: false });
  loading = signal(false);
  teams = signal<any[]>([]);
  myPredictions = signal<Prediction[]>([]);

  selectedFile: File | null = null;
  
isUploading = false;

onFileSelected(event: any) {
  this.selectedFile = event.target.files[0];
}

async handleUploadAndSubmit(match: Match, sA: string, sB: string) {
  if (!this.selectedFile) return;

  try {
    this.isUploading = true;
    const userId = this.authService.currentUserId;

    // 1. Upload du fichier vers Supabase Storage
    const storagePath =  this.supabase.uploadProof(this.selectedFile, userId!).subscribe({
      next: (path = '') => {

    // 2. Création de l'objet Prediction selon ton interface
    const newPrediction: Prediction = {
      id: '', // généré par la DB
      userId: userId!,
      matchId: match.id!,
      predictedTeamAScore: parseInt(sA),
      predictedTeamBScore: parseInt(sB),
      proofUrl: path, // On stocke le chemin relatif
      timestamp: new Date()
    };

    // 3. Enregistrement en base de données
    this.predictionService.submitPrediction(match, newPrediction).subscribe({
      next: () => {
        this.isUploading = false;
        this.selectedFile = null;
        // Rafraîchir les prédictions ici
      }
    });
      },
      error: () => {
        this.isUploading = false;
        alert("Erreur lors de l'upload de l'image");
      }
    });
  } catch (error) {
    this.isUploading = false;
    alert("Erreur lors de l'upload de l'image");
  }
}

  // Formulaire pour ajouter/modifier
  matchForm = this.fb.group({
    team_a: [null, [Validators.required]],
    team_b: [null, [Validators.required]],
    kickoff_time: ['', [Validators.required]],
    stage: ['8ème de finale', [Validators.required]],
    status: ['à venir'],
    score_a: [0],
    score_b: [0]
  });

  stages = [
  '8ème de finale',
  'Quart de finale',
  'Demi-finale',
  'Match pour la 3ème place',
  'Finale'
];

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches() {
    this.loading.set(true);
    this.matchService.getTeams().subscribe(data =>{
      console.log(data);
      this.teams.set(data);
    } );
    this.matchService.getMatchesWithNames().subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startMatch(matchId: string) {
    this.matchService.updateMatchStatus(matchId, 'en direct').subscribe(() => {
      this.loadMatches();
    });
  }

  // Termine le match (passe à 'terminé')
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
    const match = this.matches().find(m => m.id === id);
    if (!match || !id || !this.isAdmin()) return;

    const updates = {
      score_a: side === 'a' ? Math.max(0, (match.score_a || 0) + change) : match.score_a,
      score_b: side === 'b' ? Math.max(0, (match.score_b || 0) + change) : match.score_b
    };

    this.matchService.updateMatch(id, updates).subscribe(() => this.loadMatches());
  }

  // Dans ton composant MatchManagementComponent
predict(matchId: string, scoreA: string, scoreB: string) {
  const valA = parseInt(scoreA);
  const valB = parseInt(scoreB);

  if (isNaN(valA) || isNaN(valB)) {
    alert('Veuillez entrer des scores valides.');
    return;
  }

  this.matchService.savePrediction(matchId, valA, valB).subscribe({
    next: () => alert('Pronostic enregistré !'),
    error: (err) => console.error('Erreur:', err)
  });
}

onPredict(match: Match, sA: string, sB: string, pUrl: string) {
  this.predictionService.submitPrediction(
    match,
    {
      matchId: match.id!,
      predictedTeamAScore: parseInt(sA),
      predictedTeamBScore: parseInt(sB),
      proofUrl: pUrl,
      timestamp: new Date()
    }
  ).subscribe({
    next: () => {
      // Notification de succès
      console.log("Pronostic enregistré !");
    },
    error: (err) => {
      // Notification d'erreur (ex: Délai dépassé, Preuve manquante)
      console.error("Erreur lors de la soumission du pronostic:", err.message);
    }
  });
}

getMatchPrediction(matchId: string | undefined): Prediction | undefined {
  if (!matchId) return undefined;
  return this.myPredictions().find(p => p.matchId === matchId);
}

getPoints(match: Match, prediction: Prediction): number {
  const result: Result = {
    id: '',
    matchId: match.id!,
    actualTeamAScore: match.score_a,
    actualTeamBScore: match.score_b,
    determinedAt: new Date()
  };
  return PredictionRules.calculatePointsEarned(prediction, result);
}

checkCanPredict(match: Match): boolean {
  return PredictionRules.canSubmitOrModify(match);
}

canViewOthers(match: Match): boolean {
  return PredictionRules.canViewOthersPredictions(match);
}
}
