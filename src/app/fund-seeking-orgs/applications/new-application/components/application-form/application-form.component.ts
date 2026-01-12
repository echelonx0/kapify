// import {
//   Component,
//   input,
//   output,
//   inject,
//   OnInit,
//   computed,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { LucideAngularModule, FileText } from 'lucide-angular';
// import { ApplicationFormService } from '../../services/application-form.service';
// import { ApplicationValidationService } from '../../services/application-validation.service';
// import { UiTextareaComponent } from 'src/app/shared/components/ui-textarea.component';
// import { CoverStatementUploadComponent } from '../file-upload/cover-statement-upload.component.ts';
// import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
// import {
//   SelectOption,
//   UiSelectComponent,
// } from 'src/app/shared/components/ui-select/ui-select.component';

// @Component({
//   selector: 'app-application-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     LucideAngularModule,
//     CoverStatementUploadComponent,
//     UiTextareaComponent,
//     UiSelectComponent,
//   ],
//   templateUrl: './application-form.component.html',
//   providers: [ApplicationValidationService],
// })
// export class ApplicationFormComponent implements OnInit {
//   private formService = inject(ApplicationFormService);
//   private validationService = inject(ApplicationValidationService);

//   opportunity = input.required<FundingOpportunity>();
//   formChanged = output<void>();

//   FileTextIcon = FileText;
//   formData = this.formService.formData;
//   completionPercentage = this.formService.completionPercentage;

//   // Compute funding type options from opportunity
//   fundingTypeOptions = computed<SelectOption[]>(() => {
//     const opp = this.opportunity();
//     if (!opp?.fundingType || !Array.isArray(opp.fundingType)) {
//       return [];
//     }
//     return opp.fundingType.map((type) => ({
//       label: this.formatFundingTypeLabel(type),
//       value: type,
//     }));
//   });
//   ngOnInit(): void {
//     // Initialization
//   }

//   // Replace fundingTypeModel with this computed getter
//   get fundingTypeModel(): string {
//     return this.formData().fundingType || '';
//   }

//   set fundingTypeModel(value: string) {
//     this.formService.updateFundingType(value);
//   }

//   onRequestedAmountChange(event: Event): void {
//     const value = (event.target as HTMLInputElement).value;
//     this.formService.updateRequestedAmount(value);
//     this.formChanged.emit();
//   }

//   onPurposeStatementChange(value: string): void {
//     this.formService.updatePurposeStatement(value);
//     this.formChanged.emit();
//   }

//   onUseOfFundsChange(value: string): void {
//     this.formService.updateUseOfFunds(value);
//     this.formChanged.emit();
//   }

//   onCoverStatementUploaded(file: File | undefined): void {
//     this.formService.updateCoverStatement(file);
//     this.formChanged.emit();
//   }

//   getAmountValidationMessage(): string | null {
//     return this.validationService.getAmountValidationMessage(
//       this.formData().requestedAmount,
//       this.opportunity()
//     );
//   }

//   getPurposeError(): string | null {
//     const purpose = this.formData().purposeStatement;
//     if (!purpose || purpose.length < 50) {
//       return 'Minimum 50 characters required';
//     }
//     return null;
//   }

//   getFundingTypeError(): string | undefined {
//     return (
//       this.validationService.validateForm(this.formData(), this.opportunity())
//         .errors.fundingType || undefined
//     );
//   }
//   getUseOfFundsError(): string | null {
//     const useOfFunds = this.formData().useOfFunds;
//     if (!useOfFunds || useOfFunds.length < 50) {
//       return 'Minimum 50 characters required';
//     }
//     return null;
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: this.opportunity().currency || 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }

//   formatNumber(amount: number | null | undefined): string {
//     if (!amount) return '';
//     return amount.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
//   }

//   onAmountInput(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const rawValue = input.value.replace(/,/g, '');

//     if (!/^\d*$/.test(rawValue)) {
//       return;
//     }

//     this.formService.updateRequestedAmount(rawValue);
//     this.formChanged.emit();
//   }

//   validateAmount(): void {
//     // Validation happens on blur
//   }

//   getFormattedAmount(): string {
//     const amount = this.formData().requestedAmount;
//     if (!amount) return '';

//     return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
//   }

//   // Add this to formData tracking
//   onFundingTypeChange(value: string | number | boolean): void {
//     this.formService.updateFundingType(value as string);
//     this.formChanged.emit();
//   }

//   // Helper to format funding type labels (e.g., "debt" → "Debt Financing")
//   private formatFundingTypeLabel(type: string): string {
//     const labels: Record<string, string> = {
//       debt: 'Debt Financing',
//       equity: 'Equity Investment',
//       mezzanine: 'Mezzanine Financing',
//       convertible: 'Convertible Note',
//       grant: 'Grant',
//     };
//     return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
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
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Plus,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-angular';

import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

