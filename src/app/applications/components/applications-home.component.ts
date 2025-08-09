 

// // applications-home.component.ts
// import { Component, signal, computed, OnInit, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { 
//   LucideAngularModule, 
//   FileText, 
//   Clock, 
//   TrendingUp, 
//   DollarSign,
//   Plus,
//   Filter,
//   Eye,
//   Calendar,
//   AlertCircle,
//   Users,
//   Search,
//   X,
//   Send,
//   Paperclip,
//   Smile
// } from 'lucide-angular';
// import { UiCardComponent, UiButtonComponent, UiStatusBadgeComponent } from '../../shared/components';
 

// interface Activity {
//   id: string;
//   type: 'message' | 'update' | 'comment' | 'file';
//   user: {
//     name: string;
//     avatar?: string;
//     initials: string;
//   };
//   content: string;
//   timestamp: Date;
//   projectName?: string;
//   isRead: boolean;
// }

// interface Application {
//   id: string;
//   title: string;
//   applicationNumber: string;
//   status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
//   fundingType: 'equity' | 'debt' | 'grant' | 'mezzanine';
//   requestedAmount: number;
//   currency: string;
//   currentStage: string;
//   description?: string;
//   matchScore?: number;
//   createdAt: Date;
//   updatedAt: Date;
//   submittedAt?: Date;
//   reviewNotes: any[];
// }

// @Component({
//   selector: 'app-applications-home',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     LucideAngularModule,
//     UiCardComponent,
//     UiButtonComponent,
//     UiStatusBadgeComponent
//   ],
//   templateUrl: 'applications-home.component.html',
//   styles: [`
//     .line-clamp-2 {
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//     }
//   `]
// })
// export class ApplicationsHomeComponent implements OnInit {
//   // Icons
//   FileTextIcon = FileText;
//   ClockIcon = Clock;
//   TrendingUpIcon = TrendingUp;
//   DollarSignIcon = DollarSign;
//   PlusIcon = Plus;
//   FilterIcon = Filter;
//   EyeIcon = Eye;
//   CalendarIcon = Calendar;
//   AlertCircleIcon = AlertCircle;
//   UsersIcon = Users;
//   SearchIcon = Search;
//   XIcon = X;
//   SendIcon = Send;
//   PaperclipIcon = Paperclip;
//   SmileIcon = Smile;

//   // State
//   isLoading = signal(false);
//   showFilters = signal(false);
//   applications = signal<Application[]>([]);
//   activities = signal<Activity[]>([]);
//   newMessage = signal('');

//   // Filters
//   searchQuery = signal('');
//   statusFilter = signal('');
//   fundingTypeFilter = signal('');

//   // Mock data
//   private mockApplications: Application[] = [
//     {
//       id: 'app-001',
//       title: 'Tech Startup Growth Capital Application',
//       applicationNumber: 'APP-2025-001',
//       status: 'under_review',
//       fundingType: 'equity',
//       requestedAmount: 2500000,
//       currency: 'ZAR',
//       currentStage: 'Due Diligence',
//       description: 'Seeking growth capital to expand our AI-powered logistics platform across South Africa.',
//       matchScore: 85,
//       createdAt: new Date('2025-01-15'),
//       updatedAt: new Date('2025-08-01'),
//       submittedAt: new Date('2025-02-01'),
//       reviewNotes: []
//     },
//     {
//       id: 'app-002',
//       title: 'Manufacturing Equipment Finance',
//       applicationNumber: 'APP-2025-002',
//       status: 'approved',
//       fundingType: 'debt',
//       requestedAmount: 5000000,
//       currency: 'ZAR',
//       currentStage: 'Documentation',
//       description: 'Equipment financing for new production line to meet increased demand.',
//       matchScore: 92,
//       createdAt: new Date('2025-02-01'),
//       updatedAt: new Date('2025-08-05'),
//       submittedAt: new Date('2025-02-15'),
//       reviewNotes: []
//     },
//     {
//       id: 'app-003',
//       title: 'AgriTech Innovation Grant',
//       applicationNumber: 'APP-2025-003',
//       status: 'submitted',
//       fundingType: 'grant',
//       requestedAmount: 1000000,
//       currency: 'ZAR',
//       currentStage: 'Initial Review',
//       description: 'Grant funding for developing sustainable farming technology for smallholder farmers.',
//       matchScore: 78,
//       createdAt: new Date('2025-03-01'),
//       updatedAt: new Date('2025-08-03'),
//       submittedAt: new Date('2025-03-15'),
//       reviewNotes: []
//     }
//   ];

