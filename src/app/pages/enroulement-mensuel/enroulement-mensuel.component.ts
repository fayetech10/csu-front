import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface MoisStat {
  mois: string;
  count: number;
  cumul: number;
  variation: string;
}

@Component({
  selector: 'app-enroulement-mensuel',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, StatCardComponent],
  templateUrl: './enroulement-mensuel.component.html'
})
export class EnroulementMensuelComponent implements OnInit, OnDestroy {
  loading = true;
  mensuel: MoisStat[] = [];
  total = 0;
  moisMax = '';
  moisMaxCount = 0;
  moyenneMensuelle = 0;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  private readonly MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  constructor(private svc: BeneficiaireService) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 1000)
      .pipe(takeUntil(this._destroy$))
      .subscribe(res => {
        this._computeStats(res.data);
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
    this.total = data.length;
    const counts = this.MOIS.map((_, i) =>
      data.filter(b => {
        const d = new Date(b.dateNaissance);
        return !isNaN(d.getTime()) && d.getMonth() === i;
      }).length
    );

    let cumul = 0;
    this.mensuel = this.MOIS.map((m, i) => {
      cumul += counts[i];
      const prev = i > 0 ? counts[i - 1] : 0;
      const variation = prev > 0 ? ((counts[i] - prev) / prev * 100).toFixed(0) + '%' : '—';
      return { mois: m, count: counts[i], cumul, variation };
    });

    const maxEntry = this.mensuel.reduce((a, b) => b.count > a.count ? b : a, this.mensuel[0]);
    this.moisMax = maxEntry.mois;
    this.moisMaxCount = maxEntry.count;
    this.moyenneMensuelle = Math.round(this.total / 12);
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f', GL = 'rgba(0,133,63,.08)', B = '#3498db';

    // Line + Bar combo
    const el = document.getElementById('chartEnrolMensuel') as HTMLCanvasElement;
    if (el) {
      this._charts.push(new Chart(el, {
        type: 'bar',
        data: {
          labels: this.mensuel.map(m => m.mois),
          datasets: [
            { type: 'line' as const, label: 'Cumul', data: this.mensuel.map(m => m.cumul), borderColor: B, backgroundColor: 'transparent', yAxisID: 'y1', tension: 0.4, pointRadius: 3 },
            { label: 'Enrôlements', data: this.mensuel.map(m => m.count), backgroundColor: G, yAxisID: 'y' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } },
          scales: {
            x: { grid: { color: 'rgba(0,0,0,.04)' } },
            y: { position: 'left', grid: { color: 'rgba(0,0,0,.04)' } },
            y1: { position: 'right', grid: { display: false } }
          }
        }
      }));
    }

    // Area chart
    const areaEl = document.getElementById('chartEnrolCumul') as HTMLCanvasElement;
    if (areaEl) {
      this._charts.push(new Chart(areaEl, {
        type: 'line',
        data: {
          labels: this.mensuel.map(m => m.mois),
          datasets: [{
            label: 'Cumul',
            data: this.mensuel.map(m => m.cumul),
            borderColor: G,
            backgroundColor: GL,
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } }
      }));
    }
  }
}
