import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex-1 space-y-2 text-center">
      <div class="text-xs font-black text-gray-500 uppercase tracking-tighter">{{ name }}</div>
      <div class="text-4xl font-black text-gray-900">{{ score }}</div>

      @if (isAdmin) {
        <div class="flex justify-center gap-1 mt-2">
          <button (click)="change.emit(side,1)" class="p-1 px-3 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-600 transition-colors">+</button>
          <button (click)="change.emit(side,-1)" class="p-1 px-3 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-600 transition-colors">-</button>
        </div>
      }
    </div>
  `,
})
export class TeamDisplayComponent {
  @Input({ required: true }) name!: string;
  @Input({ required: true }) score!: number;
  @Input() isAdmin = false;
  @Input() side = "";
  @Output() change = new EventEmitter<'a' | 'b',number>();
}
