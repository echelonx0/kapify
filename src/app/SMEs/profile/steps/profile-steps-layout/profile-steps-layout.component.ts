// import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
// import { Router, RouterOutlet } from '@angular/router';
// import { LucideAngularModule, ArrowLeft, Check, Building, FileText, BarChart3, Target, Users, TrendingUp, DollarSign, Home, Clock, AlertCircle, CheckCircle, Menu, X, Eye } from 'lucide-angular';
// import { UiButtonComponent } from '../../../../shared/components';
// import { CommonModule } from '@angular/common';
// import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';
// import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
// import { ProfileStepsSidebarComponent, StepConfig, SectionData } from './profile-steps-sidebar.component';
 
// @Component({
//   selector: 'app-profile-steps-layout',
//   standalone: true,
//   imports: [
//     RouterOutlet, 
//     LucideAngularModule, 
//     UiButtonComponent, 
//     CommonModule,
//     ProfileStepsSidebarComponent
//   ],
//   templateUrl: 'profile-steps-layout.component.html',
//   styles: [`
//     .line-clamp-2 {
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//     }
    
//     nav::-webkit-scrollbar {
//       width: 4px;
//     }
    
//     nav::-webkit-scrollbar-track {
//       background: transparent;
//     }
    
//     nav::-webkit-scrollbar-thumb {
//       background: #d1d5db;
//       border-radius: 2px;
//     }
    
//     nav::-webkit-scrollbar-thumb:hover {
//       background: #9ca3af;
//     }

//     .transition-all {
//       transition-property: all;
//       transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
//       transition-duration: 200ms;
//     }

//     button:hover:not(:disabled) {
//       transform: translateY(-1px);
//     }

//     button:active:not(:disabled) {
//       transform: translateY(0);
//     }

//     @media (max-width: 1023px) {
//       .sticky {
//         position: -webkit-sticky;
//         position: sticky;
//       }
//     }
//   `]
// })
// export class ProfileStepsLayoutComponent implements OnInit {
//   private router = inject(Router);
//   public profileService = inject(FundingProfileSetupService);
//   private stepCheckerService = inject(SMEProfileStepsService)
  
//   // State
//   isSaving = signal(false);
//   isSubmitting = signal(false);
//   lastSaved = signal<Date | null>(null);
//   showMobileNav = signal(false);
//   isMobile = signal(false);
  
//   // Icons
//   CheckIcon = Check;
//   ArrowLeftIcon = ArrowLeft;
//   HomeIcon = Home;
//   ClockIcon = Clock;
//   AlertCircleIcon = AlertCircle;
//   CheckCircleIcon = CheckCircle;
//   MenuIcon = Menu;
//   XIcon = X;

//   // Step Configuration 
//   private stepInfo: StepConfig[] = [
//     {
//       id: 'company-info',
//       title: 'Company Information',
//       shortTitle: 'Company Info',
//       description: 'Basic company details, registration, and legal structure',
//       icon: Building,
//       estimatedTime: '10 min',
//       priority: 'high' as const
//     },
//     { 
//       id: 'documents',
//       title: 'Supporting Documents',
//       shortTitle: 'Documents',
//       description: 'Upload required business and financial documents',
//       icon: FileText,
//       estimatedTime: '15 min',
//       priority: 'high' as const,
//       dependencies: ['company-info']
//     },
//     {
//       id: 'business-assessment',
//       title: 'Business Assessment',
//       shortTitle: 'Business Review',
//       description: 'Operations, market position, and competitive landscape',
//       icon: BarChart3,
//       estimatedTime: '20 min',
//       priority: 'high' as const,
//       dependencies: ['company-info']
//     },
//     {
//       id: 'swot-analysis',
//       title: 'Strategic Analysis',
//       shortTitle: 'SWOT Analysis',
//       description: 'Strengths, weaknesses, opportunities, and threats',
//       icon: Target,
//       estimatedTime: '15 min',
//       priority: 'medium' as const,
//       dependencies: ['business-assessment']
//     },
//     {
//       id: 'management',
//       title: 'Leadership & Governance',
//       shortTitle: 'Management',
//       description: 'Key personnel and governance structures',
//       icon: Users,
//       estimatedTime: '12 min',
//       priority: 'high' as const,
//       dependencies: ['company-info']
//     },
//     {
//       id: 'business-strategy',
//       title: 'Business Strategy',
//       shortTitle: 'Strategy',
//       description: 'Strategic planning, market analysis, and growth plans',
//       icon: TrendingUp,
//       estimatedTime: '25 min',
//       priority: 'medium' as const,
//       dependencies: ['swot-analysis']
//     },
//     {
//       id: 'financial-profile',
//       title: 'Financial Profile',
//       shortTitle: 'Financials',
//       description: 'Financial statements, projections, and metrics',
//       icon: DollarSign,
//       estimatedTime: '18 min',
//       priority: 'high' as const,
//       dependencies: ['documents']
//     },
   
