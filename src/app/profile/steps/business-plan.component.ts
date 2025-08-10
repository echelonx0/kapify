// // src/app/profile/steps/business-plan-improved.component.ts
// import { Component, signal, OnInit } from '@angular/core';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { LucideAngularModule, FileText, TrendingUp, Users, Building, Gavel, MapPin, Upload } from 'lucide-angular';
 
// import { UiTextareaComponent } from '../../shared/components/ui-textarea.component';
// import { ProfileService } from '../profile.service';
// import { UiButtonComponent, UiCardComponent, UiInputComponent } from '../../shared/components';
// import { UiSectionCardComponent } from '../../shared/components/ui-section-card.component';

// interface BusinessPlanSection {
//   id: string;
//   title: string;
//   description: string;
//   icon: any;
//   expanded: boolean;
//   completed: boolean;
//   required: boolean;
//   form: FormGroup;
// }

// @Component({
//   selector: 'app-business-plan-improved',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     LucideAngularModule,
//     UiButtonComponent,
//     UiCardComponent,
//     UiInputComponent,
//     UiTextareaComponent,
//     UiSectionCardComponent
//   ],
//   templateUrl: 'business-plan.component.html'
// })
// export class BusinessPlanComponent implements OnInit {
//   FileTextIcon = FileText;
//   TrendingUpIcon = TrendingUp;
//   UsersIcon = Users;
//   BuildingIcon = Building;
//   GavelIcon = Gavel;
//   MapPinIcon = MapPin;
//   UploadIcon = Upload;

//   uploadedDocument = signal<File | null>(null);
//   sectionSaving = signal<{ [key: string]: boolean }>({});
//   sectionLastSaved = signal<{ [key: string]: boolean }>({});

//   sections = signal<BusinessPlanSection[]>([]);

//   constructor(
//     private fb: FormBuilder,
//     private profileService: ProfileService
//   ) {
//     this.initializeSections();
//   }

//   ngOnInit() {
//     this.loadExistingData();
//   }

//   initializeSections() {
//     const sectionConfigs = [
//       {
//         id: 'executive-summary',
//         title: 'Executive Summary',
//         description: 'Provide a compelling overview of your business opportunity and value proposition.',
//         icon: FileText,
//         required: true,
//         fields: {
//           executiveSummary: ['', [Validators.required, Validators.maxLength(1000)]],
//           businessConcept: ['', [Validators.required]],
//           keySuccessFactors: ['']
//         }
//       },
//       {
//         id: 'market-analysis',
//         title: 'Market Analysis',
//         description: 'Demonstrate your understanding of the market, industry trends, and target customers.',
//         icon: TrendingUp,
//         required: true,
//         fields: {
//           researchMethodology: ['', [Validators.required]],
//           industryAnalysis: ['', [Validators.required]],
//           marketSize: [''],
//           growthRate: [''],
//           targetMarket: ['', [Validators.required]]
//         }
//       },
//       {
//         id: 'marketing-strategy',
//         title: 'Marketing & Sales Strategy',
//         description: 'Outline how you will acquire and retain customers, and generate revenue.',
//         icon: TrendingUp,
//         required: true,
//         fields: {
//           salesStrategy: ['', [Validators.required]],
//           distributionChannels: ['', [Validators.required]],
//           marketingCampaigns: [''],
//           revenueAssumptions: ['', [Validators.required]]
//         }
//       },
//       {
//         id: 'competitive-analysis',
//         title: 'Competitive Analysis',
//         description: 'Analyze your competition and articulate your competitive advantages.',
//         icon: Users,
//         required: true,
//         fields: {
//           competitors: ['', [Validators.required]],
//           competitiveAdvantages: ['', [Validators.required]],
//           marketPosition: ['', [Validators.required]],
//           barriersToEntry: ['']
//         }
//       },
//       {
//         id: 'operations',
//         title: 'Operations & Products',
//         description: 'Detail your products/services and operational capabilities.',
//         icon: Building,
//         required: true,
//         fields: {
//           goodsServices: ['', [Validators.required]],
//           operationalProcesses: ['', [Validators.required]],
//           supplyChain: [''],
//           technology: ['']
//         }
//       },
//       {
//         id: 'financial-projections',
//         title: 'Financial Projections',
//         description: 'Present realistic financial forecasts and key assumptions.',
//         icon: TrendingUp,
//         required: true,
//         fields: {
//           projectionsOverview: ['', [Validators.required]],
//           year1Revenue: ['', [Validators.required]],
//           year3Revenue: ['', [Validators.required]],
//           breakEvenTimeline: ['', [Validators.required]],
//           expectedROI: [''],
//           financialAssumptions: ['', [Validators.required]]
//         }
//       },
//       {
//         id: 'legal-compliance',
//         title: 'Legal & Compliance',
//         description: 'Address legal matters, regulatory compliance, and risk factors.',
//         icon: Gavel,
//         required: true,
//         fields: {
//           judgements: ['', [Validators.required]],
//           legalDisputes: ['', [Validators.required]],
//           patentDisputes: ['', [Validators.required]],
//           regulatoryCompliance: ['']
//         }
//       },
//       {
//         id: 'real-estate',
//         title: 'Real Estate & Facilities',
//         description: 'Detail your physical assets and location strategy.',
//         icon: MapPin,
//         required: false,
//         fields: {
//           realEstateDetails: [''],
//           propertyPortfolio: [''],
//           expansionPlans: ['']
//         }
//       }
//     ];

