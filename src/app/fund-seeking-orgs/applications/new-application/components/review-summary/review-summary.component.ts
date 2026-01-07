import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText,
  DollarSign,
  Building,
  CircleCheckBig,
  CircleAlert,
} from 'lucide-angular';

import { ApplicationFormData } from '../../models/application-form.model';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      <!-- Application Content Section -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        @if (formData().purposeStatement) {
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-2">
            <lucide-icon
              [img]="FileTextIcon"
              [size]="16"
              class="text-slate-600"
            />
            <span class="text-xs font-semibold text-slate-700"
              >Purpose Statement</span
            >
          </div>
          <p class="text-sm text-slate-700 leading-relaxed">
            {{ formData().purposeStatement }}
          </p>
        </div>
        } @if (formData().useOfFunds) {
        <div class="mb-4 pt-4 border-t border-slate-200">
          <div class="flex items-center gap-2 mb-2">
            <lucide-icon
              [img]="DollarSignIcon"
              [size]="16"
              class="text-slate-600"
            />
            <span class="text-xs font-semibold text-slate-700"
              >Use of Funds</span
            >
          </div>
          <p class="text-sm text-slate-700 leading-relaxed">
            {{ formData().useOfFunds }}
          </p>
        </div>
        } @if (formData().coverStatement) {
        <div class="pt-4 border-t border-slate-200">
          <div class="flex items-center gap-2 mb-2">
            <lucide-icon
              [img]="FileTextIcon"
              [size]="16"
              class="text-slate-600"
            />
            <span class="text-xs font-semibold text-slate-700"
              >Cover Statement</span
            >
          </div>
          <div class="flex items-center gap-2 text-sm text-slate-700">
            <lucide-icon
              [img]="FileTextIcon"
              [size]="14"
              class="text-slate-500"
            />
            <span>{{ formData().coverStatement!.name }}</span>
          </div>
        </div>
        }
      </div>

      <!-- AI Analysis Summary -->
      @if (aiAnalysisResult()) {
      <div class="bg-teal-50 border border-teal-200/50 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <lucide-icon
              [img]="DollarSignIcon"
              [size]="16"
              class="text-white"
            />
          </div>
          <div>
            <h4 class="font-semibold text-teal-900 text-sm">AI Analysis</h4>
            <p class="text-xs text-teal-700">
              Intelligent assessment completed
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-teal-600">
              {{ aiAnalysisResult().matchScore }}%
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">Match Score</p>
          </div>
          <div class="bg-white rounded-lg p-3 text-center">
            <div class="text-xl font-bold text-green-600">
              {{ aiAnalysisResult().successProbability }}%
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">Success Rate</p>
          </div>
          <div class="bg-white rounded-lg p-3 text-center">
            <p class="text-sm font-semibold text-slate-700 capitalize">
              {{ aiAnalysisResult().competitivePositioning }}
            </p>
            <p class="text-xs text-slate-600 font-medium mt-1">Position</p>
          </div>
        </div>
      </div>
      }

      <!-- Profile Attached -->
      <div class="bg-green-50 border border-green-200/50 rounded-2xl p-4">
        <div class="flex items-start gap-3">
          <lucide-icon
            [img]="CheckCircleIcon"
            [size]="18"
            class="text-green-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-green-900 text-sm">
                Business Profile Attached
              </p>
              <span
                class="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold"
              >
                {{ profileCompletion() }}%
              </span>
            </div>
            <p class="text-xs text-green-700 mt-1">
              Your complete business profile will be included with this
              application.
            </p>
          </div>
        </div>
      </div>

      <!-- Before You Submit -->
      <div class="bg-amber-50 border border-amber-200/50 rounded-2xl p-4">
        <div class="flex items-start gap-3">
          <lucide-icon
            [img]="AlertCircleIcon"
            [size]="18"
            class="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-amber-900 text-sm mb-2">
              Before You Submit
            </h4>
            <ul class="space-y-1.5 text-xs text-amber-700">
              <li class="flex items-start gap-2">
                <div
                  class="w-1 h-1 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
                ></div>
                <span>This application will be reviewed by the funder</span>
              </li>
              <li class="flex items-start gap-2">
                <div
                  class="w-1 h-1 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
                ></div>
                <span
                  >Review typically takes
                  {{ opportunity().decisionTimeframe || 30 }} days</span
                >
              </li>
              <li class="flex items-start gap-2">
                <div
                  class="w-1 h-1 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
                ></div>
                <span>You may be contacted for additional information</span>
              </li>
              <li class="flex items-start gap-2">
                <div
                  class="w-1 h-1 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
                ></div>
                <span
                  >All information provided must be accurate and
                  up-to-date</span
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReviewSummaryComponent {
  // Inputs
  opportunity = input.required<FundingOpportunity>();
  formData = input.required<ApplicationFormData>();
  aiAnalysisResult = input<any | null>(null);
  profileCompletion = input<number>(0);

  // Icons
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CircleCheckBig;
  AlertCircleIcon = CircleAlert;
  BuildingIcon = Building;

  // Computed
  requestedAmount = computed(() => {
    const amount = this.formData().requestedAmount;
    return amount ? parseFloat(amount) : 0;
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getOrganizationName(): string {
    return 'Private Funder'; // Replace with actual logic
  }
}
