 


// 2. Fixed app.routes.ts
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

export const routes: Routes = [
  // Public routes
  { 
    path: '', 
    component: LandingComponent,
    title: 'Kapify - Smart Funding for South African SMEs'
  },

  // Public marketplace (no authentication required)
  { 
    path: 'marketplace', 
    component: FundingOpportunitiesComponent,
    title: 'Funding Opportunities - Kapify'
  },

  // Auth routes (only accessible when not logged in)
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [GuestGuard],
    title: 'Sign In - Kapify'
  },
  { 
    path: 'register', 
    component: RegisterComponent,
    canActivate: [GuestGuard],
    title: 'Create Account - Kapify'
  },

  // Admin routes
  {
    path: 'administrator',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },

  // Protected routes (require authentication)
  { 
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },

  // Profile routes
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./SMEs/profile/profile.routes').then(m => m.profileRoutes),
    title: 'Profile Setup - Kapify'
  },

  // Applications routes
  {
    path: 'applications',
    canActivate: [AuthGuard],
    loadChildren: () => import('./SMEs/applications/applications.routes').then(m => m.applicationRoutes)
  },

  // Funding routes
  {
    path: 'funding',
    canActivate: [AuthGuard, ProfileCompletionGuard],
    loadChildren: () => import('./funding/funding.routes').then(m => m.fundingRoutes)
  },

  // Funder routes
  {
    path: 'funder',
    canActivate: [AuthGuard, RoleGuard],
    loadChildren: () => import('./funder/funder.routes').then(m => m.funderRoutes)
  },

  // 404 Page - MUST come before catch-all
  {
    path: '404',
    component: NotFoundComponent,
    title: 'Page Not Found - Kapify'
  },

  // Catch all (ALWAYS LAST) - redirect to 404
  { 
    path: '**', 
    redirectTo: '/404'
  }
];
