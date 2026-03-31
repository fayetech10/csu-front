import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireStore } from '../../core/services/beneficiaire-store.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface TrancheStat {
  label: string;
  min: number;
  max: number;
  total: number;
  hommes: number;
  femmes: number;
  pct: number;
}

@Component({
  selector: 'app-tranche-age',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, StatCardComponent],
  templateUrl: './tranche-age.component.html'
})
export class TrancheAgeComponent implements OnInit, OnDestroy {
  loading = true;
  tranches: TrancheStat[] = [];
  total = 0;
  ageMoyen = 0;
  ageMin = 0;
  ageMax = 0;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  private readonly TRANCHES = [
    { label: '0 – 5 ans', min: 0, max: 5 },
    { label: '6 – 17 ans', min: 6, max: 17 },
    { label: '18 – 35 ans', min: 18, max: 35 },
    { label: '36 – 59 ans', min: 36, max: 59 },
    { label: '60+ ans', min: 60, max: 200 }
  ];

  constructor(private store: BeneficiaireStore) { }

  ngOnInit() {
    this.store.getBeneficiaires()
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.total = data.length;
        this._computeStats(data);
        setTimeout(() => this._initCharts(), 0);
        this.loading = false;
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
    this._charts.forEach(c => c.destroy());
  }

  private _computeStats(data: Beneficiaire[]) {
    const ages = data.map(b => {
      const a = this.getAge(b.dateNaissance);
      return typeof a === 'number' ? a : 0;
    });
    this.ageMoyen = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    this.ageMin = ages.length ? Math.min(...ages) : 0;
    this.ageMax = ages.length ? Math.max(...ages) : 0;

    this.tranches = this.TRANCHES.map(t => {
      const inRange = data.filter(b => {
        const a = this.getAge(b.dateNaissance);
        const age = typeof a === 'number' ? a : 0;
        return age >= t.min && age <= t.max;
      });
      return {
        ...t,
        total: inRange.length,
        hommes: inRange.filter(b => b.sexe === 'Homme' || b.sexe === 'Masculin').length,
        femmes: inRange.filter(b => b.sexe !== 'Homme' && b.sexe !== 'Masculin').length,
        pct: this.total ? Math.round((inRange.length / this.total) * 100) : 0
      };
    });
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f', R = '#e31b23', B = '#3498db';
    const colors = [G, B, '#f39c12', '#9b59b6', R];

    // Bar chart
    const barEl = document.getElementById('chartAgeBar') as HTMLCanvasElement;
    if (barEl) {
      this._charts.push(new Chart(barEl, {
        type: 'bar',
        data: {
          labels: this.tranches.map(t => t.label),
          datasets: [
            { label: 'Hommes', data: this.tranches.map(t => t.hommes), backgroundColor: G },
            { label: 'Femmes', data: this.tranches.map(t => t.femmes), backgroundColor: R }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } },
          scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } }
        }
      }));
    }

    // Doughnut
    const doughEl = document.getElementById('chartAgeDoughnut') as HTMLCanvasElement;
    if (doughEl) {
      this._charts.push(new Chart(doughEl, {
        type: 'doughnut',
        data: {
          labels: this.tranches.map(t => t.label),
          datasets: [{ data: this.tranches.map(t => t.total), backgroundColor: colors }]
        },
        options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' }, padding: 12 } } } }
      }));
    }
  }

  getAge(dateNaissance: string): number | string {
    if (!dateNaissance) return '—';
    const parts = dateNaissance.split('/');
    if (parts.length === 3) {
      // Assuming MM/DD/YY or similar. If YYYY format, fallback to string parsing. Let's parse standard Date 
      const bd = new Date(dateNaissance);
      if (!isNaN(bd.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
          age--;
        }
        return age;
      }
    } else {
      const bd = new Date(dateNaissance);
      if (!isNaN(bd.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
          age--;
        }
        return age;
      }
    }
    return '—';
  }

  pctBar(val: number) {
    return Math.round((val / (this.tranches[0]?.total || 1)) * 100);
  }
}
