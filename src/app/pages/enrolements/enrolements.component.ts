import { CommonModule, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Adherent } from 'src/app/core/models/enroulement.model';
import { EnroulementService } from 'src/app/core/services/enroulements';

@Component({
  selector: 'app-enrolements',
  standalone: true,
  imports: [CommonModule, NgIf],
  templateUrl: './enrolements.component.html',
})
export class EnrolementsComponent implements OnInit, OnDestroy {

    adherents: Adherent[] = [];
  loading = true;

  constructor(private enroulementService: EnroulementService) { }

  ngOnInit(): void {
    this.enroulementService.getAdherents().subscribe({
      next: (response) => {
        console.log('Adherents fetched successfully:', response);
        this.adherents = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching adherents:', error);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
  }

  filters = {
  nom: '',
  region: '',
  regime: ''
};

applyFilters() {
  // Implémentez la logique de filtrage (par exemple, émission d'un événement ou appel API)
  console.log('Filtres appliqués', this.filters);
}

}
