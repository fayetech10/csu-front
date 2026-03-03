import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

interface Prestation {
  nom: string;
  categorie: string;
  description: string;
  taux: number;
  icon: string;
}

@Component({
  selector: 'app-prestation',
  standalone: true,
  imports: [NgFor, StatCardComponent],
  templateUrl: './prestation.component.html'
})
export class PrestationComponent {
  categories = [
    { label: 'Consultation', icon: '🩺', count: 5, color: 'green' as const },
    { label: 'Hospitalisation', icon: '🏥', count: 4, color: 'blue' as const },
    { label: 'Médicaments', icon: '💊', count: 6, color: 'yellow' as const },
    { label: 'Maternité', icon: '🤰', count: 3, color: 'red' as const }
  ];

  prestations: Prestation[] = [
    { nom: 'Consultation générale', categorie: 'Consultation', description: 'Visite chez un médecin généraliste', taux: 100, icon: '🩺' },
    { nom: 'Consultation spécialisée', categorie: 'Consultation', description: 'Visite chez un médecin spécialiste', taux: 80, icon: '🩺' },
    { nom: 'Analyses biologiques', categorie: 'Consultation', description: 'Examens de laboratoire courants', taux: 80, icon: '🔬' },
    { nom: 'Radiologie', categorie: 'Consultation', description: 'Radiographies et échographies', taux: 70, icon: '📷' },
    { nom: 'Soins dentaires', categorie: 'Consultation', description: 'Traitements dentaires de base', taux: 60, icon: '🦷' },
    { nom: 'Hospitalisation courte', categorie: 'Hospitalisation', description: 'Séjour hospitalier de 1 à 5 jours', taux: 90, icon: '🏥' },
    { nom: 'Hospitalisation longue', categorie: 'Hospitalisation', description: 'Séjour hospitalier de plus de 5 jours', taux: 80, icon: '🏥' },
    { nom: 'Chirurgie courante', categorie: 'Hospitalisation', description: 'Interventions chirurgicales planifiées', taux: 80, icon: '🔪' },
    { nom: 'Chirurgie d\'urgence', categorie: 'Hospitalisation', description: 'Interventions chirurgicales d\'urgence', taux: 100, icon: '🚑' },
    { nom: 'Médicaments génériques', categorie: 'Médicaments', description: 'Médicaments de la liste nationale', taux: 100, icon: '💊' },
    { nom: 'Médicaments de spécialité', categorie: 'Médicaments', description: 'Médicaments spécialisés prescrits', taux: 70, icon: '💊' },
    { nom: 'Vaccinations', categorie: 'Médicaments', description: 'Vaccins du programme élargi', taux: 100, icon: '💉' },
    { nom: 'Dispositifs médicaux', categorie: 'Médicaments', description: 'Prothèses et dispositifs de base', taux: 60, icon: '🦿' },
    { nom: 'Antipaludéens', categorie: 'Médicaments', description: 'Traitements contre le paludisme', taux: 100, icon: '🦟' },
    { nom: 'Antirétroviraux', categorie: 'Médicaments', description: 'Traitement VIH/SIDA', taux: 100, icon: '💊' },
    { nom: 'Suivi prénatal', categorie: 'Maternité', description: 'Consultations et examens prénataux', taux: 100, icon: '🤰' },
    { nom: 'Accouchement', categorie: 'Maternité', description: 'Accouchement normal ou assisté', taux: 100, icon: '👶' },
    { nom: 'Soins postnataux', categorie: 'Maternité', description: 'Suivi mère et nouveau-né', taux: 100, icon: '🍼' },
  ];

  tauxClass(taux: number): string {
    if (taux === 100) return 'pill pill-green';
    if (taux >= 80) return 'pill pill-blue';
    if (taux >= 60) return 'pill pill-yellow';
    return 'pill pill-gray';
  }

  categorieClass(cat: string): string {
    const m: Record<string, string> = {
      'Consultation': 'pill pill-green',
      'Hospitalisation': 'pill pill-blue',
      'Médicaments': 'pill pill-yellow',
      'Maternité': 'pill pill-red'
    };
    return m[cat] || 'pill pill-gray';
  }
}
