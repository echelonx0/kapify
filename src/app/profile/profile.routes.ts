// src/app/profile/profile.routes.ts - UPDATED STRUCTURE
import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
   loadComponent: () => import('./profile-layout.component').then(c => c.ProfileLayoutComponent),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' as 'full' },
      { path: 'home', loadComponent: () => import('./pages/profile-home.component').then(c => c.ProfileHomeComponent) },
      { 
        path: 'steps',
   loadComponent: () => import('./steps/profile-steps-layout.component').then(c => c.ProfileStepsLayoutComponent),
    
    
        children: [
          { path: '', redirectTo: 'admin', pathMatch: 'full' as 'full' },
          { path: 'admin', loadComponent: () => import('./steps/admin-information.component').then(c => c.AdminInformationComponent) },
          { path: 'documents', loadComponent: () => import('./steps/documents-upload.component').then(c => c.DocumentsUploadComponent) },
          { path: 'business-review', loadComponent: () => import('./steps/business-info.component').then(c => c.BusinessInfoComponent) },
          { path: 'swot', loadComponent: () => import('./steps/personal-info.component').then(c => c.PersonalInfoComponent) }, // PLACEHOLDER
          { path: 'management', loadComponent: () => import('./steps/management-governance.component').then(c => c.ManagementGovernanceComponent) },
          { path: 'business-plan', loadComponent: () => import('./steps/business-plan.component').then(c => c.BusinessPlanComponent) },
          { path: 'financial', loadComponent: () => import('./steps/financial-analysis.component').then(c => c.FinancialAnalysisComponent) }
        ]
      }
    ]
  }
];