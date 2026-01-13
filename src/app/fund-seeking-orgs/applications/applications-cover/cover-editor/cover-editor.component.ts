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
  readonly investorTypeOptions = PREDEFINED_INVESTOR_TYPES;

  @Input() cover: FundingApplicationCoverInformation | null = null;
  @Input() defaultCover: FundingApplicationCoverInformation | null = null;

  @Output() save = new EventEmitter<FundingApplicationCoverInformation>();
  @Output() cancel = new EventEmitter<void>();
  @Output() uploadDocument = new EventEmitter<string>();

  // ===== FORM STATE =====
  industries = signal<string[]>([]);
  fundingAmount = signal<number>(0);
  fundingTypes = signal<string[]>([]);
  investmentCriteria = signal<string[]>([]);
  useOfFunds = signal<string>('');
  fundingMotivation = signal<string>(''); // ✅ REQUIRED
  repaymentStrategy = signal<string>('');
  equityOffered = signal<number | null>(null);

  // ===== INTERNAL (NOT USER-FACING) =====
  private internalProfileName = signal<string>('');

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

  // ===== COMPLETION TRACKING =====
  readonly completionPercentage = computed(() => {
    const requiredFields = [
      this.industries().length > 0,
      this.fundingAmount() > 0,
      this.fundingTypes().length > 0,
      this.useOfFunds().trim().length > 0,
      this.fundingMotivation().trim().length > 0, // ✅ REQUIRED
    ];

    const completed = requiredFields.filter((field) => field).length;
    return Math.round((completed / requiredFields.length) * 100);
  });

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
    this.investmentCriteria.set([...this.cover.investmentCriteria]);
    this.useOfFunds.set(this.cover.useOfFunds);
    this.fundingMotivation.set(this.cover.fundingMotivation || ''); // ✅ REQUIRED
    this.repaymentStrategy.set(this.cover.repaymentStrategy || '');
    this.equityOffered.set(this.cover.equityOffered || null);
    this.internalProfileName.set(this.cover.executiveSummary);

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
      this.investmentCriteria.set([...this.defaultCover.investmentCriteria]);
      this.useOfFunds.set(this.defaultCover.useOfFunds);
      this.fundingMotivation.set(this.defaultCover.fundingMotivation || ''); // ✅ REQUIRED
      this.repaymentStrategy.set(this.defaultCover.repaymentStrategy || '');
      this.equityOffered.set(this.defaultCover.equityOffered || null);
    }

    // Generate internal profile name (not shown to user)
    this.internalProfileName.set(this.generateProfileName());
    this.isDirty.set(false);
  }

  /**
   * Generate a random profile name for internal use
   * Format: "Funding Round - [timestamp]"
   */
  private generateProfileName(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ROUND-${timestamp}-${random}`;
  }

  // ===== FORM UPDATES =====

  updateTextField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement)
      .value;

    switch (field) {
      case 'useOfFunds':
        this.useOfFunds.set(value);
        break;
      case 'fundingMotivation': // ✅ REQUIRED
        this.fundingMotivation.set(value);
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
    if (!this.useOfFunds().trim()) {
      errors.push('Tell us how you will use the funds');
    }
    if (!this.fundingMotivation().trim()) {
      errors.push('Explain why you need this funding'); // ✅ REQUIRED
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
        businessStages: [],
        investmentCriteria: this.investmentCriteria(),
        exclusionCriteria: [],
        location: '',
        useOfFunds: this.useOfFunds(),
        fundingMotivation: this.fundingMotivation(), // ✅ REQUIRED
        executiveSummary: this.internalProfileName(),
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
  navigateToDemographics(): void {
    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: {
    //     coverId,
    //     view: 'demographics',
    //   },
    //   queryParamsHandling: 'merge',
    // });
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
