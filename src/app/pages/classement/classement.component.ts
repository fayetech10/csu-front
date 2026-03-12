import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { Beneficiaire, PageResult } from '../../core/models/beneficiaire.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { GlobalFilterService } from '../../core/services/global-filter.service';

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
  
  selectedYear: number | null = null;
  private _allData: Beneficiaire[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    private svc: BeneficiaireService,
    private filterService: GlobalFilterService
  ) { }

  ngOnInit() {
    this.svc.getBeneficiaires(0, 50000)
      .pipe(takeUntil(this._destroy$))
      .subscribe((res: PageResult<Beneficiaire>) => {
        this._allData = res.data;
        this.filterService.selectedYear$
          .pipe(takeUntil(this._destroy$))
          .subscribe(year => {
            this.selectedYear = year;
            this._updateRankings();
          });
        this.loading = false;
      });
  }


  private _updateRankings() {
    let filtered = this._allData;
    if (this.selectedYear) {
      filtered = this._allData.filter(b => {
        const dateStr = b.date || (b as any).dateEnregistrement;
        if (!dateStr) return false;
        const parts = dateStr.split('/');
        const year = parts.length === 3 ? parseInt(parts[2]) : new Date(dateStr).getFullYear();
        return year === this.selectedYear;
      });
    }
    this.totalBenef = filtered.length;
    this._computeRankings(filtered);
  }


  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _computeRankings(data: Beneficiaire[]) {
    // Agents
    const agents = new Map<string, { total: number; hommes: number; femmes: number }>();
    data.forEach(b => {
      const a = b.agentCollect || 'Inconnu';
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
    if (i === 0) return 'workspace_premium';
    if (i === 1) return 'military_tech';
    if (i === 2) return 'military_tech';
    return '';
  }

  tabLabel(tab: string): string {
    const m: Record<string, string> = { agents: 'Agents', communes: 'Communes', regions: 'Régions' };
    return m[tab] || tab;
  }

  tabIcon(tab: string): string {
    const m: Record<string, string> = { agents: 'person', communes: 'home_work', regions: 'location_on' };
    return m[tab] || '';
  }
}
