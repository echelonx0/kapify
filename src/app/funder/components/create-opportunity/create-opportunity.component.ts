// // src/app/funder/components/opportunity-form.component.ts
// import { Component, inject, signal, OnInit, OnDestroy, effect, computed } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';
// import { Subject, takeUntil, debounceTime, distinctUntilChanged, Observable, switchMap } from 'rxjs';
// import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Check, Eye, HelpCircle, Lightbulb, TrendingUp, Copy, Calculator, Sparkles, Save, ArrowRight, PieChart, RefreshCw, DollarSignIcon, FileTextIcon, SettingsIcon, TargetIcon, UsersIcon, ClockIcon, AlertCircleIcon } from 'lucide-angular';
// import { Location } from '@angular/common';
// import { FundingOpportunity } from '../../../shared/models/funder.models';
// import { trigger, transition, style, animate } from '@angular/animations';
// import { AiAssistantComponent } from '../../../ai/ai-assistant/ai-assistant.component'; 
// import { FundingOpportunityService } from '../../../funding/services/funding-opportunity.service';
// import { ProfileManagementService } from '../../../shared/services/profile-management.service';
 
// // FIX 1: Import the missing onboarding service and types
// import { FunderOnboardingService, OnboardingState } from '../../services/funder-onboarding.service';

// interface OpportunityFormData {
//   // Basic details
//   title: string;
//   description: string;
//   shortDescription: string;

//     // NEW: Media & Branding fields
//   fundingOpportunityImageUrl: string;
//   fundingOpportunityVideoUrl: string;
//   funderOrganizationName: string;
//   funderOrganizationLogoUrl: string;
  
//   // Investment terms
//   offerAmount: string;
//   minInvestment: string;
//   maxInvestment: string;
//   currency: string;
//   fundingType: 'debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant' | '';
  
//   // Specific terms
//   interestRate: string;
//   equityOffered: string;
//   repaymentTerms: string;
//   securityRequired: string;
  
//   // Deal specifics
//   useOfFunds: string;
//   investmentStructure: string;
//   expectedReturns: string;
//   investmentHorizon: string;
//   exitStrategy: string;
  
//   // Process
//   applicationDeadline: string;
//   decisionTimeframe: string;
  
//   // Eligibility
//   targetIndustries: string[];
//   businessStages: string[];
//   minRevenue: string;
//   maxRevenue: string;
//   minYearsOperation: string;
//   geographicRestrictions: string[];
//   requiresCollateral: boolean;
  
//   // Availability
//   totalAvailable: string;
//   maxApplications: string;
  
//   // Settings
//   autoMatch: boolean;
//   isPublic: boolean;
// }

// interface ValidationError {
//   field: string;
//   message: string;
//   type: 'error' | 'warning';
// }

// interface Step {
//   id: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review';
//   icon: any;
//   title: string;
//   description: string;
// }

// @Component({
//   selector: 'app-opportunity-form',
//   standalone: true,
//   imports: [
//     FormsModule,
//     CommonModule,
//     LucideAngularModule,
//     AiAssistantComponent
//   ],
//   animations: [
//     trigger('stepTransition', [
//       transition(':enter', [
//         style({ opacity: 0, transform: 'translateX(20px)' }),
//         animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
//       ]),
//       transition(':leave', [
//         animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
//       ])
//     ])
//   ],
//   templateUrl: 'create-opportunity.component.html'
// })
// export class CreateOpportunityComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();
//   private localAutoSaveSubject = new Subject<OpportunityFormData>();
//   private opportunityService = inject(FundingOpportunityService);
//   private route = inject(ActivatedRoute);
//   private profileService = inject(ProfileManagementService);
//   private location = inject(Location);
  
//   // FIX 2: Inject the onboarding service (same as dashboard)
//   private onboardingService = inject(FunderOnboardingService);
 
//   // FIX 3: Add loading states for organization data
//   organizationLoading = signal(true);
//   organizationError = signal<string | null>(null);
//   onboardingState = signal<OnboardingState | null>(null);

//   // Computed property to get organization ID safely
//   organizationId = computed(() => this.onboardingState()?.organization?.id || null);
  
//   // Icons
//   ArrowLeftIcon = ArrowLeft;
//   TargetIcon = Target;
//   DollarSignIcon = DollarSign;
//   UsersIcon = Users;
//   SettingsIcon = Settings;
//   FileTextIcon = FileText;
//   CheckIcon = Check;
//   EyeIcon = Eye;
//   HelpCircleIcon = HelpCircle;
//   LightbulbIcon = Lightbulb;
//   TrendingUpIcon = TrendingUp;
//   CopyIcon = Copy;
//   CalculatorIcon = Calculator;
//   SparklesIcon = Sparkles;
//   SaveIcon = Save;
//   ArrowRightIcon = ArrowRight;
//   PieChartIcon = PieChart;
//   RefreshCwIcon = RefreshCw;
//   ClockIcon = ClockIcon;
//   AlertCircleIcon = AlertCircleIcon;

//   // Form state
//   currentStep = signal<'basic' | 'terms' | 'eligibility' | 'settings' | 'review'>('basic');
//   isLoading = signal(false);
//   lastSavedAt = signal<string | null>(null);
//   overallCompletion = signal(0);
//   hasUnsavedChanges = signal(false);
//   lastLocalSave = signal<string | null>(null);
//   mode = signal<'create' | 'edit'>('create');
//   opportunityId = signal<string | null>(null);

//   // Validation state
//   validationErrors = signal<ValidationError[]>([]);
//   publishError = signal<string | null>(null);

//   // Use service state for database operations
//   get isSaving() { return this.opportunityService.isSaving; }
//   get isPublishing() { return this.opportunityService.isPublishing; }

//   // Section completion tracking
//   sectionCompletions = signal<Record<string, number>>({
//     basic: 0,
//     terms: 0,
//     eligibility: 0,
//     settings: 0
//   });

//   // Form data with proper initial values
//   formData = signal<OpportunityFormData>({
//     title: '',
//     description: '',
//     shortDescription: '',
//     fundingOpportunityImageUrl: '',
//     fundingOpportunityVideoUrl: '',
//     funderOrganizationName: '',
//     funderOrganizationLogoUrl: '', 
//     offerAmount: '',
//     minInvestment: '',
//     maxInvestment: '',
//     currency: 'ZAR',
//     fundingType: '',
//     interestRate: '',
//     equityOffered: '',
//     repaymentTerms: '',
//     securityRequired: '',
//     useOfFunds: '',
//     investmentStructure: '',
//     expectedReturns: '',
//     investmentHorizon: '',
//     exitStrategy: '',
//     applicationDeadline: '',
//     decisionTimeframe: '30',
//     targetIndustries: [],
//     businessStages: [],
//     minRevenue: '',
//     maxRevenue: '',
//     minYearsOperation: '',
//     geographicRestrictions: [],
//     requiresCollateral: false,
//     totalAvailable: '',
//     maxApplications: '',
//     autoMatch: true,
//     isPublic: true
//   });

