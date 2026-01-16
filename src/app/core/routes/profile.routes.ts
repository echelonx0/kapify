// src/app/profile/profile.routes.ts
import { Routes } from '@angular/router';
import { UnsavedChangesGuard } from '../../profiles/SME-Profiles/guards/unsaved-changes.guard';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../profiles/SME-Profiles/profile-layout.component').then(
        (c) => c.ProfileLayoutComponent
      ),
    canDeactivate: [UnsavedChangesGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full' as 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import(
            '../../profiles/SME-Profiles/pages/profile-home/profile-home.component'
          ).then((c) => c.ProfileHomeComponent),
        title: 'Profile Overview - Kapify',
      },
      {
        path: 'review',
        loadComponent: () =>
          import(
            '../../profiles/SME-Profiles/pages/profile-review.component'
          ).then((c) => c.ReviewTabComponent),
        title: 'Profile Overview - Kapify',
      },
      {
        path: 'data-room',
        loadComponent: () =>
          import(
            'src/app/features/data-room/components/data-room-landing.component'
          ).then((c) => c.DataRoomLandingComponent),
        title: 'Data Room - Kapify',
      },
      // ===== NEW: COVER MANAGEMENT ROUTE =====
      {
        path: 'covers',
        loadComponent: () =>
          import(
            'src/app/fund-seeking-orgs/applications/applications-cover/funding-application-cover-management.component'
          ).then((c) => c.FundingApplicationCoverManagementComponent),
        title: 'Funding Covers - Kapify',
        data: {
          breadcrumb: 'Funding Covers',
          description: 'Create and manage funding profiles for opportunities',
        },
      },
      // ===== END NEW ROUTE =====
      {
        path: 'steps',
        loadComponent: () =>
          import(
            '../../profiles/SME-Profiles/steps/profile-steps-layout/profile-steps-layout.component'
          ).then((c) => c.ProfileStepsLayoutComponent),
        children: [
          {
            path: '',
            redirectTo: 'company-info',
            pathMatch: 'full' as 'full',
          },
          {
            path: 'company-info',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/company-info-step/company-info.component'
              ).then((c) => c.CompanyInfoComponent),
            title: 'Company Information - Funding Application',
          },
          {
            path: 'documents',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/documents-upload/supporting-documents-upload.component'
              ).then((c) => c.SupportingDocumentsUploadComponent),
            title: 'Supporting Documents - Funding Application',
          },
          {
            path: 'business-assessment',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/business-review/business-review.component'
              ).then((c) => c.BusinessReviewComponent),
            title: 'Business Assessment - Funding Application',
          },
          {
            path: 'swot-analysis',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/swot-analysis/swot-analysis.component'
              ).then((c) => c.SWOTAnalysisComponent),
            title: 'Strategic Analysis - Funding Application',
          },
          {
            path: 'management',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/governance/management-governance.component'
              ).then((c) => c.ManagementGovernanceComponent),
            title: 'Leadership & Governance - Funding Application',
          },
          {
            path: 'business-strategy',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/business-strategy/business-strategy.component'
              ).then((c) => c.BusinessPlanComponent),
            title: 'Business Strategy - Funding Application',
          },
          {
            path: 'financial-profile',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/financial-analysis/financial-analysis.component'
              ).then((c) => c.SMEFinancialprofileComponent),
            title: 'Financial Profile - Funding Application',
          },
          {
            path: 'review',
            loadComponent: () =>
              import(
                '../../profiles/SME-Profiles/steps/review/profile-review.component'
              ).then((c) => c.ProfileReviewComponent),
            title: 'Review & Analysis - Funding Application',
          },
        ],
      },
    ],
  },
];
