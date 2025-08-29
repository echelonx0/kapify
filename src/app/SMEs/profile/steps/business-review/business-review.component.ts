// src/app/profile/steps/business-info.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Building, FileText, Save, Clock, ChevronDown, ChevronUp } from 'lucide-angular';
 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { UiButtonComponent } from '../../../../shared/components';
 
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';
import { BusinessAssessment } from 'src/app/SMEs/applications/models/funding-application.models';
 

interface SectionStates {
  backOffice: boolean;
  financialStatements: boolean;
}

@Component({
  selector: 'app-business-info',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, UiButtonComponent],
  templateUrl: 'business-review.component.html'
})
export class BusinessReviewComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);

  businessAssessmentForm: FormGroup;
  
  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);

  // Icons
  BuildingIcon = Building;
  FileTextIcon = FileText;
  SaveIcon = Save;
  ClockIcon = Clock;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // Section states
  private sectionStates = signal<SectionStates>({
    backOffice: true,
    financialStatements: true
  });

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.businessAssessmentForm = this.fb.group({
      // Back Office Section
      accountingSystem: ['', [Validators.required]],
      payrollSystem: ['', [Validators.required]],
      financeFunction: ['', [Validators.required]], // Internal/External
      financeStaffCount: ['', [Validators.required, Validators.min(0)]],
      hasFinancialManager: ['', [Validators.required]], // Yes/No
      totalStaffCount: ['', [Validators.required, Validators.min(1)]],
      hrFunctions: ['', [Validators.required]], // Outsourced/In-house
      hasPoliciesAndProcedures: ['', [Validators.required]], // Yes/No
      policyReviewFrequency: [''], // Only required if policies exist
      assetsInsured: ['', [Validators.required]], // Yes/No
      criticalSystems: [''], // Optional text field

      // Financial Statements Section
      financialStatementsAudited: ['', [Validators.required]], // Audited/Reviewed/Neither
      budgetAvailable: ['', [Validators.required]], // Yes/No
      longTermContracts: ['', [Validators.required]], // Yes/No
      offBalanceSheetFunding: ['', [Validators.required]], // Yes/No
      assetRegisterAvailable: ['', [Validators.required]], // Yes/No
      lenderPermissionsRequired: ['', [Validators.required]] // Yes/No
    });

    // Set up conditional validation
    this.setupConditionalValidation();
  }

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().businessAssessment;
    if (existingData) {
      this.populateFormFromData(existingData);
    }
  }

  private populateFormFromData(data: BusinessAssessment) {
    // Map the data to form fields based on the new structure
    this.businessAssessmentForm.patchValue({
      accountingSystem: data.operationalCapacity || '',
      payrollSystem: data.supplyChain || '',
      financeFunction: data.technologyUse || '',
      financeStaffCount: data.keyPerformanceIndicators?.[0]?.value || '',
      hasFinancialManager: data.qualityStandards || '',
      totalStaffCount: data.keyPerformanceIndicators?.[1]?.value || '',
      hrFunctions: data.customerSegments || '',
      hasPoliciesAndProcedures: data.marketSize || '',
      policyReviewFrequency: data.competitivePosition || '',
      assetsInsured: data.valueProposition || '',
      criticalSystems: data.businessModel || '',
      
      // Financial section - these would be new fields
      financialStatementsAudited: '',
      budgetAvailable: '',
      longTermContracts: '',
      offBalanceSheetFunding: '',
      assetRegisterAvailable: '',
      lenderPermissionsRequired: ''
    });
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasFormData() && !this.isSaving()) {
        this.saveData(false);
      }
    });

    // Also save on form value changes (debounced)
    this.businessAssessmentForm.valueChanges.subscribe(() => this.debouncedSave());
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (this.hasFormData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000); // 2 second debounce
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const assessmentData = this.buildBusinessAssessmentData();
      this.fundingApplicationService.updateBusinessAssessment(assessmentData);
      
      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save business assessment:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildBusinessAssessmentData(): BusinessAssessment {
    const formValue = this.businessAssessmentForm.value;

    return {
      // Business Model & Operations
      businessModel: formValue.criticalSystems || '',
      valueProposition: formValue.assetsInsured === 'yes' ? 'Assets are adequately insured' : 'Asset insurance needs review',
      targetMarkets: ['Primary market'], // Would need more detailed form for this
      customerSegments: formValue.hrFunctions || '',

      // Market Position
      marketSize: formValue.hasPoliciesAndProcedures || '',
      competitivePosition: formValue.policyReviewFrequency || '',
      marketShare: 0, // Would need specific input
      growthRate: 0, // Would need specific input

      // Operations
      operationalCapacity: formValue.accountingSystem || '',
      supplyChain: formValue.payrollSystem || '',
      technologyUse: formValue.financeFunction || '',
      qualityStandards: formValue.hasFinancialManager || '',

      // Performance Metrics
      keyPerformanceIndicators: [
        {
          metric: 'Finance Staff Count',
          value: parseInt(formValue.financeStaffCount) || 0,
          unit: 'people',
          period: 'current'
        },
        {
          metric: 'Total Staff Count',
          value: parseInt(formValue.totalStaffCount) || 0,
          unit: 'people',
          period: 'current'
        }
      ],
      salesChannels: ['Direct sales'], // Would need more detailed form
      customerRetention: 85 // Would need specific input
    };
  }

  // ===============================
  // FORM HELPERS
  // ===============================

  private setupConditionalValidation() {
    // Policy review frequency only required if policies exist
    this.businessAssessmentForm.get('hasPoliciesAndProcedures')?.valueChanges.subscribe(value => {
      const policyReviewControl = this.businessAssessmentForm.get('policyReviewFrequency');
      if (value === 'yes') {
        policyReviewControl?.setValidators([Validators.required]);
      } else {
        policyReviewControl?.clearValidators();
      }
      policyReviewControl?.updateValueAndValidity();
    });
  }

  getSectionExpanded(sectionId: keyof SectionStates): boolean {
    const states = this.sectionStates();
    return states[sectionId];
  }

  toggleSection(sectionId: keyof SectionStates) {
    this.sectionStates.update(current => ({
      ...current,
      [sectionId]: !current[sectionId]
    }));
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.businessAssessmentForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
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
      lenderPermissionsRequired: 'Lender permissions'
    };
    return displayNames[fieldName] || fieldName;
  }

  hasFormData(): boolean {
    const values = this.businessAssessmentForm.value;
    return Object.values(values).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  // ===============================
  // VALIDATION HELPERS
  // ===============================

  isBackOfficeComplete(): boolean {
    const backOfficeFields = [
      'accountingSystem', 'payrollSystem', 'financeFunction', 'financeStaffCount',
      'hasFinancialManager', 'totalStaffCount', 'hrFunctions', 'hasPoliciesAndProcedures',
      'assetsInsured'
    ];
    
    return backOfficeFields.every(field => {
      const control = this.businessAssessmentForm.get(field);
      return control?.valid && control?.value;
    });
  }

  isFinancialStatementsComplete(): boolean {
    const financialFields = [
      'financialStatementsAudited', 'budgetAvailable', 'longTermContracts',
      'offBalanceSheetFunding', 'assetRegisterAvailable', 'lenderPermissionsRequired'
    ];
    
    return financialFields.every(field => {
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
    // Navigate to previous step or use router
    this.fundingApplicationService.previousStep();
  }

  async saveAndContinue() {
    // Save current data and navigate to next step
    await this.saveData(true);
    this.fundingApplicationService.nextStep();
  }
}
