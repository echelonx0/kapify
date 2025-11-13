// src/app/funder/create-opportunity/steps/settings.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Eye,
  Settings,
  Calendar,
  Info,
} from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/create-opportunity/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

@Component({
  selector: 'app-application-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './fund-terms.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ApplicationSettingsComponent implements OnInit {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);

  // Icons
  EyeIcon = Eye;
  SettingsIcon = Settings;
  CalendarIcon = Calendar;
  InfoIcon = Info;

  // Track deadline preference
  hasDeadlinePreference = signal<boolean>(false);

  ngOnInit() {
    const existingDeadline = this.formState.formData().applicationDeadline;
    this.hasDeadlinePreference.set(
      !!(existingDeadline && existingDeadline.trim())
    );
  }

  onDeadlineToggle(hasDeadline: boolean): void {
    this.hasDeadlinePreference.set(hasDeadline);

    if (!hasDeadline) {
      const event = { target: { value: '' } } as any;
      this.ui.onFieldChange('applicationDeadline', event);
    }
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
