// src/app/profile/steps/components/profile-steps-sidebar/profile-steps-sidebar.component.ts

import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, AlertCircle } from 'lucide-angular';
 
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
    <div class="flex flex-col w-full h-full">
      <!-- Header -->
      <div class="p-4 border-b border-neutral-200 flex-shrink-0">
        <h2 class="text-lg font-semibold text-neutral-900 mb-2">Progress</h2>
        
        <!-- Overall Progress -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-neutral-600">{{ completedSteps() }} of {{ totalSteps() }} sections</span>
          <span class="text-sm font-bold text-primary-600">{{ overallProgress() }}%</span>
        </div>
        
        <div class="w-full bg-neutral-200 rounded-full h-2">
          <div 
            class="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
            [style.width.%]="overallProgress()"
          ></div>
        </div>
      </div>

      <!-- Steps Navigation -->
      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        @for (step of steps(); track step.id; let i = $index) {
          <div class="relative">
            <!-- Connection Line -->
            @if (i < steps().length - 1) {
              <div class="absolute left-6 top-12 w-0.5 h-8 bg-neutral-200"></div>
            }
            
            <!-- Step Card -->
            <button
              (click)="stepClicked.emit(step.id)"
              [class]="getStepCardClasses(step, i)"
              [disabled]="!canAccessStep(step.id)"
              class="w-full text-left p-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div class="flex items-start space-x-3 min-w-0">
                <!-- Step Icon -->
                <div [class]="getStepIconClasses(step)" class="flex-shrink-0">
                  @if (isStepComplete(step.id)) {
                    <lucide-icon [img]="CheckIcon" [size]="16" class="text-white" />
                  } @else {
                    <lucide-icon [img]="step.icon" [size]="16" />
                  }
                </div>
                
                <!-- Step Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <h3 [class]="getStepTitleClasses(step)" class="truncate">{{ step.shortTitle }}</h3>
                    
                    <!-- Status Badge - Only show if incomplete AND required -->
                    @if (step.priority === 'high' && !isStepComplete(step.id)) {
                      <span class="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium flex-shrink-0 whitespace-nowrap">
                        Required
                      </span>
                    }
                  </div>
                  
                  <!-- Status and Time Info -->
                  <div class="flex items-center justify-between mt-1 text-xs">
                    <div class="flex items-center space-x-2 flex-shrink-0">
                      @if (isStepComplete(step.id)) {
                        <span class="text-green-600 font-medium">Complete</span>
                      } @else if (isCurrentStep(step.id)) {
                        <span class="text-primary-600 font-medium">In Progress</span>
                      } @else if (canAccessStep(step.id)) {
                        <span class="text-neutral-500">Available</span>
                      } @else {
                        <span class="text-neutral-400">Locked</span>
                      }
                    </div>
                    
                    @if (!isStepComplete(step.id)) {
                      <span class="text-neutral-500 flex-shrink-0">{{ step.estimatedTime }}</span>
                    }
                  </div>
                  
                  <!-- Completion Percentage for Incomplete Steps -->
                  @if (!isStepComplete(step.id) && getCompletionPercentage(step.id) > 0) {
                    <div class="mt-2">
                      <div class="w-full bg-neutral-200 rounded-full h-1.5">
                        <div 
                          class="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
                          [style.width.%]="getCompletionPercentage(step.id)"
                        ></div>
                      </div>
                      <div class="text-xs text-neutral-600 mt-1">
                        {{ getCompletionPercentage(step.id) }}% complete
                      </div>
                    </div>
                  }
                  
                  <!-- Missing Fields Alert - Only show if incomplete -->
                  @if (!isStepComplete(step.id) && getMissingFields(step.id).length > 0) {
                    <div class="mt-2 bg-orange-50 border border-orange-200 rounded p-2">
                      <div class="flex items-start gap-2 min-w-0">
                        <lucide-icon [img]="AlertCircleIcon" [size]="14" class="text-orange-600 flex-shrink-0 mt-0.5" />
                        <div class="text-xs text-orange-700 min-w-0">
                          <strong>Missing:</strong>
                          <ul class="list-disc list-inside mt-1 space-y-0.5">
                            @for (field of getMissingFields(step.id).slice(0, 2); track field) {
                              <li class="truncate text-orange-700" [title]="field">{{ field }}</li>
                            }
                            @if (getMissingFields(step.id).length > 2) {
                              <li class="text-orange-700">+{{ getMissingFields(step.id).length - 2 }} more</li>
                            }
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </button>
          </div>
        }
      </nav>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ProfileStepsSidebarComponent {
  private profileService = inject(FundingProfileSetupService);

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

  // Computed values
  overallProgress = computed(() => {
    const total = this.steps().length;
    const completed = this.steps().filter(s => this.isStepComplete(s.id)).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  completedSteps = computed(() => {
    return this.steps().filter(s => this.isStepComplete(s.id)).length;
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

  getStepCardClasses(step: StepConfig, index: number): string {
    const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
    
    if (this.isStepComplete(step.id)) {
      return `${baseClasses} border-green-200 bg-green-50 hover:bg-green-100`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} border-primary-300 bg-primary-50 hover:bg-primary-100 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} border-neutral-200 bg-white hover:bg-neutral-50`;
    } else {
      return `${baseClasses} border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed`;
    }
  }

  getStepIconClasses(step: StepConfig): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center';
    
    if (this.isStepComplete(step.id)) {
      return `${baseClasses} bg-green-500`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-neutral-200 text-neutral-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-400`;
    }
  }

  getStepTitleClasses(step: StepConfig): string {
    const baseClasses = 'text-sm font-medium';
    
    if (this.isStepComplete(step.id)) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-primary-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-neutral-900`;
    } else {
      return `${baseClasses} text-neutral-500`;
    }
  }
}