//   private mockActivities: Activity[] = [
//     {
//       id: 'act-001',
//       type: 'message',
//       user: { name: 'Sarah Johnson', initials: 'SJ' },
//       content: 'Your application for Tech Startup Growth Capital has moved to due diligence stage. Please prepare additional financial documents.',
//       timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
//       projectName: 'Tech Growth Application',
//       isRead: false
//     },
//     {
//       id: 'act-002',
//       type: 'update',
//       user: { name: 'Mike Chen', initials: 'MC' },
//       content: 'Congratulations! Your Manufacturing Equipment Finance application has been approved.',
//       timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
//       projectName: 'Equipment Finance',
//       isRead: true
//     },
//     {
//       id: 'act-003',
//       type: 'comment',
//       user: { name: 'Lisa Park', initials: 'LP' },
//       content: 'The financial projections look strong. Could you provide more details on the market validation?',
//       timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
//       projectName: 'AgriTech Grant',
//       isRead: true
//     },
//     {
//       id: 'act-004',
//       type: 'file',
//       user: { name: 'David Wilson', initials: 'DW' },
//       content: 'Uploaded revised business plan with updated market analysis.',
//       timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
//       projectName: 'Tech Growth Application',
//       isRead: true
//     },
//     {
//       id: 'act-005',
//       type: 'message',
//       user: { name: 'Emma Thompson', initials: 'ET' },
//       content: 'Welcome to Kapify! Your application has been received and assigned to our review team.',
//       timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
//       projectName: 'AgriTech Grant',
//       isRead: true
//     }
//   ];

//   constructor(private router: Router) {}

//   ngOnInit() {
//     this.loadApplications();
//     this.loadActivities();
//     this.simulateIncomingMessages();
//   }

//   // Computed properties
//   filteredApplications = computed(() => {
//     let filtered = this.applications();

//     if (this.searchQuery()) {
//       const query = this.searchQuery().toLowerCase();
//       filtered = filtered.filter(app => 
//         app.title.toLowerCase().includes(query) ||
//         app.applicationNumber.toLowerCase().includes(query) ||
//         app.description?.toLowerCase().includes(query)
//       );
//     }

//     if (this.statusFilter()) {
//       filtered = filtered.filter(app => app.status === this.statusFilter());
//     }

//     if (this.fundingTypeFilter()) {
//       filtered = filtered.filter(app => app.fundingType === this.fundingTypeFilter());
//     }

//     return filtered;
//   });

//   stats = computed(() => {
//     const apps = this.applications();
//     return {
//       total: apps.length,
//       underReview: apps.filter(app => app.status === 'under_review').length,
//       approved: apps.filter(app => app.status === 'approved').length,
//       rejected: apps.filter(app => app.status === 'rejected').length
//     };
//   });

//   hasActiveFilters = computed(() => {
//     return !!(this.searchQuery() || this.statusFilter() || this.fundingTypeFilter());
//   });

//   private loadApplications() {
//     this.isLoading.set(true);
//     // Simulate API call
//     setTimeout(() => {
//       this.applications.set(this.mockApplications);
//       this.isLoading.set(false);
//     }, 1000);
//   }

//   private loadActivities() {
//     this.activities.set(this.mockActivities);
//   }

//   private simulateIncomingMessages() {
//     // Simulate new messages every 30 seconds
//     setInterval(() => {
//       if (Math.random() > 0.7) { // 30% chance of new message
//         const newActivity: Activity = {
//           id: `act-${Date.now()}`,
//           type: 'message',
//           user: { 
//             name: this.getRandomUser(), 
//             initials: this.getRandomUser().split(' ').map(n => n[0]).join('')
//           },
//           content: this.getRandomMessage(),
//           timestamp: new Date(),
//           projectName: this.getRandomProject(),
//           isRead: false
//         };

//         this.activities.update(activities => [newActivity, ...activities]);
//       }
//     }, 30000);
//   }

//   private getRandomUser(): string {
//     const users = ['Sarah Johnson', 'Mike Chen', 'Lisa Park', 'David Wilson', 'Emma Thompson', 'John Smith'];
//     return users[Math.floor(Math.random() * users.length)];
//   }

