// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component'; 
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RegisterComponent } from './auth/register/register.component';
import { ProfileCompletionGuard } from './guards/profile-completion.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Public routes
  { 
    path: '', 
    component: LandingComponent,
    title: 'Kapify - Smart Funding for South African SMEs'
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

  // Admin routes (MOVE THIS UP - before other protected routes)
  {
    path: 'administrator',
    // canActivate: [AuthGuard],
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

  // Funder routes (lazy-loaded group)
  {
    path: 'funder',
    canActivate: [AuthGuard, RoleGuard],
    loadChildren: () => import('./funder/funder.routes').then(m => m.funderRoutes)
  },
 
  // Catch all (ALWAYS LAST)
  { path: '**', redirectTo: '', pathMatch: 'full' }
];