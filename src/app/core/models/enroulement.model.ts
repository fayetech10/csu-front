export interface PersonneCharge {
  id: number;
  prenoms: string;
  nom: string;
  sexe: string;
  dateNaissance: string;
  lieuNaissance: string;
  adresse: string;
  whatsapp: string;
  lienParent: string;
  situationM: string;
  numeroCNi?: string;
  numeroExtrait?: string;
  photo?: string;
  photoRecto?: string;
  photoVerso?: string;
  createdAt: string;
}

export interface Adherent {
  id: number;
  prenoms: string;
  nom: string;
  sexe: string;
  regime: string;
  region: string;
  departement: string;
  commune: string;
  typeBenef: string;
  typeAdhesion: string;
  dateNaissance: string;
  whatsapp: string;
  adresse: string;
  montantTotal: number;
  numeroCNi: string;
  photo: string;
  agent: Agent;
personnesCharge: PersonneCharge[];
  createdAt: string;
}
export interface Agent {
  id: number;
  prenom: string;
  name: string;
  email: string;
  telephone: string;
  role: string;
}
