// src/app/funder/components/verification-ready-state/verification-ready-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Shield,
  CheckCircle,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-angular';
import { OnboardingState } from 'src/app/funder/services/funder-onboarding.service';

@Component({
  selector: 'app-verification-ready-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50 p-6 flex items-center justify-center"
    >
      <div class="max-w-2xl w-full">
        <!-- Main Card -->
        <div
          class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <!-- Success Header -->
          <div
            class="bg-gradient-to-r from-green-50 to-teal-50 border-b border-green-100 px-8 py-6"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="CheckCircleIcon"
                  [size]="28"
                  class="text-white"
                />
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-slate-900 mb-2">
                  Setup Complete!
                </h1>
                <p class="text-slate-700 text-base leading-relaxed">
                  Your organization profile is ready. Request verification to
                  unlock all platform features and start creating funding
                  opportunities.
                </p>
              </div>
            </div>
          </div>

          <!-- What's Unlocked -->
          <div class="px-8 py-6 border-b border-slate-200">
            <h2 class="text-lg font-bold text-slate-900 mb-4">
              What Verification Unlocks
            </h2>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <lucide-icon
                    [img]="BriefcaseIcon"
                    [size]="18"
                    class="text-teal-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 text-sm">
                    Create Funding Opportunities
                  </h3>
                  <p class="text-xs text-slate-600">
                    Publish opportunities and receive applications from
                    qualified SMEs
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <lucide-icon
                    [img]="ShieldIcon"
                    [size]="18"
                    class="text-blue-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 text-sm">
                    Verified Badge
                  </h3>
                  <p class="text-xs text-slate-600">
                    Display verified status to build trust with applicants
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <lucide-icon
                    [img]="SparklesIcon"
                    [size]="18"
                    class="text-purple-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 text-sm">
                    Priority Visibility
                  </h3>
                  <p class="text-xs text-slate-600">
                    Get featured placement in SME search results
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                >
                  <lucide-icon
                    [img]="TrendingUpIcon"
                    [size]="18"
                    class="text-green-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 text-sm">
                    Advanced Analytics
                  </h3>
                  <p class="text-xs text-slate-600">
                    Access detailed insights on applications and engagement
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Verification Process Info -->
          <div class="px-8 py-6 bg-slate-50 border-b border-slate-200">
            <h3 class="text-sm font-semibold text-slate-900 mb-3">
              Verification typically takes 2-3 business days
            </h3>
            <div class="flex items-start gap-2 text-xs text-slate-600">
              <lucide-icon
                [img]="CheckCircleIcon"
                [size]="14"
                class="text-green-600 flex-shrink-0 mt-0.5"
              />
              <p>
                Our team will review your organization details and documentation
              </p>
            </div>
            <div class="flex items-start gap-2 text-xs text-slate-600 mt-2">
              <lucide-icon
                [img]="CheckCircleIcon"
                [size]="14"
                class="text-green-600 flex-shrink-0 mt-0.5"
              />
              <p>
                You'll receive an email notification once verification is
                complete
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="px-8 py-6 space-y-3">
            <button
              (click)="onRequestVerification()"
              [disabled]="isSaving"
              class="w-full bg-teal-500 text-white font-semibold rounded-xl px-6 py-3.5 text-base hover:bg-teal-600 active:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <lucide-icon [img]="ShieldIcon" [size]="20" />
              <span>{{
                isSaving ? 'Submitting...' : 'Request Verification'
              }}</span>
            </button>

            <button
              (click)="onSkipVerification()"
              class="w-full bg-slate-100 text-slate-700 font-medium rounded-xl px-6 py-2.5 text-sm hover:bg-slate-200 active:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <span>Skip for Now</span>
              <lucide-icon [img]="ArrowRightIcon" [size]="16" />
            </button>
          </div>
        </div>

        <!-- Secondary Actions -->
        <div class="mt-4 bg-white rounded-xl border border-slate-200 p-6">
          <h3 class="font-semibold text-slate-900 mb-3">
            Or continue without verification:
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              (click)="onGoToDashboard()"
              class="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
            >
              <lucide-icon
                [img]="TrendingUpIcon"
                [size]="24"
                class="text-slate-600"
              />
              <span class="text-sm font-medium text-slate-900">Dashboard</span>
            </button>

            <button
              (click)="onCreateOpportunity()"
              class="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
            >
              <lucide-icon
                [img]="BriefcaseIcon"
                [size]="24"
                class="text-slate-600"
              />
              <span class="text-sm font-medium text-slate-900"
                >Draft Opportunity</span
              >
            </button>
          </div>
          <p class="text-xs text-slate-500 text-center mt-3">
            You can request verification anytime from your dashboard
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [],
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
  CheckCircleIcon = CheckCircle;
  BriefcaseIcon = Briefcase;
  TrendingUpIcon = TrendingUp;
  ArrowRightIcon = ArrowRight;
  SparklesIcon = Sparkles;

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
