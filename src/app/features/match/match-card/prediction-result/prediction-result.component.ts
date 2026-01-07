import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictionRules } from '../../../../core/use-cases/predictions-rules';

@Component({
  selector: 'app-prediction-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prediction-result.component.html'
})
export class PredictionResultComponent {
  @Input({ required: true }) prono!: any;
  @Input({ required: true }) match!: any;

  protected readonly Math = Math;

  getPoints(): number {
    return PredictionRules.calculatePointsEarned(this.prono, this.match);
  }

  
}
