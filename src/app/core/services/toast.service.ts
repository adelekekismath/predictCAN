import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Signal contenant la liste des toasts actifs
  toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info') {
    const id = Date.now();
    const newToast = { id, message, type };

    // Ajoute le toast au début du tableau
    this.toasts.update(current => [newToast, ...current]);

    // Disparition automatique après 3 secondes
    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
