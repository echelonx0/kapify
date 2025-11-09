import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import {
  OpportunitySummary,
  PublicProfileService,
} from '../../services/public-profile.service';

@Component({
  selector: 'app-funder-opportunities-grid',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './fund-opportunities-grid.component.html',
})
export class FunderOpportunitiesGridComponent implements OnInit, OnDestroy {
  @Input() organizationId!: string;

  private router = inject(Router);
  private profileService = inject(PublicProfileService);
  private destroy$ = new Subject<void>();

  // State
  opportunities = signal<OpportunitySummary[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    if (this.organizationId) {
      this.loadOpportunities();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOpportunities() {
    this.isLoading.set(true);

    this.profileService
      .getOrganizationOpportunities(this.organizationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opportunities) => {
          this.opportunities.set(opportunities);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load opportunities:', error);
          this.opportunities.set([]);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Get CSS classes for status badge
   */
  getStatusBadgeClass(status: string): string {
    const baseClass = 'px-2.5 py-1 rounded-full text-xs font-bold';
    const statusClasses: Record<string, string> = {
      active: `${baseClass} bg-green-50 text-green-700 border border-green-200/50`,
      paused: `${baseClass} bg-amber-50 text-amber-700 border border-amber-200/50`,
      closed: `${baseClass} bg-slate-100 text-slate-600 border border-slate-200/50`,
      draft: `${baseClass} bg-slate-50 text-slate-600 border border-slate-200/50`,
    };
    return statusClasses[status] || statusClasses['draft'];
  }

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Open',
      paused: 'Paused',
      closed: 'Closed',
      draft: 'Draft',
    };
    return labels[status] || 'Unknown';
  }

  /**
   * Format funding range display
   */
  formatRange(opp: OpportunitySummary): string {
    const format = (amount: number) => {
      if (amount >= 1000000)
        return `${opp.currency} ${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000)
        return `${opp.currency} ${(amount / 1000).toFixed(0)}K`;
      return `${opp.currency} ${amount.toLocaleString()}`;
    };
    return `${format(opp.minAmount)} - ${format(opp.maxAmount)}`;
  }

  /**
   * Navigate to opportunity details
   */
  viewOpportunity(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  /**
   * Navigate to all opportunities page
   */
  viewAllOpportunities() {
    this.router.navigate(['/funding/opportunities'], {
      queryParams: { org: this.organizationId },
    });
  }
}
