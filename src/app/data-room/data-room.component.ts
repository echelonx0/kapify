// src/app/SMEs/data-room/data-room.component.ts 
import { Component, OnInit, signal, computed, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, 
  Building, TrendingUp, FileText, Users, Target, DollarSign,
  BarChart3, Shield, Download, Eye, AlertCircle,
  CheckCircle, Clock, Sparkles, Globe, Lock, Star, ArrowUpRight,
  PieChart, Calculator
} from 'lucide-angular';
import { UiCardComponent, UiButtonComponent } from 'src/app/shared/components';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { SupabaseDocumentService } from 'src/app/shared/services/supabase-document.service';
 
import { UserType } from 'src/app/shared/models/user.models';
import { AuthService } from 'src/app/auth/production.auth.service';
import { FundingProfileBackendService } from '../SMEs/services/funding-profile-backend.service';
 
interface DataRoomSection {
  id: string;
  title: string;
  icon: any;
  status: 'complete' | 'pending' | 'missing';
  description: string;
}

interface MarketIntelligence {
  marketSize: string;
  sectorGrowth: number;
  competitivePosition: string;
  trends: string[];
  valuationRange: string;
  roiProjection: string;
  paybackPeriod: string;
  riskLevel: string;
  keyStrengths: string[];
}

interface FinancialMetrics {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  projectedGrowth: number;
  ebitda: number;
  currentAssets: number;
}

@Component({
  selector: 'app-data-room',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent
  ],
  templateUrl: './data-room.component.html',
  styleUrls: ['./data-room.component.css']
})
export class DataRoomComponent implements OnInit {
  @Input() applicantId?: string; // For funder viewing applicant's data room
  @Input() applicationId?: string; // For specific application context

  private profileService = inject(FundingProfileBackendService);
  private documentService = inject(SupabaseDocumentService);
  private supabase = inject(SharedSupabaseService);
   private authService = inject(AuthService);
  // Icons
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;
  UsersIcon = Users;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  BarChart3Icon = BarChart3;
  ShieldIcon = Shield;
  DownloadIcon = Download;
  EyeIcon = Eye;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  SparklesIcon = Sparkles;
  LockIcon = Lock;
  StarIcon = Star;
  GlobeIcon = Globe;
  ArrowUpRightIcon = ArrowUpRight;
  PieChartIcon = PieChart;
  CalculatorIcon = Calculator;
  AlertCircleIcon = AlertCircle;

  // State
  activeSection = signal<string>('executive');
  isLoading = signal<boolean>(false);
  isAIAnalyzing = signal<boolean>(false);
  error = signal<string | null>(null);

  // Data
  profileData = signal<any>(null);
  documentsData = signal<Map<string, any>>(new Map());
  marketIntelligence = signal<MarketIntelligence | null>(null);
  accessLogs = signal<any[]>([]);

   // User context
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType);
  isFunder = computed(() => this.userType() === 'funder');
  isSME = computed(() => this.userType() === 'sme');
  // Add this computed property to your ApplicationsHomeComponent class
