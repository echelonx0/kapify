//  // src/app/applications/components/new-application/opportunity-application.component.ts - UPDATED WITH REAL AI
// import { Component, signal, computed, inject, OnInit } from '@angular/core';
// import { Router, ActivatedRoute } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, ArrowLeft, Building, DollarSign, FileText, CheckCircle, AlertCircle, Clock, Eye, TrendingUp, Users } from 'lucide-angular';
// import { Location } from '@angular/common'; 
// import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
// import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
// import { Application } from 'src/app/shared/models/application.models';
// import { FundingOpportunity } from 'src/app/shared/models/funder.models';
// import { GlobalProfileValidationService } from 'src/app/shared/services/global-profile-validation.service';
// import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
// import { DatabaseApplicationService } from 'src/app/SMEs/services/database-application.service';
// import { EnhancedAIAnalysisComponent } from 'src/app/ai/ai-analysis/enhanced-ai-analysis.component';
// import { FundingApplicationProfile } from '../models/funding-application.models';
// import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
// import { ProfileDataTransformerService } from 'src/app/SMEs/services/profile-data-transformer.service';

 
// export interface CoverInformation {
//   requestedAmount: string;
//   purposeStatement: string;
//   useOfFunds: string;
//   timeline: string;
//   opportunityAlignment: string;
// }

// interface ApplicationStep {
//   id: string;
//   number: number;
//   title: string;
//   description: string;
// }

// @Component({
//   selector: 'app-opportunity-application-form',
//   standalone: true,
//   imports: [
//     FormsModule,
//     CommonModule,
//     UiButtonComponent, 
//     UiCardComponent, 
//     LucideAngularModule,
//     EnhancedAIAnalysisComponent
//   ],
//   templateUrl: 'opportunity-application.component.html',
//   styles: [
//     `
//       .ai-analysis-container {
//         margin-top: 1rem;
//       }

//       @keyframes fade-in {
//         from { opacity: 0; transform: translateY(10px); }
//         to { opacity: 1; transform: translateY(0); }
//       }

//       @keyframes shake {
//         0%, 100% { transform: translateX(0); }
//         25% { transform: translateX(-5px); }
//         75% { transform: translateX(5px); }
//       }

//       .animate-fade-in {
//         animation: fade-in 0.5s ease-out;
//       }

//       .animate-shake {
//         animation: shake 0.5s ease-in-out;
//       }

//       .tabular-nums {
//         font-variant-numeric: tabular-nums;
//       }

//       * {
//         transition-property: transform, box-shadow, background-color, border-color;
//         transition-duration: 200ms;
//         transition-timing-function: ease-out;
//       }
//     `
//   ]
// })
// export class OpportunityApplicationFormComponent implements OnInit {
//   // Services
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private location = inject(Location);
//   private opportunitiesService = inject(SMEOpportunitiesService);
//   private applicationService = inject(DatabaseApplicationService);
//   private profileValidationService = inject(GlobalProfileValidationService);
  
//   // ADD: Profile service for business data
//   private profileService = inject(ProfileManagementService);
//  private profileTransformer = inject(ProfileDataTransformerService);
//   private fundingProfileService = inject(FundingProfileBackendService);

//   fullFundingProfile = signal<FundingApplicationProfile | undefined>(undefined);
//   isLoadingFundingProfile = signal(false);
//   // Icons
//   ArrowLeftIcon = ArrowLeft;
//   BuildingIcon = Building;
//   DollarSignIcon = DollarSign;
//   FileTextIcon = FileText;
//   CheckCircleIcon = CheckCircle;
//   AlertCircleIcon = AlertCircle;
//   ClockIcon = Clock;
//   UsersIcon = Users;
//   EyeIcon = Eye;
//   TrendingUpIcon = TrendingUp;

//   // State
//   currentStep = signal<'select-opportunity' | 'application-details' | 'ai-analysis' | 'review-submit'>('select-opportunity');
//   isLoading = signal(false);
//   isSaving = signal(false);
//   isSubmitting = signal(false);
//   error = signal<string | null>(null);

//   // Data
//   availableOpportunities = signal<FundingOpportunity[]>([]);
//   selectedOpportunity = signal<FundingOpportunity | null>(null);
//   coverInformation = signal<CoverInformation>({
//     requestedAmount: '',
//     purposeStatement: '',
//     useOfFunds: '',
//     timeline: '',
//     opportunityAlignment: ''
//   });

