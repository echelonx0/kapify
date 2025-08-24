// src/app/shared/components/profile-completion/profile-completion-progress.component.ts
import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalProfileValidationService, CompletionRequirement } from '../../services/global-profile-validation.service';

@Component({
  selector: 'profile-completion-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-3">
      @if (showHeader) {
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700">
            Profile Completion
          </span>
          <span [class]="percentageClasses()">
            {{ completion() }}%
          </span>
        </div>
      }
      
      <!-- Progress Bar -->
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          [class]="progressBarClasses()"
          class="h-2 rounded-full transition-all duration-300 ease-in-out"
          [style.width.%]="completion()"
        ></div>
      </div>
      
      @if (showMilestones) {
        <!-- Milestone Markers -->
        <div class="relative">
          <div class="flex justify-between text-xs text-gray-500">
            <span [class]="milestoneClasses(30)">30%</span>
            <span [class]="milestoneClasses(70)">70%</span>
            <span [class]="milestoneClasses(90)">90%</span>
          </div>
          
          @if (showMilestoneLabels) {
            <div class="flex justify-between text-xs mt-1">
              <span class="text-gray-400">Basic</span>
              <span class="text-gray-400">Opportunities</span>
              <span class="text-gray-400">Applications</span>
            </div>
          }
        </div>
      }
      
      @if (showMessage && validationResult()) {
        <div [class]="messageClasses()">
          <p class="text-sm">{{ validationResult()!.message }}</p>
          @if (estimatedTime && completion() < minRequired) {
            <p class="text-xs mt-1 opacity-75">
              Estimated time to {{ minRequired }}%: {{ estimatedTime() }}
            </p>
          }
        </div>
      }
    </div>
  `
})
export class ProfileCompletionProgressComponent {
  @Input() minRequired: CompletionRequirement = 90;
  @Input() showHeader = true;
  @Input() showMilestones = true;
  @Input() showMilestoneLabels = false;
  @Input() showMessage = true;
  @Input() showEstimatedTime = false;

  private profileValidationService = inject(GlobalProfileValidationService);
  
  completion = computed(() => this.profileValidationService.completion());
  
  validationResult = computed(() => 
    this.profileValidationService.validateForRequirement(this.minRequired)
  );

  estimatedTime = computed(() => 
    this.showEstimatedTime 
      ? this.profileValidationService.getEstimatedTimeToRequirement(this.minRequired)
      : null
  );

  percentageClasses = computed(() => {
    const completion = this.completion();
    if (completion >= this.minRequired) {
      return 'text-green-600 font-semibold';
    } else if (completion >= 70) {
      return 'text-blue-600 font-semibold';
    } else {
      return 'text-gray-600 font-semibold';
    }
  });

  progressBarClasses = computed(() => {
    return this.profileValidationService.getProgressBarColor();
  });

  milestoneClasses = computed(() => (milestone: number) => {
    const completion = this.completion();
    return completion >= milestone 
      ? 'text-green-600 font-medium' 
      : 'text-gray-400';
  });

  messageClasses = computed(() => {
    const result = this.validationResult();
    if (!result) return '';

    if (result.canProceed) {
      return 'bg-green-50 border border-green-200 rounded-lg p-3 text-green-800';
    } else {
      return 'bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800';
    }
  });
}
