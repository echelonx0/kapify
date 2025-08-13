// src/app/guards/organization.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../auth/production.auth.service';
import { FunderOnboardingService } from '../funder/services/funder-onboarding.service';
 
@Injectable({
  providedIn: 'root'
})
export class OrganizationRequiredGuard implements CanActivate {
  private router = inject(Router);
  private onboardingService = inject(FunderOnboardingService);
  private authService = inject(AuthService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const currentUser = this.authService.user();
    
    // Check if user is authenticated and is a funder
    if (!currentUser || currentUser.userType !== 'funder') {
      this.router.navigate(['/auth/login']);
      return of(false);
    }

    // Check organization status
    return this.onboardingService.checkOnboardingStatus().pipe(
      map(onboardingState => {
        // If organization doesn't exist, redirect to onboarding
        if (!onboardingState.organization) {
          this.router.navigate(['/funder/onboarding'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        // If trying to create opportunities but organization isn't complete
        if (state.url.includes('/opportunities/create') && !onboardingState.canCreateOpportunities) {
          this.router.navigate(['/funder/onboarding'], {
            queryParams: { 
              returnUrl: state.url,
              step: 'complete-details',
              message: 'Please complete your organization details to create funding opportunities'
            }
          });
          return false;
        }

        // Organization exists and user can proceed
        return true;
      }),
      catchError(error => {
        console.error('Organization guard error:', error);
        // On error, redirect to onboarding to be safe
        this.router.navigate(['/funder/onboarding']);
        return of(false);
      })
    );
  }
}
