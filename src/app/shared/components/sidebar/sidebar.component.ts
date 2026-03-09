import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AsyncPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { SidebarService } from '../../../core/services/sidebar.service';
import { BeneficiaireService } from '../../../core/services/beneficiaire.service';
import { Subscription, filter } from 'rxjs';

interface NavItem {
  label: string;
  route?: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
  expanded?: boolean;
  section?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgFor, NgIf, AsyncPipe, NgClass],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit, OnDestroy {
  navItems: NavItem[] = [
    { label: 'Tableau de bord', route: '/dashboard', icon: 'dashboard', section: 'Principal' },

    {
      label: 'Gestion des Membres',
      icon: 'groups',
      children: [
        { label: 'Enrôlements', route: '/enrolements', icon: 'person_add' },
        { label: 'Bénéficiaires', route: '/beneficiaires', icon: 'people' },
        { label: 'Cartes', route: '/carte', icon: 'credit_card' },
      ]
    },

    {
      label: 'Services & Soins',
      icon: 'medical_services',
      children: [
        { label: 'Prestations', route: '/prestation', icon: 'local_hospital' },
        { label: 'Dépenses', route: '/depense-prestation', icon: 'payments' },
      ]
    },

    {
      label: 'Analyses',
      icon: 'analytics',
      children: [
        { label: 'Suivi couverture', route: '/suivi-couverture', icon: 'monitoring' },
        { label: 'Enrôlement mensuel', route: '/enroulement-mensuel', icon: 'calendar_month' },
        { label: 'Performance agents', route: '/performance-agents', icon: 'star' },
        { label: 'Classement', route: '/classement', icon: 'emoji_events' }
      ]
    },

    {
      label: 'Paramétrage',
      icon: 'settings',
      section: 'Système',
      children: [
        { label: 'Types bénéficiaire', route: '/type-beneficiaire', icon: 'category' },
        { label: "Tranches d'âge", route: '/tranche-age', icon: 'bar_chart' },
      ]
    }
  ];

  isOpen$ = this.sidebarService.isOpen$;
  private routerSub!: Subscription;

  constructor(
    private sidebarService: SidebarService,
    private beneficiaireService: BeneficiaireService,
    private router: Router
  ) { }

  ngOnInit() {
    // Load badge count
    this.beneficiaireService.getBeneficiaires(0, 1).subscribe({
      next: (res) => {
        const memGroup = this.navItems.find(i => i.label === 'Gestion des Membres');
        if (memGroup && memGroup.children) {
          const benefItem = memGroup.children.find(c => c.route === '/beneficiaires');
          if (benefItem) benefItem.badge = res.total || 0;
        }
      },
      error: () => { /* silent */ }
    });

    // Auto-expand group matching current route
    this.expandActiveGroup(this.router.url);

    // Listen for route changes to auto-expand
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.expandActiveGroup(e.urlAfterRedirects));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  /** Accordion: close others, toggle target */
  toggleSubmenu(item: NavItem) {
    if (item.expanded) {
      // Close this one
      item.expanded = false;
    } else {
      // Close all others first (accordion)
      this.navItems.forEach(i => {
        if (i.children) i.expanded = false;
      });
      item.expanded = true;
    }
  }

  /** Check if a parent group has an active child route */
  isGroupActive(item: NavItem): boolean {
    if (!item.children) return false;
    const url = this.router.url;
    return item.children.some(c => c.route && url.startsWith(c.route));
  }

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

  /** Expand the group whose child matches the current URL */
  private expandActiveGroup(url: string) {
    this.navItems.forEach(item => {
      if (item.children) {
        const hasActive = item.children.some(c => c.route && url.startsWith(c.route));
        item.expanded = hasActive;
      }
    });
  }
}
