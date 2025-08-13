// src/app/funder/components/opportunity-form.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Save, Eye, CheckCircle } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { FunderOpportunityBackendService } from '../services/funder-opportunity-backend.service';

interface OpportunityFormData {
  // Basic details
  title: string;
  description: string;
  shortDescription: string;
  targetCompanyProfile: string;
  
  // Investment terms
  offerAmount: string;
  minInvestment: string;
  maxInvestment: string;
  currency: string;
  fundingType: 'debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant' | '';
  
  // Specific terms
  interestRate: string;
  equityOffered: string;
  repaymentTerms: string;
  securityRequired: string;
  
  // Deal specifics
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns: string;
  investmentHorizon: string;
  exitStrategy: string;
  
  // Process
  applicationDeadline: string;
  decisionTimeframe: string;
  
  // Eligibility
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;
  
  // Availability
  totalAvailable: string;
  maxApplications: string;
  
  // Settings
  autoMatch: boolean;
  isPublic: boolean;
}

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    UiButtonComponent,
    UiCardComponent,
    LucideAngularModule
  ],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center space-x-3 mb-4">
          <button 
            (click)="goBack()" 
            class="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-1" />
            Back to Opportunities
          </button>
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900">
              {{ isEditMode() ? 'Edit' : 'Create' }} Funding Opportunity
            </h1>
            <p class="text-neutral-600 mt-1">
              {{ isEditMode() ? 'Update your investment opportunity' : 'Set up a new investment opportunity for SMEs' }}
            </p>
          </div>
          
          <!-- Auto-save indicator -->
          @if (lastSaved()) {
            <div class="flex items-center space-x-2 text-sm text-neutral-600">
              <lucide-icon [img]="SaveIcon" [size]="16" class="text-green-500" />
              <span>Last saved {{ getTimeAgo(lastSaved()!) }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          @for (step of steps(); track step.id) {
            <div class="flex items-center">
              <div [class]="getStepClasses(step.id)">
                @if (isStepCompleted(step.id)) {
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" />
                } @else {
                  <lucide-icon [img]="step.icon" [size]="16" />
                }
              </div>
              <div class="ml-3">
                <p [class]="getStepTextClasses(step.id)">{{ step.title }}</p>
                <p class="text-xs text-neutral-500">{{ step.description }}</p>
              </div>
              @if (step.id !== 'review') {
                <div class="w-16 h-0.5 bg-neutral-200 ml-8"></div>
              }
            </div>
          }
        </div>
      </div>
      
      <!-- Form Content -->
      <ui-card>
        @switch (currentStep()) {
          @case ('basic') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="TargetIcon" [size]="20" class="text-primary-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Basic Information</h3>
                  <p class="text-sm text-neutral-600">Core details about your funding opportunity</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Opportunity Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Growth Capital for Tech Startups"
                    [value]="formData().title"
                    (input)="updateField('title', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Short Description <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Brief one-line summary for opportunity listings"
                    [value]="formData().shortDescription"
                    (input)="updateField('shortDescription', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Detailed Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Detailed description of the investment opportunity, what you're looking for, and what you offer..."
                    [value]="formData().description"
                    (input)="updateField('description', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  ></textarea>
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Target Company Profile
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Describe your ideal investment target..."
                    [value]="formData().targetCompanyProfile"
                    (input)="updateField('targetCompanyProfile', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  ></textarea>
                </div>
              </div>
            </div>
          }

          @case ('terms') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="DollarSignIcon" [size]="20" class="text-green-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Investment Terms</h3>
                  <p class="text-sm text-neutral-600">Financial structure and investment details</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Funding Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().fundingType"
                    (change)="updateField('fundingType', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select funding type</option>
                    <option value="equity">Equity</option>
                    <option value="debt">Debt</option>
                    <option value="mezzanine">Mezzanine</option>
                    <option value="convertible">Convertible</option>
                    <option value="grant">Grant</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Currency <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().currency"
                    (change)="updateField('currency', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select currency</option>
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Decision Timeframe (days) <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    [value]="formData().decisionTimeframe"
                    (input)="updateField('decisionTimeframe', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Typical Investment <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="1000000"
                    [value]="formData().offerAmount"
                    (input)="updateField('offerAmount', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Minimum Investment
                  </label>
                  <input
                    type="number"
                    placeholder="500000"
                    [value]="formData().minInvestment"
                    (input)="updateField('minInvestment', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Maximum Investment
                  </label>
                  <input
                    type="number"
                    placeholder="5000000"
                    [value]="formData().maxInvestment"
                    (input)="updateField('maxInvestment', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <!-- Conditional fields based on funding type -->
              @if (formData().fundingType === 'equity' || formData().fundingType === 'mezzanine') {
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Equity Offered (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="15"
                    [value]="formData().equityOffered"
                    (input)="updateField('equityOffered', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              }

              @if (formData().fundingType === 'debt' || formData().fundingType === 'mezzanine') {
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                    [value]="formData().interestRate"
                    (input)="updateField('interestRate', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              }
            </div>
          }

          @case ('eligibility') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="UsersIcon" [size]="20" class="text-blue-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Target Criteria</h3>
                  <p class="text-sm text-neutral-600">Define who can apply for this opportunity</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Target Industries
                  </label>
                  <select
                    multiple
                    [value]="formData().targetIndustries"
                    (change)="updateMultiSelectField('targetIndustries', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    size="5"
                  >
                    <option value="technology">Technology</option>
                    <option value="fintech">Fintech</option>
                    <option value="healthtech">Healthtech</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="construction">Construction</option>
                    <option value="logistics">Logistics</option>
                    <option value="education">Education</option>
                    <option value="energy">Energy</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Business Stages
                  </label>
                  <select
                    multiple
                    [value]="formData().businessStages"
                    (change)="updateMultiSelectField('businessStages', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    size="5"
                  >
                    <option value="startup">Startup</option>
                    <option value="early_stage">Early Stage</option>
                    <option value="growth">Growth</option>
                    <option value="established">Established</option>
                    <option value="mature">Mature</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Minimum Annual Revenue
                  </label>
                  <input
                    type="number"
                    placeholder="1000000"
                    [value]="formData().minRevenue"
                    (input)="updateField('minRevenue', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Maximum Annual Revenue
                  </label>
                  <input
                    type="number"
                    placeholder="50000000"
                    [value]="formData().maxRevenue"
                    (input)="updateField('maxRevenue', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          }

          @case ('settings') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="SettingsIcon" [size]="20" class="text-purple-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Settings</h3>
                  <p class="text-sm text-neutral-600">Configure availability and process settings</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Total Fund Available <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="50000000"
                    [value]="formData().totalAvailable"
                    (input)="updateField('totalAvailable', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Maximum Applications
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    [value]="formData().maxApplications"
                    (input)="updateField('maxApplications', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoMatch"
                    [checked]="formData().autoMatch"
                    (change)="updateCheckboxField('autoMatch', $event)"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label for="autoMatch" class="text-sm text-neutral-700">
                    Enable automatic matching with qualified SMEs
                  </label>
                </div>

                <div class="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isPublic"
                    [checked]="formData().isPublic"
                    (change)="updateCheckboxField('isPublic', $event)"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label for="isPublic" class="text-sm text-neutral-700">
                    Make opportunity publicly visible to SMEs
                  </label>
                </div>
              </div>
            </div>
          }

          @case ('review') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="FileTextIcon" [size]="20" class="text-blue-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Review & Publish</h3>
                  <p class="text-sm text-neutral-600">Review your opportunity before publishing</p>
                </div>
              </div>

              <!-- Opportunity Summary -->
              <div class="bg-neutral-50 rounded-lg p-6">
                <h4 class="font-medium text-neutral-900 mb-4">Opportunity Summary</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-neutral-500">Title:</span>
                    <div class="font-medium">{{ formData().title || 'Not specified' }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Funding Type:</span>
                    <div class="font-medium capitalize">{{ formData().fundingType || 'Not specified' }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Total Available:</span>
                    <div class="font-medium">{{ formData().currency }} {{ getFormattedAmount('totalAvailable') }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Typical Investment:</span>
                    <div class="font-medium">{{ formData().currency }} {{ getFormattedAmount('offerAmount') }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Decision Timeframe:</span>
                    <div class="font-medium">{{ formData().decisionTimeframe || 'Not specified' }} days</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Visibility:</span>
                    <div class="font-medium">{{ formData().isPublic ? 'Public' : 'Private' }}</div>
                  </div>
                </div>

                @if (formData().description) {
                  <div class="mt-4">
                    <span class="text-neutral-500 text-sm">Description:</span>
                    <div class="mt-1 text-sm">{{ formData().description }}</div>
                  </div>
                }

                @if (formData().targetIndustries.length > 0) {
                  <div class="mt-4">
                    <span class="text-neutral-500 text-sm">Target Industries:</span>
                    <div class="mt-1 text-sm">{{ formData().targetIndustries.join(', ') }}</div>
                  </div>
                }

                @if (formData().businessStages.length > 0) {
                  <div class="mt-4">
                    <span class="text-neutral-500 text-sm">Business Stages:</span>
                    <div class="mt-1 text-sm">{{ formData().businessStages.join(', ') }}</div>
                  </div>
                }
              </div>

              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex">
                  <div class="ml-3">
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

        <!-- Form Actions -->
        <div class="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200">
          <div class="flex items-center space-x-3">
            @if (currentStep() !== 'basic') {
              <ui-button variant="outline" (clicked)="previousStep()">
                Previous
              </ui-button>
            }
            
            <ui-button variant="outline" (clicked)="goBack()">
              Cancel
            </ui-button>
          </div>

          <div class="flex items-center space-x-3">
            <ui-button 
              variant="outline" 
              (clicked)="saveDraft()" 
              [disabled]="backendService.isSaving()"
            >
              @if (backendService.isSaving()) {
                Saving...
              } @else {
                Save Draft
              }
            </ui-button>

            @if (currentStep() === 'review') {
              <ui-button 
                variant="primary" 
                (clicked)="publishOpportunity()" 
                [disabled]="!canPublish() || backendService.isPublishing()"
              >
                @if (backendService.isPublishing()) {
                  Publishing...
                } @else {
                  {{ isEditMode() ? 'Update Opportunity' : 'Publish Opportunity' }}
                }
              </ui-button>
            } @else {
              <ui-button variant="primary" (clicked)="nextStep()" [disabled]="!canContinue()">
                Continue
              </ui-button>
            }
          </div>
        </div>
      </ui-card>
    </div>
  `
})
export class OpportunityFormComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected backendService = inject(FunderOpportunityBackendService);
  private destroy$ = new Subject<void>();

  // Icons
  ArrowLeftIcon = ArrowLeft;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  SettingsIcon = Settings;
  FileTextIcon = FileText;
  SaveIcon = Save;
  EyeIcon = Eye;
  CheckCircleIcon = CheckCircle;

  // Form state
  currentStep = signal<'basic' | 'terms' | 'eligibility' | 'settings' | 'review'>('basic');
  isEditMode = signal(false);
  opportunityId = signal<string | null>(null);
  lastSaved = signal<string | null>(null);

  // Form data
  formData = signal<OpportunityFormData>({
    title: '',
    description: '',
    shortDescription: '',
    targetCompanyProfile: '',
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

  // Steps configuration
  steps = signal([
    { id: 'basic', icon: TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: FileTextIcon, title: 'Review', description: 'Publish opportunity' }
  ]);

  ngOnInit() {
    // Check if we're editing an existing opportunity
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.opportunityId.set(id);
      this.loadOpportunityData(id);
    } else {
      // Load any existing draft data
      this.loadDraftData();
    }

    // Set up auto-save
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOpportunityData(id: string) {
    this.backendService.loadOpportunityData(id).subscribe({
      next: (response) => {
        if (response.success && response.opportunityData) {
          this.populateFormFromOpportunity(response.opportunityData);
          this.lastSaved.set(response.lastSaved || null);
        }
      },
      error: (error) => {
        console.error('Failed to load opportunity:', error);
        // Handle error - maybe show toast notification
      }
    });
  }

  private loadDraftData() {
    this.backendService.loadOpportunityData().subscribe({
      next: (response) => {
        if (response.success && response.opportunityData) {
          this.populateFormFromOpportunity(response.opportunityData);
          this.lastSaved.set(response.lastSaved || null);
        }
      },
      error: (error) => {
        console.log('No draft data found, starting fresh');
      }
    });
  }

  private populateFormFromOpportunity(opportunity: Partial<FundingOpportunity>) {
    this.formData.update(data => ({
      ...data,
      title: opportunity.title || '',
      description: opportunity.description || '',
      shortDescription: opportunity.shortDescription || '',
      targetCompanyProfile: opportunity.targetCompanyProfile || '',
      offerAmount: opportunity.offerAmount?.toString() || '',
      minInvestment: opportunity.minInvestment?.toString() || '',
      maxInvestment: opportunity.maxInvestment?.toString() || '',
      currency: opportunity.currency || 'ZAR',
      fundingType: opportunity.fundingType || '',
      interestRate: opportunity.interestRate?.toString() || '',
      equityOffered: opportunity.equityOffered?.toString() || '',
      repaymentTerms: opportunity.repaymentTerms || '',
      securityRequired: opportunity.securityRequired || '',
      useOfFunds: opportunity.useOfFunds || '',
      investmentStructure: opportunity.investmentStructure || '',
      expectedReturns: opportunity.expectedReturns?.toString() || '',
      investmentHorizon: opportunity.investmentHorizon?.toString() || '',
      exitStrategy: opportunity.exitStrategy || '',
      applicationDeadline: opportunity.applicationDeadline ? 
        new Date(opportunity.applicationDeadline).toISOString().split('T')[0] : '',
      decisionTimeframe: opportunity.decisionTimeframe?.toString() || '30',
      targetIndustries: opportunity.eligibilityCriteria?.industries || [],
      businessStages: opportunity.eligibilityCriteria?.businessStages || [],
      minRevenue: opportunity.eligibilityCriteria?.minRevenue?.toString() || '',
      maxRevenue: opportunity.eligibilityCriteria?.maxRevenue?.toString() || '',
      minYearsOperation: opportunity.eligibilityCriteria?.minYearsOperation?.toString() || '',
      geographicRestrictions: opportunity.eligibilityCriteria?.geographicRestrictions || [],
      requiresCollateral: opportunity.eligibilityCriteria?.requiresCollateral || false,
      totalAvailable: opportunity.totalAvailable?.toString() || '',
      maxApplications: opportunity.maxApplications?.toString() || '',
      autoMatch: opportunity.autoMatch !== undefined ? opportunity.autoMatch : true,
      isPublic: true // Default for new opportunities
    }));
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds if there are changes
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.hasUnsavedChanges()) {
          this.saveDraft(true); // Auto-save
        }
      });
  }

  private hasUnsavedChanges(): boolean {
    const data = this.formData();
    return !!(data.title || data.description || data.shortDescription || 
             data.offerAmount || data.fundingType);
  }

  // Event handlers
  updateField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
  }

  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.checked
    }));
  }

  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.formData.update(data => ({
      ...data,
      [field]: selectedOptions
    }));
  }

  // Step navigation
  nextStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
    }
  }

  previousStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
    }
  }

  // Validation
  canContinue(): boolean {
    const data = this.formData();
    const current = this.currentStep();
    
    switch (current) {
      case 'basic':
        return !!(data.title && data.description && data.shortDescription);
      case 'terms':
        return !!(data.fundingType && data.totalAvailable && data.offerAmount && data.decisionTimeframe);
      case 'eligibility':
        return true; // Optional step
      case 'settings':
        return !!data.totalAvailable;
      default:
        return true;
    }
  }

  canPublish(): boolean {
    return this.canContinue() && this.isFormValid();
  }

  private isFormValid(): boolean {
    const data = this.formData();
    return !!(
      data.title && 
      data.description && 
      data.shortDescription &&
      data.fundingType &&
      data.currency &&
      data.offerAmount &&
      data.decisionTimeframe &&
      data.totalAvailable
    );
  }

  isStepCompleted(stepId: string): boolean {
    const data = this.formData();
    
    switch (stepId) {
      case 'basic':
        return !!(data.title && data.description && data.shortDescription);
      case 'terms':
        return !!(data.fundingType && data.offerAmount && data.currency && data.decisionTimeframe);
      case 'eligibility':
        return data.targetIndustries.length > 0 || data.businessStages.length > 0;
      case 'settings':
        return !!data.totalAvailable;
      case 'review':
        return this.isFormValid();
      default:
        return false;
    }
  }

  // Actions
  saveDraft(isAutoSave: boolean = false) {
    const opportunityData = this.buildOpportunityData();
    
    this.backendService.saveOpportunityDraft(opportunityData, isAutoSave).subscribe({
      next: (response) => {
        if (response.success) {
          this.lastSaved.set(response.lastSaved);
          if (!isAutoSave) {
            console.log('Draft saved successfully');
            // Show success toast
          }
        }
      },
      error: (error) => {
        console.error('Failed to save draft:', error);
        // Show error toast
      }
    });
  }

  publishOpportunity() {
    const opportunityData = this.buildOpportunityData();
    
    if (this.isEditMode()) {
      // Update existing opportunity
      this.backendService.updateOpportunity(this.opportunityId()!, opportunityData).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Opportunity updated successfully');
            this.router.navigate(['/funder-dashboard']);
          }
        },
        error: (error) => {
          console.error('Failed to update opportunity:', error);
        }
      });
    } else {
      // Publish new opportunity
      this.backendService.publishOpportunity(opportunityData).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Opportunity published successfully');
            this.router.navigate(['/funder-dashboard']);
          }
        },
        error: (error) => {
          console.error('Failed to publish opportunity:', error);
        }
      });
    }
  }

  private buildOpportunityData(): Partial<FundingOpportunity> {
    const data = this.formData();
    
    return {
      id: this.opportunityId(),
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      targetCompanyProfile: data.targetCompanyProfile,
      offerAmount: Number(data.offerAmount) || 0,
      minInvestment: Number(data.minInvestment) || 0,
      maxInvestment: Number(data.maxInvestment) || 0,
      currency: data.currency,
      fundingType: data.fundingType as any,
      interestRate: data.interestRate ? Number(data.interestRate) : undefined,
      equityOffered: data.equityOffered ? Number(data.equityOffered) : undefined,
      repaymentTerms: data.repaymentTerms || undefined,
      securityRequired: data.securityRequired || undefined,
      useOfFunds: data.useOfFunds,
      investmentStructure: data.investmentStructure,
      expectedReturns: data.expectedReturns ? Number(data.expectedReturns) : undefined,
      investmentHorizon: data.investmentHorizon ? Number(data.investmentHorizon) : undefined,
      exitStrategy: data.exitStrategy || undefined,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      decisionTimeframe: Number(data.decisionTimeframe) || 30,
      totalAvailable: Number(data.totalAvailable) || 0,
      maxApplications: data.maxApplications ? Number(data.maxApplications) : undefined,
      autoMatch: data.autoMatch,
      eligibilityCriteria: {
        industries: data.targetIndustries,
        businessStages: data.businessStages,
        minRevenue: data.minRevenue ? Number(data.minRevenue) : undefined,
        maxRevenue: data.maxRevenue ? Number(data.maxRevenue) : undefined,
        minYearsOperation: data.minYearsOperation ? Number(data.minYearsOperation) : undefined,
        geographicRestrictions: data.geographicRestrictions.length > 0 ? data.geographicRestrictions : undefined,
        requiresCollateral: data.requiresCollateral,
        excludeCriteria: []
      },
      status: 'draft',
      currentApplications: 0,
      viewCount: 0,
      applicationCount: 0
    };
  }

  goBack() {
    this.router.navigate(['/funder-dashboard']);
  }

  // UI helpers
  getStepClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (this.isStepCompleted(stepId)) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-500`;
    }
  }

  getStepTextClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (this.isStepCompleted(stepId) || stepIndex <= currentIndex) {
      return 'text-sm font-medium text-neutral-900';
    } else {
      return 'text-sm font-medium text-neutral-500';
    }
  }

  getFormattedAmount(field: keyof OpportunityFormData): string {
    const amount = Number(this.formData()[field]) || 0;
    return this.formatNumber(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date().getTime();
    const saved = new Date(timestamp).getTime();
    const diffMinutes = Math.floor((now - saved) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  }
    