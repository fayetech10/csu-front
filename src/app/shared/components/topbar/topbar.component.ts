import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './topbar.component.html'
})
export class TopbarComponent implements OnInit {
  pageTitle = 'Tableau de bord';
  today = '';

  private titles: Record<string, string> = {
    '/dashboard':           'Tableau de bord',
    '/beneficiaires':       'Beneficiaires',
    '/type-beneficiaire':   'Type de beneficiaire',
    '/tranche-age':         "Tranche d'age",
    '/prestation':          'Prestation',
    '/depense-prestation':  'Depense de prestation',
    '/suivi-couverture':    'Suivi de couverture',
    '/enroulement-mensuel': 'Enrolement mensuel',
    '/performance-agents':  'Performance des agents',
    '/classement':          'Classement'
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    this.pageTitle = this.titles[this.router.url] ?? 'SENCSU';
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.pageTitle = this.titles[e.urlAfterRedirects] ?? 'SENCSU');
  }
}
