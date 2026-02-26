import { Component, Input } from '@angular/core';
import { NgClass, NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass, NgIf, DecimalPipe],
  template: `
    <div class="card p-5 relative overflow-hidden hover:-translate-y-0.5 transition-transform cursor-default">
      <div class="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-[0.06]"
           [ngClass]="blobClass"></div>
      <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4" [ngClass]="iconBg">
        {{ icon }}
      </div>
      <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{{ label }}</p>
      <p class="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{{ value | number }}</p>
      <div *ngIf="sub" class="mt-3 flex items-center gap-2">
        <span class="pill text-[11px]" [ngClass]="badgeCls">{{ trend }}</span>
        <span class="text-xs text-gray-400">{{ sub }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() icon = '';
  @Input() trend = '';
  @Input() sub = '';
  @Input() color: 'green' | 'yellow' | 'red' | 'blue' = 'green';

  get blobClass() {
    return { green: 'bg-sencsu-green', yellow: 'bg-yellow-400', red: 'bg-red-500', blue: 'bg-blue-500' }[this.color];
  }
  get iconBg() {
    return { green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50', blue: 'bg-blue-50' }[this.color];
  }
  get badgeCls() {
    return { green: 'pill-green', yellow: 'pill-yellow', red: 'pill-red', blue: 'pill-blue' }[this.color];
  }
}
