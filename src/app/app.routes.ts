import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard',           loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'beneficiaires',       loadComponent: () => import('./pages/beneficiaires/beneficiaires.component').then(m => m.BeneficiairesComponent) },
  { path: 'type-beneficiaire',   loadComponent: () => import('./pages/type-beneficiaire/type-beneficiaire.component').then(m => m.TypeBeneficiaireComponent) },
  { path: 'tranche-age',         loadComponent: () => import('./pages/tranche-age/tranche-age.component').then(m => m.TrancheAgeComponent) },
  { path: 'prestation',          loadComponent: () => import('./pages/prestation/prestation.component').then(m => m.PrestationComponent) },
  { path: 'depense-prestation',  loadComponent: () => import('./pages/depense-prestation/depense-prestation.component').then(m => m.DepensePrestationComponent) },
  { path: 'suivi-couverture',    loadComponent: () => import('./pages/suivi-couverture/suivi-couverture.component').then(m => m.SuiviCouvertureComponent) },
  { path: 'enroulement-mensuel', loadComponent: () => import('./pages/enroulement-mensuel/enroulement-mensuel.component').then(m => m.EnroulementMensuelComponent) },
  { path: 'performance-agents',  loadComponent: () => import('./pages/performance-agents/performance-agents.component').then(m => m.PerformanceAgentsComponent) },
  { path: 'classement',          loadComponent: () => import('./pages/classement/classement.component').then(m => m.ClassementComponent) },
  { path: 'enrolement',          loadComponent: () => import('./pages/enrolements/enrolements.component').then(m => m.EnrolementsComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