//   ];

//   @HostListener('window:resize', ['$event'])
//   onResize(event: any) {
//     this.checkMobile();
//   }

//   ngOnInit() {
//     this.checkMobile();
//   }

//   private checkMobile() {
//     this.isMobile.set(window.innerWidth < 1024);
//     if (!this.isMobile()) {
//       this.showMobileNav.set(false);
//     }
//   }

//   // ===============================
//   // MOBILE NAVIGATION
//   // ===============================

//   toggleMobileNav() {
//     this.showMobileNav.update(show => !show);
//   }

//   closeMobileNav() {
//     this.showMobileNav.set(false);
//   }

//   goToStepAndCloseMobile(stepId: string) {
//     this.goToStep(stepId);
//     this.closeMobileNav();
//   }

//   getMobileStepCardClasses(step: any, index: number): string {
//     const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
//     const profileStep = this.getProfileStep(step.id);
    
//     if (profileStep?.completed) {
//       return `${baseClasses} border-green-200 bg-green-50`;
//     } else if (this.isCurrentStep(step.id)) {
//       return `${baseClasses} border-primary-300 bg-primary-50 shadow-sm`;
//     } else if (this.canAccessStep(step, index)) {
//       return `${baseClasses} border-neutral-200 bg-white`;
//     } else {
//       return `${baseClasses} border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed`;
//     }
//   }

//   // ===============================
//   // STEP INFORMATION & NAVIGATION  
//   // ===============================

//   getStepInfo() {
//     return this.stepInfo;
//   }

//   // ← WRAPPER METHODS FOR SIDEBAR (templates can't use arrow functions with type annotations)
//   getCanAccessStepFn() {
//     return (stepId: string) => this.canAccessStep({ id: stepId }, 0);
//   }

//   getGetSectionDataFn() {
//     return (stepId: string) => this.getSectionData(stepId);
//   }

//   getProfileStep(stepId: string) {
//     return this.profileService.steps.find(step => step.id === stepId);
//   }

//   // ← NEW: Get section data for sidebar component
//   getSectionData(stepId: string): SectionData | null {
//     const step = this.getProfileStep(stepId);
//     if (!step) return null;

//     // Calculate missing fields based on step data
//     const missingFields = this.getMissingFieldsForStep(stepId);

//     return {
//       stepId,
//       completionPercentage: step.completed ? 100 : this.calculateCompletionPercentage(stepId),
//       missingFields,
//       isRequired: step.required ?? false,
//       isComplete: step.completed ?? false
//     };
//   }

//   // ← NEW: Calculate completion percentage for incomplete steps
//   private calculateCompletionPercentage(stepId: string): number {
//     const data = this.profileService.data();
    
