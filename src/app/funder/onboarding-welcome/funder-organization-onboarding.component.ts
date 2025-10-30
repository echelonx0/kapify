// src/app/funder/components/organization-onboarding.component.ts
import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  inject,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../auth/production.auth.service';
import {
  FunderOnboardingService,
  OnboardingState,
} from '../services/funder-onboarding.service';
import { MobileHeaderComponent } from './components/mobile-header.component';
import { PendingVerificationStateComponent } from './components/pending-verification.component';
import { SetupStateComponent } from './components/setup-state.component';
import { VerificationReadyStateComponent } from './components/verification-ready-state.component';
import { VerifiedStateComponent } from './components/verified.component';

// Import child components

type WelcomeView =
  | 'setup'
  | 'ready-verification'
  | 'pending-verification'
  | 'verified'
  | 'rejected';

@Component({
  selector: 'app-organization-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,

    MobileHeaderComponent,
    SetupStateComponent,
    VerificationReadyStateComponent,
    PendingVerificationStateComponent,
    VerifiedStateComponent,
  ],
  templateUrl: 'organization-onboarding.component.html',
  styleUrls: ['./organisation-onboarding.component.css'],
})
export class OrganizationOnboardingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  AlertCircleIcon = AlertCircle;

  // State
  currentView = signal<WelcomeView>('setup');
  onboardingState = signal<OnboardingState | null>(null);

  // Computed properties for dynamic content
  currentTime = computed(() => new Date());

  ngOnInit() {
    console.log('🎯 Modular OrganizationOnboardingComponent initialized');
    this.checkOnboardingStatus();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkOnboardingStatus() {
    this.onboardingService.checkOnboardingStatus().subscribe();
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.onboardingState.set(state);
        this.updateViewBasedOnState(state);
      });
  }

  private updateViewBasedOnState(state: OnboardingState) {
    const org = state.organization;

    if (!org || !org.name || !state.canCreateOpportunities) {
      this.currentView.set('setup');
    } else if (org.status === 'pending_verification') {
      this.currentView.set('pending-verification');
    } else if (org.isVerified) {
      this.currentView.set('verified');
    } else if (org.status === 'verification_rejected') {
      this.currentView.set('rejected');
    } else if (state.canCreateOpportunities) {
      this.currentView.set('ready-verification');
    } else {
      this.currentView.set('setup');
    }
  }

  // ===============================
  // DYNAMIC CONTENT METHODS
  // ===============================

  getGreeting(): string {
    const hour = this.currentTime().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getUserName(): string {
    const user = this.authService.user();
    return user?.firstName || user?.email?.split('@')[0] || 'there';
  }

  getUserInitials(): string {
    const user = this.authService.user();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  }

  getCurrentDateFormatted(): string {
    return this.currentTime().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getVerificationDate(): string {
    const org = this.onboardingState()?.organization;
    if (org?.verificationDate) {
      return new Date(org.verificationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return 'recently';
  }

  getStatusText(): string {
    const org = this.onboardingState()?.organization;
    if (!org) return 'Setup Required';

    switch (org.status) {
      case 'pending_verification':
        return 'Under Review';
      case 'verification_rejected':
        return 'Needs Update';
      default:
        return org.isVerified ? 'Verified' : 'Active';
    }
  }

  getStatusBadgeClass(): string {
    const org = this.onboardingState()?.organization;
    if (!org)
      return 'px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full';

    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';

    if (org.isVerified) {
      return `${baseClasses} bg-green-100 text-green-800`;
    }

    switch (org.status) {
      case 'pending_verification':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'verification_rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  }

  getCompletionPercentage(): number {
    return this.onboardingService.getStepProgress().percentage;
  }

  // ===============================
  // NAVIGATION ACTIONS
  // ===============================

  startSetup() {
    console.log('🚀 Starting enhanced organization setup');
    this.onboardingService.setCurrentStep('organization-info');
    this.router.navigate(['/funder/onboarding/organization-info']);
  }

  loadFromExisting() {
    console.log('📂 Loading from existing with enhanced detection');
    this.checkOnboardingStatus();
  }

  editOrganization() {
    console.log('✏️ Editing organization');
    this.onboardingService.setCurrentStep('organization-info');
    this.router.navigate(['/funder/onboarding/organization-info']);
  }

  proceedToDashboard() {
    console.log('🏠 Proceeding to enhanced dashboard');
    this.router.navigate(['/funder/dashboard']);
  }

  createFirstOpportunity() {
    console.log('💼 Creating first opportunity');
    this.router.navigate(['/funding/opportunities/create']);
  }

  browseSMEs() {
    console.log('👥 Browsing SMEs');
    this.router.navigate(['/funder/browse-smes']);
  }

  skipVerification() {
    console.log('⏭️ Skipping verification');
    this.router.navigate(['/funder/dashboard']);
  }

  requestVerification() {
    console.log('🛡️ Requesting verification with enhanced flow');
    this.onboardingService.requestVerification().subscribe({
      next: (result) => {
        console.log('✅ Verification requested successfully:', result.message);
        this.currentView.set('pending-verification');
      },
      error: (error) =>
        console.error('❌ Failed to request verification:', error),
    });
  }
}