//   private getRandomMessage(): string {
//     const messages = [
//       'Your application status has been updated.',
//       'New document uploaded to your application.',
//       'Please provide additional information for review.',
//       'Your application has been assigned to a reviewer.',
//       'Congratulations on your application progress!'
//     ];
//     return messages[Math.floor(Math.random() * messages.length)];
//   }

//   private getRandomProject(): string {
//     const projects = ['Tech Growth Application', 'Equipment Finance', 'AgriTech Grant', 'Export Finance'];
//     return projects[Math.floor(Math.random() * projects.length)];
//   }

//   // Actions
//   toggleFilters() {
//     this.showFilters.update(current => !current);
//   }

//   clearFilters() {
//     this.searchQuery.set('');
//     this.statusFilter.set('');
//     this.fundingTypeFilter.set('');
//   }

//   createNewApplication() {
//     this.router.navigate(['/applications/new']);
//   }

//   viewApplication(id: string) {
//     this.router.navigate(['/applications', id]);
//   }

//   sendMessage() {
//     const message = this.newMessage().trim();
//     if (!message) return;

//     const newActivity: Activity = {
//       id: `act-${Date.now()}`,
//       type: 'message',
//       user: { name: 'You', initials: 'YU' },
//       content: message,
//       timestamp: new Date(),
//       isRead: true
//     };

//     this.activities.update(activities => [newActivity, ...activities]);
//     this.newMessage.set('');
//   }

//   // Utility methods
//   getStatusText(status: string): string {
//     const statusMap: Record<string, string> = {
//       draft: 'Draft',
//       submitted: 'Submitted',
//       under_review: 'Under Review',
//       approved: 'Approved',
//       rejected: 'Rejected',
//       withdrawn: 'Withdrawn'
//     };
//     return statusMap[status] || status;
//   }

//   getStatusBadgeClass(status: string): string {
//     const classMap: Record<string, string> = {
//       draft: 'bg-gray-100 text-gray-800',
//       submitted: 'bg-blue-100 text-blue-800',
//       under_review: 'bg-yellow-100 text-yellow-800',
//       approved: 'bg-green-100 text-green-800',
//       rejected: 'bg-red-100 text-red-800',
//       withdrawn: 'bg-gray-100 text-gray-800'
//     };
//     return classMap[status] || 'bg-gray-100 text-gray-800';
//   }

//   getApplicationProgress(application: Application): number {
//     const progressMap: Record<string, number> = {
//       draft: 10,
//       submitted: 25,
//       under_review: 60,
//       approved: 100,
//       rejected: 100,
//       withdrawn: 0
//     };
//     return progressMap[application.status] || 0;
//   }

//   formatCurrency(amount: number, currency: string): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: currency,
//       notation: 'compact',
//       maximumFractionDigits: 1
//     }).format(amount);
//   }

//   formatDate(date: Date): string {
//     return new Intl.DateTimeFormat('en-ZA', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     }).format(date);
//   }

//   formatTotalRequested(): string {
//     const total = this.applications().reduce((sum, app) => sum + app.requestedAmount, 0);
//     return this.formatCurrency(total, 'ZAR');
//   }

//   getTimeAgo(timestamp: Date): string {
//     const now = new Date();
//     const diff = now.getTime() - timestamp.getTime();
//     const minutes = Math.floor(diff / 60000);
//     const hours = Math.floor(diff / 3600000);
//     const days = Math.floor(diff / 86400000);

