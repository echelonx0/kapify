// src/app/profile/steps/business-plan-improved.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, FileText, TrendingUp, Users, Building, Gavel, MapPin, Upload } from 'lucide-angular';
 
import { UiTextareaComponent } from '../../shared/components/ui-textarea.component';
import { ProfileService } from '../profile.service';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../shared/components';
import { UiSectionCardComponent } from '../../shared/components/ui-section-card.component';

interface BusinessPlanSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  expanded: boolean;
  completed: boolean;
  required: boolean;
  form: FormGroup;
}

@Component({
  selector: 'app-business-plan-improved',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputComponent,
    UiTextareaComponent,
    UiSectionCardComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header Section -->
      <ui-card>
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
          <div class="flex items-center space-x-4">
            <ui-button variant="outline" size="sm" (clicked)="triggerFileUpload()">
              <lucide-icon [img]="UploadIcon" [size]="16" class="mr-2" />
              Choose File
            </ui-button>
            @if (uploadedDocument()) {
              <span class="text-sm text-neutral-600">{{ uploadedDocument()?.name }}</span>
            } @else {
              <span class="text-sm text-neutral-500">No file selected</span>
            }
          </div>
          <p class="text-xs text-neutral-500 mt-2">
            Upload your complete business plan document (PDF, DOC, or DOCX format)
          </p>
        </div>
      </ui-card>

      <!-- Business Plan Sections -->
      @for (section of sections(); track section.id) {
        <ui-section-card
          [title]="section.title"
          [description]="section.description"
          [required]="section.required"
          [completed]="section.completed"
          [hasData]="hasFormData(section)"
          [expanded]="section.expanded"
          [saving]="getSectionSaving(section.id)"
          [lastSaved]="getSectionLastSaved(section.id)"
          (expandedChange)="toggleSection(section.id, $event)"
          (saveDraft)="saveSectionDraft(section.id)"
          (saveAndValidate)="saveSectionAndValidate(section.id)"
        >
          <lucide-icon slot="icon" [img]="section.icon" [size]="16" />
          
          @switch (section.id) {
            @case ('executive-summary') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Executive Summary"
                  placeholder="Provide a concise overview of your business, including your mission, vision, key objectives, and what makes your business unique..."
                  [rows]="6"
                  [maxLength]="1000"
                  [showCharCount]="true"
                  formControlName="executiveSummary"
                  [required]="true"
                  hint="This is the first thing investors will read. Make it compelling and clear."
                />
                
                <ui-textarea
                  label="Business Concept"
                  placeholder="Describe your business concept, the problem you solve, and your solution..."
                  [rows]="4"
                  formControlName="businessConcept"
                  [required]="true"
                />
                
                <ui-input
                  label="Key Success Factors"
                  placeholder="e.g., Experienced team, proprietary technology, strong partnerships"
                  formControlName="keySuccessFactors"
                  hint="Separate multiple factors with commas"
                />
              </form>
            }
            
            @case ('market-analysis') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Market Research Methodology"
                  placeholder="How was the market research conducted? (Desktop research, surveys, focus groups, research firms, etc.)"
                  [rows]="4"
                  formControlName="researchMethodology"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Industry Analysis"
                  placeholder="Review industry information to assess the current and potential growth prospects of the market in which your business operates..."
                  [rows]="5"
                  formControlName="industryAnalysis"
                  [required]="true"
                />
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ui-input
                    label="Market Size (ZAR)"
                    type="number"
                    placeholder="e.g., 5000000"
                    formControlName="marketSize"
                    hint="Total addressable market in South African Rand"
                  />
                  <ui-input
                    label="Annual Growth Rate (%)"
                    type="number"
                    placeholder="e.g., 15"
                    formControlName="growthRate"
                    hint="Expected annual market growth percentage"
                  />
                </div>
                
                <ui-textarea
                  label="Target Market Definition"
                  placeholder="Who is your target market? How big is it? What is your current share and what is the target that you are after post investment?"
                  [rows]="4"
                  formControlName="targetMarket"
                  [required]="true"
                />
              </form>
            }
            
            @case ('marketing-strategy') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Sales and Marketing Strategy"
                  placeholder="Assess the overall sales and marketing strategy. How realistic and achievable is it? Must be based on secured contracts, letters of intent and/or verifiable market research."
                  [rows]="5"
                  formControlName="salesStrategy"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Distribution Channels"
                  placeholder="Description of distribution channels used/to be used to reach the target market"
                  [rows]="4"
                  formControlName="distributionChannels"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Marketing Campaigns & Metrics"
                  placeholder="Does the entity have any marketing campaign? What are the metrics and milestones."
                  [rows]="4"
                  formControlName="marketingCampaigns"
                />
                
                <ui-textarea
                  label="Revenue Assumptions Assessment"
                  placeholder="Assess the reasonableness of the assumptions for the revenue projects"
                  [rows]="4"
                  formControlName="revenueAssumptions"
                  [required]="true"
                />
              </form>
            }
            
            @case ('competitive-analysis') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Main Competitors"
                  placeholder="Identify your main competitors and analyze their strengths and weaknesses. Explain how your business differentiates itself from the competition."
                  [rows]="5"
                  formControlName="competitors"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Competitive Advantages"
                  placeholder="What are your key competitive advantages? How do you maintain these advantages? What makes your solution unique?"
                  [rows]="4"
                  formControlName="competitiveAdvantages"
                  [required]="true"
                />
                
                <ui-input
                  label="Market Position"
                  placeholder="e.g., Market Leader, Challenger, Niche Player"
                  formControlName="marketPosition"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Barriers to Entry"
                  placeholder="What barriers exist for new competitors entering your market? How do these barriers protect your business?"
                  [rows]="3"
                  formControlName="barriersToEntry"
                />
              </form>
            }
            
            @case ('operations') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Goods and Services"
                  placeholder="Provide a detailed description of the products or services your business offers. Explain the unique value proposition and the benefits to your customers."
                  [rows]="5"
                  formControlName="goodsServices"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Operational Processes"
                  placeholder="Describe your key operational processes, production methods, quality control measures, and service delivery mechanisms."
                  [rows]="4"
                  formControlName="operationalProcesses"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Supply Chain Management"
                  placeholder="Detail your supply chain and key suppliers. Explain your procurement strategy and supplier relationships."
                  [rows]="4"
                  formControlName="supplyChain"
                />
                
                <ui-textarea
                  label="Technology & Systems"
                  placeholder="Describe the technology, equipment, and systems critical to your operations."
                  [rows]="3"
                  formControlName="technology"
                />
              </form>
            }
            
            @case ('financial-projections') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Financial Projections Overview"
                  placeholder="Provide an overview of your financial projections, including key assumptions and methodology used."
                  [rows]="4"
                  formControlName="projectionsOverview"
                  [required]="true"
                />
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ui-input
                    label="Year 1 Revenue Projection (ZAR)"
                    type="number"
                    placeholder="e.g., 2500000"
                    formControlName="year1Revenue"
                    [required]="true"
                  />
                  <ui-input
                    label="Year 3 Revenue Projection (ZAR)"
                    type="number"
                    placeholder="e.g., 8500000"
                    formControlName="year3Revenue"
                    [required]="true"
                  />
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ui-input
                    label="Break-even Timeline (months)"
                    type="number"
                    placeholder="e.g., 18"
                    formControlName="breakEvenTimeline"
                    [required]="true"
                  />
                  <ui-input
                    label="Expected ROI (%)"
                    type="number"
                    placeholder="e.g., 25"
                    formControlName="expectedROI"
                  />
                </div>
                
                <ui-textarea
                  label="Key Financial Assumptions"
                  placeholder="List and justify the key assumptions underlying your financial projections (pricing, customer acquisition, cost structure, etc.)"
                  [rows]="4"
                  formControlName="financialAssumptions"
                  [required]="true"
                />
              </form>
            }
            
            @case ('legal-compliance') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Judgements Against Company/Directors"
                  placeholder="Are there any Judgements against the company/director(s)?"
                  [rows]="3"
                  formControlName="judgements"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Pending Legal Disputes"
                  placeholder="Are there any pending legal disputes against/by the company/director(s)?"
                  [rows]="3"
                  formControlName="legalDisputes"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Patent and Trademark Disputes"
                  placeholder="Are there any patent and trademark disputes in progress?"
                  [rows]="3"
                  formControlName="patentDisputes"
                  [required]="true"
                />
                
                <ui-textarea
                  label="Regulatory Compliance"
                  placeholder="Outline the legal and regulatory requirements relevant to your business. Include information on licenses, permits, and compliance with industry regulations."
                  [rows]="4"
                  formControlName="regulatoryCompliance"
                />
              </form>
            }
            
            @case ('real-estate') {
              <form [formGroup]="section.form" class="space-y-6">
                <ui-textarea
                  label="Real Estate Holdings"
                  placeholder="Provide details on the real estate your business owns or leases. Include information on locations, facilities, and any real estate-related plans or strategies."
                  [rows]="4"
                  formControlName="realEstateDetails"
                />
                
                <ui-textarea
                  label="Property Portfolio"
                  placeholder="List your current properties and their use in business operations, including lease terms and strategic importance."
                  [rows]="3"
                  formControlName="propertyPortfolio"
                />
                
                <ui-textarea
                  label="Expansion Plans"
                  placeholder="Describe any plans for expanding or changing your real estate footprint as part of your growth strategy."
                  [rows]="3"
                  formControlName="expansionPlans"
                />
              </form>
            }
          }
        </ui-section-card>
      }

      <!-- Overall Progress -->
      <ui-card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-neutral-900">Business Plan Progress</h3>
            <p class="text-sm text-neutral-600">
              {{ completedSections() }} of {{ totalSections() }} sections completed
            </p>
          </div>
          
          @if (allSectionsCompleted()) {
            <div class="flex items-center space-x-2 text-green-600">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="font-medium">Ready to submit</span>
            </div>
          } @else {
            <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {{ totalSections() - completedSections() }} sections remaining
            </div>
          }
        </div>
      </ui-card>
    </div>

    <!-- Hidden file input -->
    <input
      #fileInput
      type="file"
      accept=".pdf,.doc,.docx"
      (change)="onFileSelected($event)"
      class="hidden"
    />
  `
})
export class BusinessPlanComponent implements OnInit {
  FileTextIcon = FileText;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  BuildingIcon = Building;
  GavelIcon = Gavel;
  MapPinIcon = MapPin;
  UploadIcon = Upload;

  uploadedDocument = signal<File | null>(null);
  sectionSaving = signal<{ [key: string]: boolean }>({});
  sectionLastSaved = signal<{ [key: string]: boolean }>({});

  sections = signal<BusinessPlanSection[]>([]);

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {
    this.initializeSections();
  }

  ngOnInit() {
    this.loadExistingData();
  }

  initializeSections() {
    const sectionConfigs = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'Provide a compelling overview of your business opportunity and value proposition.',
        icon: FileText,
        required: true,
        fields: {
          executiveSummary: ['', [Validators.required, Validators.maxLength(1000)]],
          businessConcept: ['', [Validators.required]],
          keySuccessFactors: ['']
        }
      },
      {
        id: 'market-analysis',
        title: 'Market Analysis',
        description: 'Demonstrate your understanding of the market, industry trends, and target customers.',
        icon: TrendingUp,
        required: true,
        fields: {
          researchMethodology: ['', [Validators.required]],
          industryAnalysis: ['', [Validators.required]],
          marketSize: [''],
          growthRate: [''],
          targetMarket: ['', [Validators.required]]
        }
      },
      {
        id: 'marketing-strategy',
        title: 'Marketing & Sales Strategy',
        description: 'Outline how you will acquire and retain customers, and generate revenue.',
        icon: TrendingUp,
        required: true,
        fields: {
          salesStrategy: ['', [Validators.required]],
          distributionChannels: ['', [Validators.required]],
          marketingCampaigns: [''],
          revenueAssumptions: ['', [Validators.required]]
        }
      },
      {
        id: 'competitive-analysis',
        title: 'Competitive Analysis',
        description: 'Analyze your competition and articulate your competitive advantages.',
        icon: Users,
        required: true,
        fields: {
          competitors: ['', [Validators.required]],
          competitiveAdvantages: ['', [Validators.required]],
          marketPosition: ['', [Validators.required]],
          barriersToEntry: ['']
        }
      },
      {
        id: 'operations',
        title: 'Operations & Products',
        description: 'Detail your products/services and operational capabilities.',
        icon: Building,
        required: true,
        fields: {
          goodsServices: ['', [Validators.required]],
          operationalProcesses: ['', [Validators.required]],
          supplyChain: [''],
          technology: ['']
        }
      },
      {
        id: 'financial-projections',
        title: 'Financial Projections',
        description: 'Present realistic financial forecasts and key assumptions.',
        icon: TrendingUp,
        required: true,
        fields: {
          projectionsOverview: ['', [Validators.required]],
          year1Revenue: ['', [Validators.required]],
          year3Revenue: ['', [Validators.required]],
          breakEvenTimeline: ['', [Validators.required]],
          expectedROI: [''],
          financialAssumptions: ['', [Validators.required]]
        }
      },
      {
        id: 'legal-compliance',
        title: 'Legal & Compliance',
        description: 'Address legal matters, regulatory compliance, and risk factors.',
        icon: Gavel,
        required: true,
        fields: {
          judgements: ['', [Validators.required]],
          legalDisputes: ['', [Validators.required]],
          patentDisputes: ['', [Validators.required]],
          regulatoryCompliance: ['']
        }
      },
      {
        id: 'real-estate',
        title: 'Real Estate & Facilities',
        description: 'Detail your physical assets and location strategy.',
        icon: MapPin,
        required: false,
        fields: {
          realEstateDetails: [''],
          propertyPortfolio: [''],
          expansionPlans: ['']
        }
      }
    ];

    const sections = sectionConfigs.map(config => ({
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      expanded: config.id === 'executive-summary', // First section expanded by default
      completed: false,
      required: config.required,
      form: this.fb.group(config.fields)
    }));

    this.sections.set(sections);

    // Set up auto-save for each form
    this.sections().forEach(section => {
      section.form.valueChanges.subscribe(() => {
        this.autoSaveSection(section.id);
      });
    });
  }

  loadExistingData() {
    const existingData = this.profileService.data().businessPlan;
    if (existingData) {
      this.sections().forEach(section => {
        const sectionData = existingData[section.id as keyof typeof existingData];
        if (sectionData) {
          section.form.patchValue(sectionData);
          this.updateSectionCompletion(section);
        }
      });
    }
  }

  toggleSection(sectionId: string, expanded: boolean) {
    this.sections.update(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, expanded }
          : section
      )
    );
  }

  hasFormData(section: BusinessPlanSection): boolean {
    const formValue = section.form.value;
    return Object.values(formValue).some(value => 
      value && typeof value === 'string' && value.trim().length > 0
    );
  }

  getSectionSaving(sectionId: string): boolean {
    return this.sectionSaving()[sectionId] || false;
  }

  getSectionLastSaved(sectionId: string): boolean {
    return this.sectionLastSaved()[sectionId] || false;
  }

  updateSectionCompletion(section: BusinessPlanSection) {
    // Check if all required fields are filled
    const requiredControls = Object.keys(section.form.controls).filter(key => 
      section.form.get(key)?.hasError('required') === false
    );
    
    section.completed = section.form.valid && this.hasFormData(section);
  }

  async autoSaveSection(sectionId: string) {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    // Set saving state
    this.sectionSaving.update(state => ({ ...state, [sectionId]: true }));

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update completion status
    this.updateSectionCompletion(section);

    // Save to service
    this.saveBusinessPlanData();

    // Update UI states
    this.sectionSaving.update(state => ({ ...state, [sectionId]: false }));
    this.sectionLastSaved.update(state => ({ ...state, [sectionId]: true }));

    // Hide saved indicator after 3 seconds
    setTimeout(() => {
      this.sectionLastSaved.update(state => ({ ...state, [sectionId]: false }));
    }, 3000);
  }

  async saveSectionDraft(sectionId: string) {
    await this.autoSaveSection(sectionId);
  }

  async saveSectionAndValidate(sectionId: string) {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    // Validate section
    section.form.markAllAsTouched();
    
    if (section.form.invalid) {
      // Show validation errors
      return;
    }

    await this.autoSaveSection(sectionId);

    // Move to next section or complete
    const currentIndex = this.sections().findIndex(s => s.id === sectionId);
    const nextSection = this.sections()[currentIndex + 1];
    
    if (nextSection) {
      this.toggleSection(nextSection.id, true);
      this.toggleSection(sectionId, false);
    }
  }

  triggerFileUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please upload only PDF, DOC, or DOCX files');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      this.uploadedDocument.set(file);
      this.saveBusinessPlanData();
      
      // Clear input
      input.value = '';
    }
  }

  getCompletionPercentage(): number {
    const totalSections = this.sections().length;
    const completedSections = this.sections().filter(s => s.completed).length;
    return Math.round((completedSections / totalSections) * 100);
  }

  completedSections(): number {
    return this.sections().filter(s => s.completed).length;
  }

  totalSections(): number {
    return this.sections().length;
  }

  allSectionsCompleted(): boolean {
    return this.sections().every(s => s.completed || !s.required);
  }

  private saveBusinessPlanData() {
    const businessPlanData: any = {
      uploadedDocument: this.uploadedDocument()
    };

    // Collect all form data
    this.sections().forEach(section => {
      businessPlanData[section.id] = section.form.value;
    });

    // Add completion metadata
    businessPlanData.completionPercentage = this.getCompletionPercentage();
    businessPlanData.lastUpdated = new Date().toISOString();

    // Save to profile service
    this.profileService.updateBusinessPlan(businessPlanData);
  }
}

 