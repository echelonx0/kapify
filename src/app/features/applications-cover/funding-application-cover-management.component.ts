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
import { CoverEditorComponent } from './cover-editor/cover-editor.component';
import { CoverDocumentUploadComponent } from './cover-document-upload/cover-document-upload.component';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { CommonModule } from '@angular/common';
import { DemographicsFormComponent } from './demographics/demographics-form.component';

type ViewMode = 'editor' | 'upload' | 'demographics';
type OperationMode = 'create' | 'edit' | 'view';

/**
 * FundingApplicationCoverManagementComponent
 *
 * SINGLE-PROFILE MODE:
 * - Always shows editor (not list)
 * - One funding request only (the default)
 * - No copy/duplicate feature
 * - Modal creation in CoverStatusSectionComponent
 *
 * FIXED: Uses reactive queryParams (not stale snapshot)
 * - currentView now correctly responds to view=demographics changes
 */
@Component({
  selector: 'app-funding-application-cover-management',
  standalone: true,
  imports: [
    CoverEditorComponent,
    CoverDocumentUploadComponent,
    CommonModule,
    DemographicsFormComponent,
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

  // ===== REACTIVE QUERY PARAMS (FIX FOR DEMOGRAPHICS VIEW) =====
  private queryView = signal<string | null>(null);

  // Error state
  error = signal<string | null>(null);

  // ===== COMPUTED: Derived from service =====
  readonly defaultFundingRequest = this.coverService.defaultProfile;
  readonly selectedId = this.selectedCoverId;
  readonly mode = this.operationMode;
  readonly initializing = this.isInitializing;

  /**
   * FIXED: currentView now uses reactive queryView signal
   * instead of stale snapshot. Responds to real-time query param changes.
   */
  readonly currentView = computed<ViewMode>(() => {
    const view = this.queryView();
    const hasId = !!this.selectedId();

    if (view === 'demographics' && hasId) {
      return 'demographics';
    }
    if (view === 'upload' && hasId) {
      return 'upload';
    }
    return 'editor';
  });

  readonly selectedCover = computed(() => {
    return this.defaultFundingRequest() || null;
  });

  ngOnInit(): void {
    // Initialize: Load default funding request
    this.loadDefaultFundingRequest();

    // ===== FIXED: Reactive query params subscription =====
    // This now properly updates currentView when view param changes
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        // Update the reactive signal with current view
        this.queryView.set(params['view'] || null);
        // Handle other param changes
        this.handleQueryParamChange(params);
      });
  }

  /**
   * Navigate to demographics form
   */
  navigateToDemographics(coverId: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        coverId,
        view: 'demographics',
      },
      queryParamsHandling: 'merge',
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

    if (coverId && coverId !== this.selectedId()) {
      this.selectedCoverId.set(coverId);
      console.log(`📍 Mode: ${mode}, Funding Request: ${coverId}`);
    }
  }

  /**
   * Load default funding request
   */
  private async loadDefaultFundingRequest(): Promise<void> {
    try {
      const result = await this.coverService.loadDefaultCover();
      if (result) {
        this.selectedCoverId.set(result.id);
      }
      // If no default, that's fine - user can create one from status section
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load funding request');
      console.error('❌ Load funding request error:', err);
    } finally {
      this.isInitializing.set(false);
    }
  }

  /**
   * Refresh funding request from database
   */
  async refreshFundingRequest(): Promise<void> {
    await this.loadDefaultFundingRequest();
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

  // ===== FUNDING REQUEST ACTIONS =====

  /**
   * Called when funding request is saved in editor
   */
  onFundingRequestSaved(): void {
    this.refreshFundingRequest();
    this.navigateBack();

    this.activityService.trackProfileActivity(
      'updated',
      'Funding request saved successfully',
      'funding_request_save_success'
    );
  }

  /**
   * Delete funding request (single-profile mode)
   */
  async deleteFundingRequest(coverId: string): Promise<void> {
    if (!confirm('Delete this funding request? This cannot be undone.')) return;

    try {
      const result = await this.coverService.deleteCover(coverId);
      if (result.success) {
        await this.refreshFundingRequest();
        this.activityService.trackProfileActivity(
          'updated',
          'Funding request deleted',
          'funding_request_deleted'
        );
        this.navigateBack();
        console.log('✅ Funding request deleted');
      } else {
        this.error.set(result.error || 'Failed to delete funding request');
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to delete funding request');
      console.error('❌ Delete error:', err);
    }
  }

  /**
   * Called when document is attached
   */
  onDocumentAttached(): void {
    const coverId = this.selectedId();
    if (coverId) {
      this.refreshFundingRequest();
      this.navigateToEditor(coverId, 'edit');

      this.activityService.trackProfileActivity(
        'updated',
        'Document attached to funding request',
        'funding_request_document_attached'
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
