// import { Component, input, output, inject } from '@angular/core';
// import { FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular'; 
// import { UiInputComponent } from '../../../../shared/components/ui-input.component';
// import { UiSelectComponent, SelectOption } from 'src/app/shared/components/ui-select/ui-select.component';


 
// @Component({
//   selector: 'app-business-back-office',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     LucideAngularModule,
//     UiSelectComponent,
//     UiInputComponent
//   ],
//   template: `
//     <div class="space-y-6">
//       <!-- Section Header -->
//       <div class="flex items-center justify-between cursor-pointer" (click)="toggleExpanded()">
//         <div class="flex items-center gap-3">
//           <h3 class="text-lg font-semibold text-neutral-900">Back Office Operations</h3>
//           <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
//             [class]="isComplete() ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">
//             {{ isComplete() ? 'Complete' : 'In Progress' }}
//           </span>
//         </div>
//         <div class="text-neutral-500">
//           @if (isExpanded()) {
//             <lucide-angular [img]="ChevronUpIcon" class="w-5 h-5"></lucide-angular>
//           } @else {
//             <lucide-angular [img]="ChevronDownIcon" class="w-5 h-5"></lucide-angular>
//           }
//         </div>
//       </div>

//       <!-- Content -->
//       @if (isExpanded()) {
//         <div [formGroup]="form()" class="space-y-6">
//           <!-- Accounting & Payroll Row -->
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="Accounting System"
//               placeholder="Select system"
//               [options]="systemOptions"
//               [required]="true"
//               formControlName="accountingSystem"
//               [error]="getFieldError('accountingSystem')"
//             ></ui-select>

//             <ui-select
//               label="Payroll System"
//               placeholder="Select system"
//               [options]="systemOptions"
//               [required]="true"
//               formControlName="payrollSystem"
//               [error]="getFieldError('payrollSystem')"
//             ></ui-select>
//           </div>

//           <!-- Finance Function & Staff Row -->
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="Finance Function"
//               placeholder="Select type"
//               [options]="financeOptions"
//               [required]="true"
//               formControlName="financeFunction"
//               [error]="getFieldError('financeFunction')"
//             ></ui-select>

//             <ui-input
//               label="Finance Staff Count"
//               type="number"
//               placeholder="0"
//               [required]="true"
//               formControlName="financeStaffCount"
//               [error]="getFieldError('financeStaffCount')"
//             ></ui-input>
//           </div>

//           <!-- Financial Manager & Total Staff Row -->
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="Financial Manager"
//               placeholder="Do you have one?"
//               [options]="yesNoOptions"
//               [required]="true"
//               formControlName="hasFinancialManager"
//               [error]="getFieldError('hasFinancialManager')"
//             ></ui-select>

//             <ui-input
//               label="Total Staff Complement"
//               type="number"
//               placeholder="0"
//               [required]="true"
//               formControlName="totalStaffCount"
//               [error]="getFieldError('totalStaffCount')"
//             ></ui-input>
//           </div>

//           <!-- HR Functions & Policies Row -->
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="HR Functions"
//               placeholder="Select scope"
//               [options]="hrOptions"
//               [required]="true"
//               formControlName="hrFunctions"
//               [error]="getFieldError('hrFunctions')"
//             ></ui-select>

//             <ui-select
//               label="Policies & Procedures"
//               placeholder="Do you have them?"
//               [options]="yesNoOptions"
//               [required]="true"
//               formControlName="hasPoliciesAndProcedures"
//               [error]="getFieldError('hasPoliciesAndProcedures')"
//             ></ui-select>
//           </div>

//           <!-- Asset Insurance & Critical Systems Row -->
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="Asset Insurance"
//               placeholder="Coverage status?"
//               [options]="insuranceOptions"
//               [required]="true"
//               formControlName="assetsInsured"
//               [error]="getFieldError('assetsInsured')"
//             ></ui-select>

//             <ui-input
//               label="Critical Systems"
//               placeholder="e.g., ERP, CMS, Food service"
//               formControlName="criticalSystems"
//               [hint]="'List key systems supporting operations'"
//             ></ui-input>
//           </div>

//           <!-- Policy Review Frequency (Conditional) -->
//           @if (shouldShowPolicyReview()) {
//             <ui-select
//               label="Policy Review Frequency"
//               placeholder="How often?"
//               [options]="frequencyOptions"
//               formControlName="policyReviewFrequency"
//               [error]="getFieldError('policyReviewFrequency')"
//             ></ui-select>
//           }
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//     }
//   `]
// })
// export class BusinessBackOfficeComponent {
//   form = input.required<FormGroup>();
//   isExpanded = input(true);
//   isComplete = input(false);
//   expandedChange = output<boolean>();

//   ChevronDownIcon = ChevronDown;
//   ChevronUpIcon = ChevronUp;

//   // Select options - reusable across app
//   systemOptions: SelectOption[] = [
//     { label: 'Sage Pastel', value: 'sage-pastel' },
//     { label: 'SAP', value: 'sap' },
//     { label: 'QuickBooks', value: 'quickbooks' },
//     { label: 'Xero', value: 'xero' },
//     { label: 'Other', value: 'other' }
//   ];

//   yesNoOptions: SelectOption[] = [
//     { label: 'Yes', value: 'yes' },
//     { label: 'No', value: 'no' }
//   ];

