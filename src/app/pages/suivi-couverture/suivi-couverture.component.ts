import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface CouvertureDept {
  departement: string;
  region: string;
  total: number;
  communes: number;
  taux: number;
}

@Component({
  selector: 'app-suivi-couverture',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, FormsModule, StatCardComponent],
  templateUrl: './suivi-couverture.component.html'
})
export class SuiviCouvertureComponent implements OnInit, OnDestroy {
  loading = true;
  deptStats: CouvertureDept[] = [];
  filteredStats: CouvertureDept[] = [];
  regions: string[] = [];
  selectedRegion = '';
  totalBenef = 0;
  totalCommunes = 0;
  totalDepts = 0;
  tauxMoyen = 0;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 50000)
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
    const deptMap = new Map<string, { region: string; total: number; communes: Set<string> }>();
    data.forEach(b => {
      if (!deptMap.has(b.departement)) deptMap.set(b.departement, { region: b.region, total: 0, communes: new Set() });
      const d = deptMap.get(b.departement)!;
      d.total++;
      d.communes.add(b.commune);
    });

    const maxTotal = Math.max(...Array.from(deptMap.values()).map(v => v.total), 1);
    this.deptStats = Array.from(deptMap.entries())
      .map(([dept, v]) => ({
        departement: dept,
        region: v.region,
        total: v.total,
        communes: v.communes.size,
        taux: Math.round((v.total / maxTotal) * 100)
      }))
      .sort((a, b) => b.total - a.total);

    this.filteredStats = [...this.deptStats];
    this.regions = [...new Set(this.deptStats.map(d => d.region))].sort();
    this.totalCommunes = new Set(data.map(b => b.commune)).size;
    this.totalDepts = this.deptStats.length;
    this.tauxMoyen = this.deptStats.length ? Math.round(this.deptStats.reduce((s, d) => s + d.taux, 0) / this.deptStats.length) : 0;
  }

  filterByRegion() {
    this.filteredStats = this.selectedRegion
      ? this.deptStats.filter(d => d.region === this.selectedRegion)
      : [...this.deptStats];
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f';
    const barEl = document.getElementById('chartCouverture') as HTMLCanvasElement;
    if (barEl) {
      this._charts.push(new Chart(barEl, {
        type: 'bar',
        data: {
          labels: this.deptStats.map(d => d.departement),
          datasets: [{ label: 'Bénéficiaires', data: this.deptStats.map(d => d.total), backgroundColor: G }]
        },
        options: {
          responsive: true, maintainAspectRatio: true, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } }
        }
      }));
    }
  }
}
