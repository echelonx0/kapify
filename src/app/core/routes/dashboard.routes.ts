import { Routes } from '@angular/router';
import { ActivityLogsComponent } from '../../features/activity-logs/activity-logs.component';
import { NotificationsInboxComponent } from '../../features/notifications/notifications-inbox.component';
import { AIReportsComponent } from 'src/app/features/reports/ai-reports/ai-reports.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../dashboard/dashboard-layout.component').then(
        (c) => c.DashboardLayoutComponent
      ),
    children: [
      // Default route
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'notifications',
        component: NotificationsInboxComponent,
      },

      {
        path: 'logs',
        component: ActivityLogsComponent,
      },

      {
        path: 'reports',
        component: AIReportsComponent,
      },
      // Dashboard routes
      {
        path: 'home',
        loadComponent: () =>
          import(
            '../dashboard/kapify-dashboard/kapify-dashboard.component'
          ).then((c) => c.KapifyDashboard),
        title: 'Dashboard - Kapify',
      },
      {
        path: 'welcome',
        loadComponent: () =>
          import('../landing/welcome/welcome-screen.component').then(
            (c) => c.WelcomeScreenComponent
          ),
        title: 'Welcome - Kapify',
      },
      {
        path: 'faqs',
        loadComponent: () =>
          import('../components/faq/dashboard-faqs.component').then(
            (c) => c.DashboardFAQsComponent
          ),
        title: 'FAQs - Kapify',
      },
      // ===============================rev=============================================
      // 🆕 GUIDES ROUTE
      // ============================================================================
      {
        path: 'guides',
        loadComponent: () =>
          import('../../shared/user-guides/user-guides.component').then(
            (c) => c.UserGuidesComponent
          ),
        title: 'Funding Readiness Guide - Kapify',
      },

      // Other routes
      {
        path: 'profile',
        loadChildren: () =>
          import('../../profiles/SME-Profiles/profile.routes').then(
            (m) => m.profileRoutes
          ),
      },
      {
        path: 'funding-opportunities',
        loadComponent: () =>
          import(
            '../../funding/marketplace/opportunities-list/funding-opportunities.component'
          ).then((c) => c.FundingOpportunitiesComponent),
        title: 'Funding Opportunities - Kapify',
      },
      {
        path: 'funder-dashboard',
        loadComponent: () =>
          import('../../funder/dashboard/funder-dashboard.component').then(
            (c) => c.FunderDashboardComponent
          ),
        title: 'Funder Dashboard - Kapify',
      },

      {
        path: 'resources',
        loadComponent: () =>
          import(
            '../../shared/components/learning-resources/learning-resources.component'
          ).then((m) => m.LearningResourcesComponent),
        title: 'Resources - Kapify',
      },
      {
        path: 'kapify-academy',
        loadComponent: () =>
          import('../../features/kapify-academy/kapify-academy.component').then(
            (m) => m.KapifyAcademyComponent
          ),
        title: 'Resources - Kapify',
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('../dashboard/settings/settings.component').then(
            (c) => c.SettingsComponent
          ),
        title: 'Organization Settings',
      },
      // Dashboard 404 - redirect to main 404
      {
        path: '**',
        redirectTo: '/404',
      },
    ],
  },
];