//   // Computed validation state
//   currentStepErrors = computed(() => {
//     const current = this.currentStep();
//     return this.validationErrors().filter(error => this.getFieldStep(error.field) === current);
//   });

//   hasCurrentStepErrors = computed(() => this.currentStepErrors().length > 0);

//   // FIX 4: Add computed property to check if we can proceed
//   canProceed = computed(() => {
//     return !this.organizationLoading() && !!this.organizationId();
//   });

//   // Steps configuration
//   steps = signal<Step[]>([
//     { id: 'basic', icon: this.TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
//     { id: 'terms', icon: this.DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
//     { id: 'eligibility', icon: this.UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
//     { id: 'settings', icon: this.SettingsIcon, title: 'Settings', description: 'Visibility & process' },
//     { id: 'review', icon: this.FileTextIcon, title: 'Review', description: 'Publish opportunity' }
//   ]);

//   // Options data
//   timeframes = [
//     { value: '7', label: '7 days', description: 'Fast track' },
//     { value: '30', label: '30 days', description: 'Standard' },
//     { value: '60', label: '60 days', description: 'Extended' },
//     { value: '90', label: '90 days', description: 'Comprehensive' }
//   ];

//   targetIndustries = [
//     { value: 'technology', label: 'Technology' },
//     { value: 'finance', label: 'Finance' },
//     { value: 'healthcare', label: 'Healthcare' },
//     { value: 'manufacturing', label: 'Manufacturing' },
//     { value: 'retail', label: 'Retail' },
//     { value: 'agriculture', label: 'Agriculture' }
//   ];

//   businessStages = [
//     { value: 'startup', label: 'Startup' },
//     { value: 'early-stage', label: 'Early Stage' },
//     { value: 'growth', label: 'Growth' },
//     { value: 'expansion', label: 'Expansion' },
//     { value: 'mature', label: 'Mature' }
//   ];

//   constructor(private router: Router) {
//     // Initialize effects in constructor where injection context is available
//     this.initializeEffects();
//   }

//   // FIX 5: Completely rewrite ngOnInit to load organization data first
//   ngOnInit() {
//     console.log('=== CREATE OPPORTUNITY COMPONENT INIT ===');
    
//     // Start loading organization data immediately
//     this.loadOrganizationData();
    
//     // Set up subscriptions
//     this.setupSubscriptions();
    
//     // Detect mode and setup auto-save
//     this.detectMode();
//     this.setupLocalAutoSave();
    
//     // Load form data only after organization is available
//     // This will be handled in setupSubscriptions when onboardingState changes
//   }

//   // FIX 6: New method to load organization data (copied from dashboard pattern)
//   private loadOrganizationData() {
//     console.log('Loading organization data...');
//     this.organizationLoading.set(true);
//     this.organizationError.set(null);
    
//     // Load onboarding status (same as dashboard)
//     this.onboardingService.checkOnboardingStatus().subscribe({
//       next: () => {
//         console.log('Onboarding status loaded');
//       },
//       error: (error) => {
//         console.error('Failed to load onboarding status:', error);
//         this.organizationError.set('Failed to load organization data');
//         this.organizationLoading.set(false);
//       }
//     });
//   }

//   // FIX 7: New method to setup subscriptions (copied from dashboard pattern)
//   private setupSubscriptions() {
//     // Subscribe to onboarding state (same as dashboard)
//     this.onboardingService.onboardingState$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(state => {
//         console.log('Onboarding state received:', state);
//         this.onboardingState.set(state);
        
//         if (state?.organization?.id) {
//           console.log('Organization found:', state.organization.id);
//           this.organizationLoading.set(false);
//           this.organizationError.set(null);
          
//           // Now that we have organization data, load form data
//           this.loadFormDataAfterOrgLoad();
//         } else {
//           console.warn('No organization found in state');
//           this.organizationLoading.set(false);
//           this.organizationError.set(
//             'Organization setup required to create funding opportunities.'
//           );
//         }
//       });
//   }

//   // FIX 8: New method to load form data after organization is available
//   private loadFormDataAfterOrgLoad() {
//     if (this.mode() === 'edit') {
//       this.loadOpportunityForEdit();
//     } else {
//       this.loadDraftWithMerge();
//     }
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // FIX 9: Update validateForm to use the computed organizationId
//   private validateForm(data: OpportunityFormData): void {
//     const errors: ValidationError[] = [];

//     const orgId = this.organizationId();
//     if (!orgId) {
//       errors.push({ 
//         field: 'organization', 
//         message: 'Organization setup is required to create opportunities', 
//         type: 'error' 
//       });
//     }

//     // Basic validation
//     if (!data.title.trim()) {
//       errors.push({ field: 'title', message: 'Title is required', type: 'error' });
//     } else if (data.title.length < 5) {
//       errors.push({ field: 'title', message: 'Title must be at least 5 characters', type: 'warning' });
//     }

//     if (!data.shortDescription.trim()) {
//       errors.push({ field: 'shortDescription', message: 'Short description is required', type: 'error' });
//     }

//     if (!data.description.trim()) {
//       errors.push({ field: 'description', message: 'Description is required', type: 'error' });
//     }

//     // URL validations
//     if (data.fundingOpportunityImageUrl && !this.validateUrl(data.fundingOpportunityImageUrl)) {
//       errors.push({ field: 'fundingOpportunityImageUrl', message: 'Please enter a valid image URL', type: 'error' });
//     }

//     if (data.fundingOpportunityVideoUrl && !this.validateUrl(data.fundingOpportunityVideoUrl)) {
//       errors.push({ field: 'fundingOpportunityVideoUrl', message: 'Please enter a valid video URL', type: 'error' });
//     }

//     if (data.funderOrganizationLogoUrl && !this.validateUrl(data.funderOrganizationLogoUrl)) {
//       errors.push({ field: 'funderOrganizationLogoUrl', message: 'Please enter a valid logo URL', type: 'error' });
//     }

//     if (data.funderOrganizationName && data.funderOrganizationName.length > 100) {
//       errors.push({ field: 'funderOrganizationName', message: 'Organization name should be 100 characters or less', type: 'warning' });
//     }

//     // Investment terms validation
//     if (data.fundingType && this.isTermsStepActive()) {
//       errors.push(...this.validateInvestmentAmounts(data));
//     }

//     // Eligibility validation
//     if (data.minRevenue && data.maxRevenue) {
//       const minRev = this.parseNumberValue(data.minRevenue);
//       const maxRev = this.parseNumberValue(data.maxRevenue);
//       if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
//         errors.push({ 
//           field: 'maxRevenue', 
//           message: 'Maximum revenue must be greater than minimum revenue', 
//           type: 'error' 
//         });
//       }
//     }

//     this.validationErrors.set(errors);
//   }

//   // FIX 10: Update buildOpportunityData to use computed organizationId
//   private buildOpportunityData(): Observable<Partial<FundingOpportunity>> {
//     return new Observable(observer => {
//       try {
//         const data = this.formData();
        
//         // Use the computed organizationId
//         const orgId = this.organizationId();
        
