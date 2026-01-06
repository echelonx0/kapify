// src/app/applications/applications.routes.ts
import { Routes } from '@angular/router';

export const applicationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./applications.component').then(c => c.ApplicationsComponent),
    children: [
      { 
        path: '', 
        redirectTo: 'home', 
        pathMatch: 'full' as 'full' 
      },
      { 
        path: 'home', 
        loadComponent: () => import('./components/applications-home/applications-home.component').then(c => c.ApplicationsHomeComponent),
        title: 'Applications - Kapify'
      },
    {
    path: 'new',
    loadComponent: () => 
      import('./new-application/opportunity-application.component').then(m => m.OpportunityApplicationFormComponent),
    title: 'New Application'
  },
  {
    path: 'new/:opportunityId',
    loadComponent: () => 
      import('./new-application/opportunity-application.component').then(m => m.OpportunityApplicationFormComponent),
    title: 'Apply for Opportunity'
  },
    {
        path: 'submitted',
        loadComponent: () => 
          import('./components/submitted/application-submitted.component').then(m => m.ApplicationSubmittedComponent),
        title: 'Application Submitted - Kapify'
      }
    ]
  }
];