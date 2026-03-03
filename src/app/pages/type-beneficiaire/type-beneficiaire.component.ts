import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface TypeStat {
  type: string;
  total: number;
  hommes: number;
  femmes: number;
  pct: number;
}

interface DeptTypeStat {
  departement: string;
  classique: number;
  dara: number;
  total: number;
}

@Component({
  selector: 'app-type-beneficiaire',
  standalone: true,
  imports: [NgIf, NgFor, DecimalPipe, StatCardComponent],
  templateUrl: './type-beneficiaire.component.html'
})
export class TypeBeneficiaireComponent implements OnInit, OnDestroy {
  loading = true;
  types: TypeStat[] = [];
  deptStats: DeptTypeStat[] = [];
  total = 0;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 1000)
      .pipe(takeUntil(this._destroy$))
      .subscribe(res => {
        const data = res.data;
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
    const typeMap = new Map<string, { total: number; hommes: number; femmes: number }>();
    const deptMap = new Map<string, DeptTypeStat>();

    data.forEach(b => {
      const t = b.typeBenef || 'Non défini';
      if (!typeMap.has(t)) typeMap.set(t, { total: 0, hommes: 0, femmes: 0 });
      const ts = typeMap.get(t)!;
      ts.total++;
      if (b.sexe === 'Homme') ts.hommes++; else ts.femmes++;

      if (!deptMap.has(b.departement)) deptMap.set(b.departement, { departement: b.departement, classique: 0, dara: 0, total: 0 });
      const ds = deptMap.get(b.departement)!;
      ds.total++;
      if (t === 'Classique') ds.classique++; else ds.dara++;
    });

    this.types = Array.from(typeMap.entries()).map(([type, s]) => ({
      type, ...s, pct: Math.round((s.total / this.total) * 100)
    }));

    this.deptStats = Array.from(deptMap.values()).sort((a, b) => b.total - a.total);
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f', Y = '#f39c12', R = '#e31b23';

    // Pie chart
    const pieEl = document.getElementById('chartTypePie') as HTMLCanvasElement;
    if (pieEl) {
      this._charts.push(new Chart(pieEl, {
        type: 'pie',
        data: {
          labels: this.types.map(t => t.type),
          datasets: [{ data: this.types.map(t => t.total), backgroundColor: [G, Y, R, '#3498db'] }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } } }
      }));
    }

    // Bar chart par département
    const barEl = document.getElementById('chartTypeDept') as HTMLCanvasElement;
    if (barEl) {
      this._charts.push(new Chart(barEl, {
        type: 'bar',
        data: {
          labels: this.deptStats.map(d => d.departement),
          datasets: [
            { label: 'Classique', data: this.deptStats.map(d => d.classique), backgroundColor: G },
            { label: 'Dara', data: this.deptStats.map(d => d.dara), backgroundColor: Y }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } },
          scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } }
        }
      }));
    }
  }

  pctBar(val: number) {
    return Math.round((val / (this.deptStats[0]?.total || 1)) * 100);
  }
}
