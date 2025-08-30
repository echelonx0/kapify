// src/app/admin/admin.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => {
      console.log('Loading AdminLayoutComponent...');
      return import('./admin-layout.component').then(m => {
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
          return import('./dashboard/admin-dashboard.component').then(m => {
            console.log('AdminDashboardComponent loaded:', m.AdminDashboardComponent);
            return m.AdminDashboardComponent;
          });
        },
        title: 'Admin Dashboard - Kapify'
      },

      //   {
      //   path: 'admin',
      //   loadComponent: async () => {
      //     console.log('Loading AdminDashboardComponent...');
      //     const m = await import('./dashboard/admin.component');
      //     console.log('AdminDashboardComponent loaded:', m.KapifyAdminDashboard);
      //     return m.KapifyAdminDashboard;
      //   },
      //   title: 'Admin Dashboard - Kapify'
      // }
    ]
  }
];