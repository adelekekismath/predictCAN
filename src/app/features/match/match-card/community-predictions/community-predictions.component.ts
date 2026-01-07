import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-community-predictions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './community-predictions.component.html',
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class CommunityPredictionsComponent {
  @Input({ required: true }) matchId!: string;
  @Input() predictions: any[] = [];

  // Événement pour demander au parent de charger les données si nécessaire
  @Output() viewOtherPredictions = new EventEmitter();

  isOpen = signal(false);

  toggle() {
    if (!this.isOpen()) {
      this.viewOtherPredictions.emit();
    }
    this.isOpen.update(v => !v);
  }
}
