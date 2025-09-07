// src/app/shared/components/application-list-card/application-list-card.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Eye,
  Calendar,
  Building,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-angular';
import { UserType } from '../../models/user.models';

// Unified interface for both SME and Funder applications
export interface BaseApplicationCard {
  id: string;
  title: string;
  applicationNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType?: string;
  requestedAmount: number;
  currency: string;
  currentStage?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  
  // For funder view
  applicantName?: string;
  applicantCompany?: string;
  
  // For SME view
  opportunityTitle?: string;
  opportunityId?: string;
}

 

@Component({
  selector: 'app-application-list-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div 
      class="application-card"
      [class.card-draft]="application.status === 'draft'"
      [class.card-submitted]="application.status === 'submitted'"
      [class.card-under-review]="application.status === 'under_review'"
      [class.card-approved]="application.status === 'approved'"
      [class.card-rejected]="application.status === 'rejected'"
      [class.card-withdrawn]="application.status === 'withdrawn'"
    >
      <!-- Status Border -->
      <div class="status-border"></div>
      
      <!-- Main Content -->
      <div class="card-content">
        <!-- Header Row -->
        <div class="header-row">
          <div class="header-info">
            <div class="title-row">
              <h3 class="application-title">{{ application.title }}</h3>
              
              <!-- Status Badge -->
              <span class="status-badge" [class]="statusBadgeClass()">
                <lucide-icon 
                  [img]="statusIcon()" 
                  [size]="12" 
                  class="mr-1" 
                />
                {{ statusText() }}
              </span>
              
              <!-- Stage Badge -->
              @if (application.currentStage) {
                <span class="stage-badge">
                  {{ application.currentStage }}
                </span>
              }
            </div>
            
            <!-- Application Number -->
            @if (application.applicationNumber) {
              <div class="application-number">
                <lucide-icon [img]="FileTextIcon" [size]="14" class="mr-1" />
                {{ application.applicationNumber }}
              </div>
            }
          </div>
          
          <!-- Action Buttons Slot -->
          <div class="action-buttons">
            <ng-content select="[slot=actions]"></ng-content>
          </div>
        </div>
        
        <!-- Details Grid -->
        <div class="details-grid">
          <!-- Amount -->
          <div class="detail-item">
            <div class="detail-icon amount-icon">
              <lucide-icon [img]="DollarSignIcon" [size]="16" />
            </div>
            <div>
              <p class="detail-label">Requested Amount</p>
              <p class="detail-value">{{ formatCurrency(application.requestedAmount, application.currency) }}</p>
            </div>
          </div>
          
          <!-- Date Info -->
          <div class="detail-item">
            <div class="detail-icon date-icon">
              <lucide-icon [img]="CalendarIcon" [size]="16" />
            </div>
            <div>
              <p class="detail-label">{{ dateLabel() }}</p>
              <p class="detail-value">{{ formatDate(dateValue()) }}</p>
            </div>
          </div>
          
          <!-- Context-specific third column -->
          @if (userType === 'funder' && (application.applicantName || application.applicantCompany)) {
            <div class="detail-item">
              <div class="detail-icon applicant-icon">
                <lucide-icon [img]="application.applicantCompany ? BuildingIcon : UserIcon" [size]="16" />
              </div>
              <div>
                <p class="detail-label">Applicant</p>
                <p class="detail-value">
                  {{ application.applicantCompany || application.applicantName }}
                </p>
              </div>
            </div>
          }
          
          @if (userType === 'sme' && application.opportunityTitle) {
            <div class="detail-item">
              <div class="detail-icon opportunity-icon">
                <lucide-icon [img]="TrendingUpIcon" [size]="16" />
              </div>
              <div>
                <p class="detail-label">Opportunity</p>
                <p class="detail-value">{{ application.opportunityTitle }}</p>
              </div>
            </div>
          }
        </div>
        
        <!-- Description -->
        @if (application.description) {
          <div class="description">
            <p>{{ application.description }}</p>
          </div>
        }
        
        <!-- Progress Bar -->
        @if (showProgress && application.status !== 'draft') {
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="getProgress()"
              ></div>
            </div>
            <span class="progress-text">{{ getProgress() }}% Complete</span>
          </div>
        }
      </div>
    </div>
  `,

})
export class ApplicationListCardComponent {
  @Input({ required: true }) application!: BaseApplicationCard;
  @Input() userType: UserType = 'sme';
  @Input() showProgress: boolean = true;
  
  @Output() primaryAction = new EventEmitter<BaseApplicationCard>();
  @Output() secondaryAction = new EventEmitter<BaseApplicationCard>();
  @Output() viewDetails = new EventEmitter<BaseApplicationCard>();

  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  EyeIcon = Eye;
  CalendarIcon = Calendar;
  BuildingIcon = Building;
  UserIcon = User;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  statusText = computed(() => {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[this.application.status] || this.application.status;
  });

  statusBadgeClass = computed(() => {
    return `status-${this.application.status.replace('_', '-')}`;
  });

  statusIcon = computed(() => {
    const iconMap: Record<string, any> = {
      draft: FileText,
      submitted: Clock,
      under_review: Clock,
      approved: CheckCircle,
      rejected: AlertCircle,
      withdrawn: AlertCircle
    };
    return iconMap[this.application.status] || FileText;
  });

  dateLabel = computed(() => {
    if (this.application.submittedAt) {
      return 'Submitted';
    }
    return 'Last Updated';
  });

  dateValue = computed(() => {
    return this.application.submittedAt || this.application.updatedAt;
  });

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

  getProgress(): number {
    const progressMap: Record<string, number> = {
      draft: 10,
      submitted: 25,
      under_review: 60,
      approved: 100,
      rejected: 100,
      withdrawn: 0
    };
    return progressMap[this.application.status] || 0;
  }
}