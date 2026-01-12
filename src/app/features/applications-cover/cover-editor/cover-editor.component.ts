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

@Component({
  selector: 'app-cover-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cover-editor.component.html',
})
export class CoverEditorComponent implements OnInit {
  private coverService = inject(FundingApplicationCoverService);

  @Input() cover: FundingApplicationCoverInformation | null = null;
  @Input() defaultCover: FundingApplicationCoverInformation | null = null;

  @Output() save = new EventEmitter<FundingApplicationCoverInformation>();
  @Output() cancel = new EventEmitter<void>();
  @Output() uploadDocument = new EventEmitter<string>();

  // ===== FORM STATE =====
  // Using individual signals for each field for proper reactivity
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

    // Not dirty until user makes changes
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

  // ===== FORM UPDATES (PROPER EVENT BINDING) =====

  /**
   * Update text field
   * Properly extracts value from input event
   */
  updateTextField(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;

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

  /**
   * Update number field
   */
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
   * Add item to array
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

  // ===== VALIDATION =====

  private validateForm(): void {
    const errors: string[] = [];

    if (this.industries().length === 0) {
      errors.push('Select at least one industry');
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
      errors.push('Use of funds description is required');
    }

    this.validationErrors.set(errors);
  }

  private markDirty(): void {
    this.isDirty.set(true);
  }

  // ===== SAVE & CANCEL =====

  /**
   * Save changes
   */
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

      // Build update payload
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

      // Call service (returns Observable)
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
