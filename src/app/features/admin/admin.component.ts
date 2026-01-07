import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { Prediction } from '../../core/models/predictions';
import { PredictionRules } from '../../core/use-cases/predictions-rules';

interface MatchGroup {
  match: any;
  predictions: Prediction[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);

  predictions = signal<Prediction[]>([]);

  groupedPredictions = computed(() => {
    const groups: { [key: string]: MatchGroup } = {};

    this.predictions().forEach(p => {
      const matchId = p.match_id;
      if (!groups[matchId]) {
        groups[matchId] = {
          match: p.match, // Contient score_a, score_b, status, etc.
          predictions: []
        };
      }
      groups[matchId].predictions.push(p);
    });

    return Object.values(groups);
  });

  ngOnInit() {
    this.loadAllPredictions();
  }

  loadAllPredictions() {
    // Note: Assure-toi que ton service récupère TOUTES les prédictions avec les jointures
    this.adminService.getPendingPredictions().subscribe(data => {
      this.predictions.set(data);
    });
  }

  handleStatus(predictionId: string, status: 'validated' | 'rejected') {
    this.adminService.updatePredictionStatus(predictionId, status).subscribe(() => {
      this.loadAllPredictions(); // Rafraîchir la liste
    });
  }

  getPointsEarned(prediction: Prediction, match: any): number {
    return PredictionRules.calculatePointsEarned(prediction, match);
  }


}
