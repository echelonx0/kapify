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
import { UiButtonComponent} from '../../shared/components';
import { FunderOnboardingService } from '../services/funder-onboarding.service';

@Component({
  selector: 'app-verification-form',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    LucideAngularModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Progress Indicator -->
 
      <!-- Verification Status Check -->
      @if (!isDataComplete()) {
        <!-- Incomplete Data Warning -->
        <div class="p-6 bg-amber-50 border border-amber-200 rounded-lg">
          <div class="flex items-start">
            <lucide-icon [img]="AlertTriangleIcon" [size]="24" class="text-amber-600 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h3 class="font-medium text-amber-900 mb-2">Complete Required Information First</h3>
              <p class="text-amber-800 mb-4">
                Please complete all required information in the previous steps before submitting for verification.
              </p>
              
              <div class="space-y-2">
                @if (!isBasicInfoComplete()) {
                  <div class="flex items-center text-amber-700">
                    <div class="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                    Complete basic organization information
                  </div>
                }
                @if (!isLegalInfoComplete()) {
                  <div class="flex items-center text-amber-700">
                    <div class="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                    Complete legal registration and address details
                  </div>
                }
              </div>

              <div class="mt-4">
                <ui-button 
                  variant="outline" 
                  size="sm"
                  (clicked)="goToIncompleteStep()"
                >
                  Complete Missing Information
                </ui-button>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Ready for Verification -->
        <div class="space-y-6">
          <!-- Verification Benefits -->
          <div class="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start">
              <lucide-icon [img]="ShieldIcon" [size]="24" class="text-blue-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 class="font-medium text-blue-900 mb-2">Get Verified</h3>
                <p class="text-blue-800 mb-4">
                  Verification builds trust with SMEs and unlocks additional platform features. This process typically takes 2-3 business days.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-3">
                    <h4 class="font-medium text-blue-900">Verification Benefits:</h4>
                    <ul class="space-y-2 text-sm text-blue-800">
                      <li class="flex items-center">
                        <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Enhanced credibility with SMEs
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Priority in funding opportunity listings
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Verified badge on your profile
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Access to exclusive features
                      </li>
                    </ul>
                  </div>
                  
                  <div class="space-y-3">
                    <h4 class="font-medium text-blue-900">What We Review:</h4>
                    <ul class="space-y-2 text-sm text-blue-800">
                      <li class="flex items-center">
                        <lucide-icon [img]="FileTextIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Organization registration details
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="FileTextIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Legal compliance status
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="FileTextIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Contact information verification
                      </li>
                      <li class="flex items-center">
                        <lucide-icon [img]="FileTextIcon" [size]="16" class="text-blue-600 mr-2 flex-shrink-0" />
                        Business address confirmation
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Summary for Review -->
          <div class="p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
            <h3 class="font-medium text-neutral-900 mb-4">Review Your Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Info Summary -->
              <div>
                <h4 class="font-medium text-neutral-700 mb-2">Basic Information</h4>
                <div class="space-y-1 text-sm text-neutral-600">
                  <div><strong>Name:</strong> {{ organizationData().name || 'Not provided' }}</div>
                  <div><strong>Type:</strong> {{ formatOrganizationType(organizationData().organizationType) }}</div>
                  <div><strong>Email:</strong> {{ organizationData().email || 'Not provided' }}</div>
                  <div><strong>Phone:</strong> {{ organizationData().phone || 'Not provided' }}</div>
                </div>
              </div>

              <!-- Legal Info Summary -->
              <div>
                <h4 class="font-medium text-neutral-700 mb-2">Legal Information</h4>
                <div class="space-y-1 text-sm text-neutral-600">
                  <div><strong>Legal Name:</strong> {{ organizationData().legalName || 'Not provided' }}</div>
                  <div><strong>Registration #:</strong> {{ organizationData().registrationNumber || 'Not provided' }}</div>
                  <div><strong>City:</strong> {{ organizationData().city || 'Not provided' }}</div>
                  <div><strong>Province:</strong> {{ formatProvince(organizationData().province) }}</div>
                </div>
              </div>
            </div>

            <div class="mt-4 p-3 bg-neutral-100 rounded text-xs text-neutral-500">
              <strong>Note:</strong> This information will be reviewed by our verification team. You can edit any details by going back to previous steps.
            </div>
          </div>

          <!-- Verification Action -->
          <div class="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div class="text-center">
              <lucide-icon [img]="ShieldIcon" [size]="48" class="text-green-600 mx-auto mb-4" />
              <h3 class="text-lg font-semibold text-green-900 mb-2">Ready to Submit</h3>
              <p class="text-green-800 mb-6">
                Your organization information is complete and ready for verification review.
              </p>

              <div class="space-y-3">
                <ui-button 
                  variant="primary" 
                  size="lg"
                  (clicked)="submitForVerification()"
                  [disabled]="onboardingService.isSaving()"
                  class="w-full sm:w-auto"
                >
                  @if (onboardingService.isSaving()) {
                    <lucide-icon [img]="ClockIcon" [size]="20" class="mr-2 animate-spin" />
                    Submitting for Verification...
                  } @else {
                    <lucide-icon [img]="SendIcon" [size]="20" class="mr-2" />
                    Submit for Verification
                  }
                </ui-button>

                <div class="text-center">
                  <ui-button 
                    variant="ghost" 
                    size="sm"
                    (clicked)="skipVerification()"
                  >
                    Skip for Now - Go to Dashboard
                    <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-2" />
                  </ui-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Error Display -->
      @if (onboardingService.error()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <lucide-icon [img]="AlertTriangleIcon" [size]="20" class="text-red-600 mr-3" />
            <p class="text-red-800">{{ onboardingService.error() }}</p>
          </div>
        </div>
      }

      <!-- Process Information -->
      <div class="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <h4 class="font-medium text-neutral-900 mb-2">Verification Process</h4>
        <div class="space-y-2 text-sm text-neutral-600">
          <div class="flex items-center">
            <div class="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">1</div>
            <span>We review your organization details and registration information</span>
          </div>
          <div class="flex items-center">
            <div class="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">2</div>
            <span>Our team may contact you for additional documentation if needed</span>
          </div>
          <div class="flex items-center">
            <div class="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">3</div>
            <span>You'll receive confirmation within 2-3 business days</span>
          </div>
        </div>
      </div>
    </div>
  `
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

  // ===============================
  // VERIFICATION ACTIONS
  // ===============================

  submitForVerification() {
    if (!this.isDataComplete()) {
      console.warn('Data not complete for verification');
      return;
    }

    console.log('🛡️ Submitting for verification...');

    // First save current data, then request verification
    this.onboardingService.saveToDatabase().subscribe({
      next: (saveResult) => {
        console.log('✅ Data saved, now requesting verification');
        
        this.onboardingService.requestVerification().subscribe({
          next: (verificationResult) => {
            console.log('✅ Verification requested:', verificationResult.message);
            this.router.navigate(['/funder-dashboard']);
          },
          error: (error) => {
            console.error('❌ Verification request failed:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Save failed before verification:', error);
      }
    });
  }

  skipVerification() {
    console.log('⏭️ Skipping verification, going to dashboard');
    this.router.navigate(['/funder-dashboard']);
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