//   draftApplication = signal<Application | null>(null);
//   fundingApplicationProfile!: FundingApplicationProfile;
//   // AI Analysis state
//   aiAnalysisResult = signal<any | null>(null);
//   showAIAnalysis = signal(false);

//   // Steps configuration
//   steps = signal<ApplicationStep[]>([
//     {
//       id: 'select-opportunity',
//       number: 1,
//       title: 'Choose Opportunity',
//       description: 'Select the funding opportunity'
//     },
//     {
//       id: 'application-details',
//       number: 2,
//       title: 'Application Details',
//       description: 'Provide application-specific information'
//     },
//     {
//       id: 'ai-analysis',
//       number: 3,
//       title: 'AI Analysis',
//       description: 'Get intelligent insights'
//     },
//     {
//       id: 'review-submit',
//       number: 4,
//       title: 'Review & Submit',
//       description: 'Final review and submission'
//     }
//   ]);

//   // COMPUTED PROPERTIES FOR AI INTEGRATION
//   applicationId = computed(() => {
//     const draft = this.draftApplication();
//     if (draft?.id) {
//       return draft.id;
//     }
//     // Generate temp ID for new applications
//     return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   });

//  businessProfile = computed(() => {
//     return this.fullFundingProfile();
//   });


//   // Computed properties
//   canContinue = computed(() => {
//     switch (this.currentStep()) {
//       case 'select-opportunity':
//         return !!this.selectedOpportunity();
//       case 'application-details':
//         return this.isApplicationDetailsValid();
//       case 'ai-analysis':
//         return true; // Can always continue from AI analysis
//       case 'review-submit':
//         return true;
//       default:
//         return false;
//     }
//   });

//   profileCompletion = computed(() => this.profileValidationService.completion());

//   ngOnInit() {
//     // Load profile data first for AI analysis
//     this.loadFullFundingProfile();

//     // Check if opportunity ID was passed in route
//     const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
    
//     if (opportunityId) {
//       this.loadSpecificOpportunity(opportunityId);
//     } else {
//       this.loadAvailableOpportunities();
//     }

//     // Check for existing draft application
//     this.checkForDraftApplication();
//   }

//   private loadFullFundingProfile() {
//     this.isLoadingFundingProfile.set(true);
    
//     this.fundingProfileService.loadSavedProfile().subscribe({
//       next: (profile) => {
//         this.fullFundingProfile.set(profile);
//         this.isLoadingFundingProfile.set(false);
//         console.log('Full funding profile loaded for AI analysis');
//       },
//       error: (error) => {
//         console.warn('Full funding profile not available, using profile service data:', error);
//         this.loadProfileServiceData();
//       }
//     });
//   }

//   private loadProfileServiceData() {
//     // Fallback: load from profile service and transform
//     this.profileService.loadProfileData().subscribe({
//       next: () => {
//         const currentProfile = this.profileService.currentProfile();
//         const currentOrganization = this.profileService.currentOrganization();
        
//         if (currentProfile) {
//           // Transform profile service data to funding profile
//           const profileData = {
//             businessInfo: this.extractBusinessInfo(currentOrganization, currentProfile),
//             personalInfo: this.extractPersonalInfo(currentProfile),
//             // Add other sections as available...
//           };
          
//           const fundingProfile = this.profileTransformer.transformToFundingProfile(profileData);
//           this.fullFundingProfile.set(fundingProfile);
//         }
        
//         this.isLoadingFundingProfile.set(false);
//       },
//       error: (error) => {
//         console.error('Profile data not available:', error);
//         this.isLoadingFundingProfile.set(false);
//       }
//     });
//   }
//  // Helper methods to extract data from profile service
//   private extractBusinessInfo(organization: any, profile: any) {
//     return {
//       companyName: organization?.name || '',
//       registrationNumber: organization?.registrationNumber || '',
//       industry: this.extractIndustry(organization),
//       yearsInOperation: this.extractYearsInOperation(organization),
//       numberOfEmployees: organization?.employeeCount || '',
//       physicalAddress: organization?.address || {}
//     };
//   }

//   private extractPersonalInfo(profile: any) {
//     return {
//       firstName: profile?.firstName || '',
//       lastName: profile?.lastName || '',
//       email: profile?.email || '',
//       phone: profile?.phone || '',
//        idNumber: profile?.idNumber || '', // Add this missing field
//       position: profile?.position || ''
//     };
//   }

