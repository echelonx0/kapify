import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { SelectOption, UiSelectComponent } from 'src/app/shared/components/ui-select/ui-select.component';
 

 
@Component({
  selector: 'app-business-financial-statements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiSelectComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between cursor-pointer" (click)="toggleExpanded()">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-neutral-900">Financial Statements</h3>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            [class]="isComplete() ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">
            {{ isComplete() ? 'Complete' : 'In Progress' }}
          </span>
        </div>
        <div class="text-neutral-500">
          @if (isExpanded()) {
            <lucide-angular [img]="ChevronUpIcon" class="w-5 h-5"></lucide-angular>
          } @else {
            <lucide-angular [img]="ChevronDownIcon" class="w-5 h-5"></lucide-angular>
          }
        </div>
      </div>

      <!-- Content -->
      @if (isExpanded()) {
        <div [formGroup]="form()" class="space-y-6">
          <!-- Audit Status & Budget Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Financial Statements Status"
              placeholder="Are they audited?"
              [options]="auditOptions"
              [required]="true"
              formControlName="financialStatementsAudited"
              [error]="getFieldError('financialStatementsAudited')"
            ></ui-select>

            <ui-select
              label="Budget Availability"
              placeholder="Do you have a budget?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="budgetAvailable"
              [error]="getFieldError('budgetAvailable')"
            ></ui-select>
          </div>

          <!-- Contracts & Funding Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Long-term Contracts"
              placeholder="Do you have any?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="longTermContracts"
              [error]="getFieldError('longTermContracts')"
            ></ui-select>

            <ui-select
              label="Off-balance Sheet Funding"
              placeholder="Do you use this?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="offBalanceSheetFunding"
              [error]="getFieldError('offBalanceSheetFunding')"
            ></ui-select>
          </div>

          <!-- Asset Register & Permissions Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Asset Register"
              placeholder="Do you maintain one?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="assetRegisterAvailable"
              [error]="getFieldError('assetRegisterAvailable')"
            ></ui-select>

            <ui-select
              label="Lender Permissions Required"
              placeholder="Will lenders need approval?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="lenderPermissionsRequired"
              [error]="getFieldError('lenderPermissionsRequired')"
            ></ui-select>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class BusinessFinancialStatementsComponent {
  form = input.required<FormGroup>();
  isExpanded = input(true);
  isComplete = input(false);
  expandedChange = output<boolean>();

  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  yesNoOptions: SelectOption[] = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ];

  auditOptions: SelectOption[] = [
    { label: 'Audited', value: 'audited' },
    { label: 'Reviewed', value: 'reviewed' },
    { label: 'Compiled', value: 'compiled' },
    { label: 'Unaudited', value: 'unaudited' }
  ];

  toggleExpanded(): void {
    this.expandedChange.emit(!this.isExpanded());
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.form().get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `This field is required`;
      if (field.errors['min']) return 'Value must be greater than 0';
    }
    return undefined;
  }
}