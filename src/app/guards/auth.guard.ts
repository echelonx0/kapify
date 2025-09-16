 
 

// // src/app/core/guards/auth.guard.ts - SUPABASE PRODUCTION
// import { Injectable, inject } from '@angular/core';
// import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { map, take, tap, catchError } from 'rxjs/operators';
// import { AuthService } from '../auth/production.auth.service';
 

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthGuard implements CanActivate {
//   private authService = inject(AuthService);
//   private router = inject(Router);

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean> {
//     return this.authService.isAuthenticated$.pipe(
//       take(1),
//       map(isAuthenticated => {
//         if (isAuthenticated) {
//           return true;
//         }

//         // Store the attempted URL for redirecting after login
//         this.router.navigate(['/auth/login'], {
//           queryParams: { returnUrl: state.url }
//         });
        
//         return false;
//       }),
//       catchError(error => {
//         console.error('Auth guard error:', error);
//         this.router.navigate(['/auth/login']);
//         return of(false);
//       })
//     );
//   }
// }

// // Guest Guard - prevents authenticated users from accessing auth pages
// @Injectable({
//   providedIn: 'root'
// })
// export class GuestGuard implements CanActivate {
//   private authService = inject(AuthService);
//   private router = inject(Router);

//   canActivate(): Observable<boolean> {
//     return this.authService.isAuthenticated$.pipe(
//       take(1),
//       map(isAuthenticated => {
//         if (!isAuthenticated) {
//           return true;
//         }

//         // Redirect authenticated users to dashboard
//         this.router.navigate(['/profile/steps']);
//         return false;
//       })
//     );
//   }
// }


// Then simplify your AuthGuard:
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../auth/production.auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log('AuthGuard: Checking access to:', state.url);

    return this.authService.canActivateRoute().pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('AuthGuard: Access granted');
          return true;
        }

        console.log('AuthGuard: Access denied, redirecting to login');
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        
        return false;
      }),
      catchError(error => {
        console.error('Auth guard error:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}