//     switch (stepId) {
//       case 'company-info':
//         return this.calculateFieldCompletion(data.companyInfo, [
//           'companyName', 'registrationNumber', 'industryType', 'businessActivity',
//           'businessStage', 'bbbeeLevel', 'cipcReturns', 'incomeTaxNumber', 'workmansCompensation'
//         ]);
//       case 'documents':
//         return this.calculateFieldCompletion(data.supportingDocuments, [
//           'companyRegistration', 'taxClearanceCertificate', 'auditedFinancials'
//         ]);
//       case 'business-assessment':
//         return this.calculateFieldCompletion(data.businessAssessment, [
//           'businessModel', 'valueProposition', 'targetMarkets'
//         ]);
//       case 'swot-analysis':
//         return this.calculateFieldCompletion(data.swotAnalysis, [
//           'strengths', 'weaknesses', 'opportunities', 'threats'
//         ]);
//       case 'management':
//         return this.calculateFieldCompletion(data.managementStructure, [
//           'executiveTeam', 'managementTeam'
//         ]);
//       case 'business-strategy':
//         return this.calculateFieldCompletion(data.businessStrategy, [
//           'executiveSummary', 'missionStatement', 'fundingRequirements'
//         ]);
//       case 'financial-profile':
//         return this.calculateFieldCompletion(data.financialProfile, [
//           'monthlyRevenue', 'monthlyCosts', 'currentAssets'
//         ]);
//       default:
//         return 0;
//     }
//   }

//   // ← NEW: Calculate percentage of filled fields
//   private calculateFieldCompletion(obj: any, fields: string[]): number {
//     if (!obj) return 0;
//     const filled = fields.filter(f => obj[f] && obj[f] !== '' && obj[f] !== null && obj[f] !== undefined).length;
//     return Math.round((filled / fields.length) * 100);
//   }

//   // ← NEW: Get missing fields for a step
//   private getMissingFieldsForStep(stepId: string): string[] {
//     const fieldLabels: Record<string, Record<string, string>> = {
//       'company-info': {
//         'companyName': 'Company Name',
//         'registrationNumber': 'Registration Number',
//         'industryType': 'Industry Type',
//         'businessActivity': 'Business Description',
//         'businessStage': 'Business Stage',
//         'bbbeeLevel': 'B-BBEE Level',
//         'cipcReturns': 'CIPC Returns',
//         'incomeTaxNumber': 'Income Tax Number',
//         'workmansCompensation': 'Workman\'s Compensation'
//       },
//       'documents': {
//         'companyRegistration': 'Company Registration',
//         'taxClearanceCertificate': 'Tax Clearance Certificate',
//         'auditedFinancials': 'Audited Financials'
//       },
//       'business-assessment': {
//         'businessModel': 'Business Model',
//         'valueProposition': 'Value Proposition',
//         'targetMarkets': 'Target Markets'
//       },
//       'swot-analysis': {
//         'strengths': 'Strengths',
//         'weaknesses': 'Weaknesses',
//         'opportunities': 'Opportunities',
//         'threats': 'Threats'
//       },
//       'management': {
//         'executiveTeam': 'Executive Team',
//         'managementTeam': 'Management Team'
//       },
//       'business-strategy': {
//         'executiveSummary': 'Executive Summary',
//         'missionStatement': 'Mission Statement',
//         'fundingRequirements': 'Funding Requirements'
//       },
//       'financial-profile': {
//         'monthlyRevenue': 'Monthly Revenue',
//         'monthlyCosts': 'Monthly Costs',
//         'currentAssets': 'Current Assets'
//       }
//     };

//     const data = this.profileService.data();
//     const stepData = this.getStepDataObject(stepId, data);
//     const fields = fieldLabels[stepId] || {};

//     return Object.entries(fields)
//       .filter(([key]) => !stepData || !stepData[key] || stepData[key] === '' || stepData[key] === null || stepData[key] === undefined)
//       .map(([_, label]) => label);
//   }