import { ToastService } from 'src/app/shared/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CreateCoverModalComponent } from 'src/app/features/applications-cover/create-cover-modal.component';
import {
  FundingApplicationCoverInformation,
  CoverListResult,
} from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ApplicationFormService } from '../../services/application-form.service';
import { ApplicationStorageService } from '../../services/application-local-storage.service';

type ViewState = 'loading' | 'selection' | 'confirmation' | 'empty';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CreateCoverModalComponent],
  templateUrl: './application-form.component.html',
  styles: [
    `
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .animate-fadeInScale {
        animation: fadeInScale 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slideInUp {
        animation: slideInUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    `,
  ],
})
export class ApplicationFormComponent implements OnInit, OnDestroy {
  // ===== INPUTS / OUTPUTS =====
  opportunity = input.required<FundingOpportunity>();
  formChanged = output<void>();

  // ===== SERVICES =====
  private coverService = inject(FundingApplicationCoverService);
  private formService = inject(ApplicationFormService);
  private storageService = inject(ApplicationStorageService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // ===== ICONS =====
  PlusIcon = Plus;
  CheckIcon = CheckCircle2;
  BackIcon = ArrowLeft;

  // ===== STATE SIGNALS =====
  currentView = signal<ViewState>('loading');
  covers = signal<FundingApplicationCoverInformation[]>([]);
  selectedCover = signal<FundingApplicationCoverInformation | null>(null);
  isLoading = signal(false);
  showCreateModal = signal(false);
  completionPercentage = signal(0);

  // ===== COMPUTED SIGNALS =====
  hasCover = computed(() => this.selectedCover() !== null);
  isEmpty = computed(() => this.covers().length === 0 && !this.hasCover());

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.loadCovers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== COVER LOADING =====
  private loadCovers(): void {
    this.isLoading.set(true);
    this.currentView.set('loading');

    this.coverService
      .getCoversByOrganization()
      .then((result: CoverListResult) => {
        if (result.success && result.covers.length > 0) {
          this.covers.set(result.covers);
          this.currentView.set('selection');
        } else if (result.success) {
          this.covers.set([]);
          this.currentView.set('empty');
        } else {
          this.toastService.error('Failed to load funding profiles');
          this.currentView.set('empty');
        }
      })
      .catch((error) => {
        console.error('Error loading covers:', error);
        this.toastService.error('Failed to load funding profiles');
        this.currentView.set('empty');
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  // ===== COVER SELECTION =====
  selectCover(cover: FundingApplicationCoverInformation): void {
    this.selectedCover.set(cover);
    this.populateFormWithCover(cover);
    this.transitionToConfirmation();
  }

  private populateFormWithCover(
    cover: FundingApplicationCoverInformation
  ): void {
    // Load all cover data into form service
    this.formService.updateRequestedAmount(
      cover.fundingAmount?.toString() || ''
    );
    this.formService.updatePurposeStatement(cover.executiveSummary || '');
    this.formService.updateUseOfFunds(cover.useOfFunds || '');

    // Set funding type (use first in array if available)
    if (cover.fundingTypes && cover.fundingTypes.length > 0) {
      this.formService.updateFundingType(cover.fundingTypes[0]);
    }

    // Calculate completion (should be ~100%)
    this.calculateCompletion();
  }

  private calculateCompletion(): void {
    const formData = this.formService.formData();
    let completed = 0;
    const total = 4; // requestedAmount, purposeStatement, useOfFunds, fundingType

    if (formData.requestedAmount) completed++;
    if (formData.purposeStatement) completed++;
    if (formData.useOfFunds) completed++;
    if (formData.fundingType) completed++;

    this.completionPercentage.set(Math.round((completed / total) * 100));
  }

  private transitionToConfirmation(): void {
    // Animate completion percentage
    setTimeout(() => {
      this.currentView.set('confirmation');
    }, 300);
  }

  // ===== CONFIRMATION =====
  confirmSelection(): void {
    const cover = this.selectedCover();
    if (!cover) return;

    // Save to storage
    this.storageService.saveSelectedCover(cover);

    // Emit form change to trigger parent navigation
    this.formChanged.emit();
  }

  goBackToSelection(): void {
    this.selectedCover.set(null);
    this.currentView.set('selection');
  }

  // ===== CREATE COVER MODAL =====
  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  onCreateCoverChoice(): void {
    this.showCreateModal.set(false);
    // Reload covers after creation (modal handles creation)
    setTimeout(() => {
      this.loadCovers();
    }, 500);
  }

  onCreateCoverCancel(): void {
    this.showCreateModal.set(false);
  }

  // ===== FORMATTING UTILITIES =====
  formatFundingType(types: string[]): string {
    if (!types || types.length === 0) return 'Not specified';
    return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
  }

  formatAmount(amount: number | null | undefined): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatIndustries(industries: string[]): string {
    if (!industries || industries.length === 0) return 'All industries';
    return (
      industries.slice(0, 2).join(', ') + (industries.length > 2 ? '...' : '')
    );
  }
}
