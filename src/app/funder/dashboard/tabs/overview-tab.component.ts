import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

interface ApplicationSummary {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  applicantName: string;
  applicantEmail: string;
  requestedAmount: number;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: Date;
  lastUpdated: Date;
  score?: number;
}

interface FilterOptions {
  status: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';
  searchQuery: string;
  sortBy: 'date' | 'amount' | 'score';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-funder-applications-overview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './funder-applications-overview.component.html',
})
export class FunderApplicationsOverviewComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  DownloadIcon = Download;
  FileTextIcon = FileText;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;

  // State
  applications = signal<ApplicationSummary[]>([]);
  loading = signal(true);
  filters = signal<FilterOptions>({
    status: 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Computed
  filteredApplications = computed(() => {
    let apps = [...this.applications()];
    const filter = this.filters();

    // Filter by status
    if (filter.status !== 'all') {
      apps = apps.filter((app) => app.status === filter.status);
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      apps = apps.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(query) ||
          app.opportunityTitle.toLowerCase().includes(query) ||
          app.applicantEmail.toLowerCase().includes(query)
      );
    }

    // Sort
    apps.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      switch (filter.sortBy) {
        case 'date':
          compareA = a.submittedAt.getTime();
          compareB = b.submittedAt.getTime();
          break;
        case 'amount':
          compareA = a.requestedAmount;
          compareB = b.requestedAmount;
          break;
        case 'score':
          compareA = a.score || 0;
          compareB = b.score || 0;
          break;
      }

      return filter.sortOrder === 'asc'
        ? compareA - compareB
        : compareB - compareA;
    });

    return apps;
  });

  // Analytics
  analytics = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      pending: apps.filter((a) => a.status === 'pending').length,
      underReview: apps.filter((a) => a.status === 'under_review').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      totalRequested: apps.reduce((sum, app) => sum + app.requestedAmount, 0),
    };
  });

  ngOnInit() {
    this.loadApplications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications() {
    this.loading.set(true);

    // TODO: Replace with actual service call
    // Simulated data for now
    setTimeout(() => {
      const mockData: ApplicationSummary[] = [
        {
          id: '1',
          opportunityId: 'opp-1',
          opportunityTitle: 'Growth Capital for Tech Startups',
          applicantName: 'TechVentures Ltd',
          applicantEmail: 'contact@techventures.com',
          requestedAmount: 500000,
          status: 'pending',
          submittedAt: new Date('2024-01-15'),
          lastUpdated: new Date('2024-01-15'),
          score: 85,
        },
        {
          id: '2',
          opportunityId: 'opp-1',
          opportunityTitle: 'Growth Capital for Tech Startups',
          applicantName: 'InnovateCo',
          applicantEmail: 'info@innovateco.com',
          requestedAmount: 750000,
          status: 'under_review',
          submittedAt: new Date('2024-01-14'),
          lastUpdated: new Date('2024-01-16'),
          score: 92,
        },
        {
          id: '3',
          opportunityId: 'opp-2',
          opportunityTitle: 'SME Working Capital Fund',
          applicantName: 'Small Business Solutions',
          applicantEmail: 'hello@sbsolutions.com',
          requestedAmount: 250000,
          status: 'approved',
          submittedAt: new Date('2024-01-10'),
          lastUpdated: new Date('2024-01-18'),
          score: 88,
        },
      ];

      this.applications.set(mockData);
      this.loading.set(false);
    }, 500);
  }

  // Filter methods
  updateStatus(status: FilterOptions['status']) {
    this.filters.update((f) => ({ ...f, status }));
  }

  updateSearch(query: string) {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  updateSort(sortBy: FilterOptions['sortBy']) {
    this.filters.update((f) => ({
      ...f,
      sortBy,
      sortOrder: f.sortBy === sortBy && f.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }

  clearFilters() {
    this.filters.set({
      status: 'all',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });
  }

  // Navigation methods
  viewApplication(application: ApplicationSummary) {
    this.router.navigate(['/funder/applications', application.id]);
  }

  viewOpportunityApplications(opportunityId: string) {
    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
      'applications',
    ]);
  }

  exportApplications() {
    console.log('Export applications');
    // TODO: Implement export functionality
  }

  // Utility methods
  getStatusColor(status: ApplicationSummary['status']): string {
    const colors = {
      pending: 'amber',
      under_review: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status];
  }

  getStatusIcon(status: ApplicationSummary['status']) {
    const icons = {
      pending: this.ClockIcon,
      under_review: this.AlertCircleIcon,
      approved: this.CheckCircleIcon,
      rejected: this.XCircleIcon,
    };
    return icons[status];
  }

  formatStatus(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  getScoreColor(score?: number): string {
    if (!score) return 'slate';
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'amber';
    return 'red';
  }
}
