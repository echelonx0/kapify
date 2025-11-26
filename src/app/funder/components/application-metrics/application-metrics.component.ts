// src/app/funder/components/application-detail/components/application-metrics/application-metrics.component.ts
import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  DollarSign,
  Calendar,
  Building,
  TrendingUp,
  User,
  Mail,
  Hash,
  Phone,
  MapPin,
  CreditCard,
  Briefcase,
  Users,
  Target,
  FileText,
  Activity,
  BarChart3,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
} from 'lucide-angular';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { FundingOpportunity } from '../../create-opportunity/shared/funding.interfaces';
import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import {
  ManagementMember,
  BoardMember,
} from 'src/app/SMEs/applications/models/funding-application.models';

type TabId =
  | 'overview'
  | 'personal'
  | 'business'
  | 'financial'
  | 'funding'
  | 'management'
  | 'swot'
  | 'strategy';

interface Tab {
  id: TabId;
  label: string;
  icon: any;
}

@Component({
  selector: 'app-application-metrics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './application-metrics.component.html',
  styleUrls: ['./application-metrics.component.css'],
})
export class ApplicationMetricsComponent {
  @Input() application!: FundingApplication;
  @Input() opportunity!: FundingOpportunity;
  @Input() profileData!: Partial<ProfileData>;

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  UserIcon = User;
  MailIcon = Mail;
  HashIcon = Hash;
  PhoneIcon = Phone;
  MapPinIcon = MapPin;
  CreditCardIcon = CreditCard;
  BriefcaseIcon = Briefcase;
  UsersIcon = Users;
  TargetIcon = Target;
  FileTextIcon = FileText;
  ActivityIcon = Activity;
  BarChart3Icon = BarChart3;
  LightbulbIcon = Lightbulb;
  AlertCircleIcon = AlertCircle;
  AlertTriangleIcon = AlertTriangle;

  // Active tab state
  activeTab = signal<TabId>('overview');

  // Tab configuration
  tabs: Tab[] = [
    { id: 'overview', label: 'Overview', icon: this.ActivityIcon },
    // { id: 'personal', label: 'Contact', icon: this.UserIcon },
    { id: 'business', label: 'Business', icon: this.BuildingIcon },
    { id: 'financial', label: 'Financials', icon: this.BarChart3Icon },
    // { id: 'funding', label: 'Funding', icon: this.DollarSignIcon },
    { id: 'management', label: 'Leadership', icon: this.UsersIcon },
    { id: 'swot', label: 'SWOT', icon: this.LightbulbIcon },
    { id: 'strategy', label: 'Strategy', icon: this.TargetIcon },
  ];

  requestedAmount = computed(() => {
    const formData = this.application?.formData as any;
    const amount = formData?.requestedAmount;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  timeline = computed(() => {
    const formData = this.application?.formData as any;
    return formData?.timeline || null;
  });

  useOfFunds = computed(() => {
    const formData = this.application?.formData as any;
    return formData?.useOfFunds || null;
  });

  purposeStatement = computed(() => {
    const formData = this.application?.formData as any;
    return formData?.purposeStatement || this.application?.description || null;
  });

  // Profile-based computed properties
  personalInfo = computed(() => this.profileData?.personalInfo);

  businessInfo = computed(() => this.profileData?.businessInfo);

  financialInfo = computed(() => this.profileData?.financialInfo);

  fundingInfo = computed(() => this.profileData?.fundingInfo);

  businessReview = computed(() => this.profileData?.businessReview);

  managementTeam = computed(
    (): ManagementMember[] =>
      this.profileData?.managementGovernance?.managementTeam || []
  );

  boardOfDirectors = computed(
    (): BoardMember[] =>
      this.profileData?.managementGovernance?.boardOfDirectors || []
  );

  swotAnalysis = computed(() => this.profileData?.swotAnalysis);

  businessStrategy = computed(() => this.profileData?.businessPlan);

  financialAnalysis = computed(() => this.profileData?.financialAnalysis);

  setActiveTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  /**
   * Format currency with zero decimal places
   */
  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedAmount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  getFullAddress(): string | null {
    const addr = this.businessInfo()?.physicalAddress;
    if (!addr) return null;
    return `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`;
  }
}
