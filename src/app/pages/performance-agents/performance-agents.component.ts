import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface AgentStat {
  agent: string;
  total: number;
  hommes: number;
  femmes: number;
  communes: number;
  pct: number;
}

@Component({
  selector: 'app-performance-agents',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe, StatCardComponent],
  templateUrl: './performance-agents.component.html'
})
export class PerformanceAgentsComponent implements OnInit, OnDestroy {
  loading = true;
  agents: AgentStat[] = [];
  totalBenef = 0;
  totalAgents = 0;
  moyenneParAgent = 0;
  topAgent = '';

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

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
    this.totalBenef = data.length;
    const map = new Map<string, { total: number; hommes: number; femmes: number; communes: Set<string> }>();

    data.forEach(b => {
      const a = b.agent_collect || 'Inconnu';
      if (!map.has(a)) map.set(a, { total: 0, hommes: 0, femmes: 0, communes: new Set() });
      const s = map.get(a)!;
      s.total++;
      if (b.sexe === 'Homme') s.hommes++; else s.femmes++;
      s.communes.add(b.commune);
    });

    this.agents = Array.from(map.entries())
      .map(([agent, s]) => ({
        agent,
        total: s.total,
        hommes: s.hommes,
        femmes: s.femmes,
        communes: s.communes.size,
        pct: Math.round((s.total / this.totalBenef) * 100)
      }))
      .sort((a, b) => b.total - a.total);

    this.totalAgents = this.agents.length;
    this.moyenneParAgent = this.totalAgents ? Math.round(this.totalBenef / this.totalAgents) : 0;
    this.topAgent = this.agents[0]?.agent || '—';
  }

  private _initCharts() {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const top10 = this.agents.slice(0, 10);
    const G = '#00853f', R = '#e31b23';

    const el = document.getElementById('chartAgents') as HTMLCanvasElement;
    if (el) {
      this._charts.push(new Chart(el, {
        type: 'bar',
        data: {
          labels: top10.map(a => a.agent),
          datasets: [
            { label: 'Hommes', data: top10.map(a => a.hommes), backgroundColor: G },
            { label: 'Femmes', data: top10.map(a => a.femmes), backgroundColor: R }
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

  medalClass(i: number): string {
    if (i === 0) return 'bg-yellow-400 text-white';
    if (i === 1) return 'bg-gray-300 text-white';
    if (i === 2) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-500';
  }

  medalIcon(i: number): string {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return (i + 1).toString();
  }
}
