import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { DeleteDraftConfirmationModalComponent } from '../components/delete-draft-confirmation.component';

/**
 * OpportunityFormActionsComponent
 *
 * Handles form navigation and actions (save, publish, delete)
 * Responsive across mobile, tablet, and desktop
 * Integrated with delete confirmation modal
 */
@Component({
  selector: 'app-opportunity-form-actions',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DeleteDraftConfirmationModalComponent,
  ],
  animations: [
    trigger('modalTransition', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('150ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    <!-- DELETE CONFIRMATION MODAL -->
    @if (showDeleteModal()) {
    <app-delete-draft-confirmation-modal
      [draftTitle]="deleteDraftTitle()"
      [isDeleting]="isDeletingDraft"
      (confirm)="onConfirmDeleteDraft()"
      (cancel)="onCancelDeleteModal()"
      [@modalTransition]
    ></app-delete-draft-confirmation-modal>
    }

    <div class="bg-white border-t border-slate-200">
      <!-- MOBILE: Super Compact Row (0-768px) -->
      <div
        class="md:hidden px-3 py-2.5 flex gap-2 justify-between items-center overflow-x-auto"
      >
        <!-- Left: Cancel -->
        <button
          (click)="onCancel()"
          class="flex-shrink-0 p-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors duration-200"
          title="Cancel"
          aria-label="Cancel"
        >
          <lucide-angular [img]="XIcon" [size]="16"></lucide-angular>
        </button>

        <!-- Center: Previous (if not first step) -->
        @if (!isFirstStep()) {
        <button
          (click)="onPrevious()"
          class="flex-shrink-0 p-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors duration-200"
          title="Previous step"
          aria-label="Previous"
        >
          <lucide-angular [img]="ArrowLeftIcon" [size]="16"></lucide-angular>
        </button>
        }

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Right: Save + Next/Publish -->
        <div class="flex gap-2">
          <!-- Save (icon only) -->
          <button
            (click)="onSave()"
            [disabled]="isSaving || organizationError"
            class="flex-shrink-0 p-2 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
            title="Save draft"
            aria-label="Save draft"
          >
            @if (isSaving) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="16"
              class="animate-spin"
            ></lucide-angular>
            } @else {
            <lucide-angular [img]="SaveIcon" [size]="16"></lucide-angular>
            }
          </button>

          <!-- Next/Publish (Primary CTA) -->
          @if (isReviewStep()) {
          <button
            (click)="onPublish()"
            [disabled]="!canPublish || isPublishing"
            class="flex-shrink-0 px-3 py-2 text-white text-xs font-medium bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
            title="Publish opportunity"
            aria-label="Publish"
          >
            @if (isPublishing) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="14"
              class="animate-spin"
            ></lucide-angular>
            } @else {
            <lucide-angular [img]="CheckIcon" [size]="14"></lucide-angular>
            <span class="hidden sm:inline">Publish</span>
            }
          </button>
          } @else {
          <button
            (click)="onNext()"
            [disabled]="!canContinue"
            class="flex-shrink-0 px-3 py-2 text-white text-xs font-medium bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
            title="Continue to next step"
            aria-label="Continue"
          >
            <span class="hidden sm:inline">Next</span>
            <lucide-angular [img]="ArrowRightIcon" [size]="14"></lucide-angular>
          </button>
          }
        </div>
      </div>

      <!-- TABLET: Compact Labeled Row (768px-1024px) -->
      <div
        class="hidden md:flex lg:hidden px-4 py-3 gap-2 items-center justify-between flex-wrap"
      >
        <!-- Left Group: Navigation -->
        <div class="flex gap-2">
          <button
            (click)="onCancel()"
            class="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>

          @if (!isFirstStep()) {
          <button
            (click)="onPrevious()"
            class="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors duration-200 flex items-center gap-1"
          >
            <lucide-angular [img]="ArrowLeftIcon" [size]="14"></lucide-angular>
            Back
          </button>
          }
        </div>

        <!-- Right Group: Save + Next -->
        <div class="flex gap-2">
          <button
            (click)="onSave()"
            [disabled]="isSaving || organizationError"
            class="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center gap-1"
          >
            @if (isSaving) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="14"
              class="animate-spin"
            ></lucide-angular>
            Saving... } @else {
            <lucide-angular [img]="SaveIcon" [size]="14"></lucide-angular>
            Save }
          </button>

          @if (isReviewStep()) {
          <button
            (click)="onPublish()"
            [disabled]="!canPublish || isPublishing"
            class="px-3 py-2 text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center gap-1"
          >
            @if (isPublishing) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="14"
              class="animate-spin"
            ></lucide-angular>
            Publishing... } @else {
            <lucide-angular [img]="CheckIcon" [size]="14"></lucide-angular>
            {{ isEditMode ? 'Save' : 'Publish' }}
            }
          </button>
          } @else {
          <button
            (click)="onNext()"
            [disabled]="!canContinue"
            class="px-3 py-2 text-xs font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 flex items-center gap-1"
          >
            Next
            <lucide-angular [img]="ArrowRightIcon" [size]="14"></lucide-angular>
          </button>
          }
        </div>
      </div>

      <!-- DESKTOP: Full Layout (1024px+) -->
      <div class="hidden lg:flex px-6 py-4 items-center justify-between gap-4">
        <!-- Left: Navigation & Delete -->
        <div class="flex gap-2">
          <button
            (click)="onPrevious()"
            [disabled]="isFirstStep()"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200 flex items-center gap-1.5"
          >
            <lucide-angular [img]="ArrowLeftIcon" [size]="16"></lucide-angular>
            Previous
          </button>

          <button
            (click)="onCancel()"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors duration-200"
          >
            Cancel
          </button>

          <!-- Delete Draft Button (Create Mode Only) -->
          @if (isCreateMode) {
          <button
            (click)="openDeleteModal()"
            [disabled]="isDeletingDraft"
            class="px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200 flex items-center gap-1.5"
            title="Delete this draft permanently"
          >
            @if (isDeletingDraft) {
            <div
              class="w-4 h-4 border-2 border-red-200 border-t-red-700 rounded-full animate-spin"
            ></div>
            Deleting... } @else {
            <lucide-angular [img]="Trash2Icon" [size]="16"></lucide-angular>
            Delete Draft }
          </button>
          }
        </div>

        <!-- Right: Save + Next/Publish -->
        <div class="flex gap-2">
          <button
            (click)="onSave()"
            [disabled]="isSaving || organizationError"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200 flex items-center gap-1.5"
          >
            @if (isSaving) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="16"
              class="animate-spin"
            ></lucide-angular>
            Saving... } @else {
            <lucide-angular [img]="SaveIcon" [size]="16"></lucide-angular>
            {{ saveButtonText }}
            }
          </button>

          @if (isReviewStep()) {
          <button
            (click)="onPublish()"
            [disabled]="!canPublish || isPublishing"
            class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200 flex items-center gap-1.5"
          >
            @if (isPublishing) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="16"
              class="animate-spin"
            ></lucide-angular>
            {{ isEditMode ? 'Saving...' : 'Publishing...' }}
            } @else {
            <lucide-angular [img]="CheckIcon" [size]="16"></lucide-angular>
            {{ isEditMode ? 'Save Changes' : 'Publish Opportunity' }}
            }
          </button>
          } @else {
          <button
            (click)="onNext()"
            [disabled]="!canContinue"
            class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200 flex items-center gap-1.5"
          >
            Continue
            <lucide-angular [img]="ArrowRightIcon" [size]="16"></lucide-angular>
          </button>
          }
        </div>
      </div>
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
export class OpportunityFormActionsComponent {
  // ===============================
  // INPUTS
  // ===============================

