# SENCSU Dashboard — Angular 17 + Tailwind CSS 3

## Demarrage rapide

```bash
# Prerequis: Node.js v18+ et npm v9+

cd sencsu-dashboard
npm install
npm start
# Ouvrir http://localhost:4200
```

## Build production
```bash
npm run build
```

## Architecture
```
src/
app/
  core/
    models/beneficiaire.model.ts      Interfaces TypeScript
    services/beneficiaire.service.ts  Service donnees (simulees / API)
  shared/components/
    sidebar/    Navigation laterale
    topbar/     Barre superieure dynamique
    stat-card/  Composant KPI reutilisable
  pages/
    dashboard/          Tableau de bord avec graphiques Chart.js
    beneficiaires/      Liste avec 10 filtres et pagination
    type-beneficiaire/  Placeholder
    tranche-age/        Placeholder
    prestation/         Placeholder
    depense-prestation/ Placeholder
    suivi-couverture/   Placeholder
    enroulement-mensuel/Placeholder
    performance-agents/ Placeholder
    classement/         Placeholder
  app.component.ts    Layout principal
  app.routes.ts       Routing lazy-loaded
  app.config.ts       Configuration Angular
```

## Connexion API production

Dans beneficiaire.service.ts:
```typescript
// Injecter HttpClient
constructor(private http: HttpClient) {}

// Remplacer of(...).pipe(delay(...)) par:
return this.http.get<Beneficiaire[]>('/api/beneficiaires');
```

## Couleurs SENCSU (tailwind.config.js)
- sencsu-green:       #00853f
- sencsu-green-dark:  #005f2d
- sencsu-green-mid:   #00a84f
- sencsu-green-light: #e6f5ed
- sencsu-yellow:      #fdef42
- sencsu-red:         #e31b23
# csu-front
