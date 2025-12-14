// src/app/funder/create-opportunity/steps/eligibility-terms/eligibility.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Target } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/create-opportunity/services/opportunity-form-state.service';
import { ClickOutsideDirective } from 'src/app/shared/directives/click-outside.directive';
import { CriteriaChipListComponent } from 'src/app/funder/create-opportunity/shared/criteria-chip-list.component';
import { OpportunityUIHelperService } from '../../services/ui-helper.service';
import { SupabaseConstantsService } from 'src/app/shared/services/remote-constants.service';

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
export class EligibilityFiltersComponent implements OnInit {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  private supabaseConstants = inject(SupabaseConstantsService);

  TargetIcon = Target;

  async ngOnInit(): Promise<void> {
    // Wait for constants to load (they auto-load in constructor, but ensure they're ready)
    if (this.supabaseConstants.isLoading()) {
      console.log('⏳ Waiting for constants to load...');
      await this.supabaseConstants.initialize();
    }

    // Debug: Check if data is available
    console.log('📊 Component initialized with constants:', {
      industries: this.ui.targetIndustries().length,
      businessStages: this.ui.businessStages().length,
      geographicRegions: this.ui.geographicRegions().length,
    });

    // If still empty, something is wrong
    if (this.ui.targetIndustries().length === 0) {
      console.error('❌ No industries loaded - check Supabase connection');
    }
  }
}
