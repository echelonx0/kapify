import { Routes } from '@angular/router';

export const funderRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../funder/funder.component').then((m) => m.FunderComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../funder/dashboard/funder-dashboard.component').then(
            (m) => m.FunderDashboardComponent
          ),
        title: 'Dashboard - Kapify',
      },
      // NEW: Global applications overview route
      // {
      //   path: 'applications',
      //   loadComponent: () =>
      //     import('./dashboard/tabs/overview-tab.component').then(
      //       (m) => m.FunderApplicationsOverviewComponent
      //     ),
      //   title: 'All Applications - Kapify',
      // },

      // In funder.routes.ts

      {
        path: 'allapplications',
        loadComponent: () =>
          import(
            '../../funder/application-details/funder-applications/applications-list/applications-list.component'
          ).then((m) => m.FunderApplicationsListComponent),
        title: 'All Applications - Kapify',
      },
      {
        path: 'applications',
        loadComponent: () =>
          import(
            '../../funder/application-details/funder-applications/funder-applications.component'
          ).then((m) => m.FunderApplicationsComponent),
        title: 'All Applications - Kapify',
      },
      {
        path: 'onboarding',
        loadComponent: () =>
          import(
            '../../funder/components/org-onboarding-layout/org-onboarding-layout.component'
          ).then((m) => m.OrganizationOnboardingLayoutComponent),
        children: [
          { path: '', redirectTo: 'welcome', pathMatch: 'full' as const },
          {
            path: 'welcome',
            loadComponent: () =>
              import(
                '../../profiles/Funder-Profile/funder-organization-onboarding.component'
              ).then((m) => m.OrganizationOnboardingComponent),
          },
          {
            path: 'organization-info',
            loadComponent: () =>
              import(
                '../../funder/components/basic-info/basic-info-form.component'
              ).then((m) => m.BasicInfoFormComponent),
          },
          {
            path: 'legal-compliance',
            loadComponent: () =>
              import(
                '../../funder/components/legal-info/legal-info.component'
              ).then((m) => m.LegalInfoFormComponent),
          },
          {
            path: 'verification',
            loadComponent: () =>
              import(
                '../../funder/components/verification/verification.component'
              ).then((m) => m.VerificationFormComponent),
          },
        ],
      },
      {
        path: 'create-profile',
        loadComponent: () =>
          import(
            '../../funder/public-profile-management/public-profile-management.component'
          ).then((m) => m.PublicProfileManagementComponent),
        title: 'Public Profile - Kapify',
      },
      {
        path: 'opportunities/import',
        loadComponent: () =>
          import(
            '../../funder/create-opportunity/import-opportunity/import-container.component'
          ).then((m) => m.ImportOpportunityContainerComponent),
      },
      {
        path: 'opportunities/create',
        loadComponent: () =>
          import(
            '../../funder/create-opportunity/create-opportunity.component'
          ).then((m) => m.CreateOpportunityComponent),
      },
      {
        path: 'opportunities/edit/:id',
        loadComponent: () =>
          import(
            '../../funder/create-opportunity/create-opportunity.component'
          ).then((m) => m.CreateOpportunityComponent),
      },
      // Per-opportunity applications management
      {
        path: 'opportunities/:opportunityId/applications',
        loadComponent: () =>
          import(
            '../../funder/applications-management/application-management.component'
          ).then((m) => m.ApplicationManagementComponent),
        title: 'Manage Applications - Kapify',
      },
      // Individual application details
      {
        path: 'applications/:applicationId',
        loadComponent: () =>
          import(
            '../../funder/application-details/funder-applications/application-details/application-detail.component'
          ).then((m) => m.ApplicationDetailComponent),
        title: 'Application Details - Kapify',
      },
    ],
  },
];
