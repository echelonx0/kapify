// import { Component, input, output, inject } from '@angular/core';
// import { FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
// import { UiInputComponent } from '../../../../shared/components/ui-input.component';
// import {
//   UiSelectComponent,
//   SelectOption,
// } from 'src/app/shared/components/ui-select/ui-select.component';

// @Component({
//   selector: 'app-business-back-office',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     LucideAngularModule,
//     UiSelectComponent,
//     UiInputComponent,
//   ],
//   template: `
//     <div class="space-y-6">
//       <!-- Section Header -->
//       <div
//         class="flex items-center justify-between cursor-pointer"
//         (click)="toggleExpanded()"
//       >
//         <div class="flex items-center gap-3">
//           <h3 class="text-lg font-semibold text-neutral-900">
//             Back Office Operations
//           </h3>
//           <span
//             class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
//             [class]="
//               isComplete()
//                 ? 'bg-green-100 text-green-800'
//                 : 'bg-amber-100 text-amber-800'
//             "
//           >
//             {{ isComplete() ? 'Complete' : 'In Progress' }}
//           </span>
//         </div>
//         <div class="text-neutral-500">
//           @if (isExpanded()) {
//           <lucide-angular
//             [img]="ChevronUpIcon"
//             class="w-5 h-5"
//           ></lucide-angular>
//           } @else {
//           <lucide-angular
//             [img]="ChevronDownIcon"
//             class="w-5 h-5"
//           ></lucide-angular>
//           }
//         </div>
//       </div>

//       <!-- Content -->
//       @if (isExpanded()) {
//       <div [formGroup]="form()" class="space-y-6">
//         <!-- Accounting & Payroll Row -->
//         <div class="space-y-3">
//           <p class="text-sm text-neutral-600">
//             Please provide details about the back-office environment of the
//             business.
//           </p>
//           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <ui-select
//               label="Provide the name of your current accounting system"
//               placeholder="Sage Pastel"
//               [options]="systemOptions"
//               [required]="true"
//               formControlName="accountingSystem"
//               [error]="getFieldError('accountingSystem')"
//             ></ui-select>

//             <ui-select
//               label="Please provide the name of the payroll system in place"
//               placeholder="Select system"
//               [options]="systemOptions"
//               [required]="true"
//               formControlName="payrollSystem"
//               [error]="getFieldError('payrollSystem')"
//             ></ui-select>
//           </div>
//         </div>

//         <!-- Finance Function & Staff Row -->
//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <ui-select
//             label="Are the accounting and finance functions performed internally or by external consultants?"
//             placeholder="Select type"
//             [options]="financeOptions"
//             [required]="true"
//             formControlName="financeFunction"
//             [error]="getFieldError('financeFunction')"
//           ></ui-select>

//           <ui-input
//             label="If finance functions are performed internally how many people are working in the finance department?"
//             type="number"
//             placeholder="0"
//             [required]="true"
//             formControlName="financeStaffCount"
//             [error]="getFieldError('financeStaffCount')"
//           ></ui-input>
//         </div>

//         <!-- Financial Manager & Total Staff Row -->
//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <ui-select
//             label="Do you have a financial manager and or financial director?"
//             placeholder="Do you have one?"
//             [options]="yesNoOptions"
//             [required]="true"
//             formControlName="hasFinancialManager"
//             [error]="getFieldError('hasFinancialManager')"
//           ></ui-select>

//           <ui-input
//             label="What is the total staff compliment of the company?"
//             type="number"
//             placeholder="0"
//             [required]="true"
//             formControlName="totalStaffCount"
//             [error]="getFieldError('totalStaffCount')"
//           ></ui-input>
//         </div>

//         <!-- HR Functions & Policies Row -->
//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <ui-select
//             label="Are the HR functions outsourced or inhouse? (Like Recruitment and Selection, Training & Development, etc)"
//             placeholder="Select scope"
//             [options]="hrOptions"
//             [required]="true"
//             formControlName="hrFunctions"
//             [error]="getFieldError('hrFunctions')"
//           ></ui-select>
//           <ui-input
//             label="What other critical system are in place to aid the back office functions?"
//             placeholder="e.g., ERP, CMS, Food service"
//             formControlName="criticalSystems"
//             [hint]="'Optional - describe any additional systems'"
//           ></ui-input>
//         </div>