//   // BUSINESS DATA EXTRACTION HELPERS FOR AI
//   private extractIndustry(organization: any): string {
//     if (organization?.organizationType) {
//       const typeToIndustry: Record<string, string> = {
//         'investment_fund': 'Financial Services',
//         'bank': 'Financial Services', 
//         'technology': 'Technology',
//         'manufacturing': 'Manufacturing',
//         'retail': 'Retail',
//         'healthcare': 'Healthcare'
//       };
//       return typeToIndustry[organization.organizationType] || 'Technology';
//     }
//     return 'Technology'; // Default
//   }

//   private extractBusinessStage(organization: any): string {
//     const yearsInOperation = this.extractYearsInOperation(organization);
//     if (yearsInOperation <= 2) return 'startup';
//     if (yearsInOperation <= 5) return 'early-stage';
//     if (yearsInOperation <= 10) return 'growth';
//     return 'mature';
//   }

//   private extractYearsInOperation(organization: any): number {
//     if (organization?.foundedYear) {
//       return new Date().getFullYear() - organization.foundedYear;
//     }
//     return 3; // Default
//   }

//   private extractAnnualRevenue(): number {
//     // This would come from your business profile/financial data
//     // For now, use a reasonable default
//     return 2000000; // R2M
//   }

//   private extractMonthlyRevenue(): number {
//     return this.extractAnnualRevenue() / 12;
//   }

//   // ===============================
//   // DATA LOADING (existing methods unchanged)
//   // ===============================

//   setTimeline(timeline: string) {
//     this.coverInformation.update(current => ({
//       ...current,
//       timeline: timeline
//     }));
//     this.autoSaveDraft();
//   }

//   getApplicationCompletionPercentage(): number {
//     const info = this.coverInformation();
//     let completed = 0;
//     let total = 4;

//     if (info.requestedAmount) completed++;
//     if (info.purposeStatement) completed++;
//     if (info.useOfFunds) completed++;
//     if (info.timeline) completed++;

//     return Math.round((completed / total) * 100);
//   }

//   private loadAvailableOpportunities() {
//     this.isLoading.set(true);
//     this.opportunitiesService.loadActiveOpportunities().subscribe({
//       next: (opportunities) => {
//         this.availableOpportunities.set(opportunities);
//         this.isLoading.set(false);
//       },
//       error: (error) => {
//         this.error.set('Failed to load opportunities');
//         this.isLoading.set(false);
//         console.error('Load opportunities error:', error);
//       }
//     });
//   }

//   private loadSpecificOpportunity(opportunityId: string) {
//     this.isLoading.set(true);
//     this.opportunitiesService.getOpportunityById(opportunityId).subscribe({
//       next: (opportunity) => {
//         if (opportunity) {
//           this.selectedOpportunity.set(opportunity);
//           this.initializeCoverInformation(opportunity);
//           this.currentStep.set('application-details');
          
//           this.createDraftApplication(opportunity);
//         } else {
//           this.error.set('Opportunity not found');
//         }
//         this.isLoading.set(false);
//       },
//       error: (error) => {
//         this.error.set('Failed to load opportunity');
//         this.isLoading.set(false);
//         console.error('Load opportunity error:', error);
//       }
//     });
//   }

//   private initializeCoverInformation(opportunity: FundingOpportunity) {
//     this.coverInformation.update(current => ({
//       ...current,
//       requestedAmount: opportunity.minInvestment?.toString() || '',
//       timeline: 'Within 3 months',
//       opportunityAlignment: `This opportunity aligns with our business goals for ${opportunity.fundingType} funding.`
//     }));
//   }

//   // ===============================
//   // DRAFT APPLICATION MANAGEMENT (existing methods)
//   // ===============================

//   private checkForDraftApplication() {
//     const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
//     if (!opportunityId) return;

//     this.applicationService.getApplicationsByOpportunity(opportunityId).subscribe({
//       next: (applications) => {
//         const draftApp = applications.find(app => app.status === 'draft');
//         if (draftApp) {
//           this.draftApplication.set(draftApp);
//           this.loadFromDraftApplication(draftApp);
//         }
//       },
//       error: (error) => {
//         console.error('Error checking for draft application:', error);
//       }
//     });
//   }

//   private loadFromDraftApplication(application: Application) {
//     const formData = application.useOfFunds?.[0];
//     if (formData) {
//       this.coverInformation.update(current => ({
//         ...current,
//         requestedAmount: application.requestedAmount?.toString() || current.requestedAmount,
//         purposeStatement: application.purposeStatement || current.purposeStatement,
//         useOfFunds: formData.description || current.useOfFunds,
//         timeline: formData.timeline || current.timeline,
//         opportunityAlignment: current.opportunityAlignment
//       }));
//     }
//   }

