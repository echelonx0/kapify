import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Target, DollarSign, ChevronUp, ChevronDown } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';
import { UiTextareaComponent } from 'src/app/shared/components/ui-textarea.component';
import { EXCLUDED_SECTORS } from 'src/app/shared/utils/categories';
import { ClickOutsideDirective } from 'src/app/shared/directives/click-outside.directive';

@Component({
  selector: 'app-eligibility-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, UiTextareaComponent, ClickOutsideDirective],
  templateUrl: './eligibility.component.html',
})
export class EligibilityFiltersComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);

  // Icons
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;

  // Dynamic data
  excludedSectors = EXCLUDED_SECTORS;
}
