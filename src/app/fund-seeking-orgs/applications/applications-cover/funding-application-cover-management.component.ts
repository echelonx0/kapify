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
import { CommonModule } from '@angular/common';
import { CoverEditorComponent } from './cover-editor/cover-editor.component';
import { CoverDocumentUploadComponent } from './cover-document-upload/cover-document-upload.component';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { DemographicsFormComponent } from './demographics/demographics-form.component';
import { SideNavItem } from 'src/app/profiles/SME-Profiles/pages/side-nav.component';

type ViewMode = 'editor' | 'upload' | 'demographics';
type OperationMode = 'create' | 'edit' | 'view';

/**
 * FundingApplicationCoverManagementComponent
 *
 * SINGLE-PROFILE MODE with SIDE NAV:
 * - Side nav shows: Editor → Upload → Demographics steps
 * - Current view highlighted in nav
 * - Completion status per step
 * - Nav hides on mobile, sticky on desktop
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

  // ===== REACTIVE QUERY PARAMS =====
  private queryView = signal<string | null>(null);

  // Error state
  error = signal<string | null>(null);

  // ===== COMPUTED: Derived from service =====
  readonly defaultFundingRequest = this.coverService.defaultProfile;
  readonly selectedId = this.selectedCoverId;
  readonly mode = this.operationMode;
  readonly initializing = this.isInitializing;

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

  // ===== SIDE NAV CONFIG =====
  sideNavItems = computed<SideNavItem[]>(() => {
    const currentView = this.currentView();
    // const hasDoc = !!this.selectedCover()?.documents?.length;

    return [
      {
        id: 'editor',
        label: 'Profile',
        badge: {
          label: 'Info',
          color: currentView === 'editor' ? 'teal' : 'slate',
        },
      },
      {
        id: 'upload',
        label: 'Documents',
        // badge: {
        //   label: hasDoc ? 'Attached' : 'Optional',
        //   color: hasDoc ? 'green' : 'amber',
        // },
      },
      {
        id: 'demographics',
        label: 'Demographics',
        badge: {
          label: 'Details',
          color: currentView === 'demographics' ? 'teal' : 'slate',
        },
      },
    ];
  });

  ngOnInit(): void {
    // Initialize: Load default funding request
    this.loadDefaultFundingRequest();

    // ===== REACTIVE QUERY PARAMS SUBSCRIPTION =====
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.queryView.set(params['view'] || null);
        this.handleQueryParamChange(params);
      });
  }

  /**
   * Navigate to specific view
   */
  navigateToView(view: ViewMode): void {
    const coverId = this.selectedId();
    if (!coverId) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        coverId,
        view: view === 'editor' ? null : view,
      },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Handle side nav selection
   */
  onNavItemSelected(itemId: string): void {
    this.navigateToView(itemId as ViewMode);
  }

  /**
   * Handle query param changes
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
   * Delete funding request
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

      this.activityService.trackProfileActivity(
        'updated',
        'Document attached to funding request',
        'funding_request_document_attached'
      );
    }
  }

  /**
   * Navigate back
   */
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

  navigateBack(): void {
    this.router.navigate(['..'], {
      relativeTo: this.route,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
