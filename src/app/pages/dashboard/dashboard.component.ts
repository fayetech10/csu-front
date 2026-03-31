import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { BeneficiaireStore } from '../../core/services/beneficiaire-store.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatsDashboard, StatsDept, StatsCommune, Beneficiaire, PageResult } from '../../core/models/beneficiaire.model';
import { GlobalFilterService } from '../../core/services/global-filter.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, DecimalPipe, FormsModule, StatCardComponent],
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

  selectedYear: number | null = null;
  private _allData: Beneficiaire[] = [];

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  constructor(
    private svc: BeneficiaireService,
    private store: BeneficiaireStore,
    private filterService: GlobalFilterService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.store.getBeneficiaires()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (data: Beneficiaire[]) => {
          this._allData = data;
          this.filterService.selectedYear$
            .pipe(takeUntil(this._destroy$))
            .subscribe(year => {
              this.selectedYear = year;
              this._updateDashboard();
            });
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement bénéficiaires dashboard:', err);
          this.loading = false;
        }
      });
  }


  private _updateDashboard() {
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

    this.stats = this._computeDashboardStats(filtered);
    this.depts = this._computeDeptStats(filtered);
    this.communes = this._computeCommuneStats(filtered);
    this.filteredCommunes = [...this.communes];

    setTimeout(() => this._initCharts(filtered), 0);
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

  importExcel() {
    const fileInput = document.getElementById('excelImport') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.loading = true;
      this.svc.importBeneficiaires(file).subscribe({
        next: () => {
          alert('Importation des bénéficiaires réussie !');
          this.store.refresh(); // Invalide le cache centralisé
          this.loading = false;
        },
        error: (err) => {
          console.error('Import error:', err);
          alert('Erreur lors de l\'importation.');
          this.loading = false;
        }
      });
    }
  }

  pct(val: number) {
    const max = this.filteredCommunes[0]?.total || 1;
    return Math.round((val / max) * 100);
  }

  getAge(dateNaissance: string): number | string {
    if (!dateNaissance) return '—';
    const parts = dateNaissance.split('/');
    if (parts.length === 3) {
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

  /** CALCUL DES STATS */
  private _computeDeptStats(data: Beneficiaire[]): StatsDept[] {
    const map = new Map<string, StatsDept>();
    data.forEach(b => {
      const dept = b.departement || 'Inconnu';
      if (!map.has(dept)) map.set(dept, { departement: dept, total: 0, hommes: 0, femmes: 0 });
      const d = map.get(dept)!;
      d.total++;
      if (b.sexe === 'Homme' || b.sexe === 'Masculin') d.hommes++; else d.femmes++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private _computeCommuneStats(data: Beneficiaire[]): StatsCommune[] {
    const map = new Map<string, StatsCommune>();
    data.forEach(b => {
      const com = b.commune || 'Inconnu';
      const dept = b.departement || 'Inconnu';
      const key = com + '|' + dept;
      if (!map.has(key)) map.set(key, { commune: com, departement: dept, region: b.region, total: 0, hommes: 0, femmes: 0 });
      const c = map.get(key)!;
      c.total++;
      if (b.sexe === 'Homme' || b.sexe === 'Masculin') c.hommes++; else c.femmes++;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private _computeDashboardStats(data: Beneficiaire[]): StatsDashboard {
    const total = data.length;
    const hommes = data.filter(b => b.sexe === 'Homme' || b.sexe === 'Masculin').length;
    const femmes = total - hommes;
    const communesCouvertes = new Set(data.map(b => b.commune).filter(Boolean)).size;
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
    // Graphique Communes (Full Width Optimized)
    mk('chartCom', {
      type: 'bar',
      data: {
        labels: this.communes.map(c => c.commune),
        datasets: [
          { label: 'Hommes', data: this.communes.map(c => c.hommes), backgroundColor: G, borderRadius: 4 },
          { label: 'Femmes', data: this.communes.map(c => c.femmes), backgroundColor: R, borderRadius: 4 }
        ]
      },
      options: {
        ...base,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,.04)' }
          }
        },
        plugins: {
          ...base.plugins,
          legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true } }
        }
      }
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
    const typeCounts = new Map<string, number>();
    data.forEach(b => {
      const t = b.typeBenef && b.typeBenef.trim() ? b.typeBenef : 'Inconnu';
      typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    });
    const typeLabels = Array.from(typeCounts.keys());
    const typeData = typeLabels.map(l => typeCounts.get(l)!);
    const dynamicColors = [G, '#f39c12', B, '#e74c3c', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#2ecc71', '#bdc3c7'];
    
    const Y = '#f39c12';
    mk('chartType', {
      type: 'pie',
      data: {
        labels: typeLabels,
        datasets: [{ data: typeData, backgroundColor: dynamicColors }]
      },
      options: base
    });

    // QUALITE BENEFCIAIRE (Adherent vs Personne a charge)
    const adherents = data.filter(b => b.beneficiaire === 'Adhérent').length;
    const aCharge = data.length - adherents;
    mk('chartQualite', {
      type: 'doughnut',
      data: {
        labels: ['Adhérents', 'Personnes à charge'],
        datasets: [{ data: [adherents, aCharge], backgroundColor: [G, Y] }]
      },
      options: { ...base, cutout: '70%' }
    });

    // SITUATION MATRIMONIALE VS SEXE
    const sitMap = new Map<string, { hommes: number; femmes: number }>();
    data.forEach(b => {
      const s = b.situationM || 'Non précisé';
      if (!sitMap.has(s)) sitMap.set(s, { hommes: 0, femmes: 0 });
      const entry = sitMap.get(s)!;
      if (b.sexe === 'Homme' || b.sexe === 'Masculin') entry.hommes++; else entry.femmes++;
    });
    const sitLabels = Array.from(sitMap.keys());
    mk('chartSitMatSexe', {
      type: 'bar',
      data: {
        labels: sitLabels,
        datasets: [
          { label: 'Hommes', data: sitLabels.map(l => sitMap.get(l)!.hommes), backgroundColor: B },
          { label: 'Femmes', data: sitLabels.map(l => sitMap.get(l)!.femmes), backgroundColor: '#9b59b6' }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }, y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true } } }
    });

    // REGION VS AGE
    const regionsName = Array.from(new Set(data.map(b => b.region)));
    const ageRegions = regionsName.map(r => {
      const inRegion = data.filter(b => b.region === r);
      let jeunes = 0, actifs = 0, seniors = 0;
      inRegion.forEach(b => {
        const a = this.getAge(b.dateNaissance);
        const age = typeof a === 'number' ? a : 0;
        if (age < 18) jeunes++;
        else if (age < 60) actifs++;
        else seniors++;
      });
      return { region: r, jeunes, actifs, seniors };
    });
    mk('chartAgeRegion', {
      type: 'bar',
      data: {
        labels: ageRegions.map(r => r.region),
        datasets: [
          { label: '0-17 ans', data: ageRegions.map(r => r.jeunes), backgroundColor: '#f1c40f' },
          { label: '18-59 ans', data: ageRegions.map(r => r.actifs), backgroundColor: '#1abc9c' },
          { label: '60+ ans', data: ageRegions.map(r => r.seniors), backgroundColor: '#34495e' }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }, y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true } } }
    });

    // DEPARTEMENT VS AGE
    const deptsName = Array.from(new Set(data.filter(b => b.departement).map(b => b.departement)));
    const ageDepts = deptsName.map(d => {
      const inDept = data.filter(b => b.departement === d);
      let jeunes = 0, actifs = 0, seniors = 0;
      inDept.forEach(b => {
        const a = this.getAge(b.dateNaissance);
        const age = typeof a === 'number' ? a : 0;
        if (age < 18) jeunes++;
        else if (age < 60) actifs++;
        else seniors++;
      });
      return { dept: d, jeunes, actifs, seniors };
    });
    mk('chartAgeDept', {
      type: 'bar',
      data: {
        labels: ageDepts.map(d => d.dept),
        datasets: [
          { label: '0-17 ans', data: ageDepts.map(d => d.jeunes), backgroundColor: '#f1c40f' },
          { label: '18-59 ans', data: ageDepts.map(d => d.actifs), backgroundColor: '#1abc9c' },
          { label: '60+ ans', data: ageDepts.map(d => d.seniors), backgroundColor: '#34495e' }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }, y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true } } }
    });

    // COMMUNE VS AGE (Top 30 communes)
    const topCommunes = this.communes.slice(0, 30).map(c => c.commune);
    const ageCommunes = topCommunes.map(c => {
      const inCom = data.filter(b => b.commune === c);
      let jeunes = 0, actifs = 0, seniors = 0;
      inCom.forEach(b => {
        const a = this.getAge(b.dateNaissance);
        const age = typeof a === 'number' ? a : 0;
        if (age < 18) jeunes++;
        else if (age < 60) actifs++;
        else seniors++;
      });
      return { commune: c, jeunes, actifs, seniors };
    });
    mk('chartAgeCommune', {
      type: 'bar',
      data: {
        labels: ageCommunes.map(c => c.commune),
        datasets: [
          { label: '0-17 ans', data: ageCommunes.map(c => c.jeunes), backgroundColor: '#f1c40f' },
          { label: '18-59 ans', data: ageCommunes.map(c => c.actifs), backgroundColor: '#1abc9c' },
          { label: '60+ ans', data: ageCommunes.map(c => c.seniors), backgroundColor: '#34495e' }
        ]
      },
      options: { ...base, scales: { x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }, y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true } } }
    });

    // TYPE BENEF VS REGION
    const typeRegions = regionsName.map(r => {
      const classiques = data.filter(b => b.region === r && b.typeBenef === 'Classique').length;
      const daras = data.filter(b => b.region === r && b.typeBenef === 'NDONGO DAARA').length;
      return { region: r, classiques, daras };
    });
    mk('chartTypeRegion', {
      type: 'bar',
      data: {
        labels: typeRegions.map(r => r.region),
        datasets: [
          { label: 'Classique', data: typeRegions.map(r => r.classiques), backgroundColor: G },
          { label: 'Ndongo Dara', data: typeRegions.map(r => r.daras), backgroundColor: '#e67e22' }
        ]
      },
      options: { ...base, indexAxis: 'y', scales: { x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }, y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true } } }
    });
  }
}