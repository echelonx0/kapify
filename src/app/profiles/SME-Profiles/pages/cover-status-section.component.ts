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
  template: `
    <!-- NEO-BRUTALIST FUNDING REQUEST STATUS SECTION -->
    <div class="bg-white border-t-4 border-b-4 border-slate-200">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- HAS DEFAULT FUNDING REQUEST -->
        @if (hasFundingRequest()) {
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 border-2 border-green-600 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="CheckCircleIcon"
                [size]="18"
                class="text-green-700"
              ></lucide-icon>
            </div>
            <div>
              <h3
                class="text-sm lg:text-base font-black uppercase tracking-widest text-slate-900"
              >
                Funding Request Ready
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                Your funding request is ready to use
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              Manage your funding request and apply to opportunities.
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <!-- Manage Request -->
              <button
                (click)="manageFundingRequest()"
                class="flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <lucide-icon [img]="LayoutGridIcon" [size]="16"></lucide-icon>
                Manage Request
              </button>

              <!-- Manage Demographics -->
              <button
                (click)="navigateToDemographics(defaultFundingRequest()?.id)"
                class="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-black rounded-lg border-3 border-slate-900 uppercase tracking-wide hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <lucide-icon [img]="LayoutGridIcon" [size]="16"></lucide-icon>
                Manage Demographics
              </button>
            </div>
          </div>
        </div>
        } @else {
        <!-- NO FUNDING REQUEST -->
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 border-2 border-amber-600 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="AlertTriangleIcon"
                [size]="18"
                class="text-amber-700"
              ></lucide-icon>
            </div>
            <div>
              <h3
                class="text-sm lg:text-base font-black uppercase tracking-widest text-slate-900"
              >
                Funding Request Required
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                Create your funding request to match with opportunities
              </p>
            </div>
          </div>

          <!-- CTA -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              Your request tells funders what you're seeking and why. Create one
              in just 3 minutes.
            </p>

            <button
              (click)="createNewFundingRequest()"
              class="flex items-center justify-center gap-2 px-6 py-3.5 w-full sm:w-auto bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide text-sm hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <lucide-icon [img]="PlusIcon" [size]="16"></lucide-icon>
              Create Request
            </button>
          </div>
        </div>
        }
      </div>
    </div>

    <!-- CREATE FUNDING REQUEST MODAL -->
    <app-create-cover-modal
      *ngIf="showModal()"
      (choiceMade)="onCreateChoice($event)"
      (cancel)="onCreateCancel()"
    />
  `,
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
