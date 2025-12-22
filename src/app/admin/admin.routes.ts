// src/app/admin/admin.routes.ts - UPDATED with AI Management routes
import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => {
      console.log('Loading AdminLayoutComponent...');
      return import('./admin-layout/admin-layout.component').then((m) => {
        console.log('AdminLayoutComponent loaded:', m.AdminLayoutComponent);
        return m.AdminLayoutComponent;
      });
    },
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => {
          console.log('Loading AdminDashboardComponent...');
          return import('./dashboard/admin-dashboard.component').then((m) => {
            console.log(
              'AdminDashboardComponent loaded:',
              m.AdminDashboardComponent
            );
            return m.AdminDashboardComponent;
          });
        },
        title: 'Admin Dashboard - Kapify',
      },
      {
        path: 'verification',
        loadComponent: () => {
          console.log('Loading OrganizationVerificationComponent...');
          return import(
            './organization-verification/organization-verification.component'
          ).then((m) => {
            console.log(
              'OrganizationVerificationComponent loaded:',
              m.OrganizationVerificationComponent
            );
            return m.OrganizationVerificationComponent;
          });
        },
        title: 'Organization Verification - Kapify Admin',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reports/reports.component').then((m) => m.ReportsComponent),
        title: 'Reports - Kapify Admin',
      },

      {
        path: 'constants',
        loadComponent: () => {
          console.log('Loading ConstantsManagementComponent...');
          return import(
            './dashboard/components/management-component/constants-management.component'
          ).then((m) => {
            console.log(
              'ConstantsManagementComponent loaded:',
              m.ConstantsManagementComponent
            );
            return m.ConstantsManagementComponent;
          });
        },
        title: 'Constants Management - Kapify Admin',
      },
      {
        path: 'credit-costs',
        loadComponent: () => {
          console.log('Loading CreditCostsManagementComponent...');
          return import(
            './credit-costs/credit-costs-management.component'
          ).then((m) => {
            console.log(
              'CreditCostsManagementComponent loaded:',
              m.CreditCostsManagementComponent
            );
            return m.CreditCostsManagementComponent;
          });
        },
        title: 'Credit Costs - Kapify Admin',
      },
      {
        path: 'back-office-questions',
        loadComponent: () => {
          console.log('Loading BackOfficeQuestionsManagementComponent...');
          return import(
            './dashboard/components/management-component/back-office-form-questions-mgmt.component'
          ).then((m) => {
            console.log(
              'BackOfficeQuestionsManagementComponent loaded:',
              m.BackOfficeQuestionsManagementComponent
            );
            return m.BackOfficeQuestionsManagementComponent;
          });
        },
        title: 'Back Office Questions - Kapify Admin',
      },
      {
        path: 'fund-financial-terms',
        loadComponent: () => {
          console.log('Loading FundFinancialTermsManagementComponent...');
          return import(
            './dashboard/components/management-component/financial-terms-manager.component'
          ).then((m) => {
            console.log(
              'FundFinancialTermsManagementComponent loaded:',
              m.FundFinancialTermsManagementComponent
            );
            return m.FundFinancialTermsManagementComponent;
          });
        },
        title: 'Fund Financial Terms - Kapify Admin',
      },

      // ============================================================================
      // 🆕 AI MANAGEMENT ROUTES
      // ============================================================================
      {
        path: 'ai-management',
        children: [
          {
            path: '',
            redirectTo: 'services',
            pathMatch: 'full',
          },
          {
            path: 'services',
            loadComponent: () => {
              console.log('Loading AiServicesRegistryComponent...');
              return import(
                './ai-management/ai-services-registry.component'
              ).then((m) => {
                console.log(
                  'AiServicesRegistryComponent loaded:',
                  m.AiServicesRegistryComponent
                );
                return m.AiServicesRegistryComponent;
              });
            },
            title: 'AI Services - Kapify Admin',
          },
          {
            path: 'services/:id',
            loadComponent: () => {
              console.log('Loading AiServiceDetailComponent...');
              return import('./ai-management/ai-service-detail.component').then(
                (m) => {
                  console.log(
                    'AiServiceDetailComponent loaded:',
                    m.AiServiceDetailComponent
                  );
                  return m.AiServiceDetailComponent;
                }
              );
            },
            title: 'AI Service Detail - Kapify Admin',
          },
        ],
      },
    ],
  },
];
