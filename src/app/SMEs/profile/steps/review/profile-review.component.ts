 
// src/app/profile/steps/review/profile-review.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, 
  CheckCircle, AlertCircle, Clock, Building, FileText, 
  BarChart3, Target, Users, TrendingUp, DollarSign, 
  Download, Edit, Eye, Sparkles, ArrowRight
} from 'lucide-angular';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components'; 
import { ProfileDataTransformerService } from '../../../services/profile-data-transformer.service';
import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';
 import { KapifyAIAnalysisComponent } from 'src/app/ai/ai-analysis/kapify-ai-analysis.component';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
 
interface SectionSummary {
  stepId: string;
  title: string;
  icon: any;
  completed: boolean;
  completionPercentage: number;
  keyData: { label: string; value: string; status?: 'complete' | 'incomplete' | 'warning' }[];
  missingItems: string[];
  lastUpdated?: Date;
}

interface ProfileOverview {
  companyName: string;
  industry: string;
  yearsInOperation: number;
  employeeCount: string;
  monthlyRevenue: string;
  requestedFunding: string;
  completionPercentage: number;
  readinessScore: number;
}

interface ProfileReadiness {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendations: string[];
  readinessScore: number;
}

@Component({
  selector: 'app-profile-review',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule, 
    UiCardComponent, 
    UiButtonComponent,
    KapifyAIAnalysisComponent
  ],
  templateUrl: './profile-review.component.html'
})
export class ProfileReviewComponent implements OnInit {
  private profileService = inject(FundingProfileSetupService);
  private stepCheckerService = inject(SMEProfileStepsService)
  private transformer = inject(ProfileDataTransformerService);
  private router = inject(Router);

  // Icons
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  ClockIcon = Clock;
  BuildingIcon = Building;
  FileTextIcon = FileText;
  BarChart3Icon = BarChart3;
  TargetIcon = Target;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  DownloadIcon = Download;
  EditIcon = Edit;
  EyeIcon = Eye;
  SparklesIcon = Sparkles;
  ArrowRightIcon = ArrowRight;

  // State
  isGeneratingReport = signal(false);
  showAIAnalysis = signal(false);
  
  // Computed data
  profileData = computed(() => this.stepCheckerService.data());
  completionSummary = computed(() => this.stepCheckerService.getCompletionSummary());
  // Derived data
  profileOverview = computed(() => this.buildProfileOverview());
  sectionSummaries = computed(() => this.buildSectionSummaries());
  readinessAssessment = computed(() => this.assessProfileReadiness());
  businessProfile = computed(() => this.transformer.transformToFundingProfile(this.profileData()));
  showSuccessMessage: any;
  showInfoMessage: any;


  ngOnInit() {
    // Mark review step as accessed
    const reviewStep = this.profileService.steps.find(step => step.id === 'review');
    if (reviewStep) {
      reviewStep.completed = true;
    }
  }

  // ===============================
  // DATA AGGREGATION METHODS
  // ===============================

  private buildProfileOverview(): ProfileOverview {
    const data = this.profileData();
    const completion = this.completionSummary();
    const readiness = this.assessProfileReadiness();
    
    return {
      companyName: data.businessInfo?.companyName || 'Not specified',
      industry: data.businessInfo?.industry || 'Not specified',
      yearsInOperation: data.businessInfo?.yearsInOperation || 0,
      employeeCount: data.businessInfo?.numberOfEmployees || 'Not specified',
      monthlyRevenue: data.financialInfo?.monthlyRevenue || 'Not specified',
      requestedFunding: data.fundingInfo?.amountRequired || 'Not specified',
      completionPercentage: completion.percentage,
      readinessScore: readiness.readinessScore
    };
  }

