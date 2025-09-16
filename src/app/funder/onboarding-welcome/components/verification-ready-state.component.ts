// src/app/funder/components/verification-ready-state/verification-ready-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, Shield, Trophy, Briefcase, ArrowRight, Building2, Calendar, Users } from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';
import { OnboardingState } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-verification-ready-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="h-full overflow-y-auto">
      <div class="p-4 lg:p-8 min-h-full flex items-center">
        <div class="w-full max-w-5xl mx-auto">
          
          <!-- Success Header -->
          <div class="text-center mb-8">
            <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <lucide-icon [img]="CheckCircleIcon" [size]="36" class="text-white" />
            </div>
            
            <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">Profile Setup Complete!</h1>
            <p class="text-base lg:text-lg text-slate-600 max-w-3xl mx-auto">
              Your organization profile is ready. Enhance your credibility with verification or start exploring opportunities right away.
            </p>
          </div>

          <!-- Action Cards -->
          <div class="grid lg:grid-cols-2 gap-6 mb-8">
            
            <!-- Verification Card -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 lg:p-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <lucide-icon [img]="ShieldIcon" [size]="24" class="text-blue-600" />
                </div>
                
                <h3 class="text-xl font-semibold text-slate-900 mb-3">Get Verified</h3>
                <p class="text-slate-600 mb-6">
                  Enhance your credibility with our verification process. Typically takes 2-3 business days.
                </p>
                
                <!-- Verification Benefits -->
                <div class="grid grid-cols-2 gap-3 mb-6">
                  <div class="flex items-center space-x-2">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600" />
                    <span class="text-sm text-slate-700">Trust Badge</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600" />
                    <span class="text-sm text-slate-700">Priority Support</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600" />
                    <span class="text-sm text-slate-700">Premium Features</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-blue-600" />
                    <span class="text-sm text-slate-700">Higher Visibility</span>
                  </div>
                </div>
                
                <ui-button 
                  variant="primary" 
                  size="lg" 
                  class="w-full mb-3"
                  (clicked)="onRequestVerification()"
                  [disabled]="isSaving"
                >
                  @if (isSaving) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting Request...
                  } @else {
                    <lucide-icon [img]="ShieldIcon" [size]="18" class="mr-2" />
                    Request Verification
                  }
                </ui-button>
                
                <button 
                  class="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  (click)="onSkipVerification()"
                >
                  Skip for now
                </button>
              </div>
            </div>

            <!-- Continue Card -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <lucide-icon [img]="TrophyIcon" [size]="24" class="text-green-600" />
                </div>
                
                <h3 class="text-xl font-semibold text-slate-900 mb-3">Start Funding</h3>
                <p class="text-slate-600 mb-6">
                  Your profile is complete. Start creating opportunities and connecting with SMEs immediately.
                </p>
                
                <div class="space-y-3">
                  <ui-button 
                    variant="primary" 
                    size="lg" 
                    class="w-full"
                    (clicked)="onCreateOpportunity()"
                  >
                    <lucide-icon [img]="BriefcaseIcon" [size]="18" class="mr-2" />
                    Create First Opportunity
                  </ui-button>
                  
                  <ui-button 
                    variant="outline" 
                    size="md" 
                    class="w-full"
                    (clicked)="onGoToDashboard()"
                  >
                    <lucide-icon [img]="ArrowRightIcon" [size]="18" class="mr-2" />
                    Go to Dashboard
                  </ui-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Organization Summary -->
          @if (onboardingState?.organization) {
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 class="text-lg font-semibold text-slate-900 mb-4">Organization Summary</h3>
              <div class="grid md:grid-cols-3 gap-6">
                
                <div class="text-center p-4 bg-slate-50 rounded-xl">
                  <lucide-icon [img]="Building2Icon" [size]="24" class="text-slate-600 mx-auto mb-2" />
                  <h4 class="font-semibold text-slate-900">{{ onboardingState.organization.name }}</h4>
                  <p class="text-sm text-slate-600">{{ onboardingState.organization.organizationType | titlecase }}</p>
                </div>
                
                <div class="text-center p-4 bg-slate-50 rounded-xl">
                  <lucide-icon [img]="CalendarIcon" [size]="24" class="text-slate-600 mx-auto mb-2" />
                  <h4 class="font-semibold text-slate-900">{{ onboardingState.organization.foundedYear || 'Not specified' }}</h4>
                  <p class="text-sm text-slate-600">Founded Year</p>
                </div>
                
                <div class="text-center p-4 bg-slate-50 rounded-xl">
                  <lucide-icon [img]="UsersIcon" [size]="24" class="text-slate-600 mx-auto mb-2" />
                  <h4 class="font-semibold text-slate-900">{{ completionPercentage }}%</h4>
                  <p class="text-sm text-slate-600">Profile Complete</p>
                </div>
              </div>
            </div>
          }
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
  CheckCircleIcon = CheckCircle;
  ShieldIcon = Shield;
  TrophyIcon = Trophy;
  BriefcaseIcon = Briefcase;
  ArrowRightIcon = ArrowRight;
  Building2Icon = Building2;
  CalendarIcon = Calendar;
  UsersIcon = Users;

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