// src/app/shared/components/activity-feed.component.ts
import { Component, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, MoreHorizontal, TrendingUp, TrendingDown, Users, Settings, Heart, CreditCard } from 'lucide-angular';
import { UiCardComponent, UiButtonComponent } from '../../shared/components';
import { ActivityService, Activity } from '../services/activity.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent
  ],
  template: `
    <div class="bg-white rounded-lg border border-gray-200">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-gray-500"></lucide-icon>
          <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div class="flex items-center space-x-2">
          <ui-button variant="ghost" size="sm" (clicked)="toggleFilter()">
            <lucide-icon [img]="FilterIcon" [size]="16" class="mr-1"></lucide-icon>
            Filter
          </ui-button>
          <ui-button variant="ghost" size="sm" (clicked)="viewAllClicked.emit()">
            <lucide-icon [img]="MoreIcon" [size]="16"></lucide-icon>
          </ui-button>
        </div>
      </div>

      <!-- Activity List -->
      <div class="divide-y divide-gray-50">
        @for (activity of activities$ | async; track activity.id) {
          <div class="p-4 hover:bg-gray-50 transition-colors cursor-pointer" 
               (click)="activityClicked.emit(activity)">
            <div class="flex items-start space-x-4">
              <!-- Activity Type Icon -->
              <div [class]="getActivityIconClasses(activity.type, activity.status)">
                <lucide-icon 
                  [img]="getActivityIcon(activity.type)" 
                  [size]="16">
                </lucide-icon>
              </div>

              <!-- Activity Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <div class="flex-1 space-y-1">
                    <!-- Type Badge and Status -->
                    <div class="flex items-center space-x-2">
                      <span [class]="getTypeBadgeClasses(activity.type)">
                        {{ getTypeLabel(activity.type) }}
                      </span>
                      <span [class]="getStatusClasses(activity.status)">
                        {{ getStatusLabel(activity.status) }}
                      </span>
                    </div>

                    <!-- Message -->
                    <p class="text-sm text-gray-900 font-medium leading-tight">
                      {{ activity.message }}
                    </p>

                    <!-- Details -->
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{{ activityService.formatRelativeTime(activity.createdAt) }}</span>
                      @if (activity.method) {
                        <span class="flex items-center">
                          <lucide-icon [img]="CreditCardIcon" [size]="12" class="mr-1"></lucide-icon>
                          {{ activity.method }}
                        </span>
                      }
                      @if (activity.user) {
                        <span class="flex items-center">
                          <lucide-icon [img]="UsersIcon" [size]="12" class="mr-1"></lucide-icon>
                          {{ activity.user.name }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Amount (if applicable) -->
                  @if (activity.amount) {
                    <div class="text-right ml-4">
                      <span [class]="getAmountClasses(activity.amount, activity.status)">
                        {{ getAmountDisplay(activity.amount) }}
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-8 text-center">
            <lucide-icon [img]="TrendingUpIcon" [size]="32" class="mx-auto text-gray-300 mb-3"></lucide-icon>
            <p class="text-sm text-gray-500 font-medium">No recent activity</p>
            <p class="text-xs text-gray-400 mt-1">Activity will appear here as it happens</p>
          </div>
        }
      </div>

      <!-- Footer -->
      @if ((activities$ | async)?.length && (activities$ | async)!.length > 6) {
        <div class="p-4 border-t border-gray-100 bg-gray-50">
          <ui-button 
            variant="ghost" 
            size="sm" 
            [fullWidth]="true"
            (clicked)="viewAllClicked.emit()">
            View All Activities
          </ui-button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ActivityFeedComponent implements OnInit {
  // Icons
  FilterIcon = Filter;
  MoreIcon = MoreHorizontal;
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  UsersIcon = Users;
  SettingsIcon = Settings;
  HeartIcon = Heart;
  CreditCardIcon = CreditCard;

  // Inject service
  activityService = inject(ActivityService);

  // Data
  activities$!: Observable<Activity[]>;

  // Outputs
  viewAllClicked = output<void>();
  activityClicked = output<Activity>();

  ngOnInit() {
    this.activities$ = this.activityService.getActivities();
  }

  toggleFilter() {
    // Implement filter logic here
    console.log('Toggle filter');
  }

  getActivityIconClasses(type: string, status: string): string {
    const baseClasses = 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2';
    
    if (status === 'pending') {
      return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-600`;
    }
    
    if (status === 'failed') {
      return `${baseClasses} bg-red-50 border-red-200 text-red-600`;
    }

    switch (type) {
      case 'donation':
        return `${baseClasses} bg-green-50 border-green-200 text-green-600`;
      case 'withdrawal':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-600`;
      case 'campaign':
        return `${baseClasses} bg-purple-50 border-purple-200 text-purple-600`;
      case 'user':
        return `${baseClasses} bg-indigo-50 border-indigo-200 text-indigo-600`;
      case 'system':
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-600`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-600`;
    }
  }

  getActivityIcon(type: string): any {
    switch (type) {
      case 'donation':
        return Heart;
      case 'withdrawal':
        return TrendingDown;
      case 'campaign':
        return TrendingUp;
      case 'user':
        return Users;
      case 'system':
        return Settings;
      default:
        return TrendingUp;
    }
  }

  getTypeBadgeClasses(type: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
    
    switch (type) {
      case 'donation':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'withdrawal':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'campaign':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'user':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case 'system':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'donation': return 'DONATION';
      case 'withdrawal': return 'WITHDRAWAL';
      case 'campaign': return 'CAMPAIGN';
      case 'user': return 'USER';
      case 'system': return 'SYSTEM';
      default: return type.toUpperCase();
    }
  }

  getStatusClasses(status: string): string {
    const baseClasses = 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return status;
    }
  }

  getAmountClasses(amount: number, status: string): string {
    const baseClasses = 'text-sm font-semibold';
    
    if (status === 'pending') {
      return `${baseClasses} text-yellow-600`;
    }
    
    if (status === 'failed') {
      return `${baseClasses} text-red-600`;
    }

    if (amount > 0) {
      return `${baseClasses} text-green-600`;
    } else {
      return `${baseClasses} text-blue-600`;
    }
  }

  getAmountDisplay(amount: number): string {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${this.activityService.formatAmount(amount)}`;
  }
}