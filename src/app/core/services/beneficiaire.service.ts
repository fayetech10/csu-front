import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Beneficiaire, BeneficiaireFilter, StatsDashboard,
  StatsDept, StatsCommune, PageResult
} from '../models/beneficiaire.model';

@Injectable({ providedIn: 'root' })
export class BeneficiaireService {
  private http = inject(HttpClient);
  // Changez l'URL selon votre environnement (dev ou prod)
  private readonly apiUrl = 'http://localhost:8080/api'; 


   getBeneficiaires(page = 0, size = 100): Observable<PageResult<Beneficiaire>> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResult<Beneficiaire>>(
      `${this.apiUrl}/excel/assures`,
      { params }
    );
  }

  /**
   * Statistiques globales du tableau de bord
   */
  getDashboardStats(): Observable<StatsDashboard> {
    return this.http.get<StatsDashboard>(`${this.apiUrl}/stats/dashboard`);
  }

  /**
   * Statistiques par département
   */
  getStatsByDept(): Observable<StatsDept[]> {
    return this.http.get<StatsDept[]>(`${this.apiUrl}/stats/departements`);
  }

  /**
   * Statistiques par commune (optionnellement filtré par département)
   */
  getStatsByCommune(dept?: string): Observable<StatsCommune[]> {
    let params = new HttpParams();
    if (dept) params = params.set('departement', dept);
    
    return this.http.get<StatsCommune[]>(`${this.apiUrl}/stats/communes`, { params });
  }

  /**
   * Récupération des listes pour les menus déroulants (Selects)
   */
  getRegions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/geo/regions`);
  }

  getDepartements(region?: string): Observable<string[]> {
    let params = new HttpParams();
    if (region) params = params.set('region', region);
    return this.http.get<string[]>(`${this.apiUrl}/geo/departements`, { params });
  }

  getCommunes(dept?: string): Observable<string[]> {
    let params = new HttpParams();
    if (dept) params = params.set('departement', dept);
    return this.http.get<string[]>(`${this.apiUrl}/geo/communes`, { params });
  }

  // Exemple d'autres stats spécifiques
  getStatsByType(): Observable<{type: string; count: number}[]> {
    return this.http.get<{type: string; count: number}[]>(`${this.apiUrl}/stats/types`);
  }
/**
   * Statistiques sur la remise des cartes d'assurés
   */
  getStatsCarte(): Observable<{statut: string; count: number}[]> {
    return this.http.get<{statut: string; count: number}[]>(`${this.apiUrl}/stats/cartes`);
  }

  /**
   * Évolution mensuelle des enrôlements
   */
  getEnrolementMensuel(): Observable<{mois: string; count: number}[]> {
    return this.http.get<{mois: string; count: number}[]>(`${this.apiUrl}/stats/enrolement-mensuel`);
  }
}