// src/app/funder/components/pending-verification-state/pending-verification-state.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Clock,
  CheckCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Briefcase,
  TrendingUp,
  Users,
  ArrowRight,
} from 'lucide-angular';

@Component({
  selector: 'app-pending-verification-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50 p-6 flex items-center justify-center"
    >
      <div class="max-w-2xl w-full">
        <!-- Main Status Card -->
        <div
          class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
        >
          <!-- Header with Status -->
          <div
            class="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 px-8 py-6"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-14 h-14 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [img]="ShieldIcon"
                  [size]="28"
                  class="text-white"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h1 class="text-2xl font-bold text-slate-900">
                    Verification Submitted
                  </h1>
                  <div
                    class="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold"
                  >
                    <lucide-icon [img]="ClockIcon" [size]="16" />
                    <span>Under Review</span>
                  </div>
                </div>
                <p class="text-slate-700 text-base leading-relaxed">
                  Our team is reviewing your organization details. You'll
                  receive an email notification once verification is complete.
                </p>
              </div>
            </div>
          </div>

          <!-- Expectation Setting -->
          <div class="px-8 py-6 bg-amber-50 border-b border-amber-100">
            <div class="flex items-center gap-3">
              <lucide-icon
                [img]="ClockIcon"
                [size]="20"
                class="text-amber-600 flex-shrink-0"
              />
              <div>
                <p class="text-sm font-semibold text-amber-900">
                  Expected completion: 2-3 business days
                </p>
                <p class="text-xs text-amber-700 mt-0.5">
                  We'll notify you via email as soon as we're done
                </p>
              </div>
            </div>
          </div>

          <!-- What You Can Do Now -->
          <div class="px-8 py-6 border-b border-slate-200">
            <h2 class="text-lg font-bold text-slate-900 mb-4">
              While You Wait
            </h2>
            <div class="space-y-3">
              <button
                (click)="onGoToDashboard()"
                class="w-full flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="TrendingUpIcon"
                    [size]="20"
                    class="text-teal-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">
                    Explore the Dashboard
                  </h3>
                  <p class="text-sm text-slate-600">
                    Get familiar with analytics, reporting, and opportunity
                    management tools
                  </p>
                </div>
              </button>

              <button
                (click)="onCreateOpportunity()"
                class="w-full flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="BriefcaseIcon"
                    [size]="20"
                    class="text-blue-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">
                    Draft Your First Opportunity
                  </h3>
                  <p class="text-sm text-slate-600">
                    Prepare funding criteria and requirements (publish once
                    verified)
                  </p>
                </div>
              </button>

              <button
                class="w-full flex items-start gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left"
              >
                <div
                  class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="UsersIcon"
                    [size]="20"
                    class="text-purple-600"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-900 mb-1">
                    Browse SME Profiles
                  </h3>
                  <p class="text-sm text-slate-600">
                    Discover businesses aligned with your investment focus
                  </p>
                </div>
              </button>
            </div>
          </div>

          <!-- Expandable Timeline -->
          <div class="px-8 py-4 bg-slate-50">
            <button
              (click)="toggleTimeline()"
              class="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span>View Verification Timeline</span>
              <lucide-icon
                [img]="showTimeline ? ChevronUpIcon : ChevronDownIcon"
                [size]="16"
              />
            </button>

            @if (showTimeline) {
            <div class="mt-4 space-y-4">
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="CheckCircleIcon"
                    [size]="20"
                    class="text-white"
                  />
                </div>
                <div class="flex-1 pt-1">
                  <p class="font-semibold text-slate-900 text-sm">
                    Application Submitted
                  </p>
                  <p class="text-xs text-slate-500">{{ verificationDate }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 animate-pulse"
                >
                  <lucide-icon
                    [img]="ClockIcon"
                    [size]="20"
                    class="text-white"
                  />
                </div>
                <div class="flex-1 pt-1">
                  <p class="font-semibold text-slate-900 text-sm">
                    Under Review
                  </p>
                  <p class="text-xs text-slate-500">
                    Our team is verifying your details
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3 opacity-40">
                <div
                  class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="ShieldIcon"
                    [size]="20"
                    class="text-slate-400"
                  />
                </div>
                <div class="flex-1 pt-1">
                  <p class="font-semibold text-slate-600 text-sm">
                    Verification Complete
                  </p>
                  <p class="text-xs text-slate-400">
                    You'll receive an email notification
                  </p>
                </div>
              </div>
            </div>
            }
          </div>

          <!-- Primary Action -->
          <div class="px-8 py-6 bg-white">
            <button
              (click)="onGoToDashboard()"
              class="w-full bg-teal-500 text-white font-semibold rounded-xl px-6 py-3.5 text-base hover:bg-teal-600 active:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Go to Dashboard
            </button>
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
  ShieldIcon = Shield;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  BriefcaseIcon = Briefcase;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  ArrowRightIcon = ArrowRight;

  // State
  showTimeline = false;

  toggleTimeline() {
    this.showTimeline = !this.showTimeline;
  }

  onGoToDashboard() {
    this.goToDashboard.emit();
  }

  onCreateOpportunity() {
    this.createOpportunity.emit();
  }
}
