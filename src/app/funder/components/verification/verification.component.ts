// src/app/funder/components/verification-form.component.ts - STEP 3 ONLY
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  Shield,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Send,
  ArrowRight
} from 'lucide-angular';
import { UiButtonComponent} from '../../../shared/components';
import { FunderOnboardingService } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-verification-form',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    LucideAngularModule
  ],
  templateUrl: 'verification.component.html'
})
export class VerificationFormComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  ShieldIcon = Shield;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  AlertTriangleIcon = AlertTriangle;
  SendIcon = Send;
  ArrowRightIcon = ArrowRight;

  // Organization data
  organizationData = signal(this.onboardingService.getCurrentOrganization());

  ngOnInit() {
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.organization) {
          this.organizationData.set(state.organization);
        }
      });
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  isBasicInfoComplete(): boolean {
    return this.onboardingService.isBasicInfoValid();
  }

  isLegalInfoComplete(): boolean {
    return this.onboardingService.isLegalInfoValid();
  }

  isDataComplete(): boolean {
    return this.isBasicInfoComplete() && this.isLegalInfoComplete();
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  goToIncompleteStep() {
    if (!this.isBasicInfoComplete()) {
      this.router.navigate(['/funder/onboarding/organization-info']);
    } else if (!this.isLegalInfoComplete()) {
      this.router.navigate(['/funder/onboarding/legal-compliance']);
    }
  }
 
submitForVerification() {
  if (!this.isDataComplete()) {
    console.warn('Data not complete for verification');
    return;
  }

  console.log('🛡️ Starting verification submission...');
  console.log('🛡️ isSaving before:', this.onboardingService.isSaving());

  // Reset any previous errors
  this.onboardingService.error.set(null);

  // Step 1: Save to database with timeout
  console.log('🛡️ Step 1: Saving to database...');
  
  this.onboardingService.saveToDatabase().subscribe({
    next: (saveResult) => {
      console.log('✅ Step 1 complete - Data saved:', saveResult);
      console.log('🛡️ isSaving after save:', this.onboardingService.isSaving());
      
      // Step 2: Request verification with timeout
      console.log('🛡️ Step 2: Requesting verification...');
      
      this.onboardingService.requestVerification().subscribe({
        next: (verificationResult) => {
          console.log('✅ Step 2 complete - Verification requested:', verificationResult);
          console.log('🛡️ isSaving after verification:', this.onboardingService.isSaving());
          
          // Navigate to dashboard
          console.log('🛡️ Navigating to dashboard...');
          this.router.navigate(['/funder/dashboard']);
        },
        error: (verificationError) => {
          console.error('❌ Step 2 failed - Verification request error:', verificationError);
          console.log('🛡️ isSaving after verification error:', this.onboardingService.isSaving());
          
          // Manually reset isSaving if it's stuck
          this.onboardingService.isSaving.set(false);
        }
      });
    },
    error: (saveError) => {
      console.error('❌ Step 1 failed - Save error:', saveError);
      console.log('🛡️ isSaving after save error:', this.onboardingService.isSaving());
      
      // Manually reset isSaving if it's stuck
      this.onboardingService.isSaving.set(false);
    }
  });

  // Safety timeout - reset loading after 10 seconds
  setTimeout(() => {
    if (this.onboardingService.isSaving()) {
      console.warn('⚠️ Verification taking too long - resetting loading state');
      this.onboardingService.isSaving.set(false);
      this.onboardingService.error.set('Request timed out - please try again');
    }
  }, 10000);
}
  skipVerification() {
    console.log('⏭️ Skipping verification, going to dashboard');
    this.router.navigate(['/funder/dashboard']);
  }

  // ===============================
  // FORMATTING METHODS
  // ===============================

  formatOrganizationType(type: string | undefined): string {
    if (!type) return 'Not specified';
    
    const typeMap: { [key: string]: string } = {
      'investment_fund': 'Investment Fund',
      'venture_capital': 'Venture Capital',
      'private_equity': 'Private Equity',
      'bank': 'Bank',
      'government': 'Government Agency',
      'ngo': 'NGO/Non-Profit'
    };
    
    return typeMap[type] || type;
  }

  formatProvince(province: string | undefined): string {
    if (!province) return 'Not specified';
    
    const provinceMap: { [key: string]: string } = {
      'western_cape': 'Western Cape',
      'gauteng': 'Gauteng',
      'kwazulu_natal': 'KwaZulu-Natal',
      'eastern_cape': 'Eastern Cape',
      'free_state': 'Free State',
      'limpopo': 'Limpopo',
      'mpumalanga': 'Mpumalanga',
      'north_west': 'North West',
      'northern_cape': 'Northern Cape'
    };
    
    return provinceMap[province] || province;
  }
}