//   // ← NEW: Get the data object for a step
//   private getStepDataObject(stepId: string, data: any): any {
//     switch (stepId) {
//       case 'company-info': return data.companyInfo;
//       case 'documents': return data.supportingDocuments;
//       case 'business-assessment': return data.businessAssessment;
//       case 'swot-analysis': return data.swotAnalysis;
//       case 'management': return data.managementStructure;
//       case 'business-strategy': return data.businessStrategy;
//       case 'financial-profile': return data.financialProfile;
//       default: return null;
//     }
//   }

//   getCurrentStepTitle(): string {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     const stepInfo = this.stepInfo.find(s => s.id === currentStep?.id);
//     return stepInfo?.title || currentStep?.title || '';
//   }

//   getCurrentStepDescription(): string {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     const stepInfo = this.stepInfo.find(s => s.id === currentStep?.id);
//     return stepInfo?.description || '';
//   }

//   getCurrentStepNumber(): number {
//     return this.profileService.currentStepIndex() + 1;
//   }

//   getCurrentStepEstimatedTime(): string {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     const stepInfo = this.stepInfo.find(s => s.id === currentStep?.id);
//     return stepInfo?.estimatedTime || '';
//   }

//   // ===============================
//   // PROGRESS CALCULATIONS
//   // ===============================

//   getOverallProgress(): number {
//     const totalSteps = this.profileService.steps.length;
//     const completedSteps = this.profileService.steps.filter(step => step.completed).length;
//     return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
//   }

//   getCompletedSteps(): number {
//     return this.profileService.steps.filter(step => step.completed).length;
//   }

//   getTotalSteps(): number {
//     return this.profileService.steps.length;
//   }

//   getRemainingTime(): string {
//     const incompleteSteps = this.profileService.steps.filter(step => !step.completed);
//     const totalMinutes = incompleteSteps.reduce((total, step) => {
//       const stepInfo = this.stepInfo.find(s => s.id === step.id);
//       const minutes = parseInt(stepInfo?.estimatedTime?.match(/\d+/)?.[0] || '0');
//       return total + minutes;
//     }, 0);

//     if (totalMinutes < 60) return `${totalMinutes} min`;
//     const hours = Math.floor(totalMinutes / 60);
//     const mins = totalMinutes % 60;
//     return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
//   }

//   // ===============================
//   // STEP ACCESS & STYLING
//   // ===============================

//   canAccessStep(step: any, index: number): boolean {
//     return this.stepCheckerService.isStepAccessible(step.id);
//   }

//   isCurrentStep(stepId: string): boolean {
//     const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
//     return currentStep?.id === stepId;
//   }

//   getStepCardClasses(step: any, index: number): string {
//     const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
//     const profileStep = this.getProfileStep(step.id);
    
//     if (profileStep?.completed) {
//       return `${baseClasses} border-green-200 bg-green-50 hover:bg-green-100`;
//     } else if (this.isCurrentStep(step.id)) {
//       return `${baseClasses} border-primary-300 bg-primary-50 hover:bg-primary-100 shadow-sm`;
//     } else if (this.canAccessStep(step, index)) {
//       return `${baseClasses} border-neutral-200 bg-white hover:bg-neutral-50`;
//     } else {
//       return `${baseClasses} border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed`;
//     }
//   }

//   getStepIconClasses(step: any, index: number): string {
//     const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
//     const profileStep = this.getProfileStep(step.id);
    
//     if (profileStep?.completed) {
//       return `${baseClasses} bg-green-500`;
//     } else if (this.isCurrentStep(step.id)) {
//       return `${baseClasses} bg-primary-500 text-white`;
//     } else if (this.canAccessStep(step, index)) {
//       return `${baseClasses} bg-neutral-200 text-neutral-600`;
//     } else {
//       return `${baseClasses} bg-neutral-100 text-neutral-400`;
//     }
//   }

//   getStepTitleClasses(step: any, index: number): string {
//     const baseClasses = 'text-sm font-medium';
//     const profileStep = this.getProfileStep(step.id);
    
