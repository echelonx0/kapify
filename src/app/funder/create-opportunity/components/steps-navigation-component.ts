 
// src/app/funder/create-opportunity/components/steps-navigation-component.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, AlertCircle } from 'lucide-angular';
import { StepNavigationService } from '../step-navigation.service';
import { OrganizationStateService } from '../../services/organization-state.service';

@Component({
  selector: 'app-opportunity-steps-navigation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
      <!-- Progress Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-900 text-sm">Progress</h3>
          <span class="text-xs font-medium text-primary-600">
            Step {{ currentStepIndex() + 1 }} of {{ steps.length }}
          </span>
        </div>
        
        @if (organizationError()) {
          <p class="text-xs text-red-600 mt-2 flex items-center">
            <lucide-angular [img]="AlertCircleIcon" [size]="12" class="mr-1"></lucide-angular>
            Setup required
          </p>
        }
      </div>

      <!-- Steps List -->
      <div class="space-y-1.5">
        @for (step of steps; track step.id; let i = $index) {
          <button 
            class="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200"
            [class]="getStepClasses(step.id)"
            [disabled]="organizationError() && step.id === 'review'"
            (click)="navigateToStep(step.id)"
          >
            <!-- Step Icon -->
            <div [class]="getIconClasses(step.id)">
              @if (isStepCompleted(step.id)) {
                <lucide-angular [img]="CheckIcon" [size]="14" class="text-white"></lucide-angular>
              } @else if (organizationError() && step.id === 'review') {
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="text-red-500"></lucide-angular>
              } @else {
                <span class="text-xs font-bold">{{ i + 1 }}</span>
              }
            </div>
            
            <!-- Step Info -->
            <div class="flex-1 min-w-0 text-left">
              <p [class]="getTitleClasses(step.id)">
                {{ step.title }}
              </p>
            </div>
          </button>
        }
      </div>

      <!-- Completion Summary -->
      @if (allStepsCompleted() && !organizationError()) {
        <div class="mt-6 pt-6 border-t border-gray-100">
          <div class="flex items-center space-x-2 text-green-600">
            <lucide-angular [img]="CheckIcon" [size]="16"></lucide-angular>
            <span class="text-xs font-medium">Ready to publish</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OpportunityStepsNavigationComponent {
  private stepNavigation = inject(StepNavigationService);
  private organizationState = inject(OrganizationStateService);

  // Icons
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;

  // Service state
  steps = this.stepNavigation.steps;
  currentStep = this.stepNavigation.currentStep;
  currentStepIndex = this.stepNavigation.currentStepIndex;
  organizationError = this.organizationState.organizationError;

  // Computed - check if all steps are completed
  allStepsCompleted = computed(() => {
    return this.steps.every(step => this.stepNavigation.isStepCompleted(step.id));
  });

  // Methods
  navigateToStep(stepId: string) {
    if (this.organizationError() && stepId === 'review') return;
    this.stepNavigation.goToStep(stepId as any);
  }

  isStepCompleted(stepId: string): boolean {
    return this.stepNavigation.isStepCompleted(stepId);
  }

  // Styling helpers
  getStepClasses(stepId: string): string {
    const isActive = this.currentStep() === stepId;
    const isCompleted = this.isStepCompleted(stepId);
    const isBlocked = this.organizationError() && stepId === 'review';

    if (isBlocked) {
      return 'bg-red-50 opacity-50 cursor-not-allowed';
    }
    if (isActive) {
      return 'bg-primary-50 border border-primary-200 shadow-sm';
    }
    if (isCompleted) {
      return 'bg-green-50 hover:bg-green-100 border border-transparent';
    }
    return 'hover:bg-gray-50 border border-transparent';
  }

  getIconClasses(stepId: string): string {
    const isActive = this.currentStep() === stepId;
    const isCompleted = this.isStepCompleted(stepId);
    const isBlocked = this.organizationError() && stepId === 'review';

    const base = 'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0';

    if (isBlocked) {
      return `${base} bg-red-100`;
    }
    if (isCompleted) {
      return `${base} bg-green-500`;
    }
    if (isActive) {
      return `${base} bg-primary-500 text-white shadow-sm`;
    }
    return `${base} bg-gray-100 text-gray-600`;
  }

  getTitleClasses(stepId: string): string {
    const isActive = this.currentStep() === stepId;
    const isCompleted = this.isStepCompleted(stepId);

    if (isActive) {
      return 'text-sm font-semibold text-primary-900';
    }
    if (isCompleted) {
      return 'text-sm font-medium text-green-700';
    }
    return 'text-sm font-medium text-gray-700';
  }
}