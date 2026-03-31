import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { BeneficiaireStore } from '../../core/services/beneficiaire-store.service';
import { Beneficiaire, BeneficiaireFilter, PageResult } from '../../core/models/beneficiaire.model';

@Component({
  selector: 'app-beneficiaires',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, NgClass],
  templateUrl: './beneficiaires.component.html'
})
export class BeneficiairesComponent implements OnInit, OnDestroy {
  result: PageResult<Beneficiaire> = { data: [], total: 0, page: 1, perPage: 15, totalPages: 0 };
  filter: BeneficiaireFilter = {};
  page = 1;
  perPage = 15;
  loading = false;
  showFilters = false;
  regions: string[] = [];
  depts: string[] = [];
  communes: string[] = [];

  private _search$ = new Subject<string>();
  private _destroy$ = new Subject<void>();

  constructor(private svc: BeneficiaireService, private store: BeneficiaireStore) { }

  ngOnInit() {
    this.svc.getRegions().subscribe(r => this.regions = r);
    this._search$.pipe(debounceTime(280), distinctUntilChanged(), takeUntil(this._destroy$)).subscribe(() => this.load(1));
    this.load(1);
  }

  ngOnDestroy() { this._destroy$.next(); this._destroy$.complete(); }

  onSearch(v: string) { this.filter.search = v; this._search$.next(v); }
  onFilter() { this.load(1); }

  onRegionChange() {
    this.filter.departement = ''; this.filter.commune = ''; this.depts = []; this.communes = [];
    if (this.filter.region) this.svc.getDepartements(this.filter.region).subscribe(d => this.depts = d);
    this.load(1);
  }
  onDeptChange() {
    this.filter.commune = ''; this.communes = [];
    if (this.filter.departement) this.svc.getCommunes(this.filter.departement).subscribe(c => this.communes = c);
    this.load(1);
  }

  reset() { this.filter = {}; this.depts = []; this.communes = []; this.load(1); }

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
          alert('Importation réussie !');
          this.store.refresh();
          this.load(1);
        },
        error: (err) => {
          console.error('Import error:', err);
          alert('Erreur lors de l\'importation.');
          this.loading = false;
        }
      });
    }
  }

  load(p: number) {
    this.loading = true;
    this.page = p;
    this.store.getBeneficiaires()
      .pipe(takeUntil(this._destroy$))
      .subscribe(data => {
        this.result = { data, total: data.length, page: this.page, perPage: this.perPage, totalPages: Math.ceil(data.length / this.perPage) };
        this.loading = false;
      });
  }

  get pages(): number[] {
    const cur = this.page, total = this.result.totalPages, r = 2;
    const arr: number[] = [];
    for (let i = Math.max(1, cur - r); i <= Math.min(total, cur + r); i++) arr.push(i);
    return arr;
  }
  get startIdx() { return (this.page - 1) * this.perPage + 1; }
  get endIdx() { return Math.min(this.page * this.perPage, this.result.total); }

  sexePill(s: string) { return s === 'Masculin' ? 'pill pill-blue' : 'pill pill-pink'; }
  typePill(t: string) { return t === 'Classique' ? 'pill pill-green' : 'pill pill-yellow'; }
  beneficiaireClass(b: Beneficiaire) { return b.beneficiaire === 'Adherent' ? 'bg-green-500 text-white' : 'bg-pink-50 text-pink-700'; }
  initials(b: Beneficiaire) { return (b.prenoms[0] + b.nom[0]).toUpperCase(); }
  avClass(b: Beneficiaire) { return (b.sexe === 'Homme' || b.sexe === 'Masculin') ? 'from-blue-400 to-blue-600' : 'from-sencsu-green to-sencsu-green-mid'; }

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

  hasActiveFilter() {
    return !!(this.filter.search || this.filter.sexe || this.filter.typeBenef || this.filter.region || this.filter.ageMin || this.filter.ageMax);
  }
}