//         if (!orgId) {
//           observer.error(new Error('No organization found. Please complete your organization setup before creating opportunities.'));
//           return;
//         }

//         // Validate required fields before building
//         const validationError = this.validateRequiredFields(data);
//         if (validationError) {
//           observer.error(new Error(validationError));
//           return;
//         }

//         // Convert and validate amounts
//         const offerAmount = Math.max(0, this.parseNumberValue(data.offerAmount));
//         const minInvestment = this.parseNumberValue(data.minInvestment);
//         const maxInvestment = this.parseNumberValue(data.maxInvestment);
//         const totalAvailable = Math.max(0, this.parseNumberValue(data.totalAvailable));
        
//         // Business logic validation
//         if (minInvestment > 0 && maxInvestment > 0 && maxInvestment < minInvestment) {
//           observer.error(new Error('Maximum investment cannot be less than minimum investment.'));
//           return;
//         }

//         if (offerAmount > totalAvailable && totalAvailable > 0) {
//           observer.error(new Error('Typical investment cannot exceed total available funding.'));
//           return;
//         }

//         // Build the opportunity data
//         const opportunityData: Partial<FundingOpportunity> = {
//           title: data.title.trim(),
//           description: data.description.trim(),
//           shortDescription: data.shortDescription.trim(),
//           fundingOpportunityImageUrl: data.fundingOpportunityImageUrl?.trim() || undefined,
//           fundingOpportunityVideoUrl: data.fundingOpportunityVideoUrl?.trim() || undefined,
//           funderOrganizationName: data.funderOrganizationName?.trim() || undefined,
//           funderOrganizationLogoUrl: data.funderOrganizationLogoUrl?.trim() || undefined,
//           fundId: orgId,
//           organizationId: orgId,
//           offerAmount,
//           minInvestment: minInvestment || undefined,
//           maxInvestment: maxInvestment > 0 && minInvestment > 0 ? 
//             Math.max(maxInvestment, minInvestment) : maxInvestment || undefined,
//           currency: data.currency,
//           fundingType: data.fundingType as any,
//           interestRate: data.interestRate ? Number(data.interestRate) : undefined,
//           equityOffered: data.equityOffered ? Number(data.equityOffered) : undefined,
//           repaymentTerms: data.repaymentTerms?.trim() || undefined,
//           securityRequired: data.securityRequired?.trim() || undefined,
//           useOfFunds: data.useOfFunds?.trim(),
//           investmentStructure: data.investmentStructure?.trim(),
//           expectedReturns: data.expectedReturns ? Number(data.expectedReturns) : undefined,
//           investmentHorizon: data.investmentHorizon ? Number(data.investmentHorizon) : undefined,
//           exitStrategy: data.exitStrategy?.trim() || undefined,
//           applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
//           decisionTimeframe: Math.max(1, Number(data.decisionTimeframe) || 30),
//           totalAvailable,
//           maxApplications: data.maxApplications ? Math.max(1, this.parseNumberValue(data.maxApplications)) : undefined,
//           autoMatch: data.autoMatch,
//           eligibilityCriteria: {
//             industries: data.targetIndustries || [],
//             businessStages: data.businessStages || [],
//             minRevenue: data.minRevenue ? Math.max(0, this.parseNumberValue(data.minRevenue)) : undefined,
//             maxRevenue: data.maxRevenue ? Math.max(0, this.parseNumberValue(data.maxRevenue)) : undefined,
//             minYearsOperation: data.minYearsOperation ? Math.max(0, Number(data.minYearsOperation)) : undefined,
//             geographicRestrictions: data.geographicRestrictions?.length > 0 ? data.geographicRestrictions : undefined,
//             requiresCollateral: data.requiresCollateral,
//             excludeCriteria: []
//           },
//           status: 'draft',
//           currentApplications: 0,
//           viewCount: 0,
//           applicationCount: 0
//         };

//         observer.next(opportunityData);
//         observer.complete();

//       } catch (error: any) {
//         observer.error(new Error(`Failed to prepare opportunity data: ${error.message || 'Unknown error'}`));
//       }
//     });
//   }

//   // FIX 11: Update canPublish to use computed values
//   canPublish(): boolean {
//     if (this.isEditMode()) {
//       return true;
//     }
    
//     // Check if organization data is still loading
//     if (this.organizationLoading()) {
//       return false;
//     }
    
//     // Use computed organizationId
//     const orgId = this.organizationId();
//     if (!orgId) {
//       console.warn('Cannot publish: No organization ID found');
//       return false;
//     }
    
//     // Check for any critical errors
//     const criticalErrors = this.validationErrors().filter(error => error.type === 'error');
//     if (criticalErrors.length > 0) {
//       console.warn('Cannot publish: Critical validation errors found', criticalErrors);
//       return false;
//     }
    
//     // Check required fields
//     const data = this.formData();
//     const hasRequired = !!(
//       data.title.trim() && 
//       data.shortDescription.trim() && 
//       data.description.trim() &&
//       data.fundingType &&
//       data.totalAvailable &&
//       data.offerAmount &&
//       data.decisionTimeframe
//     );
    
//     if (!hasRequired) {
//       console.warn('Cannot publish: Required fields missing');
//     }
    
//     return hasRequired;
//   }

//   // FIX 12: Add method to navigate to organization setup
//   goToOrganizationSetup(): void {
//     this.router.navigate(['/funder/onboarding']);
//   }

//   // FIX 13: Add method to retry loading organization data
//   retryLoadOrganization(): void {
//     this.loadOrganizationData();
//   }

//   // FIX 14: Update getCurrentStepSubtitle to show organization status
//   getCurrentStepSubtitle(): string {
//     if (this.organizationLoading()) {
//       return 'Loading organization data...';
//     }
    
//     if (this.organizationError()) {
//       return 'Organization setup required before creating opportunities';
//     }

//     const subtitles = {
//       basic: 'Define the core details and add media to enhance your funding opportunity',
//       terms: 'Define the financial structure and investment parameters',
//       eligibility: 'Set criteria for who can apply',
//       settings: 'Configure visibility and application process',
//       review: 'Review your opportunity before publishing'
//     };
//     return subtitles[this.currentStep()] || '';
//   }

//   // Clear all errors method
//   clearErrors(): void {
//     this.publishError.set(null);
//     this.organizationError.set(null);
//     this.validationErrors.set([]);
//   }

//   // All other existing methods remain the same...
//   // (Including validation, form handling, navigation, etc.)
//   // I'll include the key ones that are referenced:

//   private validateInvestmentAmounts(data: OpportunityFormData): ValidationError[] {
//     const errors: ValidationError[] = [];
    
//     const offerAmount = this.parseNumberValue(data.offerAmount);
//     const minInvestment = this.parseNumberValue(data.minInvestment);
//     const maxInvestment = this.parseNumberValue(data.maxInvestment);
//     const totalAvailable = this.parseNumberValue(data.totalAvailable);

//     // Required field validations
//     if (!data.fundingType) {
//       errors.push({ field: 'fundingType', message: 'Funding type is required', type: 'error' });
//     }