//   private createDraftApplication(opportunity: FundingOpportunity) {
//     const applicationData = {
//       title: `Application for ${opportunity.title}`,
//       description: `Funding application for ${opportunity.fundingType} opportunity`,
//       opportunityId: opportunity.id,
//       formData: {
//         requestedAmount: this.coverInformation().requestedAmount,
//         purposeStatement: this.coverInformation().purposeStatement,
//         useOfFunds: this.coverInformation().useOfFunds,
//         timeline: this.coverInformation().timeline,
//         opportunityAlignment: this.coverInformation().opportunityAlignment
//       }
//     };

//     this.applicationService.createApplication(applicationData).subscribe({
//       next: (newApplication) => {
//         this.draftApplication.set(newApplication);
//         console.log('Draft application created:', newApplication.id);
//       },
//       error: (error) => {
//         console.error('Error creating draft application:', error);
//       }
//     });
//   }

//   // ===============================
//   // STEP NAVIGATION (existing methods)
//   // ===============================

//   nextStep() {
//     const current = this.currentStep();
    
//     if (current === 'select-opportunity' && this.selectedOpportunity()) {
//       this.currentStep.set('application-details');
//       if (this.selectedOpportunity()) {
//         this.createDraftApplication(this.selectedOpportunity()!);
//       }
//     } else if (current === 'application-details' && this.isApplicationDetailsValid()) {
//       this.currentStep.set('ai-analysis');
//       this.saveDraft();
//     } else if (current === 'ai-analysis') {
//       this.currentStep.set('review-submit');
//       this.saveDraft();
//     }
//   }

//   previousStep() {
//     const current = this.currentStep();
    
//     if (current === 'review-submit') {
//       this.currentStep.set('ai-analysis');
//     } else if (current === 'ai-analysis') {
//       this.currentStep.set('application-details');
//     } else if (current === 'application-details') {
//       this.currentStep.set('select-opportunity');
//     }
//   }

//   goToStep(stepId: string) {
//     if (stepId === 'select-opportunity' || 
//         (stepId === 'application-details' && this.selectedOpportunity()) ||
//         (stepId === 'ai-analysis' && this.selectedOpportunity() && this.isApplicationDetailsValid()) ||
//         (stepId === 'review-submit' && this.selectedOpportunity() && this.isApplicationDetailsValid())) {
//       this.currentStep.set(stepId as any);
//     }
//   }

//   // ===============================
//   // FORM VALIDATION (existing methods)
//   // ===============================

//   private isApplicationDetailsValid(): boolean {
//     const info = this.coverInformation();
//     const opportunity = this.selectedOpportunity();
    
//     if (!info.requestedAmount || !info.purposeStatement || !info.useOfFunds) {
//       return false;
//     }

//     const amount = parseFloat(info.requestedAmount);
//     if (opportunity) {
//       return amount >= opportunity.minInvestment && amount <= opportunity.maxInvestment;
//     }

//     return true;
//   }

//   getAmountValidationMessage(): string | null {
//     const info = this.coverInformation();
//     const opportunity = this.selectedOpportunity();
    
//     if (!info.requestedAmount || !opportunity) {
//       return null;
//     }

//     const amount = parseFloat(info.requestedAmount);
//     if (isNaN(amount)) {
//       return 'Please enter a valid amount';
//     }

//     if (amount < opportunity.minInvestment) {
//       return `Amount must be at least ${this.formatCurrency(opportunity.minInvestment)}`;
//     }

//     if (amount > opportunity.maxInvestment) {
//       return `Amount cannot exceed ${this.formatCurrency(opportunity.maxInvestment)}`;
//     }

//     return null;
//   }

//   // ===============================
//   // EVENT HANDLERS (existing methods)
//   // ===============================

//   selectOpportunity(opportunity: FundingOpportunity) {
//     this.selectedOpportunity.set(opportunity);
//     this.initializeCoverInformation(opportunity);
//   }

//   onRequestedAmountChange(event: Event) {
//     const target = event.target as HTMLInputElement;
//     this.coverInformation.update(current => ({
//       ...current,
//       requestedAmount: target.value
//     }));
//     this.autoSaveDraft();
//   }

