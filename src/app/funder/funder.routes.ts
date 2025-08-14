// src/app/funder/funder.routes.ts - UPDATED WITH SPLIT COMPONENTS
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
          import('./create-opportunity.component').then(m => m.OpportunityFormComponent)
      },
      {
        path: 'opportunities/:id',
        loadComponent: () =>
          import('../funding/funding-detail.component').then(m => m.OpportunityDetailsComponent)
      }
    ]
  }
];

/* 
UPDATED ROUTING FLOW - PROPERLY SEPARATED:

1. /funder/onboarding/welcome
   └── Shows overall progress and determines which step to route to
   └── "Start Setup" → organization-info
   └── "Continue" → next incomplete step

2. /funder/onboarding/organization-info  (STEP 1)
   └── BasicInfoFormComponent
   └── Fields: name, type, description, email, phone, website
   └── Validation: All required fields complete
   └── "Continue" → legal-compliance

3. /funder/onboarding/legal-compliance  (STEP 2)
   └── LegalInfoFormComponent  
   └── Fields: legal name, reg number, address, scale info
   └── Validation: Legal name + reg number + address complete
   └── "Continue" → verification

4. /funder/onboarding/verification  (STEP 3)
   └── VerificationFormComponent
   └── Review data + submit for verification
   └── "Submit" → dashboard (verified status)
   └── "Skip" → dashboard (unverified status)

COMPONENT FILE MAPPING:
┌─────────────────────────────────────────────────────────────────┐
│ Route                          │ Component File                  │
├─────────────────────────────────────────────────────────────────┤
│ /funder/onboarding/welcome     │ funder-organization-           │
│                                │ onboarding.component.ts        │
├─────────────────────────────────────────────────────────────────┤
│ /funder/onboarding/            │ basic-info-form.component.ts   │
│ organization-info              │ (NEW - Step 1 only)           │
├─────────────────────────────────────────────────────────────────┤
│ /funder/onboarding/            │ legal-info-form.component.ts   │
│ legal-compliance               │ (NEW - Step 2 only)           │
├─────────────────────────────────────────────────────────────────┤
│ /funder/onboarding/            │ verification-form.component.ts │
│ verification                   │ (NEW - Step 3 only)           │
└─────────────────────────────────────────────────────────────────┘

SIDEBAR NAVIGATION WILL:
- Show 3 distinct steps with proper completion status
- Allow navigation between completed steps
- Lock future steps until prerequisites are met
- Show accurate progress percentage (33%, 66%, 100%)

VALIDATION SEPARATION:
- Step 1: name + description + type + email + phone = 33% complete
- Step 2: legal name + reg number + address = 66% complete  
- Step 3: verification submitted = 100% complete
*/