
// // src/app/shared/guards/admin.guard.ts - Enhanced version
// import { Injectable, inject } from '@angular/core';
// import { CanActivate, CanActivateChild, Router } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { map, catchError, tap } from 'rxjs/operators';
// import { AuthService } from '../auth/production.auth.service';
 

// @Injectable({
//   providedIn: 'root'
// })
// export class AdminGuard implements CanActivate, CanActivateChild {
//   private authService = inject(AuthService);
//   private router = inject(Router);

//   canActivate(): Observable<boolean> {
//     return this.checkAdminAccess();
//   }

//   canActivateChild(): Observable<boolean> {
//     return this.checkAdminAccess();
//   }

//   private checkAdminAccess(): Observable<boolean> {
//     const user = this.authService.user();

//     if (!user) {
//       console.log('AdminGuard: No authenticated user, redirecting to login');
//       this.router.navigate(['/login']);
//       return of(false);
//     }

//     if (user.email == 'zivaigwe@gmail.com') {
//       console.log('AdminGuard: User lacks admin privileges, redirecting to dashboard');
//       this.router.navigate(['/dashboard']);
//       return of(false);
//     }

//     console.log('AdminGuard: Admin access granted for:', user.email);
//     return of(true);
//   }
// }

// // Update src/app/app.routes.ts to include proper admin routes
// /*
// Replace the admin route in your main app.routes.ts with:

// {
//   path: 'admin',
//   canActivate: [AuthGuard, AdminGuard],
//   canActivateChild: [AdminGuard],
//   loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
//   data: { requiresAdmin: true }
// },
// */

// // // src/app/guards/role.guard.ts - Enhanced to support admin role
// // import { Injectable, inject } from '@angular/core';
// // import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
// // import { Observable, of } from 'rxjs';
// // import { AuthService } from '../auth/production.auth.service';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class RoleGuard implements CanActivate {
// //   private authService = inject(AuthService);
// //   private router = inject(Router);

// //   canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
// //     const user = this.authService.user();
    
// //     if (!user) {
// //       this.router.navigate(['/login']);
// //       return of(false);
// //     }

// //     // Check if route requires specific roles
// //     const requiredRoles = route.data?.['roles'] as string[];
// //     const requiresAdmin = route.data?.['requiresAdmin'] as boolean;
// //     const requiresFunder = route.data?.['requiresFunder'] as boolean;

// //     // Admin access
// //     if (requiresAdmin && user.userType !== 'admin') {
// //       this.router.navigate(['/dashboard']);
// //       return of(false);
// //     }

// //     // Funder access  
// //     if (requiresFunder && user.userType !== 'funder') {
// //       this.router.navigate(['/dashboard']);
// //       return of(false);
// //     }

// //     // General role check
// //     if (requiredRoles && !requiredRoles.includes(user.userType)) {
// //       this.router.navigate(['/dashboard']);
// //       return of(false);
// //     }

// //     // Admin can access funder routes too
// //     if (user.userType === 'admin' && (requiresFunder || requiredRoles?.includes('funder'))) {
// //       return of(true);
// //     }

// //     return of(true);
// //   }
// // }