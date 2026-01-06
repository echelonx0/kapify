import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LucideAngularModule, Save, Clock } from 'lucide-angular';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { FundingProfileSetupService } from '../../../../fund-seeking-orgs/services/funding-profile-setup.service';
import { BusinessBackOfficeComponent } from './business-back-office.component';
import { BusinessFinancialStatementsComponent } from './business-financial-statements.component';
import { BusinessAssessmentMapper } from './business-assessment.mapper';
import { StepSaveService } from '../../services/step-save.service';
@Component({
  selector: 'app-business-review',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    BusinessBackOfficeComponent,
    BusinessFinancialStatementsComponent,
  ],
  templateUrl: 'business-review.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BusinessReviewComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);
  private mapper = inject(BusinessAssessmentMapper);
  private stepSaveService = inject(StepSaveService);
  businessAssessmentForm: FormGroup;

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  isBackOfficeExpanded = signal(true);
  isFinancialExpanded = signal(true);

  // Icons
  SaveIcon = Save;
  ClockIcon = Clock;

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.businessAssessmentForm = this.fb.group({
      // Back Office Section
      accountingSystem: ['', [Validators.required]],
      payrollSystem: ['', [Validators.required]],
      financeFunction: ['', [Validators.required]],
      financeStaffCount: ['', [Validators.required, Validators.min(0)]],
      hasFinancialManager: ['', [Validators.required]],
      totalStaffCount: ['', [Validators.required, Validators.min(1)]],
      hrFunctions: ['', [Validators.required]],
      hasPoliciesAndProcedures: ['', [Validators.required]],
      policyReviewFrequency: [''],
      assetsInsured: ['', [Validators.required]],
      criticalSystems: [''],

      // Financial Statements Section
      financialStatementsAudited: ['', [Validators.required]],
      budgetAvailable: ['', [Validators.required]],
      longTermContracts: ['', [Validators.required]],
      offBalanceSheetFunding: ['', [Validators.required]],
      assetRegisterAvailable: ['', [Validators.required]],
      lenderPermissionsRequired: ['', [Validators.required]],
    });

    this.setupConditionalValidation();
  }

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();

    // Register form-based dirty tracking (existing pattern)
    this.stepSaveService.registerForm(this.businessAssessmentForm);
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Clean up form registration
    this.stepSaveService.clearForm();
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData =
      this.fundingApplicationService.data().businessAssessment;
    if (existingData) {
      const formValues = this.mapper.toFormValue(existingData);
      this.businessAssessmentForm.patchValue(formValues, { emitEvent: false });
    }
  }

  private setupAutoSave() {
    this.autoSaveSubscription = interval(30000)
      .pipe(takeWhile(() => true))
      .subscribe(() => {
        if (this.hasFormData() && !this.isSaving()) {
          this.saveData(false);
        }
      });

    this.businessAssessmentForm.valueChanges.subscribe(() =>
      this.debouncedSave()
    );
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (this.hasFormData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000);
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const assessmentData = this.mapper.toModel(
        this.businessAssessmentForm.value
      );
      this.fundingApplicationService.updateBusinessAssessment(assessmentData);

      if (isManual) {
        await this.fundingApplicationService.saveCurrentProgress();
      }

      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save business assessment:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===============================
  // FORM HELPERS
  // ===============================

  private setupConditionalValidation() {
    this.businessAssessmentForm
      .get('hasPoliciesAndProcedures')
      ?.valueChanges.subscribe((value) => {
        const policyReviewControl = this.businessAssessmentForm.get(
          'policyReviewFrequency'
        );
        if (value === 'yes') {
          policyReviewControl?.setValidators([Validators.required]);
        } else {
          policyReviewControl?.clearValidators();
        }
        policyReviewControl?.updateValueAndValidity();
      });
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.businessAssessmentForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required'])
        return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['min']) return 'Value must be greater than 0';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      accountingSystem: 'Accounting system',
      payrollSystem: 'Payroll system',
      financeFunction: 'Finance function type',
      financeStaffCount: 'Finance staff count',
      hasFinancialManager: 'Financial manager',
      totalStaffCount: 'Total staff count',
      hrFunctions: 'HR functions',
      hasPoliciesAndProcedures: 'Policies and procedures',
      policyReviewFrequency: 'Policy review frequency',
      assetsInsured: 'Asset insurance',
      financialStatementsAudited: 'Financial statements status',
      budgetAvailable: 'Budget availability',
      longTermContracts: 'Long term contracts',
      offBalanceSheetFunding: 'Off balance sheet funding',
      assetRegisterAvailable: 'Asset register',
      lenderPermissionsRequired: 'Lender permissions',
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFormData(): boolean {
    const values = this.businessAssessmentForm.value;
    return Object.values(values).some(
      (value) => value !== null && value !== undefined && value !== ''
    );
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return saved.toLocaleDateString();
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  isBackOfficeComplete(): boolean {
    const backOfficeFields = [
      'accountingSystem',
      'payrollSystem',
      'financeFunction',
      'financeStaffCount',
      'hasFinancialManager',
      'totalStaffCount',
      'hrFunctions',
      'hasPoliciesAndProcedures',
      'assetsInsured',
    ];

    return backOfficeFields.every((field) => {
      const control = this.businessAssessmentForm.get(field);
      return control?.valid && control?.value;
    });
  }

  isFinancialStatementsComplete(): boolean {
    const financialFields = [
      'financialStatementsAudited',
      'budgetAvailable',
      'longTermContracts',
      'offBalanceSheetFunding',
      'assetRegisterAvailable',
      'lenderPermissionsRequired',
    ];

    return financialFields.every((field) => {
      const control = this.businessAssessmentForm.get(field);
      return control?.valid && control?.value;
    });
  }

  getCompletionPercentage(): number {
    const totalSections = 2;
    let completedSections = 0;

    if (this.isBackOfficeComplete()) completedSections++;
    if (this.isFinancialStatementsComplete()) completedSections++;

    return Math.round((completedSections / totalSections) * 100);
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  goBack() {
    this.fundingApplicationService.previousStep();
  }

  async saveAndContinue() {
    await this.saveData(true);
    this.fundingApplicationService.nextStep();
  }
}
