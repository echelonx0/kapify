 // src/app/funder/components/organization-onboarding.component.ts - FIXED LOGIC
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Shield,
  FileText,
  Sparkles,
  Upload
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import { FunderOnboardingService, OnboardingState } from '../services/funder-onboarding.service';

@Component({
  selector: 'app-organization-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
 
    LucideAngularModule
 
  ],
  templateUrl: 'funder-organization-onboarding.component.html'
})
export class OrganizationOnboardingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  Building2Icon = Building2;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  ArrowRightIcon = ArrowRight;
  ShieldIcon = Shield;
  FileTextIcon = FileText;
  SparklesIcon = Sparkles;
  UploadIcon = Upload;   // ADD THIS

  // State - FIXED: Start with 'form' view and update based on actual data
  currentView = signal<'form' | 'success' | 'verification' | 'complete'>('form');
  onboardingState = signal<OnboardingState | null>(null);

  ngOnInit() {
    console.log('🎯 OrganizationOnboardingComponent initialized');
    this.checkOnboardingStatus();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkOnboardingStatus() {
    console.log('🔍 OrganizationOnboardingComponent checking onboarding status');
    this.onboardingService.checkOnboardingStatus().subscribe();
  }

  private setupSubscriptions() {
    console.log('🔗 OrganizationOnboardingComponent setting up subscriptions');
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('📥 OrganizationOnboardingComponent received state update:', {
          currentStep: state.currentStep,
          completionPercentage: state.completionPercentage,
          hasOrganization: !!state.organization,
          isComplete: state.isComplete,
          canCreateOpportunities: state.canCreateOpportunities,
          organizationData: state.organization ? 'exists' : 'none'
        });
        
        this.onboardingState.set(state);
        this.updateViewBasedOnState(state);
      });
  }

  //  More precise logic for determining view
  private updateViewBasedOnState(state: OnboardingState) {
    console.log('🎯 Updating view based on state...');
    console.log('🎯 State analysis:', {
      isComplete: state.isComplete,
      canCreateOpportunities: state.canCreateOpportunities,
      hasOrganization: !!state.organization,
      completionPercentage: state.completionPercentage,
      currentStep: state.currentStep
    });

    //   Check if organization actually has data, not just if object exists
    const hasValidOrganization = state.organization && 
      state.organization.name && 
      state.organization.email && 
      state.organization.phone;

    console.log('🎯 Organization data check:', {
      organizationExists: !!state.organization,
      hasName: !!state.organization?.name,
      hasEmail: !!state.organization?.email,
      hasPhone: !!state.organization?.phone,
      hasValidOrganization
    });

    if (state.isComplete && state.organization?.isVerified) {
      console.log('🎯 Setting view to: complete (verified)');
      this.currentView.set('complete');
    } else if (hasValidOrganization && state.canCreateOpportunities) {
      console.log('🎯 Setting view to: verification (ready for verification)');
      this.currentView.set('verification');
    } else if (hasValidOrganization) {
      console.log('🎯 Setting view to: success (organization created but incomplete)');
      this.currentView.set('success');
    } else {
      console.log('🎯 Setting view to: form (no valid organization data)');
      this.currentView.set('form');
    }

    console.log('🎯 Final view set to:', this.currentView());
  }

  // ===============================
  // NAVIGATION ACTIONS
  // ===============================

  startSetup() {
    console.log('🚀 Starting organization setup');
    this.onboardingService.setCurrentStep('organization-info');
    this.router.navigate(['/funder/onboarding/organization-info']);
  }

  loadFromExisting() {
    console.log('📂 Loading from existing data');
    this.checkOnboardingStatus();
  }

  editOrganization() {
    console.log('✏️ Editing organization');
    this.onboardingService.setCurrentStep('organization-info');
    this.router.navigate(['/funder/onboarding/organization-info']);
  }

  proceedToDashboard() {
    console.log('🏠 Proceeding to dashboard');
    this.router.navigate(['/funder/dashboard']);
  }

  createFirstOpportunity() {
    console.log('💼 Creating first opportunity');
    this.router.navigate(['/funding/opportunities/create']); 
  }

  skipVerification() {
    console.log('⏭️ Skipping verification');
    this.router.navigate(['/funder/dashboard']);
  }

  requestVerification() {
    console.log('🛡️ Requesting verification');
    this.onboardingService.requestVerification().subscribe({
      next: (result) => {
        console.log('✅ Verification requested successfully:', result.message);
        this.currentView.set('complete');
      },
      error: (error) => console.error('❌ Failed to request verification:', error)
    });
  }

  // ===============================
  // FORM VALIDATION & SAVE
  // ===============================

  isFormValid(): boolean {
    const data = this.onboardingService.getCurrentOrganization();
    const isValid = !!(
      data.name &&
      data.description &&
      data.organizationType &&
      data.email &&
      data.phone &&
      data.addressLine1 &&
      data.city &&
      data.province &&
      data.country
    );
    
    console.log('🔍 Form validation result:', isValid);
    return isValid;
  }

  saveOrganization() {
    console.log('💾 Saving organization from welcome component');
    
    if (!this.isFormValid()) {
      console.warn('⚠️ Form is not valid, cannot save');
      return;
    }

    this.onboardingService.saveToDatabase().subscribe({
      next: (result) => {
        console.log('✅ Organization saved successfully from welcome component:', result);
        this.currentView.set('success');
        this.checkOnboardingStatus();
      },
      error: (error) => {
        console.error('❌ Failed to save organization from welcome component:', error);
      }
    });
  }

  saveOrganizationWithData(organizationData: any) {
    console.log('💾 Saving organization with provided data:', organizationData);
    this.onboardingService.updateOrganizationData(organizationData);
    this.saveOrganization();
  }
}