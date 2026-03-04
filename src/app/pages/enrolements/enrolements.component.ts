import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Adherent } from '../../core/models/enroulement.model';
import { EnroulementService, PhotoMetadata } from '../../core/services/enroulements';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-enrolements',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, FormsModule, ReactiveFormsModule, DecimalPipe, StatCardComponent],
  templateUrl: './enrolements.component.html',
})
export class EnrolementsComponent implements OnInit, OnDestroy {

  adherents: Adherent[] = [];
  filteredAdherents: Adherent[] = [];
  loading = true;

  // Photo management state
  photos: PhotoMetadata[] = [];
  loadingPhotos = true;
  showPhotoModal = false;
  showGalleryModal = false;
  selectedPhoto: PhotoMetadata | null = null;
  downloadingPhotos = false;
  selectedPhotoType: string = 'all';

  // Modal state
  selectedAdherent: Adherent | null = null;
  showModal = false;
  showAddModal = false;
  isEditing = false;
  addForm!: FormGroup;

  // Pagination state
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  // Stats
  totalEnroles = 0;
  montantTotal = 0;
  regimeContributif = 0;
  regimeCMUG = 0;

  private _charts: Chart[] = [];
  private _destroy$ = new Subject<void>();

  filters = {
    nom: '',
    region: '',
    regime: ''
  };

  exportDates = {
    start: '',
    end: ''
  };

  exporting = false;

  constructor(
    private enroulementService: EnroulementService,
    private fb: FormBuilder
  ) {
    this._initAddForm();
  }

  private _initAddForm() {
    this.addForm = this.fb.group({
      prenoms: ['', Validators.required],
      nom: ['', Validators.required],
      sexe: ['Homme', Validators.required],
      regime: ['CONTRIBUTIF', Validators.required],
      typeBenef: ['Adhérent', Validators.required],
      region: ['Dakar', Validators.required],
      departement: ['Dakar', Validators.required],
      commune: ['', Validators.required],
      whatsapp: ['', [Validators.required, Validators.pattern(/^[0-9+]{7,15}$/)]],
      adresse: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      numeroCNi: ['', Validators.required],
      photo: [''],
      montantTotal: [0, [Validators.required, Validators.min(0)]],
      personnesCharge: this.fb.array([])
    });
  }

  get personnesChargeArray() {
    return this.addForm.get('personnesCharge') as FormArray;
  }

  addPersonneCharge() {
    const pcForm = this.fb.group({
      prenoms: ['', Validators.required],
      nom: ['', Validators.required],
      sexe: ['Homme', Validators.required],
      dateNaissance: ['', Validators.required],
      lieuNaissance: ['', Validators.required],
      adresse: ['', Validators.required],
      whatsapp: [''],
      lienParent: ['', Validators.required],
      situationM: ['Célibataire', Validators.required],
      numeroCNi: [''],
      numeroExtrait: [''],
      photo: [''],
      photoRecto: [''],
      photoVerso: ['']
    });
    this.personnesChargeArray.push(pcForm);
  }

  removePersonneCharge(index: number) {
    this.personnesChargeArray.removeAt(index);
  }

