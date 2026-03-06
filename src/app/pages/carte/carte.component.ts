import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BeneficiaireService } from '../../core/services/beneficiaire.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { Assure } from '../../core/models/beneficiaire.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
    selector: 'app-carte',
    standalone: true,
    imports: [NgIf, NgFor, DecimalPipe, FormsModule, NgClass, StatCardComponent],
    templateUrl: './carte.component.html'
})
export class CarteComponent implements OnInit, OnDestroy {
    assures: Assure[] = [];
    filteredAssures: Assure[] = [];
    loading = true;

    // Stats
    totalCartes = 0;
    cartesRemises = 0;
    cartesNonRemises = 0;
    tauxRemise = 0;

    // Filters
    searchTerm = '';
    filterStatut = '';
    filterDept = '';
    filterRegion = '';
    depts: string[] = [];
    regions: string[] = [];

    // Pagination
    currentPage = 1;
    pageSize = 15;
    totalPages = 0;

    // Edit modal
    showEditModal = false;
    editingAssure: Assure | null = null;
    editCarteAssure = '';
    editDateRemise = '';

    // Import modal
    showImportModal = false;
    importFile: File | null = null;
    importing = false;
    importResult: { updated: number; notFound: number } | null = null;

    // Detail drawer
    showDetail = false;
    detailAssure: Assure | null = null;

    private _charts: Chart[] = [];
    private _destroy$ = new Subject<void>();

    constructor(private svc: BeneficiaireService) { }

    ngOnInit() {
        this.loadData();
    }

    ngOnDestroy() {
        this._destroy$.next();
        this._destroy$.complete();
        this._charts.forEach(c => c.destroy());
    }

