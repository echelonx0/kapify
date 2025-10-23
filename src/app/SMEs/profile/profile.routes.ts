// src/app/profile/profile.routes.ts  
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
        path: 'data-room', 
        loadComponent: () => import('src/app/data-room/data-room.component').then(c => c.DataRoomComponent),
        title: 'Profile Overview - Kapify'
      },
      { 
        path: 'steps',
        loadComponent: () => import('./steps/profile-steps-layout/profile-steps-layout.component').then(c => c.ProfileStepsLayoutComponent),
        children: [
          { 
            path: '', 
            // UPDATED: Redirect to new naming convention
            redirectTo: 'company-info', 
            pathMatch: 'full' as 'full' 
          },

          // ===============================
          // NEW FUNDING APPLICATION ROUTES
          // ===============================
          { 
            path: 'company-info', 
            loadComponent: () => import('./steps/admin-information-step/admin-information.component').then(c => c.AdminInformationComponent),
            title: 'Company Information - Funding Application'
          },
          { 
            path: 'documents', 
            loadComponent: () => import('./steps/documents-upload/supporting-documents-upload.component').then(c => c.SupportingDocumentsUploadComponent),
            title: 'Supporting Documents - Funding Application'
          },
          { 
            path: 'business-assessment', 
            loadComponent: () => import('./steps/business-review/business-review.component').then(c => c.BusinessReviewComponent),
            title: 'Business Assessment - Funding Application'
          },
          { 
            path: 'swot-analysis', 
            loadComponent: () => import('./steps/swot-analysis/swot-analysis.component').then(c => c.SWOTAnalysisComponent), 
            title: 'Strategic Analysis - Funding Application'
          },
          { 
            path: 'management', 
            loadComponent: () => import('./steps/governance/management-governance.component').then(c => c.ManagementGovernanceComponent),
            title: 'Leadership & Governance - Funding Application'
          },
          { 
            path: 'business-strategy', 
            loadComponent: () => import('./steps/business-strategy/business-strategy.component').then(c => c.BusinessPlanComponent),
            title: 'Business Strategy - Funding Application'
          },
          { 
            path: 'financial-profile', 
            loadComponent: () => import('./steps/financial-analysis/financial-analysis.component').then(c => c.FinancialAnalysisComponent),
            title: 'Financial Profile - Funding Application'
          },
          { 
            path: 'review', 
            loadComponent: () => import('./steps/review/profile-review.component').then(c => c.ProfileReviewComponent),
            title: 'Review & Analysis - Funding Application'
          },
      

         
        ]
      }
    ]
  }
];
 