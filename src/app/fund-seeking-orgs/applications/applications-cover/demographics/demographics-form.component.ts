import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { DemographicCategory } from 'src/app/shared/models/funding-application-demographics.model';
import { DemographicsConfigService } from 'src/app/core/services/demographics-config.service';
import { DemographicsService } from 'src/app/core/services/demographics.service';

@Component({
  selector: 'app-demographics-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './demographics-form.component.html',
})
export class DemographicsFormComponent implements OnInit, OnDestroy {
  demographicsService = inject(DemographicsService);
  private coverService = inject(FundingApplicationCoverService);
  private activityService = inject(ActivityService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private configService = inject(DemographicsConfigService);
  private destroy$ = new Subject<void>();

  // ===== STATE =====
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Get coverage ID from route
  coverId = signal<string | null>(null);

  // Demographics data
  demographicsData = this.demographicsService.demographics;

  // Categories as computed signal that safely transforms config
  categories = computed(() => {
    const cfg = this.configService.config();
    return cfg?.categories || [];
  });

  // Completion status
  completionStatus = computed(() => {
    return this.demographicsService.getCompletionStatus(
      this.demographicsData()
    );
  });

  ngOnInit(): void {
    // Get cover ID from route params
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const id = params['coverId'];
        if (id) {
          this.coverId.set(id);
          this.loadDemographics(id);
        }
      });
  }

  /**
   * Load demographics for the funding request
   */
  private async loadDemographics(coverId: string): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      await this.demographicsService.loadDemographics(coverId);

      this.activityService.trackProfileActivity(
        'updated',
        'Opened demographics form',
        'demographics_form_opened'
      );
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to load demographics');
      console.error('❌ Load error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle field value change
   */
  onFieldChange(categoryId: string, fieldName: string, value: any): void {
    this.demographicsService.setFieldValue(categoryId, fieldName, value);
    this.error.set(null);
  }

  /**
   * Save demographics
   */
  saveDemographics(): void {
    const coverId = this.coverId();
    if (!coverId) {
      this.error.set('No funding request selected');
      return;
    }

    const data = this.demographicsData();
    console.log('demographics data', data);

    this.demographicsService
      .saveDemographics(coverId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage.set('Demographics saved successfully');
          setTimeout(() => this.successMessage.set(null), 3000);

          this.activityService.trackProfileActivity(
            'updated',
            'Demographics saved successfully',
            'demographics_saved_success'
          );
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to save demographics');
          console.error('❌ Save error:', err);
        },
      });
  }

  /**
   * Go back to funding request editor
   */
  goBack(): void {
    const coverId = this.coverId();
    if (coverId) {
      this.router.navigate([], {
        relativeTo: this.route.parent,
        queryParams: {
          mode: 'edit',
          coverId,
          view: null,
        },
        queryParamsHandling: 'merge',
      });
    } else {
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }

  /**
   * Format field value for display
   */
  formatFieldValue(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  /**
   * Get field input type for HTML
   */
  getInputType(fieldType: string): string {
    switch (fieldType) {
      case 'percentage':
      case 'number':
        return 'number';
      case 'text':
        return 'text';
      default:
        return 'text';
    }
  }

  /**
   * Track by category for *ngFor
   */
  trackByCategory(index: number, category: DemographicCategory): string {
    return category.id;
  }

  /**
   * Track by field for *ngFor
   */
  trackByField(index: number, field: any): string {
    return field.id || field.name || '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
