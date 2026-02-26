import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatsDashboard, StatsDept, StatsCommune, Beneficiaire } from '../../core/models/beneficiaire.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule, StatCardComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

  stats: StatsDashboard | null = null;
  communes: StatsCommune[] = [];
  filteredCommunes: StatsCommune[] = [];
  depts: StatsDept[] = [];
  communesCount: StatsCommune[] = [];
  selectedDept = '';
  loading = true;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService) {}

  ngOnInit() {
    this.loading = true;
    this.svc.getBeneficiaires(0, 10000) // prend toutes les données
      .subscribe(res => {
        const data = res.data; // <-- tes Beneficiaires
        console.log('Beneficiaires chargés:', data);
        // Calcul des stats
        this.stats = this._computeDashboardStats(data);
        this.depts = this._computeDeptStats(data);
        this.communes = this._computeCommuneStats(data);
        this.filteredCommunes = [...this.communes];

        // Initialiser les graphiques
        setTimeout(() => this._initCharts(data), 0);

        this.loading = false;
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
    this._charts.forEach(c => c.destroy());
  }

  filterCommunes() {
    this.filteredCommunes = this.selectedDept
      ? this.communes.filter(c => c.departement === this.selectedDept)
      : this.communes;
  }

  pct(val: number) {
    const max = this.filteredCommunes[0]?.total || 1;
    return Math.round((val / max) * 100);
  }

  /** CALCUL DES STATS */
  private _computeDeptStats(data: Beneficiaire[]): StatsDept[] {
    const map = new Map<string, StatsDept>();
    data.forEach(b => {
      if (!map.has(b.departement)) map.set(b.departement, { departement: b.departement, total: 0, hommes: 0, femmes: 0 });
      const d = map.get(b.departement)!;
      d.total++;
      if (b.sexe === 'Homme') d.hommes++; else d.femmes++;
    });
    return Array.from(map.values());
  }

  private _computeCommuneStats(data: Beneficiaire[]): StatsCommune[] {
    const map = new Map<string, StatsCommune>();
    data.forEach(b => {
      const key = b.commune + '|' + b.departement;
      if (!map.has(key)) map.set(key, { commune: b.commune, departement: b.departement, region: b.region, total: 0, hommes: 0, femmes: 0 });
      const c = map.get(key)!;
      c.total++;
      if (b.sexe === 'Homme') c.hommes++; else c.femmes++;
    });
    return Array.from(map.values());
  }

  private _computeDashboardStats(data: Beneficiaire[]): StatsDashboard {
    const total = data.length;
    const hommes = data.filter(b => b.sexe === 'Homme').length;
    const femmes = total - hommes;
    const communesCouvertes = new Set(data.map(b => b.commune)).size;
    return { totalBeneficiaires: total, hommes, femmes, communesCouvertes };
  }

  /** INITIALISATION DES CHARTS */
  private _initCharts(data: Beneficiaire[]) {
    // Supprime anciens charts
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f', R = '#e31b23', B = '#3498db', GL = 'rgba(0,133,63,.08)';

    const base = { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } } };

    const mk = (id: string, cfg: any) => {
      const el = document.getElementById(id) as HTMLCanvasElement;
      if (el) this._charts.push(new Chart(el, cfg));
    };

    const depts = this.depts;
    const stats = this.stats!;

    // Graphique départements
    mk('chartDept', {
      type: 'bar',
      data: {
        labels: depts.map(d => d.departement),
        datasets: [
          { label: 'Hommes', data: depts.map(d => d.hommes), backgroundColor: G },
          { label: 'Femmes', data: depts.map(d => d.femmes), backgroundColor: R }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } }
    });
    // Graphique départements
    mk('chartCom', {
      type: 'bar',
      data: {
        labels: this.communes.map(c => c.commune),
        datasets: [
          { label: 'Hommes', data: this.communes.map(c => c.hommes), backgroundColor: G },
          { label: 'Femmes', data: this.communes.map(c => c.femmes), backgroundColor: R }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } }
    });

    // Graphique sexe global
    mk('chartSexe', {
      type: 'doughnut',
      data: {
        labels: ['Hommes', 'Femmes'],
        datasets: [{ data: [stats.hommes, stats.femmes], backgroundColor: [G, R] }]
      },
      options: { ...base, cutout: '65%' }
    });

  // chartType
  const types = [
    { type: 'Classique', count: data.filter(b => b.typeBenef === 'Classique').length },
    { type: 'Dara', count: data.filter(b => b.typeBenef === 'Dara').length }
  ];
  const Y = '#f39c12';
  mk('chartType', {
    type: 'pie',
    data: {
      labels: types.map(t => t.type),
      datasets: [{ data: types.map(t => t.count), backgroundColor: [G, Y] }]
    },
    options: base
  });

  // chartCarte
  const cartes = [
    { statut: 'Remise', count: data.filter(b => b.carteAssure === 'Remise').length },
    { statut: 'Non remise', count: data.filter(b => b.carteAssure !== 'Remise').length }
  ];
  mk('chartCarte', {
    type: 'doughnut',
    data: {
      labels: cartes.map(c => c.statut),
      datasets: [{ data: cartes.map(c => c.count), backgroundColor: [G, B] }]
    },
    options: { ...base, cutout: '60%' }
  });

  // chartMensuel
  const moisLabels = ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aout','Sep','Oct','Nov','Dec'];
  const mensuel = moisLabels.map((m, i) => ({
    mois: m,
    count: data.filter(b => new Date(b.dateCotisation).getMonth() === i).length
  }));
  mk('chartMensuel', {
    type: 'line',
    data: {
      labels: mensuel.map(m => m.mois),
      datasets: [{
        data: mensuel.map(m => m.count),
        borderColor: G,
        backgroundColor: GL,
        fill: true,
        tension: 0.4
      }]
    },
    options: { ...base, plugins: { legend: { display: false } } }
  });
  }
}