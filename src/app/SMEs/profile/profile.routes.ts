// src/app/profile/profile.routes.ts - UPDATED WITH FUNDING APPLICATION NAMING
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
            loadComponent: () => import('./steps/business-plan/business-plan.component').then(c => c.BusinessPlanComponent),
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
          // ===============================
          // LEGACY ROUTES (BACKWARD COMPATIBILITY)
          // Keep these for existing bookmarks/links
          // TODO: Remove after migration period (6 months)
          // ===============================
          
          // Legacy: admin → company-info
          { 
            path: 'admin', 
            redirectTo: 'company-info',
            pathMatch: 'full' as 'full'
            // OLD: loadComponent: () => import('./steps/admin-information-step/admin-information.component').then(c => c.AdminInformationComponent),
            // OLD: title: 'Company Information - Profile Setup'
          },
          
          // Legacy: business-review → business-assessment
          { 
            path: 'business-review', 
            redirectTo: 'business-assessment',
            pathMatch: 'full' as 'full'
            // OLD: loadComponent: () => import('./steps/business-info.component').then(c => c.BusinessInfoComponent),
            // OLD: title: 'Business Review - Profile Setup'
          },
          
          // Legacy: swot → swot-analysis  
          { 
            path: 'swot', 
            redirectTo: 'swot-analysis',
            pathMatch: 'full' as 'full'
            // OLD: loadComponent: () => import('./steps/swot-analysis/swot-analysis.component').then(c => c.SWOTAnalysisComponent), 
            // OLD: title: 'SWOT Analysis - Profile Setup'
          },
          
          // Legacy: business-plan → business-strategy
          { 
            path: 'business-plan', 
            redirectTo: 'business-strategy',
            pathMatch: 'full' as 'full'
            // OLD: loadComponent: () => import('./steps/business-plan/business-plan.component').then(c => c.BusinessPlanComponent),
            // OLD: title: 'Business Plan - Profile Setup'
          },
          
          // Legacy: financial → financial-profile
          { 
            path: 'financial', 
            redirectTo: 'financial-profile',
            pathMatch: 'full' as 'full'
            // OLD: loadComponent: () => import('./steps/financial-analysis.component').then(c => c.FinancialAnalysisComponent),
            // OLD: title: 'Financial Analysis - Profile Setup'
          }

          // NOTE: 'documents' and 'management' remain the same, no redirect needed
        ]
      }
    ]
  }
];
 