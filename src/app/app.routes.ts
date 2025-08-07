// 2. src/app/app.routes.ts - ADD PROFILE AND DASHBOARD ROUTES
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RegisterComponent } from './auth/register.component';

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
  
  // Protected routes (require authentication)
  { 
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  
  // Profile routes - FIXED IMPORT
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./profile/profile.routes').then(m => m.profileRoutes),
    title: 'Profile Setup - Kapify'
  },
  
  // NEW: Additional dashboard routes for different user types
  // {
  //   path: 'applications',
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./applications/applications.component').then(c => c.ApplicationsComponent),
  //   title: 'My Applications - Kapify'
  // },
  {
    path: 'funding-opportunities',
    canActivate: [AuthGuard], 
    loadComponent: () => import('./funding/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent),
    title: 'Funding Opportunities - Kapify'
  },
  {
    path: 'funder-dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./funder/funder-dashboard.component').then(c => c.FunderDashboardComponent),
    title: 'Funder Dashboard - Kapify'
  },
  
  // Catch all - redirect to home
  { path: '**', redirectTo: '', pathMatch: 'full' }
];