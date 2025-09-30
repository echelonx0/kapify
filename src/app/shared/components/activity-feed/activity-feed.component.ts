 
// src/app/shared/components/activity-feed.component.ts  
import { Component, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, MoreHorizontal, TrendingUp, DollarSign, FileText, Users, Upload, Flag, Handshake, Settings, CreditCard, DollarSignIcon, FileTextIcon, FlagIcon, HandshakeIcon, SettingsIcon, TrendingUpIcon, UploadIcon, UsersIcon } from 'lucide-angular';
import { UiButtonComponent } from '..';
import { ActivityService } from '../../services/activity.service';
import { Observable } from 'rxjs';
import { Activity } from '../../services/database-activity.service';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    <div class="activity-feed-card">
      <!-- Header -->
      <div class="activity-header">
        <div class="activity-header-left">
          <div class="activity-header-icon">
            <lucide-icon [img]="TrendingUpIcon" [size]="20"></lucide-icon>
          </div>
          <h3 class="activity-title">Recent Activity</h3>
        </div>
        <div class="activity-header-actions">
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
      <div class="activity-list">
        @if (activityService.isLoading()) {
          <div class="activity-loading">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading activities...</p>
          </div>
        } @else if (activityService.error()) {
          <div class="activity-error">
            <p class="error-text">{{ activityService.error() }}</p>
            <ui-button variant="outline" size="sm" (clicked)="refresh()" class="mt-2">
              Try Again
            </ui-button>
          </div>
        } @else {
          @for (activity of activities$ | async; track activity.id; let i = $index) {
            <div 
              class="activity-item"
              [class]="'activity-item-' + activity.type"
              [style.animation-delay]="i * 50 + 'ms'"
              (click)="activityClicked.emit(activity)">
              
              <!-- Status border -->
              <div [class]="'activity-border activity-border-' + activity.type"></div>

              <div class="activity-content">
                <!-- Activity Type Icon -->
                <div [class]="'activity-icon activity-icon-' + activity.type">
                  <lucide-icon 
                    [img]="getActivityIcon(activity.type)" 
                    [size]="18">
                  </lucide-icon>
                </div>

                <!-- Activity Details -->
                <div class="activity-details">
                  <div class="activity-header-row">
                    <div class="activity-meta">
                      <!-- Type Badge -->
                      <span [class]="'activity-type-badge activity-type-' + activity.type">
                        {{ getTypeLabel(activity.type) }}
                      </span>
                      
                      <!-- Status Badge -->
                      <span [class]="'activity-status-badge activity-status-' + activity.status">
                        {{ getStatusLabel(activity.status) }}
                      </span>
                      
                      <!-- Action Tag -->
                      @if (activity.action) {
                        <span class="activity-action-tag">
                          {{ activity.action }}
                        </span>
                      }
                    </div>

                    <!-- Amount (if applicable) -->
                    @if (activity.amount) {
                      <div class="activity-amount">
                        <span [class]="'amount-value amount-' + activity.status">
                          {{ getAmountDisplay(activity.amount) }}
                        </span>
                      </div>
                    }
                  </div>

                  <!-- Message -->
                  <p class="activity-message">
                    {{ activity.message }}
                  </p>

                  <!-- Additional Info -->
                  <div class="activity-info">
                    <span class="info-item">
                      {{ activityService.formatRelativeTime(activity.createdAt) }}
                    </span>
                    
                    @if (activity.method) {
                      <span class="info-divider">•</span>
                      <span class="info-item info-with-icon">
                        <lucide-icon [img]="CreditCardIcon" [size]="12"></lucide-icon>
                        {{ activity.method }}
                      </span>
                    }
                    
                    @if (activity.user) {
                      <span class="info-divider">•</span>
                      <span class="info-item info-with-icon">
                        <lucide-icon [img]="UsersIcon" [size]="12"></lucide-icon>
                        {{ activity.user.name }}
                      </span>
                    }
                    
                    @if (activity.entityType && activity.entityId) {
                      <span class="info-divider">•</span>
                      <span class="info-item info-entity">
                        {{ activity.entityType }}: {{ activity.entityId.substring(0, 8) }}...
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>
          } @empty {
            <div class="activity-empty">
              <div class="empty-icon">
                <lucide-icon [img]="TrendingUpIcon" [size]="32"></lucide-icon>
              </div>
              <p class="empty-title">No recent activity</p>
              <p class="empty-description">Activity will appear here as it happens</p>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      @if ((activities$ | async)?.length && (activities$ | async)!.length > 6) {
        <div class="activity-footer">
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
  styleUrls: ['./activity-feed.component.css'],
})
export class ActivityFeedComponent implements OnInit {
  // Icons
  FilterIcon = Filter;
  MoreIcon = MoreHorizontal;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  CreditCardIcon = CreditCard;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  UploadIcon = Upload;
  FlagIcon = Flag;
  HandshakeIcon = Handshake;
  SettingsIcon = Settings;

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
    console.log('Toggle filter');
  }

  refresh() {
    this.activityService.clearCache();
    this.activities$ = this.activityService.getActivities();
  }

  getActivityIcon(type: string): any {
    const icons: Record<string, any> = {
      'funding': DollarSignIcon,
      'application': FileTextIcon,
      'profile': UsersIcon,
      'document': UploadIcon,
      'partnership': HandshakeIcon,
      'milestone': FlagIcon,
      'system': SettingsIcon
    };
    return icons[type] || TrendingUpIcon;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'funding': 'Funding',
      'application': 'Application',
      'profile': 'Profile',
      'document': 'Document',
      'partnership': 'Partnership',
      'milestone': 'Milestone',
      'system': 'System'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed'
    };
    return labels[status] || status;
  }

  getAmountDisplay(amount: number): string {
    return this.activityService.formatAmount(amount);
  }
}