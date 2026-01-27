import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Check,
  AlertCircle,
  Lock,
  ArrowLeft,
} from 'lucide-angular';

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
  templateUrl: './profile-steps-sidebar.component.html',
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
  ArrowLeftIcon = ArrowLeft;

  // ===============================
  // NAVIGATION
  // ===============================

  /**
   * Go back to previous page using browser history
   */
  goBack(): void {
    window.history.back();
  }

  // ===============================
  // COMPUTED: Required steps only
  // ===============================

  requiredSteps = computed(() => {
    return this.steps().filter((s) => this.isStepRequired(s.id));
  });

  overallProgress = computed(() => {
    const required = this.requiredSteps();
    const completed = required.filter((s) => this.isStepComplete(s.id)).length;
    return required.length > 0
      ? Math.round((completed / required.length) * 100)
      : 0;
  });

  completedRequired = computed(() => {
    return this.requiredSteps().filter((s) => this.isStepComplete(s.id)).length;
  });

  inProgressRequired = computed(() => {
    return this.requiredSteps().filter(
      (s) =>
        !this.isStepComplete(s.id) &&
        this.canAccessStep(s.id) &&
        this.getCompletionPercentage(s.id) > 0
    ).length;
  });

  lockedRequired = computed(() => {
    return this.requiredSteps().filter((s) => !this.canAccessStep(s.id)).length;
  });

  // ===============================
  // HELPER METHODS
  // ===============================

  isStepRequired(stepId: string): boolean {
    const data = this.sectionDataFn()(stepId);
    return data?.isRequired ?? false;
  }

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

  // ===============================
  // DYNAMIC NEO-BRUTAL STYLING
  // ===============================

  getStepCardClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'bg-green-50 hover:shadow-lg active:shadow-md';
    } else if (this.isCurrentStep(step.id)) {
      return 'bg-teal-50 hover:shadow-lg active:shadow-md current';
    } else if (this.canAccessStep(step.id)) {
      return 'bg-white hover:shadow-lg active:shadow-md';
    } else {
      return 'bg-slate-50 opacity-60 cursor-not-allowed';
    }
  }

  getStepIconClasses(step: StepConfig): string {
    const baseClasses = 'rounded-none flex-shrink-0';

    if (this.isStepComplete(step.id)) {
      return `${baseClasses} bg-green-600 text-white border-green-700`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-500 text-white border-teal-700`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-slate-200 text-slate-700 border-slate-400`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-400 border-slate-300`;
    }
  }

  getStepTitleClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'text-green-900';
    } else if (this.isCurrentStep(step.id)) {
      return 'text-teal-900';
    } else if (this.canAccessStep(step.id)) {
      return 'text-slate-900';
    } else {
      return 'text-slate-500';
    }
  }
}
