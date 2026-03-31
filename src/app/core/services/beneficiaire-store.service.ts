import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, map, catchError, shareReplay, switchMap } from 'rxjs';
import { Beneficiaire, PageResult } from '../models/beneficiaire.model';
import { BeneficiaireService } from './beneficiaire.service';

/**
 * Store centralisé pour les données des bénéficiaires.
 *
 * — Charge les données UNE SEULE FOIS depuis l'API
 * — Les redistribue à tous les composants via `beneficiaires$`
 * — Invalide le cache à la demande via `refresh()`
 * — TTL configurable (par défaut 5 minutes)
 */
@Injectable({ providedIn: 'root' })
export class BeneficiaireStore {

  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  private svc = inject(BeneficiaireService);

  // ── État interne ──────────────────────────────────────────
  private _cache$ = new BehaviorSubject<Beneficiaire[]>([]);
  private _loading$ = new BehaviorSubject<boolean>(false);
  private _lastUpdated$ = new BehaviorSubject<Date | null>(null);
  private _initialized = false;
  private _inflight$: Observable<Beneficiaire[]> | null = null;

  // ── Observables publics ───────────────────────────────────

  /** Flux réactif des bénéficiaires (cachés). */
  readonly beneficiaires$: Observable<Beneficiaire[]> = this._cache$.asObservable();

  /** Indique si un chargement est en cours. */
  readonly loading$: Observable<boolean> = this._loading$.asObservable();

  /** Date du dernier chargement réussi. */
  readonly lastUpdated$: Observable<Date | null> = this._lastUpdated$.asObservable();

  /** Nombre total de bénéficiaires en cache. */
  readonly total$: Observable<number> = this._cache$.pipe(map(d => d.length));

  // ── API publique ──────────────────────────────────────────

  /**
   * Retourne les données cachées ou déclenche un chargement si nécessaire.
   * Plusieurs souscriptions simultanées ne produisent qu'UN SEUL appel HTTP.
   */
  getBeneficiaires(): Observable<Beneficiaire[]> {
    if (this._isCacheValid()) {
      return of(this._cache$.value);
    }
    return this._load();
  }

  /**
   * Force le rechargement des données (après import, modification, etc.)
   */
  refresh(): void {
    this._initialized = false;
    this._inflight$ = null;
    this._load().subscribe();
  }

  /**
   * Retourne les données en cache immédiatement (snapshot synchrone).
   * Utile pour les composants qui savent que les données sont déjà chargées.
   */
  get snapshot(): Beneficiaire[] {
    return this._cache$.value;
  }

  // ── Logique interne ───────────────────────────────────────

  private _isCacheValid(): boolean {
    if (!this._initialized || !this._lastUpdated$.value) return false;
    return (Date.now() - this._lastUpdated$.value.getTime()) < this.TTL_MS;
  }

  private _load(): Observable<Beneficiaire[]> {
    // Dédupliquer les appels en vol
    if (this._inflight$) return this._inflight$;

    this._loading$.next(true);

    this._inflight$ = this.svc.getBeneficiaires(0, 100000).pipe(
      map((res: PageResult<Beneficiaire>) => res.data),
      tap(data => {
        this._cache$.next(data);
        this._lastUpdated$.next(new Date());
        this._initialized = true;
        this._loading$.next(false);
        this._inflight$ = null;
      }),
      catchError(err => {
        console.error('❌ BeneficiaireStore: Erreur de chargement', err);
        this._loading$.next(false);
        this._inflight$ = null;
        return of(this._cache$.value); // Retourne le cache existant en cas d'erreur
      }),
      shareReplay(1) // Partager le résultat entre souscriptions simultanées
    );

    return this._inflight$;
  }
}
