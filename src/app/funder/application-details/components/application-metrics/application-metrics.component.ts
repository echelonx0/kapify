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
import { FundingApplication } from 'src/app/fund-seeking-orgs/models/application.models';
import { BusinessAssessmentViewerComponent } from '../business-operations/business-operations.component';
import { FinancialAnalysisViewerComponent } from '../financial-analysis-viewer/financial-analysis-viewer.component';
import { BusinessInfoComponent } from '../business-info/business-info.component';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { FundingApplicationProfile } from 'src/app/fund-seeking-orgs/applications/models/funding-application.models';

import { Subject } from 'rxjs';
import { ProfileData } from 'src/app/profiles/SME-Profiles/models/funding.models';
import {
  FinancialDataTableComponent,
  FinancialTableSection,
} from 'src/app/profiles/SME-Profiles/steps/financial-analysis/financial-table/financial-data-table.component';
import { FinancialRatioData } from 'src/app/profiles/SME-Profiles/steps/financial-analysis/utils/excel-parser.service';
import { FinancialDataTransformer } from 'src/app/profiles/SME-Profiles/steps/financial-analysis/utils/financial-data.transformer';

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
    FinancialDataTableComponent,
  ],
  templateUrl: './application-metrics.component.html',
})
export class ApplicationMetricsComponent implements OnInit {
  @Input({ required: true }) application!: FundingApplication;
  @Input({ required: true }) opportunity!: FundingOpportunity;
  @Input({ required: true }) profileData!: Partial<ProfileData>;
  @Input({ required: true })
  rawProfileData!: Partial<FundingApplicationProfile>;
  private dataChangeSubject = new Subject<void>();
  columnHeaders = signal<string[]>([]);
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
  financialRatiosData = signal<FinancialRatioData[]>([]);
  tabs: Tab[] = [
    { id: 'overview', label: 'Request Summary', icon: Activity },
    { id: 'business', label: 'Business', icon: Building },
    { id: 'financial', label: 'Financials', icon: DollarSign },
    { id: 'operations', label: 'Operations', icon: Cpu },
    { id: 'swot', label: 'SWOT', icon: TrendingUp },
  ];

  // Computed properties

  // application-metrics.component.ts
  companyCompliance = computed(() => this.rawProfileData.companyInfo || null);

  requestedAmount = computed(() => {
    const formData = this.application.formData as any;
    return formData?.requestedAmount || null;
  });

  timeline = computed(() => {
    const formData = this.application.formData as any;
    return formData?.timeline || null;
  });

  fundingType = computed(() => {
    const formData = this.profileData.businessPlan as any;

    return formData?.fundingRequirements.fundingType || null;
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
    () => this.rawProfileData.companyInfo?.ownership || []
  );

  swotAnalysis = computed(() => this.profileData.swotAnalysis || null);

  ngOnInit() {
    // console.log(
    //   '[METRICS] Business Management:',
    //   this.rawProfileData.companyInfo
    // );
  }

  financialRatiosSections = computed(() => {
    const incomeRatios = this.financialRatiosData().filter((r) =>
      [
        'Sales Growth',
        'Gross profit margin',
        'Cost to Income ratio',
        'Operating margin (EBITDA)',
        'Interest Cover Ratio',
        'Net Operating Profit Margin',
      ].some((label) => r.label.toLowerCase().includes(label.toLowerCase()))
    );

    const balanceRatios = this.financialRatiosData().filter((r) =>
      [
        'Return on Equity',
        'Return on Assets',
        'Current Ratio',
        'Acid Test Ratio',
        'Debt Equity Ratio',
        'Debtors Days',
        'Creditors Days',
        'Equity Investment Value',
        'Return on Investment',
      ].some((label) => r.label.toLowerCase().includes(label.toLowerCase()))
    );

    return FinancialDataTransformer.transformFinancialRatios(
      incomeRatios, // ✅ INCOME RATIOS AT TOP
      balanceRatios // ✅ BALANCE RATIOS AT BOTTOM WITH SPACING
    );
  });

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

  onFinancialRatiosCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    const sections = this.financialRatiosSections();
    const flatIndex = this.getFlatIndex(
      sections,
      event.sectionIndex,
      event.rowIndex
    );

    this.financialRatiosData.update((data) => {
      const newData = [...data];
      if (flatIndex >= 0 && flatIndex < newData.length) {
        newData[flatIndex] = {
          ...newData[flatIndex],
          values: [...newData[flatIndex].values],
        };
        newData[flatIndex].values[event.colIndex] = event.value;
      }
      return newData;
    });

    this.triggerDataChange();
  }

  // ===============================
  // INDEX MAPPING HELPERS
  // ===============================

  private getFlatIndex(
    sections: FinancialTableSection[],
    sectionIndex: number,
    rowIndex: number
  ): number {
    let flatIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      flatIndex += sections[i]?.rows.length || 0;
    }
    return flatIndex + rowIndex;
  }

  private triggerDataChange() {
    this.dataChangeSubject.next();
  }
}
