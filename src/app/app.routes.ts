// src/app/app.routes.ts - Final routing setup
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
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Dashboard - Kapify'
  },
  
  // TODO: Lazy-loaded feature modules (future)
//   {
//     path: 'profile',
//     canActivate: [AuthGuard],
//     loadChildren: () => import('./profile/profile.routes').then(m => m.profileRoutes)
//   },
//   {
//     path: 'applications',
//     canActivate: [AuthGuard],
//     loadChildren: () => import('./applications/applications.routes').then(m => m.applicationRoutes)
//   },
//   {
//     path: 'funding',
//     canActivate: [AuthGuard],
//     loadChildren: () => import('./funding/funding.routes').then(m => m.fundingRoutes)
//   },
  
//   // Funder portal (future)
//   {
//     path: 'funder',
//     loadChildren: () => import('./funder/funder.routes').then(m => m.funderRoutes)
//   },
  
//   // Public pages
//   {
//     path: 'about',
//     loadComponent: () => import('./pages/about.component').then(c => c.AboutComponent),
//     title: 'About Us - Kapify'
//   },
//   {
//     path: 'contact',
//     loadComponent: () => import('./pages/contact.component').then(c => c.ContactComponent),
//     title: 'Contact Us - Kapify'
//   },
//   {
//     path: 'terms',
//     loadComponent: () => import('./pages/terms.component').then(c => c.TermsComponent),
//     title: 'Terms of Service - Kapify'
//   },
//   {
//     path: 'privacy',
//     loadComponent: () => import('./pages/privacy.component').then(c => c.PrivacyComponent),
//     title: 'Privacy Policy - Kapify'
//   },
//   {
//     path: 'faq',
//     loadComponent: () => import('./pages/faq.component').then(c => c.FaqComponent),
//     title: 'FAQ - Kapify'
//   },
  
  // Catch all - redirect to home
  { path: '**', redirectTo: '', pathMatch: 'full' }
];