//     if (offerAmount <= 0) {
//       errors.push({ field: 'offerAmount', message: 'Offer amount must be greater than 0', type: 'error' });
//     }

//     if (totalAvailable <= 0) {
//       errors.push({ field: 'totalAvailable', message: 'Total available must be greater than 0', type: 'error' });
//     }

//     // Investment range validation
//     if (minInvestment > 0 && maxInvestment > 0) {
//       if (maxInvestment < minInvestment) {
//         errors.push({ 
//           field: 'maxInvestment', 
//           message: 'Maximum investment must be greater than or equal to minimum investment', 
//           type: 'error' 
//         });
//       }
//     }

//     // Logical amount validations
//     if (offerAmount > 0 && totalAvailable > 0) {
//       if (offerAmount > totalAvailable) {
//         errors.push({ 
//           field: 'offerAmount', 
//           message: 'Offer amount cannot exceed total available funding', 
//           type: 'error' 
//         });
//       }
//     }

//     if (minInvestment > 0 && offerAmount > 0) {
//       if (minInvestment > offerAmount) {
//         errors.push({ 
//           field: 'minInvestment', 
//           message: 'Minimum investment cannot exceed the offer amount', 
//           type: 'warning' 
//         });
//       }
//     }

//     if (maxInvestment > 0 && totalAvailable > 0) {
//       if (maxInvestment > totalAvailable) {
//         errors.push({ 
//           field: 'maxInvestment', 
//           message: 'Maximum investment cannot exceed total available funding', 
//           type: 'warning' 
//         });
//       }
//     }

//     return errors;
//   }

//   private getFieldStep(fieldName: string): string {
//     const fieldStepMap: Record<string, string> = {
//       'title': 'basic',
//       'shortDescription': 'basic',
//       'description': 'basic',
//       'fundingOpportunityImageUrl': 'basic',
//       'fundingOpportunityVideoUrl': 'basic', 
//       'funderOrganizationName': 'basic',
//       'funderOrganizationLogoUrl': 'basic',
//       'fundingType': 'terms',
//       'offerAmount': 'terms',
//       'minInvestment': 'terms',
//       'maxInvestment': 'terms',
//       'totalAvailable': 'terms',
//       'interestRate': 'terms',
//       'equityOffered': 'terms',
//       'decisionTimeframe': 'terms',
//       'minRevenue': 'eligibility',
//       'maxRevenue': 'eligibility',
//       'minYearsOperation': 'eligibility',
//       'maxApplications': 'settings',
//       'applicationDeadline': 'settings'
//     };
//     return fieldStepMap[fieldName] || 'basic';
//   }

//   private parseNumberValue(value: string): number {
//     if (!value) return 0;
//     const cleaned = value.replace(/[,\s]/g, '');
//     return Number(cleaned) || 0;
//   }

//   private validateUrl(url: string): boolean {
//     if (!url) return true;
//     try {
//       const urlObj = new URL(url);
//       return ['http:', 'https:'].includes(urlObj.protocol);
//     } catch {
//       return false;
//     }
//   }

//   private isTermsStepActive(): boolean {
//     return this.currentStep() === 'terms' || this.getCurrentStepIndex() > 1;
//   }

//   private validateRequiredFields(data: OpportunityFormData): string | null {
//     if (!data.title.trim()) {
//       return 'Opportunity title is required.';
//     }
//     if (!data.shortDescription.trim()) {
//       return 'Short description is required.';
//     }
//     if (!data.description.trim()) {
//       return 'Full description is required.';
//     }
//     if (!data.fundingType) {
//       return 'Funding type must be selected.';
//     }
//     if (!data.totalAvailable || this.parseNumberValue(data.totalAvailable) <= 0) {
//       return 'Total available funding must be specified and greater than zero.';
//     }
//     if (!data.offerAmount || this.parseNumberValue(data.offerAmount) <= 0) {
//       return 'Typical investment amount must be specified and greater than zero.';
//     }
//     if (!data.decisionTimeframe) {
//       return 'Decision timeframe must be specified.';
//     }
//     return null;
//   }

//   private initializeEffects() {
//     // Auto-validate when form data changes
//     effect(() => {
//       const data = this.formData();
//       this.validateForm(data);
//     });

//     // Subscribe to service state changes
//     effect(() => {
//       const lastSaved = this.opportunityService.lastSavedAt();
//       if (lastSaved) {
//         this.lastSavedAt.set(lastSaved);
//         this.hasUnsavedChanges.set(false);
//       }
//     });

//     effect(() => {
//       const completion = this.opportunityService.overallCompletion();
//       this.overallCompletion.set(completion);
//     });

//     effect(() => {
//       const completions = this.opportunityService.sectionCompletions();
//       this.sectionCompletions.set({
//         basic: completions['basic-info'] || 0,
//         terms: completions['investment-terms'] || 0,
//         eligibility: completions['eligibility-criteria'] || 0,
//         settings: completions['settings'] || 0
//       });
//     });
//   }

//   private detectMode() {
//     const url = this.router.url;
//     const routeParams = this.route.snapshot.params;
    
//     if (url.includes('/edit') && routeParams['id']) {
//       this.mode.set('edit');
//       this.opportunityId.set(routeParams['id']);
//     } else {
//       this.mode.set('create');
//       this.opportunityId.set(null);
//     }
//   }

//   private setupLocalAutoSave() {
//     this.localAutoSaveSubject.pipe(
//       takeUntil(this.destroy$),
//       debounceTime(10000),
//       distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
//     ).subscribe(formData => {
//       this.saveToLocalStorage(formData);
//     });
//   }

//   private loadDraftWithMerge() {
//     this.isLoading.set(true);
    
//     this.opportunityService.loadDraftWithMerge()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success && response.draftData) {
//             this.populateFormFromDraft(response.draftData);
//             this.overallCompletion.set(response.completionPercentage);
//             if (response.lastSaved) {
//               this.lastSavedAt.set(response.lastSaved);
//             }
//             this.updateSectionCompletionsFromService();
//           }
//           this.isLoading.set(false);
//         },
//         error: (error) => {
//           console.error('Failed to load draft:', error);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private loadOpportunityForEdit() {
//     const oppId = this.opportunityId();
//     if (!oppId) {
//       this.router.navigate(['/funding/create-opportunity']);
//       return;
//     }

//     this.isLoading.set(true);
    
//     this.opportunityService.loadOpportunityForEdit(oppId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success && response.draftData) {
//             this.populateFormFromDraft(response.draftData);
//             this.overallCompletion.set(response.completionPercentage);
//             if (response.lastSaved) {
//               this.lastSavedAt.set(response.lastSaved);
//             }
//             this.updateSectionCompletionsFromService();
//           }
//           this.isLoading.set(false);
//         },
//         error: (error) => {
//           console.error('Failed to load opportunity for editing:', error);
//           this.isLoading.set(false);
//           this.router.navigate(['/funding/opportunities']);
//         }
//       });
//   }

