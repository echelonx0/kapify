// src/app/profile/steps/business-plan.component.ts
import { Component, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, FileText, TrendingUp, Users, Building, Gavel, MapPin, Upload } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../../shared/components';
import { UiSectionCardComponent } from '../../../shared/components/ui-section-card.component';
import { UiTextareaComponent } from '../../../shared/components/ui-textarea.component';
import { FundingApplicationProfileService } from '../../../applications/services/funding-profile.service';
 

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
  selector: 'app-business-plan',
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
  templateUrl: 'business-plan.component.html'
})
export class BusinessPlanComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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
    private profileService: FundingApplicationProfileService
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
          industryAnalysis: ['', [Validators.required]],
          targetMarket: ['', [Validators.required]],
          marketResearch: [''],
          currentMarketShare: [''],
          targetMarketShare: ['']
        }
      },
      {
        id: 'competitive-analysis',
        title: 'Competitive Analysis',
        description: 'Analyze your competitive landscape and positioning strategy.',
        icon: Users,
        required: true,
        fields: {
          competitiveLandscape: ['', [Validators.required]],
          competitiveAdvantage: ['', [Validators.required]],
          marketPositioning: ['']
        }
      },
      {
        id: 'operations-plan',
        title: 'Operations Plan',
        description: 'Detail your operational processes, supply chain, and technology requirements.',
        icon: Building,
        required: false,
        fields: {
          operationsOverview: ['', [Validators.required]],
          supplyChain: [''],
          technology: [''],
          qualityControl: ['']
        }
      },
      {
        id: 'financial-projections',
        title: 'Financial Projections',
        description: 'Present detailed financial forecasts and key assumptions.',
        icon: TrendingUp,
        required: true,
        fields: {
          projectionsOverview: ['', [Validators.required]],
          year1Revenue: ['', [Validators.required, Validators.min(0)]],
          year3Revenue: ['', [Validators.required, Validators.min(0)]],
          breakEvenTimeline: ['', [Validators.required, Validators.min(1)]],
          expectedROI: [''],
          financialAssumptions: ['', [Validators.required]]
        }
      },
      {
        id: 'legal-compliance',
        title: 'Legal & Compliance',
        description: 'Address legal structure, compliance requirements, and risk management.',
        icon: Gavel,
        required: false,
        fields: {
          judgements: [''],
          legalStructure: [''],
          intellectualProperty: [''],
          riskManagement: ['']
        }
      }
    ];

    const sections = sectionConfigs.map(config => ({
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      expanded: false,
      completed: false,
      required: config.required,
      form: this.fb.group(config.fields)
    }));

    this.sections.set(sections);
  }

  loadExistingData() {
    // Load from profile service
    // const businessPlanData = this.profileService.getBusinessPlanData();
    // if (businessPlanData) {
    //   this.sections().forEach(section => {
    //     if (businessPlanData[section.id]) {
    //       section.form.patchValue(businessPlanData[section.id]);
    //       this.updateSectionCompletion(section);
    //     }
    //   });
    // }
  }

  toggleSection(sectionId: string, expanded: boolean) {
    this.sections.update(sections => 
      sections.map(s => s.id === sectionId ? { ...s, expanded } : s)
    );
  }

  hasFormData(section: BusinessPlanSection): boolean {
    const formValue = section.form.value;
    return Object.values(formValue).some(value => value && value.toString().trim() !== '');
  }

  getSectionSaving(sectionId: string): boolean {
    return this.sectionSaving()[sectionId] || false;
  }

  getSectionLastSaved(sectionId: string): boolean {
    return this.sectionLastSaved()[sectionId] || false;
  }

  async saveSectionDraft(sectionId: string) {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    this.sectionSaving.update(saving => ({ ...saving, [sectionId]: true }));

    try {
      await this.saveBusinessPlanData();
      this.sectionLastSaved.update(lastSaved => ({ ...lastSaved, [sectionId]: true }));
      
      // Reset last saved indicator after 3 seconds
      setTimeout(() => {
        this.sectionLastSaved.update(lastSaved => ({ ...lastSaved, [sectionId]: false }));
      }, 3000);
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      this.sectionSaving.update(saving => ({ ...saving, [sectionId]: false }));
    }
  }

  async saveSectionAndValidate(sectionId: string) {
    const section = this.sections().find(s => s.id === sectionId);
    if (!section) return;

    // Mark all fields as touched to show validation errors
    section.form.markAllAsTouched();

    if (section.form.valid) {
      await this.saveSectionDraft(sectionId);
      this.updateSectionCompletion(section);
    }
  }

  updateSectionCompletion(section: BusinessPlanSection) {
    const isValid = section.form.valid;
    const hasData = this.hasFormData(section);
    
    section.completed = section.required ? isValid && hasData : hasData;
    
    // Update the sections signal to trigger change detection
    this.sections.update(sections => [...sections]);
  }

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
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

  private async saveBusinessPlanData() {
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
    return this.profileService.updateBusinessPlan(businessPlanData);
  }
}