//     if (profileStep?.completed) {
//       return `${baseClasses} text-green-900`;
//     } else if (this.isCurrentStep(step.id)) {
//       return `${baseClasses} text-primary-900`;
//     } else if (this.canAccessStep(step, index)) {
//       return `${baseClasses} text-neutral-900`;
//     } else {
//       return `${baseClasses} text-neutral-500`;
//     }
//   }

//   // ===============================
//   // ACTIONS
//   // ===============================

//   goToProfileHome() {
//     this.router.navigate(['/profile']);
//   }
  
//   goToStep(stepId: string) {
//     this.profileService.setCurrentStep(stepId);
//     this.router.navigate(['/profile/steps', stepId]);
//   }
  
//   previousStep() {
//     this.profileService.previousStep();
//     this.router.navigate(['/profile/steps', this.profileService.currentStepId()]);
//   }

//   async saveProgress() {
//     this.isSaving.set(true);
//     try {
//       await this.profileService.saveCurrentProgress();
//       this.lastSaved.set(new Date());
//     } catch (error) {
//       console.error('Failed to save progress:', error);
//     } finally {
//       this.isSaving.set(false);
//     }
//   }
  
//   async saveAndContinue() {
//     this.isSaving.set(true);
//     try {
//       await this.profileService.saveCurrentProgress();
//       this.lastSaved.set(new Date());
      
//       this.profileService.nextStep();
//       this.router.navigate(['/profile/steps', this.profileService.currentStepId()]);
//     } catch (error) {
//       console.error('Failed to save and continue:', error);
//     } finally {
//       this.isSaving.set(false);
//     }
//   }

//   canSubmit(): boolean {
//     return this.profileService.steps
//       .filter(step => step.required)
//       .every(step => step.completed);
//   }

//   canExit(): boolean {
//     return this.isLastStep();
//   }
  
//   async submitProfile() {
//     if (this.isLastStep()) {
//       await this.saveProgress();
//       this.router.navigate(['/profile'], { 
//         queryParams: { completed: 'true' } 
//       });
//       return;
//     }
    
//     this.isSubmitting.set(true);
//     try {
//       const result = await this.profileService.submitForReview();
//       if (result.success) {
//         this.router.navigate(['/profile'], { 
//           queryParams: { completed: 'true' } 
//         });
//       }
//     } catch (error) {
//       console.error('Failed to submit profile:', error);
//     } finally {
//       this.isSubmitting.set(false);
//     }
//   }

//   requestHelp() {
//     window.open('mailto:support@kapify.com?subject=Funding Application Help', '_blank');
//   }

//   // ===============================
//   // UTILITY METHODS
//   // ===============================

//   isFirstStep(): boolean {
//     return this.profileService.currentStepIndex() === 0;
//   }

//   isLastStep(): boolean {
//     return this.profileService.currentStepIndex() === this.profileService.steps.length - 1;
//   }

//   getLastSavedText(): string {
//     const saved = this.lastSaved();
//     if (!saved) return '';
    
//     const now = new Date();
//     const diffMs = now.getTime() - saved.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
    
//     if (diffMins < 1) return 'just now';
//     if (diffMins < 60) return `${diffMins} min ago`;
    
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours}h ago`;
    
//     return saved.toLocaleDateString();
//   }
// }

import { Component, signal, OnInit, inject, HostListener, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check, Home, Clock, AlertCircle, CheckCircle, Menu, X, Eye } from 'lucide-angular';
import { UiButtonComponent } from '../../../../shared/components';
import { CommonModule } from '@angular/common';
import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
import { ProfileStepsSidebarComponent, SectionData } from './profile-steps-sidebar.component';
import { FUNDING_STEPS, STEP_UI_CONFIG, STEP_FIELD_LABELS } from 'src/app/SMEs/services/funding-steps.constants';
import { FundingApplicationUtilityService } from 'src/app/SMEs/services/utility.service';
 
@Component({
  selector: 'app-profile-steps-layout',
  standalone: true,
  imports: [
    RouterOutlet, 
    LucideAngularModule, 
    UiButtonComponent, 
    CommonModule,
    ProfileStepsSidebarComponent
  ],
  templateUrl: 'profile-steps-layout.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    nav::-webkit-scrollbar {
      width: 4px;
    }
    
    nav::-webkit-scrollbar-track {
      background: transparent;
    }
    
    nav::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
    
    nav::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }

    button:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    @media (max-width: 1023px) {
      .sticky {
        position: -webkit-sticky;
        position: sticky;
      }
    }
  `]
})
export class ProfileStepsLayoutComponent implements OnInit {
  private router = inject(Router);
  public profileService = inject(FundingProfileSetupService);
  private stepCheckerService = inject(SMEProfileStepsService);
  private utilityService = inject(FundingApplicationUtilityService);
  