  openAddModal() {
    this._initAddForm();
    this.isEditing = false;
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeAddModal() {
    this.showAddModal = false;
    document.body.style.overflow = 'auto';
  }

  submitForm() {
    if (this.addForm.valid) {
      const formData = this.addForm.value;

      if (this.isEditing && this.selectedAdherent) {
        this.enroulementService.updateAdherent(this.selectedAdherent.id, formData)
          .pipe(takeUntil(this._destroy$))
          .subscribe({
            next: () => {
              const index = this.adherents.findIndex(a => a.id === this.selectedAdherent!.id);
              if (index !== -1) {
                this.adherents[index] = { ...this.selectedAdherent, ...formData };
                this.applyFilters();
              }
              this.closeAddModal();
              alert('Bénéficiaire mis à jour avec succès !');
            },
            error: (err) => {
              console.error('Update error:', err);
              alert('Erreur lors de la mise à jour.');
            }
          });
      } else {
        // Logique de création (on pourrait aussi appeler un service de création si dispo)
        const newAdherent: Adherent = {
          ...formData,
          id: Math.max(...this.adherents.map(a => a.id), 0) + 1,
          createdAt: new Date().toISOString()
        };

        this.adherents = [newAdherent, ...this.adherents];
        this.applyFilters();
        this._computeStats(this.adherents);
        this.closeAddModal();
        alert('Bénéficiaire ajouté avec succès !');
      }
    } else {
      alert('Veuillez remplir correctement tous les champs obligatoires.');
      this.addForm.markAllAsTouched();
    }
  }

  ngOnInit(): void {
    this.enroulementService.getAdherents()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.adherents = response.data;
          this.filteredAdherents = [...this.adherents];
          this._updatePagination();
          this._computeStats(this.adherents);
          setTimeout(() => this._initCharts(this.adherents), 0);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error fetching adherents:', error);
          this.loading = false;
        }
      });
    this.loadPhotos();
  }

  loadPhotos() {
    this.loadingPhotos = true;
    this.enroulementService.getPhotos()
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (photos) => {
          this.photos = photos;
          this.loadingPhotos = false;
        },
        error: (err) => {
          console.error('Error loading photos:', err);
          this.loadingPhotos = false;
        }
      });
  }

  getPhotoUrl(filename: string): string {
    return this.enroulementService.getPhotoUrl(filename);
  }

  get filteredPhotosList(): PhotoMetadata[] {
    if (this.selectedPhotoType === 'all') return this.photos;
    return this.photos.filter(p => p.type === this.selectedPhotoType);
  }

  openPhotoModal(photo: PhotoMetadata) {
    this.selectedPhoto = photo;
    this.showPhotoModal = true;
    document.body.style.overflow = 'hidden';
  }

  zoomPhoto(filename: string) {
    this.selectedPhoto = { filename, type: '', size: 0, lastModified: 0 };
    this.showPhotoModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    this.selectedPhoto = null;
    if (!this.showGalleryModal) {
      document.body.style.overflow = 'auto';
    }
  }

  openGalleryModal() {
    this.showGalleryModal = true;
    document.body.style.overflow = 'hidden';
    this.loadPhotos();
  }

  closeGalleryModal() {
    this.showGalleryModal = false;
    document.body.style.overflow = 'auto';
  }

  downloadPhotosZip() {
    this.downloadingPhotos = true;
    this.enroulementService.downloadPhotosZip(this.exportDates.start, this.exportDates.end, this.selectedPhotoType)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = this.exportDates.start && this.exportDates.end
            ? `photos_${this.exportDates.start}_${this.exportDates.end}.zip`
            : `photos_complet_${new Date().toISOString().split('T')[0]}.zip`;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
          this.downloadingPhotos = false;
        },
        error: (err) => {
          console.error('ZIP Download error:', err);
          alert('Erreur lors du téléchargement des photos.');
          this.downloadingPhotos = false;
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._charts.forEach(c => c.destroy());
  }

  private _computeStats(data: Adherent[]) {
    this.totalEnroles = data.length;
    this.montantTotal = data.reduce((acc, current) => acc + current.montantTotal, 0);
    this.regimeContributif = data.filter(a => a.regime === 'CONTRIBUTIF').length;
    this.regimeCMUG = data.filter(a => a.regime === 'CMU-G').length;
  }

  private _initCharts(data: Adherent[]) {
    this._charts.forEach(c => c.destroy());
    this._charts = [];

    const G = '#00853f', R = '#e31b23', B = '#3498db', Y = '#f39c12';
    const base = { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } } };

    const mk = (id: string, cfg: any) => {
      const el = document.getElementById(id) as HTMLCanvasElement;
      if (el) this._charts.push(new Chart(el, cfg));
    };

    // Distribution par Régime
    const regimes = ['CONTRIBUTIF', 'CMU-G'];
    const regimeData = regimes.map(r => data.filter(a => a.regime === r).length);

    mk('chartRegime', {
      type: 'doughnut',
      data: {
        labels: regimes,
        datasets: [{ data: regimeData, backgroundColor: [G, B] }]
      },
      options: { ...base, cutout: '65%' }
    });

    // Distribution par Région (Top 5)
    const regionsMap = new Map<string, number>();
    data.forEach(a => regionsMap.set(a.region, (regionsMap.get(a.region) || 0) + 1));
    const sortedRegions = Array.from(regionsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    mk('chartRegion', {
      type: 'bar',
      data: {
        labels: sortedRegions.map(r => r[0]),
        datasets: [{ label: 'Adhérents', data: sortedRegions.map(r => r[1]), backgroundColor: G }]
      },
      options: { ...base, indexAxis: 'y', scales: { x: { grid: { color: 'rgba(0,0,0,.04)' } }, y: { grid: { color: 'rgba(0,0,0,.04)' } } } }
    });
  }

  applyFilters() {
    this.filteredAdherents = this.adherents.filter(a => {
      const matchNom = !this.filters.nom ||
        `${a.prenoms} ${a.nom}`.toLowerCase().includes(this.filters.nom.toLowerCase());
      const matchRegion = !this.filters.region ||
        a.region.toLowerCase().includes(this.filters.region.toLowerCase());
      const matchRegime = !this.filters.regime || a.regime === this.filters.regime;
      return matchNom && matchRegion && matchRegime;
    });
    this.currentPage = 1;
    this._updatePagination();
    this._initCharts(this.filteredAdherents);
  }

  resetFilters() {
    this.filters = { nom: '', region: '', regime: '' };
    this.filteredAdherents = [...this.adherents];
    this.currentPage = 1;
    this._updatePagination();
    this._initCharts(this.adherents);
  }

  private _updatePagination() {
    this.totalPages = Math.ceil(this.filteredAdherents.length / this.pageSize);
  }

  get paginatedAdherents(): Adherent[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAdherents.slice(start, start + this.pageSize);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  get pages(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewDetail(adherent: Adherent) {
    this.selectedAdherent = adherent;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    document.body.style.overflow = 'auto';
  }

  editAdherent(adherent: Adherent) {
    this.selectedAdherent = adherent;
    this.isEditing = true;

    // Patch main form
    this.addForm.patchValue({
      prenoms: adherent.prenoms,
      nom: adherent.nom,
      sexe: adherent.sexe,
      regime: adherent.regime,
      typeBenef: adherent.typeBenef || 'Adhérent',
      typeAdhesion: adherent.typeAdhesion || 'FAMALE',
      region: adherent.region,
      departement: adherent.departement,
      commune: adherent.commune,
      whatsapp: adherent.whatsapp,
      adresse: adherent.adresse,
      dateNaissance: adherent.dateNaissance,
      lieuNaissance: adherent.lieuNaissance,
      numeroCNi: adherent.numeroCNi,
      typePiece: adherent.typePiece,
      photo: adherent.photo,
      montantTotal: adherent.montantTotal
    });

    // Handle dependants
    this.personnesChargeArray.clear();
    if (adherent.personnesCharge) {
      adherent.personnesCharge.forEach(pc => {
        const pcForm = this.fb.group({
          prenoms: [pc.prenoms, Validators.required],
          nom: [pc.nom, Validators.required],
          sexe: [pc.sexe, Validators.required],
          dateNaissance: [pc.dateNaissance, Validators.required],
          lieuNaissance: [pc.lieuNaissance, Validators.required],
          adresse: [pc.adresse, Validators.required],
          whatsapp: [pc.whatsapp],
          lienParent: [pc.lienParent, Validators.required],
          situationM: [pc.situationM, Validators.required],
          numeroCNi: [pc.numeroCNi],
          numeroExtrait: [pc.numeroExtrait],
          photo: [pc.photo],
          photoRecto: [pc.photoRecto],
          photoVerso: [pc.photoVerso]
        });
        this.personnesChargeArray.push(pcForm);
      });
    }

    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  deleteAdherent(adherent: Adherent) {
    if (confirm(`Voulez-vous vraiment supprimer l'adhérent ${adherent.prenoms} ${adherent.nom} ?`)) {
      this.enroulementService.deleteAdherent(adherent.id)
        .pipe(takeUntil(this._destroy$))
        .subscribe({
          next: () => {
            this.adherents = this.adherents.filter(a => a.id !== adherent.id);
            this.applyFilters();
            this._computeStats(this.adherents);
            alert('Adhérent supprimé avec succès.');
          },
          error: (err) => {
            console.error('Delete error:', err);
            alert('Erreur lors de la suppression.');
          }
        });
    }
  }

  exportExcel() {
    this.exporting = true;
    this.enroulementService.exportAdherentsExcel(this.exportDates.start, this.exportDates.end)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = this.exportDates.start && this.exportDates.end
            ? `enrolements_${this.exportDates.start}_${this.exportDates.end}.xlsx`
            : `enrolements_complet_${new Date().toISOString().split('T')[0]}.xlsx`;
          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);
          this.exporting = false;
        },
        error: (err) => {
          console.error('Export error:', err);
          alert('Erreur lors de l\'exportation. Veuillez vérifier que le serveur est accessible.');
          this.exporting = false;
        }
      });
  }
}
