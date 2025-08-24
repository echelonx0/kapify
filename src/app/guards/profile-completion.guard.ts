// // src/app/auth/guards/profile-completion.guard.ts
// import { Injectable, inject } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { Observable, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators' 
// import { ProfileManagementService } from '../shared/services/profile-management.service';
// import { AuthService } from '../auth/production.auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class ProfileCompletionGuard implements CanActivate {
//   private authService = inject(AuthService);
//   private profileService = inject(ProfileManagementService);
//   private router = inject(Router);

//   canActivate(): Observable<boolean> | boolean {
//     const user = this.authService.user();
    
//     // Only apply to SME users
//     if (!user || user.userType !== 'sme') {
//       return true;
//     }

//     // Check if we already have profile data loaded
//     const currentProfileData = this.profileService.profileData();
    
//     if (currentProfileData?.user) {
//       // We have profile data, check completion
//       const completionPercentage = this.getCompletionPercentage(currentProfileData);
      
//       if (completionPercentage < 90) {
//         this.redirectToProfile(completionPercentage);
//         return false;
//       }
      
//       return true;
//     }

//     // No profile data, need to load it
//     return this.profileService.loadProfileData().pipe(
//       map(profileData => {
//         const completionPercentage = this.getCompletionPercentage(profileData);
        
//         if (completionPercentage < 90) {
//           this.redirectToProfile(completionPercentage);
//           return false;
//         }
        
//         return true;
//       }),
//       catchError(() => {
//         // If profile loading fails, redirect to profile page
//         this.router.navigate(['/profile'], {
//           queryParams: { error: 'profile_load_failed' }
//         });
//         return of(false);
//       })
//     );
//   }

//   private getCompletionPercentage(profileData: any): number {
//     // For now, return a basic calculation
//     // This will be enhanced when we have the full profile system
//     if (!profileData?.user) return 0;
    
//     let completed = 0;
//     let total = 10; // Basic fields to check
    
//     // Check basic user fields
//     if (profileData.user.firstName) completed++;
//     if (profileData.user.lastName) completed++;
//     if (profileData.user.email) completed++;
//     if (profileData.user.phone) completed++;
//     if (profileData.user.emailVerified) completed++;
    
//     // Check organization
//     if (profileData.organization?.name) completed++;
//     if (profileData.organization?.description) completed++;
    
//     // Check additional profile fields
//     if (profileData.organizationUser) completed++;
    
//     // Basic completion calculation
//     const percentage = Math.round((completed / total) * 100);
    
//     // For testing purposes, you can manually set this to < 90 to test the guard
//     return percentage;
//   }

//   private redirectToProfile(currentCompletion: number): void {
//     this.router.navigate(['/profile'], {
//       queryParams: {
//         incomplete: 'true',
//         required: '90',
//         current: currentCompletion.toString(),
//         message: `Your profile is ${currentCompletion}% complete. You need 90% completion to access funding opportunities.`
//       }
//     });
//   }
// }

// src/app/guards/profile-completion.guard.ts - SIMPLIFIED VERSION
import { Injectable, inject } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  Router, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  UrlTree 
} from '@angular/router';

import { Observable } from 'rxjs';
import { 
  GlobalProfileValidationService, 
  COMPLETION_REQUIREMENTS, 
  CompletionRequirement 
} from '../shared/services/global-profile-validation.service';
import { AuthService } from '../auth/production.auth.service';

@Injectable({
  providedIn: 'root'
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
        queryParams: { returnUrl: state.url }
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
    return new Observable<boolean | UrlTree>(subscriber => {
      // Force refresh of profile data if needed
      this.profileValidationService.refreshProfileData().then(() => {
        const currentCompletion = this.profileValidationService.completion();
        
        if (currentCompletion >= requiredCompletion) {
          subscriber.next(true);
        } else {
          subscriber.next(this.createRedirectUrl(requiredCompletion, currentCompletion, state.url));
        }
        subscriber.complete();
      }).catch(error => {
        console.error('Failed to load profile data for guard:', error);
        // On error, redirect to profile completion to be safe
        subscriber.next(this.createRedirectUrl(requiredCompletion, 0, state.url));
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
    } else if (state.url.includes('/opportunities') || state.url.includes('/funding')) {
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
        message: this.getRedirectMessage(required, current)
      }
    });
  }

  private getRedirectMessage(required: CompletionRequirement, current: number): string {
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
  FUNDING_APPLICATIONS: requiresProfileCompletion(COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING),
  OPPORTUNITIES: requiresProfileCompletion(COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES),
  PORTFOLIO: requiresProfileCompletion(COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO),
  BASIC: requiresProfileCompletion(COMPLETION_REQUIREMENTS.BASIC_ACCESS)
} as const;