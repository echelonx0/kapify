// src/app/shared/components/profile-completion/profile-completion-badge.component.ts
import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalProfileValidationService, CompletionRequirement } from '../../services/global-profile-validation.service';

@Component({
  selector: 'profile-completion-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="badgeClasses()">
      <div class="flex items-center space-x-2">
        <div [class]="dotClasses()"></div>
        <span class="font-medium">{{ completion() }}% Complete</span>
        @if (showRequirement && completion() < minRequired) {
          <span class="text-xs opacity-75">
            ({{ minRequired }}% required)
          </span>
        }
      </div>
      @if (showStatus) {
        <div class="text-xs mt-1 opacity-90">
          {{ statusText() }}
        </div>
      }
    </div>
  `
})
export class ProfileCompletionBadgeComponent {
  @Input() minRequired: CompletionRequirement = 90;
  @Input() showRequirement = false;
  @Input() showStatus = false;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  private profileValidationService = inject(GlobalProfileValidationService);
  
  completion = computed(() => this.profileValidationService.completion());
  
  badgeClasses = computed(() => {
    const baseClasses = 'inline-flex flex-col border rounded-lg';
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base'
    };
    
    return `${baseClasses} ${sizeClasses[this.size]} ${this.profileValidationService.getCompletionBadgeColor()}`;
  });

  dotClasses = computed(() => {
    const baseClasses = 'w-2 h-2 rounded-full';
    const completion = this.completion();
    
    if (completion >= this.minRequired) {
      return `${baseClasses} bg-green-500`;
    } else if (completion >= 70) {
      return `${baseClasses} bg-blue-500`;
    } else if (completion >= 30) {
      return `${baseClasses} bg-yellow-500`;
    } else {
      return `${baseClasses} bg-gray-400`;
    }
  });

  statusText = computed(() => this.profileValidationService.getCompletionStatusText());
}

// // ===============================


// // ===============================

// // ===============================

// // src/app/shared/components/profile-completion/index.ts - Barrel Export
// export { ProfileCompletionBadgeComponent } from './profile-completion-badge.component';
// export { ProfileCompletionProgressComponent } from './profile-completion-progress.component';
// export { ProfileCompletionCardComponent } from './profile-completion-card.component'; 