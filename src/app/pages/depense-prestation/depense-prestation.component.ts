import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DepenseCategorie {
  categorie: string;
  montant: number;
  pct: number;
  icon: string;
}

interface DepenseMensuelle {
  mois: string;
  montant: number;
}

@Component({
  selector: 'app-depense-prestation',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, StatCardComponent],
  templateUrl: './depense-prestation.component.html'
})
export class DepensePrestationComponent implements OnInit, OnDestroy {
  loading = true;
  totalDepenses = 0;
  moyenneParBenef = 0;
  totalBenef = 0;
  categories: DepenseCategorie[] = [];
  mensuel: DepenseMensuelle[] = [];

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 1000)
      .pipe(takeUntil(this._destroy$))
      .subscribe(res => {
        this.totalBenef = res.data.length;
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
    // Simulated data based on beneficiaries count — no real spending API
    const n = data.length || 1;
    this.categories = [
      { categorie: 'Consultation', montant: Math.round(n * 3500), pct: 0, icon: '🩺' },
      { categorie: 'Hospitalisation', montant: Math.round(n * 8200), pct: 0, icon: '🏥' },
      { categorie: 'Médicaments', montant: Math.round(n * 2800), pct: 0, icon: '💊' },
      { categorie: 'Maternité', montant: Math.round(n * 4500), pct: 0, icon: '🤰' },
      { categorie: 'Chirurgie', montant: Math.round(n * 6000), pct: 0, icon: '🔪' },
    ];
    this.totalDepenses = this.categories.reduce((s, c) => s + c.montant, 0);
    this.categories.forEach(c => c.pct = Math.round((c.montant / this.totalDepenses) * 100));
    this.moyenneParBenef = Math.round(this.totalDepenses / n);

    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const base = this.totalDepenses / 12;
    this.mensuel = moisLabels.map((m, i) => ({
      mois: m,
      montant: Math.round(base * (0.7 + Math.sin(i * 0.8) * 0.3 + Math.random() * 0.2))
    }));
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const colors = ['#00853f', '#3498db', '#f39c12', '#e31b23', '#9b59b6'];

    // Doughnut
    const doughEl = document.getElementById('chartDepenseCat') as HTMLCanvasElement;
    if (doughEl) {
      this._charts.push(new Chart(doughEl, {
        type: 'doughnut',
        data: {
          labels: this.categories.map(c => c.categorie),
          datasets: [{ data: this.categories.map(c => c.montant), backgroundColor: colors }]
        },
        options: { responsive: true, maintainAspectRatio: true, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' }, padding: 12 } } } }
      }));
    }

    // Line chart
    const lineEl = document.getElementById('chartDepenseMensuel') as HTMLCanvasElement;
    if (lineEl) {
      this._charts.push(new Chart(lineEl, {
        type: 'line',
        data: {
          labels: this.mensuel.map(m => m.mois),
          datasets: [{
            label: 'Dépenses (FCFA)',
            data: this.mensuel.map(m => m.montant),
            borderColor: '#00853f',
            backgroundColor: 'rgba(0,133,63,.08)',
            fill: true,
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } }
      }));
    }
  }

  formatMontant(val: number): string {
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + ' M';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + ' K';
    return val.toString();
  }
}