//         <!-- Asset Insurance & Critical Systems Row -->
//         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <ui-select
//             label="Are all company assets adequately insured?"
//             placeholder="Coverage status?"
//             [options]="insuranceOptions"
//             [required]="true"
//             formControlName="assetsInsured"
//             [error]="getFieldError('assetsInsured')"
//           ></ui-select>
//           <ui-select
//             label="Do you have policies and procedures? (finance, HR, etc)"
//             placeholder="Do you have them?"
//             [options]="yesNoOptions"
//             [required]="true"
//             formControlName="hasPoliciesAndProcedures"
//             [error]="getFieldError('hasPoliciesAndProcedures')"
//           ></ui-select>
//         </div>

//         <!-- Policy Review Frequency (Conditional) -->
//         @if (shouldShowPolicyReview()) {
//         <ui-select
//           label="How frequently are the policies reviewed?"
//           placeholder="How often?"
//           [options]="frequencyOptions"
//           formControlName="policyReviewFrequency"
//           [error]="getFieldError('policyReviewFrequency')"
//         ></ui-select>
//         }
//       </div>
//       }
//     </div>
//   `,
//   styles: [
//     `
//       :host {
//         display: block;
//       }
//     `,
//   ],
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
//     { label: 'Other', value: 'other' },
//   ];

//   yesNoOptions: SelectOption[] = [
//     { label: 'Yes', value: 'yes' },
//     { label: 'No', value: 'no' },
//   ];

//   financeOptions: SelectOption[] = [
//     { label: 'Internal', value: 'internal' },
//     { label: 'External Consultants', value: 'external' },
//     { label: 'Mixed', value: 'mixed' },
//   ];

//   hrOptions: SelectOption[] = [
//     { label: 'In-house', value: 'inhouse' },
//     { label: 'Outsourced', value: 'outsourced' },
//     { label: 'Combination', value: 'combination' },
//   ];

//   insuranceOptions: SelectOption[] = [
//     { label: 'Fully Insured', value: 'full' },
//     { label: 'Partially Insured', value: 'partial' },
//     { label: 'Not Insured', value: 'none' },
//   ];

//   frequencyOptions: SelectOption[] = [
//     { label: 'Monthly', value: 'monthly' },
//     { label: 'Quarterly', value: 'quarterly' },
//     { label: 'Annually', value: 'annual' },
//     { label: 'As needed', value: 'asneeded' },
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

