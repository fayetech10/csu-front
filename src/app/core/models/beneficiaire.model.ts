export type Sexe = 'Masculin' | 'Feminin';
export type QualiteBenef = 'Adherent' | 'Personne en charge';
export type TypeBenef = 'Classique' | 'Dara';
export type StatutCarte = 'Remise' | 'Non remise';
export type SituationMatr = 'Marie' | 'Celibataire' | 'Veuf/Veuve' | 'Divorce';

export interface Beneficiaire {
  id: number;
  prenoms: string;
  nom: string;
  sexe: 'Homme' | 'Femme' | 'Masculin' | 'Feminin' | string;
  dateNaissance: string;
  age?: number;
  lieuNaissance?: string;
  adresse?: string;
  situationM: string;
  beneficiaire: string; // ex: "Personne à charge" ou "Adherent"
  agentCollect: string;
  region: string;
  assureur?: string;
  departement: string;
  commune: string;
  typeBenef: string; // ex: "Classique" ou "Dara"
  typeAdhesion?: string;
}

export interface Assure {
  id: number;
  dateEnregistrement: string;
  codeImmatriculation: string;
  noms: string;
  prenoms: string;
  dateNaissance: string;
  sexe: string;
  telephone: string;
  adresse: string;
  regime: string;
  assureur: string;
  typeBenef: string;
  dateCotisation: string;
  dateFinCotisation: string;
  qrCodeUrl: string;
  region: string;
  departement: string;
  commune: string;
  groupe: string;
  typeAdhesion: string;
  typeCotisation: string;
  cni: string;
  photo: string;
  carteAssure?: string;
  dateRemise?: string;
}

export interface BeneficiaireFilter {
  search?: string;
  sexe?: string;
  typeBenef?: string;
  region?: string;
  departement?: string;
  commune?: string;
  ageMin?: number | null;
  ageMax?: number | null;
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
