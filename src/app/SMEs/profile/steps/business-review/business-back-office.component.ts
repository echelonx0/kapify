import { Component, input, output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular'; 
import { UiInputComponent } from '../../../../shared/components/ui-input.component';
import { UiSelectComponent, SelectOption } from 'src/app/shared/components/ui-select/ui-select.component';


 
@Component({
  selector: 'app-business-back-office',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiSelectComponent,
    UiInputComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div class="flex items-center justify-between cursor-pointer" (click)="toggleExpanded()">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-neutral-900">Back Office Operations</h3>
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
          <!-- Accounting & Payroll Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Accounting System"
              placeholder="Select system"
              [options]="systemOptions"
              [required]="true"
              formControlName="accountingSystem"
              [error]="getFieldError('accountingSystem')"
            ></ui-select>

            <ui-select
              label="Payroll System"
              placeholder="Select system"
              [options]="systemOptions"
              [required]="true"
              formControlName="payrollSystem"
              [error]="getFieldError('payrollSystem')"
            ></ui-select>
          </div>

          <!-- Finance Function & Staff Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Finance Function"
              placeholder="Select type"
              [options]="financeOptions"
              [required]="true"
              formControlName="financeFunction"
              [error]="getFieldError('financeFunction')"
            ></ui-select>

            <ui-input
              label="Finance Staff Count"
              type="number"
              placeholder="0"
              [required]="true"
              formControlName="financeStaffCount"
              [error]="getFieldError('financeStaffCount')"
            ></ui-input>
          </div>

          <!-- Financial Manager & Total Staff Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Financial Manager"
              placeholder="Do you have one?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="hasFinancialManager"
              [error]="getFieldError('hasFinancialManager')"
            ></ui-select>

            <ui-input
              label="Total Staff Complement"
              type="number"
              placeholder="0"
              [required]="true"
              formControlName="totalStaffCount"
              [error]="getFieldError('totalStaffCount')"
            ></ui-input>
          </div>

          <!-- HR Functions & Policies Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="HR Functions"
              placeholder="Select scope"
              [options]="hrOptions"
              [required]="true"
              formControlName="hrFunctions"
              [error]="getFieldError('hrFunctions')"
            ></ui-select>

            <ui-select
              label="Policies & Procedures"
              placeholder="Do you have them?"
              [options]="yesNoOptions"
              [required]="true"
              formControlName="hasPoliciesAndProcedures"
              [error]="getFieldError('hasPoliciesAndProcedures')"
            ></ui-select>
          </div>

          <!-- Asset Insurance & Critical Systems Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ui-select
              label="Asset Insurance"
              placeholder="Coverage status?"
              [options]="insuranceOptions"
              [required]="true"
              formControlName="assetsInsured"
              [error]="getFieldError('assetsInsured')"
            ></ui-select>

            <ui-input
              label="Critical Systems"
              placeholder="e.g., ERP, CMS, Food service"
              formControlName="criticalSystems"
              [hint]="'List key systems supporting operations'"
            ></ui-input>
          </div>

          <!-- Policy Review Frequency (Conditional) -->
          @if (shouldShowPolicyReview()) {
            <ui-select
              label="Policy Review Frequency"
              placeholder="How often?"
              [options]="frequencyOptions"
              formControlName="policyReviewFrequency"
              [error]="getFieldError('policyReviewFrequency')"
            ></ui-select>
          }
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
export class BusinessBackOfficeComponent {
  form = input.required<FormGroup>();
  isExpanded = input(true);
  isComplete = input(false);
  expandedChange = output<boolean>();

  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // Select options - reusable across app
  systemOptions: SelectOption[] = [
    { label: 'Sage Pastel', value: 'sage-pastel' },
    { label: 'SAP', value: 'sap' },
    { label: 'QuickBooks', value: 'quickbooks' },
    { label: 'Xero', value: 'xero' },
    { label: 'Other', value: 'other' }
  ];

  yesNoOptions: SelectOption[] = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ];

  financeOptions: SelectOption[] = [
    { label: 'Internal', value: 'internal' },
    { label: 'External Consultants', value: 'external' },
    { label: 'Mixed', value: 'mixed' }
  ];

  hrOptions: SelectOption[] = [
    { label: 'In-house', value: 'inhouse' },
    { label: 'Outsourced', value: 'outsourced' },
    { label: 'Combination', value: 'combination' }
  ];

  insuranceOptions: SelectOption[] = [
    { label: 'Fully Insured', value: 'full' },
    { label: 'Partially Insured', value: 'partial' },
    { label: 'Not Insured', value: 'none' }
  ];

  frequencyOptions: SelectOption[] = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Annually', value: 'annual' },
    { label: 'As needed', value: 'asneeded' }
  ];

  toggleExpanded(): void {
    this.expandedChange.emit(!this.isExpanded());
  }

  shouldShowPolicyReview(): boolean {
    const control = this.form().get('hasPoliciesAndProcedures');
    return control?.value === 'yes';
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