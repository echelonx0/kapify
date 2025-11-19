// src/app/guards/profile-completion.guard.ts - SIMPLIFIED VERSION
import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { Observable } from 'rxjs';
import {
  GlobalProfileValidationService,
  COMPLETION_REQUIREMENTS,
  CompletionRequirement,
} from '../shared/services/global-profile-validation.service';
import { AuthService } from '../auth/production.auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompletionGuard implements CanActivate, CanActivateChild {
  private profileValidationService = inject(GlobalProfileValidationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.checkProfileCompletion(route, state);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    return this.checkProfileCompletion(childRoute, state);
  }

  private checkProfileCompletion(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is authenticated first
    const currentUser = this.authService.user();
    if (!currentUser) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    // Skip profile completion check for funders
    if (currentUser.userType === 'funder') {
      return true;
    }

    // Special case: Allow access to profile pages regardless of completion
    if (state.url.startsWith('/profile')) {
      return true;
    }

    // Get required completion from route data or use default
    const requiredCompletion = this.getRequiredCompletion(route, state);

    // SIMPLIFIED: Use Observable approach - wait for data to load then check
    return new Observable<boolean | UrlTree>((subscriber) => {
      // Force refresh of profile data if needed
      this.profileValidationService
        .refreshProfileData()
        .then(() => {
          const currentCompletion = this.profileValidationService.completion();

          if (currentCompletion >= requiredCompletion) {
            subscriber.next(true);
          } else {
            subscriber.next(
              this.createRedirectUrl(
                requiredCompletion,
                currentCompletion,
                state.url
              )
            );
          }
          subscriber.complete();
        })
        .catch((error) => {
          console.error('Failed to load profile data for guard:', error);
          // On error, redirect to profile completion to be safe
          subscriber.next(
            this.createRedirectUrl(requiredCompletion, 0, state.url)
          );
          subscriber.complete();
        });
    });
  }

  private getRequiredCompletion(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): CompletionRequirement {
    // Check route data for specific requirement
    if (route.data?.['minCompletion']) {
      return route.data['minCompletion'] as CompletionRequirement;
    }

    // Check parent routes for requirement
    let currentRoute = route.parent;
    while (currentRoute) {
      if (currentRoute.data?.['minCompletion']) {
        return currentRoute.data['minCompletion'] as CompletionRequirement;
      }
      currentRoute = currentRoute.parent;
    }

    // Default requirements based on URL patterns
    if (state.url.includes('/applications') || state.url.includes('/apply')) {
      return COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING;
    } else if (
      state.url.includes('/opportunities') ||
      state.url.includes('/funding')
    ) {
      return COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES;
    } else if (state.url.includes('/portfolio')) {
      return COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO;
    }

    // Default fallback
    return COMPLETION_REQUIREMENTS.BASIC_ACCESS;
  }

  private createRedirectUrl(
    required: CompletionRequirement,
    current: number,
    returnUrl: string
  ): UrlTree {
    return this.router.createUrlTree(['/profile/steps'], {
      queryParams: {
        required,
        current,
        returnUrl,
        message: this.getRedirectMessage(required, current),
      },
    });
  }

  private getRedirectMessage(
    required: CompletionRequirement,
    current: number
  ): string {
    const remaining = required - current;

    switch (required) {
      case COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING:
        return `Complete your profile to apply for funding (${remaining}% remaining)`;
      case COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES:
        return `Complete your profile to view opportunities (${remaining}% remaining)`;
      case COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO:
        return `Complete your profile to access portfolio (${remaining}% remaining)`;
      default:
        return `Complete your profile to continue (${remaining}% remaining)`;
    }
  }
}

// Helper functions remain the same
export function requiresProfileCompletion(completion: CompletionRequirement) {
  return { minCompletion: completion };
}

export const ROUTE_COMPLETION_REQUIREMENTS = {
  FUNDING_APPLICATIONS: requiresProfileCompletion(
    COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING
  ),
  OPPORTUNITIES: requiresProfileCompletion(
    COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES
  ),
  PORTFOLIO: requiresProfileCompletion(
    COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO
  ),
  BASIC: requiresProfileCompletion(COMPLETION_REQUIREMENTS.BASIC_ACCESS),
} as const;
