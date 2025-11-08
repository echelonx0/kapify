// src/app/funder/components/pending-verification-state/pending-verification-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Clock,
  CheckCircle,
  Trophy,
  ArrowRight,
  Briefcase,
  Shield,
  Mail,
  Zap,
} from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-pending-verification-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100   p-4 lg:p-8 overflow-hidden"
    >
      <div class="w-full max-w-3xl mb-1">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
            Verification In Progress
          </h1>
        </div>

        <!-- Main Content Grid -->
        <div class="space-y-6">
          <!-- Timeline Card -->
          <div
            class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <h3 class="text-lg font-semibold text-slate-900">
                Verification Timeline
              </h3>
            </div>

            <div class="p-6 space-y-4">
              <!-- Step 1: Submitted -->
              <div class="flex items-start space-x-4">
                <div class="flex flex-col items-center">
                  <div
                    class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    <lucide-icon
                      [img]="CheckCircleIcon"
                      [size]="20"
                      class="text-white"
                    />
                  </div>
                  <div class="w-0.5 h-8 bg-slate-200 my-1"></div>
                </div>
                <div class="flex-1 pt-1">
                  <h4 class="font-semibold text-slate-900">
                    Application Submitted
                  </h4>
                  <p class="text-sm text-slate-600">{{ verificationDate }}</p>
                </div>
              </div>

              <!-- Step 2: Under Review -->
              <div class="flex items-start space-x-4">
                <div class="flex flex-col items-center">
                  <div
                    class="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  >
                    <div
                      class="w-3 h-3 bg-white rounded-full animate-pulse"
                    ></div>
                  </div>
                  <div class="w-0.5 h-8 bg-slate-200 my-1"></div>
                </div>
                <div class="flex-1 pt-1">
                  <h4 class="font-semibold text-slate-900">Under Review</h4>
                  <p class="text-sm text-slate-600">
                    Our team is verifying your organization details
                  </p>
                  <div
                    class="mt-2 inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-200/50 rounded-full"
                  >
                    <span class="text-xs font-semibold text-amber-700"
                      >⏱️ Typically 2-3 business days</span
                    >
                  </div>
                </div>
              </div>

              <!-- Step 3: Complete -->
              <div class="flex items-start space-x-4">
                <div class="flex flex-col items-center">
                  <div
                    class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <lucide-icon
                      [img]="TrophyIcon"
                      [size]="20"
                      class="text-slate-600"
                    />
                  </div>
                </div>
                <div class="flex-1 pt-1">
                  <h4 class="font-semibold text-slate-500">
                    Verification Complete
                  </h4>
                  <p class="text-sm text-slate-400">
                    You'll receive an email notification
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div
            class="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-300/50 rounded-2xl p-6 lg:p-8"
          >
            <div class="grid sm:grid-cols-2 gap-3 max-w-md mx-auto">
              <ui-button
                variant="primary"
                size="md"
                class="w-full"
                (clicked)="onGoToDashboard()"
              >
                <lucide-icon [img]="ArrowRightIcon" [size]="18" class="mr-2" />
                Go to Dashboard
              </ui-button>

              <ui-button
                variant="secondary"
                size="md"
                class="w-full"
                (clicked)="onCreateOpportunity()"
              >
                <lucide-icon [img]="BriefcaseIcon" [size]="18" class="mr-2" />
                Create Opportunity
              </ui-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PendingVerificationStateComponent {
  @Input() verificationDate!: string;

  @Output() goToDashboard = new EventEmitter<void>();
  @Output() createOpportunity = new EventEmitter<void>();

  // Icons
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  TrophyIcon = Trophy;
  ArrowRightIcon = ArrowRight;
  BriefcaseIcon = Briefcase;
  ShieldIcon = Shield;
  Mail = Mail;
  Zap = Zap;

  onGoToDashboard() {
    this.goToDashboard.emit();
  }

  onCreateOpportunity() {
    this.createOpportunity.emit();
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}
