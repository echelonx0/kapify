import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FundingApplicationCoverInformation,
  UpdateCoverRequest,
} from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';

// Predefined options for user guidance
const PREDEFINED_SECTORS = [
  'Technology',
  'Agriculture',
  'Retail',
  'Manufacturing',
  'Healthcare',
  'Finance',
  'Energy',
  'Education',
  'Logistics',
  'Media & Entertainment',
];

const PREDEFINED_FUNDING_TYPES = [
  { value: 'equity', label: 'Equity' },
  { value: 'debt', label: 'Debt / Loan' },
  { value: 'grant', label: 'Grant' },
  { value: 'convertible', label: 'Convertible Note' },
  { value: 'mezzanine', label: 'Mezzanine Financing' },
];

const PREDEFINED_BUSINESS_STAGES = [
  { value: 'early_stage', label: 'Early Stage (Pre-revenue)' },
  { value: 'growth', label: 'Growth Stage (Scaling)' },
  { value: 'mature', label: 'Mature (Established)' },
];

const PREDEFINED_INVESTOR_TYPES = [
  'Angel Investors',
  'Venture Capital Firms',
  'Impact Investors',
  'Family Offices',
  'Corporate Ventures',
  'Development Finance Institutions',
  'Accelerators',
  'Strategic Partners',
];

const PREDEFINED_INVESTOR_EXCLUSIONS = [
  'Passive Investors Only',
  'Competitors',
  'Regulatory Bodies',
  'Venture Debt Only',
  'Activist Investors',
];

@Component({
  selector: 'app-cover-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cover-editor.component.html',
})
export class CoverEditorComponent implements OnInit {
  private coverService = inject(FundingApplicationCoverService);

  // Predefined options (read-only)
  readonly sectors = PREDEFINED_SECTORS;
  readonly fundingTypeOptions = PREDEFINED_FUNDING_TYPES;
  readonly businessStageOptions = PREDEFINED_BUSINESS_STAGES;
  readonly investorTypeOptions = PREDEFINED_INVESTOR_TYPES;
  readonly investorExclusionOptions = PREDEFINED_INVESTOR_EXCLUSIONS;

  @Input() cover: FundingApplicationCoverInformation | null = null;
  @Input() defaultCover: FundingApplicationCoverInformation | null = null;

  @Output() save = new EventEmitter<FundingApplicationCoverInformation>();
  @Output() cancel = new EventEmitter<void>();
  @Output() uploadDocument = new EventEmitter<string>();

  // ===== FORM STATE =====
  industries = signal<string[]>([]);
  fundingAmount = signal<number>(0);
  fundingTypes = signal<string[]>([]);
  businessStages = signal<string[]>([]);
  investmentCriteria = signal<string[]>([]);
  exclusionCriteria = signal<string[]>([]);
  location = signal<string>('');
  useOfFunds = signal<string>('');
  executiveSummary = signal<string>('');
  repaymentStrategy = signal<string>('');
  equityOffered = signal<number | null>(null);

  // ===== STATE MANAGEMENT =====
  private isSaving = signal(false);
  private isDirty = signal(false);
  private validationErrors = signal<string[]>([]);

  readonly saving = this.isSaving.asReadonly();
  readonly dirty = this.isDirty.asReadonly();
  readonly errors = this.validationErrors.asReadonly();

  readonly isCreating = computed(() => !this.cover);
  readonly canSave = computed(() => !this.saving() && this.dirty());

  readonly hasEquityFunding = computed(() =>
    this.fundingTypes().includes('equity')
  );

  ngOnInit() {
    if (this.cover) {
      this.initializeFromCover();
    } else {
      this.initializeFromDefault();
    }
  }