//   onPurposeStatementChange(event: Event) {
//     const target = event.target as HTMLTextAreaElement;
//     this.coverInformation.update(current => ({
//       ...current,
//       purposeStatement: target.value
//     }));
//     this.autoSaveDraft();
//   }

//   onUseOfFundsChange(event: Event) {
//     const target = event.target as HTMLTextAreaElement;
//     this.coverInformation.update(current => ({
//       ...current,
//       useOfFunds: target.value
//     }));
//     this.autoSaveDraft();
//   }

//   onTimelineChange(event: Event) {
//     const target = event.target as HTMLInputElement;
//     this.coverInformation.update(current => ({
//       ...current,
//       timeline: target.value
//     }));
//     this.autoSaveDraft();
//   }

//   onOpportunityAlignmentChange(event: Event) {
//     const target = event.target as HTMLTextAreaElement;
//     this.coverInformation.update(current => ({
//       ...current,
//       opportunityAlignment: target.value
//     }));
//     this.autoSaveDraft();
//   }

//   private autoSaveTimeout: any = null;
//   private autoSaveDraft() {
//     if (this.autoSaveTimeout) {
//       clearTimeout(this.autoSaveTimeout);
//     }
    
//     this.autoSaveTimeout = setTimeout(() => {
//       this.saveDraft();
//     }, 2000);
//   }

//   // ===============================
//   // AI ANALYSIS EVENT HANDLERS - UPDATED
//   // ===============================

//   onAnalysisCompleted(result: any) {
//     console.log('AI Analysis completed:', result);
//     this.aiAnalysisResult.set(result);
    
//     // Show user the results and optionally auto-advance if score is very high
//     if (result.matchScore >= 85) {
//       // Give user time to see excellent results, then auto-advance
//       setTimeout(() => {
//         if (this.currentStep() === 'ai-analysis') {
//           this.nextStep();
//         }
//       }, 4000);
//     }
//   }

//   onImprovementRequested() {
//     // Go back to application details for improvements
//     console.log('User requested improvements');
//     this.currentStep.set('application-details');
//   }

//   onProceedRequested() {
//     // Move to review and submit
//     console.log('User proceeding with application');
//     this.nextStep();
//   }

//   // ===============================
//   // ACTIONS (existing methods)
//   // ===============================

//   async saveDraft() {
//     if (!this.selectedOpportunity() || this.isSaving()) return;

//     this.isSaving.set(true);
//     this.error.set(null);

//     try {
//       const formData = {
//         requestedAmount: parseFloat(this.coverInformation().requestedAmount) || 0,
//         purposeStatement: this.coverInformation().purposeStatement,
//         useOfFunds: this.coverInformation().useOfFunds,
//         timeline: this.coverInformation().timeline,
//         opportunityAlignment: this.coverInformation().opportunityAlignment
//       };

//       if (this.draftApplication()) {
//         const updatedApplication = await this.applicationService.updateApplication(
//           this.draftApplication()!.id,
//           { formData }
//         ).toPromise();
        
//         if (updatedApplication) {
//           this.draftApplication.set(updatedApplication);
//         }
//       } else {
//         const newApplication = await this.applicationService.createApplication({
//           title: `Application for ${this.selectedOpportunity()!.title}`,
//           description: `Funding application for ${this.selectedOpportunity()!.fundingType} opportunity`,
//           opportunityId: this.selectedOpportunity()!.id,
//           formData
//         }).toPromise();
        
//         if (newApplication) {
//           this.draftApplication.set(newApplication);
//         }
//       }

//       console.log('Draft saved successfully');
//     } catch (error) {
//       console.error('Failed to save draft:', error);
//       this.error.set('Failed to save draft');
//     } finally {
//       this.isSaving.set(false);
//     }
//   }

// // Update your submitApplication method in your component

// async submitApplication() {
//   if (!this.selectedOpportunity() || !this.isApplicationDetailsValid() || !this.draftApplication()) {
//     return;
//   }

//   this.isSubmitting.set(true);
//   this.error.set(null);

//   try {
//     await this.saveDraft();
    
//     if (this.draftApplication()) {
//       // Use the DatabaseApplicationService to submit
//       const submittedApplication = await this.applicationService
//         .submitApplication(this.draftApplication()!.id)
//         .toPromise();
      
//       if (submittedApplication) {
//         this.router.navigate(['/applications/submitted'], {
//           queryParams: { 
//             opportunityId: this.selectedOpportunity()!.id,
//             applicationId: submittedApplication.id
//           }
//         });
//       }
//     }

