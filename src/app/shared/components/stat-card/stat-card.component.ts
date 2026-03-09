import { Component, Input, OnInit, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NgClass, NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass, NgIf, DecimalPipe],
  template: `
    <div class="card p-5 relative overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-default group">
      <!-- Decorative blob -->
      <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.08] transition-transform duration-500 group-hover:scale-125"
           [ngClass]="blobClass"></div>
      <!-- Icon -->
      <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-4 shadow-sm" [ngClass]="iconBg">
        <span class="material-symbols-outlined text-[22px]" [ngClass]="iconColor">{{ icon }}</span>
      </div>
      <!-- Label -->
      <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{{ label }}</p>
      <!-- Animated value -->
      <p class="text-3xl font-extrabold text-gray-900 tracking-tight leading-none count-up" #counterEl>
        {{ displayValue | number }}
      </p>
      <!-- Trend -->
      <div *ngIf="sub" class="mt-3 flex items-center gap-2">
        <span class="pill text-[11px]" [ngClass]="badgeCls">{{ trend }}</span>
        <span class="text-xs text-gray-400">{{ sub }}</span>
      </div>
    </div>
  `
})
export class StatCardComponent implements OnInit, OnChanges {
  @Input() label = '';
  @Input() value = 0;
  @Input() icon = '';
  @Input() trend = '';
  @Input() sub = '';
  @Input() color: 'green' | 'yellow' | 'red' | 'blue' = 'green';

  displayValue = 0;

  ngOnInit() {
    this.animateCount();
  }

  ngOnChanges() {
    this.animateCount();
  }

  private animateCount() {
    const target = this.value;
    const duration = 600;
    const start = performance.now();
    const from = this.displayValue;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      this.displayValue = Math.round(from + (target - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  get blobClass() {
    return { green: 'bg-sencsu-green', yellow: 'bg-yellow-400', red: 'bg-red-500', blue: 'bg-blue-500' }[this.color];
  }
  get iconBg() {
    return { green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50', blue: 'bg-blue-50' }[this.color];
  }
  get iconColor() {
    return { green: 'text-sencsu-green', yellow: 'text-yellow-600', red: 'text-red-500', blue: 'text-blue-500' }[this.color];
  }
  get badgeCls() {
    return { green: 'pill-green', yellow: 'pill-yellow', red: 'pill-red', blue: 'pill-blue' }[this.color];
  }
}
