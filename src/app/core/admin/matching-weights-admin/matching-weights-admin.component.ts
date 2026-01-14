import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Save,
  RotateCcw,
  Info,
  TrendingUp,
  Target,
} from 'lucide-angular';

import { ToastService } from 'src/app/shared/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatchingWeights } from 'src/app/funding/marketplace/components/smart-suggestions/engine/matching-engine.model';
import { MatchingWeightsService } from 'src/app/funding/marketplace/components/smart-suggestions/engine/matchingweights.service';

interface WeightConfig {
  key: keyof MatchingWeights;
  label: string;
  description: string;
  category: 'matching' | 'bonus';
  icon: any;
}

@Component({
  selector: 'app-matching-weights-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate(
          '200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    <div class="min-h-screen bg-slate-50 py-8 px-4 lg:px-8">
      <!-- Page Title Section -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 class="text-3xl font-bold text-slate-900 mb-2">
              Matching Engine Weights
            </h1>
            <p class="text-slate-600">
              Fine-tune how opportunities are ranked and matched to applications
            </p>
          </div>
          <div
            class="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-50 rounded-2xl border-2 border-teal-300 flex items-center justify-center flex-shrink-0"
          >
            <lucide-icon [img]="TargetIcon" size="24" class="text-teal-600" />
          </div>
        </div>

        <!-- Info Banner (Neo-brutalist inspired) -->
        <div
          class="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 flex items-start gap-3"
        >
          <lucide-icon
            [img]="InfoIcon"
            size="20"
            class="text-blue-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p class="text-sm font-semibold text-blue-900">How Weights Work</p>
            <p class="text-sm text-blue-700 mt-1">
              Higher weights increase the importance of that factor in the
              matching algorithm. Total weight doesn't need to equal 100. Adjust
              values to match your fund's investment thesis.
            </p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Form Area -->
          <div class="lg:col-span-2">
            <!-- Loading State -->
            <div
              *ngIf="isLoading()"
              class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
            >
              <div
                class="animate-spin w-8 h-8 border-2 border-slate-300 border-t-teal-500 rounded-full mx-auto mb-4"
              ></div>
              <p class="text-slate-600 text-sm">Loading configuration...</p>
            </div>

            <!-- Form -->
            <form
              *ngIf="!isLoading()"
              (ngSubmit)="save()"
              class="space-y-6"
              @fadeInOut
            >
              <!-- Matching Criteria Section -->
              <div
                class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div
                  class="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-50 border-b border-slate-200"
                >
                  <h2
                    class="text-lg font-bold text-slate-900 flex items-center gap-2"
                  >
                    <div
                      class="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center"
                    >
                      <lucide-icon
                        [img]="TrendingUpIcon"
                        size="16"
                        class="text-teal-600"
                      />
                    </div>
                    Core Matching Factors
                  </h2>
                  <p class="text-sm text-slate-600 mt-1">
                    How strongly each factor influences matching scores
                  </p>
                </div>

                <div class="p-6 space-y-4">
                  <div
                    *ngFor="let config of matchingConfigs"
                    class="weight-input-group"
                    @fadeInOut
                  >
                    <div
                      class="flex items-center justify-between mb-2 pb-2 border-b border-slate-100"
                    >
                      <div class="flex-1">
                        <label
                          class="text-sm font-semibold text-slate-900 block"
                        >
                          {{ config.label }}
                        </label>
                        <p class="text-xs text-slate-500 mt-0.5">
                          {{ config.description }}
                        </p>
                      </div>
                      <div class="flex-shrink-0 w-24 relative">
                        <input
                          type="number"
                          [(ngModel)]="weights()[config.key]"
                          [name]="config.key"
                          min="0"
                          step="0.1"
                          class="w-full text-right px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-900
                            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                            transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bonus Factors Section -->
              <div
                class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div
                  class="px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-50 border-b border-amber-200/50"
                >
                  <h2
                    class="text-lg font-bold text-slate-900 flex items-center gap-2"
                  >
                    <div
                      class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"
                    >
                      <span class="text-amber-600 font-bold text-xs">⭐</span>
                    </div>
                    Bonus Multipliers
                  </h2>
                  <p class="text-sm text-slate-600 mt-1">
                    Additional factors that boost matching scores
                  </p>
                </div>

                <div class="p-6 space-y-4">
                  <div
                    *ngFor="let config of bonusConfigs"
                    class="weight-input-group"
                    @fadeInOut
                  >
                    <div
                      class="flex items-center justify-between mb-2 pb-2 border-b border-slate-100"
                    >
                      <div class="flex-1">
                        <label
                          class="text-sm font-semibold text-slate-900 block"
                        >
                          {{ config.label }}
                        </label>
                        <p class="text-xs text-slate-500 mt-0.5">
                          {{ config.description }}
                        </p>
                      </div>
                      <div class="flex-shrink-0 w-24">
                        <input
                          type="number"
                          [(ngModel)]="weights()[config.key]"
                          [name]="config.key"
                          min="0"
                          step="0.1"
                          class="w-full text-right px-3 py-2 border-2 border-amber-300 rounded-lg text-sm font-semibold text-slate-900
                            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                            transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons (Neo-brutalist style) -->
              <div
                class="flex gap-3 sticky bottom-0 bg-white rounded-2xl border-2 border-slate-300 p-4"
              >
                <button
                  type="submit"
                  [disabled]="isSaving()"
                  class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-bold rounded-lg border-2 border-teal-700
                    hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    uppercase tracking-wide text-sm"
                >
                  <lucide-icon *ngIf="!isSaving()" [img]="SaveIcon" size="18" />
                  <svg
                    *ngIf="isSaving()"
                    class="animate-spin w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {{ isSaving() ? 'Saving...' : 'Save Weights' }}
                </button>

                <button
                  type="button"
                  (click)="reset()"
                  [disabled]="isSaving()"
                  class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-semibold rounded-lg border-2 border-slate-400
                    hover:bg-slate-50 active:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    uppercase tracking-wide text-sm"
                >
                  <lucide-icon [img]="RotateCcwIcon" size="18" />
                  Reset
                </button>
              </div>
            </form>
          </div>

          <!-- Right Sidebar -->
          <div class="lg:col-span-1">
            <!-- Weight Summary Card -->
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6 space-y-6"
            >
              <div>
                <h3
                  class="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4"
                >
                  Current Configuration
                </h3>
                <div class="space-y-3">
                  <div
                    class="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200/50"
                  >
                    <span class="text-xs font-semibold text-teal-900">
                      Total Matching Weight
                    </span>
                    <span class="text-lg font-bold text-teal-700">
                      {{ totalMatchingWeight() | number : '1.1-1' }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200/50"
                  >
                    <span class="text-xs font-semibold text-amber-900">
                      Total Bonus Weight
                    </span>
                    <span class="text-lg font-bold text-amber-700">
                      {{ totalBonusWeight() | number : '1.1-1' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Guidelines -->
              <div class="border-t border-slate-200 pt-6">
                <h4
                  class="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3"
                >
                  Guidelines
                </h4>
                <ul class="space-y-2 text-xs text-slate-600">
                  <li class="flex gap-2">
                    <span class="text-teal-600 font-bold flex-shrink-0">•</span>
                    <span>
                      Higher values = stronger influence on match scores
                    </span>
                  </li>
                  <li class="flex gap-2">
                    <span class="text-teal-600 font-bold flex-shrink-0">•</span>
                    <span> All weights are proportional to each other </span>
                  </li>
                  <li class="flex gap-2">
                    <span class="text-teal-600 font-bold flex-shrink-0">•</span>
                    <span> No minimum or maximum total required </span>
                  </li>
                  <li class="flex gap-2">
                    <span class="text-teal-600 font-bold flex-shrink-0">•</span>
                    <span> Test changes and monitor match quality </span>
                  </li>
                </ul>
              </div>

              <!-- Last Updated -->
              <div class="border-t border-slate-200 pt-6">
                <p class="text-xs text-slate-500">
                  <strong>Last updated:</strong><br />
                  {{ lastUpdated() || 'Never' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .weight-input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      input[type='number'] {
        font-variant-numeric: tabular-nums;
      }
    `,
  ],
})
export class MatchingWeightsAdminComponent implements OnInit {
  private weightsService = inject(MatchingWeightsService);
  private toast = inject(ToastService);

  // Icons
  SaveIcon = Save;
  RotateCcwIcon = RotateCcw;
  InfoIcon = Info;
  TrendingUpIcon = TrendingUp;
  TargetIcon = Target;

  // State
  isLoading = signal(true);
  isSaving = signal(false);
  lastUpdated = signal<string>('');

  weights = signal<MatchingWeights>({
    fundingType: 0,
    fundingAmount: 0,
    businessStage: 0,
    industry: 0,
    geography: 0,
    intent: 0,
    recencyBonus: 0,
    competitionBonus: 0,
  });

  // Configuration
  matchingConfigs: WeightConfig[] = [
    {
      key: 'fundingType',
      label: 'Funding Type Match',
      description: 'How much equity vs debt vs grants matter',
      category: 'matching',
      icon: '💰',
    },
    {
      key: 'fundingAmount',
      label: 'Funding Amount Alignment',
      description: 'How closely requested amount aligns with your range',
      category: 'matching',
      icon: '📊',
    },
    {
      key: 'businessStage',
      label: 'Business Stage Fit',
      description: 'How well growth stage matches your thesis',
      category: 'matching',
      icon: '📈',
    },
    {
      key: 'industry',
      label: 'Industry Focus',
      description: 'How strongly sector preferences affect matching',
      category: 'matching',
      icon: '🎯',
    },
    {
      key: 'geography',
      label: 'Geographic Preference',
      description: 'Regional or location-based alignment scoring',
      category: 'matching',
      icon: '🌍',
    },
    {
      key: 'intent',
      label: 'Investment Intent Match',
      description: 'How use-of-funds aligns with your investment criteria',
      category: 'matching',
      icon: '🎓',
    },
  ];

  bonusConfigs: WeightConfig[] = [
    {
      key: 'recencyBonus',
      label: 'Recency Bonus',
      description: 'Prioritize recently submitted applications',
      category: 'bonus',
      icon: '⏱️',
    },
    {
      key: 'competitionBonus',
      label: 'Competition Bonus',
      description: 'Boost less-viewed opportunities to increase diversity',
      category: 'bonus',
      icon: '⭐',
    },
  ];

  // Computed properties
  totalMatchingWeight = computed(() => {
    const w = this.weights();
    return (
      w.fundingType +
      w.fundingAmount +
      w.businessStage +
      w.industry +
      w.geography +
      w.intent
    );
  });

  totalBonusWeight = computed(() => {
    const w = this.weights();
    return w.recencyBonus + w.competitionBonus;
  });

  ngOnInit() {
    this.loadWeights();
  }

  private async loadWeights() {
    this.isLoading.set(true);
    try {
      const w = await this.weightsService.getWeights();
      this.weights.set({ ...w });
      this.lastUpdated.set(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to load weights:', error);
      this.toast.error('Failed to load matching weights');
    } finally {
      this.isLoading.set(false);
    }
  }

  async save() {
    this.isSaving.set(true);
    try {
      await this.weightsService.saveWeights(this.weights());
      this.lastUpdated.set(new Date().toLocaleString());
      this.toast.success('Matching weights saved successfully');
    } catch (error) {
      console.error('Failed to save weights:', error);
      this.toast.error('Failed to save weights');
    } finally {
      this.isSaving.set(false);
    }
  }

  reset() {
    this.loadWeights();
  }
}