    loadData() {
        this.loading = true;
        this.svc.getAssures(0, 100000)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: (res) => {
                    this.assures = res.data || [];
                    this.depts = [...new Set(this.assures.map(a => a.departement).filter(Boolean))].sort();
                    this.regions = [...new Set(this.assures.map(a => a.region).filter(Boolean))].sort();
                    this._computeStats();
                    this.applyFilters();
                    setTimeout(() => this._initCharts(), 0);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Erreur chargement assurés:', err);
                    this.loading = false;
                }
            });
    }

    private _computeStats() {
        this.totalCartes = this.assures.length;
        this.cartesRemises = this.assures.filter(a => a.carteAssure && a.carteAssure.trim() !== '').length;
        this.cartesNonRemises = this.totalCartes - this.cartesRemises;
        this.tauxRemise = this.totalCartes ? Math.round((this.cartesRemises / this.totalCartes) * 100) : 0;
    }

    applyFilters() {
        let data = [...this.assures];
        if (this.searchTerm) {
            const s = this.searchTerm.toLowerCase();
            data = data.filter(a =>
                (a.noms || '').toLowerCase().includes(s) ||
                (a.prenoms || '').toLowerCase().includes(s) ||
                (a.telephone || '').includes(s) ||
                (a.codeImmatriculation || '').toLowerCase().includes(s)
            );
        }
        if (this.filterStatut === 'remise') {
            data = data.filter(a => a.carteAssure && a.carteAssure.trim() !== '');
        } else if (this.filterStatut === 'non-remise') {
            data = data.filter(a => !a.carteAssure || a.carteAssure.trim() === '');
        }
        if (this.filterRegion) {
            data = data.filter(a => a.region === this.filterRegion);
        }
        if (this.filterDept) {
            data = data.filter(a => a.departement === this.filterDept);
        }
        this.filteredAssures = data;
        this.totalPages = Math.ceil(data.length / this.pageSize);
        this.currentPage = 1;
    }

    onSearch() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }
    resetFilters() {
        this.searchTerm = '';
        this.filterStatut = '';
        this.filterDept = '';
        this.filterRegion = '';
        this.applyFilters();
    }

    get paginatedAssures(): Assure[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredAssures.slice(start, start + this.pageSize);
    }

    get pages(): number[] {
        const cur = this.currentPage, r = 2;
        const arr: number[] = [];
        for (let i = Math.max(1, cur - r); i <= Math.min(this.totalPages, cur + r); i++) arr.push(i);
        return arr;
    }

    get startIdx() { return (this.currentPage - 1) * this.pageSize + 1; }
    get endIdx() { return Math.min(this.currentPage * this.pageSize, this.filteredAssures.length); }

    setPage(p: number) { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }

    // Status helpers
    isCarteRemise(a: Assure): boolean {
        return !!(a.carteAssure && a.carteAssure.trim() !== '');
    }

    statutLabel(a: Assure): string {
        return this.isCarteRemise(a) ? 'Remise' : 'Non remise';
    }

    statutClass(a: Assure): string {
        return this.isCarteRemise(a) ? 'pill pill-green' : 'pill pill-red';
    }

    // Detail drawer
    openDetail(a: Assure) {
        this.detailAssure = a;
        this.showDetail = true;
    }

    closeDetail() {
        this.showDetail = false;
        this.detailAssure = null;
    }

    // Edit modal
    openEdit(a: Assure) {
        this.editingAssure = a;
        this.editCarteAssure = a.carteAssure || '';
        this.editDateRemise = a.dateRemise || '';
        this.showEditModal = true;
    }

    closeEdit() {
        this.showEditModal = false;
        this.editingAssure = null;
    }

    validerCarte() {
        if (!this.editingAssure) return;
        this.svc.updateCarteStatus(this.editingAssure.id, this.editCarteAssure, this.editDateRemise)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: () => {
                    const idx = this.assures.findIndex(a => a.id === this.editingAssure!.id);
                    if (idx !== -1) {
                        this.assures[idx].carteAssure = this.editCarteAssure;
                        this.assures[idx].dateRemise = this.editDateRemise;
                    }
                    this._computeStats();
                    this.applyFilters();
                    this._refreshCharts();
                    this.closeEdit();
                },
                error: (err) => {
                    console.error('Erreur mise à jour carte:', err);
                    alert('Erreur lors de la mise à jour.');
                }
            });
    }

    // Quick validate
    quickValidate(a: Assure) {
        const today = new Date().toLocaleDateString('fr-FR');
        this.svc.updateCarteStatus(a.id, 'OUI', today)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: () => {
                    a.carteAssure = 'OUI';
                    a.dateRemise = today;
                    this._computeStats();
                    this.applyFilters();
                    this._refreshCharts();
                },
                error: (err) => {
                    console.error('Erreur validation rapide:', err);
                    alert('Erreur lors de la validation.');
                }
            });
    }

    // Import full Assuré list
    importAssureList() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls';
        fileInput.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                this.loading = true;
                this.svc.importAssures(file).subscribe({
                    next: () => {
                        alert('Importation de la liste des assurés réussie !');
                        this.loadData();
                    },
                    error: (err) => {
                        console.error('Erreur import assurés:', err);
                        alert('Erreur lors de l\'importation. Vérifiez le format du fichier.');
                        this.loading = false;
                    }
                });
            }
        };
        fileInput.click();
    }

    // Import cartes (matching by code)
    openImport() {
        this.importFile = null;
        this.importResult = null;
        this.showImportModal = true;
    }

    closeImport() {
        this.showImportModal = false;
        this.importFile = null;
        this.importResult = null;
        this.importing = false;
    }

    onImportFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.importFile = input.files[0];
        }
    }

    submitImport() {
        if (!this.importFile) return;
        this.importing = true;
        this.svc.importCartes(this.importFile)
            .pipe(takeUntil(this._destroy$))
            .subscribe({
                next: (res) => {
                    this.importResult = { updated: res.updated, notFound: res.notFound };
                    this.importing = false;
                    // Reload data
                    this.loadData();
                },
                error: (err) => {
                    console.error('Erreur importation cartes:', err);
                    alert('Erreur lors de l\'importation.');
                    this.importing = false;
                }
            });
    }

    private _refreshCharts() {
        this._charts.forEach(c => c.destroy());
        this._charts = [];
        setTimeout(() => this._initCharts(), 0);
    }

    private _initCharts() {
        this._charts.forEach(c => c.destroy());
        this._charts = [];

        const G = '#00853f', R = '#e31b23';
        const base = { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans' }, padding: 14 } } } };

        // Doughnut chart
        const el = document.getElementById('chartCarteStatut') as HTMLCanvasElement;
        if (el) {
            this._charts.push(new Chart(el, {
                type: 'doughnut',
                data: {
                    labels: ['Remises', 'Non remises'],
                    datasets: [{ data: [this.cartesRemises, this.cartesNonRemises], backgroundColor: [G, R] }]
                },
                options: { ...base, cutout: '65%' }
            }));
        }

        // Bar chart by département
        const deptMap = new Map<string, { remises: number; nonRemises: number }>();
        this.assures.forEach(a => {
            const d = a.departement || 'Inconnu';
            if (!deptMap.has(d)) deptMap.set(d, { remises: 0, nonRemises: 0 });
            const entry = deptMap.get(d)!;
            if (this.isCarteRemise(a)) entry.remises++; else entry.nonRemises++;
        });
        const deptLabels = Array.from(deptMap.keys()).sort();

        const barEl = document.getElementById('chartCarteDept') as HTMLCanvasElement;
        if (barEl) {
            this._charts.push(new Chart(barEl, {
                type: 'bar',
                data: {
                    labels: deptLabels,
                    datasets: [
                        { label: 'Remises', data: deptLabels.map(d => deptMap.get(d)!.remises), backgroundColor: G },
                        { label: 'Non remises', data: deptLabels.map(d => deptMap.get(d)!.nonRemises), backgroundColor: R }
                    ]
                },
                options: {
                    ...base,
                    scales: {
                        x: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true },
                        y: { grid: { color: 'rgba(0,0,0,.04)' }, stacked: true }
                    }
                }
            }));
        }
    }
}
