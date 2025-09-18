 

// src/app/funder/funder.routes.ts - UPDATED WITH PUBLIC PROFILE MANAGEMENT
import { Routes } from '@angular/router';

export const funderRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./funder.component').then(m => m.FunderComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/funder-dashboard.component').then(m => m.FunderDashboardComponent)
      },
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
              import('./onboarding-welcome/funder-organization-onboarding.component').then(m => m.OrganizationOnboardingComponent)
          },
          
          // STEP 1: Basic Information (name, type, description, contact)
          {
            path: 'organization-info',
            loadComponent: () =>
              import('./components/basic-info/basic-info-form.component').then(m => m.BasicInfoFormComponent)
          },
          
          // STEP 2: Legal & Compliance (registration, address, scale)
          {
            path: 'legal-compliance',
            loadComponent: () =>
              import('./components/legal-info/legal-info.component').then(m => m.LegalInfoFormComponent)
          },
          
          // STEP 3: Verification (review and submit)
          {
            path: 'verification',
            loadComponent: () =>
              import('./components/verification/verification.component').then(m => m.VerificationFormComponent)
          }
        ]
      },
      // NEW: Public Profile Management Route
      {
        path: 'create-profile',
        loadComponent: () =>
          import('./public-profile-management/public-profile-management.component').then(m => m.PublicProfileManagementComponent),
        title: 'Public Profile - Kapify'
      },
      {
        path: 'opportunities/import',
        loadComponent: () =>
          import('./create-opportunity/import-opportunity/import-opportunity-container.component').then(m => m.ImportOpportunityContainerComponent)
      },   
      {
        path: 'opportunities/create',
        loadComponent: () =>
          import('./create-opportunity/create-opportunity.component').then(m => m.CreateOpportunityComponent)
      },
      
      {
        path: 'opportunities/:id',
        loadComponent: () =>
          import('../funding/funding-detail.component').then(m => m.OpportunityDetailsComponent)
      },
      {
        path: 'opportunities/:opportunityId/applications',
        loadComponent: () =>
          import('./components/applications-management/application-management.component').then(m => m.ApplicationManagementComponent),
        title: 'Manage Applications - Kapify'
      },
       {
        path: 'applications/:applicationId',
        loadComponent: () =>
          import('./application-details/application-detail.component').then(m => m.ApplicationDetailComponent),
        title: 'Application Details - Kapify'
      }
    ]
  }
];