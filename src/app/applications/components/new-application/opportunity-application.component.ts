// src/app/applications/components/opportunity-application-form.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from '../../../shared/components';
import { LucideAngularModule, ArrowLeft, Building, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-angular';
import { Location } from '@angular/common';
import { SMEOpportunitiesService } from '../../../funding/services/opportunities.service';
import { FundingOpportunity } from '../../../shared/models/funder.models';
import { FundingApplicationProfileService, ProfileData } from '../../services/funding-profile.service';
import { FundingApplicationBackendService } from '../../services/funding-application-backend.service';

interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

@Component({
  selector: 'app-opportunity-application-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    UiButtonComponent, 
    UiCardComponent, 
    LucideAngularModule
  ],
  templateUrl: 'opportunity-application.component.html'
})
export class OpportunityApplicationFormComponent implements OnInit {
  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private profileService = inject(FundingApplicationProfileService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private fundingApplicationBackendService = inject(FundingApplicationBackendService);


  // Icons
  ArrowLeftIcon = ArrowLeft;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;

  // State
  currentStep = signal<'select-opportunity' | 'review-profile' | 'cover-information' | 'review-submit'>('select-opportunity');
  isLoading = signal(false);
  isSaving = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Data
  selectedOpportunity = signal<FundingOpportunity | null>(null);
  availableOpportunities = signal<FundingOpportunity[]>([]);
  userProfile = signal<Partial<ProfileData> | null>(null);
  profileCompleteness = signal(0);
  
  // Cover information form data
  coverInformation = signal<CoverInformation>({
    requestedAmount: '',
    purposeStatement: '',
    useOfFunds: '',
    timeline: '',
    opportunityAlignment: ''
  });

  // Steps configuration
  steps = signal([
    { id: 'select-opportunity', number: 1, title: 'Select Opportunity', description: 'Choose funding opportunity' },
    { id: 'review-profile', number: 2, title: 'Review Profile', description: 'Verify your business data' },
    { id: 'cover-information', number: 3, title: 'Application Details', description: 'Opportunity-specific information' },
    { id: 'review-submit', number: 4, title: 'Review & Submit', description: 'Final submission' }
  ]);

  // Computed properties
  canContinue = computed(() => {
    const current = this.currentStep();
    switch (current) {
      case 'select-opportunity':
        return !!this.selectedOpportunity();
      case 'review-profile':
        return this.profileCompleteness() >= 70; // Minimum 70% complete
      case 'cover-information':
        return this.isCoverInformationValid();
      case 'review-submit':
        return true;
      default:
        return false;
    }
  });

  ngOnInit() {
    // Check if opportunity ID was passed in route
    const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
    
    if (opportunityId) {
      this.loadSpecificOpportunity(opportunityId);
    } else {
      this.loadAvailableOpportunities();
    }
    // Load user's existing profile data
    this.loadUserProfile();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadAvailableOpportunities() {
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

  private loadSpecificOpportunity(opportunityId: string) {
    this.isLoading.set(true);
    this.opportunitiesService.getOpportunityById(opportunityId).subscribe({
      next: (opportunity) => {
        if (opportunity) {
          this.selectedOpportunity.set(opportunity);
          this.initializeCoverInformation(opportunity);
          this.currentStep.set('review-profile'); // Skip opportunity selection
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

 private loadUserProfile() {
    // Load both local and backend data
    const localProfile = this.profileService.data();
    
    // Get backend data and calculate real completion
    this.fundingApplicationBackendService.loadSavedProfile().subscribe({
      next: (backendProfile) => {
        const mergedProfile = this.mergeProfileData(localProfile, backendProfile);
        this.userProfile.set(mergedProfile);
        this.profileCompleteness.set(this.calculateRealCompletion(mergedProfile));
      },
      error: () => {
        // Fallback to local data if backend fails
        this.userProfile.set(localProfile);
        this.profileCompleteness.set(this.calculateRealCompletion(localProfile));
      }
    });
  }

  private mergeProfileData(localProfile: any, backendProfile: any): any {
    // Simple merge - backend takes priority if it exists
    return {
      companyInfo: backendProfile.companyInfo || localProfile.companyInfo,
      supportingDocuments: backendProfile.supportingDocuments || localProfile.supportingDocuments,
      businessAssessment: backendProfile.businessAssessment || localProfile.businessAssessment,
      swotAnalysis: backendProfile.swotAnalysis || localProfile.swotAnalysis,
      managementStructure: backendProfile.managementStructure || localProfile.managementStructure,
      businessStrategy: backendProfile.businessStrategy || localProfile.businessStrategy,
      financialProfile: backendProfile.financialProfile || localProfile.financialProfile
    };
  }

  private calculateRealCompletion(profile: any): number {
    let completedSections = 0;
    const totalSections = 7;

    // Company Info - check required fields
    if (profile.companyInfo?.companyName && profile.companyInfo?.registrationNumber && 
        profile.companyInfo?.industryType && profile.companyInfo?.foundingYear) {
      completedSections++;
    }

    // Supporting Documents - use existing validator
    if (profile.supportingDocuments) {
      try {
        // Use the DocumentValidator from the models if available
        const hasRequiredDocs = profile.supportingDocuments.companyProfile && 
                               profile.supportingDocuments.currentYearFinancials &&
                               profile.supportingDocuments.financialProjections;
        if (hasRequiredDocs) completedSections++;
      } catch {
        // Fallback: just check if any documents exist
        if (Object.keys(profile.supportingDocuments).length > 0) completedSections++;
      }
    }

    // Business Assessment
    if (profile.businessAssessment?.businessModel && profile.businessAssessment?.valueProposition && 
        profile.businessAssessment?.targetMarkets?.length > 0) {
      completedSections++;
    }

    // SWOT Analysis - minimum 2 items each
    if (profile.swotAnalysis?.strengths?.length >= 2 && profile.swotAnalysis?.weaknesses?.length >= 2 &&
        profile.swotAnalysis?.opportunities?.length >= 2 && profile.swotAnalysis?.threats?.length >= 2) {
      completedSections++;
    }

    // Management Structure - at least 1 member
    if (profile.managementStructure?.executiveTeam?.length >= 1 || 
        profile.managementStructure?.managementTeam?.length >= 1) {
      completedSections++;
    }

    // Business Strategy
    if (profile.businessStrategy?.executiveSummary && profile.businessStrategy?.missionStatement && 
        profile.businessStrategy?.fundingRequirements) {
      completedSections++;
    }

    // Financial Profile
    if (profile.financialProfile?.monthlyRevenue !== undefined && 
        profile.financialProfile?.monthlyCosts !== undefined && 
        profile.financialProfile?.currentAssets !== undefined) {
      completedSections++;
    }

    return Math.round((completedSections / totalSections) * 100);
  }

  // ===============================
  // OPPORTUNITY SELECTION
  // ===============================

  selectOpportunity(opportunity: FundingOpportunity) {
    this.selectedOpportunity.set(opportunity);
    this.initializeCoverInformation(opportunity);
  }

  private initializeCoverInformation(opportunity: FundingOpportunity) {
    // Pre-populate with smart defaults
    this.coverInformation.set({
      requestedAmount: opportunity.minInvestment.toString(),
      purposeStatement: '',
      useOfFunds: opportunity.useOfFunds || '',
      timeline: '',
      opportunityAlignment: ''
    });
  }

  private calculateProfileCompleteness(profile: Partial<ProfileData>) {
    const requiredSections = [
      profile.personalInfo,
      profile.businessInfo,
      profile.financialInfo,
      profile.fundingInfo,
      profile.documents
    ];
    
    const completedSections = requiredSections.filter(section => 
      section && Object.keys(section).length > 0
    ).length;
    
    const completeness = Math.round((completedSections / requiredSections.length) * 100);
    this.profileCompleteness.set(completeness);
  }

 
  updateCoverInformation(field: keyof CoverInformation, value: string) {
    this.coverInformation.update(current => ({
      ...current,
      [field]: value
    }));
  }

  onRequestedAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateCoverInformation('requestedAmount', target.value);
  }

  onPurposeStatementChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateCoverInformation('purposeStatement', target.value);
  }

  onUseOfFundsChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateCoverInformation('useOfFunds', target.value);
  }

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateCoverInformation('timeline', target.value);
  }

  onOpportunityAlignmentChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateCoverInformation('opportunityAlignment', target.value);
  }

  // ===============================
  // VALIDATION
  // ===============================

  private isCoverInformationValid(): boolean {
    const cover = this.coverInformation();
    const opportunity = this.selectedOpportunity();
    
    if (!cover.requestedAmount || !cover.purposeStatement || !cover.useOfFunds) {
      return false;
    }

    // Check amount is within opportunity range
    if (opportunity) {
      const amount = parseFloat(cover.requestedAmount);
      if (amount < opportunity.minInvestment || amount > opportunity.maxInvestment) {
        return false;
      }
    }

    return true;
  }

  // ===============================
  // NAVIGATION
  // ===============================

  nextStep() {
    const current = this.currentStep();
    const stepOrder = ['select-opportunity', 'review-profile', 'cover-information', 'review-submit'];
    const currentIndex = stepOrder.indexOf(current);
    
    if (currentIndex < stepOrder.length - 1) {
      this.currentStep.set(stepOrder[currentIndex + 1] as any);
    }
  }

  previousStep() {
    const current = this.currentStep();
    const stepOrder = ['select-opportunity', 'review-profile', 'cover-information', 'review-submit'];
    const currentIndex = stepOrder.indexOf(current);
    
    if (currentIndex > 0) {
      this.currentStep.set(stepOrder[currentIndex - 1] as any);
    }
  }

  goBack() {
    this.location.back();
  }

  // ===============================
  // ACTIONS
  // ===============================

  saveDraft() {
    this.isSaving.set(true);
    
    // TODO: Implement save draft functionality
    // This should save the current state without submitting
    setTimeout(() => {
      this.isSaving.set(false);
      console.log('Draft saved:', {
        opportunity: this.selectedOpportunity()?.id,
        coverInformation: this.coverInformation()
      });
    }, 1000);
  }

  submitApplication() {
    if (!this.selectedOpportunity()) {
      this.error.set('No opportunity selected');
      return;
    }

    this.isSubmitting.set(true);
    
    const applicationData = {
      opportunityId: this.selectedOpportunity()!.id,
      profileData: this.userProfile(),
      coverInformation: this.coverInformation(),
      submittedAt: new Date()
    };

    // TODO: Submit to backend service
    setTimeout(() => {
      this.isSubmitting.set(false);
      console.log('Application submitted:', applicationData);
      
      // Navigate to applications list or success page
      this.router.navigate(['/applications'], {
        queryParams: { submitted: 'true' }
      });
    }, 2000);
  }

  editProfile() {
    // Navigate to profile editing
    this.router.navigate(['/profile']);
  }

  // ===============================
  // UI HELPERS
  // ===============================

  getStepClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
    const current = this.currentStep();
    const stepOrder = ['select-opportunity', 'review-profile', 'cover-information', 'review-submit'];
    const currentIndex = stepOrder.indexOf(current);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-500`;
    }
  }

  getStepTextClasses(stepId: string): string {
    const current = this.currentStep();
    const stepOrder = ['select-opportunity', 'review-profile', 'cover-information', 'review-submit'];
    const currentIndex = stepOrder.indexOf(current);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex <= currentIndex) {
      return 'text-sm font-medium text-neutral-900';
    } else {
      return 'text-sm font-medium text-neutral-500';
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

  getAmountValidationMessage(): string {
    const opportunity = this.selectedOpportunity();
    const amount = parseFloat(this.coverInformation().requestedAmount);
    
    if (!opportunity) return '';
    
    if (amount < opportunity.minInvestment) {
      return `Minimum amount is ${this.formatCurrency(opportunity.minInvestment)}`;
    }
    
    if (amount > opportunity.maxInvestment) {
      return `Maximum amount is ${this.formatCurrency(opportunity.maxInvestment)}`;
    }
    
    return '';
  }

  getProfileCompletionColor(): string {
    const completeness = this.profileCompleteness();
    if (completeness >= 90) return 'text-green-600';
    if (completeness >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  // ===============================
  // UTILITY METHODS (Added to fix template errors)
  // ===============================

  /**
   * Converts string to number using parseFloat
   * Made available to template
   */
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  /**
   * Get organization name for an opportunity
   * For now returns a placeholder until organization data is properly loaded
   */
  getOrganizationName(opportunity: FundingOpportunity): string {
    // TODO: Replace with actual organization lookup by organizationId
    // This could involve:
    // 1. Loading organization data alongside opportunities
    // 2. Creating a service to fetch organization names
    // 3. Caching organization data
    
    return `Organization ${opportunity.organizationId}`;
  }
}

