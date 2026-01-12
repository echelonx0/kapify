import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CoverListComponent } from './cover-list/cover-list.component';
import { CoverEditorComponent } from './cover-editor/cover-editor.component';
import { CoverDocumentUploadComponent } from './cover-document-upload/cover-document-upload.component';

import { ActivityService } from 'src/app/shared/services/activity.service';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { CommonModule } from '@angular/common';
import { CreateCoverModalComponent } from './create-cover-modal.component';

type ViewMode = 'list' | 'editor' | 'upload' | 'createModal';
type OperationMode = 'create' | 'edit' | 'view';

/**
 * FundingApplicationCoverManagementComponent
 *
 * Orchestrates the complete cover management system:
 * - List view (all covers)
 * - Create modal (guided choice: fresh vs copy)
 * - Editor view (edit cover details)
 * - Upload view (attach documents)
 *
 * Fixed Issues:
 * 1. Abrupt creation → Now shows decision modal first
 * 2. Scrolling in editor → Fixed overflow hierarchy
 * 3. Better UX flow → Guided, not jarring
 *
 * URL is source of truth via query params.
 */
@Component({
  selector: 'app-funding-application-cover-management',
  standalone: true,
  imports: [
    CoverListComponent,
    CoverEditorComponent,
    CoverDocumentUploadComponent,
    CreateCoverModalComponent,
    CommonModule,
  ],
  templateUrl: './funding-application-cover-management.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }
    `,
  ],
})
export class FundingApplicationCoverManagementComponent
  implements OnInit, OnDestroy
{
  private coverService = inject(FundingApplicationCoverService);
  private activityService = inject(ActivityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ===== STATE: Driven by route query params =====
  private selectedCoverId = signal<string | null>(null);
  private operationMode = signal<OperationMode>('view');
  private isInitializing = signal(true);
  private showCreateModal = signal(false);

  // Error state
  error = signal<string | null>(null);

  // ===== COMPUTED: Derived from service =====
  readonly covers = this.coverService.covers;
  readonly selectedId = this.selectedCoverId;
  readonly mode = this.operationMode;
  readonly initializing = this.isInitializing;
  readonly showModal = this.showCreateModal;

  // Determine which view to render
  readonly currentView = computed<ViewMode>(() => {
    // Show modal if explicitly requested
    if (this.showModal()) {
      return 'createModal';
    }

    const mode = this.mode();
    const id = this.selectedId();
    const queryView = this.route.snapshot.queryParamMap.get('view');

    // Upload view
    if (queryView === 'upload' && id) {
      return 'upload';
    }

    // Editor view
    if ((mode === 'create' || mode === 'edit') && id) {
      return 'editor';
    }

    // Default: list view
    return 'list';
  });

  readonly selectedCover = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.covers().find((c) => c.id === id) || null;
  });

  readonly defaultCover = computed(() => {
    return this.covers().find((c) => c.isDefault) || null;
  });

  readonly nonDefaultCovers = computed(() => {
    return this.covers().filter((c) => !c.isDefault);
  });

  ngOnInit(): void {
    // Initialize: Load all covers
    this.loadAllCovers();

    // Watch query params for mode/coverId changes
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.handleQueryParamChange(params);
      });
  }

  /**
   * Handle query param changes
   * URL is source of truth
   */
  private handleQueryParamChange(params: any): void {
    const mode = (params['mode'] || 'view') as OperationMode;
    const coverId = params['coverId'] || null;

    this.operationMode.set(mode);

    // If coverId in params, load/navigate to it
    if (coverId && coverId !== this.selectedId()) {
      this.selectedCoverId.set(coverId);
      console.log(`📍 Mode: ${mode}, Cover: ${coverId}`);
    } else if (!coverId && mode === 'create') {
      // For create mode without coverId: show decision modal
      if (!this.selectedId() && !this.showModal()) {
        console.log('📋 Showing create decision modal');
        this.showCreateModal.set(true);
      }
    }
  }

  /**
   * Load all covers
   */
  private async loadAllCovers(): Promise<void> {
    try {
      const result = await this.coverService.getCoversByOrganization();
      if (!result.success) {
        this.error.set(result.error || 'Failed to load covers');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load covers');
      console.error('❌ Load covers error:', err);
    } finally {
      this.isInitializing.set(false);
    }
  }

  /**
   * Refresh covers from database (invalidates cache)
   */
  async refreshCovers(): Promise<void> {
    await this.loadAllCovers();
  }

  // ===== MODAL HANDLERS =====

  /**
   * Handle create choice from modal
   */
  async onCreateChoice(choice: {
    action: 'fresh' | 'copy';
    coverId?: string;
  }): Promise<void> {
    this.showCreateModal.set(false);

    try {
      if (choice.action === 'fresh') {
        // Create blank cover
        const result = await this.coverService.createBlankCover();
        if (result.success && result.cover) {
          this.selectedCoverId.set(result.cover.id);
          this.operationMode.set('edit');
          console.log('✅ Fresh cover created:', result.cover.id);

          // Track activity
          this.activityService.trackProfileActivity(
            'created',
            'New funding profile created (blank)',
            'cover_create_fresh'
          );
        } else {
          this.error.set(result.error || 'Failed to create cover');
        }
      } else if (choice.action === 'copy' && choice.coverId) {
        // Copy existing cover
        const result = await this.coverService.copyCover(choice.coverId);
        if (result.success && result.cover) {
          await this.refreshCovers();
          this.selectedCoverId.set(result.cover.id);
          this.operationMode.set('edit');
          console.log('✅ Cover copied:', result.cover.id);

          // Track activity
          this.activityService.trackProfileActivity(
            'created',
            'New funding profile created (from copy)',
            'cover_create_copy'
          );
        } else {
          this.error.set(result.error || 'Failed to copy cover');
        }
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to create cover');
      console.error('❌ Create choice error:', err);
    }
  }

  /**
   * Cancel modal and return to list
   */
  onCreateModalCancel(): void {
    this.showCreateModal.set(false);
    this.navigateToList();
  }

  // ===== NAVIGATION =====

  navigateToEditor(coverId: string, mode: OperationMode = 'edit'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode,
        coverId,
        view: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  navigateToList(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        mode: 'view',
        coverId: null,
        view: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  navigateToUpload(coverId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        coverId,
        view: 'upload',
      },
      queryParamsHandling: 'merge',
    });
  }

  navigateBack(): void {
    this.router.navigate(['..'], {
      relativeTo: this.route,
    });
  }

  // ===== COVER ACTIONS =====

  /**
   * Initiate new cover creation (shows modal)
   */
  createNewCover(): void {
    this.showCreateModal.set(true);
  }

  /**
   * Set cover as default
   */
  async setAsDefault(coverId: string): Promise<void> {
    try {
      const result = await this.coverService.setAsDefault(coverId);
      if (result.success) {
        await this.refreshCovers();
        this.activityService.trackProfileActivity(
          'updated',
          'Funding profile set as default',
          'cover_set_default'
        );
        console.log('✅ Cover set as default');
      } else {
        this.error.set(result.error || 'Failed to set as default');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to set as default');
      console.error('❌ Set default error:', err);
    }
  }

  /**
   * Delete cover
   */
  async deleteCover(coverId: string): Promise<void> {
    if (!confirm('Delete this cover? This cannot be undone.')) return;

    try {
      const result = await this.coverService.deleteCover(coverId);
      if (result.success) {
        await this.refreshCovers();
        this.activityService.trackProfileActivity(
          'updated',
          'Funding profile deleted',
          'cover_deleted'
        );
        this.navigateToList();
        console.log('✅ Cover deleted');
      } else {
        this.error.set(result.error || 'Failed to delete cover');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to delete cover');
      console.error('❌ Delete error:', err);
    }
  }

  /**
   * Copy cover (from list, not modal)
   */
  async copyCover(coverId: string): Promise<void> {
    try {
      const result = await this.coverService.copyCover(coverId);
      if (result.success && result.cover) {
        await this.refreshCovers();
        this.navigateToEditor(result.cover.id, 'edit');
        this.activityService.trackProfileActivity(
          'created',
          'Funding profile duplicated',
          'cover_duplicated'
        );
        console.log('✅ Cover copied');
      } else {
        this.error.set(result.error || 'Failed to copy cover');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to copy cover');
      console.error('❌ Copy error:', err);
    }
  }

  /**
   * Called when cover is saved in editor
   */
  onCoverSaved(): void {
    this.refreshCovers();
    this.navigateToList();

    this.activityService.trackProfileActivity(
      'updated',
      'Funding profile saved successfully',
      'cover_save_success'
    );
  }

  /**
   * Called when document is attached
   */
  onDocumentAttached(): void {
    const coverId = this.selectedId();
    if (coverId) {
      this.refreshCovers();
      this.navigateToEditor(coverId, 'edit');

      this.activityService.trackProfileActivity(
        'updated',
        'Document attached to funding profile',
        'cover_document_attached'
      );
    }
  }

  /**
   * Get cover snapshot for external use
   * (e.g., to snapshot into an opportunity)
   */
  getSelectedCoverSnapshot(): FundingApplicationCoverInformation | null {
    return this.selectedCover();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
