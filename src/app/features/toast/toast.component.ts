import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container fixed top-5 right-5 z-[100] flex flex-col gap-3">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast shadow-2xl p-4 rounded-2xl min-w-[280px] animate-in slide-in-from-right duration-300"
             [ngClass]="{
               'bg-white border-l-4 border-indigo-600': toast.type === 'confirm',
               'bg-emerald-600 text-white': toast.type === 'success',
               'bg-red-600 text-white': toast.type === 'error'
             }">

          <div class="flex justify-between items-start gap-4">
            <p class="text-xs  font-bold leading-tight">{{ toast.message }}</p>

            @if (toast.type !== 'confirm') {
              <button (click)="toastService.remove(toast.id)" class="opacity-50 hover:opacity-100">×</button>
            }
          </div>

          @if (toast.type === 'confirm') {
            <div class="flex gap-2 mt-4">
              <button
                (click)="toastService.remove(toast.id, true)"
                class="flex-1 bg-indigo-600 text-white py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Confirmer
              </button>
              <button
                (click)="toastService.remove(toast.id, false)"
                class="flex-1 bg-gray-100 text-gray-500 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Annuler
              </button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
