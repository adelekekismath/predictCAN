import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'confirm';
  resolve?: (value: boolean) => void; // Pour résoudre la promesse
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  // Toast classique
  show(message: string, type: 'success' | 'error' | 'info' | 'confirm' = 'success') {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);
    if (type !== 'confirm') {
      setTimeout(() => this.remove(id), 3000);
    }
  }

  // Toast de confirmation (Retourne une Promesse)
  confirm(message: string): Promise<boolean> {
    const id = Date.now();
    return new Promise((resolve) => {
      this.toasts.update(t => [...t, { id, message, type: 'confirm', resolve }]);
    });
  }

  remove(id: number, result?: boolean) {
    const toast = this.toasts().find(t => t.id === id);
    if (toast?.resolve) {
      toast.resolve(result ?? false); 
    }
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
