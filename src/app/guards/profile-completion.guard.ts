// src/app/auth/guards/profile-completion.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators' 
import { ProfileManagementService } from '../shared/services/profile-management.service';
import { AuthService } from '../auth/production.auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {
  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);
  private router = inject(Router);

  canActivate(): Observable<boolean> | boolean {
    const user = this.authService.user();
    
    // Only apply to SME users
    if (!user || user.userType !== 'sme') {
      return true;
    }

    // Check if we already have profile data loaded
    const currentProfileData = this.profileService.profileData();
    
    if (currentProfileData?.user) {
      // We have profile data, check completion
      const completionPercentage = this.getCompletionPercentage(currentProfileData);
      
      if (completionPercentage < 90) {
        this.redirectToProfile(completionPercentage);
        return false;
      }
      
      return true;
    }

    // No profile data, need to load it
    return this.profileService.loadProfileData().pipe(
      map(profileData => {
        const completionPercentage = this.getCompletionPercentage(profileData);
        
        if (completionPercentage < 90) {
          this.redirectToProfile(completionPercentage);
          return false;
        }
        
        return true;
      }),
      catchError(() => {
        // If profile loading fails, redirect to profile page
        this.router.navigate(['/profile'], {
          queryParams: { error: 'profile_load_failed' }
        });
        return of(false);
      })
    );
  }

  private getCompletionPercentage(profileData: any): number {
    // For now, return a basic calculation
    // This will be enhanced when we have the full profile system
    if (!profileData?.user) return 0;
    
    let completed = 0;
    let total = 10; // Basic fields to check
    
    // Check basic user fields
    if (profileData.user.firstName) completed++;
    if (profileData.user.lastName) completed++;
    if (profileData.user.email) completed++;
    if (profileData.user.phone) completed++;
    if (profileData.user.emailVerified) completed++;
    
    // Check organization
    if (profileData.organization?.name) completed++;
    if (profileData.organization?.description) completed++;
    
    // Check additional profile fields
    if (profileData.organizationUser) completed++;
    
    // Basic completion calculation
    const percentage = Math.round((completed / total) * 100);
    
    // For testing purposes, you can manually set this to < 90 to test the guard
    return percentage;
  }

  private redirectToProfile(currentCompletion: number): void {
    this.router.navigate(['/profile'], {
      queryParams: {
        incomplete: 'true',
        required: '90',
        current: currentCompletion.toString(),
        message: `Your profile is ${currentCompletion}% complete. You need 90% completion to access funding opportunities.`
      }
    });
  }
}