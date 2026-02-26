export type Sexe = 'Masculin' | 'Feminin';
export type QualiteBenef = 'Adherent' | 'Personne en charge';
export type TypeBenef = 'Classique' | 'Dara';
export type StatutCarte = 'Remise' | 'Non remise';
export type SituationMatr = 'Marie' | 'Celibataire' | 'Veuf/Veuve' | 'Divorce';

export interface Beneficiaire {
  id: number;
  prenoms: string;
  noms: string;
  sexe: 'Homme' | 'Femme';
  age: string; // ou number si tu veux convertir
  dateNaissance: string; // format "MM/DD/YY"
  situationM: string; // ex: "Non précisé"
  beneficiare: string; // ex: "Personne à charge" ou "Adherent"
  agent_collect: string;
  region: string;
  departement: string;
  commune: string;
  telephone: string;
  typeBenef: string; // ex: "Classique" ou "Dara"
  carteAssure: string; // ex: "En instance", "Remise"
  dateCotisation: string; // format "MM/DD/YY"
  dateRemise?: string; // peut être vide
}

export interface BeneficiaireFilter {
  search?: string;
  sexe?: string;
  typeBenef?: string;
  carteAssure?: string;
  region?: string;
  departement?: string;
  commune?: string;
  ageMin?: number | null;
  ageMax?: number | null;
  dateDebut?: string;
  dateFin?: string;
}

export interface StatsDashboard {
  totalBeneficiaires: number;
  hommes: number;
  femmes: number;
  communesCouvertes: number;
}

export interface StatsDept {
  departement: string;
  total: number;
  hommes: number;
  femmes: number;
}


export interface StatsCommune {
  commune: string;
  departement: string;
  region: string;
  total: number;
  hommes: number;
  femmes: number;
}

export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
