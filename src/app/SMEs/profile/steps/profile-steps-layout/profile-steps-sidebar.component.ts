// src/app/profile/steps/components/profile-steps-sidebar/profile-steps-sidebar.component.ts

import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, AlertCircle, Lock } from 'lucide-angular';
import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';

export interface StepConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: any;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

export interface SectionData {
  stepId: string;
  completionPercentage: number;
  missingFields: string[];
  isRequired: boolean;
  isComplete: boolean;
}

@Component({
  selector: 'app-profile-steps-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full bg-white">
      
      <!-- Header with Progress -->
      <div class="px-6 py-6 border-b border-slate-200 flex-shrink-0">
       
        
        <!-- Overall Progress Metric -->
        <div class="flex items-baseline gap-2 mb-4">
          <span class="text-3xl font-bold text-slate-900">{{ overallProgress() }}%</span>
          <span class="text-sm text-slate-600">{{ completedSteps() }} of {{ totalSteps() }} sections</span>
        </div>
        
        <!-- Progress Bar -->
        <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
            [style.width.%]="overallProgress()"
          ></div>
        </div>
      </div>

      <!-- Steps List -->
      <nav class="flex-1 overflow-y-auto">
        <div class="p-4 space-y-3">
          @for (step of steps(); track step.id; let i = $index) {
            <button
              (click)="stepClicked.emit(step.id)"
              [disabled]="!canAccessStep(step.id)"
              [class]="getStepCardClasses(step)"
              class="w-full text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-xl"
            >
              <!-- Step Card Container -->
              <div class="px-4 py-3.5 rounded-xl border transition-all duration-200">
                
                <!-- Top Row: Icon, Title, Badge -->
                <div class="flex items-start gap-3 mb-2">
                  <!-- Step Icon -->
                  <div [class]="getStepIconClasses(step)" class="flex-shrink-0">
                    @if (isStepComplete(step.id)) {
                      <lucide-icon [img]="CheckIcon" [size]="16" class="text-white" />
                    } @else if (!canAccessStep(step.id)) {
                      <lucide-icon [img]="LockIcon" [size]="16" />
                    } @else {
                      <lucide-icon [img]="step.icon" [size]="16" />
                    }
                  </div>
                  
                  <!-- Title and Badge -->
                  <div class="flex-1 min-w-0">
                    <h3 [class]="getStepTitleClasses(step)" class="text-sm font-semibold truncate">
                      {{ step.shortTitle }}
                    </h3>
                  </div>
                  
                  <!-- Status Badge -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    @if (step.priority === 'high' && !isStepComplete(step.id)) {
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200/50">
                        Required
                      </span>
                    }
                  </div>
                </div>
                
                <!-- Status Info Row -->
                <div class="flex items-center justify-between text-xs px-0.5 mb-2.5">
                  <div class="flex items-center gap-1.5">
                    @if (isStepComplete(step.id)) {
                      <span class="font-semibold text-green-700">Complete</span>
                    } @else if (isCurrentStep(step.id)) {
                      <span class="font-semibold text-orange-700">In Progress</span>
                    } @else if (canAccessStep(step.id)) {
                      <span class="text-slate-600">Ready to start</span>
                    } @else {
                      <span class="text-slate-500">Locked</span>
                    }
                  </div>
                  
                  @if (!isStepComplete(step.id)) {
                    <span class="text-slate-500">{{ step.estimatedTime }}</span>
                  }
                </div>
                
                <!-- Progress Bar for In-Progress Steps -->
                @if (!isStepComplete(step.id) && getCompletionPercentage(step.id) > 0) {
                  <div class="mb-2.5">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs font-medium text-slate-600">Progress</span>
                      <span class="text-xs font-bold text-slate-900">{{ getCompletionPercentage(step.id) }}%</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        class="h-full bg-gradient-to-r from-orange-300 to-orange-400 rounded-full transition-all duration-300"
                        [style.width.%]="getCompletionPercentage(step.id)"
                      ></div>
                    </div>
                  </div>
                }
                
                <!-- Missing Fields Alert -->
                @if (!isStepComplete(step.id) && getMissingFields(step.id).length > 0) {
                  <div class="bg-orange-50 border border-orange-200/50 rounded-lg p-2.5 mt-2">
                    <div class="flex gap-2 min-w-0">
                      <lucide-icon [img]="AlertCircleIcon" [size]="14" class="text-orange-600 flex-shrink-0 mt-0.5" />
                      <div class="text-xs text-orange-700 min-w-0">
                        <strong class="block mb-1">Missing:</strong>
                        <ul class="space-y-0.5">
                          @for (field of getMissingFields(step.id).slice(0, 2); track field) {
                            <li class="truncate" [title]="field">{{ field }}</li>
                          }
                          @if (getMissingFields(step.id).length > 2) {
                            <li class="text-orange-600">+{{ getMissingFields(step.id).length - 2 }} more</li>
                          }
                        </ul>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </button>
          }
        </div>
      </nav>

      <!-- Footer Stats -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0 space-y-2">
        <div class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Completion</div>
        <div class="grid grid-cols-3 gap-2">
          <div class="text-center">
            <div class="text-lg font-bold text-green-600">{{ completedSteps() }}</div>
            <div class="text-xs text-slate-600">Completed</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-orange-600">{{ inProgressSteps() }}</div>
            <div class="text-xs text-slate-600">In Progress</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-bold text-slate-400">{{ lockedSteps() }}</div>
            <div class="text-xs text-slate-600">Locked</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    :host ::ng-deep button:disabled {
      cursor: not-allowed;
    }

    /* Smooth scroll */
    :host ::ng-deep nav {
      scroll-behavior: smooth;
    }
  `]
})
export class ProfileStepsSidebarComponent {
 

  // Inputs
  steps = input.required<StepConfig[]>();
  currentStepId = input.required<string>();
  canAccessStepFn = input.required<(stepId: string) => boolean>();
  sectionDataFn = input.required<(stepId: string) => SectionData | null>();

  // Outputs
  stepClicked = output<string>();

  // Icons
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  LockIcon = Lock;

  // Computed - Overall Progress
  overallProgress = computed(() => {
    const total = this.steps().length;
    const completed = this.steps().filter(s => this.isStepComplete(s.id)).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  completedSteps = computed(() => {
    return this.steps().filter(s => this.isStepComplete(s.id)).length;
  });

  inProgressSteps = computed(() => {
    return this.steps().filter(s => 
      !this.isStepComplete(s.id) && 
      this.canAccessStep(s.id) && 
      this.getCompletionPercentage(s.id) > 0
    ).length;
  });

  lockedSteps = computed(() => {
    return this.steps().filter(s => !this.canAccessStep(s.id)).length;
  });

  totalSteps = computed(() => {
    return this.steps().length;
  });

  // Helper Methods
  isStepComplete(stepId: string): boolean {
    const data = this.sectionDataFn()(stepId);
    return data?.isComplete ?? false;
  }

  isCurrentStep(stepId: string): boolean {
    return this.currentStepId() === stepId;
  }

  canAccessStep(stepId: string): boolean {
    return this.canAccessStepFn()(stepId);
  }

  getCompletionPercentage(stepId: string): number {
    const data = this.sectionDataFn()(stepId);
    return data?.completionPercentage ?? 0;
  }

  getMissingFields(stepId: string): string[] {
    const data = this.sectionDataFn()(stepId);
    return data?.missingFields ?? [];
  }

  // Dynamic Styling
  getStepCardClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'bg-green-50 border-green-200/50 hover:border-green-300/50 hover:shadow-sm';
    } else if (this.isCurrentStep(step.id)) {
      return 'bg-orange-50 border-orange-300/50 hover:border-orange-400/50 shadow-sm';
    } else if (this.canAccessStep(step.id)) {
      return 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm';
    } else {
      return 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed';
    }
  }

  getStepIconClasses(step: StepConfig): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center font-semibold';
    
    if (this.isStepComplete(step.id)) {
      return `${baseClasses} bg-green-600 text-white`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-orange-500 text-white`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-slate-100 text-slate-600`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-400`;
    }
  }

  getStepTitleClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'text-green-900';
    } else if (this.isCurrentStep(step.id)) {
      return 'text-orange-900';
    } else if (this.canAccessStep(step.id)) {
      return 'text-slate-900';
    } else {
      return 'text-slate-500';
    }
  }
}