//   private populateFormFromDraft(draftData: Partial<FundingOpportunity>) {
//     this.formData.update(current => ({
//       ...current,
//       title: draftData.title || '',
//       description: draftData.description || '',
//       shortDescription: draftData.shortDescription || '',
//       fundingOpportunityImageUrl: draftData.fundingOpportunityImageUrl || '',
//       fundingOpportunityVideoUrl: draftData.fundingOpportunityVideoUrl || '',
//       funderOrganizationName: draftData.funderOrganizationName || '',
//       funderOrganizationLogoUrl: draftData.funderOrganizationLogoUrl || '',
//       offerAmount: draftData.offerAmount?.toString() || '',
//       minInvestment: draftData.minInvestment?.toString() || '',
//       maxInvestment: draftData.maxInvestment?.toString() || '',
//       currency: draftData.currency || 'ZAR',
//       fundingType: draftData.fundingType || '',
//       interestRate: draftData.interestRate?.toString() || '',
//       equityOffered: draftData.equityOffered?.toString() || '',
//       repaymentTerms: draftData.repaymentTerms || '',
//       securityRequired: draftData.securityRequired || '',
//       useOfFunds: draftData.useOfFunds || '',
//       investmentStructure: draftData.investmentStructure || '',
//       expectedReturns: draftData.expectedReturns?.toString() || '',
//       investmentHorizon: draftData.investmentHorizon?.toString() || '',
//       exitStrategy: draftData.exitStrategy || '',
//       applicationDeadline: draftData.applicationDeadline?.toISOString().split('T')[0] || '',
//       decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
//       targetIndustries: draftData.eligibilityCriteria?.industries || [],
//       businessStages: draftData.eligibilityCriteria?.businessStages || [],
//       minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
//       maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
//       minYearsOperation: draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
//       geographicRestrictions: draftData.eligibilityCriteria?.geographicRestrictions || [],
//       requiresCollateral: draftData.eligibilityCriteria?.requiresCollateral || false,
//       totalAvailable: draftData.totalAvailable?.toString() || '',
//       maxApplications: draftData.maxApplications?.toString() || '',
//       autoMatch: draftData.autoMatch ?? true,
//       isPublic: true
//     }));
//   }

//   private updateSectionCompletionsFromService() {
//     const serviceCompletions = this.opportunityService.sectionCompletions();
//     this.sectionCompletions.set({
//       basic: serviceCompletions['basic-info'] || 0,
//       terms: serviceCompletions['investment-terms'] || 0,
//       eligibility: serviceCompletions['eligibility-criteria'] || 0,
//       settings: serviceCompletions['settings'] || 0
//     });
//   }

//   private saveToLocalStorage(formData: OpportunityFormData) {
//     try {
//       const saveData = {
//         formData,
//         lastSaved: new Date().toISOString(),
//         step: this.currentStep()
//       };
//       localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
//       this.lastLocalSave.set(saveData.lastSaved);
//       console.log('Auto-saved to local storage');
//     } catch (error) {
//       console.error('Failed to save to localStorage:', error);
//     }
//   }

//   // All other methods remain exactly the same...
//   // (navigation, form updates, publishing, etc.)

//   updateField(field: keyof OpportunityFormData, event: Event) {
//     const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
//     this.formData.update(data => ({
//       ...data,
//       [field]: target.value
//     }));
    
//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
//     const target = event.target as HTMLInputElement;
//     this.formData.update(data => ({
//       ...data,
//       [field]: target.checked
//     }));
    
//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
//     const target = event.target as HTMLInputElement;
//     const value = target.value;
//     const checked = target.checked;
    
//     this.formData.update(data => {
//       const currentArray = data[field] as string[];
//       let newArray: string[];
      
//       if (checked) {
//         newArray = [...currentArray, value];
//       } else {
//         newArray = currentArray.filter(item => item !== value);
//       }
      
//       return {
//         ...data,
//         [field]: newArray
//       };
//     });
    
//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   onNumberInput(field: keyof OpportunityFormData, event: Event): void {
//     const target = event.target as HTMLInputElement;
//     let value = target.value;
    
//     value = value.replace(/[^\d]/g, '');
//     const numValue = Number(value) || 0;
//     const formattedValue = numValue === 0 ? '' : this.formatNumberWithCommas(numValue);
    
//     target.value = formattedValue;
    
//     this.formData.update(data => ({
//       ...data,
//       [field]: value
//     }));
    
//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   formatNumberWithCommas(value: string | number): string {
//     if (!value) return '';
//     const numValue = typeof value === 'string' ? this.parseNumberValue(value) : value;
//     return new Intl.NumberFormat('en-ZA', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(numValue);
//   }

//   publishOpportunity() {
//     console.log('=== PUBLISH DEBUG START ===');
//     console.log('Organization loading:', this.organizationLoading());
//     console.log('Organization ID:', this.organizationId());
//     console.log('Can proceed:', this.canProceed());
    
//     this.publishError.set(null);
    
//     if (!this.canPublish()) {
//       this.publishError.set('Please complete all required fields before publishing.');
//       return;
//     }

//     if (this.mode() === 'edit') {
//       this.saveDraft();
//       return;
//     }

//     this.buildOpportunityData()
//       .pipe(
//         switchMap(opportunityData => {
//           console.log('Built data successfully:', opportunityData);
//           return this.opportunityService.publishOpportunity(opportunityData);
//         }),
//         takeUntil(this.destroy$)
//       )
//       .subscribe({
//         next: (response) => {
//           console.log('Opportunity published successfully:', response);
//           this.publishError.set(null);
//           this.clearLocalStorage();
//           this.router.navigate(['/funder/dashboard']);
//         },
//         error: (error) => {
//           console.error('Failed to publish opportunity:', error);
          
//           let errorMessage = 'Failed to publish opportunity. Please try again.';
          
//           if (error.message) {
//             if (error.message.includes('organization') || 
//                 error.message.includes('required') || 
//                 error.message.includes('investment') ||
//                 error.message.includes('funding')) {
//               errorMessage = error.message;
//             }
//           }
          
//           this.publishError.set(errorMessage);
//           window.scrollTo({ top: 0, behavior: 'smooth' });
//         }
//       });
//   }

//   saveDraft() {
//     this.publishError.set(null);
    
//     const orgId = this.organizationId();
//     if (!orgId) {
//       this.organizationError.set('No organization found. Please complete your organization setup first.');
//       return;
//     }

//     this.buildOpportunityData()
//       .pipe(
//         switchMap(opportunityData => {
//           if (this.mode() === 'edit') {
//             const oppId = this.opportunityId();
//             if (!oppId) {
//               throw new Error('No opportunity ID found for editing.');
//             }
//             return this.opportunityService.updateOpportunity(oppId, opportunityData);
//           } else {
//             return this.opportunityService.saveDraft(opportunityData, false);
//           }
//         }),
//         takeUntil(this.destroy$)
//       )
//       .subscribe({
//         next: (response) => {
//           console.log('Draft saved successfully');
//           this.hasUnsavedChanges.set(false);
//           this.clearLocalStorage();
//           this.publishError.set(null);
//         },
//         error: (error) => {
//           console.error('Failed to save draft:', error);
          
