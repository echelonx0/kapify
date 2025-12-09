// // src/app/admin/admin.routes.ts
// import { Routes } from '@angular/router';
// import { AuthGuard } from '../guards/auth.guard';

// export const adminRoutes: Routes = [
//   {
//     path: '',
//     loadComponent: () => {
//       console.log('Loading AdminLayoutComponent...');
//       return import('./admin-layout/admin-layout.component').then((m) => {
//         console.log('AdminLayoutComponent loaded:', m.AdminLayoutComponent);
//         return m.AdminLayoutComponent;
//       });
//     },
//     canActivate: [AuthGuard],
//     children: [
//       { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
//       {
//         path: 'dashboard',
//         loadComponent: () => {
//           console.log('Loading AdminDashboardComponent...');
//           return import('./dashboard/admin-dashboard.component').then((m) => {
//             console.log(
//               'AdminDashboardComponent loaded:',
//               m.AdminDashboardComponent
//             );
//             return m.AdminDashboardComponent;
//           });
//         },
//         title: 'Admin Dashboard - Kapify',
//       },
//       {
//         path: 'verification',
//         loadComponent: () => {
//           console.log('Loading OrganizationVerificationComponent...');
//           return import(
//             './organization-verification/organization-verification.component'
//           ).then((m) => {
//             console.log(
//               'OrganizationVerificationComponent loaded:',
//               m.OrganizationVerificationComponent
//             );
//             return m.OrganizationVerificationComponent;
//           });
//         },
//         title: 'Organization Verification - Kapify Admin',
//       },
//       {
//         path: 'constants',
//         loadComponent: () => {
//           console.log('Loading ConstantsManagementComponent...');
//           return import(
//             './dashboard/components/management-component/constants-management.component'
//           ).then((m) => {
//             console.log(
//               'ConstantsManagementComponent loaded:',
//               m.ConstantsManagementComponent
//             );
//             return m.ConstantsManagementComponent;
//           });
//         },
//         title: 'Constants Management - Kapify Admin',
//       },
//     ],
//   },
// ];

// src/app/admin/admin.routes.ts
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
    ],
  },
];
