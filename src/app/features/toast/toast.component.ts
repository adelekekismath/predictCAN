import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type">
          {{ toast.message }}
          <button (click)="toastService.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  toastService = inject(ToastService);
}
