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
        loadComponent: () => import('./components/applications-home.component').then(c => c.ApplicationsHomeComponent),
        title: 'Applications - Kapify'
      },
      { 
        path: 'new', 
        loadComponent: () => import('./components/new-application/application-form.component').then(c => c.ApplicationFormComponent),
        title: 'New Application - Kapify'
      },
      { 
        path: ':id', 
        loadComponent: () => import('./components/application-detail.component').then(c => c.ApplicationDetailLayoutComponent),
        title: 'Application Details - Kapify'
      }
    ]
  }
];