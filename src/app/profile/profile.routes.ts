// src/app/profile/profile.routes.ts - CONSISTENT NAVIGATION STRUCTURE
import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-layout.component').then(c => c.ProfileLayoutComponent),
    children: [
      { 
        path: '', 
        redirectTo: 'home', 
        pathMatch: 'full' as 'full' 
      },
      { 
        path: 'home', 
        loadComponent: () => import('./pages/profile-home.component').then(c => c.ProfileHomeComponent),
        title: 'Profile Overview - Kapify'
      },
      { 
        path: 'steps',
        loadComponent: () => import('./steps/profile-steps-layout/profile-steps-layout.component').then(c => c.ProfileStepsLayoutComponent),
        children: [
          { 
            path: '', 
            redirectTo: 'admin', 
            pathMatch: 'full' as 'full' 
          },
          { 
            path: 'admin', 
            loadComponent: () => import('./steps/admin-information-step/admin-information.component').then(c => c.AdminInformationComponent),
            title: 'Company Information - Profile Setup'
          },
          { 
            path: 'documents', 
            loadComponent: () => import('./steps/documents-upload.component').then(c => c.DocumentsUploadComponent),
            title: 'Documents Upload - Profile Setup'
          },
          { 
            path: 'business-review', 
            loadComponent: () => import('./steps/business-info.component').then(c => c.BusinessInfoComponent),
            title: 'Business Review - Profile Setup'
          },
          { 
            path: 'swot', 
            loadComponent: () => import('./steps/swot-analysis/swot-analysis.component').then(c => c.SWOTAnalysisComponent), 
            title: 'SWOT Analysis - Profile Setup'
          },
          { 
            path: 'management', 
            loadComponent: () => import('./steps/management-governance.component').then(c => c.ManagementGovernanceComponent),
            title: 'Management Team - Profile Setup'
          },
          { 
            path: 'business-plan', 
            loadComponent: () => import('./steps/business-plan/business-plan.component').then(c => c.BusinessPlanComponent),
            title: 'Business Plan - Profile Setup'
          },
          { 
            path: 'financial', 
            loadComponent: () => import('./steps/financial-analysis.component').then(c => c.FinancialAnalysisComponent),
            title: 'Financial Analysis - Profile Setup'
          }
        ]
      }
    ]
  }
];