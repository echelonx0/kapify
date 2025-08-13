 
// src/app/funder/funder.routes.ts
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
      
      // UPDATED: Onboarding with layout and child routes
      {
        path: 'onboarding',
        loadComponent: () => 
          import('./components/org-onboarding-layout/org-onboarding-layout.component').then(m => m.OrganizationOnboardingLayoutComponent),
        children: [
          // Default route - redirect to welcome or first incomplete step
          { path: '', redirectTo: 'welcome', pathMatch: 'full' as const },
          
          // Welcome/start screen
          {
            path: 'welcome',
            loadComponent: () =>
              import('./components/funder-organization-onboarding.component').then(m => m.OrganizationOnboardingComponent)
          },
          
          // Step 1: Organization Information
          {
            path: 'organization-info',
            loadComponent: () =>
              import('./components/organisation-information-form.component').then(m => m.OrganizationInfoFormComponent)
          },
          
          // Step 2: Legal & Compliance Details
          // {
          //   path: 'legal-compliance',
          //   loadComponent: () =>
          //     import('./components/legal-compliance-form.component').then(m => m.LegalComplianceFormComponent)
          // },
          
          // // Step 3: Verification
          // {
          //   path: 'verification',
          //   loadComponent: () =>
          //     import('./components/verification.component').then(m => m.VerificationComponent)
          // },
          
          // // Success/completion states
          // {
          //   path: 'complete',
          //   loadComponent: () =>
          //     import('./components/onboarding-complete.component').then(m => m.OnboardingCompleteComponent)
          // }
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
ROUTING FLOW:

1. User visits /funder/onboarding
   └── Redirects to /funder/onboarding/welcome
   └── Layout loads with welcome screen in <router-outlet>

2. User clicks "Start Setup" or sidebar navigation
   └── Navigates to /funder/onboarding/organization-info
   └── Layout stays, form loads in <router-outlet>

3. User completes step and clicks "Continue"
   └── Navigates to /funder/onboarding/legal-compliance
   └── Layout stays, next form loads

4. User completes all steps
   └── Navigates to /funder/onboarding/verification or /complete
   └── Layout stays, completion screen loads

LAYOUT COMPONENT STRUCTURE:
┌─────────────────────────────────────────────────────┐
│ OrganizationOnboardingLayoutComponent               │
│ ┌─────────────┐  ┌──────────────────────────────┐   │
│ │   SIDEBAR   │  │      <router-outlet>         │   │
│ │             │  │                              │   │
│ │ ├─ Welcome  │  │  Current route content:      │   │
│ │ ├─ Org Info │  │  • OrganizationOnboarding    │   │
│ │ ├─ Legal    │  │  • OrganizationInfoForm      │   │
│ │ └─ Verify   │  │  • LegalComplianceForm       │   │
│ │             │  │  • VerificationComponent     │   │
│ │ Progress    │  │  • OnboardingComplete        │   │
│ │ Save btn    │  │                              │   │
│ └─────────────┘  └──────────────────────────────┘   │
│                                                     │
│ Footer with Back/Continue buttons                   │
└─────────────────────────────────────────────────────┘

COMPONENTS YOU NEED TO CREATE:
✅ OrganizationOnboardingLayoutComponent (already created)
✅ OrganizationInfoFormComponent (already created)
❌ LegalComplianceFormComponent (needs to be created)
❌ VerificationComponent (needs to be created)
❌ OnboardingCompleteComponent (needs to be created)

NAVIGATION METHODS IN LAYOUT:
- goToStep(stepId) → this.router.navigate(['/funder/onboarding', stepId])
- saveAndContinue() → save data, then navigate to next step
- previousStep() → navigate to previous step in sequence
*/