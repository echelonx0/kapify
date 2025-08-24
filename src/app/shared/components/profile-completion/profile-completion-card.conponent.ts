
// src/app/shared/components/profile-completion/profile-completion-card.component.ts
import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-angular';
import { UiButtonComponent } from '../ui-button.component';
import { GlobalProfileValidationService, CompletionRequirement } from '../../services/global-profile-validation.service';
import { ProfileCompletionProgressComponent } from './profile-completion-progress.component';
import { ProfileCompletionBadgeComponent } from './profile-completion-badge.component';

@Component({
  selector: 'profile-completion-card',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule, 
    UiButtonComponent,
    ProfileCompletionProgressComponent,
    ProfileCompletionBadgeComponent
  ],
  template: `
    <div [class]="cardClasses()">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div [class]="iconClasses()">
            @if (validationResult()?.canProceed) {
              <lucide-icon [img]="CheckCircleIcon" [size]="20" />
            } @else {
              <lucide-icon [img]="AlertTriangleIcon" [size]="20" />
            }
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ title }}</h3>
            @if (subtitle) {
              <p class="text-sm text-gray-600">{{ subtitle }}</p>
            }
          </div>
        </div>
        
        @if (showBadge) {
          <profile-completion-badge 
            [minRequired]="minRequired"
            [showStatus]="true"
            size="sm"
          />
        }
      </div>

      <!-- Progress -->
      @if (showProgress) {
        <div class="mb-4">
          <profile-completion-progress 
            [minRequired]="minRequired"
            [showMilestones]="showMilestones"
            [showMessage]="false"
            [showEstimatedTime]="true"
          />
        </div>
      }

      <!-- Message and Action -->
      @if (validationResult(); as result) {
        <div [class]="messageClasses()">
          <p class="text-sm mb-3">{{ result.message }}</p>
          
          @if (showActionButton) {
            <div class="flex items-center space-x-2">
              <ui-button
                [variant]="result.canProceed ? 'primary' : 'outline'"
                [size]="buttonSize"
                (click)="handleAction()"
                [disabled]="isLoading"
              >
                {{ result.actionText }}
                @if (result.canProceed) {
                  <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-2" />
                }
              </ui-button>
              
              @if (!result.canProceed && showCompleteProfileButton) {
                <ui-button
                  variant="outline"
                  [size]="buttonSize"
                  (click)="goToProfile()"
                >
                  Complete Profile
                </ui-button>
              }
            </div>
          }
        </div>
      }

      <!-- Next Steps (for incomplete profiles) -->
      @if (!validationResult()?.canProceed && showNextSteps) {
        <div class="mt-4 p-3 bg-gray-50 rounded-lg border">
          <h4 class="text-sm font-medium text-gray-900 mb-2">Next Steps:</h4>
          <ul class="text-sm text-gray-600 space-y-1">
            @for (step of profileInsights()?.nextSteps; track step) {
              <li class="flex items-center">
                <span class="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                {{ step }}
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `
})
export class ProfileCompletionCardComponent {
  @Input() title = 'Profile Completion';
  @Input() subtitle?: string;
  @Input() minRequired: CompletionRequirement = 90;
  @Input() showBadge = true;
  @Input() showProgress = true;
  @Input() showMilestones = true;
  @Input() showActionButton = true;
  @Input() showCompleteProfileButton = true;
  @Input() showNextSteps = true;
  @Input() buttonSize: 'sm' | 'md' | 'lg' = 'md';
  @Input() cardStyle: 'default' | 'minimal' | 'highlighted' = 'default';
  
  @Output() actionClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();

  // Icons
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ArrowRightIcon = ArrowRight;

  private profileValidationService = inject(GlobalProfileValidationService);
  private router = inject(Router);

  isLoading = computed(() => this.profileValidationService.isLoading());
  validationResult = computed(() => 
    this.profileValidationService.validateForRequirement(this.minRequired)
  );
  profileInsights = computed(() => this.profileValidationService.getProfileInsights());

  cardClasses = computed(() => {
    const base = 'bg-white rounded-lg border';
    const styles = {
      default: 'p-6 shadow-sm',
      minimal: 'p-4',
      highlighted: 'p-6 shadow-md border-l-4 border-l-primary-500'
    };
    return `${base} ${styles[this.cardStyle]}`;
  });

  iconClasses = computed(() => {
    const base = 'w-10 h-10 rounded-lg flex items-center justify-center';
    const result = this.validationResult();
    
    if (result?.canProceed) {
      return `${base} bg-green-100 text-green-600`;
    } else {
      return `${base} bg-yellow-100 text-yellow-600`;
    }
  });

  messageClasses = computed(() => {
    const result = this.validationResult();
    if (result?.canProceed) {
      return 'text-green-800';
    } else {
      return 'text-yellow-800';
    }
  });

  handleAction(): void {
    this.actionClick.emit();
  }

  goToProfile(): void {
    this.router.navigate(['/profile/steps']);
    this.profileClick.emit();
  }
}
