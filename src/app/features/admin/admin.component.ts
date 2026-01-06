import { Component, inject, signal } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { Prediction } from '../../core/models/predictions';

@Component({
  selector: 'app-admin',
  imports: [],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  adminService = inject(AdminService);
  pendingPredictions = signal<Prediction[]>([]);

  ngOnInit() {
    this.loadPendingPredictions();
  }

  loadPendingPredictions() {
    this.adminService.getPendingPredictions().subscribe(predictions => {
      this.pendingPredictions.set(predictions);
    });
  }

  handleStatus(predictionId: string, status: 'validated' | 'rejected') {
    if (status === 'validated') {
      this.validatePrediction(predictionId).subscribe(() => {
        this.loadPendingPredictions();
      });
    } else if (status === 'rejected') {
      this.rejectPrediction(predictionId).subscribe(() => {
        this.loadPendingPredictions();
      });
    }
  }

  validatePrediction(predictionId: string) {
    return this.adminService.updatePredictionStatus(predictionId, 'validated');
  }

  rejectPrediction(predictionId: string) {
    return this.adminService.updatePredictionStatus(predictionId, 'rejected');
  }

}
