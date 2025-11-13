// src/app/funder/create-opportunity/steps/eligibility-terms/eligibility.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Target } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

import { ClickOutsideDirective } from 'src/app/shared/directives/click-outside.directive';
import { CriteriaChipListComponent } from 'src/app/funder/components/criteria-chip-list.component';

@Component({
  selector: 'app-eligibility-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CriteriaChipListComponent,
    ClickOutsideDirective,
  ],
  templateUrl: './eligibility.component.html',
})
export class EligibilityFiltersComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);

  TargetIcon = Target;
}
