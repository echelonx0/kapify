// src/app/funder/funder.routes.ts
import { Routes } from '@angular/router';

export const funderRoutes: Routes = [
  {
    path: '',
     loadComponent: () => import('./funder.component').then(m => m.FunderComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      {
        path: 'dashboard',
        loadComponent: () => import('./funder-dashboard.component').then(m => m.FunderDashboardComponent)
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import('./components/funder-organization-onboarding.component').then(m => m.OrganizationOnboardingComponent)
      },
      {
        path: 'opportunities/create',
        loadComponent: () =>
          import('./create-opportunity.component').then(m => m.OpportunityFormComponent)
      },
      {
        path: 'opportunities/:id',
        loadComponent: () =>
          import('../funding/funding-detail.component').then(m => m.OpportunityDetailsComponent)
      }
    ]
  }
];
