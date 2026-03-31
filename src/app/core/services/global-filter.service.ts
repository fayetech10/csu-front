import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Beneficiaire } from '../models/beneficiaire.model';
import { BeneficiaireStore } from './beneficiaire-store.service';

@Injectable({ providedIn: 'root' })
export class GlobalFilterService {
  private _selectedYear = new BehaviorSubject<number | null>(null);
  selectedYear$ = this._selectedYear.asObservable();

  private _availableYears = new BehaviorSubject<number[]>([]);
  availableYears$ = this._availableYears.asObservable();

  private store = inject(BeneficiaireStore);

  constructor() {
    this._initYears();
  }

  private _initYears() {
    this.store.getBeneficiaires().subscribe(data => {
      const yearsSet = new Set<number>();
      data.forEach(b => {
        const dateStr = b.date || (b as any).dateEnregistrement;
        if (dateStr) {
          const parts = dateStr.split('/');
          const year = parts.length === 3 ? parseInt(parts[2]) : new Date(dateStr).getFullYear();
          if (!isNaN(year)) yearsSet.add(year);
        }
      });
      const sorted = Array.from(yearsSet).sort((a, b) => b - a);
      this._availableYears.next(sorted);
    });
  }

  setYear(year: number | null) {
    this._selectedYear.next(year);
  }

  get currentYear() {
    return this._selectedYear.value;
  }
}