//   } catch (error) {
//     this.error.set('Failed to submit application');
//     console.error('Submit application error:', error);
//   } finally {
//     this.isSubmitting.set(false);
//   }
// }

//   goBack() {
//     this.location.back();
//   }

//   requestedAmountAsNumber = computed(() => {
//     const amount = this.coverInformation().requestedAmount;
//     return amount ? parseFloat(amount) : 0;
//   });

//   // ===============================
//   // UI HELPERS (existing methods)
//   // ===============================

//   getStepClasses(stepId: string): string {
//     const isActive = this.currentStep() === stepId;
//     const step = this.steps().find(s => s.id === stepId);
//     const stepIndex = this.steps().findIndex(s => s.id === stepId);
//     const currentIndex = this.steps().findIndex(s => s.id === this.currentStep());
//     const isCompleted = stepIndex < currentIndex;

//     const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';

//     if (isCompleted) {
//       return `${baseClasses} bg-green-500 text-white`;
//     } else if (isActive) {
//       return `${baseClasses} bg-primary-500 text-white`;
//     } else {
//       return `${baseClasses} bg-gray-200 text-gray-600`;
//     }
//   }

//   getStepTextClasses(stepId: string): string {
//     const isActive = this.currentStep() === stepId;
//     return isActive ? 'font-medium text-primary-600' : 'text-gray-600';
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   }

//   getOrganizationName(opportunity: FundingOpportunity): string {
//     return 'Private Funder';
//   }
// }

// src/app/applications/components/new-application/opportunity-application.component.ts

import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Clock } from 'lucide-angular';

import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { Application } from 'src/app/shared/models/application.models';
import { ApplicationStep, FundingOpportunity } from 'src/app/shared/models/funder.models';
import { GlobalProfileValidationService } from 'src/app/shared/services/global-profile-validation.service';
import { DatabaseApplicationService } from 'src/app/SMEs/services/database-application.service';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';

import { EnhancedAIAnalysisComponent } from 'src/app/ai/ai-analysis/enhanced-ai-analysis.component';
 
import { ApplicationFormService } from './services/application-form.service';
import { ApplicationValidationService } from './services/application-validation.service';

// Child Components
import { OpportunitySelectorComponent } from './components/opportunity-selector/opportunity-selector.component';
import { ApplicationFormComponent } from './components/application-form/application-form.component';
import { ReviewSummaryComponent } from './components/review-summary/review-summary.component';
import { OpportunitySidebarComponent } from './components/opportunity-sidebar/opportunity-sidebar.component';
import { ApplicationFormStep, ApplicationStepId } from './models/application-form.model';
import { FundingApplicationProfile } from '../models/funding-application.models';

