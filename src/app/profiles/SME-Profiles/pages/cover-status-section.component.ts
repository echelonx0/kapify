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
    <!-- NEO-BRUTALIST COVER STATUS SECTION -->
    <div class="bg-white border-t-4 border-b-4 border-slate-200">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- COVERS EXIST STATE: Show manage button -->
        @if (hasCoverInformation()) {
        <div class="space-y-4">
          <!-- Header with Icon -->
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
                Funding Profiles Ready
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                You have {{ coversCount() }} profile(s) ready to use
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              Manage your funding profiles and apply to opportunities.
            </p>

            <!-- Manage Button -->
            <button
              (click)="manageCover()"
              class="flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <lucide-icon [img]="LayoutGridIcon" [size]="16"></lucide-icon>
              Manage Profiles
            </button>
          </div>
        </div>
        } @else {
        <!-- NO COVERS STATE: Show modal prompt -->
        <div class="space-y-4">
          <!-- Header with Icon -->
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
                Funding Profiles Required
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                Create a funding profile to match with opportunities
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              Your profile tells funders what you're seeking and why. Create one
              in just 3 minutes.
            </p>

            <!-- Main CTA Button -->
            <button
              (click)="createNewCover()"
              class="flex items-center justify-center gap-2 px-6 py-3.5 w-full sm:w-auto bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide text-sm hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <lucide-icon [img]="PlusIcon" [size]="16"></lucide-icon>
              Create Profile
            </button>
          </div>
        </div>
        }
      </div>
    </div>

    <!-- CREATE COVER MODAL (shown when needed) -->
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

  // Covers state
  covers = this.coverService.covers;

  // Computed: has any covers
  hasCoverInformation = () => this.covers().length > 0;

  // Computed: cover count for display
  coversCount = () => this.covers().length;

  ngOnInit(): void {
    // Cover status already loaded by parent component
    // This component just displays the state
  }

  /**
   * Create new cover
   * Shows modal instead of navigating directly
   */
  createNewCover(): void {
    this.activityService.trackProfileActivity(
      'created',
      'User initiated cover creation from status section',
      'cover_create_cta'
    );
    this.showModal.set(true);
  }

  /**
   * Handle modal choice
   */
  async onCreateChoice(choice: { action: 'fresh' }): Promise<void> {
    this.showModal.set(false);

    try {
      // Create blank cover
      const result = await this.coverService.createBlankCover();
      if (result.success && result.cover) {
        console.log('✅ Cover created:', result.cover.id);

        // Navigate to editor with new cover
        this.router.navigate(['covers'], {
          relativeTo: this.route.parent,
          queryParams: {
            mode: 'edit',
            coverId: result.cover.id,
          },
        });

        this.activityService.trackProfileActivity(
          'created',
          'New funding profile created (from status section)',
          'cover_create_fresh_status'
        );
      } else {
        console.error('Failed to create cover:', result.error);
      }
    } catch (error) {
      console.error('Error creating cover:', error);
    }
  }

  /**
   * Cancel modal
   */
  onCreateCancel(): void {
    this.showModal.set(false);
  }

  /**
   * Manage covers
   * Navigate to covers list
   */
  manageCover(): void {
    this.activityService.trackProfileActivity(
      'updated',
      'User opened cover management view',
      'cover_manage_view'
    );

    this.router.navigate(['covers'], {
      relativeTo: this.route.parent,
      queryParams: { mode: 'view' },
    });
  }
}
