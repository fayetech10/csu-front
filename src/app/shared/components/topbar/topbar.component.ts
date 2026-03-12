import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AuthService } from '../../../core/services/auth.service';
import { GlobalFilterService } from '../../../core/services/global-filter.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, AsyncPipe, FormsModule],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent implements OnInit {
  pageTitle = 'Tableau de bord';
  today = '';
  searchQuery = '';

  private titles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/beneficiaires': 'Bénéficiaires',
    '/type-beneficiaire': 'Type de bénéficiaire',
    '/tranche-age': "Tranche d'âge",
    '/prestation': 'Prestation',
    '/depense-prestation': 'Dépense de prestation',
    '/suivi-couverture': 'Suivi de couverture',
    '/enroulement-mensuel': 'Enrôlement mensuel',
    '/performance-agents': 'Performance des agents',
    '/classement': 'Classement',
    '/enrolements': 'Enrôlements',
    '/carte': 'Gestion des cartes'
  };

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    public authService: AuthService,
    public filterService: GlobalFilterService
  ) { }

  logout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  performSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/beneficiaires'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }

  onYearChange(year: number | null) {
    this.filterService.setYear(year);
  }

  ngOnInit() {
    this.today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    this.pageTitle = this.titles[this.router.url] ?? 'SENCSU';
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.pageTitle = this.titles[e.urlAfterRedirects] ?? 'SENCSU');
  }
}

