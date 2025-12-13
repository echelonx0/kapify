import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RegisterComponent } from './auth/register/register.component';
import { ProfileCompletionGuard } from './guards/profile-completion.guard';
import { RoleGuard } from './guards/role.guard';
import { FundingOpportunitiesComponent } from './marketplace/opportunities-list/funding-opportunities.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { SuccessPageComponent } from './shared/components/success-page/success-page.component';
import { VersionInfoComponent } from './shared/components/version-info.component';
import { PricingPageComponent } from './dashboard/finance/pricing-page/pricing-page.component';
import { PublicProfileViewComponent } from './SMEs/profile/public-page/public-profile.component';
import { AcceptInvitationComponent } from './auth/accept-invitation/accept-invitation.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { CreditsComponent } from './credit-system/credit-component/credit.component';

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

  // In your auth routes array:
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
      import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
  // Protected routes (require authentication)
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
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
      import('./SMEs/profile/profile.routes').then((m) => m.profileRoutes),
    title: 'Profile Setup - Kapify',
  },

  // Applications routes
  {
    path: 'applications',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./SMEs/applications/applications.routes').then(
        (m) => m.applicationRoutes
      ),
  },

  {
    path: 'finance',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard/finance/finance.routes').then((m) => m.financeRoutes),
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
      import('./funding/funding.routes').then((m) => m.fundingRoutes),
  },

  //  Funder routes (SPECIFIC) come FIRST
  {
    path: 'funder',
    canActivate: [AuthGuard, RoleGuard],
    loadChildren: () =>
      import('./funder/funder.routes').then((m) => m.funderRoutes),
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

  {
    path: 'test/parser',
    loadComponent: () =>
      import('./test/parser-test.component').then((m) => m.ParserTestComponent),
    title: 'Excel Parser Test',
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
