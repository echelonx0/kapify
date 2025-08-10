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
            loadComponent: () => import('./steps/documents-upload/documents-upload.component').then(c => c.DocumentsUploadComponent),
            title: 'Supporting Documents - Funding Application'
          },
          { 
            path: 'business-assessment', 
            loadComponent: () => import('./steps/business-info.component').then(c => c.BusinessInfoComponent),
            title: 'Business Assessment - Funding Application'
          },
          { 
            path: 'swot-analysis', 
            loadComponent: () => import('./steps/swot-analysis/swot-analysis.component').then(c => c.SWOTAnalysisComponent), 
            title: 'Strategic Analysis - Funding Application'
          },
          { 
            path: 'management', 
            loadComponent: () => import('./steps/management-governance.component').then(c => c.ManagementGovernanceComponent),
            title: 'Leadership & Governance - Funding Application'
          },
          { 
            path: 'business-strategy', 
            loadComponent: () => import('./steps/business-plan/business-plan.component').then(c => c.BusinessPlanComponent),
            title: 'Business Strategy - Funding Application'
          },
          { 
            path: 'financial-profile', 
            loadComponent: () => import('./steps/financial-analysis.component').then(c => c.FinancialAnalysisComponent),
            title: 'Financial Profile - Funding Application'
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

// ===============================
// MIGRATION NOTES
// ===============================

/*
ROUTE MIGRATION PLAN:

Phase 1 (Current): Dual routes with redirects
- New routes: /profile/steps/company-info, /business-assessment, etc.
- Legacy routes: /profile/steps/admin, /business-review, etc. → redirect to new
- All existing bookmarks/links continue to work

Phase 2 (After 6 months): Remove legacy routes
- Remove all redirects
- Update any remaining internal links
- Remove commented OLD code

NEW NAMING CONVENTION FOR SME FUNDING:
✅ admin → company-info (Company Information)
✅ documents → documents (Supporting Documents) 
✅ business-review → business-assessment (Business Assessment)
✅ swot → swot-analysis (Strategic Analysis)
✅ management → management (Leadership & Governance)
✅ business-plan → business-strategy (Business Strategy)  
✅ financial → financial-profile (Financial Profile)

BENEFITS:
- Clearer intent for SME funding context
- Better SEO with descriptive URLs
- Professional terminology for business users
- Scalable naming for different application types
*/