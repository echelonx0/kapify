// Then simplify your AuthGuard:
import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.canActivateRoute().pipe(
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true;
        }

        this.router.navigate(['/login'], {
          queryParams: { returnUrl: state.url },
        });

        return false;
      }),
      catchError((error) => {
        console.error('Auth guard error:', error);
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
