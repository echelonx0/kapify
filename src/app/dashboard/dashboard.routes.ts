 

// 3. Fixed dashboard.routes.ts
import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard-layout.component').then(c => c.DashboardLayoutComponent),
    children: [
      // Default route
      { 
        path: '', 
        redirectTo: 'home', 
        pathMatch: 'full' 
      },
      
      // Dashboard routes
      { 
        path: 'home', 
        loadComponent: () => import('./dashboard-home/kapify-dashboard.component').then(c => c.KapifyDashboard),
        title: 'Dashboard - Kapify'
      },
      { 
        path: 'welcome', 
        loadComponent: () => import('../landing/welcome/welcome-screen.component').then(c => c.WelcomeScreenComponent),
        title: 'Welcome - Kapify'
      },
      
      // Other routes
      { 
        path: 'profile', 
        loadChildren: () => import('../SMEs/profile/profile.routes').then(m => m.profileRoutes) 
      },
      { 
        path: 'funding-opportunities', 
        loadComponent: () => import('../marketplace/opportunities-list/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent),
        title: 'Funding Opportunities - Kapify'
      },
      { 
        path: 'funder-dashboard', 
        loadComponent: () => import('../funder/dashboard/funder-dashboard.component').then(c => c.FunderDashboardComponent),
        title: 'Funder Dashboard - Kapify'
      },
      // { 
      //   path: 'settings', 
      //   loadComponent: () => import('./pages/settings-page.component').then(c => c.SettingsComponent),
      //   title: 'Settings - Kapify'
      // },
      {
        path: 'resources',
        loadComponent: () => import('../shared/components/learning-resources/learning-resources.component').then(m => m.LearningResourcesComponent),
        title: 'Resources - Kapify'
      },
      
      {
    path: 'settings',
    loadComponent: () => 
      import('./settings/settings.component').then(c => c.SettingsComponent),
    title: 'Organization Settings'
  },
      // Dashboard 404 - redirect to main 404
      {
        path: '**',
        redirectTo: '/404'
      }
    ]
  }
];