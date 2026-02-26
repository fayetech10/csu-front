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

  /**
   * Récupère la liste paginée et filtrée depuis le backend.
   * On envoie les filtres en tant que Query Parameters.
   */
  // getBeneficiaires(filter: BeneficiaireFilter = {}, page = 1, perPage = 15): Observable<PageResult<Beneficiaire>> {
  //   let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('perPage', perPage.toString());

  //   // Ajout dynamique des filtres aux paramètres de la requête
  //   if (filter.search) params = params.set('search', filter.search);
  //   if (filter.sexe) params = params.set('sexe', filter.sexe);
  //   if (filter.typeBeneficiaire) params = params.set('typeBeneficiaire', filter.typeBeneficiaire);
  //   if (filter.carteAssuree) params = params.set('carteAssuree', filter.carteAssuree);
  //   if (filter.region) params = params.set('region', filter.region);
  //   if (filter.departement) params = params.set('departement', filter.departement);
  //   if (filter.commune) params = params.set('commune', filter.commune);
    
  //   return this.http.get<PageResult<Beneficiaire>>(`${this.apiUrl}/beneficiaires`, { params });
  // }
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