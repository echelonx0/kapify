import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  AlertTriangle,
  CheckCircle,
  LayoutGrid,
  Plus,
} from 'lucide-angular';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { CreateCoverModalComponent } from 'src/app/features/applications-cover/create-cover-modal.component';

@Component({
  selector: 'app-cover-status-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CreateCoverModalComponent],
  templateUrl: './cover-status-section.component.html',
})
export class CoverStatusSectionComponent implements OnInit {
  private coverService = inject(FundingApplicationCoverService);
  private activityService = inject(ActivityService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Icons
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  LayoutGridIcon = LayoutGrid;
  PlusIcon = Plus;

  // Modal state
  showModal = signal(false);

  // Default funding request (single-profile mode)
  defaultFundingRequest = this.coverService.defaultProfile;

  // Computed
  hasFundingRequest = () => !!this.defaultFundingRequest();

  ngOnInit(): void {}

  /**
   * Create new funding request
   */
  createNewFundingRequest(): void {
    this.activityService.trackProfileActivity(
      'created',
      'User initiated funding request creation',
      'funding_request_create_cta'
    );
    this.showModal.set(true);
  }

  /**
   * Handle modal choice
   */
  async onCreateChoice(choice: { action: 'fresh' }): Promise<void> {
    this.showModal.set(false);

    try {
      const result = await this.coverService.createBlankCover();
      if (result.success && result.cover) {
        this.router.navigate(['covers'], {
          relativeTo: this.route.parent,
          queryParams: {
            mode: 'edit',
            coverId: result.cover.id,
          },
        });

        this.activityService.trackProfileActivity(
          'created',
          'New funding request created',
          'funding_request_create_fresh'
        );
      }
    } catch (error) {
      console.error('Error creating funding request:', error);
    }
  }

  /**
   * Navigate to demographics form
   * ✅ FIXED: Navigate to covers route with view=demographics param
   */
  navigateToDemographics(coverId?: string): void {
    if (!coverId) return;

    this.activityService.trackProfileActivity(
      'updated',
      'User opened demographics editor',
      'funding_request_demographics_manage'
    );

    // Navigate to covers route (which is the parent), then set view to demographics
    this.router.navigate(['covers'], {
      relativeTo: this.route.parent, // ← Navigate from profile level into covers
      queryParams: {
        coverId,
        view: 'demographics', // ← This tells the covers component to show demographics
      },
    });
  }

  /**
   * Cancel modal
   */
  onCreateCancel(): void {
    this.showModal.set(false);
  }

  /**
   * Manage funding request (navigate to editor)
   */
  manageFundingRequest(): void {
    const defaultRequest = this.defaultFundingRequest();
    if (!defaultRequest) return;

    this.activityService.trackProfileActivity(
      'updated',
      'User opened funding request editor',
      'funding_request_manage_view'
    );

    this.router.navigate(['covers'], {
      relativeTo: this.route.parent,
      queryParams: {
        mode: 'edit',
        coverId: defaultRequest.id,
      },
    });
  }
}