  /**
   * Initialize form from existing cover
   */
  private initializeFromCover() {
    if (!this.cover) return;

    this.industries.set([...this.cover.industries]);
    this.fundingAmount.set(this.cover.fundingAmount);
    this.fundingTypes.set([...this.cover.fundingTypes]);
    this.businessStages.set([...this.cover.businessStages]);
    this.investmentCriteria.set([...this.cover.investmentCriteria]);
    this.exclusionCriteria.set([...this.cover.exclusionCriteria]);
    this.location.set(this.cover.location);
    this.useOfFunds.set(this.cover.useOfFunds);
    this.executiveSummary.set(this.cover.executiveSummary);
    this.repaymentStrategy.set(this.cover.repaymentStrategy || '');
    this.equityOffered.set(this.cover.equityOffered || null);

    this.isDirty.set(false);
  }

  /**
   * Initialize from default template
   */
  private initializeFromDefault() {
    if (this.defaultCover) {
      this.industries.set([...this.defaultCover.industries]);
      this.fundingAmount.set(this.defaultCover.fundingAmount);
      this.fundingTypes.set([...this.defaultCover.fundingTypes]);
      this.businessStages.set([...this.defaultCover.businessStages]);
      this.investmentCriteria.set([...this.defaultCover.investmentCriteria]);
      this.exclusionCriteria.set([...this.defaultCover.exclusionCriteria]);
      this.location.set(this.defaultCover.location);
      this.useOfFunds.set(this.defaultCover.useOfFunds);
      this.executiveSummary.set(this.defaultCover.executiveSummary);
      this.repaymentStrategy.set(this.defaultCover.repaymentStrategy || '');
      this.equityOffered.set(this.defaultCover.equityOffered || null);
    }

    this.isDirty.set(false);
  }

  // ===== FORM UPDATES =====

