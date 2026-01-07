import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Match } from '../../../../core/models/match';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-prediction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prediction-form.component.html'
})
export class PredictionFormComponent {
  @Input({ required: true }) match!: Match;
  @Output() addPrediction = new EventEmitter<{
    match: Match;
    scoreA: number | null;
    scoreB: number | null;
    proofUrl: File | undefined;
  }>();

  // État de visibilité
  showForm = signal(false);

  // État du formulaire
  mode = signal<'amateur' | 'expert'>('amateur');
  scoreA = signal<number | null>(0);
  scoreB = signal<number | null>(0);
  selectedFile = signal<File | undefined>(undefined);
  toastService = inject(ToastService);


  toggleForm() {
    this.showForm.set(true);
  }

  setMode(mode: 'amateur' | 'expert') {
    this.mode.set(mode);
  }

  cancel() {
    this.showForm.set(false);
    this.scoreA.set(null);
    this.scoreB.set(null);
  }

  submit() {
    this.addPrediction.emit({
      match: this.match,
      scoreA: this.scoreA(),
      scoreB: this.scoreB(),
      proofUrl: this.mode() === 'expert' && this.selectedFile() ? this.selectedFile() : undefined
    });

    this.scoreA.set(null);
    this.scoreB.set(null);
    this.selectedFile.set(undefined);
    this.showForm.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);
    }
  }

  removeFile() {
    this.selectedFile.set(undefined);
  }
}