  // State
  isSaving = signal(false);
  isSubmitting = signal(false);
  lastSaved = signal<Date | null>(null);
  showMobileNav = signal(false);
  isMobile = signal(false);
  
  // Icons
  CheckIcon = Check;
  ArrowLeftIcon = ArrowLeft;
  HomeIcon = Home;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  MenuIcon = Menu;
  XIcon = X;
  
  // Use constants directly
   stepInfo = FUNDING_STEPS;
  stepUIConfig = STEP_UI_CONFIG;
  
  // ADD THIS LINE:
// In profile-steps-layout.component.ts

stepConfigArray = computed(() => 
  this.stepInfo.map(step => ({
    id: step.id,
    title: step.title,
    description: step.description,
    estimatedTime: step.estimatedTime ?? '', // <- Add this
    ...this.stepUIConfig[step.id as keyof typeof this.stepUIConfig]
  }))
);
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) {
      this.showMobileNav.set(false);
    }
  }

  // ===============================
  // MOBILE NAVIGATION
  // ===============================

  toggleMobileNav() {
    this.showMobileNav.update(show => !show);
  }

  closeMobileNav() {
    this.showMobileNav.set(false);
  }

  goToStepAndCloseMobile(stepId: string) {
    this.goToStep(stepId);
    this.closeMobileNav();
  }

  getMobileStepCardClasses(step: any): string {
    const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
    const profileStep = this.getProfileStep(step.id);
    
    if (profileStep?.completed) {
      return `${baseClasses} border-green-200 bg-green-50`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} border-primary-300 bg-primary-50 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} border-neutral-200 bg-white`;
    } else {
      return `${baseClasses} border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed`;
    }
  }

  // ===============================
  // STEP INFORMATION & NAVIGATION
  // ===============================

  getProfileStep(stepId: string) {
    return this.profileService.steps.find(step => step.id === stepId);
  }

  getSectionData(stepId: string): SectionData | null {
    const step = this.getProfileStep(stepId);
    if (!step) return null;

    const missingFields = this.profileService.getMissingFieldsForStep(stepId);
    const completionPercentage = step.completed ? 100 : this.calculateCompletionPercentage(stepId);

    return {
      stepId,
      completionPercentage,
      missingFields,
      isRequired: step.required ?? false,
      isComplete: step.completed ?? false
    };
  }

  private calculateCompletionPercentage(stepId: string): number {
    const requiredFields = Object.keys(STEP_FIELD_LABELS[stepId as keyof typeof STEP_FIELD_LABELS] || {});
    const missingFields = this.profileService.getMissingFieldsForStep(stepId);
    
    if (requiredFields.length === 0) return 0;
    const filledFields = requiredFields.length - missingFields.length;
    return Math.round((filledFields / requiredFields.length) * 100);
  }

  getCurrentStepTitle(): string {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.title || '';
  }

  getCurrentStepDescription(): string {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    const uiConfig = this.stepUIConfig[currentStep?.id as keyof typeof this.stepUIConfig];
    return currentStep?.description || (uiConfig?.shortTitle || '');
  }

  getCurrentStepNumber(): number {
    return this.profileService.currentStepIndex() + 1;
  }

  getCurrentStepEstimatedTime(): string {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.estimatedTime || '';
  }

  // ===============================
  // PROGRESS CALCULATIONS
  // ===============================

  getOverallProgress(): number {
    const totalSteps = this.profileService.steps.length;
    const completedSteps = this.profileService.completedSteps();
    return this.utilityService.calculateCompletionPercentage(completedSteps, totalSteps);
  }

  getCompletedSteps(): number {
    return this.profileService.completedSteps();
  }

  getTotalSteps(): number {
    return this.profileService.steps.length;
  }

  getRemainingTime(): string {
    const incompleteSteps = this.profileService.steps.filter(step => !step.completed);
    return this.utilityService.calculateTotalTimeFromSteps(incompleteSteps);
  }

  // ===============================
  // STEP ACCESS & STYLING
  // ===============================

  canAccessStep(stepId: string): boolean {
    return this.stepCheckerService.isStepAccessible(stepId);
  }

  isCurrentStep(stepId: string): boolean {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.id === stepId;
  }

  getStepCardClasses(step: any): string {
    const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
    const profileStep = this.getProfileStep(step.id);
    
    if (profileStep?.completed) {
      return `${baseClasses} border-green-200 bg-green-50 hover:bg-green-100`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} border-primary-300 bg-primary-50 hover:bg-primary-100 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} border-neutral-200 bg-white hover:bg-neutral-50`;
    } else {
      return `${baseClasses} border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed`;
    }
  }

  getStepIconClasses(step: any): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
    const profileStep = this.getProfileStep(step.id);
    
    if (profileStep?.completed) {
      return `${baseClasses} bg-green-500`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-neutral-200 text-neutral-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-400`;
    }
  }

  getStepTitleClasses(step: any): string {
    const baseClasses = 'text-sm font-medium';
    const profileStep = this.getProfileStep(step.id);
    
    if (profileStep?.completed) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-primary-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-neutral-900`;
    } else {
      return `${baseClasses} text-neutral-500`;
    }
  }

  // ===============================
  // ACTIONS
  // ===============================

  goToProfileHome() {
    this.router.navigate(['/profile']);
  }
  
  goToStep(stepId: string) {
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile/steps', stepId]);
  }
  
  previousStep() {
    this.profileService.previousStep();
    this.router.navigate(['/profile/steps', this.profileService.currentStepId()]);
  }

  async saveProgress() {
    this.isSaving.set(true);
    try {
      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
  
  async saveAndContinue() {
    this.isSaving.set(true);
    try {
      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());
      
      this.profileService.nextStep();
      this.router.navigate(['/profile/steps', this.profileService.currentStepId()]);
    } catch (error) {
      console.error('Failed to save and continue:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  canSubmit(): boolean {
    return this.profileService.steps
      .filter(step => step.required)
      .every(step => step.completed);
  }

  canExit(): boolean {
    return this.isLastStep();
  }
  
  async submitProfile() {
    if (this.isLastStep()) {
      await this.saveProgress();
      this.router.navigate(['/profile'], { queryParams: { completed: 'true' } });
      return;
    }
    
    this.isSubmitting.set(true);
    try {
      const result = await this.profileService.submitForReview();
      if (result.success) {
        this.router.navigate(['/profile'], { queryParams: { completed: 'true' } });
      }
    } catch (error) {
      console.error('Failed to submit profile:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  requestHelp() {
    window.open('mailto:support@kapify.com?subject=Funding Application Help', '_blank');
  }

  // ===============================
  // UTILITIES
  // ===============================

  getCanAccessStepFn = () => (stepId: string) => this.canAccessStep(stepId);
getSectionDataFn = () => (stepId: string) => this.getSectionData(stepId);

  isFirstStep(): boolean {
    return this.profileService.currentStepIndex() === 0;
  }

  isLastStep(): boolean {
    return this.profileService.currentStepIndex() === this.profileService.steps.length - 1;
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return saved.toLocaleDateString();
  }
}