//           let errorMessage = 'Failed to save draft. Please try again.';
//           if (error.message && error.message.length < 100) {
//             errorMessage = error.message;
//           }
          
//           this.publishError.set(errorMessage);
//         }
//       });
//   }

//   private clearLocalStorage() {
//     try {
//       localStorage.removeItem('opportunity_draft');
//       this.lastLocalSave.set(null);
//     } catch (error) {
//       console.error('Failed to clear localStorage:', error);
//     }
//   }

//   nextStep() {
//     const current = this.currentStep();
//     const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
//     const currentIndex = steps.indexOf(current);
//     if (currentIndex < steps.length - 1) {
//       this.currentStep.set(steps[currentIndex + 1]);
//       this.localAutoSaveSubject.next(this.formData());
//     }
//   }

//   previousStep() {
//     const current = this.currentStep();
//     const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
//     const currentIndex = steps.indexOf(current);
//     if (currentIndex > 0) {
//       this.currentStep.set(steps[currentIndex - 1]);
//       this.localAutoSaveSubject.next(this.formData());
//     }
//   }

//   goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
//     const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
//     const currentIndex = steps.indexOf(this.currentStep());
//     const targetIndex = steps.indexOf(stepId);
    
//     if (targetIndex <= currentIndex + 1) {
//       this.currentStep.set(stepId);
//       this.localAutoSaveSubject.next(this.formData());
//     }
//   }

//   goBack() {
//     this.location.back();
//   }

//   getCurrentStepIndex(): number {
//     const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
//     return steps.indexOf(this.currentStep());
//   }

//   getProgressPercentage(): number {
//     const totalSteps = this.steps().length;
//     const currentIndex = this.getCurrentStepIndex();
//     return Math.round(((currentIndex + 1) / totalSteps) * 100);
//   }

//   getCompletionPercentage(): number {
//     return this.overallCompletion();
//   }

//   getCurrentStepIcon() {
//     const step = this.steps().find(s => s.id === this.currentStep());
//     return step?.icon || this.TargetIcon;
//   }

//   getCurrentStepTitle(): string {
//     const step = this.steps().find(s => s.id === this.currentStep());
//     return step?.title || '';
//   }

//   hasMediaContent(): boolean {
//     const data = this.formData();
//     return !!(data.fundingOpportunityImageUrl || 
//               data.fundingOpportunityVideoUrl || 
//               data.funderOrganizationName || 
//               data.funderOrganizationLogoUrl);
//   }

//   isEditMode(): boolean {
//     return this.mode() === 'edit';
//   }

//   isCreateMode(): boolean {
//     return this.mode() === 'create';
//   }

//   getPageTitle(): string {
//     return this.isEditMode() ? 'Edit Funding Opportunity' : 'Create Funding Opportunity';
//   }

//   getPageSubtitle(): string {
//     if (this.isEditMode()) {
//       return 'Update your opportunity details and save changes';
//     }
//     return 'Set up a new investment opportunity for SMEs with AI-powered optimization';
//   }

//   getPublishButtonText(): string {
//     return this.isEditMode() ? 'Save Changes' : 'Publish Opportunity';
//   }

//   getSaveButtonText(): string {
//     return this.isEditMode() ? 'Save Changes' : 'Save Draft';
//   }

//   getFieldError(fieldName: string): ValidationError | null {
//     return this.validationErrors().find(error => error.field === fieldName) || null;
//   }

//   hasFieldError(fieldName: string): boolean {
//     return this.validationErrors().some(error => error.field === fieldName && error.type === 'error');
//   }

//   hasFieldWarning(fieldName: string): boolean {
//     return this.validationErrors().some(error => error.field === fieldName && error.type === 'warning');
//   }

//   getFieldClasses(fieldName: string): string {
//     const baseClasses = 'block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-primary-500 text-sm transition-all';
    
//     if (this.hasFieldError(fieldName)) {
//       return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
//     } else if (this.hasFieldWarning(fieldName)) {
//       return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
//     }
    
//     return `${baseClasses} border-gray-300 focus:ring-primary-500`;
//   }

//   canContinue(): boolean {
//     const current = this.currentStep();
//     const stepErrors = this.validationErrors().filter(error => 
//       this.getFieldStep(error.field) === current && error.type === 'error'
//     );
    
//     if (stepErrors.length > 0) return false;

//     const data = this.formData();
    
//     switch (current) {
//       case 'basic':
//         return !!(data.title.trim() && data.shortDescription.trim() && data.description.trim());
//       case 'terms':
//         return !!(data.fundingType && data.totalAvailable && data.offerAmount && data.decisionTimeframe);
//       case 'eligibility':
//         return true;
//       case 'settings':
//         return true;
//       default:
//         return true;
//     }
//   }
// }

// src/app/funder/components/opportunity-form.component.ts
import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subject, takeUntil, switchMap, Observable } from 'rxjs';
import { AlertCircleIcon, ArrowLeft, ArrowRight, Calculator, Check, ClockIcon, Copy, DollarSign, Eye, FileText, HelpCircle, Lightbulb, LucideAngularModule, PieChart, RefreshCw, Save, Settings, Sparkles, Target, TrendingUp, Users } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

// Services 
import { FundingOpportunityService } from '../../../funding/services/funding-opportunity.service';
import { FundingOpportunity } from '../../../shared/models/funder.models';

