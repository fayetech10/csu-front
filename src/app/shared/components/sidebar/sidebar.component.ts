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
    { label: 'Tableau de bord', route: '/dashboard', icon: '🏠', section: 'Principal' },
    { label: 'Enrolements', route: '/enrolements', icon: '📋' },
    { label: 'Beneficiaires', route: '/beneficiaires', icon: '👥', badge: 200 },
    { label: 'Type de beneficiaire', route: '/type-beneficiaire', icon: '🏷️', section: 'Parametres' },
    { label: "Tranche d'age", route: '/tranche-age', icon: '📊' },
    { label: 'Prestation', route: '/prestation', icon: '💊' },
    { label: 'Depense de prestation', route: '/depense-prestation', icon: '💰' },
    { label: 'Suivi de couverture', route: '/suivi-couverture', icon: '📈', section: 'Analyse' },
    { label: 'Enrolement mensuel', route: '/enroulement-mensuel', icon: '📅' },
    { label: 'Performance des agents', route: '/performance-agents', icon: '⭐' },
    { label: 'Classement', route: '/classement', icon: '🏆' }
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

