import { Routes } from '@angular/router';
import { LandingComponent } from './core/landing/landing.component';
import { LoginComponent } from './auth/login/login.component';

import { RegisterComponent } from './auth/register/register.component';

import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { SuccessPageComponent } from './shared/components/success-page/success-page.component';
import { VersionInfoComponent } from './shared/components/version-info.component';
import { PricingPageComponent } from './core/dashboard/finance/pricing-page/pricing-page.component';
import { AcceptInvitationComponent } from './auth/accept-invitation/accept-invitation.component';
import { InvoiceComponent } from './features/invoice/invoice.component';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';
import { ProfileCompletionGuard } from './core/guards/profile-completion.guard';
import { RoleGuard } from './core/guards/role.guard';
import { PasswordResetComponent } from './auth/password-reset/password-reset.component';
import { PublicProfileViewComponent } from './profiles/SME-Profiles/public-page/public-profile.component';
import { CreditsComponent } from './features/credit-system/credit-component/credit.component';
import { FundingOpportunitiesComponent } from './funding/marketplace/opportunities-list/funding-opportunities.component';

export const routes: Routes = [
  // Public routes
  {
    path: '',
    component: LandingComponent,
    title: 'Kapify - Smart Funding for South African SMEs',
  },

  {
    path: 'pricing',
    component: PricingPageComponent,
    title: 'Pricing - Kapify',
  },

  {
    path: 'marketplace',
    component: FundingOpportunitiesComponent,
    title: 'Funding Opportunities - Kapify',
  },

  // PUBLIC: Shareable opportunity link (NO auth required)
  {
    path: 'opportunity/:id',
    loadComponent: () =>
      import('./funding/public-opportunity/public-opportunity.component').then(
        (m) => m.PublicOpportunityComponent
      ),
    title: 'Funding Opportunity - Kapify',
  },
  {
    path: 'invest/:slug',
    component: PublicProfileViewComponent,
  },
  // Auth routes (only accessible when not logged in)
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    title: 'Sign In - Kapify',
  },

  {
    path: 'faqs',
    loadComponent: () =>
      import('./core/components/faq/faq.component').then(
        (c) => c.FAQsComponent
      ),
    title: 'FAQs - Kapify',
  },

  {
    path: 'passwordreset',
    component: PasswordResetComponent,
    canActivate: [GuestGuard], // Allow only unauthenticated users
    title: 'Reset Password - Kapify',
  },
  {
    path: 'auth/accept-invitation',
    component: AcceptInvitationComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [GuestGuard],
    title: 'Create Account - Kapify',
  },

  {
    path: 'version-info',
    component: VersionInfoComponent,
    title: 'Version Information',
  },

  // Admin routes
  {
    path: 'administrator',
    loadChildren: () =>
      import('./core/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
  },
  {
    path: 'executive-application-form',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import(
        './core/admin/executive-applications/executive-application-form.component'
      ).then((m) => m.ExecutiveApplicationFormComponent),
  },
  // Protected routes (require authentication)
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./core/routes/dashboard.routes').then((m) => m.dashboardRoutes),
  },

  // Success pages for major actions
  {
    path: 'success/:type',
    component: SuccessPageComponent,
    title: 'Success',
  },
  {
    path: 'success/:type/:id',
    component: SuccessPageComponent,
    title: 'Success',
  },

  // Profile routes
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./profiles/SME-Profiles/profile.routes').then(
        (m) => m.profileRoutes
      ),
    title: 'Profile Setup - Kapify',
  },

  // Applications routes
  {
    path: 'applications',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./fund-seeking-orgs/applications/applications.routes').then(
        (m) => m.applicationRoutes
      ),
  },

  {
    path: 'finance',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./core/dashboard/finance/finance.routes').then(
        (m) => m.financeRoutes
      ),
  },

  {
    path: 'invoice',
    component: InvoiceComponent,
    canActivate: [AuthGuard],
    title: 'Invoices - Kapify',
  },

  // Funding routes
  {
    path: 'funding',
    canActivate: [AuthGuard, ProfileCompletionGuard],
    loadChildren: () =>
      import('./core/routes/funding.routes').then((m) => m.fundingRoutes),
  },

  //  Funder routes (SPECIFIC) come FIRST
  {
    path: 'funder',
    canActivate: [AuthGuard, RoleGuard],
    loadChildren: () =>
      import('./core/routes/funder.routes').then((m) => m.funderRoutes),
  },

  //  Public funder profile (PARAMETERIZED)
  {
    path: 'funder/:slug',
    loadComponent: () =>
      import('./funder/public-profile/public-profile.component').then(
        (m) => m.FunderProfileComponent
      ),
    title: 'Funder Profile - Kapify',
  },

  // 404 Page - MUST come before catch-all
  {
    path: '404',
    component: NotFoundComponent,
    title: 'Page Not Found - Kapify',
  },

  {
    path: 'credits',
    component: CreditsComponent,
    canActivate: [AuthGuard],
    title: 'Buy Credits - Kapify',
  },

  // Catch all - redirect to 404
  {
    path: '**',
    redirectTo: '/404',
  },
];
