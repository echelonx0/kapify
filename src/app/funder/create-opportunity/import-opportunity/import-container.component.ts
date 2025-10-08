// src/app/funder/components/import-opportunity/import-opportunity-container.component.ts
import { Component, signal, inject, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Home } from 'lucide-angular';
import { UploadStepComponent } from './steps/upload-step.component';
import { MappingStepComponent } from './steps/mapping-step.component';
import { PreviewStepComponent } from './steps/preview-step.component';
import { ResultsStepComponent } from './steps/results-step.component';
import { FundingOpportunityService } from '../../../funding/services/funding-opportunity.service';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';

type StepId = 'upload' | 'mapping' | 'preview' | 'results';

interface StepConfig {
  id: StepId;
  title: string;
  component: any;
}

@Component({
  selector: 'app-import-opportunity-container',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UploadStepComponent,
    MappingStepComponent,
    PreviewStepComponent,
    ResultsStepComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header with Breadcrumbs -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-4">
              <button 
                (click)="goBack()"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <lucide-angular [img]="ArrowLeftIcon" [size]="20" class="text-gray-600"></lucide-angular>
              </button>
              
              <nav class="flex items-center space-x-2 text-sm">
                <button (click)="goToDashboard()" class="text-gray-500 hover:text-gray-700">
                  <lucide-angular [img]="HomeIcon" [size]="16" class="mr-1"></lucide-angular>
                  Dashboard
                </button>
                <span class="text-gray-400">/</span>
                <span class="text-gray-900 font-medium">Import Opportunities</span>
              </nav>
            </div>
            
            <button 
              (click)="cancelImport()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Page Header -->
      <div class="bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Import Funding Opportunities</h1>
            <p class="mt-2 text-lg text-gray-600">Upload CSV or Excel files to bulk create opportunities</p>
          </div>

          <!-- Progress Steps -->
          <div class="flex items-center space-x-4">
            @for (step of steps; track step.id; let i = $index) {
              <div class="flex items-center" [class.opacity-50]="!isStepActive(step.id) && !isStepCompleted(step.id)">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  [class.bg-blue-500]="isStepActive(step.id)"
                  [class.text-white]="isStepActive(step.id)"
                  [class.bg-green-500]="isStepCompleted(step.id)"
                  [class.text-white]="isStepCompleted(step.id)"
                  [class.bg-gray-200]="!isStepActive(step.id) && !isStepCompleted(step.id)"
                  [class.text-gray-600]="!isStepActive(step.id) && !isStepCompleted(step.id)"
                >
                  {{ i + 1 }}
                </div>
                <span class="ml-2 text-sm font-medium" [class.text-blue-600]="isStepActive(step.id)">
                  {{ step.title }}
                </span>
                @if (i < steps.length - 1) {
                  <div class="ml-4 w-8 h-0.5 bg-gray-300"></div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          @switch (currentStep()) {
            @case ('upload') {
              <app-upload-step 
                (stepCompleted)="onStepCompleted('upload', $event)"
                (dataReady)="onUploadDataReady($event)"
              />
            }
            @case ('mapping') {
              <app-mapping-step 
                [uploadedData]="uploadedData()"
                (stepCompleted)="onStepCompleted('mapping', $event)"
                (mappingReady)="onMappingReady($event)"
              />
            }
            @case ('preview') {
              <app-preview-step 
                [transformedData]="transformedData()"
                (stepCompleted)="onStepCompleted('preview', $event)"
                (validDataReady)="onValidDataReady($event)"
                #previewStep
              />
            }
            @case ('results') {
              <app-results-step 
                [importResults]="importResults()"
                (importComplete)="onImportComplete()"
              />
            }
          }
        </div>

        <!-- Navigation Footer -->
        <div class="mt-8 flex items-center justify-between">
          <button 
            (click)="previousStep()"
            [disabled]="currentStep() === 'upload' || isImporting()"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <lucide-angular [img]="ArrowLeftIcon" [size]="16" class="mr-2"></lucide-angular>
            Previous
          </button>

          <div class="text-sm text-gray-500">
            Step {{ currentStepIndex() + 1 }} of {{ steps.length }}
          </div>

          <button 
            (click)="nextStep()"
            [disabled]="!canProceedToNext() || isImporting()"
            class="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isImporting()) {
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            } @else {
              {{ getNextButtonText() }}
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class ImportOpportunityContainerComponent implements OnInit {
  private router = inject(Router);
  private opportunityService = inject(FundingOpportunityService);

  // Get reference to preview step component
  @ViewChild('previewStep') previewStepComponent?: PreviewStepComponent;

  // Icons
  ArrowLeftIcon = ArrowLeft;
  HomeIcon = Home;

  // State
  currentStep = signal<StepId>('upload');
  isImporting = signal(false);
  
  // Data flow between steps
  uploadedData = signal<any>(null);
  transformedData = signal<any>(null);
  importResults = signal<any>(null);

  // Step completion tracking
  completedSteps = signal<Set<StepId>>(new Set());

  steps: StepConfig[] = [
    { id: 'upload', title: 'Upload File', component: UploadStepComponent },
    { id: 'mapping', title: 'Map Fields', component: MappingStepComponent },
    { id: 'preview', title: 'Preview & Validate', component: PreviewStepComponent },
    { id: 'results', title: 'Import Results', component: ResultsStepComponent }
  ];

  ngOnInit() {
    // Initialize any required data
  }

  // Step Navigation
  isStepActive(stepId: StepId): boolean {
    return this.currentStep() === stepId;
  }

  isStepCompleted(stepId: StepId): boolean {
    return this.completedSteps().has(stepId);
  }

  currentStepIndex(): number {
    return this.steps.findIndex(step => step.id === this.currentStep());
  }

  canProceedToNext(): boolean {
    const current = this.currentStep();
    return this.completedSteps().has(current);
  }

  getNextButtonText(): string {
    const current = this.currentStep();
    switch (current) {
      case 'upload': return 'Next: Map Fields';
      case 'mapping': return 'Next: Preview';
      case 'preview': return 'Import Data';
      case 'results': return 'Done';
      default: return 'Next';
    }
  }

  nextStep() {
    const currentIndex = this.currentStepIndex();
    
    if (this.currentStep() === 'preview') {
      // Trigger import via the preview step component
      this.triggerPreviewImport();
    } else if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].id);
    } else if (this.currentStep() === 'results') {
      this.onImportComplete();
    }
  }

  private triggerPreviewImport() {
    console.log('🎯 Triggering preview import');
    
    // Call the preview step's triggerImport method
    if (this.previewStepComponent) {
      this.previewStepComponent.triggerImport();
    } else {
      console.error('❌ Preview step component not available');
      this.importResults.set({
        success: false,
        imported: 0,
        failed: 0,
        warnings: 0,
        message: 'Import system error',
        errors: ['Preview component not initialized']
      });
      this.currentStep.set('results');
    }
  }

  previousStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id);
    }
  }

  // Step Event Handlers
  onStepCompleted(stepId: StepId, completed: boolean) {
    const completed_steps = this.completedSteps();
    if (completed) {
      completed_steps.add(stepId);
    } else {
      completed_steps.delete(stepId);
    }
    this.completedSteps.set(new Set(completed_steps));
  }

  onUploadDataReady(data: any) {
    this.uploadedData.set(data);
  }

  onMappingReady(data: any) {
    this.transformedData.set(data);
  }

  onValidDataReady(data: any) {
    console.log('📦 Valid data ready for import:', data.length, 'opportunities');
    // Trigger actual import process
    this.performImport(data);
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/funder/dashboard']);
  }

  goToDashboard() {
    this.router.navigate(['/funder/dashboard']);
  }

  cancelImport() {
    if (confirm('Are you sure you want to cancel the import? Any progress will be lost.')) {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  onImportComplete() {
    this.router.navigate(['/funder/dashboard'], { 
      queryParams: { imported: 'success' } 
    });
  }

  // Import execution
  private async performImport(validData: any[]) {
    try {
      this.isImporting.set(true);
      console.log('🚀 Starting bulk import of', validData.length, 'opportunities');
      
      const results = await this.importOpportunities(validData);
      this.importResults.set(results);
      this.currentStep.set('results');
      this.onStepCompleted('results', true);
      
      console.log('✅ Bulk import completed:', results);
    } catch (error) {
      console.error('❌ Import failed:', error);
      this.importResults.set({
        success: false,
        imported: 0,
        failed: validData.length,
        warnings: 0,
        message: 'Import failed. Please try again.',
        errors: [error || 'Unknown error occurred']
      });
      this.currentStep.set('results');
    } finally {
      this.isImporting.set(false);
    }
  }

  private async importOpportunities(data: any[]): Promise<any> {
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const details: string[] = [];

    // Process opportunities in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map((opportunityData, batchIndex) => 
          this.importSingleOpportunity(opportunityData, i + batchIndex + 1)
        )
      );

      batchResults.forEach((result, batchIndex) => {
        const rowNumber = i + batchIndex + 1;
        if (result.status === 'fulfilled') {
          successCount++;
          details.push(`Row ${rowNumber}: ${result.value.message}`);
        } else {
          failCount++;
          const errorMsg = `Row ${rowNumber}: ${result.reason?.message || 'Unknown error'}`;
          errors.push(errorMsg);
          console.error('Import error for row', rowNumber, ':', result.reason);
        }
      });

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < data.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return {
      success: successCount > 0,
      imported: successCount,
      failed: failCount,
      warnings: 0,
      message: `Import completed: ${successCount} successful, ${failCount} failed`,
      details: details.slice(0, 10), // Limit details for UI
      errors: errors.slice(0, 10)    // Limit errors for UI
    };
  }

  private async importSingleOpportunity(data: any, rowNumber: number): Promise<{message: string}> {
    try {
      console.log(`📄 Importing opportunity ${rowNumber}:`, data.title);
      
      // Transform imported data to match FundingOpportunity interface
      const opportunityData = this.transformImportDataToOpportunity(data);
      
      // Use existing service with full activity tracing
      const result = await this.opportunityService.publishOpportunity(opportunityData).toPromise();
      
      if (result?.success) {
        return { message: `"${data.title}" imported successfully` };
      } else {
        throw new Error('Publish failed - no success response');
      }
    } catch (error: any) {
      console.error(`❌ Failed to import row ${rowNumber}:`, error);
      throw new Error(`Failed to import "${data.title}": ${error.message}`);
    }
  }

  private transformImportDataToOpportunity(importData: any): Partial<FundingOpportunity> {
    // Fix application deadline to ensure it's in the future
    let applicationDeadline: Date | undefined;
    if (importData.applicationDeadline) {
      const inputDate = new Date(importData.applicationDeadline);
      const today = new Date();
      
      // If the date is in the past, set it to 3 months from now
      if (inputDate <= today) {
        applicationDeadline = new Date();
        applicationDeadline.setMonth(applicationDeadline.getMonth() + 3);
      } else {
        applicationDeadline = inputDate;
      }
    }

    return {
      title: importData.title,
      description: importData.description,
      shortDescription: importData.shortDescription,
      fundingType: importData.fundingType?.toLowerCase(),
      offerAmount: Number(importData.offerAmount) || 0,
      minInvestment: Number(importData.minInvestment) || 0,
      maxInvestment: Number(importData.maxInvestment) || 0,
      totalAvailable: Number(importData.totalAvailable) || 0,
      currency: importData.currency || 'ZAR',
      decisionTimeframe: Number(importData.decisionTimeframe) || 30,
      interestRate: importData.interestRate ? Number(importData.interestRate) : undefined,
      equityOffered: importData.equityOffered ? Number(importData.equityOffered) : undefined,
      expectedReturns: importData.expectedReturns ? Number(importData.expectedReturns) : undefined,
      investmentHorizon: importData.investmentHorizon ? Number(importData.investmentHorizon) : undefined,
      applicationDeadline,
      
      // Set reasonable defaults for required fields not in import
      targetCompanyProfile: 'Various SMEs seeking funding',
      applicationProcess: [
        {
          step: 1,
          name: 'Application Submission',
          description: 'Submit your funding application with required documents',
          requiredDocuments: ['Business plan', 'Financial statements'],
          timeframe: 1,
          isOptional: false
        },
        {
          step: 2,
          name: 'Initial Review',
          description: 'Our team reviews your application for completeness and eligibility',
          requiredDocuments: [],
          timeframe: 5,
          isOptional: false
        },
        {
          step: 3,
          name: 'Due Diligence',
          description: 'Detailed evaluation of your business and financial position',
          requiredDocuments: ['Management team profiles', 'References'],
          timeframe: 14,
          isOptional: false
        },
        {
          step: 4,
          name: 'Final Decision',
          description: 'Final funding decision and terms negotiation',
          requiredDocuments: [],
          timeframe: 7,
          isOptional: false
        }
      ],
      eligibilityCriteria: {
        industries: [],
        businessStages: ['growth', 'established'],
        minRevenue: 0,
        geographicRestrictions: ['South Africa'],
        requiresCollateral: false
      },
      autoMatch: true,
      status: 'active'
    };
  }
}