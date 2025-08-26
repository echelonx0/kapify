// src/app/funder/components/create-opportunity/create-opportunity.component.ts
import { Component, inject, signal, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Check, 
         Save, ArrowRight, RefreshCw, ClockIcon, AlertCircleIcon } from 'lucide-angular';

import { FundingOpportunity } from '../../../shared/models/funder.models';
import { trigger, transition, style, animate } from '@angular/animations';
import { FundingOpportunityService } from '../../../funding/services/funding-opportunity.service';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';

// Import step components
import { BasicInfoStepComponent } from './steps/basic-info-step.component';
import { InvestmentTermsStepComponent } from './steps/investment-terms-step.component';
import { EligibilityCriteriaStepComponent } from './steps/eligibility-criteria-step.component';
import { SettingsStepComponent } from './steps/settings-step.component';

// Import shared interfaces
import { OpportunityFormData, ValidationError, StepInfo } from './shared/form-interfaces';

@Component({
  selector: 'app-create-opportunity',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    AiAssistantComponent,
    BasicInfoStepComponent,
    InvestmentTermsStepComponent,
    EligibilityCriteriaStepComponent,
    SettingsStepComponent
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
  template: `
    <div class="mx-auto p-6">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-3">
            <button 
              class="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
              (click)="goBack()"
            >
              <lucide-angular [img]="ArrowLeftIcon" [size]="16" class="mr-2 group-hover:-translate-x-1 transition-transform"></lucide-angular>
              {{ isEditMode() ? 'Back' : 'Go back' }}
            </button>
          </div>
          
          <div class="flex items-center space-x-3">
            <!-- Save Status Indicators -->
            @if (showDatabaseSaveStatus()) {
              <div class="flex items-center text-sm text-green-600">
                <lucide-angular [img]="CheckIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ getLastSavedText() }}
              </div>
            }
            
            @if (showLocalSaveStatus()) {
              <div class="flex items-center text-sm text-blue-600">
                <lucide-angular [img]="ClockIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ getLocalSaveText() }}
              </div>
            }
            
            @if (showUnsavedIndicator()) {
              <div class="flex items-center text-sm text-orange-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                Unsaved changes
              </div>
            }
          </div>
        </div>
        
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-gray-900">{{ getPageTitle() }}</h1>
            @if (isEditMode()) {
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Editing
              </span>
            } @else {
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                New Draft
              </span>
            }
          </div>
          <p class="text-gray-600">{{ getPageSubtitle() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Left Sidebar - Steps Navigation -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
            <h3 class="font-semibold text-gray-900 mb-4">Progress</h3>
            <div class="space-y-1">
              @for (step of steps(); track step.id; let i = $index) {
                <div 
                  class="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
                  [class]="getStepCardClasses(step.id)"
                  (click)="goToStep(step.id)"
                >
                  <div [class]="getStepIconClasses(step.id)">
                    @if (isStepCompleted(step.id)) {
                      <lucide-angular [img]="CheckIcon" [size]="16" class="text-white"></lucide-angular>
                    } @else {
                      <span class="text-xs font-semibold">{{ i + 1 }}</span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p [class]="getStepTitleClasses(step.id)">{{ step.title }}</p>
                    <p [class]="getStepDescriptionClasses(step.id)">{{ step.description }}</p>
                  </div>
                </div>
              }
            </div>

            <!-- Progress Bar -->
            <div class="mt-6">
              <div class="flex justify-between text-xs text-gray-600 mb-2">
                <span>Progress</span>
                <span>{{ getCurrentStepIndex() + 1 }} of {{ steps().length }}</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                  [style.width.%]="getProgressPercentage()"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <!-- Form Header -->
            <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-indigo-50">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <lucide-angular [img]="getCurrentStepIcon()" [size]="24" class="text-primary-600"></lucide-angular>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">{{ getCurrentStepTitle() }}</h2>
                  <p class="text-sm text-gray-600 mt-1">{{ getCurrentStepSubtitle() }}</p>
                </div>
              </div>
            </div>

            <!-- Current Step Validation Errors -->
            @if (hasCurrentStepErrors()) {
              <div class="p-4 bg-red-50 border-b border-red-200">
                <div class="flex">
                  <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-500 mt-0.5 mr-3"></lucide-angular>
                  <div>
                    <h4 class="text-sm font-medium text-red-800">Please fix the following issues:</h4>
                    <ul class="mt-2 text-sm text-red-700 space-y-1">
                      @for (error of currentStepErrors(); track error.field) {
                        <li class="flex items-center">
                          <span class="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                          {{ error.message }}
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            }

            <!-- Form Content -->
            <div class="p-6" [@stepTransition]>
              @if (isLoading()) {
                <div class="text-center py-12">
                  <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p class="text-gray-500">Loading...</p>
                </div>
              } @else {
                <!-- Step Components -->
                @switch (currentStep()) {
                  @case ('basic') {
                    <app-basic-info-step
                      [formData]="formData()"
                      [validationErrors]="validationErrors()"
                      (onFormChange)="onFormChange($event)"
                      (onValidationChange)="onValidationChange($event)"
                    ></app-basic-info-step>
                  }
                  @case ('terms') {
                    <app-investment-terms-step
                      [formData]="formData()"
                      [validationErrors]="validationErrors()"
                      (onFormChange)="onFormChange($event)"
                      (onValidationChange)="onValidationChange($event)"
                    ></app-investment-terms-step>
                  }
                  @case ('eligibility') {
                    <app-eligibility-criteria-step
                      [formData]="formData()"
                      [validationErrors]="validationErrors()"
                      (onFormChange)="onFormChange($event)"
                      (onValidationChange)="onValidationChange($event)"
                    ></app-eligibility-criteria-step>
                  }
                  @case ('settings') {
                    <app-settings-step
                      [formData]="formData()"
                      [validationErrors]="validationErrors()"
                      (onFormChange)="onFormChange($event)"
                      (onValidationChange)="onValidationChange($event)"
                    ></app-settings-step>
                  }
                  @case ('review') {
                    <div class="space-y-6">
                      <!-- Validation Summary -->
                      @if (validationErrors().length > 0) {
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div class="flex">
                            <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-yellow-500 mr-3 mt-0.5"></lucide-angular>
                            <div>
                              <h4 class="text-sm font-medium text-yellow-800 mb-2">Review Required</h4>
                              <p class="text-sm text-yellow-700 mb-3">Please review the following items before publishing:</p>
                              <ul class="text-sm text-yellow-700 space-y-1">
                                @for (error of validationErrors(); track error.field) {
                                  <li class="flex items-center">
                                    <span class="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-2"></span>
                                    {{ error.message }}
                                  </li>
                                }
                              </ul>
                            </div>
                          </div>
                        </div>
                      }

                      <!-- Opportunity Summary -->
                      <div class="bg-gray-50 rounded-xl p-6">
                        <h4 class="font-medium text-gray-900 mb-4">Opportunity Summary</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span class="text-gray-500">Title:</span>
                            <div class="font-medium">{{ formData().title || 'Not specified' }}</div>
                          </div>
                          <div>
                            <span class="text-gray-500">Funding Type:</span>
                            <div class="font-medium capitalize">{{ formData().fundingType || 'Not specified' }}</div>
                          </div>
                          <div>
                            <span class="text-gray-500">Total Available:</span>
                            <div class="font-medium">{{ formData().currency }} {{ getFormattedAmount('totalAvailable') }}</div>
                          </div>
                          <div>
                            <span class="text-gray-500">Typical Investment:</span>
                            <div class="font-medium">{{ formData().currency }} {{ getFormattedAmount('offerAmount') }}</div>
                          </div>
                          <div>
                            <span class="text-gray-500">Decision Timeframe:</span>
                            <div class="font-medium">{{ formData().decisionTimeframe || 'Not specified' }} days</div>
                          </div>
                          <div>
                            <span class="text-gray-500">Visibility:</span>
                            <div class="font-medium">{{ formData().isPublic ? 'Public' : 'Private' }}</div>
                          </div>
                        </div>

                        @if (formData().description) {
                          <div class="mt-4">
                            <span class="text-gray-500 text-sm">Description:</span>
                            <div class="mt-1 text-sm">{{ formData().description }}</div>
                          </div>
                        }

                        @if (formData().targetIndustries.length > 0) {
                          <div class="mt-4">
                            <span class="text-gray-500 text-sm">Target Industries:</span>
                            <div class="mt-1 text-sm">{{ formData().targetIndustries.join(', ') }}</div>
                          </div>
                        }

                        @if (formData().businessStages.length > 0) {
                          <div class="mt-4">
                            <span class="text-gray-500 text-sm">Business Stages:</span>
                            <div class="mt-1 text-sm">{{ formData().businessStages.join(', ') }}</div>
                          </div>
                        }

                        <!-- New Media Fields Summary -->
                        @if (hasMediaContent()) {
                          <div class="mt-4">
                            <span class="text-gray-500 text-sm">Media & Branding:</span>
                            <div class="mt-1 space-y-1 text-sm">
                              @if (formData().fundingOpportunityImageUrl) {
                                <div>• Opportunity image attached</div>
                              }
                              @if (formData().fundingOpportunityVideoUrl) {
                                <div>• Opportunity video attached</div>
                              }
                              @if (formData().funderOrganizationName) {
                                <div>• Organization: {{ formData().funderOrganizationName }}</div>
                              }
                              @if (formData().funderOrganizationLogoUrl) {
                                <div>• Organization logo attached</div>
                              }
                            </div>
                          </div>
                        }
                      </div>

                      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex">
                          <lucide-angular [img]="CheckIcon" [size]="20" class="text-green-500 mr-3 mt-0.5"></lucide-angular>
                          <div>
                            <h4 class="text-sm font-medium text-green-800">Ready to Publish</h4>
                            <p class="mt-1 text-sm text-green-700">
                              Once published, qualified SMEs will be able to view and apply for this opportunity.
                              You can edit or pause the opportunity at any time.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                }
              }
            </div>

            <!-- Form Actions -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <button 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                  [disabled]="currentStep() === 'basic'"
                  (click)="previousStep()"
                >
                  <lucide-angular [img]="ArrowLeftIcon" [size]="16" class="mr-2 inline"></lucide-angular>
                  Previous
                </button>
                
                <button 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                  (click)="goBack()"
                >
                  Cancel
                </button>

                @if (isCreateMode()) {
                  <button 
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                    (click)="clearDraft()"
                    title="Clear form and start over"
                  >
                    Clear Form
                  </button>
                }
              </div>

              <div class="flex items-center space-x-3">
                <button 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                  (click)="saveDraft()"
                  [disabled]="isSaving()"
                >
                  <lucide-angular [img]="SaveIcon" [size]="16" class="mr-2 inline"></lucide-angular>
                  @if (isSaving()) {
                    Saving...
                  } @else {
                    {{ getSaveButtonText() }}
                  }
                </button>

                @if (currentStep() === 'review') {
                  <button 
                    class="px-6 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center transition-all"
                    (click)="publishOpportunity()"
                    [disabled]="!canPublish() || isPublishing()"
                  >
                    @if (isPublishing()) {
                      <lucide-angular [img]="RefreshCwIcon" [size]="16" class="mr-2 animate-spin"></lucide-angular>
                      @if (isEditMode()) {
                        Saving Changes...
                      } @else {
                        Publishing...
                      }
                    } @else {
                      @if (isEditMode()) {
                        <lucide-angular [img]="SaveIcon" [size]="16" class="mr-2"></lucide-angular>
                        Save Changes
                      } @else {
                        <lucide-angular [img]="CheckIcon" [size]="16" class="mr-2"></lucide-angular>
                        Publish Opportunity
                      }
                    }
                  </button>
                } @else {
                  <button 
                    class="px-6 py-2 bg-primary-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center transition-all"
                    (click)="nextStep()"
                    [disabled]="!canContinue()"
                  >
                    Continue
                    <lucide-angular [img]="ArrowRightIcon" [size]="16" class="ml-2"></lucide-angular>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar - AI Assistant -->
        <div class="lg:col-span-1">
          <app-ai-assistant 
            [currentStep]="currentStep()"
            [formData]="formData()"
            [completionPercentage]="getCompletionPercentage()"
          ></app-ai-assistant>
        </div>
      </div>
    </div>
  `
})
export class CreateOpportunityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private localAutoSaveSubject = new Subject<OpportunityFormData>();
  private opportunityService = inject(FundingOpportunityService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  SettingsIcon = Settings;
  FileTextIcon = FileText;
  CheckIcon = Check;
  SaveIcon = Save;
  ArrowRightIcon = ArrowRight;
  RefreshCwIcon = RefreshCw;
  ClockIcon = ClockIcon;
  AlertCircleIcon = AlertCircleIcon;

  // Form state
  currentStep = signal<'basic' | 'terms' | 'eligibility' | 'settings' | 'review'>('basic');
  isLoading = signal(false);
  lastSavedAt = signal<string | null>(null);
  overallCompletion = signal(0);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);
  mode = signal<'create' | 'edit'>('create');
  opportunityId = signal<string | null>(null);

  // Validation state
  validationErrors = signal<ValidationError[]>([]);

  // Use service state for database operations
  get isSaving() { return this.opportunityService.isSaving; }
  get isPublishing() { return this.opportunityService.isPublishing; }

  // Section completion tracking
  sectionCompletions = signal<Record<string, number>>({
    basic: 0,
    terms: 0,
    eligibility: 0,
    settings: 0
  });

  // Form data with new fields included
  formData = signal<OpportunityFormData>({
    title: '',
    description: '',
    shortDescription: '',
    // NEW FIELDS
    fundingOpportunityImageUrl: '',
    fundingOpportunityVideoUrl: '',
    funderOrganizationName: '',
    funderOrganizationLogoUrl: '',
    // Investment terms
    offerAmount: '',
    minInvestment: '',
    maxInvestment: '',
    currency: 'ZAR',
    fundingType: '',
    interestRate: '',
    equityOffered: '',
    repaymentTerms: '',
    securityRequired: '',
    useOfFunds: '',
    investmentStructure: '',
    expectedReturns: '',
    investmentHorizon: '',
    exitStrategy: '',
    applicationDeadline: '',
    decisionTimeframe: '30',
    targetIndustries: [],
    businessStages: [],
    minRevenue: '',
    maxRevenue: '',
    minYearsOperation: '',
    geographicRestrictions: [],
    requiresCollateral: false,
    totalAvailable: '',
    maxApplications: '',
    autoMatch: true,
    isPublic: true
  });

  // Computed validation state
  currentStepErrors = computed(() => {
    const current = this.currentStep();
    return this.validationErrors().filter(error => this.getFieldStep(error.field) === current);
  });

  hasCurrentStepErrors = computed(() => this.currentStepErrors().length > 0);

  // Steps configuration
  steps = signal<StepInfo[]>([
    { id: 'basic', icon: this.TargetIcon, title: 'Basic Info', description: 'Details & branding' },
    { id: 'terms', icon: this.DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: this.UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: this.SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: this.FileTextIcon, title: 'Review', description: 'Publish opportunity' }
  ]);

  constructor() {
    this.initializeEffects();
  }

  ngOnInit() {
    this.detectMode();
    this.setupLocalAutoSave();
  
    if (this.mode() === 'edit') {
      this.loadOpportunityForEdit();
    } else {
      this.loadDraftWithMerge();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // FORM CHANGE HANDLERS
  // ===============================

  onFormChange(updates: Partial<OpportunityFormData>) {
    this.formData.update(current => ({ ...current, ...updates }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  onValidationChange(errors: ValidationError[]) {
    this.validationErrors.set(errors);
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  private getFieldStep(fieldName: string): string {
    const fieldStepMap: Record<string, string> = {
      'title': 'basic',
      'shortDescription': 'basic',
      'description': 'basic',
      'fundingOpportunityImageUrl': 'basic',
      'fundingOpportunityVideoUrl': 'basic',
      'funderOrganizationName': 'basic',
      'funderOrganizationLogoUrl': 'basic',
      'fundingType': 'terms',
      'offerAmount': 'terms',
      'minInvestment': 'terms',
      'maxInvestment': 'terms',
      'totalAvailable': 'terms',
      'interestRate': 'terms',
      'equityOffered': 'terms',
      'decisionTimeframe': 'terms',
      'minRevenue': 'eligibility',
      'maxRevenue': 'eligibility',
      'minYearsOperation': 'eligibility',
      'maxApplications': 'settings',
      'applicationDeadline': 'settings'
    };
    return fieldStepMap[fieldName] || 'basic';
  }

  canContinue(): boolean {
    const current = this.currentStep();
    const stepErrors = this.validationErrors().filter(error => 
      this.getFieldStep(error.field) === current && error.type === 'error'
    );
    
    if (stepErrors.length > 0) return false;

    const data = this.formData();
    
    switch (current) {
      case 'basic':
        return !!(data.title.trim() && data.shortDescription.trim() && data.description.trim());
      case 'terms':
        return !!(data.fundingType && data.totalAvailable && data.offerAmount && data.decisionTimeframe);
      case 'eligibility':
        return true; // Optional step
      case 'settings':
        return true; // Optional step
      default:
        return true;
    }
  }

  canPublish(): boolean {
    if (this.isEditMode()) {
      return true; // In edit mode, we can always save changes
    }
    
    // Check for any critical errors
    const criticalErrors = this.validationErrors().filter(error => error.type === 'error');
    if (criticalErrors.length > 0) return false;
    
    return this.canContinue();
  }

  // ===============================
  // STEP NAVIGATION
  // ===============================

  nextStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  previousStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(this.currentStep());
    const targetIndex = steps.indexOf(stepId);
    
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(stepId);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private buildOpportunityData(): Partial<FundingOpportunity> {
    const data = this.formData();
    
    // Convert and validate amounts - ensure proper number conversion
    const offerAmount = Math.max(0, this.parseNumberValue(data.offerAmount));
    const minInvestment = this.parseNumberValue(data.minInvestment);
    const maxInvestment = this.parseNumberValue(data.maxInvestment);
    const totalAvailable = Math.max(0, this.parseNumberValue(data.totalAvailable));
    
    // Ensure max >= min if both are specified and valid
    const finalMinInvestment = minInvestment;
    const finalMaxInvestment = maxInvestment > 0 && minInvestment > 0 ? 
      Math.max(maxInvestment, minInvestment) : maxInvestment;
    
    return {
      title: data.title.trim(),
      description: data.description.trim(),
      shortDescription: data.shortDescription.trim(),
      
      // NEW FIELDS - Include in transformation
      fundingOpportunityImageUrl: data.fundingOpportunityImageUrl?.trim() || undefined,
      fundingOpportunityVideoUrl: data.fundingOpportunityVideoUrl?.trim() || undefined,
      funderOrganizationName: data.funderOrganizationName?.trim() || undefined,
      funderOrganizationLogoUrl: data.funderOrganizationLogoUrl?.trim() || undefined,
      
      offerAmount,
      minInvestment: finalMinInvestment,
      maxInvestment: finalMaxInvestment,
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
      totalAvailable,
      maxApplications: data.maxApplications ? Math.max(1, this.parseNumberValue(data.maxApplications)) : undefined,
      autoMatch: data.autoMatch,
      eligibilityCriteria: {
        industries: data.targetIndustries || [],
        businessStages: data.businessStages || [],
        minRevenue: data.minRevenue ? Math.max(0, this.parseNumberValue(data.minRevenue)) : undefined,
        maxRevenue: data.maxRevenue ? Math.max(0, this.parseNumberValue(data.maxRevenue)) : undefined,
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
  }

  private parseNumberValue(value: string): number {
    if (!value) return 0;
    // Remove commas and spaces, then parse
    const cleaned = value.replace(/[,\s]/g, '');
    return Number(cleaned) || 0;
  }

  // Format displayed amounts for readonly elements
  getFormattedAmount(field: keyof OpportunityFormData): string {
    const value = this.formData()[field] as string;
    return this.formatNumberWithCommas(value);
  }

  formatNumberWithCommas(value: string): string {
    if (!value) return '';
    const numValue = this.parseNumberValue(value);
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  // ===============================
  // INITIALIZATION & DATA LOADING
  // ===============================

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

  private setupLocalAutoSave() {
    this.localAutoSaveSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(10000),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(formData => {
      this.saveToLocalStorage(formData);
    });
  }

  private loadDraftWithMerge() {
    this.isLoading.set(true);
    
    this.opportunityService.loadDraftWithMerge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.populateFormFromDraft(response.draftData);
            this.overallCompletion.set(response.completionPercentage);
            if (response.lastSaved) {
              this.lastSavedAt.set(response.lastSaved);
            }
            this.updateSectionCompletionsFromService();
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
            this.populateFormFromDraft(response.draftData);
            this.overallCompletion.set(response.completionPercentage);
            if (response.lastSaved) {
              this.lastSavedAt.set(response.lastSaved);
            }
            this.updateSectionCompletionsFromService();
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

  private populateFormFromDraft(draftData: Partial<FundingOpportunity>) {
    this.formData.update(current => ({
      ...current,
      title: draftData.title || '',
      description: draftData.description || '',
      shortDescription: draftData.shortDescription || '',
      
      // NEW FIELDS - Include in form population
      fundingOpportunityImageUrl: draftData.fundingOpportunityImageUrl || '',
      fundingOpportunityVideoUrl: draftData.fundingOpportunityVideoUrl || '',
      funderOrganizationName: draftData.funderOrganizationName || '',
      funderOrganizationLogoUrl: draftData.funderOrganizationLogoUrl || '',
      
      offerAmount: draftData.offerAmount?.toString() || '',
      minInvestment: draftData.minInvestment?.toString() || '',
      maxInvestment: draftData.maxInvestment?.toString() || '',
      currency: draftData.currency || 'ZAR',
      fundingType: draftData.fundingType || '',
      interestRate: draftData.interestRate?.toString() || '',
      equityOffered: draftData.equityOffered?.toString() || '',
      repaymentTerms: draftData.repaymentTerms || '',
      securityRequired: draftData.securityRequired || '',
      useOfFunds: draftData.useOfFunds || '',
      investmentStructure: draftData.investmentStructure || '',
      expectedReturns: draftData.expectedReturns?.toString() || '',
      investmentHorizon: draftData.investmentHorizon?.toString() || '',
      exitStrategy: draftData.exitStrategy || '',
      applicationDeadline: draftData.applicationDeadline?.toISOString().split('T')[0] || '',
      decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
      targetIndustries: draftData.eligibilityCriteria?.industries || [],
      businessStages: draftData.eligibilityCriteria?.businessStages || [],
      minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
      maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
      minYearsOperation: draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
      geographicRestrictions: draftData.eligibilityCriteria?.geographicRestrictions || [],
      requiresCollateral: draftData.eligibilityCriteria?.requiresCollateral || false,
      totalAvailable: draftData.totalAvailable?.toString() || '',
      maxApplications: draftData.maxApplications?.toString() || '',
      autoMatch: draftData.autoMatch ?? true,
      isPublic: true
    }));
  }

  private updateSectionCompletionsFromService() {
    const serviceCompletions = this.opportunityService.sectionCompletions();
    this.sectionCompletions.set({
      basic: serviceCompletions['basic-info'] || 0,
      terms: serviceCompletions['investment-terms'] || 0,
      eligibility: serviceCompletions['eligibility-criteria'] || 0,
      settings: serviceCompletions['settings'] || 0
    });
  }

  private saveToLocalStorage(formData: OpportunityFormData) {
    try {
      const saveData = {
        formData,
        lastSaved: new Date().toISOString(),
        step: this.currentStep()
      };
      localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
      this.lastLocalSave.set(saveData.lastSaved);
      console.log('Auto-saved to local storage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private clearLocalStorage() {
    try {
      localStorage.removeItem('opportunity_draft');
      this.lastLocalSave.set(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  private initializeEffects() {
    // Subscribe to service state changes
    effect(() => {
      const lastSaved = this.opportunityService.lastSavedAt();
      if (lastSaved) {
        this.lastSavedAt.set(lastSaved);
        this.hasUnsavedChanges.set(false);
      }
    });

    effect(() => {
      const completion = this.opportunityService.overallCompletion();
      this.overallCompletion.set(completion);
    });

    effect(() => {
      const completions = this.opportunityService.sectionCompletions();
      this.sectionCompletions.set({
        basic: completions['basic-info'] || 0,
        terms: completions['investment-terms'] || 0,
        eligibility: completions['eligibility-criteria'] || 0,
        settings: completions['settings'] || 0
      });
    });
  }

  // ===============================
  // ACTIONS
  // ===============================

  saveDraft() {
    const opportunityData = this.buildOpportunityData();
    
    if (this.mode() === 'edit') {
      const oppId = this.opportunityId();
      if (!oppId) return;
      
      this.opportunityService.updateOpportunity(oppId, opportunityData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Opportunity updated successfully');
            this.hasUnsavedChanges.set(false);
            this.clearLocalStorage();
          },
          error: (error) => {
            console.error('Failed to update opportunity:', error);
          }
        });
    } else {
      this.opportunityService.saveDraft(opportunityData, false)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Draft saved to database successfully');
            this.hasUnsavedChanges.set(false);
            this.clearLocalStorage();
          },
          error: (error) => {
            console.error('Failed to save draft to database:', error);
          }
        });
    }
  }

  publishOpportunity() {
    const opportunityData = this.buildOpportunityData();
    
    if (this.mode() === 'edit') {
      this.saveDraft();
    } else {
      this.opportunityService.publishOpportunity(opportunityData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Opportunity published successfully');
            this.clearLocalStorage();
            this.router.navigate(['/funder/dashboard']);
          },
          error: (error) => {
            console.error('Failed to publish opportunity:', error);
          }
        });
    }
  }

  deleteDraft() {
    if (this.mode() === 'edit') {
      this.router.navigate(['/funding/opportunities', this.opportunityId()]);
      return;
    }

    this.opportunityService.deleteDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Draft deleted successfully');
          this.clearLocalStorage();
          this.resetForm();
        },
        error: (error) => {
          console.error('Failed to delete draft:', error);
        }
      });
  }

  clearDraft() {
    this.clearLocalStorage();
    this.resetForm();
  }

  private resetForm() {
    this.formData.set({
      title: '',
      description: '',
      shortDescription: '',
      fundingOpportunityImageUrl: '',
      fundingOpportunityVideoUrl: '',
      funderOrganizationName: '',
      funderOrganizationLogoUrl: '',
      offerAmount: '',
      minInvestment: '',
      maxInvestment: '',
      currency: 'ZAR',
      fundingType: '',
      interestRate: '',
      equityOffered: '',
      repaymentTerms: '',
      securityRequired: '',
      useOfFunds: '',
      investmentStructure: '',
      expectedReturns: '',
      investmentHorizon: '',
      exitStrategy: '',
      applicationDeadline: '',
      decisionTimeframe: '30',
      targetIndustries: [],
      businessStages: [],
      minRevenue: '',
      maxRevenue: '',
      minYearsOperation: '',
      geographicRestrictions: [],
      requiresCollateral: false,
      totalAvailable: '',
      maxApplications: '',
      autoMatch: true,
      isPublic: true
    });
    this.overallCompletion.set(0);
    this.lastSavedAt.set(null);
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  isEditMode(): boolean {
    return this.mode() === 'edit';
  }

  isCreateMode(): boolean {
    return this.mode() === 'create';
  }

  getPageTitle(): string {
    return this.isEditMode() ? 'Edit Funding Opportunity' : 'Create Funding Opportunity';
  }

  getPageSubtitle(): string {
    if (this.isEditMode()) {
      return 'Update your opportunity details and save changes';
    }
    return 'Set up a new investment opportunity for SMEs with enhanced media and branding';
  }

  getPublishButtonText(): string {
    return this.isEditMode() ? 'Save Changes' : 'Publish Opportunity';
  }

  getSaveButtonText(): string {
    return this.isEditMode() ? 'Save Changes' : 'Save Draft';
  }

  goBack() {
    if (this.isEditMode()) {
      this.router.navigate(['/funding/opportunities', this.opportunityId()]);
    } else {
      this.router.navigate(['/funding/opportunities']);
    }
  }

  getCurrentStepIndex(): number {
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    return steps.indexOf(this.currentStep());
  }

  getProgressPercentage(): number {
    const totalSteps = this.steps().length;
    const currentIndex = this.getCurrentStepIndex();
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  }

  getCompletionPercentage(): number {
    return this.overallCompletion();
  }

  getCurrentStepIcon() {
    const step = this.steps().find(s => s.id === this.currentStep());
    return step?.icon || this.TargetIcon;
  }

  getCurrentStepTitle(): string {
    const step = this.steps().find(s => s.id === this.currentStep());
    return step?.title || '';
  }

  getCurrentStepSubtitle(): string {
    const subtitles = {
      basic: 'Define the core details and enhance with media and branding',
      terms: 'Define the financial structure and investment parameters',
      eligibility: 'Set criteria for who can apply',
      settings: 'Configure visibility and application process',
      review: 'Review your opportunity before publishing'
    };
    return subtitles[this.currentStep()] || '';
  }

  isStepCompleted(stepId: string): boolean {
    const completions = this.sectionCompletions();
    switch (stepId) {
      case 'basic': return completions['basic'] >= 100;
      case 'terms': return completions['terms'] >= 100;
      case 'eligibility': return completions['eligibility'] >= 100;
      case 'settings': return completions['settings'] >= 100;
      default: return false;
    }
  }

  getStepCardClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'bg-green-50 border border-green-200';
    } else if (stepIndex === currentIndex) {
      return 'bg-blue-50 border border-blue-200';
    } else {
      return 'hover:bg-gray-50';
    }
  }

  getStepIconClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center';
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-blue-500 text-white`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-500`;
    }
  }

  getStepTitleClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'text-sm font-medium text-green-900';
    } else if (stepIndex === currentIndex) {
      return 'text-sm font-medium text-blue-900';
    } else {
      return 'text-sm font-medium text-gray-500';
    }
  }

  getStepDescriptionClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'text-xs text-green-600';
    } else if (stepIndex === currentIndex) {
      return 'text-xs text-blue-600';
    } else {
      return 'text-xs text-gray-400';
    }
  }

  getLastSavedText(): string {
    const lastSaved = this.lastSavedAt();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  }

  getLocalSaveText(): string {
    const lastSaved = this.lastLocalSave();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Auto-saved just now';
    if (diffMins < 60) return `Auto-saved ${diffMins} minutes ago`;
    
    return 'Auto-saved locally';
  }

  showDatabaseSaveStatus(): boolean {
    return !!this.lastSavedAt();
  }

  showLocalSaveStatus(): boolean {
    return !!this.lastLocalSave() && !this.lastSavedAt();
  }

  showUnsavedIndicator(): boolean {
    return this.hasUnsavedChanges();
  }

  hasMediaContent(): boolean {
    const data = this.formData();
    return !!(data.fundingOpportunityImageUrl || 
              data.fundingOpportunityVideoUrl || 
              data.funderOrganizationName || 
              data.funderOrganizationLogoUrl);
  }
}