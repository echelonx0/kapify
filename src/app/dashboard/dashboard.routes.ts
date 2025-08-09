// src/app/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' as 'full' },
      { path: 'home', loadComponent: () => import('./dashboard-home.component').then(c => c.DashboardHomeComponent) },
      { path: 'profile', loadChildren: () => import('../profile/profile.routes').then(m => m.profileRoutes) },
      // Remove this line since applications will be handled separately
      // { path: 'applications', loadComponent: () => import('../applications/applications.component').then(c => c.ApplicationsComponent) },
      { path: 'funding-opportunities', loadComponent: () => import('../funding/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent) },
      { path: 'funder-dashboard', loadComponent: () => import('../funder/funder-dashboard.component').then(c => c.FunderDashboardComponent) },
      // { path: 'settings', loadComponent: () => import('./pages/settings.component').then(c => c.SettingsComponent) },
    ]
  }
];