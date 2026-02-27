import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';

interface NavItem { label: string; route: string; icon: string; badge?: number; section?: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Tableau de bord',        route: '/dashboard',           icon: '🏠',  section: 'Principal' },
    { label: 'Beneficiaires',          route: '/beneficiaires',       icon: '👥',  badge: 200 },
    { label: 'Type de beneficiaire',   route: '/type-beneficiaire',   icon: '🏷️',  section: 'Parametres' },
    { label: "Tranche d'age",          route: '/tranche-age',         icon: '📊' },
    { label: 'Prestation',             route: '/prestation',          icon: '💊' },
    { label: 'Depense de prestation',  route: '/depense-prestation',  icon: '💰' },
    { label: 'Suivi de couverture',    route: '/suivi-couverture',    icon: '📈',  section: 'Analyse' },
    { label: 'Enrolement mensuel',     route: '/enroulement-mensuel', icon: '📅' },
    { label: 'Performance des agents', route: '/performance-agents',  icon: '⭐' },
    { label: 'Classement',             route: '/classement',          icon: '🏆' },
    { label: 'Enrolements',            route: '/enrolement',         icon: '📋' }
  ];

  private _seen = new Set<string>();
  getSectionLabel(item: NavItem): string | null {
    if (item.section && !this._seen.has(item.section)) { this._seen.add(item.section); return item.section; }
    return null;
  }
}
