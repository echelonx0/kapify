// import {
//   Component,
//   input,
//   output,
//   inject,
//   OnInit,
//   signal,
//   computed,
//   OnDestroy,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   Plus,
//   CheckCircle2,
//   ArrowLeft,
// } from 'lucide-angular';

// import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

// import { ToastService } from 'src/app/shared/services/toast.service';
// import { Subject } from 'rxjs';
// import { CreateCoverModalComponent } from 'src/app/features/applications-cover/create-cover-modal.component';
// import {
//   FundingApplicationCoverInformation,
//   CoverListResult,
// } from 'src/app/shared/models/funding-application-cover.model';
// import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
// import { ApplicationFormService } from '../../services/application-form.service';
// import { ApplicationStorageService } from '../../services/application-local-storage.service';

// type ViewState = 'loading' | 'selection' | 'confirmation' | 'empty';

// @Component({
//   selector: 'app-application-form',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, CreateCoverModalComponent],
//   templateUrl: './application-form.component.html',
//   styles: [
//     `
//       @keyframes fadeInScale {
//         from {
//           opacity: 0;
//           transform: scale(0.95) translateY(10px);
//         }
//         to {
//           opacity: 1;
//           transform: scale(1) translateY(0);
//         }
//       }
//       .animate-fadeInScale {
//         animation: fadeInScale 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
//       }

//       @keyframes slideInUp {
//         from {
//           opacity: 0;
//           transform: translateY(20px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }
//       .animate-slideInUp {
//         animation: slideInUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
//       }
//     `,
//   ],
// })
// export class ApplicationFormComponent implements OnInit, OnDestroy {
//   // ===== INPUTS / OUTPUTS =====
//   opportunity = input.required<FundingOpportunity>();
//   formChanged = output<void>();

//   // ===== SERVICES =====
//   private coverService = inject(FundingApplicationCoverService);
//   private formService = inject(ApplicationFormService);
//   private storageService = inject(ApplicationStorageService);
//   private toastService = inject(ToastService);
//   private destroy$ = new Subject<void>();

//   // ===== ICONS =====
//   PlusIcon = Plus;
//   CheckIcon = CheckCircle2;
//   BackIcon = ArrowLeft;

//   // ===== STATE SIGNALS =====
//   currentView = signal<ViewState>('loading');
//   covers = signal<FundingApplicationCoverInformation[]>([]);
//   selectedCover = signal<FundingApplicationCoverInformation | null>(null);
//   isLoading = signal(false);
//   showCreateModal = signal(false);
//   completionPercentage = signal(0);

//   // ===== COMPUTED SIGNALS =====
//   hasCover = computed(() => this.selectedCover() !== null);
//   isEmpty = computed(() => this.covers().length === 0 && !this.hasCover());

//   // ===== LIFECYCLE =====
//   ngOnInit(): void {
//     this.loadCovers();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // ===== COVER LOADING =====
//   private loadCovers(): void {
//     this.isLoading.set(true);
//     this.currentView.set('loading');

//     this.coverService
//       .getCoversByOrganization()
//       .then((result: CoverListResult) => {
//         if (result.success && result.covers.length > 0) {
//           this.covers.set(result.covers);
//           this.currentView.set('selection');
//         } else if (result.success) {
//           this.covers.set([]);
//           this.currentView.set('empty');
//         } else {
//           this.toastService.error('Failed to load funding profiles');
//           this.currentView.set('empty');
//         }
//       })
//       .catch((error) => {
//         console.error('Error loading covers:', error);
//         this.toastService.error('Failed to load funding profiles');
//         this.currentView.set('empty');
//       })
//       .finally(() => {
//         this.isLoading.set(false);
//       });
//   }

//   // ===== COVER SELECTION =====
//   selectCover(cover: FundingApplicationCoverInformation): void {
//     this.selectedCover.set(cover);
//     this.populateFormWithCover(cover);
//     this.transitionToConfirmation();
//   }

//   private populateFormWithCover(
//     cover: FundingApplicationCoverInformation
//   ): void {
//     // Load all cover data into form service
//     this.formService.updateRequestedAmount(
//       cover.fundingAmount?.toString() || ''
//     );
//     this.formService.updatePurposeStatement(cover.executiveSummary || '');
//     this.formService.updateUseOfFunds(cover.useOfFunds || '');