  @Input() currentStep: string = 'basic';
  @Input() isFirstStep: () => boolean = () => false;
  @Input() isReviewStep: () => boolean = () => false;
  @Input() isSaving: boolean = false;
  @Input() isPublishing: boolean = false;
  @Input() canContinue: boolean = false;
  @Input() canPublish: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() isCreateMode: boolean = true;
  @Input() organizationError: boolean = false;
  @Input() saveButtonText: string = 'Save Draft';
  @Input() formState: any;

  // ===============================
  // OUTPUTS
  // ===============================

  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() publish = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() deleteDraft = new EventEmitter<void>();

  // ===============================
  // SIGNALS (Component State)
  // ===============================

  showDeleteModal = signal(false);
  deleteDraftTitle = signal('Draft');
  isDeletingDraft = false;

  // ===============================
  // ICONS
  // ===============================

  ArrowLeftIcon = ArrowLeft;
  ArrowRightIcon = ArrowRight;
  SaveIcon = Save;
  CheckIcon = Check;
  RefreshCwIcon = RefreshCw;
  Trash2Icon = Trash2;
  XIcon = X;
  AlertCircleIcon = AlertCircle;

  // ===============================
  // DELETE MODAL HANDLERS
  // ===============================

  /**
   * Open delete confirmation modal
   * Gets current draft title from form state
   */
  openDeleteModal(): void {
    // Get current draft title from form data if available
    if (this.formState?.formData?.()) {
      const formData = this.formState.formData();
      if (formData?.title) {
        this.deleteDraftTitle.set(formData.title);
      } else {
        this.deleteDraftTitle.set('Untitled Draft');
      }
    } else {
      this.deleteDraftTitle.set('Untitled Draft');
    }

    this.showDeleteModal.set(true);
  }

  /**
   * Confirmed: proceed with deletion
   */
  onConfirmDeleteDraft(): void {
    this.onDeleteDraft();
  }

  /**
   * Cancelled: close modal and stay on form
   */
  onCancelDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  /**
   * Handle delete draft button click
   * Shows confirmation modal first, then emits deletion on confirmation
   */
  onDeleteDraft(): void {
    // Check if modal is already showing
    if (this.showDeleteModal()) {
      // We're in confirmation step - actually delete
      this.deleteDraft.emit();
      this.showDeleteModal.set(false);
    } else {
      // First click - show confirmation modal
      this.openDeleteModal();
    }
  }

  // ===============================
  // FORM NAVIGATION HANDLERS
  // ===============================

  /**
   * Go to next step
   */
  onNext(): void {
    this.next.emit();
  }

  /**
   * Go to previous step
   */
  onPrevious(): void {
    this.previous.emit();
  }

  /**
   * Publish opportunity
   */
  onPublish(): void {
    this.publish.emit();
  }

  /**
   * Save draft
   */
  onSave(): void {
    this.save.emit();
  }

  /**
   * Cancel and go back
   */
  onCancel(): void {
    this.cancel.emit();
  }
}
