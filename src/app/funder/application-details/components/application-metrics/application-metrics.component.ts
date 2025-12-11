// // src/app/funder/application-details/components/application-metrics/application-metrics.component.ts
// import { Component, Input, computed, effect, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   DollarSign,
//   Calendar,
//   Building,
//   TrendingUp,
//   User,
//   Mail,
//   Hash,
//   Phone,
//   MapPin,
//   CreditCard,
//   Briefcase,
//   Users,
//   Target,
//   FileText,
//   Activity,
//   Lightbulb,
//   ChartColumn,
//   CircleAlert,
//   TriangleAlert,
// } from 'lucide-angular';
// import { FundingApplication } from 'src/app/SMEs/models/application.models';
// import { FundingOpportunity } from '../../../create-opportunity/shared/funding.interfaces';
// import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
// import {
//   ManagementMember,
//   BoardMember,
// } from 'src/app/SMEs/applications/models/funding-application.models';
// import { FinancialAnalysisViewerComponent } from '../financial-analysis-viewer/financial-analysis-viewer.component';

// type TabId =
//   | 'overview'
//   | 'personal'
//   | 'business'
//   | 'financial'
//   | 'funding'
//   | 'management'
//   | 'swot'
//   | 'strategy';

// interface Tab {
//   id: TabId;
//   label: string;
//   icon: any;
// }

// @Component({
//   selector: 'app-application-metrics',
//   standalone: true,
//   imports: [
//     CommonModule,
//     LucideAngularModule,
//     FinancialAnalysisViewerComponent,
//   ],
//   templateUrl: './application-metrics.component.html',
//   styleUrls: ['./application-metrics.component.css'],
// })
// export class ApplicationMetricsComponent {
//   @Input() application!: FundingApplication;
//   @Input() opportunity!: FundingOpportunity;
//   @Input() profileData!: Partial<ProfileData>;

//   // Icons
//   DollarSignIcon = DollarSign;
//   CalendarIcon = Calendar;
//   BuildingIcon = Building;
//   TrendingUpIcon = TrendingUp;
//   UserIcon = User;
//   MailIcon = Mail;
//   HashIcon = Hash;
//   PhoneIcon = Phone;
//   MapPinIcon = MapPin;
//   CreditCardIcon = CreditCard;
//   BriefcaseIcon = Briefcase;
//   UsersIcon = Users;
//   TargetIcon = Target;
//   FileTextIcon = FileText;
//   ActivityIcon = Activity;
//   BarChart3Icon = ChartColumn;
//   LightbulbIcon = Lightbulb;
//   AlertCircleIcon = CircleAlert;
//   AlertTriangleIcon = TriangleAlert;

//   // Active tab state
//   activeTab = signal<TabId>('overview');

//   // Tab configuration
//   tabs: Tab[] = [
//     { id: 'overview', label: 'Request Summary', icon: this.ActivityIcon },
//     { id: 'business', label: 'Operations', icon: this.BuildingIcon },
//     { id: 'financial', label: 'Financials', icon: this.BarChart3Icon },
//     { id: 'management', label: 'Leadership', icon: this.UsersIcon },
//     { id: 'swot', label: 'SWOT', icon: this.LightbulbIcon },
//   ];
//   constructor() {
//     effect(() => {
//       console.log('Admin Info:', this.personalInfo());
//     });
//     effect(() => {
//       console.log('Business Review Info:', this.businessReview());
//     });
//   }
//   requestedAmount = computed(() => {
//     const formData = this.application?.formData as any;
//     const amount = formData?.requestedAmount;
//     if (typeof amount === 'number') return amount;
//     if (typeof amount === 'string') {
//       const parsed = parseFloat(amount);
//       return isNaN(parsed) ? null : parsed;
//     }
//     return null;
//   });
//   // Add after line 100 (after existing computed properties)

//   monthlyRevenueValue = computed(() => {
//     const value = this.financialInfo()?.monthlyRevenue;
//     return typeof value === 'number'
//       ? value
//       : parseFloat(String(value || 0)) || 0;
//   });

//   annualRevenueValue = computed(() => {
//     const value = this.financialInfo()?.annualRevenue;
//     return typeof value === 'number'
//       ? value
//       : parseFloat(String(value || 0)) || 0;
//   });
//   timeline = computed(() => {
//     const formData = this.application?.formData as any;
//     return formData?.timeline || null;
//   });

//   useOfFunds = computed(() => {
//     const formData = this.application?.formData as any;
//     return formData?.useOfFunds || null;
//   });

//   purposeStatement = computed(() => {
//     const formData = this.application?.formData as any;
//     return formData?.purposeStatement || this.application?.description || null;
//   });

//   // Profile-based computed properties
//   personalInfo = computed(() => this.profileData?.personalInfo);

//   businessInfo = computed(() => this.profileData?.businessInfo);

//   financialInfo = computed(() => this.profileData?.financialInfo);

//   fundingInfo = computed(() => this.profileData?.fundingInfo);

//   businessReview = computed(() => this.profileData?.businessReview);