@Component({
  selector: 'app-opportunity-application-form',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    EnhancedAIAnalysisComponent,
    OpportunitySelectorComponent,
    ApplicationFormComponent,
    ReviewSummaryComponent,
    OpportunitySidebarComponent,
    
  ],
  templateUrl: './opportunity-application.component.html',
  providers: [ApplicationFormService, ApplicationValidationService],
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fade-in 0.5s ease-out;
    }

    * {
      transition-property: transform, box-shadow, background-color, border-color;
      transition-duration: 200ms;
      transition-timing-function: ease-out;
    }
  `]
})
export class OpportunityApplicationFormComponent implements OnInit, OnDestroy {
  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private applicationService = inject(DatabaseApplicationService);
  private profileValidationService = inject(GlobalProfileValidationService);
  private fundingProfileService = inject(FundingProfileBackendService);
  private formService = inject(ApplicationFormService);
  private validationService = inject(ApplicationValidationService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  ClockIcon = Clock;

  // State
  currentStep = signal<ApplicationStepId>('select-opportunity');
  isLoading = signal(false);
  isSaving = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Data
  availableOpportunities = signal<FundingOpportunity[]>([]);
  selectedOpportunity = signal<FundingOpportunity | null>(null);
  draftApplication = signal<Application | null>(null);
  fullFundingProfile = signal<FundingApplicationProfile | undefined>(undefined);
  aiAnalysisResult = signal<any | null>(null);

  // Auto-save
  private autoSaveTimeout: any = null;

  // Steps
steps = signal<ApplicationFormStep[]>([
    {
      id: 'select-opportunity',
      number: 1,
      title: 'Choose Opportunity',
      description: 'Select the funding opportunity'
    },
    {
      id: 'application-details',
      number: 2,
      title: 'Application Details',
      description: 'Provide application information'
    },
    {
      id: 'ai-analysis',
      number: 3,
      title: 'AI Analysis',
      description: 'Get intelligent insights'
    },
    {
      id: 'review-submit',
      number: 4,
      title: 'Review & Submit',
      description: 'Final review and submission'
    }
  ]);

  // Computed
  formData = this.formService.formData;
  profileCompletion = computed(() => this.profileValidationService.completion());

  canContinue = computed(() => {
    switch (this.currentStep()) {
      case 'select-opportunity':
        return !!this.selectedOpportunity();
      case 'application-details':
        return this.isFormValid();
      case 'ai-analysis':
        return true;
      case 'review-submit':
        return true;
      default:
        return false;
    }
  });
// Continuation of opportunity-application.component.ts

  applicationId = computed(() => {
    const draft = this.draftApplication();
    if (draft?.id) {
      return draft.id;
    }
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  businessProfile = computed(() => {
    return this.fullFundingProfile();
  });

  ngOnInit(): void {
    this.loadFullFundingProfile();
    
    const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
    const requestedAmount = this.route.snapshot.queryParamMap.get('requestedAmount');
    
    // Pre-fill requested amount if passed
    if (requestedAmount) {
      this.formService.prefillForm({ requestedAmount });
    }
    
    if (opportunityId) {
      this.loadSpecificOpportunity(opportunityId);
    } else {
      this.loadAvailableOpportunities();
    }
    
    this.checkForDraftApplication();
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadFullFundingProfile(): void {
    this.fundingProfileService.loadSavedProfile().subscribe({
      next: (profile) => {
        this.fullFundingProfile.set(profile);
        console.log('Funding profile loaded for AI analysis');
      },
      error: (error) => {
        console.warn('Funding profile not available:', error);
      }
    });
  }

  private loadAvailableOpportunities(): void {
    this.isLoading.set(true);
    this.opportunitiesService.loadActiveOpportunities().subscribe({
      next: (opportunities) => {
        this.availableOpportunities.set(opportunities);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load opportunities');
        this.isLoading.set(false);
        console.error('Load opportunities error:', error);
      }
    });
  }

  private loadSpecificOpportunity(opportunityId: string): void {
    this.isLoading.set(true);
    this.opportunitiesService.getOpportunityById(opportunityId).subscribe({
      next: (opportunity) => {
        if (opportunity) {
          this.selectedOpportunity.set(opportunity);
          this.currentStep.set('application-details');
          this.createDraftApplication(opportunity);
        } else {
          this.error.set('Opportunity not found');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load opportunity');
        this.isLoading.set(false);
        console.error('Load opportunity error:', error);
      }
    });
  }

  private checkForDraftApplication(): void {
    const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
    if (!opportunityId) return;

    this.applicationService.getApplicationsByOpportunity(opportunityId).subscribe({
      next: (applications) => {
        const draftApp = applications.find(app => app.status === 'draft');
        if (draftApp) {
          this.draftApplication.set(draftApp);
          this.loadFromDraftApplication(draftApp);
        }
      },
      error: (error) => {
        console.error('Error checking for draft application:', error);
      }
    });
  }

  private loadFromDraftApplication(application: Application): void {
    const formData = application.useOfFunds?.[0];
    if (formData) {
      this.formService.prefillForm({
        requestedAmount: application.requestedAmount?.toString() || '',
        purposeStatement: application.purposeStatement || '',
        useOfFunds: formData.description || ''
      });
    }
  }

  private createDraftApplication(opportunity: FundingOpportunity): void {
    const applicationData = {
      title: `Application for ${opportunity.title}`,
      description: `Funding application for ${opportunity.fundingType} opportunity`,
      opportunityId: opportunity.id,
      formData: this.formService.getFormDataForSave()
    };

    this.applicationService.createApplication(applicationData).subscribe({
      next: (newApplication) => {
        this.draftApplication.set(newApplication);
        console.log('Draft application created:', newApplication.id);
      },
      error: (error) => {
        console.error('Error creating draft application:', error);
      }
    });
  }

  // ===============================
  // VALIDATION
  // ===============================

  private isFormValid(): boolean {
    const validation = this.validationService.validateForm(
      this.formData(),
      this.selectedOpportunity()
    );
    return validation.isValid;
  }

  // ===============================
  // EVENT HANDLERS
  // ===============================

  onOpportunitySelected(opportunity: FundingOpportunity): void {
    this.selectedOpportunity.set(opportunity);
    this.currentStep.set('application-details');
    this.createDraftApplication(opportunity);
  }

  onFormChanged(): void {
    this.autoSaveDraft();
  }

  onAnalysisCompleted(result: any): void {
    console.log('AI Analysis completed:', result);
    this.aiAnalysisResult.set(result);
    
    if (result.matchScore >= 85) {
      setTimeout(() => {
        if (this.currentStep() === 'ai-analysis') {
          this.nextStep();
        }
      }, 4000);
    }
  }

  onImprovementRequested(): void {
    console.log('User requested improvements');
    this.currentStep.set('application-details');
  }

  onProceedRequested(): void {
    console.log('User proceeding with application');
    this.nextStep();
  }

  // ===============================
  // NAVIGATION
  // ===============================

  nextStep(): void {
    const current = this.currentStep();
    
    if (current === 'application-details' && this.isFormValid()) {
      this.currentStep.set('ai-analysis');
      this.saveDraft();
    } else if (current === 'ai-analysis') {
      this.currentStep.set('review-submit');
      this.saveDraft();
    }
  }

  previousStep(): void {
    const current = this.currentStep();
    
    if (current === 'review-submit') {
      this.currentStep.set('ai-analysis');
    } else if (current === 'ai-analysis') {
      this.currentStep.set('application-details');
    } else if (current === 'application-details') {
      this.currentStep.set('select-opportunity');
    }
  }

  goToStep(stepId: ApplicationStepId): void {
    if (stepId === 'select-opportunity' || 
        (stepId === 'application-details' && this.selectedOpportunity()) ||
        (stepId === 'ai-analysis' && this.selectedOpportunity() && this.isFormValid()) ||
        (stepId === 'review-submit' && this.selectedOpportunity() && this.isFormValid())) {
      this.currentStep.set(stepId);
    }
  }

  goBack(): void {
    this.location.back();
  }

  // ===============================
  // SAVE & SUBMIT
  // ===============================

  private autoSaveDraft(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveDraft();
    }, 2000);
  }

  async saveDraft(): Promise<void> {
    if (!this.selectedOpportunity() || this.isSaving()) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const formData = this.formService.getFormDataForSave();
      const savePayload = {
        formData: {
          requestedAmount: parseFloat(formData.requestedAmount) || 0,
          purposeStatement: formData.purposeStatement,
          useOfFunds: formData.useOfFunds
        }
      };

      if (this.draftApplication()) {
        const updatedApplication = await this.applicationService.updateApplication(
          this.draftApplication()!.id,
          savePayload
        ).toPromise();
        
        if (updatedApplication) {
          this.draftApplication.set(updatedApplication);
        }
      } else {
        const newApplication = await this.applicationService.createApplication({
          title: `Application for ${this.selectedOpportunity()!.title}`,
          description: `Funding application for ${this.selectedOpportunity()!.fundingType} opportunity`,
          opportunityId: this.selectedOpportunity()!.id,
          formData: savePayload.formData
        }).toPromise();
        
        if (newApplication) {
          this.draftApplication.set(newApplication);
        }
      }

      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.error.set('Failed to save draft');
    } finally {
      this.isSaving.set(false);
    }
  }

  async submitApplication(): Promise<void> {
    if (!this.selectedOpportunity() || !this.isFormValid() || !this.draftApplication()) {
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      await this.saveDraft();
      
      if (this.draftApplication()) {
        const submittedApplication = await this.applicationService
          .submitApplication(this.draftApplication()!.id)
          .toPromise();
        
        if (submittedApplication) {
          this.router.navigate(['/applications/submitted'], {
            queryParams: { 
              opportunityId: this.selectedOpportunity()!.id,
              applicationId: submittedApplication.id
            }
          });
        }
      }
    } catch (error) {
      this.error.set('Failed to submit application');
      console.error('Submit application error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ===============================
  // UI HELPERS
  // ===============================

  getStepClasses(stepId: ApplicationStepId): string {
    const isActive = this.currentStep() === stepId;
    const stepIndex = this.steps().findIndex(s => s.id === stepId);
    const currentIndex = this.steps().findIndex(s => s.id === this.currentStep());
    const isCompleted = stepIndex < currentIndex;

    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300';

    if (isCompleted) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (isActive) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-600`;
    }
  }

  getStepTextClasses(stepId: ApplicationStepId): string {
    const isActive = this.currentStep() === stepId;
    return isActive ? 'font-medium text-primary-600' : 'text-gray-600';
  }
}