// Components
import { AiAssistantComponent } from '../../../ai/ai-assistant/ai-assistant.component';
import { OpportunityFormStateService } from '../../services/opportunity-form-state.service';
import { OpportunityFormData } from './shared/form-interfaces';
import { OrganizationStateService } from '../../services/organization-state.service';
import { StepNavigationService } from '../../services/step-navigation.service';
import { OpportunityUIHelperService } from '../../services/ui-helper.service';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    LucideAngularModule,
    AiAssistantComponent
  ],
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ])
  ],
  templateUrl: 'create-opportunity.component.html'
})
export class CreateOpportunityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private opportunityService = inject(FundingOpportunityService);

  // Injected services
  public formState = inject(OpportunityFormStateService);
  public stepNavigation = inject(StepNavigationService);
  public ui = inject(OpportunityUIHelperService);
  public organizationState = inject(OrganizationStateService);

  // Component-specific state
  mode = signal<'create' | 'edit'>('create');
  opportunityId = signal<string | null>(null);
  isLoading = signal(false);
  publishError = signal<string | null>(null);

  // Service state getters (for template convenience)
  get isSaving() { return this.opportunityService.isSaving; }
  get isPublishing() { return this.opportunityService.isPublishing; }
  get lastSavedAt() { return this.opportunityService.lastSavedAt; }
  get overallCompletion() { return this.opportunityService.overallCompletion; }

    ArrowLeftIcon = ArrowLeft;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  SettingsIcon = Settings;
  FileTextIcon = FileText;
  CheckIcon = Check;
  EyeIcon = Eye;
  HelpCircleIcon = HelpCircle;
  LightbulbIcon = Lightbulb;
  TrendingUpIcon = TrendingUp;
  CopyIcon = Copy;
  CalculatorIcon = Calculator;
  SparklesIcon = Sparkles;
  SaveIcon = Save;
  ArrowRightIcon = ArrowRight;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  ClockIcon = ClockIcon;
  AlertCircleIcon = AlertCircleIcon;
  constructor() {
    this.initializeEffects();
  }

  ngOnInit() {
    console.log('=== CREATE OPPORTUNITY COMPONENT INIT ===');
    
    // Load organization data first
    this.organizationState.loadOrganizationData();
    
    // Detect mode and setup
    this.detectMode();
    
    // Setup subscriptions to wait for organization data
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.formState.destroy();
    this.organizationState.destroy();
  }

  // Initialize reactive effects
  private initializeEffects() {
    // Auto-validate when form data changes
    effect(() => {
      const data = this.formState.formData();
      const orgId = this.organizationState.organizationId();
      this.formState.validateForm(orgId);
    });
  }

  // Setup subscriptions for organization state changes
  private setupSubscriptions() {
    this.organizationState.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state?.organization?.id) {
          // Organization loaded, now load form data
          this.loadFormDataAfterOrgLoad();
        }
      });
  }

  // Load form data after organization is available
  private loadFormDataAfterOrgLoad() {
    if (this.mode() === 'edit') {
      this.loadOpportunityForEdit();
    } else {
      this.loadDraftWithMerge();
    }
  }

  // Mode detection
  private detectMode() {
    const url = this.router.url;
    const routeParams = this.route.snapshot.params;
    
    if (url.includes('/edit') && routeParams['id']) {
      this.mode.set('edit');
      this.opportunityId.set(routeParams['id']);
    } else {
      this.mode.set('create');
      this.opportunityId.set(null);
    }
  }

  // Form data loading
  private loadDraftWithMerge() {
    this.isLoading.set(true);
    
    this.opportunityService.loadDraftWithMerge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.formState.loadFromDraft(response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load draft:', error);
          this.isLoading.set(false);
        }
      });
  }

  private loadOpportunityForEdit() {
    const oppId = this.opportunityId();
    if (!oppId) {
      this.router.navigate(['/funding/create-opportunity']);
      return;
    }

    this.isLoading.set(true);
    
    this.opportunityService.loadOpportunityForEdit(oppId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.formState.loadFromDraft(response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load opportunity for editing:', error);
          this.isLoading.set(false);
          this.router.navigate(['/funding/opportunities']);
        }
      });
  }

  // Publishing and saving
  publishOpportunity() {
    console.log('=== PUBLISH OPPORTUNITY ===');
    this.publishError.set(null);
    
    // Validate organization first
    // const orgValidationError = this.organizationState.validateOrganizationForPublishing();
    // if (orgValidationError) {
    //   this.publishError.set(orgValidationError);
    //   return;
    // }

    // if (!this.canPublish()) {
    //   this.publishError.set('Please complete all required fields before publishing.');
    //   return;
    // }

    if (this.mode() === 'edit') {
      this.saveDraft();
      return;
    }

    this.buildOpportunityData()
      .pipe(
        switchMap(opportunityData => {
          return this.opportunityService.publishOpportunity(opportunityData);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Opportunity published successfully:', response);
          this.publishError.set(null);
          this.formState.clearLocalStorage();
          this.router.navigate(['/funder/dashboard']);
        },
        error: (error) => {
          console.error('Failed to publish opportunity:', error);
          
          let errorMessage = 'Failed to publish opportunity. Please try again.';
          if (error.message && error.message.includes('organization')) {
            errorMessage = error.message;
          }
          
          this.publishError.set(errorMessage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  saveDraft() {
    this.publishError.set(null);
    
    const orgId = this.organizationState.organizationId();
    if (!orgId) {
      this.publishError.set('No organization found. Please complete your organization setup first.');
      return;
    }

    this.buildOpportunityData()
      .pipe(
        switchMap(opportunityData => {
          if (this.mode() === 'edit') {
            const oppId = this.opportunityId();
            if (!oppId) {
              throw new Error('No opportunity ID found for editing.');
            }
            return this.opportunityService.updateOpportunity(oppId, opportunityData);
          } else {
            return this.opportunityService.saveDraft(opportunityData, false);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Draft saved successfully');
          this.formState.hasUnsavedChanges.set(false);
          this.formState.clearLocalStorage();
          this.publishError.set(null);
        },
        error: (error) => {
          console.error('Failed to save draft:', error);
          this.publishError.set('Failed to save draft. Please try again.');
        }
      });
  }

  // Build opportunity data for API
  private buildOpportunityData(): Observable<Partial<FundingOpportunity>> {
    return new Observable(observer => {
      try {
        const data = this.formState.formData();
        const orgId = this.organizationState.organizationId();
        
        if (!orgId) {
          observer.error(new Error('No organization found. Please complete your organization setup before creating opportunities.'));
          return;
        }

        // Validate required fields
        const validationError = this.validateRequiredFields(data);
        if (validationError) {
          observer.error(new Error(validationError));
          return;
        }

        // Build opportunity data
        const opportunityData: Partial<FundingOpportunity> = {
          title: data.title.trim(),
          description: data.description.trim(),
          shortDescription: data.shortDescription.trim(),
          fundingOpportunityImageUrl: data.fundingOpportunityImageUrl?.trim() || undefined,
          fundingOpportunityVideoUrl: data.fundingOpportunityVideoUrl?.trim() || undefined,
          funderOrganizationName: data.funderOrganizationName?.trim() || undefined,
          funderOrganizationLogoUrl: data.funderOrganizationLogoUrl?.trim() || undefined,
          fundId: orgId,
          organizationId: orgId,
          offerAmount: Math.max(0, this.formState.parseNumberValue(data.offerAmount)),
          minInvestment: this.formState.parseNumberValue(data.minInvestment) || undefined,
          maxInvestment: this.formState.parseNumberValue(data.maxInvestment) || undefined,
          currency: data.currency,
          fundingType: data.fundingType as any,
          interestRate: data.interestRate ? Number(data.interestRate) : undefined,
          equityOffered: data.equityOffered ? Number(data.equityOffered) : undefined,
          repaymentTerms: data.repaymentTerms?.trim() || undefined,
          securityRequired: data.securityRequired?.trim() || undefined,
          useOfFunds: data.useOfFunds?.trim(),
          investmentStructure: data.investmentStructure?.trim(),
          expectedReturns: data.expectedReturns ? Number(data.expectedReturns) : undefined,
          investmentHorizon: data.investmentHorizon ? Number(data.investmentHorizon) : undefined,
          exitStrategy: data.exitStrategy?.trim() || undefined,
          applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
          decisionTimeframe: Math.max(1, Number(data.decisionTimeframe) || 30),
          totalAvailable: Math.max(0, this.formState.parseNumberValue(data.totalAvailable)),
          maxApplications: data.maxApplications ? Math.max(1, this.formState.parseNumberValue(data.maxApplications)) : undefined,
          autoMatch: data.autoMatch,
          eligibilityCriteria: {
            industries: data.targetIndustries || [],
            businessStages: data.businessStages || [],
            minRevenue: data.minRevenue ? Math.max(0, this.formState.parseNumberValue(data.minRevenue)) : undefined,
            maxRevenue: data.maxRevenue ? Math.max(0, this.formState.parseNumberValue(data.maxRevenue)) : undefined,
            minYearsOperation: data.minYearsOperation ? Math.max(0, Number(data.minYearsOperation)) : undefined,
            geographicRestrictions: data.geographicRestrictions?.length > 0 ? data.geographicRestrictions : undefined,
            requiresCollateral: data.requiresCollateral,
            excludeCriteria: []
          },
          status: 'draft',
          currentApplications: 0,
          viewCount: 0,
          applicationCount: 0
        };

        observer.next(opportunityData);
        observer.complete();

      } catch (error: any) {
        observer.error(new Error(`Failed to prepare opportunity data: ${error.message || 'Unknown error'}`));
      }
    });
  }

  private validateRequiredFields(data: OpportunityFormData): string | null {
    if (!data.title.trim()) {
      return 'Opportunity title is required.';
    }
    if (!data.shortDescription.trim()) {
      return 'Short description is required.';
    }
    if (!data.description.trim()) {
      return 'Full description is required.';
    }
    if (!data.fundingType) {
      return 'Funding type must be selected.';
    }
    if (!data.totalAvailable || this.formState.parseNumberValue(data.totalAvailable) <= 0) {
      return 'Total available funding must be specified and greater than zero.';
    }
    if (!data.offerAmount || this.formState.parseNumberValue(data.offerAmount) <= 0) {
      return 'Typical investment amount must be specified and greater than zero.';
    }
    if (!data.decisionTimeframe) {
      return 'Decision timeframe must be specified.';
    }
    return null;
  }

  // Publishing validation
  canPublish(): boolean {
    if (this.mode() === 'edit') {
      return true;
    }
    
    if (!this.organizationState.canPublishOpportunity()) {
      return false;
    }
    
    const criticalErrors = this.formState.validationErrors().filter(error => error.type === 'error');
    if (criticalErrors.length > 0) {
      return false;
    }
    
    const data = this.formState.formData();
    return !!(
      data.title.trim() && 
      data.shortDescription.trim() && 
      data.description.trim() &&
      data.fundingType &&
      data.totalAvailable &&
      data.offerAmount &&
      data.decisionTimeframe
    );
  }

  // Navigation methods
  goBack() {
    this.location.back();
  }

  goToOrganizationSetup() {
    this.router.navigate(['/funder/onboarding']);
  }

  // Convenience methods for template
  isEditMode(): boolean {
    return this.mode() === 'edit';
  }

  isCreateMode(): boolean {
    return this.mode() === 'create';
  }

  // Error management
  clearErrors(): void {
    this.publishError.set(null);
    this.organizationState.clearOrganizationError();
    this.formState.validationErrors.set([]);
  }

  // Step navigation delegates
  nextStep() {
    this.stepNavigation.nextStep();
  }

  previousStep() {
    this.stepNavigation.previousStep();
  }

  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    this.stepNavigation.goToStep(stepId);
  }

  // Form interaction delegates
  updateField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onFieldChange(field, event);
  }

  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onCheckboxChange(field, event);
  }

  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onMultiSelectChange(field, event);
  }

  onNumberInput(field: keyof OpportunityFormData, event: Event) {
    this.ui.onNumberInputChange(field, event);
  }

  // Convenience getters for template
  get formData() { return this.formState.formData; }
  get validationErrors() { return this.formState.validationErrors; }
  get currentStep() { return this.stepNavigation.currentStep; }
  get currentStepErrors() { return this.stepNavigation.currentStepErrors; }
  get hasCurrentStepErrors() { return this.stepNavigation.hasCurrentStepErrors; }
  get steps() { return this.stepNavigation.steps; }
  get progressPercentage() { return this.stepNavigation.progressPercentage; }
  get canContinue() { return this.stepNavigation.canContinue; }

  // Organization state getters
  get organizationLoading() { return this.organizationState.organizationLoading; }
  get organizationError() { return this.organizationState.organizationError; }
  get organizationId() { return this.organizationState.organizationId; }
  get canProceed() { return this.organizationState.canProceed; }

  // UI helper method delegates
  getFieldClasses(fieldName: string) { return this.ui.getFieldClasses(fieldName); }
  getStepCardClasses(stepId: string) { return this.ui.getStepCardClasses(stepId); }
  getStepIconClasses(stepId: string) { return this.ui.getStepIconClasses(stepId); }
  getStepTitleClasses(stepId: string) { return this.ui.getStepTitleClasses(stepId); }
  getStepDescriptionClasses(stepId: string) { return this.ui.getStepDescriptionClasses(stepId); }
  showDatabaseSaveStatus() { return this.ui.showDatabaseSaveStatus(); }
  showLocalSaveStatus() { return this.ui.showLocalSaveStatus(); }
  showUnsavedIndicator() { return this.ui.showUnsavedIndicator(); }
  getLastSavedText() { return this.ui.getLastSavedText(); }
  getLocalSaveText() { return this.ui.getLocalSaveText(); }
  getPageTitle() { return this.ui.getPageTitle(this.isEditMode()); }
  getPageSubtitle() { return this.ui.getPageSubtitle(this.isEditMode()); }
  getPublishButtonText() { return this.ui.getPublishButtonText(this.isEditMode()); }
  getSaveButtonText() { return this.ui.getSaveButtonText(this.isEditMode()); }
  getCurrentStepIcon() { return this.ui.getCurrentStepIcon(); }
  getCurrentStepTitle() { return this.ui.getCurrentStepTitle(); }
  getCurrentStepSubtitle() { return this.stepNavigation.getCurrentStepSubtitle(this.organizationLoading(), this.organizationError()); }
  formatNumberWithCommas(value: string | number) { return this.ui.formatNumberWithCommas(value); }
  getFormattedAmount(field: keyof OpportunityFormData) { return this.ui.getFormattedAmount(field); }
  getCompletionPercentage() { return this.ui.getCompletionPercentage(); }
  getCurrentStepIndex() { return this.stepNavigation.currentStepIndex(); }
  isStepCompleted(stepId: string) { return this.stepNavigation.isStepCompleted(stepId); }
  hasMediaContent() { return this.formState.hasMediaContent(); }
  onImageError(field: keyof OpportunityFormData) { this.ui.onImageError(field); }
  clearDraft() { this.formState.clearDraft(); }

  // Form state getters
  getFieldError(fieldName: string) { return this.formState.getFieldError(fieldName); }
  hasFieldError(fieldName: string) { return this.formState.hasFieldError(fieldName); }
  hasFieldWarning(fieldName: string) { return this.formState.hasFieldWarning(fieldName); }

  // Options getters
  get timeframes() { return this.ui.timeframes; }
  get targetIndustries() { return this.ui.targetIndustries; }
  get businessStages() { return this.ui.businessStages; }

  // Organization helper methods
  retryLoadOrganization() { this.organizationState.retryLoadOrganization(); }
}