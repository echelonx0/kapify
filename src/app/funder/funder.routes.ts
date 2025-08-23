// // src/app/funder/funder.routes.ts - UPDATED WITH SPLIT COMPONENTS
// import { Routes } from '@angular/router';

// export const funderRoutes: Routes = [
//   {
//     path: '',
//     loadComponent: () => import('./funder.component').then(m => m.FunderComponent),
//     children: [
//       { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
//       {
//         path: 'dashboard',
//         loadComponent: () => import('./funder-dashboard.component').then(m => m.FunderDashboardComponent)
//       },
      
//       // UPDATED: Onboarding with proper step separation
//       {
//         path: 'onboarding',
//         loadComponent: () => 
//           import('./components/org-onboarding-layout/org-onboarding-layout.component').then(m => m.OrganizationOnboardingLayoutComponent),
//         children: [
//           // Default route - redirect to welcome
//           { path: '', redirectTo: 'welcome', pathMatch: 'full' as const },
          
//           // Welcome/start screen - shows overall status and next steps
//           {
//             path: 'welcome',
//             loadComponent: () =>
//               import('./components/funder-organization-onboarding.component').then(m => m.OrganizationOnboardingComponent)
//           },
          
//           // STEP 1: Basic Information (name, type, description, contact)
//           {
//             path: 'organization-info',
//             loadComponent: () =>
//               import('./components/basic-info-form.component').then(m => m.BasicInfoFormComponent)
//           },
          
//           // STEP 2: Legal & Compliance (registration, address, scale)
//           {
//             path: 'legal-compliance',
//             loadComponent: () =>
//               import('./components/legal-info-form.component').then(m => m.LegalInfoFormComponent)
//           },
          
//           // STEP 3: Verification (review and submit)
//           {
//             path: 'verification',
//             loadComponent: () =>
//               import('./components/verification-form.component').then(m => m.VerificationFormComponent)
//           }
//         ]
//       },
      
//       {
//         path: 'opportunities/create',
//         loadComponent: () =>
//           import('./components/create-opportunity/create-opportunity.component').then(m => m.CreateOpportunityComponent)
//       },
//       {
//         path: 'opportunities/:id',
//         loadComponent: () =>
//           import('../funding/funding-detail.component').then(m => m.OpportunityDetailsComponent)
//       }
//     ]
//   }
// ];
 
// src/app/funder/funder.routes.ts - UPDATED WITH APPLICATION MANAGEMENT
import { Routes } from '@angular/router';

export const funderRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./funder.component').then(m => m.FunderComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      {
        path: 'dashboard',
        loadComponent: () => import('./funder-dashboard.component').then(m => m.FunderDashboardComponent)
      },
      
      // UPDATED: Onboarding with proper step separation
      {
        path: 'onboarding',
        loadComponent: () => 
          import('./components/org-onboarding-layout/org-onboarding-layout.component').then(m => m.OrganizationOnboardingLayoutComponent),
        children: [
          // Default route - redirect to welcome
          { path: '', redirectTo: 'welcome', pathMatch: 'full' as const },
          
          // Welcome/start screen - shows overall status and next steps
          {
            path: 'welcome',
            loadComponent: () =>
              import('./components/funder-organization-onboarding.component').then(m => m.OrganizationOnboardingComponent)
          },
          
          // STEP 1: Basic Information (name, type, description, contact)
          {
            path: 'organization-info',
            loadComponent: () =>
              import('./components/basic-info-form.component').then(m => m.BasicInfoFormComponent)
          },
          
          // STEP 2: Legal & Compliance (registration, address, scale)
          {
            path: 'legal-compliance',
            loadComponent: () =>
              import('./components/legal-info-form.component').then(m => m.LegalInfoFormComponent)
          },
          
          // STEP 3: Verification (review and submit)
          {
            path: 'verification',
            loadComponent: () =>
              import('./components/verification-form.component').then(m => m.VerificationFormComponent)
          }
        ]
      },
      
      {
        path: 'opportunities/create',
        loadComponent: () =>
          import('./components/create-opportunity/create-opportunity.component').then(m => m.CreateOpportunityComponent)
      },
      {
        path: 'opportunities/:id',
        loadComponent: () =>
          import('../funding/funding-detail.component').then(m => m.OpportunityDetailsComponent)
      },

      // NEW: Application Management Route
      {
        path: 'opportunities/:opportunityId/applications',
        loadComponent: () =>
          import('./components/application-management.component').then(m => m.ApplicationManagementComponent),
        title: 'Manage Applications - Kapify'
      }
    ]
  }
];