//   financeOptions: SelectOption[] = [
//     { label: 'Internal', value: 'internal' },
//     { label: 'External Consultants', value: 'external' },
//     { label: 'Mixed', value: 'mixed' }
//   ];

//   hrOptions: SelectOption[] = [
//     { label: 'In-house', value: 'inhouse' },
//     { label: 'Outsourced', value: 'outsourced' },
//     { label: 'Combination', value: 'combination' }
//   ];

//   insuranceOptions: SelectOption[] = [
//     { label: 'Fully Insured', value: 'full' },
//     { label: 'Partially Insured', value: 'partial' },
//     { label: 'Not Insured', value: 'none' }
//   ];

//   frequencyOptions: SelectOption[] = [
//     { label: 'Monthly', value: 'monthly' },
//     { label: 'Quarterly', value: 'quarterly' },
//     { label: 'Annually', value: 'annual' },
//     { label: 'As needed', value: 'asneeded' }
//   ];

//   toggleExpanded(): void {
//     this.expandedChange.emit(!this.isExpanded());
//   }

//   shouldShowPolicyReview(): boolean {
//     const control = this.form().get('hasPoliciesAndProcedures');
//     return control?.value === 'yes';
//   }

//   getFieldError(fieldName: string): string | undefined {
//     const field = this.form().get(fieldName);
//     if (field?.errors && field?.touched) {
//       if (field.errors['required']) return `This field is required`;
//       if (field.errors['min']) return 'Value must be greater than 0';
//     }
//     return undefined;
//   }
// }

import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular'; 
import { UiInputComponent } from '../../../../shared/components/ui-input.component';
import { SelectOption, UiSelectComponent } from 'src/app/shared/components/ui-select/ui-select.component';

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
          <div class="space-y-3">
            <p class="text-sm text-neutral-600">Please provide details about the back-office environment of the business.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-neutral-700 mb-2 block">Provide the name of your current accounting system</label>
                <ui-input
                  placeholder="Sage Pastel"
                  formControlName="accountingSystem"
                  [error]="getFieldError('accountingSystem')"
                ></ui-input>
              </div>

              <div>
                <label class="text-sm font-medium text-neutral-700 mb-2 block">Please provide the name of the payroll system in place</label>
                <ui-input
                  placeholder="PaySpace"
                  formControlName="payrollSystem"
                  [error]="getFieldError('payrollSystem')"
                ></ui-input>
              </div>
            </div>
          </div>

          <!-- Finance Function & Staff Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">Are the accounting and finance functions performed internally or by external consultants?</label>
              <ui-select
                placeholder="Select type"
                [options]="financeOptions"
                [required]="true"
                formControlName="financeFunction"
                [error]="getFieldError('financeFunction')"
              ></ui-select>
            </div>

            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">If finance functions are performed internally how many people are working in the finance department?</label>
              <ui-input
                type="number"
                placeholder="0"
                [required]="true"
                formControlName="financeStaffCount"
                [error]="getFieldError('financeStaffCount')"
              ></ui-input>
            </div>
          </div>

          <!-- Financial Manager & Total Staff Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">Do you have a financial manager and or financial director.</label>
              <ui-select
                placeholder="Do you have one?"
                [options]="yesNoOptions"
                [required]="true"
                formControlName="hasFinancialManager"
                [error]="getFieldError('hasFinancialManager')"
              ></ui-select>
            </div>

            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">What is the total staff compliment of the company?</label>
              <ui-input
                type="number"
                placeholder="0"
                [required]="true"
                formControlName="totalStaffCount"
                [error]="getFieldError('totalStaffCount')"
              ></ui-input>
            </div>
          </div>

          <!-- HR Functions & Policies Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">Are the HR functions outsources or inhouse? (Such as Recruitment and Selection, Training and Development, Performance Management, Employee Relations, Employment Law and Compliance, Compensation and Benefits and Administration, Payroll & HR Systems)</label>
              <ui-select
                placeholder="Select scope"
                [options]="hrOptions"
                [required]="true"
                formControlName="hrFunctions"
                [error]="getFieldError('hrFunctions')"
              ></ui-select>
            </div>

            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">Do you have policies and procedures? (finance, HR, etc)</label>
              <ui-select
                placeholder="Do you have them?"
                [options]="yesNoOptions"
                [required]="true"
                formControlName="hasPoliciesAndProcedures"
                [error]="getFieldError('hasPoliciesAndProcedures')"
              ></ui-select>
            </div>
          </div>

          <!-- Asset Insurance & Critical Systems Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">Are all company assets adequately insured?</label>
              <ui-select
                placeholder="Coverage status?"
                [options]="insuranceOptions"
                [required]="true"
                formControlName="assetsInsured"
                [error]="getFieldError('assetsInsured')"
              ></ui-select>
            </div>

            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">What other critical system are in place to aid the back office functions?</label>
              <ui-input
                placeholder="e.g., ERP, CMS, Food service"
                formControlName="criticalSystems"
                [hint]="'Optional - describe any additional systems'"
              ></ui-input>
            </div>
          </div>

          <!-- Policy Review Frequency (Conditional) -->
          @if (shouldShowPolicyReview()) {
            <div>
              <label class="text-sm font-medium text-neutral-700 mb-2 block">How frequently are the policies reviewed?</label>
              <ui-select
                placeholder="How often?"
                [options]="frequencyOptions"
                formControlName="policyReviewFrequency"
                [error]="getFieldError('policyReviewFrequency')"
              ></ui-select>
            </div>
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