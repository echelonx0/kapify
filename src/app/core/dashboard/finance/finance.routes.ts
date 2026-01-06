// src/app/funder/funder.routes.ts - UPDATED WITH PUBLIC PROFILE MANAGEMENT
import { Routes } from '@angular/router';

export const financeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./finance.component').then((m) => m.FinanceComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      {
        path: 'credit-info',
        loadComponent: () =>
          import('./credits-info/credit-system-info.component').then(
            (m) => m.CreditsExplanationComponent
          ),
        title: 'Credit System - Kapify',
      },
    ],
  },
];
