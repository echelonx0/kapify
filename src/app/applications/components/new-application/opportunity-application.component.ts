 
// src/app/applications/components/new-application/opportunity-application.component.ts - CLEANED VERSION
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from '../../../shared/components';
import { LucideAngularModule, ArrowLeft, Building, DollarSign, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-angular';
import { Location } from '@angular/common';
import { SMEOpportunitiesService } from '../../../funding/services/opportunities.service';
import { FundingOpportunity } from '../../../shared/models/funder.models';
import { FundingProfileBackendService } from '../../services/funding-profile-backend.service';
import { GlobalProfileValidationService } from '../../../shared/services/global-profile-validation.service';

interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

interface ApplicationStep {
  id: string;
  number: number;
  title: string;
  description: string;
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
  private opportunitiesService = inject(SMEOpportunitiesService);
  private fundingApplicationBackendService = inject(FundingProfileBackendService);
  private profileValidationService = inject(GlobalProfileValidationService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  ClockIcon = Clock;

  // State - SIMPLIFIED, NO PROFILE VALIDATION
  currentStep = signal<'select-opportunity' | 'application-details' | 'review-submit'>('select-opportunity');
  isLoading = signal(false);
  isSaving = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Data
  availableOpportunities = signal<FundingOpportunity[]>([]);
  selectedOpportunity = signal<FundingOpportunity | null>(null);
  coverInformation = signal<CoverInformation>({
    requestedAmount: '',
    purposeStatement: '',
    useOfFunds: '',
    timeline: '',
    opportunityAlignment: ''
  });

  // Steps configuration - SIMPLIFIED
  steps = signal<ApplicationStep[]>([
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
      description: 'Provide application-specific information'
    },
    {
      id: 'review-submit',
      number: 3,
      title: 'Review & Submit',
      description: 'Final review and submission'
    }
  ]);

  // Computed properties
  canContinue = computed(() => {
    switch (this.currentStep()) {
      case 'select-opportunity':
        return !!this.selectedOpportunity();
      case 'application-details':
        return this.isApplicationDetailsValid();
      case 'review-submit':
        return true;
      default:
        return false;
    }
  });

  // Profile completion from global service - READ ONLY, NO VALIDATION UI
  profileCompletion = computed(() => this.profileValidationService.completion());

  ngOnInit() {
    // Check if opportunity ID was passed in route
    const opportunityId = this.route.snapshot.paramMap.get('opportunityId');
    
    if (opportunityId) {
      this.loadSpecificOpportunity(opportunityId);
    } else {
      this.loadAvailableOpportunities();
    }
  }

  // ===============================
  // DATA LOADING - SIMPLIFIED
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
          this.currentStep.set('application-details'); // Skip opportunity selection
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

  private initializeCoverInformation(opportunity: FundingOpportunity) {
    this.coverInformation.update(current => ({
      ...current,
      requestedAmount: opportunity.minInvestment?.toString() || '',
      timeline: 'Within 3 months',
      opportunityAlignment: `This opportunity aligns with our business goals for ${opportunity.fundingType} funding.`
    }));
  }

  // ===============================
  // STEP NAVIGATION - SIMPLIFIED
  // ===============================

  nextStep() {
    const current = this.currentStep();
    
    if (current === 'select-opportunity' && this.selectedOpportunity()) {
      this.currentStep.set('application-details');
    } else if (current === 'application-details' && this.isApplicationDetailsValid()) {
      this.currentStep.set('review-submit');
    }
  }

  previousStep() {
    const current = this.currentStep();
    
    if (current === 'review-submit') {
      this.currentStep.set('application-details');
    } else if (current === 'application-details') {
      this.currentStep.set('select-opportunity');
    }
  }

  goToStep(stepId: string) {
    // Validate if user can navigate to this step
    if (stepId === 'select-opportunity' || 
        (stepId === 'application-details' && this.selectedOpportunity()) ||
        (stepId === 'review-submit' && this.selectedOpportunity() && this.isApplicationDetailsValid())) {
      this.currentStep.set(stepId as any);
    }
  }

  // ===============================
  // FORM VALIDATION - APPLICATION ONLY
  // ===============================

  private isApplicationDetailsValid(): boolean {
    const info = this.coverInformation();
    const opportunity = this.selectedOpportunity();
    
    if (!info.requestedAmount || !info.purposeStatement || !info.useOfFunds) {
      return false;
    }

    // Validate amount is within range
    const amount = parseFloat(info.requestedAmount);
    if (opportunity) {
      return amount >= opportunity.minInvestment && amount <= opportunity.maxInvestment;
    }

    return true;
  }

  getAmountValidationMessage(): string | null {
    const info = this.coverInformation();
    const opportunity = this.selectedOpportunity();
    
    if (!info.requestedAmount || !opportunity) {
      return null;
    }

    const amount = parseFloat(info.requestedAmount);
    if (isNaN(amount)) {
      return 'Please enter a valid amount';
    }

    if (amount < opportunity.minInvestment) {
      return `Amount must be at least ${this.formatCurrency(opportunity.minInvestment)}`;
    }

    if (amount > opportunity.maxInvestment) {
      return `Amount cannot exceed ${this.formatCurrency(opportunity.maxInvestment)}`;
    }

    return null;
  }

  // ===============================
  // EVENT HANDLERS - SIMPLIFIED
  // ===============================

  selectOpportunity(opportunity: FundingOpportunity) {
    this.selectedOpportunity.set(opportunity);
    this.initializeCoverInformation(opportunity);
  }

  // Form input handlers
  onRequestedAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.coverInformation.update(current => ({
      ...current,
      requestedAmount: target.value
    }));
  }

  onPurposeStatementChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.coverInformation.update(current => ({
      ...current,
      purposeStatement: target.value
    }));
  }

  onUseOfFundsChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.coverInformation.update(current => ({
      ...current,
      useOfFunds: target.value
    }));
  }

  onTimelineChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.coverInformation.update(current => ({
      ...current,
      timeline: target.value
    }));
  }

  onOpportunityAlignmentChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.coverInformation.update(current => ({
      ...current,
      opportunityAlignment: target.value
    }));
  }

  // ===============================
  // ACTIONS - SIMPLIFIED
  // ===============================

  async saveDraft() {
    if (!this.selectedOpportunity()) return;

    this.isSaving.set(true);
    try {
      // Save draft to localStorage for now
      const draftData = {
        opportunityId: this.selectedOpportunity()!.id,
        coverInformation: this.coverInformation(),
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('application_draft', JSON.stringify(draftData));
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async submitApplication() {
    if (!this.selectedOpportunity() || !this.isApplicationDetailsValid()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      // Prepare application data
      const applicationData = {
        opportunityId: this.selectedOpportunity()!.id,
        coverInformation: this.coverInformation(),
        profileCompletion: this.profileCompletion(), // Include completion percentage
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to success page
      this.router.navigate(['/applications/submitted'], {
        queryParams: { 
          opportunityId: this.selectedOpportunity()!.id,
          applicationId: `app_${Date.now()}`
        }
      });

    } catch (error) {
      this.error.set('Failed to submit application');
      console.error('Submit application error:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack() {
    this.location.back();
  }

  // Computed properties for better template handling
  requestedAmountAsNumber = computed(() => {
    const amount = this.coverInformation().requestedAmount;
    return amount ? parseFloat(amount) : 0;
  });

  // ===============================
  // UI HELPERS - SIMPLIFIED
  // ===============================

  getStepClasses(stepId: string): string {
    const isActive = this.currentStep() === stepId;
    const step = this.steps().find(s => s.id === stepId);
    const stepIndex = this.steps().findIndex(s => s.id === stepId);
    const currentIndex = this.steps().findIndex(s => s.id === this.currentStep());
    const isCompleted = stepIndex < currentIndex;

    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';

    if (isCompleted) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (isActive) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-600`;
    }
  }

  getStepTextClasses(stepId: string): string {
    const isActive = this.currentStep() === stepId;
    return isActive ? 'font-medium text-primary-600' : 'text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  

  getOrganizationName(opportunity: FundingOpportunity): string {
     return 'Private Funder';
  }
}