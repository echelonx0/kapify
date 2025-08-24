 

// applications-home.component.ts
import { Component, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Plus,
  Filter,
  Eye,
  Search,
  X
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import { ActivityInboxComponent } from '../../shared/components/messaging/messaging.component';
 
 

interface Application {
  id: string;
  title: string;
  applicationNumber: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType: 'equity' | 'debt' | 'grant' | 'mezzanine';
  requestedAmount: number;
  currency: string;
  currentStage: string;
  description?: string;
  matchScore?: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewNotes: any[];
}

@Component({
  selector: 'app-kapify-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
 
    UiButtonComponent,
 
    ActivityInboxComponent
  ],
  templateUrl: 'kapify-dashboard.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class KapifyDashboard implements OnInit {
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Filter;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;

  // State
  isLoading = signal(false);
  showFilters = signal(false);
  applications = signal<Application[]>([]);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  fundingTypeFilter = signal('');

  // Mock data
  private mockApplications: Application[] = [
    {
      id: 'app-001',
      title: 'Tech Startup Growth Capital Application',
      applicationNumber: 'APP-2025-001',
      status: 'under_review',
      fundingType: 'equity',
      requestedAmount: 2500000,
      currency: 'ZAR',
      currentStage: 'Due Diligence',
      description: 'Seeking growth capital to expand our AI-powered logistics platform across South Africa.',
      matchScore: 85,
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-08-01'),
      submittedAt: new Date('2025-02-01'),
      reviewNotes: []
    },
    {
      id: 'app-002',
      title: 'Manufacturing Equipment Finance',
      applicationNumber: 'APP-2025-002',
      status: 'approved',
      fundingType: 'debt',
      requestedAmount: 5000000,
      currency: 'ZAR',
      currentStage: 'Documentation',
      description: 'Equipment financing for new production line to meet increased demand.',
      matchScore: 92,
      createdAt: new Date('2025-02-01'),
      updatedAt: new Date('2025-08-05'),
      submittedAt: new Date('2025-02-15'),
      reviewNotes: []
    },
    {
      id: 'app-003',
      title: 'AgriTech Innovation Grant',
      applicationNumber: 'APP-2025-003',
      status: 'submitted',
      fundingType: 'grant',
      requestedAmount: 1000000,
      currency: 'ZAR',
      currentStage: 'Initial Review',
      description: 'Grant funding for developing sustainable farming technology for smallholder farmers.',
      matchScore: 78,
      createdAt: new Date('2025-03-01'),
      updatedAt: new Date('2025-08-03'),
      submittedAt: new Date('2025-03-15'),
      reviewNotes: []
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadApplications();
  }

  // Computed properties
  filteredApplications = computed(() => {
    let filtered = this.applications();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.applicationNumber.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter()) {
      filtered = filtered.filter(app => app.status === this.statusFilter());
    }

    if (this.fundingTypeFilter()) {
      filtered = filtered.filter(app => app.fundingType === this.fundingTypeFilter());
    }

    return filtered;
  });

  stats = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      underReview: apps.filter(app => app.status === 'under_review').length,
      approved: apps.filter(app => app.status === 'approved').length,
      rejected: apps.filter(app => app.status === 'rejected').length
    };
  });

  hasActiveFilters = computed(() => {
    return !!(this.searchQuery() || this.statusFilter() || this.fundingTypeFilter());
  });

  private loadApplications() {
    this.isLoading.set(true);
    // Simulate API call
    setTimeout(() => {
      this.applications.set(this.mockApplications);
      this.isLoading.set(false);
    }, 1000);
  }

  // Actions
  toggleFilters() {
    this.showFilters.update(current => !current);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.fundingTypeFilter.set('');
  }

  createNewApplication() {
    this.router.navigate(['/applications/new']);
  }

  viewApplication(id: string) {
    this.router.navigate(['/applications', id]);
  }

  // Utility methods
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-green-100 text-green-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getApplicationProgress(application: Application): number {
    const progressMap: Record<string, number> = {
      draft: 10,
      submitted: 25,
      under_review: 60,
      approved: 100,
      rejected: 100,
      withdrawn: 0
    };
    return progressMap[application.status] || 0;
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  formatTotalRequested(): string {
    const total = this.applications().reduce((sum, app) => sum + app.requestedAmount, 0);
    return this.formatCurrency(total, 'ZAR');
  }
}