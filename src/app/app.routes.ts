// src/app/app.routes.ts - FIXED ROUTING STRUCTURE
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
  
  // Protected routes (require authentication)
  { 
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  
  // Profile routes - CONSISTENT STRUCTURE
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./applications/profile/profile.routes').then(m => m.profileRoutes),
    title: 'Profile Setup - Kapify'
  },
  
  // Applications routes - REVENUE FOCUSED
  {
    path: 'applications',
    canActivate: [AuthGuard],
    loadChildren: () => import('./applications/applications.routes').then(m => m.applicationRoutes)
  },
  
  // Funding routes - CORE REVENUE PATH
  {
    path: 'funding',
    canActivate: [AuthGuard, ProfileCompletionGuard],
    loadChildren: () => import('./funding/funding.routes').then(m => m.fundingRoutes)
  },
  
  // DIRECT REVENUE-GENERATING ROUTES
  {
    path: 'funding-opportunities',
    canActivate: [AuthGuard], 
    loadComponent: () => import('./funding/funding-opportunities.component').then(c => c.FundingOpportunitiesComponent),
    title: 'Funding Opportunities - Kapify'
  },
  {
    path: 'funder-dashboard',
    canActivate: [AuthGuard, RoleGuard],
    loadComponent: () => import('./funder/funder-dashboard.component').then(c => c.FunderDashboardComponent),
    title: 'Funder Dashboard - Kapify'
  },
  
  // Catch all - redirect to home
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

 
