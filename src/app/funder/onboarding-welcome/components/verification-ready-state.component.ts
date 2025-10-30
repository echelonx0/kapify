import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingState } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-verification-ready-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'verification-ready-state.component.html',
})
export class VerificationReadyStateComponent {
  @Input() onboardingState: OnboardingState | null = null;
  @Input() isSaving = false;
  @Input() completionPercentage = 0;

  @Output() requestVerification = new EventEmitter<void>();
  @Output() skipVerification = new EventEmitter<void>();
  @Output() createOpportunity = new EventEmitter<void>();
  @Output() goToDashboard = new EventEmitter<void>();

  // Safe getter methods for organization data
  getOrgName(): string {
    return this.onboardingState?.organization?.name || 'Not specified';
  }

  getOrgType(): string {
    const type = this.onboardingState?.organization?.organizationType;
    if (!type) return 'Not specified';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  getFoundedYear(): string {
    return (
      this.onboardingState?.organization?.ncrNumber?.toString() ||
      'Not specified'
    );
  }

  getCountry(): string {
    return this.onboardingState?.organization?.country || 'Not specified';
  }

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