//     if (minutes < 1) return 'Just now';
//     if (minutes < 60) return `${minutes}m ago`;
//     if (hours < 24) return `${hours}h ago`;
//     return `${days}d ago`;
//   }
// }

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
import { UiCardComponent, UiButtonComponent, UiStatusBadgeComponent } from '../../shared/components';
import { ActivityInboxComponent } from './activity-inbox.component';
 

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
  selector: 'app-applications-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiStatusBadgeComponent,
    ActivityInboxComponent
  ],
  template: `
    <div class="h-full bg-gray-50 flex flex-col overflow-hidden">
      <!-- Fixed Header -->
      <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Applications</h1>
            <p class="text-gray-600 mt-1">Manage and track your funding applications</p>
          </div>

          <div class="flex items-center space-x-3">
            <ui-button variant="outline" (clicked)="toggleFilters()">
              <lucide-icon [img]="FilterIcon" [size]="16" class="mr-2" />
              Filters
              @if (hasActiveFilters()) {
                <span class="ml-1 bg-red-500 text-white rounded-full w-2 h-2"></span>
              }
            </ui-button>

            <ui-button variant="primary" (clicked)="createNewApplication()">
              <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
              New Application
            </ui-button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Side - Applications (60%) -->
        <div class="w-3/5 flex flex-col overflow-hidden">
          <!-- Filters Section -->
          @if (showFilters()) {
            <div class="bg-white border-b border-gray-200 p-6 flex-shrink-0">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="relative">
                  <lucide-icon [img]="SearchIcon" [size]="16" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    [(ngModel)]="searchQuery"
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <!-- Status Filter -->
                <select
                  [(ngModel)]="statusFilter"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <!-- Funding Type Filter -->
                <select
                  [(ngModel)]="fundingTypeFilter"
                  class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="grant">Grant</option>
                  <option value="mezzanine">Mezzanine</option>
                </select>

                <!-- Clear Filters -->
                <ui-button variant="outline" (clicked)="clearFilters()" [disabled]="!hasActiveFilters()">
                  <lucide-icon [img]="XIcon" [size]="16" class="mr-2" />
                  Clear
                </ui-button>
              </div>
            </div>
          }

          <!-- Stats Cards -->
          <div class="bg-white border-b border-gray-200 p-6 flex-shrink-0">
            <div class="grid grid-cols-4 gap-6">
              <div class="text-center">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <lucide-icon [img]="FileTextIcon" [size]="24" class="text-blue-600" />
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats().total }}</div>
                <div class="text-sm text-gray-600">Total</div>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <lucide-icon [img]="ClockIcon" [size]="24" class="text-yellow-600" />
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats().underReview }}</div>
                <div class="text-sm text-gray-600">Under Review</div>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-green-600" />
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ stats().approved }}</div>
                <div class="text-sm text-gray-600">Approved</div>
              </div>

              <div class="text-center">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <lucide-icon [img]="DollarSignIcon" [size]="24" class="text-purple-600" />
                </div>
                <div class="text-2xl font-bold text-gray-900">{{ formatTotalRequested() }}</div>
                <div class="text-sm text-gray-600">Total Requested</div>
              </div>
            </div>
          </div>

          <!-- Applications List - Scrollable -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-12">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p class="text-gray-600">Loading applications...</p>
                </div>
              </div>
            } @else if (filteredApplications().length === 0) {
              <div class="text-center py-12">
                <lucide-icon [img]="FileTextIcon" [size]="48" class="mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                <p class="text-gray-600 mb-6">
                  @if (hasActiveFilters()) {
                    No applications match your current filters.
                  } @else {
                    You haven't created any applications yet.
                  }
                </p>
              </div>
            } @else {
              @for (application of filteredApplications(); track application.id) {
                <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <!-- Application Header -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            (click)="viewApplication(application.id)">
                          {{ application.title }}
                        </h3>
                        <span class="px-2 py-1 text-xs font-medium rounded-full"
                              [class]="getStatusBadgeClass(application.status)">
                          {{ getStatusText(application.status) }}
                        </span>
                      </div>
                      
                      <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>{{ application.applicationNumber }}</span>
                        <span>{{ formatCurrency(application.requestedAmount, application.currency) }}</span>
                        <span>{{ formatDate(application.submittedAt || application.createdAt) }}</span>
                      </div>
                      
                      @if (application.description) {
                        <p class="text-gray-700 line-clamp-2">{{ application.description }}</p>
                      }
                    </div>
                    
                    <ui-button variant="outline" size="sm" (clicked)="viewApplication(application.id)">
                      <lucide-icon [img]="EyeIcon" [size]="14" class="mr-1" />
                      View
                    </ui-button>
                  </div>
                  
                  <!-- Application Progress -->
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center justify-between text-sm mb-2">
                      <span class="text-gray-600">Progress</span>
                      <span class="text-gray-900 font-medium">{{ getApplicationProgress(application) }}% Complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        [style.width.%]="getApplicationProgress(application)">
                      </div>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Right Side - Activity Inbox (40%) -->
        <div class="w-2/5 border-l border-gray-200">
          <app-activity-inbox />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ApplicationsHomeComponent implements OnInit {
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
      submitted: 'bg-blue-100 text-blue-800',
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