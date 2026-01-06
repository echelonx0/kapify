// src/app/profile/steps/business-plan.component.ts
import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  FileText,
  TrendingUp,
  Users,
  Building,
  Gavel,
  MapPin,
  Upload,
  Save,
  Clock,
} from 'lucide-angular';
import {
  UiButtonComponent,
  UiCardComponent,
  UiInputComponent,
} from '../../../../shared/components';
import { UiSectionCardComponent } from '../../../../shared/components/ui-section-card.component';
import { UiTextareaComponent } from '../../../../shared/components/ui-textarea.component';

import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { FundingProfileSetupService } from '../../../../fund-seeking-orgs/services/funding-profile-setup.service';
import {
  BusinessStrategy,
  FinancialProjection,
} from 'src/app/fund-seeking-orgs/applications/models/funding-application.models';
import { SupabaseDocumentService } from 'src/app/shared/services/supabase-document.service';

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
    UiSectionCardComponent,
  ],
  templateUrl: 'business-strategy.component.html',
})
export class BusinessPlanComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);
  private documentService = inject(SupabaseDocumentService);

  // Document state
  businessPlanDocumentId = signal<string | undefined>(undefined);
  businessPlanFileName = signal<string | undefined>(undefined);
  isUploadingBusinessPlan = signal(false);
  // Icons
  FileTextIcon = FileText;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  BuildingIcon = Building;
  GavelIcon = Gavel;
  MapPinIcon = MapPin;
  UploadIcon = Upload;
  SaveIcon = Save;
  ClockIcon = Clock;

  // State signals
  uploadedDocument = signal<File | null>(null);
  sectionSaving = signal<{ [key: string]: boolean }>({});
  sectionLastSaved = signal<{ [key: string]: boolean }>({});
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);

  sections = signal<BusinessPlanSection[]>([]);

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.initializeSections();
  }

  ngOnInit() {
    this.loadExistingData();
    this.loadBusinessPlanDocument();
    this.setupAutoSave();
  }

  private loadBusinessPlanDocument(): void {
    const existingData = this.fundingApplicationService.data().businessStrategy;
    if (existingData?.businessPlanDocumentId) {
      this.businessPlanDocumentId.set(existingData.businessPlanDocumentId);

      this.documentService.getDocumentsByUser().subscribe({
        next: (docs) => {
          const doc = docs.get('businessPlan');
          if (doc) {
            this.businessPlanFileName.set(doc.originalName);
          }
        },
      });
    }
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().businessStrategy;
    if (existingData) {
      this.populateFromBusinessStrategy(existingData);
    }
  }

  private populateFromBusinessStrategy(data: BusinessStrategy) {
    this.sections().forEach((section) => {
      switch (section.id) {
        case 'executive-summary':
          section.form.patchValue({
            executiveSummary: data.executiveSummary || '',
            businessConcept: data.missionStatement || '',
            keySuccessFactors: data.strategicObjectives?.join(', ') || '',
          });
          break;
        case 'market-analysis':
          section.form.patchValue({
            industryAnalysis: data.marketAnalysis || '',
            targetMarket: data.competitiveStrategy || '',
            marketResearch: '',
            currentMarketShare: '',
            targetMarketShare: '',
          });
          break;
        case 'competitive-analysis':
          section.form.patchValue({
            competitiveLandscape: data.competitiveStrategy || '',
            competitiveAdvantage: data.marketingStrategy || '',
            marketPositioning: data.pricingStrategy || '',
          });
          break;
        case 'operations-plan':
          section.form.patchValue({
            operationsOverview: data.scalingStrategy || '',
            supplyChain: '',
            technology: '',
            qualityControl: '',
          });
          break;
        case 'financial-projections':
          section.form.patchValue({
            projectionsOverview: data.profitabilityTimeline || '',
            year1Revenue: data.revenueProjections?.[0]?.assumptions || '',
            year3Revenue: data.revenueProjections?.[2]?.assumptions || '',
            breakEvenTimeline: data.breakEvenAnalysis || '',
            expectedROI: data.returnOnInvestment || '',
            financialAssumptions: '',
          });
          break;
        case 'legal-compliance':
          section.form.patchValue({
            judgements: '',
            legalStructure: '',
            intellectualProperty: '',
            riskManagement: '',
          });
          break;
      }
      this.updateSectionCompletion(section);
    });

    // Update sections signal to trigger change detection
    this.sections.update((sections) => [...sections]);
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000)
      .pipe(takeWhile(() => true))
      .subscribe(() => {
        if (this.hasAnyData() && !this.isSaving()) {
          this.saveData(false);
        }
      });

    // Setup form change listeners for debounced save
    this.sections().forEach((section) => {
      section.form.valueChanges.subscribe(() => this.debouncedSave());
    });
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      if (this.hasAnyData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000); // 2 second debounce
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const businessStrategyData = this.buildBusinessStrategyData();
      this.fundingApplicationService.updateBusinessStrategy(
        businessStrategyData
      );

      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }

      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save business strategy:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildBusinessStrategyData(): BusinessStrategy {
    const sectionsData = this.sections();
    const documentFile = this.uploadedDocument();

    // Extract data from all sections
    const executiveData = sectionsData.find((s) => s.id === 'executive-summary')
      ?.form.value;
    const marketData = sectionsData.find((s) => s.id === 'market-analysis')
      ?.form.value;
    const competitiveData = sectionsData.find(
      (s) => s.id === 'competitive-analysis'
    )?.form.value;
    const operationsData = sectionsData.find((s) => s.id === 'operations-plan')
      ?.form.value;
    const financialData = sectionsData.find(
      (s) => s.id === 'financial-projections'
    )?.form.value;
    const legalData = sectionsData.find((s) => s.id === 'legal-compliance')
      ?.form.value;

    return {
      // Strategic Planning
      executiveSummary: executiveData?.executiveSummary || '',
      missionStatement: executiveData?.businessConcept || '',
      visionStatement: executiveData?.keySuccessFactors || '',
      strategicObjectives: executiveData?.keySuccessFactors
        ? executiveData.keySuccessFactors
            .split(',')
            .map((s: string) => s.trim())
        : [],
      businessPlanDocumentId: this.businessPlanDocumentId(),
      // Market Strategy
      marketAnalysis: marketData?.industryAnalysis || '',
      competitiveStrategy: competitiveData?.competitiveLandscape || '',
      pricingStrategy: competitiveData?.marketPositioning || '',
      marketingStrategy: competitiveData?.competitiveAdvantage || '',

      // Growth Plans
      expansionPlans: operationsData?.operationsOverview || '',
      productDevelopment: operationsData?.technology || '',
      marketEntry: marketData?.targetMarket || '',
      scalingStrategy: operationsData?.supplyChain || '',

      // Financial Projections
      revenueProjections: this.buildRevenueProjections(financialData),
      profitabilityTimeline: financialData?.projectionsOverview || '',
      breakEvenAnalysis: financialData?.breakEvenTimeline?.toString() || '',
      returnOnInvestment: financialData?.expectedROI?.toString() || '',

      // Funding Strategy
      fundingRequirements: {
        totalAmountRequired: 0, // Would be populated from another section
        currency: 'ZAR',
        fundingType: 'loan', // Would be determined elsewhere
        fundingPurpose: executiveData?.executiveSummary || '',
        timeline: financialData?.breakEvenTimeline?.toString() || '',
        repaymentTerms: undefined,
        collateral: undefined,
      },
      useOfFunds: executiveData?.executiveSummary || '',
      repaymentStrategy: legalData?.riskManagement || undefined,
      exitStrategy: undefined,
    };
  }
  // Replace the buildRevenueProjections method with this corrected version:
  private buildRevenueProjections(financialData: any): FinancialProjection[] {
    if (!financialData) return [];

    const projections: FinancialProjection[] = [];

    if (financialData.year1Revenue) {
      projections.push({
        year: 1,
        amount: financialData.year1Revenue,
        assumptions: financialData.financialAssumptions || '',
      });
    }

    if (financialData.year3Revenue) {
      projections.push({
        year: 3,
        amount: financialData.year3Revenue,
        assumptions: financialData.financialAssumptions || '',
      });
    }

    return projections;
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  hasAnyData(): boolean {
    return (
      this.sections().some((section) => this.hasFormData(section)) ||
      !!this.uploadedDocument()
    );
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return saved.toLocaleDateString();
  }

  // ===============================
  // SECTION MANAGEMENT
  // ===============================

  initializeSections() {
    const sectionConfigs = [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description:
          'Provide a compelling overview of your business opportunity and value proposition.',
        icon: FileText,
        required: true,
        fields: {
          executiveSummary: [
            '',
            [Validators.required, Validators.maxLength(1000)],
          ],
          businessConcept: ['', [Validators.required]],
          keySuccessFactors: [''],
        },
      },
      {
        id: 'market-analysis',
        title: 'Market Analysis',
        description:
          'Demonstrate your understanding of the market, industry trends, and target customers.',
        icon: TrendingUp,
        required: true,
        fields: {
          industryAnalysis: ['', [Validators.required]],
          targetMarket: ['', [Validators.required]],
          marketResearch: [''],
          currentMarketShare: [''],
          targetMarketShare: [''],
        },
      },
      {
        id: 'competitive-analysis',
        title: 'Competitive Analysis',
        description:
          'Analyze your competitive landscape and positioning strategy.',
        icon: Users,
        required: true,
        fields: {
          competitiveLandscape: ['', [Validators.required]],
          competitiveAdvantage: ['', [Validators.required]],
          marketPositioning: [''],
        },
      },
      {
        id: 'operations-plan',
        title: 'Operations Plan',
        description:
          'Detail your operational processes, supply chain, and technology requirements.',
        icon: Building,
        required: false,
        fields: {
          operationsOverview: ['', [Validators.required]],
          supplyChain: [''],
          technology: [''],
          qualityControl: [''],
        },
      },
      {
        id: 'financial-projections',
        title: 'Financial Projections',
        description:
          'Present detailed financial forecasts and key assumptions.',
        icon: TrendingUp,
        required: true,
        fields: {
          projectionsOverview: ['', [Validators.required]],
          year1Revenue: ['', [Validators.required, Validators.min(0)]],
          year3Revenue: ['', [Validators.required, Validators.min(0)]],
          breakEvenTimeline: ['', [Validators.required, Validators.min(1)]],
          expectedROI: [''],
          financialAssumptions: ['', [Validators.required]],
        },
      },
      {
        id: 'legal-compliance',
        title: 'Legal & Compliance',
        description:
          'Address legal structure, compliance requirements, and risk management.',
        icon: Gavel,
        required: false,
        fields: {
          judgements: [''],
          legalStructure: [''],
          intellectualProperty: [''],
          riskManagement: [''],
        },
      },
    ];

    const sections = sectionConfigs.map((config) => ({
      id: config.id,
      title: config.title,
      description: config.description,
      icon: config.icon,
      expanded: false,
      completed: false,
      required: config.required,
      form: this.fb.group(config.fields),
    }));

    this.sections.set(sections);
  }

  toggleSection(sectionId: string, expanded: boolean) {
    this.sections.update((sections) =>
      sections.map((s) => (s.id === sectionId ? { ...s, expanded } : s))
    );
  }

  hasFormData(section: BusinessPlanSection): boolean {
    const formValue = section.form.value;
    return Object.values(formValue).some(
      (value) => value && value.toString().trim() !== ''
    );
  }

  getSectionSaving(sectionId: string): boolean {
    return this.sectionSaving()[sectionId] || false;
  }

  getSectionLastSaved(sectionId: string): boolean {
    return this.sectionLastSaved()[sectionId] || false;
  }

  async saveSectionDraft(sectionId: string) {
    const section = this.sections().find((s) => s.id === sectionId);
    if (!section) return;

    this.sectionSaving.update((saving) => ({ ...saving, [sectionId]: true }));

    try {
      await this.saveData(false);
      this.sectionLastSaved.update((lastSaved) => ({
        ...lastSaved,
        [sectionId]: true,
      }));

      // Reset last saved indicator after 3 seconds
      setTimeout(() => {
        this.sectionLastSaved.update((lastSaved) => ({
          ...lastSaved,
          [sectionId]: false,
        }));
      }, 3000);
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      this.sectionSaving.update((saving) => ({
        ...saving,
        [sectionId]: false,
      }));
    }
  }

  async saveSectionAndValidate(sectionId: string) {
    const section = this.sections().find((s) => s.id === sectionId);
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
    this.sections.update((sections) => [...sections]);
  }

  // ===============================
  // FILE UPLOAD METHODS
  // ===============================

  triggerFileUpload() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

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

    this.isUploadingBusinessPlan.set(true);

    this.documentService
      .uploadDocument(file, 'businessPlan', undefined, 'business-strategy')
      .subscribe({
        next: (result) => {
          this.businessPlanDocumentId.set(result.id);
          this.businessPlanFileName.set(result.originalName);
          this.uploadedDocument.set(file); // Keep for backward compat
          this.isUploadingBusinessPlan.set(false);
          this.saveData(false);
        },
        error: (error) => {
          console.error('Business plan upload failed:', error);
          this.isUploadingBusinessPlan.set(false);
          alert('Upload failed. Please try again.');
        },
      });

    // Clear input
    input.value = '';
  }

  downloadBusinessPlan(): void {
    if (!this.businessPlanDocumentId()) return;
    this.documentService.downloadDocumentByKey('businessPlan').subscribe();
  }

  deleteBusinessPlan(): void {
    if (!this.businessPlanDocumentId()) return;
    if (!confirm('Delete business plan document?')) return;

    this.documentService.deleteDocumentByKey('businessPlan').subscribe({
      next: () => {
        this.businessPlanDocumentId.set(undefined);
        this.businessPlanFileName.set(undefined);
        this.uploadedDocument.set(null);
        this.saveData(false);
      },
      error: (error) => {
        console.error('Delete failed:', error);
        alert('Failed to delete document.');
      },
    });
  }
  // ===============================
  // PROGRESS METHODS
  // ===============================

  getCompletionPercentage(): number {
    const totalSections = this.sections().length;
    const completedSections = this.sections().filter((s) => s.completed).length;
    return Math.round((completedSections / totalSections) * 100);
  }

  completedSections(): number {
    return this.sections().filter((s) => s.completed).length;
  }

  totalSections(): number {
    return this.sections().length;
  }

  allSectionsCompleted(): boolean {
    return this.sections().every((s) => s.completed || !s.required);
  }
}
