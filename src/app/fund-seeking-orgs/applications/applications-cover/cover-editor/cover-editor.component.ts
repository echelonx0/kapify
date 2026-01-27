import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { SupabaseConstantsService } from 'src/app/core/admin/services/remote-constants.service';

import { UpdateCoverRequest } from 'src/app/shared/models/funding-application-cover.model';
import { PageHeaderComponent } from 'src/app/shared/components/header/page-header.component';
import {
  FormSectionNavigatorComponent,
  FormSection,
} from '../form-section-navigator.component';

/**
 * CoverEditorComponent with Section Navigation
 * Full working implementation - no placeholders
 */
@Component({
  selector: 'app-cover-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    // FormSectionNavigatorComponent,
  ],
  templateUrl: './cover-editor.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .form-section {
        scroll-margin-top: 120px;
      }
    `,
  ],
})
export class CoverEditorComponent implements OnInit, OnDestroy {
  private coverService = inject(FundingApplicationCoverService);
  private activityService = inject(ActivityService);
  private constantsService = inject(SupabaseConstantsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  @ViewChildren('aboutBusinessSection', { read: ElementRef })
  aboutBusinessRef!: QueryList<ElementRef>;

  @ViewChildren('fundingDetailsSection', { read: ElementRef })
  fundingDetailsRef!: QueryList<ElementRef>;

  @ViewChildren('useOfFundsSection', { read: ElementRef })
  useOfFundsRef!: QueryList<ElementRef>;

  @ViewChildren('fundingMotivationSection', { read: ElementRef })
  fundingMotivationRef!: QueryList<ElementRef>;

  @ViewChildren('investorPreferencesSection', { read: ElementRef })
  investorPreferencesRef!: QueryList<ElementRef>;

  @Output() uploadDocument = new EventEmitter<string>();

  // State
  cover: any = null;
  isCreating = signal(false);
  saving = signal(false);
  errors = signal<string[]>([]);
  activeSection = signal<string | null>('about-business');

  // Form data signals
  fundingAmount = signal<number | null>(null);
  useOfFunds = signal<string>('');
  fundingMotivation = signal<string>('');
  equityOffered = signal<number | null>(null);
  industries = signal<string[]>([]);
  fundingTypes = signal<string[]>([]);
  investmentCriteria = signal<string[]>([]);

  formattedFundingAmount = computed(() => {
    const value = this.fundingAmount();
    if (value === null) {
      return '';
    }

    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  });

  // Options from constants service
  sectors = computed(() => {
    return this.constantsService.industries().map((opt) => opt.label);
  });

  fundingTypeOptions = computed(() => {
    return this.constantsService
      .fundingOptions()
      .map((opt) => ({ label: opt.label, value: opt.value }));
  });

  investorTypeOptions = computed(() => {
    return this.constantsService.investorTypes().map((opt) => opt.label);
  });

  // Navigation sections
  navSections = computed<FormSection[]>(() => [
    { id: 'about-business', label: 'About Your Business' },
    { id: 'funding-details', label: 'Funding Details' },
    { id: 'use-of-funds', label: 'Use of Funds' },
    { id: 'funding-motivation', label: 'Funding Motivation' },
    { id: 'investor-preferences', label: 'Investor Preferences' },
  ]);

  // Computed
  hasEquityFunding = computed(() => {
    return this.fundingTypes().includes('equity');
  });

  canSave = computed(() => {
    return (
      this.fundingAmount() &&
      this.fundingTypes().length > 0 &&
      this.useOfFunds().trim() &&
      this.fundingMotivation().trim() &&
      this.industries().length > 0 &&
      !this.saving()
    );
  });

  completionPercentage = computed(() => {
    let filled = 0;
    const total = 7;

    if (this.fundingAmount()) filled++;
    if (this.fundingTypes().length > 0) filled++;
    if (this.useOfFunds().trim()) filled++;
    if (this.fundingMotivation().trim()) filled++;
    if (this.industries().length > 0) filled++;
    if (this.investmentCriteria().length > 0) filled++;
    if (this.equityOffered() !== null && this.hasEquityFunding()) filled++;

    return Math.round((filled / total) * 100);
  });

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['coverId'];
        if (id) {
          this.loadCover(id);
        } else {
          this.isCreating.set(true);
        }
      });
  }

  private loadCover(id: string): void {
    from(this.coverService.getCoverById(id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cover) => {
          if (cover) {
            this.cover = cover;
            this.populateFormFromCover(cover);
          }
        },
        error: (err) => {
          this.errors.set([err?.message || 'Failed to load funding request']);
        },
      });
  }

  private populateFormFromCover(cover: any): void {
    this.fundingAmount.set(cover.fundingAmount || null);
    this.useOfFunds.set(cover.useOfFunds || '');
    this.fundingMotivation.set(cover.fundingMotivation || '');
    this.equityOffered.set(cover.equityOffered || null);
    this.industries.set(cover.industries || []);
    this.fundingTypes.set(cover.fundingTypes || []);
    this.investmentCriteria.set(cover.investmentCriteria || []);
  }

  updateNumberField(field: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);

    if (field === 'fundingAmount') {
      this.fundingAmount.set(value || null);
    } else if (field === 'equityOffered') {
      this.equityOffered.set(value || null);
    }

    this.validateForm();
  }

  onFundingAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Remove commas, spaces, currency symbols
    const raw = input.value.replace(/[^\d]/g, '');
    const numeric = raw ? Number(raw) : null;

    this.fundingAmount.set(numeric);
    this.validateForm();
  }

  onFundingAmountBlur(): void {
    // Forces recomputation so formatting snaps cleanly
    this.fundingAmount.set(this.fundingAmount());
  }

  updateTextField(field: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;

    if (field === 'useOfFunds') {
      this.useOfFunds.set(value);
    } else if (field === 'fundingMotivation') {
      this.fundingMotivation.set(value);
    }

    this.validateForm();
  }

  addPredefinedItem(field: string, item: string): void {
    const current =
      field === 'industries' ? this.industries() : this.investmentCriteria();

    if (!current.includes(item)) {
      if (field === 'industries') {
        this.industries.set([...current, item]);
      } else if (field === 'investmentCriteria') {
        this.investmentCriteria.set([...current, item]);
      }
    }

    this.validateForm();
  }

  removeArrayItem(field: string, item: string): void {
    if (field === 'industries') {
      this.industries.update((arr) => arr.filter((i) => i !== item));
    } else if (field === 'investmentCriteria') {
      this.investmentCriteria.update((arr) => arr.filter((i) => i !== item));
    }

    this.validateForm();
  }

  toggleArrayItem(field: string, item: string): void {
    const current = field === 'fundingTypes' ? this.fundingTypes() : [];

    if (current.includes(item)) {
      this.fundingTypes.set(current.filter((i) => i !== item));
    } else {
      this.fundingTypes.set([...current, item]);
    }

    this.validateForm();
  }

  isItemInArray(field: string, item: string): boolean {
    if (field === 'fundingTypes') {
      return this.fundingTypes().includes(item);
    }
    return false;
  }

  isPredefinedSelected(field: string, item: string): boolean {
    if (field === 'industries') {
      return this.industries().includes(item);
    } else if (field === 'investmentCriteria') {
      return this.investmentCriteria().includes(item);
    }
    return false;
  }

  scrollToSection(sectionId: string): void {
    this.activeSection.set(sectionId);

    setTimeout(() => {
      const element = document.querySelector(
        `[data-section-id="${sectionId}"]`
      ) as HTMLElement;

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 0);
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const sections = document.querySelectorAll('[data-section-id]');
    const threshold = 200;

    for (let section of sections) {
      const rect = (section as HTMLElement).getBoundingClientRect();
      if (rect.top < threshold && rect.bottom > 0) {
        this.activeSection.set(
          (section as HTMLElement).getAttribute('data-section-id') || ''
        );
        break;
      }
    }
  }

  validateForm(): void {
    const errors: string[] = [];

    if (!this.fundingAmount()) {
      errors.push('Funding amount is required');
    }
    if (this.fundingTypes().length === 0) {
      errors.push('Select at least one funding type');
    }
    if (!this.useOfFunds().trim()) {
      errors.push('Use of funds is required');
    }
    if (!this.fundingMotivation().trim()) {
      errors.push('Funding motivation is required');
    }
    if (this.industries().length === 0) {
      errors.push('Select at least one industry');
    }
    if (this.hasEquityFunding() && !this.equityOffered()) {
      errors.push('Equity percentage is required');
    }

    this.errors.set(errors);
  }

  saveChanges(): void {
    this.validateForm();

    if (this.errors().length > 0) {
      return;
    }

    this.saving.set(true);

    const data: UpdateCoverRequest = {
      fundingAmount: this.fundingAmount() ?? undefined,
      useOfFunds: this.useOfFunds(),
      fundingMotivation: this.fundingMotivation(),
      equityOffered: this.equityOffered() ?? undefined,
      industries: this.industries(),
      fundingTypes: this.fundingTypes(),
      investmentCriteria: this.investmentCriteria(),
    };

    if (this.isCreating()) {
      from(this.coverService.createBlankCover(data))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result) => {
            if (result.success && result.cover) {
              this.cover = result.cover;
              this.saving.set(false);
              this.activityService.trackProfileActivity(
                'created',
                'Funding request created',
                'funding_request_created'
              );
              this.router.navigate(['..'], { relativeTo: this.route });
            }
          },
          error: (err) => {
            this.saving.set(false);
            this.errors.set([err?.message || 'Failed to save']);
          },
        });
    } else {
      this.coverService
        .updateCover(this.cover.id, data)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.activityService.trackProfileActivity(
              'updated',
              'Funding request updated',
              'funding_request_updated'
            );
            this.router.navigate(['..'], { relativeTo: this.route });
          },
          error: (err) => {
            this.saving.set(false);
            this.errors.set([err?.message || 'Failed to save']);
          },
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
