// src/app/funder/onboarding-welcome/components/verification-ready-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Shield, Trophy, ArrowRight, Briefcase, CheckCircle } from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';
import { OnboardingState } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-verification-ready-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="h-full overflow-hidden flex items-center">
      <div class="w-full max-w-4xl mx-auto text-center px-4 lg:px-8">
        
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <lucide-icon [img]="ShieldIcon" [size]="36" class="text-white" />
        </div>
        
        <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Ready for Verification</h1>
        <p class="text-base lg:text-lg text-slate-600 mb-6">
          Your organization setup is complete. Get verified to unlock premium features and build trust with SMEs.
        </p>

        <!-- Progress Bar -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-6 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900">Setup Progress</h3>
            <span class="text-2xl font-bold text-green-600">{{ completionPercentage }}%</span>
          </div>
          
          <div class="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div 
              class="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
              [style.width.%]="completionPercentage"
            ></div>
          </div>

          <div class="flex items-center justify-center space-x-2 text-green-600">
            <lucide-icon [img]="CheckCircleIcon" [size]="16" />
            <span class="text-sm font-medium">All required information complete</span>
          </div>
        </div>

        <!-- Organization Summary -->
        @if (onboardingState?.organization) {
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-6 mb-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Organization Summary</h3>
            
            <div class="grid md:grid-cols-3 gap-4 text-left">
              <div>
                <h4 class="font-semibold text-slate-900">{{ getOrgName() }}</h4>
                <p class="text-sm text-slate-600">{{ getOrgType() }}</p>
              </div>
              
              <div>
                <h4 class="font-semibold text-slate-900">{{ getFoundedYear() }}</h4>
                <p class="text-sm text-slate-600">Founded</p>
              </div>
              
              <div>
                <h4 class="font-semibold text-slate-900">{{ getCountry() }}</h4>
                <p class="text-sm text-slate-600">Location</p>
              </div>
            </div>
          </div>
        }

        <!-- Verification Benefits -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 lg:p-6 mb-6">
          <h3 class="text-lg font-semibold text-blue-900 mb-3">Verification Benefits</h3>
          
          <div class="grid md:grid-cols-2 gap-3 text-left">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="TrophyIcon" [size]="14" class="text-blue-600" />
              </div>
              <div>
                <h4 class="font-semibold text-blue-900">Verified Badge</h4>
                <p class="text-sm text-blue-700">Stand out with a trust badge</p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="ShieldIcon" [size]="14" class="text-blue-600" />
              </div>
              <div>
                <h4 class="font-semibold text-blue-900">Enhanced Security</h4>
                <p class="text-sm text-blue-700">Build confidence with SMEs</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid md:grid-cols-2 gap-3 mb-4">
          <ui-button 
            variant="primary" 
            size="lg" 
            class="w-full"
            [loading]="isSaving"
            (clicked)="onRequestVerification()"
          >
            <lucide-icon [img]="ShieldIcon" [size]="20" class="mr-2" />
            Request Verification
          </ui-button>
          
          <ui-button 
            variant="outline" 
            size="lg" 
            class="w-full"
            (clicked)="onSkipVerification()"
          >
            <lucide-icon [img]="ArrowRightIcon" [size]="20" class="mr-2" />
            Skip for Now
          </ui-button>
        </div>

        <!-- Quick Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            class="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            (click)="onCreateOpportunity()"
          >
            <lucide-icon [img]="BriefcaseIcon" [size]="16" class="mr-1" />
            Create First Opportunity
          </button>
          
          <button 
            class="text-slate-600 hover:text-slate-700 font-medium text-sm transition-colors"
            (click)="onGoToDashboard()"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  `
})
export class VerificationReadyStateComponent {
  @Input() onboardingState: OnboardingState | null = null;
  @Input() isSaving = false;
  @Input() completionPercentage = 0;
  
  @Output() requestVerification = new EventEmitter<void>();
  @Output() skipVerification = new EventEmitter<void>();
  @Output() createOpportunity = new EventEmitter<void>();
  @Output() goToDashboard = new EventEmitter<void>();

  // Icons
  ShieldIcon = Shield;
  TrophyIcon = Trophy;
  ArrowRightIcon = ArrowRight;
  BriefcaseIcon = Briefcase;
  CheckCircleIcon = CheckCircle;

  // Safe getter methods for organization data
  getOrgName(): string {
    return this.onboardingState?.organization?.name || 'Not specified';
  }

  getOrgType(): string {
    const type = this.onboardingState?.organization?.organizationType;
    if (!type) return 'Not specified';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  getFoundedYear(): string {
    return this.onboardingState?.organization?.ncrNumber?.toString() || 'Not specified';
  }

  getCountry(): string {
    return this.onboardingState?.organization?.country || 'Not specified';
  }

  onRequestVerification() {
    this.requestVerification.emit();
  }

  onSkipVerification() {
    this.skipVerification.emit();
  }

  onCreateOpportunity() {
    this.createOpportunity.emit();
  }

  onGoToDashboard() {
    this.goToDashboard.emit();
  }
}