// src/app/funder/components/form-sections/eligibility-filters.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Target, DollarSign } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

 

@Component({
  selector: 'app-eligibility-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './eligibility.component.html',
})
export class EligibilityFiltersComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  
  // Icons
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
}