//   managementTeam = computed(
//     (): ManagementMember[] =>
//       this.profileData?.managementGovernance?.managementTeam || []
//   );

//   boardOfDirectors = computed(
//     (): BoardMember[] =>
//       this.profileData?.managementGovernance?.boardOfDirectors || []
//   );

//   swotAnalysis = computed(() => this.profileData?.swotAnalysis);

//   businessStrategy = computed(() => this.profileData?.businessPlan);

//   financialAnalysis = computed(
//     () => this.profileData?.financialAnalysis || null
//   );

//   setActiveTab(tabId: TabId) {
//     this.activeTab.set(tabId);
//   }

//   /**
//    * Format currency with zero decimal places and commas
//    */
//   formatCurrency(amount: number, currency: string = 'ZAR'): string {
//     const roundedAmount = Math.round(amount);
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: currency,
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(roundedAmount);
//   }

//   /**
//    * Format number with zero decimal places and commas (no currency symbol)
//    */
//   formatNumber(value: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(Math.round(value));
//   }

//   formatDate(date: Date): string {
//     return new Intl.DateTimeFormat('en-ZA', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     }).format(date);
//   }

//   getFullAddress(): string | null {
//     const addr = this.businessInfo()?.physicalAddress;
//     if (!addr) return null;
//     return `${addr.street}, ${addr.city}, ${addr.province} ${addr.postalCode}`;
//   }
// }
// src/app/funder/application-details/components/application-metrics/application-metrics.component.ts - UPDATED
import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText,
  DollarSign,
  Calendar,
  Target,
  User,
  Briefcase,
  Mail,
  Phone,
  Hash,
  Building,
  MapPin,
  Users,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  Activity,
  Cpu, // NEW
} from 'lucide-angular';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import { BusinessAssessmentViewerComponent } from '../business-operations/business-operations.component';
import { FinancialAnalysisViewerComponent } from '../financial-analysis-viewer/financial-analysis-viewer.component';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

interface Tab {
  id: string;
  label: string;
  icon: any;
}

@Component({
  selector: 'app-application-metrics',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FinancialAnalysisViewerComponent,
    BusinessAssessmentViewerComponent, // NEW
  ],
  templateUrl: './application-metrics.component.html',
})
export class ApplicationMetricsComponent implements OnInit {
  @Input({ required: true }) application!: FundingApplication;
  @Input({ required: true }) opportunity!: FundingOpportunity;
  @Input({ required: true }) profileData!: Partial<ProfileData>;

  // Icons
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  TargetIcon = Target;
  UserIcon = User;
  BriefcaseIcon = Briefcase;
  MailIcon = Mail;
  PhoneIcon = Phone;
  HashIcon = Hash;
  BuildingIcon = Building;
  MapPinIcon = MapPin;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  LightbulbIcon = Lightbulb;
  AlertCircleIcon = AlertCircle;
  AlertTriangleIcon = AlertTriangle;
  ActivityIcon = Activity;
  CpuIcon = Cpu; // NEW

  // Tab management
  activeTab = signal<string>('overview');

  tabs: Tab[] = [
    { id: 'overview', label: 'Request Summary', icon: Activity },
    { id: 'personal', label: 'Key Person', icon: User },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'financial', label: 'Financials', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Cpu }, // NEW
    { id: 'funding', label: 'Funding', icon: Target },
    { id: 'management', label: 'Leadership', icon: Users },
    { id: 'swot', label: 'SWOT', icon: TrendingUp },
  ];

  // Computed properties
  requestedAmount = computed(() => {
    const formData = this.application.formData as any;
    return formData?.requestedAmount || null;
  });

  timeline = computed(() => {
    const formData = this.application.formData as any;
    return formData?.timeline || null;
  });

  purposeStatement = computed(() => {
    const formData = this.application.formData as any;
    return formData?.purposeStatement || this.application.description || null;
  });

  useOfFunds = computed(() => {
    const formData = this.application.formData as any;
    return formData?.useOfFunds || null;
  });

  personalInfo = computed(() => this.profileData.personalInfo || null);
  businessInfo = computed(() => this.profileData.businessInfo || null);
  financialAnalysis = computed(
    () => this.profileData.financialAnalysis || null
  );

  // ✅ FIXED: Access nested properties correctly
  businessAssessment = computed(() => this.profileData.businessReview || null);
  fundingInfo = computed(() => this.profileData.fundingInfo || null);

  managementTeam = computed(
    () => this.profileData.managementGovernance?.managementTeam || []
  );

  boardOfDirectors = computed(
    () => this.profileData.managementGovernance?.boardOfDirectors || []
  );

  swotAnalysis = computed(() => this.profileData.swotAnalysis || null);

  ngOnInit() {
    console.log('📊 [METRICS] Profile Data:', this.profileData);
    console.log('📊 [METRICS] Business Assessment:', this.businessAssessment());
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getFullAddress(): string | null {
    const business = this.businessInfo();
    if (!business) return null;

    const parts = [
      business.physicalAddress,
      // business.city,
      // business.province,
      // business.postalCode,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }
}
