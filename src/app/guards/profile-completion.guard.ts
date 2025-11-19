// src/app/guards/profile-completion.guard.ts - WITH TOAST INTEGRATION
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
import { ToastService } from '../shared/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompletionGuard implements CanActivate, CanActivateChild {
  private profileValidationService = inject(GlobalProfileValidationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

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

    // Use Observable approach - wait for data to load then check
    return new Observable<boolean | UrlTree>((subscriber) => {
      // Force refresh of profile data if needed
      this.profileValidationService
        .refreshProfileData()
        .then(() => {
          const currentCompletion = this.profileValidationService.completion();

          if (currentCompletion >= requiredCompletion) {
            subscriber.next(true);
          } else {
            // Show toast with action button instead of immediate redirect
            this.showProfileIncompleteToast(
              requiredCompletion,
              currentCompletion,
              state.url
            );
            subscriber.next(false); // Deny access
          }
          subscriber.complete();
        })
        .catch((error) => {
          console.error('Failed to load profile data for guard:', error);
          // On error, show toast and deny access
          this.showProfileIncompleteToast(requiredCompletion, 0, state.url);
          subscriber.next(false);
          subscriber.complete();
        });
    });
  }

  /**
   * Show toast notification with action button for profile completion
   * Instead of immediate redirect, gives user control with a clear CTA
   */
  private showProfileIncompleteToast(
    required: CompletionRequirement,
    current: number,
    returnUrl: string
  ): void {
    const remaining = Math.max(0, required - current);
    const message = this.getToastMessage(required, remaining);

    // Create a custom toast container with action button
    // Since our toast service doesn't support custom actions,
    // we'll use the toast for notification and handle redirect via button click
    const toastId = this.toastService.show({
      message: message,
      type: 'warning',
      autoDismiss: false, // Keep visible until user acts
    });

    // Create and insert action button overlay
    this.createProfileActionOverlay(toastId, returnUrl);
  }

  /**
   * Create an overlay with action buttons for profile completion
   * Complements the toast with user action options
   */
  private createProfileActionOverlay(toastId: string, returnUrl: string): void {
    // Wait for next tick to ensure toast is rendered
    setTimeout(() => {
      const toastElement = document.querySelector(
        `[data-toast-id="${toastId}"]`
      );
      if (!toastElement) {
        return; // Toast not found, might have been dismissed
      }

      // Create action buttons container
      const actionContainer = document.createElement('div');
      actionContainer.className = 'flex items-center gap-2 ml-4 flex-shrink-0';
      actionContainer.innerHTML = `
        <button 
          id="complete-profile-btn-${toastId}"
          class="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
        >
          Complete Profile
        </button>
        <button 
          id="dismiss-btn-${toastId}"
          class="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors duration-200"
        >
          Dismiss
        </button>
      `;

      // Find message span and insert buttons after it
      const messageSpan = toastElement.querySelector('span');
      if (messageSpan && messageSpan.nextSibling) {
        messageSpan.parentNode?.insertBefore(
          actionContainer,
          messageSpan.nextSibling
        );
      }

      // Attach event listeners
      const completeBtn = document.getElementById(
        `complete-profile-btn-${toastId}`
      );
      const dismissBtn = document.getElementById(`dismiss-btn-${toastId}`);

      if (completeBtn) {
        completeBtn.addEventListener('click', () => {
          this.toastService.dismiss(toastId);
          this.router.navigate(['/profile/steps'], {
            queryParams: { returnUrl },
          });
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          this.toastService.dismiss(toastId);
        });
      }

      // Auto-dismiss after 8 seconds if user hasn't acted
      setTimeout(() => {
        const btn = document.getElementById(`complete-profile-btn-${toastId}`);
        if (btn && btn.isConnected) {
          // Button still exists, so toast hasn't been dismissed
          this.toastService.dismiss(toastId);
        }
      }, 8000);
    }, 100);
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

  private getToastMessage(
    required: CompletionRequirement,
    remaining: number
  ): string {
    let featureName = 'this feature';

    switch (required) {
      case COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING:
        featureName = 'apply for funding';
        break;
      case COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES:
        featureName = 'view opportunities';
        break;
      case COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO:
        featureName = 'access your portfolio';
        break;
      case COMPLETION_REQUIREMENTS.BASIC_ACCESS:
        featureName = 'access this feature';
        break;
    }

    return `Complete your profile to ${featureName} (${remaining}% remaining)`;
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
