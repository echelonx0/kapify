import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
} from 'lucide-angular';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ActivityService } from 'src/app/shared/services/activity.service';

@Component({
  selector: 'app-cover-status-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- NEO-BRUTALIST COVER STATUS SECTION -->
    <div class="bg-white border-t-4 border-b-4 border-slate-200">
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- COVER EXISTS STATE -->
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
                Applications: Cover Information Complete
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                Your funding cover is ready to share with funders
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              <strong>Pro Tip:</strong> Share your cover with 5+ funders to
              increase matching opportunities by 3x.
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-3">
              <button
                (click)="editCover()"
                class="flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <lucide-icon [img]="EditIcon" [size]="16"></lucide-icon>
                Edit Cover
              </button>
              <button
                (click)="viewAllCovers()"
                class="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 font-black rounded-lg border-3 border-slate-300 uppercase tracking-wide hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                View All Covers
              </button>
            </div>
          </div>
        </div>
        } @else {
        <!-- NO COVER STATE -->
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
                Applications: Cover Information Required
              </h3>
              <p class="text-xs text-slate-600 mt-1">
                Create a professional funding cover to match with opportunities
              </p>
            </div>
          </div>

          <!-- Call to Action -->
          <div class="pt-2">
            <p class="text-sm text-slate-700 font-semibold mb-4">
              Your cover tells funders exactly what you're seeking and why.
              Build a professional pitch in just 3 minutes.
            </p>

            <!-- Main CTA Button -->
            <button
              (click)="createNewCover()"
              class="flex items-center justify-center gap-2 px-6 py-3.5 w-full sm:w-auto bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide text-sm hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <lucide-icon [img]="PlusIcon" [size]="16"></lucide-icon>
              Start Cover Now
            </button>
          </div>
        </div>
        }
      </div>
    </div>
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
  EditIcon = Edit;
  PlusIcon = Plus;

  // Computed signal for cover existence
  hasCoverInformation = computed(
    () =>
      this.coverService.cover() !== null ||
      this.coverService.defaultProfile() !== null
  );

  ngOnInit(): void {
    // Cover status already loaded by parent component
    // This component just displays the state
  }

  /**
   * Create new cover
   * Navigates to covers route with mode: 'create'
   * Component will auto-create and show editor
   */
  createNewCover(): void {
    this.activityService.trackProfileActivity(
      'created',
      'User initiated cover creation from status section',
      'cover_create_cta'
    );

    this.router.navigate(['covers'], {
      relativeTo: this.route.parent,
      queryParams: { mode: 'create' },
    });
  }

  /**
   * Edit existing cover
   * Gets the current cover and navigates with mode: 'edit'
   * Component will load and show editor
   */
  editCover(): void {
    const cover = this.coverService.cover();
    if (!cover?.id) {
      console.warn('No cover to edit');
      return;
    }

    this.activityService.trackProfileActivity(
      'updated',
      'User opened cover for editing',
      'cover_edit_cta'
    );

    this.router.navigate(['covers'], {
      relativeTo: this.route.parent,
      queryParams: {
        mode: 'edit',
        coverId: cover.id,
      },
    });
  }

  /**
   * View all covers
   * Navigates to covers route in list/view mode
   * No mode specified = defaults to list view
   */
  viewAllCovers(): void {
    this.activityService.trackProfileActivity(
      'updated',
      'User opened cover management view',
      'cover_list_view'
    );

    this.router.navigate(['covers'], {
      relativeTo: this.route.parent,
      queryParams: { mode: 'view' },
    });
  }
}