import {
  Component,
  input,
  output,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { UiInputComponent } from '../../../../shared/components/ui-input.component';
import {
  UiSelectComponent,
  SelectOption,
} from 'src/app/shared/components/ui-select/ui-select.component';
import {
  BackOfficeFormQuestionsService,
  BackOfficeFormQuestion,
} from 'src/app/admin/services/form-questions.service';

@Component({
  selector: 'app-business-back-office',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiSelectComponent,
    UiInputComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Section Header -->
      <div
        class="flex items-center justify-between cursor-pointer"
        (click)="toggleExpanded()"
      >
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-neutral-900">
            Back Office Operations
          </h3>
          <span
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            [class]="
              isComplete()
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            "
          >
            {{ isComplete() ? 'Complete' : 'In Progress' }}
          </span>
        </div>
        <div class="text-neutral-500">
          @if (isExpanded()) {
          <lucide-angular
            [img]="ChevronUpIcon"
            class="w-5 h-5"
          ></lucide-angular>
          } @else {
          <lucide-angular
            [img]="ChevronDownIcon"
            class="w-5 h-5"
          ></lucide-angular>
          }
        </div>
      </div>

      <!-- Content -->
      @if (isExpanded()) {
      <div [formGroup]="form()" class="space-y-6">
        <!-- Intro Text -->
        @if (introText(); as intro) {
        <p class="text-sm text-neutral-600">{{ intro }}</p>
        }

        <!-- Dynamic Question Rows -->
        @for (row of questionRows(); track row.rowId) {
        <div [class]="row.gridClass">
          @for (question of row.questions; track question.id) { @switch
          (question.input_type) { @case ('select') {
          <ui-select
            [label]="question.label"
            [placeholder]="question.placeholder || 'Select option'"
            [options]="getOptionsForQuestion(question.field_name)"
            [required]="question.is_required"
            [formControlName]="question.field_name"
            [error]="getFieldError(question.field_name)"
          ></ui-select>
          } @case ('textarea') {
          <ui-input
            [label]="question.label"
            [placeholder]="question.placeholder || ''"
            type="textarea"
            [required]="question.is_required"
            [formControlName]="question.field_name"
            [hint]="question.hint"
            [error]="getFieldError(question.field_name)"
          ></ui-input>
          } @case ('number') {
          <ui-input
            [label]="question.label"
            [placeholder]="question.placeholder || '0'"
            type="number"
            [required]="question.is_required"
            [formControlName]="question.field_name"
            [hint]="question.hint"
            [error]="getFieldError(question.field_name)"
          ></ui-input>
          } @default {
          <ui-input
            [label]="question.label"
            [placeholder]="question.placeholder || ''"
            type="text"
            [required]="question.is_required"
            [formControlName]="question.field_name"
            [hint]="question.hint"
            [error]="getFieldError(question.field_name)"
          ></ui-input>
          } } }
        </div>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BusinessBackOfficeComponent implements OnInit {
  form = input.required<FormGroup>();
  isExpanded = input(true);
  isComplete = input(false);
  expandedChange = output<boolean>();

  private questionsService = inject(BackOfficeFormQuestionsService);

  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // Load questions from DB - directly reference service signal
  readonly questions = computed(() => this.questionsService.allQuestions());
  readonly isLoading = signal(false);

  // Group questions by row
  readonly questionRows = computed(() => {
    const questions = this.questions();
    const rows: {
      rowId: string;
      gridClass: string;
      questions: BackOfficeFormQuestion[];
    }[] = [];
    const groupedByField = new Map<
      string | undefined,
      BackOfficeFormQuestion[]
    >();

    // Group by field_group
    questions.forEach((q) => {
      const group = q.field_group || q.id;
      if (!groupedByField.has(group)) {
        groupedByField.set(group, []);
      }
      groupedByField.get(group)!.push(q);
    });

    // Build rows
    groupedByField.forEach((qList, group) => {
      rows.push({
        rowId: group as string,
        gridClass:
          qList.length === 1
            ? 'grid grid-cols-1'
            : 'grid grid-cols-1 md:grid-cols-2 gap-4',
        questions: qList,
      });
    });

    return rows;
  });

  readonly introText = computed(() => {
    return this.questions().length > 0
      ? 'Please provide details about the back-office environment of the business.'
      : null;
  });

  async ngOnInit() {
    this.isLoading.set(true);
    console.log('🔵 BusinessBackOfficeComponent ngOnInit started');
    try {
      console.log('🔵 Calling loadAllQuestions()');
      await this.questionsService.loadAllQuestions();
      console.log('🔵 loadAllQuestions() completed');

      const serviceQuestions = this.questionsService.allQuestions();
      console.log('🔵 Service allQuestions signal:', serviceQuestions);
      console.log('🔵 Service allQuestions length:', serviceQuestions.length);

      const computedQuestions = this.questions();
      console.log('🔵 Computed questions signal:', computedQuestions);
      console.log('🔵 Computed questions length:', computedQuestions.length);

      const rows = this.questionRows();
      console.log('🔵 Question rows:', rows);
      console.log('🔵 Question rows length:', rows.length);
    } catch (err) {
      console.error('❌ Failed to load questions:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getOptionsForQuestion(fieldName: string): SelectOption[] {
    // Map field names to constant options
    const optionsMap: Record<string, SelectOption[]> = {
      accountingSystem: [
        { label: 'Sage Pastel', value: 'sage-pastel' },
        { label: 'SAP', value: 'sap' },
        { label: 'QuickBooks', value: 'quickbooks' },
        { label: 'Xero', value: 'xero' },
        { label: 'Other', value: 'other' },
      ],
      payrollSystem: [
        { label: 'Sage Pastel', value: 'sage-pastel' },
        { label: 'SAP', value: 'sap' },
        { label: 'QuickBooks', value: 'quickbooks' },
        { label: 'Xero', value: 'xero' },
        { label: 'Other', value: 'other' },
      ],
      financeFunction: [
        { label: 'Internal', value: 'internal' },
        { label: 'External Consultants', value: 'external' },
        { label: 'Mixed', value: 'mixed' },
      ],
      hasFinancialManager: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      hrFunctions: [
        { label: 'In-house', value: 'inhouse' },
        { label: 'Outsourced', value: 'outsourced' },
        { label: 'Combination', value: 'combination' },
      ],
      assetsInsured: [
        { label: 'Fully Insured', value: 'full' },
        { label: 'Partially Insured', value: 'partial' },
        { label: 'Not Insured', value: 'none' },
      ],
      hasPoliciesAndProcedures: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      policyReviewFrequency: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Quarterly', value: 'quarterly' },
        { label: 'Annually', value: 'annual' },
        { label: 'As needed', value: 'asneeded' },
      ],
    };

    return optionsMap[fieldName] || [];
  }

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