safeUserType = computed((): UserType => {
  const type = this.userType();
  return type === 'funder' ? 'funder' : 'sme';
});

  // Computed properties
  sections = computed<DataRoomSection[]>(() => [
    { 
      id: 'executive', 
      title: 'Executive Summary', 
      icon: Target, 
      status: this.getProfileCompletionStatus(),
      description: 'Company overview and investment thesis'
    },
    { 
      id: 'financials', 
      title: 'Financial Dashboard', 
      icon: BarChart3, 
      status: this.getFinancialDataStatus(),
      description: 'Financial performance and projections'
    },
    { 
      id: 'documents', 
      title: 'Document Repository', 
      icon: FileText, 
      status: this.getDocumentStatus(),
      description: 'Legal and compliance documents'
    },
    { 
      id: 'management', 
      title: 'Management Team', 
      icon: Users, 
      status: this.getManagementDataStatus(),
      description: 'Leadership team and governance'
    },
    { 
      id: 'market', 
      title: 'Market Analysis', 
      icon: TrendingUp, 
      status: this.marketIntelligence() ? 'complete' : 'pending',
      description: 'AI-powered market intelligence'
    },
    { 
      id: 'legal', 
      title: 'Legal & Compliance', 
      icon: Shield, 
      status: this.getLegalComplianceStatus(),
      description: 'Regulatory compliance status'
    }
  ]);

  companyInfo = computed(() => {
    const profile = this.profileData();
    if (!profile) return null;
    
    return {
      companyName: profile.businessInfo?.companyName || profile.companyInfo?.companyName || 'Company Name',
      registrationNumber: profile.businessInfo?.registrationNumber || profile.companyInfo?.registrationNumber || 'N/A',
      industry: profile.businessInfo?.industry || profile.companyInfo?.industry || 'Technology',
      yearsInOperation: profile.businessInfo?.yearsInOperation || 5,
      description: profile.businessInfo?.companyDescription || profile.companyInfo?.description || 'Business description not available'
    };
  });

  financialMetrics = computed<FinancialMetrics | null>(() => {
    const profile = this.profileData();
    if (!profile?.financialInfo && !profile?.financialProfile) return null;
    
    const financial = profile.financialInfo || profile.financialProfile;
    const monthlyRevenue = financial.monthlyRevenue || 0;
    
    return {
      monthlyRevenue,
      annualRevenue: monthlyRevenue * 12,
      monthlyExpenses: financial.monthlyExpenses || financial.monthlyCosts || 0,
      profitMargin: financial.profitMargin || 20,
      projectedGrowth: financial.projectedGrowth || 25,
      ebitda: financial.ebitda || 0,
      currentAssets: financial.currentAssets || 0
    };
  });

  fundingInfo = computed(() => {
    const profile = this.profileData();
    if (!profile?.fundingInfo) return null;
    
    return {
      amountRequired: profile.fundingInfo.amountRequired || 0,
      purposeOfFunding: profile.fundingInfo.purposeOfFunding || '',
      useOfFunds: profile.fundingInfo.useOfFunds || {
        expansion: 60,
        productDevelopment: 25,
        workingCapital: 15
      }
    };
  });

  ngOnInit() {
    this.loadDataRoomData();
    this.trackDataRoomAccess();

  }

  // ===============================
  // TEMPLATE HELPER METHODS
  // ===============================

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  formatDocumentKey(key: string): string {
    // Fixed: Replace regex with simple string transformation
    return key.replace(/([A-Z])/g, ' $1').trim();
  }

  formatUploadDate(dateValue: string | Date | null): string {
    if (!dateValue) return 'N/A';
    try {
      return new Date(dateValue).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  }

  getTrendSlice(trends: string[]): string[] {
    return trends.slice(0, 2);
  }

  getManagementTeam(): any[] {
    const profile = this.profileData();
    if (!profile) return [];
    
    return profile.managementGovernance?.managementTeam || 
           profile.managementStructure?.executiveTeam || [];
  }

  getFullName(member: any): string {
    return member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim();
  }

  getInitials(member: any): string {
    const fullName = this.getFullName(member);
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getMonthlyProfit(): number {
    const metrics = this.financialMetrics();
    if (!metrics) return 0;
    return metrics.monthlyRevenue - metrics.monthlyExpenses;
  }

  getProjectedRevenue(year: number): number {
    const metrics = this.financialMetrics();
    if (!metrics) return 0;
    const multiplier = year === 1 ? 1.2 : year === 2 ? 1.35 : 1.8;
    return metrics.annualRevenue * multiplier;
  }

  getProjectedGrossProfit(year: number): number {
    const metrics = this.financialMetrics();
    if (!metrics) return 0;
    const multiplier = year === 1 ? 0.7 : year === 2 ? 0.75 : 0.8;
    return metrics.annualRevenue * multiplier;
  }

  getProjectedEBITDA(year: number): number {
    const metrics = this.financialMetrics();
    if (!metrics) return 0;
    const multiplier = year === 1 ? 0.2 : year === 2 ? 0.25 : 0.3;
    return metrics.annualRevenue * multiplier;
  }

  // ===============================
  // DATA LOADING METHODS
  // ===============================

  private async loadDataRoomData() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await Promise.all([
        this.loadProfileData(),
        this.loadDocuments(),
        this.loadMarketIntelligence()
      ]);
    } catch (error) {
      console.error('Failed to load data room data:', error);
      this.error.set('Failed to load data room information');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadProfileData() {
    try {
      let profileData;
      
      if (this.applicantId) {
        // Funder viewing applicant's profile
        profileData = await this.profileService.loadSavedProfileForUser(this.applicantId).toPromise();
      } else {
        // SME viewing their own profile
        profileData = await this.profileService.loadSavedProfile().toPromise();
      }
      
      this.profileData.set(profileData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      throw error;
    }
  }

  private async loadDocuments() {
    try {
      const documents = await this.documentService.getDocumentsByUser(this.applicationId).toPromise();
      this.documentsData.set(documents || new Map());
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Continue without documents
    }
  }

  private async loadMarketIntelligence() {
    try {
      // Check if we have cached AI analysis
      if (this.applicationId) {
        const { data } = await this.supabase
          .from('ai_analysis_results')
          .select('*')
          .eq('application_id', this.applicationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.analysis_result) {
          this.setMarketIntelligenceFromAI(data.analysis_result);
        }
      }
    } catch (error) {
      console.warn('No cached market intelligence found');
      // Continue without market intelligence
    }
  }

  // ===============================
  // AI ENHANCEMENT METHODS
  // ===============================

  async enhanceWithAI() {
    this.isAIAnalyzing.set(true);
    this.error.set(null);

    try {
      const profile = this.profileData();
      if (!profile) {
        throw new Error('Profile data not available');
      }

      const response = await fetch('/functions/v1/analyze-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          analysisMode: 'market_intelligence',
          businessProfile: profile,
          applicationData: {
            requestedAmount: this.fundingInfo()?.amountRequired || 0,
            purposeStatement: this.fundingInfo()?.purposeOfFunding || '',
            useOfFunds: this.fundingInfo()?.useOfFunds || {}
          },
          backgroundMode: false,
          enhancedInsights: true
        })
      });

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.statusText}`);
      }

      const aiResult = await response.json();
      this.setMarketIntelligenceFromAI(aiResult);

      // Store result for future use
      if (this.applicationId) {
        await this.storeMarketIntelligence(aiResult);
      }

    } catch (error) {
      console.error('AI Enhancement failed:', error);
      this.error.set('Failed to enhance with AI insights');
    } finally {
      this.isAIAnalyzing.set(false);
    }
  }

  private setMarketIntelligenceFromAI(aiResult: any) {
    const intelligence: MarketIntelligence = {
      marketSize: aiResult.marketIntelligence?.marketSize || '$2.4B addressable market',
      sectorGrowth: aiResult.marketIntelligence?.sectorGrowth || 28,
      competitivePosition: aiResult.competitivePositioning || 'Strong market position',
      trends: aiResult.marketIntelligence?.sectorTrends || [
        'Digital transformation accelerating',
        'Regulatory environment favorable',
        'Strong market demand growth'
      ],
      valuationRange: aiResult.marketIntelligence?.valuationRange || '$25M - $35M',
      roiProjection: aiResult.investmentMetrics?.roiProjection || '3.2x over 5 years',
      paybackPeriod: aiResult.investmentMetrics?.paybackPeriod || '18 months',
      riskLevel: aiResult.riskLevel || 'Medium',
      keyStrengths: aiResult.strengths || []
    };

    this.marketIntelligence.set(intelligence);
  }

  private async storeMarketIntelligence(aiResult: any) {
    try {
      await this.supabase
        .from('ai_analysis_results')
        .upsert({
          application_id: this.applicationId,
          analysis_result: aiResult,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    } catch (error) {
      console.warn('Failed to store market intelligence:', error);
    }
  }

  // ===============================
  // STATUS CALCULATION METHODS
  // ===============================

  private getProfileCompletionStatus(): 'complete' | 'pending' | 'missing' {
    const profile = this.profileData();
    if (!profile) return 'missing';
    
    const hasBasicInfo = profile.businessInfo || profile.companyInfo;
    const hasFinancialInfo = profile.financialInfo || profile.financialProfile;
    
    if (hasBasicInfo && hasFinancialInfo) return 'complete';
    if (hasBasicInfo || hasFinancialInfo) return 'pending';
    return 'missing';
  }

  private getFinancialDataStatus(): 'complete' | 'pending' | 'missing' {
    const financial = this.financialMetrics();
    if (!financial) return 'missing';
    
    if (financial.monthlyRevenue > 0 && financial.monthlyExpenses > 0) return 'complete';
    if (financial.monthlyRevenue > 0 || financial.monthlyExpenses > 0) return 'pending';
    return 'missing';
  }

  private getDocumentStatus(): 'complete' | 'pending' | 'missing' {
    const docs = this.documentsData();
    if (docs.size === 0) return 'missing';
    
    const verifiedDocs = Array.from(docs.values()).filter(doc => doc.status === 'verified');
    const totalDocs = docs.size;
    
    if (verifiedDocs.length === totalDocs) return 'complete';
    if (verifiedDocs.length > 0) return 'pending';
    return 'missing';
  }

  private getManagementDataStatus(): 'complete' | 'pending' | 'missing' {
    const profile = this.profileData();
    if (!profile) return 'missing';
    
    const mgmt = profile.managementGovernance || profile.managementStructure;
    if (mgmt?.managementTeam?.length > 0) return 'complete';
    if (mgmt?.boardOfDirectors?.length > 0) return 'pending';
    return 'missing';
  }

  private getLegalComplianceStatus(): 'complete' | 'pending' | 'missing' {
    const docs = this.documentsData();
    const requiredDocs = ['companyRegistration', 'taxClearance', 'companyProfile'];
    
    const hasRequiredDocs = requiredDocs.some(docType => 
      Array.from(docs.keys()).includes(docType)
    );
    
    return hasRequiredDocs ? 'complete' : 'missing';
  }

  // ===============================
  // ACCESS TRACKING
  // ===============================

  private async trackDataRoomAccess() {
    try {
      const accessLog = {
        applicant_id: this.applicantId,
        application_id: this.applicationId,
        accessed_at: new Date().toISOString(),
        access_type: 'data_room_view',
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      await this.supabase
        .from('access_logs')
        .insert(accessLog);
    } catch (error) {
      console.warn('Failed to track access:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  setActiveSection(sectionId: string) {
    this.activeSection.set(sectionId);
  }

  // ===============================
  // DOCUMENT METHODS
  // ===============================

  async downloadDocument(documentKey: string) {
    try {
      await this.documentService.downloadDocumentByKey(documentKey).toPromise();
    } catch (error) {
      console.error('Failed to download document:', error);
      this.error.set('Failed to download document');
    }
  }

  async viewDocument(documentKey: string) {
    // Implementation for document viewing
    console.log('Viewing document:', documentKey);
  }

  // ===============================
  // EXPORT METHODS
  // ===============================

  async exportDataRoom() {
    try {
      const reportData = {
        companyInfo: this.companyInfo(),
        financialMetrics: this.financialMetrics(),
        fundingInfo: this.fundingInfo(),
        marketIntelligence: this.marketIntelligence(),
        documents: Array.from(this.documentsData().entries()),
        generatedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-room-${this.companyInfo()?.companyName || 'export'}-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data room:', error);
      this.error.set('Failed to export data room');
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getStatusColor(status: 'complete' | 'pending' | 'missing'): string {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'missing': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusIcon(status: 'complete' | 'pending' | 'missing'): any {
    switch (status) {
      case 'complete': return CheckCircle;
      case 'pending': return Clock;
      case 'missing': return AlertCircle;
      default: return Clock;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R${(value / 1000).toFixed(0)}K`;
    }
    return `R${value}`;
  }
}