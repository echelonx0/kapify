 
// src/app/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' as 'full' },
      { path: 'home', loadComponent: () => import('./dashboard-home/kapify-dashboard.component').then(c => c.KapifyDashboard) },
        { path: 'welcome', loadComponent: () => import('../landing/welcome/welcome-screen.component').then(c => c.WelcomeScreenComponent) },
      { path: 'profile', loadChildren: () => import('../SMEs/profile/profile.routes').then(m => m.profileRoutes) },
      { path: 'funding-opportunities', loadComponent: () => import('../funding/funding-opportunities/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent) },
      { path: 'funder-dashboard', loadComponent: () => import('../funder/dashboard/funder-dashboard.component').then(c => c.FunderDashboardComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings-page.component').then(c => c.SettingsComponent) },
      {
  path: 'resources',
  loadComponent: () => import('../shared/components/learning-resources/learning-resources.component').then(m => m.LearningResourcesComponent)
},
    ]
  }
];