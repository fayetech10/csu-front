import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { SidebarService } from '../../../core/services/sidebar.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  section?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf, AsyncPipe],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  navItems: NavItem[] = [
    { label: 'Tableau de bord', route: '/dashboard', icon: 'dashboard', section: 'Principal' },
    { label: 'Enrolements', route: '/enrolements', icon: 'person_add' },
    { label: 'Beneficiaires', route: '/beneficiaires', icon: 'people', badge: 200 },
    { label: 'Gestion des cartes', route: '/carte', icon: 'credit_card' },
    { label: 'Type de beneficiaire', route: '/type-beneficiaire', icon: 'category', section: 'Parametres' },
    { label: "Tranche d'age", route: '/tranche-age', icon: 'bar_chart' },
    { label: 'Prestation', route: '/prestation', icon: 'local_hospital' },
    { label: 'Depense de prestation', route: '/depense-prestation', icon: 'payments' },
    { label: 'Suivi de couverture', route: '/suivi-couverture', icon: 'monitoring', section: 'Analyse' },
    { label: 'Enrolement mensuel', route: '/enroulement-mensuel', icon: 'calendar_month' },
    { label: 'Performance des agents', route: '/performance-agents', icon: 'star' },
    { label: 'Classement', route: '/classement', icon: 'emoji_events' }
  ];

  isOpen$ = this.sidebarService.isOpen$;

  constructor(private sidebarService: SidebarService) { }

  closeSidebar() {
    this.sidebarService.close();
  }

  private _sections = new Set<string>();
  getSectionLabel(item: NavItem): string | null {
    if (item.section && !this._sections.has(item.section)) {
      this._sections.add(item.section);
      return item.section;
    }
    return null;
  }
}

