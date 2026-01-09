import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamDisplayComponent } from './team-display/team-display.component';
import { PredictionFormComponent } from './prediction-form/prediction-form.component';
import { PredictionResultComponent } from './prediction-result/prediction-result.component';
import { CommunityPredictionsComponent } from './community-predictions/community-predictions.component';
import { Match } from '../../../core/models/match';
import { Prediction } from '../../../core/models/predictions';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [
    CommonModule,
    TeamDisplayComponent,
    PredictionFormComponent,
    PredictionResultComponent,
    CommunityPredictionsComponent
  ],
  templateUrl: './match-card.component.html',
})
export class MatchCardComponent {
  @Input({ required: true }) match!: any;
  @Input() isAdmin: boolean = false;
  @Input() userProno: Prediction | null = null;
  @Input() othersPronos: any[] = [];

  @Output() statusChange = new EventEmitter<{ id: string, status: string }>();
  @Output() scoreUpdate = new EventEmitter<{ id: string, side: 'a' | 'b', change: number }>();
  @Output() deletePrediction = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() viewOtherPredictions = new EventEmitter<string>();
  @Output() addPrediction = new EventEmitter<{
    match: Match;
    scoreA: number | null;
    scoreB: number | null;
    proofUrl: File | undefined;
  }>();

  toastService = inject(ToastService);

  canPredict(match: any): boolean {
    if (match.status !== 'à venir') return false;

    const kickoff = new Date(match.kickoff_time);
    const now = new Date();
    return now < kickoff;
  }

  onDeleteProno(predictionId: string) {
    this.toastService.confirm('Êtes-vous sûr de vouloir supprimer votre pronostic ?').then((confirmed) => {
      if (confirmed) {
        this.deletePrediction.emit(predictionId);
      }
    });
  }

  addPredictionEmit(scoreA: number | null, scoreB: number | null, proofUrl: File | undefined) {
    this.addPrediction.emit({ match: this.match, scoreA, scoreB, proofUrl });
  }

  viewOtherPredictionsEmit() {
    this.viewOtherPredictions.emit(this.match.id);
  }


  startMatch() {
    this.toastService.confirm('Voulez-vous démarrer ce match ? Les utilisateurs pourront alors voir les pronostics des autres.').then((confirmed) => {
      if (confirmed) {
        this.statusChange.emit({ id: this.match.id, status: 'en direct' });
      }
    });
  }

  finishMatch() {
    this.toastService.confirm('Voulez-vous vraiment terminer ce match ?').then((confirmed) => {
      if (confirmed) {
        this.statusChange.emit({ id: this.match.id, status: 'terminé' });
      }
    });
  }



  updateScore(side: 'a' | 'b', change: number) {
    this.scoreUpdate.emit({ id: this.match.id, side, change });
  }

  onDelete() {
    this.toastService.confirm('Supprimer définitivement ce match ?').then((confirmed) => {
      if (confirmed) {
        this.delete.emit(this.match.id);
      }
    });
  }
}