//     // Set funding type (use first in array if available)
//     if (cover.fundingTypes && cover.fundingTypes.length > 0) {
//       this.formService.updateFundingType(cover.fundingTypes[0]);
//     }

//     // Calculate completion (should be ~100%)
//     this.calculateCompletion();
//   }

//   private calculateCompletion(): void {
//     const formData = this.formService.formData();
//     let completed = 0;
//     const total = 4; // requestedAmount, purposeStatement, useOfFunds, fundingType

//     if (formData.requestedAmount) completed++;
//     if (formData.purposeStatement) completed++;
//     if (formData.useOfFunds) completed++;
//     if (formData.fundingType) completed++;

//     this.completionPercentage.set(Math.round((completed / total) * 100));
//   }

//   private transitionToConfirmation(): void {
//     // Animate completion percentage
//     setTimeout(() => {
//       this.currentView.set('confirmation');
//     }, 300);
//   }

//   // ===== CONFIRMATION =====
//   confirmSelection(): void {
//     const cover = this.selectedCover();
//     if (!cover) return;

//     // Save to storage
//     this.storageService.saveSelectedCover(cover);

//     // Emit form change to trigger parent navigation
//     this.formChanged.emit();
//   }

//   goBackToSelection(): void {
//     this.selectedCover.set(null);
//     this.currentView.set('selection');
//   }

//   // ===== CREATE COVER MODAL =====
//   openCreateModal(): void {
//     this.showCreateModal.set(true);
//   }

//   onCreateCoverChoice(): void {
//     this.showCreateModal.set(false);
//     // Reload covers after creation (modal handles creation)
//     setTimeout(() => {
//       this.loadCovers();
//     }, 500);
//   }

//   onCreateCoverCancel(): void {
//     this.showCreateModal.set(false);
//   }

//   // ===== FORMATTING UTILITIES =====
//   formatFundingType(types: string[]): string {
//     if (!types || types.length === 0) return 'Not specified';
//     return types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ');
//   }

//   formatAmount(amount: number | null | undefined): string {
//     if (!amount) return 'N/A';
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: this.opportunity().currency || 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }

//   formatIndustries(industries: string[]): string {
//     if (!industries || industries.length === 0) return 'All industries';
//     return (
//       industries.slice(0, 2).join(', ') + (industries.length > 2 ? '...' : '')
//     );
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
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ApplicationFormService } from '../../services/application-form.service';
import { ApplicationStorageService } from '../../services/application-local-storage.service';

type ViewState = 'loading' | 'confirmation' | 'error';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
  selectedCover = signal<FundingApplicationCoverInformation | null>(null);
  isLoading = signal(false);
  completionPercentage = signal(0);
  errorMessage = signal<string | null>(null);

  // ===== COMPUTED SIGNALS =====
  hasCover = computed(() => this.selectedCover() !== null);

  // ===== LIFECYCLE =====
  ngOnInit(): void {
    this.initializeCover();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== SINGLE PROFILE MODE: Load default or create blank =====
  /**
   * Initialize: Load default profile or create blank if none exists
   * Single profile mode - no multiple profiles
   */
  private async initializeCover(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.currentView.set('loading');

      // Try to load default cover
      console.log(
        '📋 [Single Profile Mode] Loading default funding request...'
      );
      const defaultCover = await this.coverService.loadDefaultCover();

      if (defaultCover) {
        // Use default cover
        console.log('✅ Default funding request loaded:', defaultCover.id);
        this.selectedCover.set(defaultCover);
        this.populateFormWithCover(defaultCover);
        this.transitionToConfirmation();
      } else {
        // No default exists - create blank
        console.log('📝 No default found. Creating blank funding request...');
        const result = await this.coverService.createBlankCover();

        if (result.success && result.cover) {
          console.log('✅ Blank funding request created:', result.cover.id);
          this.selectedCover.set(result.cover);
          this.populateFormWithCover(result.cover);
          this.transitionToConfirmation();
          this.toastService.success('Funding request created successfully');
        } else {
          throw new Error(result.error || 'Failed to create funding request');
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize cover:', error);
      this.errorMessage.set(
        error?.message || 'Failed to load or create funding request'
      );
      this.currentView.set('error');
      this.toastService.error('Failed to load or create funding request');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ===== COVER POPULATION =====
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

    // Calculate completion
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
    // Animate to confirmation
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

  // ===== RETRY / ERROR HANDLING =====
  retryInitialize(): void {
    this.initializeCover();
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
