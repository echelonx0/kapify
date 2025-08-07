// src/app/profile/steps/business-plan/business-plan.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, FileText, TrendingUp, Users, Building, Gavel, MapPin, ChevronDown, ChevronUp } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../shared/components';
import { ProfileService } from '../profile.service';
 

interface BusinessPlanSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  expanded: boolean;
  completed: boolean;
  required: boolean;
}

interface BusinessPlanData {
  marketing: {
    marketResearchConducted?: string;
    marketResearchMethods?: string[];
    industryAnalysis?: string;
    salesStrategy?: string;
    targetMarket?: string;
    marketShare?: string;
    targetPostInvestment?: string;
  };
  industryAnalysis: {
    currentGrowthProspects?: string;
    industryTrends?: string[];
    marketSize?: string;
    growthRate?: string;
    keyDrivers?: string[];
  };
  competition: {
    mainCompetitors?: string[];
    competitiveAdvantages?: string[];
    marketPosition?: string;
    differentiationStrategy?: string;
    competitiveThreats?: string[];
  };
  customers: {
    targetSegments?: string[];
    customerNeeds?: string[];
    demographicInfo?: string;
    customerAcquisition?: string;
    retentionStrategy?: string;
  };
  suppliers: {
    keySuppliers?: string[];
    supplyChain?: string;
    procurementStrategy?: string;
    supplierRelationships?: string;
    riskMitigation?: string;
  };
  legalCompliance: {
    licenses?: string[];
    permits?: string[];
    regulations?: string[];
    complianceStatus?: string;
    legalRisks?: string[];
  };
  realEstate: {
    currentProperties?: string[];
    leaseDetails?: string;
    expansionPlans?: string;
    locationStrategy?: string;
    facilityRequirements?: string;
  };
}