//     const sections = sectionConfigs.map(config => ({
//       id: config.id,
//       title: config.title,
//       description: config.description,
//       icon: config.icon,
//       expanded: config.id === 'executive-summary', // First section expanded by default
//       completed: false,
//       required: config.required,
//       form: this.fb.group(config.fields)
//     }));

//     this.sections.set(sections);

//     // Set up auto-save for each form
//     this.sections().forEach(section => {
//       section.form.valueChanges.subscribe(() => {
//         this.autoSaveSection(section.id);
//       });
//     });
//   }

//   loadExistingData() {
//     const existingData = this.profileService.data().businessPlan;
//     if (existingData) {
//       this.sections().forEach(section => {
//         const sectionData = existingData[section.id as keyof typeof existingData];
//         if (sectionData) {
//           section.form.patchValue(sectionData);
//           this.updateSectionCompletion(section);
//         }
//       });
//     }
//   }

//   toggleSection(sectionId: string, expanded: boolean) {
//     this.sections.update(sections => 
//       sections.map(section => 
//         section.id === sectionId 
//           ? { ...section, expanded }
//           : section
//       )
//     );
//   }

//   hasFormData(section: BusinessPlanSection): boolean {
//     const formValue = section.form.value;
//     return Object.values(formValue).some(value => 
//       value && typeof value === 'string' && value.trim().length > 0
//     );
//   }

//   getSectionSaving(sectionId: string): boolean {
//     return this.sectionSaving()[sectionId] || false;
//   }

//   getSectionLastSaved(sectionId: string): boolean {
//     return this.sectionLastSaved()[sectionId] || false;
//   }

//   updateSectionCompletion(section: BusinessPlanSection) {
//     // Check if all required fields are filled
//     const requiredControls = Object.keys(section.form.controls).filter(key => 
//       section.form.get(key)?.hasError('required') === false
//     );
    
//     section.completed = section.form.valid && this.hasFormData(section);
//   }

//   async autoSaveSection(sectionId: string) {
//     const section = this.sections().find(s => s.id === sectionId);
//     if (!section) return;

//     // Set saving state
//     this.sectionSaving.update(state => ({ ...state, [sectionId]: true }));

//     // Simulate save delay
//     await new Promise(resolve => setTimeout(resolve, 800));

//     // Update completion status
//     this.updateSectionCompletion(section);

//     // Save to service
//     this.saveBusinessPlanData();

//     // Update UI states
//     this.sectionSaving.update(state => ({ ...state, [sectionId]: false }));
//     this.sectionLastSaved.update(state => ({ ...state, [sectionId]: true }));

//     // Hide saved indicator after 3 seconds
//     setTimeout(() => {
//       this.sectionLastSaved.update(state => ({ ...state, [sectionId]: false }));
//     }, 3000);
//   }

//   async saveSectionDraft(sectionId: string) {
//     await this.autoSaveSection(sectionId);
//   }

//   async saveSectionAndValidate(sectionId: string) {
//     const section = this.sections().find(s => s.id === sectionId);
//     if (!section) return;

//     // Validate section
//     section.form.markAllAsTouched();
    
//     if (section.form.invalid) {
//       // Show validation errors
//       return;
//     }

//     await this.autoSaveSection(sectionId);

//     // Move to next section or complete
//     const currentIndex = this.sections().findIndex(s => s.id === sectionId);
//     const nextSection = this.sections()[currentIndex + 1];
    
//     if (nextSection) {
//       this.toggleSection(nextSection.id, true);
//       this.toggleSection(sectionId, false);
//     }
//   }

//   triggerFileUpload() {
//     const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
//     fileInput?.click();
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     const file = input.files?.[0];
    
//     if (file) {
//       // Validate file type
//       const allowedTypes = ['.pdf', '.doc', '.docx'];
//       const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
//       if (!allowedTypes.includes(fileExtension)) {
//         alert('Please upload only PDF, DOC, or DOCX files');
//         return;
//       }

//       // Validate file size (10MB limit)
//       if (file.size > 10 * 1024 * 1024) {
//         alert('File size must be less than 10MB');
//         return;
//       }

//       this.uploadedDocument.set(file);
//       this.saveBusinessPlanData();
      
//       // Clear input
//       input.value = '';
//     }
//   }

//   getCompletionPercentage(): number {
//     const totalSections = this.sections().length;
//     const completedSections = this.sections().filter(s => s.completed).length;
//     return Math.round((completedSections / totalSections) * 100);
//   }

//   completedSections(): number {
//     return this.sections().filter(s => s.completed).length;
//   }

//   totalSections(): number {
//     return this.sections().length;
//   }

//   allSectionsCompleted(): boolean {
//     return this.sections().every(s => s.completed || !s.required);
//   }

//   private saveBusinessPlanData() {
//     const businessPlanData: any = {
//       uploadedDocument: this.uploadedDocument()
//     };

//     // Collect all form data
//     this.sections().forEach(section => {
//       businessPlanData[section.id] = section.form.value;
//     });

//     // Add completion metadata
//     businessPlanData.completionPercentage = this.getCompletionPercentage();
//     businessPlanData.lastUpdated = new Date().toISOString();

//     // Save to profile service
//     this.profileService.updateBusinessPlan(businessPlanData);
//   }
// }

 