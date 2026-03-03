import { CommonModule, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Adherent } from '../../core/models/enroulement.model';
import { EnroulementService } from '../../core/services/enroulements';

@Component({
  selector: 'app-enrolements',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  templateUrl: './enrolements.component.html',
})
export class EnrolementsComponent implements OnInit, OnDestroy {

  adherents: Adherent[] = [];
  filteredAdherents: Adherent[] = [];
  loading = true;

  constructor(private enroulementService: EnroulementService) { }

  ngOnInit(): void {
    this.enroulementService.getAdherents().subscribe({
      next: (response) => {
        this.adherents = response.data;
        this.filteredAdherents = [...this.adherents];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching adherents:', error);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void { }

  filters = {
    nom: '',
    region: '',
    regime: ''
  };

  applyFilters() {
    this.filteredAdherents = this.adherents.filter(a => {
      const matchNom = !this.filters.nom ||
        `${a.prenoms} ${a.nom}`.toLowerCase().includes(this.filters.nom.toLowerCase());
      const matchRegion = !this.filters.region ||
        a.region.toLowerCase().includes(this.filters.region.toLowerCase());
      const matchRegime = !this.filters.regime || a.regime === this.filters.regime;
      return matchNom && matchRegion && matchRegime;
    });
  }

  resetFilters() {
    this.filters = { nom: '', region: '', regime: '' };
    this.filteredAdherents = [...this.adherents];
  }
}