  private buildSectionSummaries(): SectionSummary[] {
    const data = this.profileData();
    const steps = this.profileService.steps.filter(step => step.id !== 'review');
    
    return steps.map(step => {
      switch (step.id) {
        case 'company-info':
          return this.buildCompanyInfoSummary(step, data);
        case 'documents':
          return this.buildDocumentsSummary(step, data);
        case 'business-assessment':
          return this.buildBusinessAssessmentSummary(step, data);
        case 'swot-analysis':
          return this.buildSwotAnalysisSummary(step, data);
        case 'management':
          return this.buildManagementSummary(step, data);
        case 'business-strategy':
          return this.buildBusinessStrategySummary(step, data);
        case 'financial-profile':
          return this.buildFinancialProfileSummary(step, data);
        default:
          return this.buildDefaultSummary(step);
      }
    });
  }

  private buildCompanyInfoSummary(step: any, data: any): SectionSummary {
    const businessInfo = data.businessInfo || {};
    const personalInfo = data.personalInfo || {};
    
    const keyData = [
      { 
        label: 'Company Name', 
        value: businessInfo.companyName || 'Not provided',
        status: (businessInfo.companyName ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Registration Number', 
        value: businessInfo.registrationNumber || 'Not provided',
        status: (businessInfo.registrationNumber ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Industry', 
        value: businessInfo.industry || 'Not provided',
        status: (businessInfo.industry ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Contact Person', 
        value: personalInfo.firstName ? `${personalInfo.firstName} ${personalInfo.lastName || ''}`.trim() : 'Not provided',
        status: (personalInfo.firstName ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!businessInfo.companyName) missingItems.push('Company name');
    if (!businessInfo.registrationNumber) missingItems.push('Registration number');
    if (!businessInfo.industry) missingItems.push('Industry type');
    if (!personalInfo.firstName) missingItems.push('Contact person details');

    return {
      stepId: step.id,
      title: step.title,
      icon: Building,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildDocumentsSummary(step: any, data: any): SectionSummary {
    const docs = data.supportingDocuments || data.documents || {};
    const docCount = Object.keys(docs).length;
    
    const keyData = [
      { 
        label: 'Total Documents', 
        value: `${docCount} uploaded`,
        status: (docCount > 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Company Registration', 
        value: docs.companyProfile || docs.cipDocument ? 'Uploaded' : 'Missing',
        status: (docs.companyProfile || docs.cipDocument ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Financial Statements', 
        value: docs.financialStatements ? 'Uploaded' : 'Missing',
        status: (docs.financialStatements ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!docs.companyProfile && !docs.cipDocument) missingItems.push('Company registration document');
    if (!docs.financialStatements) missingItems.push('Financial statements');
    if (!docs.taxPin && !docs.taxClearance) missingItems.push('Tax compliance documents');

    return {
      stepId: step.id,
      title: step.title,
      icon: FileText,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildBusinessAssessmentSummary(step: any, data: any): SectionSummary {
    const assessment = data.businessReview || {};
    
    const keyData = [
      { 
        label: 'Business Model', 
        value: assessment.businessModel ? 'Defined' : 'Not defined',
        status: (assessment.businessModel ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Target Markets', 
        value: assessment.targetMarkets?.length > 0 ? `${assessment.targetMarkets.length} markets` : 'Not specified',
        status: (assessment.targetMarkets?.length > 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Value Proposition', 
        value: assessment.valueProposition ? 'Defined' : 'Not defined',
        status: (assessment.valueProposition ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!assessment.businessModel) missingItems.push('Business model description');
    if (!assessment.targetMarkets || assessment.targetMarkets.length === 0) missingItems.push('Target market definition');
    if (!assessment.valueProposition) missingItems.push('Value proposition');

    return {
      stepId: step.id,
      title: step.title,
      icon: BarChart3,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildSwotAnalysisSummary(step: any, data: any): SectionSummary {
    const swot = data.swotAnalysis || { 
      strengths: [], 
      weaknesses: [], 
      opportunities: [], 
      threats: [] 
    };
    
    const keyData = [
      { 
        label: 'Strengths', 
        value: swot.strengths?.length > 0 ? `${swot.strengths.length} identified` : 'None listed',
        status: (swot.strengths?.length >= 2 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Weaknesses', 
        value: swot.weaknesses?.length > 0 ? `${swot.weaknesses.length} identified` : 'None listed',
        status: (swot.weaknesses?.length >= 2 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Opportunities', 
        value: swot.opportunities?.length > 0 ? `${swot.opportunities.length} identified` : 'None listed',
        status: (swot.opportunities?.length >= 2 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Threats', 
        value: swot.threats?.length > 0 ? `${swot.threats.length} identified` : 'None listed',
        status: (swot.threats?.length >= 2 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!swot.strengths || swot.strengths.length < 2) missingItems.push('At least 2 strengths');
    if (!swot.weaknesses || swot.weaknesses.length < 2) missingItems.push('At least 2 weaknesses');
    if (!swot.opportunities || swot.opportunities.length < 2) missingItems.push('At least 2 opportunities');
    if (!swot.threats || swot.threats.length < 2) missingItems.push('At least 2 threats');

    return {
      stepId: step.id,
      title: step.title,
      icon: Target,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildManagementSummary(step: any, data: any): SectionSummary {
    const management = data.managementGovernance || {};
    
    const keyData = [
      { 
        label: 'Management Team', 
        value: management.managementTeam?.length > 0 ? `${management.managementTeam.length} members` : 'Not defined',
        status: (management.managementTeam?.length > 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Board of Directors', 
        value: management.boardOfDirectors?.length > 0 ? `${management.boardOfDirectors.length} members` : 'Not defined',
        status: (management.boardOfDirectors?.length > 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!management.managementTeam || management.managementTeam.length === 0) {
      missingItems.push('Management team structure');
    }

    return {
      stepId: step.id,
      title: step.title,
      icon: Users,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildBusinessStrategySummary(step: any, data: any): SectionSummary {
    const strategy = data.businessPlan || {};
    
    const keyData = [
      { 
        label: 'Mission Statement', 
        value: strategy.missionStatement ? 'Defined' : 'Not defined',
        status: (strategy.missionStatement ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Strategic Objectives', 
        value: strategy.strategicObjectives?.length > 0 ? `${strategy.strategicObjectives.length} objectives` : 'Not defined',
        status: (strategy.strategicObjectives?.length > 0 ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Growth Strategy', 
        value: strategy.expansionPlans ? 'Defined' : 'Not defined',
        status: (strategy.expansionPlans ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!strategy.missionStatement) missingItems.push('Mission statement');
    if (!strategy.strategicObjectives || strategy.strategicObjectives.length === 0) {
      missingItems.push('Strategic objectives');
    }
    if (!strategy.expansionPlans) missingItems.push('Growth strategy');

    return {
      stepId: step.id,
      title: step.title,
      icon: TrendingUp,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildFinancialProfileSummary(step: any, data: any): SectionSummary {
    const financialInfo = data.financialInfo || {};
    const financialAnalysis = data.financialAnalysis || {};
    const fundingInfo = data.fundingInfo || { amountRequired: '', purposeOfFunding: '' };
    
    const keyData = [
      { 
        label: 'Monthly Revenue', 
        value: financialInfo.monthlyRevenue ? `R${financialInfo.monthlyRevenue}` : 'Not provided',
        status: (financialInfo.monthlyRevenue ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Financial Template', 
        value: financialAnalysis.uploadedFile ? 'Uploaded' : 'Not uploaded',
        status: (financialAnalysis.uploadedFile ? 'complete' : 'warning') as 'complete' | 'warning'
      },
      { 
        label: 'Funding Required', 
        value: fundingInfo.amountRequired ? `R${fundingInfo.amountRequired}` : 'Not specified',
        status: (fundingInfo.amountRequired ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      },
      { 
        label: 'Purpose of Funding', 
        value: fundingInfo.purposeOfFunding ? 'Specified' : 'Not specified',
        status: (fundingInfo.purposeOfFunding ? 'complete' : 'incomplete') as 'complete' | 'incomplete'
      }
    ];

    const missingItems = [];
    if (!financialInfo.monthlyRevenue) missingItems.push('Monthly revenue');
    if (!financialAnalysis.uploadedFile && !this.hasFinancialData(financialAnalysis)) {
      missingItems.push('Financial projections template');
    }
    if (!fundingInfo.amountRequired) missingItems.push('Funding amount required');
    if (!fundingInfo.purposeOfFunding) missingItems.push('Purpose of funding');

    return {
      stepId: step.id,
      title: step.title,
      icon: DollarSign,
      completed: step.completed,
      completionPercentage: this.calculateSectionCompletion(keyData),
      keyData,
      missingItems
    };
  }

  private buildDefaultSummary(step: any): SectionSummary {
    return {
      stepId: step.id,
      title: step.title,
      icon: Clock,
      completed: step.completed,
      completionPercentage: step.completed ? 100 : 0,
      keyData: [],
      missingItems: step.completed ? [] : ['Section not completed']
    };
  }

  // ===============================
  // CALCULATION METHODS
  // ===============================

  private calculateSectionCompletion(keyData: any[]): number {
    if (keyData.length === 0) return 0;
    const completeItems = keyData.filter(item => item.status === 'complete').length;
    return Math.round((completeItems / keyData.length) * 100);
  }


  
  private calculateReadinessScore(): number {
  const data = this.profileData();
  let score = 0;

  // Company information (20 points)
  if (data.businessInfo?.companyName) score += 5;
  if (data.businessInfo?.registrationNumber) score += 5;
  if (data.businessInfo?.industry) score += 5;
  if (data.personalInfo?.firstName) score += 5;

  // Documents (15 points) - Type cast to any to bypass TypeScript errors
  const docs = data.supportingDocuments || data.documents || {} as any;
  if (Object.keys(docs).length > 0) score += 5;
  if (docs.companyProfile || docs.cipDocument) score += 5;
  if (docs.financialStatements) score += 5;

  // Business assessment (15 points) - Type cast to any
  const assessment = data.businessReview || {} as any;
  if (assessment.businessModel) score += 5;
  if (assessment.targetMarkets?.length > 0) score += 5;
  if (assessment.valueProposition) score += 5;

  // SWOT analysis (10 points) - Type cast to any
  const swot = data.swotAnalysis || {} as any;
  if (swot.strengths?.length >= 2) score += 2.5;
  if (swot.weaknesses?.length >= 2) score += 2.5;
  if (swot.opportunities?.length >= 2) score += 2.5;
  if (swot.threats?.length >= 2) score += 2.5;

  // Management (10 points) - Type cast to any
  const management = data.managementGovernance || {} as any;
  if (management.managementTeam?.length > 0) score += 10;

  // Strategy (15 points) - Type cast to any
  const strategy = data.businessPlan || {} as any;
  if (strategy.missionStatement) score += 5;
  if (strategy.strategicObjectives?.length > 0) score += 5;
  if (strategy.expansionPlans) score += 5;

  // Financial (15 points) - Type cast to any
  const financial = data.financialInfo || {} as any;
  const fundingInfo = data.fundingInfo || {} as any;
  if (financial.monthlyRevenue) score += 5;
  if (fundingInfo.amountRequired) score += 5;
  if (fundingInfo.purposeOfFunding) score += 5;

  return Math.round((score / 100) * 100);
}

  private assessProfileReadiness(): ProfileReadiness {
    const score = this.calculateReadinessScore();
    const completion = this.completionSummary();

    if (score >= 90 && completion.isComplete) {
      return {
        level: 'excellent',
        message: 'Your business profile is comprehensive and ready for funding applications.',
        recommendations: [
          'Consider downloading a complete profile report',
          'You can now confidently apply to funding opportunities',
          'Keep your financial data updated regularly'
        ],
        readinessScore: score
      };
    } else if (score >= 70) {
      return {
        level: 'good',
        message: 'Your profile is well-developed but could benefit from some improvements.',
        recommendations: [
          'Complete any missing required sections',
          'Add more detail to strengthen your application',
          'Consider uploading additional supporting documents'
        ],
        readinessScore: score
      };
    } else if (score >= 50) {
      return {
        level: 'fair',
        message: 'Your profile needs significant improvements before applying for funding.',
        recommendations: [
          'Focus on completing all required sections first',
          'Develop a comprehensive business strategy',
          'Ensure all financial information is accurate and complete'
        ],
        readinessScore: score
      };
    } else {
      return {
        level: 'poor',
        message: 'Your profile requires substantial work before it will be ready for funding applications.',
        recommendations: [
          'Start with basic company information and documents',
          'Develop your business model and strategy',
          'Consider seeking business development assistance'
        ],
        readinessScore: score
      };
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private hasFinancialData(financialAnalysis: any): boolean {
    return financialAnalysis?.incomeStatement?.some((row: any) => 
      row.values?.some((val: number) => val !== 0)
    ) || financialAnalysis?.financialRatios?.some((row: any) => 
      row.values?.some((val: number) => val !== 0)
    );
  }

  getSectionIcon(stepId: string): any {
    const iconMap: { [key: string]: any } = {
      'company-info': Building,
      'documents': FileText,
      'business-assessment': BarChart3,
      'swot-analysis': Target,
      'management': Users,
      'business-strategy': TrendingUp,
      'financial-profile': DollarSign
    };
    return iconMap[stepId] || Clock;
  }

  getCompletionStatusClass(percentage: number): string {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  }

  getReadinessLevelClass(level: string): string {
    const classes = {
      'excellent': 'bg-green-100 text-green-800 border-green-200',
      'good': 'bg-blue-100 text-blue-800 border-blue-200',
      'fair': 'bg-orange-100 text-orange-800 border-orange-200',
      'poor': 'bg-red-100 text-red-800 border-red-200'
    };
    return classes[level as keyof typeof classes] || classes.poor;
  }

  // ===============================
  // ACTION METHODS
  // ===============================

  editSection(stepId: string) {
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile/steps', stepId]);
  }

  async saveProfile() {
    try {
      await this.profileService.saveCurrentProgress();
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }

  async generateReport() {
    this.isGeneratingReport.set(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create and download a comprehensive profile report
      const reportData = this.buildReportData();
      this.downloadReport(reportData);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      this.isGeneratingReport.set(false);
    }
  }

  private buildReportData(): any {
    const overview = this.profileOverview();
    const sections = this.sectionSummaries();
    const readiness = this.readinessAssessment();
    
    return {
      generatedAt: new Date().toISOString(),
      overview,
      sections,
      readiness,
      recommendations: readiness.recommendations,
      completionSummary: this.completionSummary()
    };
  }

  private downloadReport(reportData: any) {
    const content = this.formatReportAsText(reportData);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_profile_report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private formatReportAsText(data: any): string {
    const overview = data.overview;
    const sections = data.sections;
    const readiness = data.readiness;
    
    return `
BUSINESS PROFILE REPORT
Generated: ${new Date(data.generatedAt).toLocaleString()}

=======================
COMPANY OVERVIEW
=======================
Company Name: ${overview.companyName}
Industry: ${overview.industry}
Years in Operation: ${overview.yearsInOperation}
Employee Count: ${overview.employeeCount}
Monthly Revenue: ${overview.monthlyRevenue}
Requested Funding: ${overview.requestedFunding}
Profile Completion: ${overview.completionPercentage}%
Readiness Score: ${overview.readinessScore}/100

=======================
PROFILE READINESS ASSESSMENT
=======================
Level: ${readiness.level.toUpperCase()}
${readiness.message}

Recommendations:
${readiness.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

=======================
SECTION SUMMARIES
=======================
${sections.map((section: any) => `
${section.title.toUpperCase()}
Status: ${section.completed ? 'Complete' : 'Incomplete'} (${section.completionPercentage}%)

Key Information:
${section.keyData.map((item: any) => `- ${item.label}: ${item.value}`).join('\n')}

${section.missingItems.length > 0 ? `Missing Items:
${section.missingItems.map((item: string) => `- ${item}`).join('\n')}` : ''}
`).join('\n')}

=======================
COMPLETION SUMMARY
=======================
Total Steps: ${data.completionSummary.totalSteps}
Completed Steps: ${data.completionSummary.completedSteps}
Required Steps: ${data.completionSummary.requiredSteps}
Completed Required: ${data.completionSummary.completedRequired}
Overall Completion: ${data.completionSummary.percentage}%
Ready for Applications: ${data.completionSummary.isComplete ? 'Yes' : 'No'}

=======================
END OF REPORT
=======================
`;
  }

  toggleAIAnalysis() {
    this.showAIAnalysis.set(!this.showAIAnalysis());
  }

  startApplicationProcess() {
    // Navigate to funding opportunities or application process
    this.router.navigate(['/opportunities']);
  }

  // ===============================
  // DATA FORMATTING HELPERS
  // ===============================

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }

  formatCurrency(value: string): string {
    if (!value || value === 'Not specified' || value === 'Not provided') return value;
    
    // Clean the value and format as currency
    const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(numValue)) return value;
    
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  getCompletionBarWidth(percentage: number): string {
    return `${Math.max(percentage, 5)}%`; // Minimum 5% for visibility
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'complete': 'bg-green-100 text-green-800',
      'incomplete': 'bg-red-100 text-red-800', 
      'warning': 'bg-orange-100 text-orange-800'
    };
    return classes[status as keyof typeof classes] || classes.incomplete;
  }

  hasAnyMissingItems(): boolean {
    return this.sectionSummaries().some(section => section.missingItems.length > 0);
  }

  getTotalMissingItems(): number {
    return this.sectionSummaries().reduce((total, section) => total + section.missingItems.length, 0);
  }

  canStartApplications(): boolean {
    const completion = this.completionSummary();
    const readiness = this.readinessAssessment();
    
    return completion.isComplete && readiness.readinessScore >= 70;
  }

  getApplicationReadinessMessage(): string {
    const canStart = this.canStartApplications();
    const completion = this.completionSummary();
    const readiness = this.readinessAssessment();
    
    if (canStart) {
      return 'Your profile is ready for funding applications!';
    } else if (!completion.isComplete) {
      return 'Complete all required sections before applying for funding.';
    } else if (readiness.readinessScore < 70) {
      return 'Improve your profile quality before applying for funding.';
    } else {
      return 'Review and strengthen your profile before applying.';
    }
  }

  // Method for AI analysis component
  getCoverInformation(): any {
    const fundingInfo = this.profileData().fundingInfo || { 
  amountRequired: '', 
  purposeOfFunding: '', 
  timelineRequired: '' 
};
    
    return {
      requestedAmount: fundingInfo.amountRequired || '',
      purposeStatement: fundingInfo.purposeOfFunding || '',
      useOfFunds: fundingInfo.purposeOfFunding || '', // Could be more specific
      timeline: fundingInfo.timelineRequired || '',
      opportunityAlignment: ''  
    };
  }

  onAnalysisCompleted(result: any) {
  console.log('AI Analysis completed:', result);
  // Handle analysis results
}

onImprovementRequested() {
  // Navigate to first incomplete section or show improvement suggestions
  const incompleteSections = this.sectionSummaries().filter(s => !s.completed);
  if (incompleteSections.length > 0) {
    this.editSection(incompleteSections[0].stepId);
  }
}

// In your profile component
onProfileAnalysisCompleted(result: any) {
  console.log('Profile analysis completed:', result);
  
  // Optional: Show success message
  if (result.compatibilityScore >= 70) {
    this.showSuccessMessage('Your profile shows strong funding readiness!');
  } else {
    this.showInfoMessage('Consider completing the recommended improvements for better funding readiness.');
  }
}
}