  updateTextField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement)
      .value;

    switch (field) {
      case 'executiveSummary':
        this.executiveSummary.set(value);
        break;
      case 'location':
        this.location.set(value);
        break;
      case 'useOfFunds':
        this.useOfFunds.set(value);
        break;
      case 'repaymentStrategy':
        this.repaymentStrategy.set(value);
        break;
    }

    this.markDirty();
    this.validateForm();
  }

  updateNumberField(field: string, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;

    switch (field) {
      case 'fundingAmount':
        this.fundingAmount.set(value);
        break;
      case 'equityOffered':
        this.equityOffered.set(value);
        break;
    }

    this.markDirty();
    this.validateForm();
  }

  /**
   * Add custom item to array
   */
  addArrayItem(arrayField: string, input: HTMLInputElement): void {
    const value = input.value?.trim();
    if (!value) return;

    switch (arrayField) {
      case 'industries':
        if (!this.industries().includes(value)) {
          this.industries.update((arr) => [...arr, value]);
        }
        break;
      case 'investmentCriteria':
        if (!this.investmentCriteria().includes(value)) {
          this.investmentCriteria.update((arr) => [...arr, value]);
        }
        break;
      case 'exclusionCriteria':
        if (!this.exclusionCriteria().includes(value)) {
          this.exclusionCriteria.update((arr) => [...arr, value]);
        }
        break;
    }

    input.value = '';
    this.markDirty();
    this.validateForm();
  }

  /**
   * Remove item from array
   */
  removeArrayItem(arrayField: string, item: string): void {
    switch (arrayField) {
      case 'industries':
        this.industries.update((arr) => arr.filter((i) => i !== item));
        break;
      case 'investmentCriteria':
        this.investmentCriteria.update((arr) => arr.filter((i) => i !== item));
        break;
      case 'exclusionCriteria':
        this.exclusionCriteria.update((arr) => arr.filter((i) => i !== item));
        break;
    }

    this.markDirty();
    this.validateForm();
  }

  /**
   * Toggle item in array (for button chips)
   */
  toggleArrayItem(arrayField: string, item: string): void {
    switch (arrayField) {
      case 'fundingTypes':
        if (this.fundingTypes().includes(item)) {
          this.fundingTypes.update((arr) => arr.filter((i) => i !== item));
        } else {
          this.fundingTypes.update((arr) => [...arr, item]);
        }
        break;
      case 'businessStages':
        if (this.businessStages().includes(item)) {
          this.businessStages.update((arr) => arr.filter((i) => i !== item));
        } else {
          this.businessStages.update((arr) => [...arr, item]);
        }
        break;
    }

    this.markDirty();
    this.validateForm();
  }

  /**
   * Check if item is in array (for button state)
   */
  isItemInArray(arrayField: string, item: string): boolean {
    switch (arrayField) {
      case 'fundingTypes':
        return this.fundingTypes().includes(item);
      case 'businessStages':
        return this.businessStages().includes(item);
      default:
        return false;
    }
  }

  /**
   * Add predefined sector/investor type
   */
  addPredefinedItem(arrayField: string, item: string): void {
    switch (arrayField) {
      case 'industries':
        if (!this.industries().includes(item)) {
          this.industries.update((arr) => [...arr, item]);
        }
        break;
      case 'investmentCriteria':
        if (!this.investmentCriteria().includes(item)) {
          this.investmentCriteria.update((arr) => [...arr, item]);
        }
        break;
      case 'exclusionCriteria':
        if (!this.exclusionCriteria().includes(item)) {
          this.exclusionCriteria.update((arr) => [...arr, item]);
        }
        break;
    }

    this.markDirty();
    this.validateForm();
  }

  /**
   * Check if predefined item is selected
   */
  isPredefinedSelected(arrayField: string, item: string): boolean {
    switch (arrayField) {
      case 'industries':
        return this.industries().includes(item);
      case 'investmentCriteria':
        return this.investmentCriteria().includes(item);
      case 'exclusionCriteria':
        return this.exclusionCriteria().includes(item);
      default:
        return false;
    }
  }

  // ===== VALIDATION =====

  private validateForm(): void {
    const errors: string[] = [];

    if (this.industries().length === 0) {
      errors.push('Select at least one sector');
    }
    if (this.fundingAmount() <= 0) {
      errors.push('Funding amount must be greater than 0');
    }
    if (this.fundingTypes().length === 0) {
      errors.push('Select at least one funding type');
    }
    if (this.businessStages().length === 0) {
      errors.push('Select at least one business stage');
    }
    if (!this.location()) {
      errors.push('Location is required');
    }
    if (!this.useOfFunds()) {
      errors.push('Tell us how you will use the funds');
    }

    this.validationErrors.set(errors);
  }

  private markDirty(): void {
    this.isDirty.set(true);
  }

  // ===== SAVE & CANCEL =====

  async saveChanges(): Promise<void> {
    this.validateForm();
    if (this.validationErrors().length > 0) {
      return;
    }

    if (!this.cover) {
      console.error('No cover to save');
      return;
    }

    try {
      this.isSaving.set(true);

      const updates: UpdateCoverRequest = {
        industries: this.industries(),
        fundingAmount: this.fundingAmount(),
        fundingTypes: this.fundingTypes(),
        businessStages: this.businessStages(),
        investmentCriteria: this.investmentCriteria(),
        exclusionCriteria: this.exclusionCriteria(),
        location: this.location(),
        useOfFunds: this.useOfFunds(),
        executiveSummary: this.executiveSummary(),
        repaymentStrategy: this.repaymentStrategy(),
        equityOffered: this.equityOffered() || undefined,
      };

      this.coverService.updateCover(this.cover.id, updates).subscribe({
        next: (result) => {
          if (result?.success && result.cover) {
            this.isDirty.set(false);
            this.save.emit(result.cover);
          } else if (result?.error) {
            this.validationErrors.update((errors) => [
              ...errors,
              result.error || 'An error occurred',
            ]);
          }
          this.isSaving.set(false);
        },
        error: (err: any) => {
          this.validationErrors.update((errors) => [
            ...errors,
            err?.message || 'Failed to save',
          ]);
          this.isSaving.set(false);
        },
      });
    } catch (err: any) {
      this.validationErrors.update((errors) => [
        ...errors,
        err?.message || 'Failed to save',
      ]);
      this.isSaving.set(false);
    }
  }

  onCancel(): void {
    if (this.isDirty()) {
      if (!confirm('You have unsaved changes. Are you sure?')) {
        return;
      }
    }
    this.cancel.emit();
  }
}