@Component({
  selector: 'app-business-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
   
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <div class="bg-white rounded-lg border border-neutral-200 p-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="FileTextIcon" [size]="20" class="text-primary-600" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral-900">Business Plan</h2>
              <p class="text-neutral-600 mt-1">
                Provide a detailed description of your business strategy, market analysis, and growth plans.
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-neutral-500">Progress</div>
            <div class="text-lg font-semibold text-primary-600">{{ getCompletionPercentage() }}%</div>
          </div>
        </div>
        
        <!-- Upload Business Plan Document -->
        <div class="mt-6 pt-6 border-t border-neutral-200">
          <h3 class="text-sm font-medium text-neutral-900 mb-3">Upload Complete Business Plan</h3>
          <ui-file-upload
            [accept]="'.pdf,.doc,.docx'"
            [multiple]="false"
            (fileSelected)="onBusinessPlanUpload($event)"
            class="w-full"
          />
          <p class="text-xs text-neutral-500 mt-2">
            Upload your complete business plan document (PDF, DOC, or DOCX format)
          </p>
        </div>
      </div>

      <!-- Business Plan Sections -->
      <div class="space-y-4">
        @for (section of sections; track section.id) {
          <ui-card class="transition-all duration-200">
            <div class="p-6">
              <!-- Section Header -->
              <button
                (click)="toggleSection(section.id)"
                class="w-full flex items-center justify-between text-left group"
              >
                <div class="flex items-center space-x-3">
                  <div [class]="getSectionIconClasses(section)">
                    <lucide-icon [img]="section.icon" [size]="16" />
                  </div>
                  <div>
                    <h3 class="text-lg font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                      {{ section.title }}
                      @if (section.required) {
                        <span class="text-red-500 ml-1">*</span>
                      }
                    </h3>
                    <p class="text-sm text-neutral-600">{{ section.description }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  @if (section.completed) {
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  }
                  <lucide-icon 
                    [img]="section.expanded ? ChevronUpIcon : ChevronDownIcon" 
                    [size]="20" 
                    class="text-neutral-400 group-hover:text-neutral-600 transition-colors"
                  />
                </div>
              </button>

              <!-- Section Content -->
              @if (section.expanded) {
                <div class="mt-6 pt-6 border-t border-neutral-200">
                  @switch (section.id) {
                    @case ('marketing') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Market Research</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.marketing.marketResearchConducted"
                            placeholder="How was the market research conducted? (Desktop, surveys, research firms, etc)"
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Industry Information Review</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.marketing.industryAnalysis"
                            placeholder="Review industry information to assess the current and potential growth prospects of the market in which the client operates"
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Sales and Marketing Strategy</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.marketing.salesStrategy"
                            placeholder="Assess the overall sales and marketing strategy. How realistic and achievable is it? Must be based on secured contracts, letters of intent and/or verifiable market research."
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Target Market Analysis</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.marketing.targetMarket"
                            placeholder="Who is your target market, how big is it, what is your current share and what is the target that you are after post investment?"
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                      </div>
                    }
                    
                    @case ('industry') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Industry Overview</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.industryAnalysis.currentGrowthProspects"
                            placeholder="Analyze the industry in which your business operates. Include information on market trends, key players, competitive landscape, and potential growth opportunities."
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <ui-input
                              [(ngModel)]="businessPlanData.industryAnalysis.marketSize"
                              placeholder="Market Size"
                              label="Current Market Size"
                              class="w-full"
                            />
                          </div>
                          <div>
                            <ui-input
                              [(ngModel)]="businessPlanData.industryAnalysis.growthRate"
                              placeholder="Annual Growth Rate"
                              label="Industry Growth Rate"
                              class="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    }
                    
                    @case ('competition') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Main Competitors</h4>
                          <ui-textarea
                            [(ngModel)]="competitorsText"
                            placeholder="Identify your main competitors and analyze their strengths and weaknesses. Explain how your business differentiates itself from the competition."
                            [rows]="4"
                            class="w-full"
                            (ngModelChange)="updateCompetitors($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Competitive Advantages</h4>
                          <ui-textarea
                            [(ngModel)]="competitiveAdvantagesText"
                            placeholder="What are your key competitive advantages? How do you maintain these advantages?"
                            [rows]="3"
                            class="w-full"
                            (ngModelChange)="updateCompetitiveAdvantages($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Market Position</h4>
                          <ui-select
                            [(ngModel)]="businessPlanData.competition.marketPosition"
                            [options]="marketPositionOptions"
                            placeholder="Select your market position"
                            label="Current Market Position"
                            class="w-full"
                          />
                        </div>
                      </div>
                    }
                    
                    @case ('customers') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Target Customer Segments</h4>
                          <ui-textarea
                            [(ngModel)]="customerSegmentsText"
                            placeholder="Describe your target customer segments. Include demographic information, customer needs, and how your business plans to meet those needs."
                            [rows]="4"
                            class="w-full"
                            (ngModelChange)="updateCustomerSegments($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Customer Acquisition Strategy</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.customers.customerAcquisition"
                            placeholder="How do you acquire new customers? What channels and strategies do you use?"
                            [rows]="3"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Customer Retention</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.customers.retentionStrategy"
                            placeholder="How do you retain existing customers and build loyalty?"
                            [rows]="3"
                            class="w-full"
                          />
                        </div>
                      </div>
                    }
                    
                    @case ('suppliers') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Supply Chain Overview</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.suppliers.supplyChain"
                            placeholder="Detail your supply chain and key suppliers. Explain your procurement strategy and how you maintain good relationships with your suppliers."
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Key Suppliers</h4>
                          <ui-textarea
                            [(ngModel)]="keySuppliersText"
                            placeholder="List your key suppliers and describe your relationships with them"
                            [rows]="3"
                            class="w-full"
                            (ngModelChange)="updateKeySuppliers($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Risk Mitigation</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.suppliers.riskMitigation"
                            placeholder="How do you mitigate supply chain risks? What backup plans do you have?"
                            [rows]="3"
                            class="w-full"
                          />
                        </div>
                      </div>
                    }
                    
                    @case ('legal') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Legal and Regulatory Requirements</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.legalCompliance.complianceStatus"
                            placeholder="Outline the legal and regulatory requirements relevant to your business. Include information on licenses, permits, and compliance with industry regulations."
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Licenses and Permits</h4>
                          <ui-textarea
                            [(ngModel)]="licensesText"
                            placeholder="List all required licenses and permits for your business operations"
                            [rows]="3"
                            class="w-full"
                            (ngModelChange)="updateLicenses($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Legal Risks</h4>
                          <ui-textarea
                            [(ngModel)]="legalRisksText"
                            placeholder="Identify potential legal risks and how you plan to address them"
                            [rows]="3"
                            class="w-full"
                            (ngModelChange)="updateLegalRisks($event)"
                          />
                        </div>
                      </div>
                    }
                    
                    @case ('real-estate') {
                      <div class="space-y-6">
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Real Estate Details</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.realEstate.leaseDetails"
                            placeholder="Provide details on the real estate your business owns or leases. Include information on locations, facilities, and any real estate-related plans or strategies."
                            [rows]="4"
                            class="w-full"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Current Properties</h4>
                          <ui-textarea
                            [(ngModel)]="currentPropertiesText"
                            placeholder="List your current properties and their use in business operations"
                            [rows]="3"
                            class="w-full"
                            (ngModelChange)="updateCurrentProperties($event)"
                          />
                        </div>
                        
                        <div>
                          <h4 class="text-sm font-medium text-neutral-900 mb-3">Expansion Plans</h4>
                          <ui-textarea
                            [(ngModel)]="businessPlanData.realEstate.expansionPlans"
                            placeholder="Describe any plans for expanding or changing your real estate footprint"
                            [rows]="3"
                            class="w-full"
                          />
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          </ui-card>
        }
      </div>

      <!-- Save Actions -->
      <div class="flex justify-end space-x-4 pt-6">
        <ui-button
          variant="outline"
          (click)="saveDraft()"
          [disabled]="isSaving()"
        >
          Save Draft
        </ui-button>
        
        <ui-button
          variant="primary"
          (click)="saveAndValidate()"
          [disabled]="isSaving()"
        >
          @if (isSaving()) {
            Saving...
          } @else {
            Save & Continue
          }
        </ui-button>
      </div>
    </div>
  `
})
export class BusinessPlanComponent implements OnInit {
  FileTextIcon = FileText;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  BuildingIcon = Building;
  GavelIcon = Gavel;
  MapPinIcon = MapPin;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  isSaving = signal(false);
  
  businessPlanData: BusinessPlanData = {
    marketing: {},
    industryAnalysis: {},
    competition: {},
    customers: {},
    suppliers: {},
    legalCompliance: {},
    realEstate: {}
  };

  // Text fields for arrays
  competitorsText = '';
  competitiveAdvantagesText = '';
  customerSegmentsText = '';
  keySuppliersText = '';
  licensesText = '';
  legalRisksText = '';
  currentPropertiesText = '';

  sections: BusinessPlanSection[] = [
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Describe your marketing strategies and plans. Include details on market research, target audience, advertising channels, and promotional activities.',
      icon: TrendingUp,
      expanded: true,
      completed: false,
      required: true
    },
    {
      id: 'industry',
      title: 'Industry Analysis',
      description: 'Analyze the industry in which your business operates. Include information on market trends, key players, competitive landscape, and potential growth opportunities.',
      icon: TrendingUp,
      expanded: false,
      completed: false,
      required: true
    },
    {
      id: 'competition',
      title: 'Competition',
      description: 'Identify your main competitors and analyze their strengths and weaknesses. Explain how your business differentiates itself from the competition.',
      icon: Users,
      expanded: false,
      completed: false,
      required: true
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'Describe your target customer segments. Include demographic information, customer needs, and how your business plans to meet those needs.',
      icon: Users,
      expanded: false,
      completed: false,
      required: true
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      description: 'Detail your supply chain and key suppliers. Explain your procurement strategy and how you maintain good relationships with your suppliers.',
      icon: Building,
      expanded: false,
      completed: false,
      required: true
    },
    {
      id: 'legal',
      title: 'Legal and Compliance',
      description: 'Outline the legal and regulatory requirements relevant to your business. Include information on licenses, permits, and compliance with industry regulations.',
      icon: Gavel,
      expanded: false,
      completed: false,
      required: true
    },
    {
      id: 'real-estate',
      title: 'Real Estate (Land & Buildings)',
      description: 'Provide details on the real estate your business owns or leases. Include information on locations, facilities, and any real estate-related plans or strategies.',
      icon: MapPin,
      expanded: false,
      completed: false,
      required: false
    }
  ];

  marketPositionOptions = [
    { value: 'market-leader', label: 'Market Leader' },
    { value: 'challenger', label: 'Market Challenger' },
    { value: 'follower', label: 'Market Follower' },
    { value: 'nicher', label: 'Market Nicher' },
    { value: 'new-entrant', label: 'New Market Entrant' }
  ];

  constructor(
    private profileService: ProfileService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadExistingData();
  }

  loadExistingData() {
    const existingData = this.profileService.data().businessPlan;
    if (existingData) {
      this.businessPlanData = { ...this.businessPlanData, ...existingData };
      this.populateTextFields();
      this.updateCompletionStatus();
    }
  }

  populateTextFields() {
    this.competitorsText = this.businessPlanData.competition.mainCompetitors?.join(', ') || '';
    this.competitiveAdvantagesText = this.businessPlanData.competition.competitiveAdvantages?.join(', ') || '';
    this.customerSegmentsText = this.businessPlanData.customers.targetSegments?.join(', ') || '';
    this.keySuppliersText = this.businessPlanData.suppliers.keySuppliers?.join(', ') || '';
    this.licensesText = this.businessPlanData.legalCompliance.licenses?.join(', ') || '';
    this.legalRisksText = this.businessPlanData.legalCompliance.legalRisks?.join(', ') || '';
    this.currentPropertiesText = this.businessPlanData.realEstate.currentProperties?.join(', ') || '';
  }

  updateCompetitors(text: string) {
    this.businessPlanData.competition.mainCompetitors = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateCompetitiveAdvantages(text: string) {
    this.businessPlanData.competition.competitiveAdvantages = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateCustomerSegments(text: string) {
    this.businessPlanData.customers.targetSegments = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateKeySuppliers(text: string) {
    this.businessPlanData.suppliers.keySuppliers = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateLicenses(text: string) {
    this.businessPlanData.legalCompliance.licenses = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateLegalRisks(text: string) {
    this.businessPlanData.legalCompliance.legalRisks = text.split(',').map(item => item.trim()).filter(item => item);
  }

  updateCurrentProperties(text: string) {
    this.businessPlanData.realEstate.currentProperties = text.split(',').map(item => item.trim()).filter(item => item);
  }

  toggleSection(sectionId: string) {
    const section = this.sections.find(s => s.id === sectionId);
    if (section) {
      section.expanded = !section.expanded;
    }
  }

  getSectionIconClasses(section: BusinessPlanSection): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors';
    if (section.completed) {
      return `${baseClasses} bg-green-100 text-green-600`;
    } else if (section.expanded) {
      return `${baseClasses} bg-primary-100 text-primary-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-600`;
    }
  }

  getCompletionPercentage(): number {
    const completedSections = this.sections.filter(s => s.completed).length;
    return Math.round((completedSections / this.sections.length) * 100);
  }

  updateCompletionStatus() {
    // Update completion status based on filled fields
    this.sections.forEach(section => {
      section.completed = this.isSectionCompleted(section.id);
    });
  }

  isSectionCompleted(sectionId: string): boolean {
    switch (sectionId) {
      case 'marketing':
        return !!(this.businessPlanData.marketing.marketResearchConducted && 
                 this.businessPlanData.marketing.industryAnalysis &&
                 this.businessPlanData.marketing.salesStrategy);
      case 'industry':
        return !!(this.businessPlanData.industryAnalysis.currentGrowthProspects);
      case 'competition':
        return !!(this.businessPlanData.competition.mainCompetitors?.length && 
                 this.businessPlanData.competition.competitiveAdvantages?.length);
      case 'customers':
        return !!(this.businessPlanData.customers.targetSegments?.length && 
                 this.businessPlanData.customers.customerAcquisition);
      case 'suppliers':
        return !!(this.businessPlanData.suppliers.supplyChain);
      case 'legal':
        return !!(this.businessPlanData.legalCompliance.complianceStatus);
      case 'real-estate':
        return !!(this.businessPlanData.realEstate.leaseDetails);
      default:
        return false;
    }
  }

  onBusinessPlanUpload(files: File[]) {
    if (files.length > 0) {
      // Handle business plan document upload
      console.log('Business plan uploaded:', files[0]);
    }
  }

  async saveDraft() {
    this.isSaving.set(true);
    this.updateCompletionStatus();
    
    try {
      this.profileService.updateBusinessPlan(this.businessPlanData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveAndValidate() {
    this.isSaving.set(true);
    this.updateCompletionStatus();
    
    try {
      this.profileService.updateBusinessPlan(this.businessPlanData);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Navigate to next step
      this.profileService.nextStep();
      this.router.navigate(['/profile', this.profileService.currentStepId()]);
    } finally {
      this.isSaving.set(false);
    }
  }
}