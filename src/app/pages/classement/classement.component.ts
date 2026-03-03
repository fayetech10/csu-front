import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

interface RankItem {
  label: string;
  total: number;
  hommes: number;
  femmes: number;
  pct: number;
}

@Component({
  selector: 'app-classement',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe, FormsModule, StatCardComponent],
  templateUrl: './classement.component.html'
})
export class ClassementComponent implements OnInit, OnDestroy {
  loading = true;
  activeTab: 'agents' | 'communes' | 'regions' = 'agents';
  agentsRank: RankItem[] = [];
  communesRank: RankItem[] = [];
  regionsRank: RankItem[] = [];
  totalBenef = 0;

  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 1000)
      .pipe(takeUntil(this._destroy$))
      .subscribe(res => {
        this.totalBenef = res.data.length;
        this._computeRankings(res.data);
        this.loading = false;
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _computeRankings(data: Beneficiaire[]) {
    // Agents
    const agents = new Map<string, { total: number; hommes: number; femmes: number }>();
    data.forEach(b => {
      const a = b.agent_collect || 'Inconnu';
      if (!agents.has(a)) agents.set(a, { total: 0, hommes: 0, femmes: 0 });
      const s = agents.get(a)!;
      s.total++;
      if (b.sexe === 'Homme') s.hommes++; else s.femmes++;
    });
    this.agentsRank = this._toRank(agents);

    // Communes
    const communes = new Map<string, { total: number; hommes: number; femmes: number }>();
    data.forEach(b => {
      if (!communes.has(b.commune)) communes.set(b.commune, { total: 0, hommes: 0, femmes: 0 });
      const s = communes.get(b.commune)!;
      s.total++;
      if (b.sexe === 'Homme') s.hommes++; else s.femmes++;
    });
    this.communesRank = this._toRank(communes);

    // Régions
    const regions = new Map<string, { total: number; hommes: number; femmes: number }>();
    data.forEach(b => {
      if (!regions.has(b.region)) regions.set(b.region, { total: 0, hommes: 0, femmes: 0 });
      const s = regions.get(b.region)!;
      s.total++;
      if (b.sexe === 'Homme') s.hommes++; else s.femmes++;
    });
    this.regionsRank = this._toRank(regions);
  }

  private _toRank(map: Map<string, { total: number; hommes: number; femmes: number }>): RankItem[] {
    return Array.from(map.entries())
      .map(([label, s]) => ({
        label, ...s,
        pct: this.totalBenef ? Math.round((s.total / this.totalBenef) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  get currentRank(): RankItem[] {
    if (this.activeTab === 'agents') return this.agentsRank;
    if (this.activeTab === 'communes') return this.communesRank;
    return this.regionsRank;
  }

  get podium(): RankItem[] {
    return this.currentRank.slice(0, 3);
  }

  get rest(): RankItem[] {
    return this.currentRank.slice(3);
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
    return '';
  }

  tabLabel(tab: string): string {
    const m: Record<string, string> = { agents: 'Agents', communes: 'Communes', regions: 'Régions' };
    return m[tab] || tab;
  }

  tabIcon(tab: string): string {
    const m: Record<string, string> = { agents: '👤', communes: '🏘️', regions: '📍' };
    return m[tab] || '';
  }
}
