// src/app/funder/application-details/components/application-metrics/application-metrics.component.ts
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
  Cpu,
} from 'lucide-angular';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import { BusinessAssessmentViewerComponent } from '../business-operations/business-operations.component';
import { FinancialAnalysisViewerComponent } from '../financial-analysis-viewer/financial-analysis-viewer.component';
import { BusinessInfoComponent } from '../business-info/business-info.component';
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
    BusinessAssessmentViewerComponent,
    BusinessInfoComponent,
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
  CpuIcon = Cpu;

  // Tab management
  activeTab = signal<string>('overview');

  tabs: Tab[] = [
    { id: 'overview', label: 'Request Summary', icon: Activity },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'financial', label: 'Financials', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Cpu },
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
  businessDescription = computed(
    () => this.profileData.businessInfo?.businessDescription || null
  );

  financialAnalysis = computed(
    () => this.profileData.financialAnalysis || null
  );

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
    console.log('[Application Data]', this.application);
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
      business.physicalAddress.street,
      business.physicalAddress.city,
      business.physicalAddress.province,
      business.physicalAddress.postalCode,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }
}
