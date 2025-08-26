// src/app/funder/components/import-opportunity/import-opportunity.component.ts
import { Component, signal, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { LucideAngularModule, Upload, FileText, X, CheckCircle, AlertCircle, Download, Eye, ArrowRight, ArrowLeft, MapPin } from 'lucide-angular';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportedData {
  [key: string]: any;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  transform?: (value: any) => any;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: ValidationError[];
  data: any[];
}

@Component({
  selector: 'app-import-opportunity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Import Funding Opportunities</h2>
            <p class="text-sm text-gray-600 mt-1">Upload CSV or Excel files to bulk create opportunities</p>
          </div>
          <button 
            (click)="closeModal()"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <lucide-angular [img]="XIcon" [size]="20" class="text-gray-500"></lucide-angular>
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
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
                  @if (isStepCompleted(step.id)) {
                    <lucide-angular [img]="CheckIcon" [size]="16"></lucide-angular>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>
                <span class="ml-2 text-sm font-medium" [class.text-blue-600]="isStepActive(step.id)">
                  {{ step.title }}
                </span>
                @if (i < steps.length - 1) {
                  <lucide-angular [img]="ArrowRightIcon" [size]="16" class="ml-4 text-gray-400"></lucide-angular>
                }
              </div>
            }
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto" style="max-height: calc(90vh - 200px);">
          
          <!-- Step 1: File Upload -->
          @if (currentStep() === 'upload') {
            <div class="p-6">
              <!-- Sample Template Download -->
              <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-start space-x-3">
                  <lucide-angular [img]="DownloadIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
                  <div>
                    <h4 class="text-sm font-medium text-blue-900">Download Template</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      Get started with our pre-formatted template to ensure proper data structure.
                    </p>
                    <div class="flex space-x-2 mt-2">
                      <button 
                        (click)="downloadTemplate('csv')"
                        class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        <lucide-angular [img]="FileTextIcon" [size]="14" class="mr-1"></lucide-angular>
                        CSV Template
                      </button>
                      <button 
                        (click)="downloadTemplate('xlsx')"
                        class="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                      >
                        <lucide-angular [img]="FileTextIcon" [size]="14" class="mr-1"></lucide-angular>
                        Excel Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- File Upload Area -->
              <div 
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                [class.border-blue-500]="isDragging()"
                [class.bg-blue-50]="isDragging()"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
              >
                @if (!uploadedFile()) {
                  <lucide-angular [img]="UploadIcon" [size]="48" class="mx-auto text-gray-400 mb-4"></lucide-angular>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Upload your file</h3>
                  <p class="text-gray-600 mb-4">Drag and drop your CSV or Excel file here, or click to browse</p>
                  <input 
                    type="file" 
                    #fileInput 
                    (change)="onFileSelected($event)"
                    accept=".csv,.xlsx,.xls"
                    class="hidden"
                  >
                  <button 
                    (click)="fileInput.click()"
                    class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <lucide-angular [img]="UploadIcon" [size]="16" class="mr-2"></lucide-angular>
                    Choose File
                  </button>
                  <p class="text-xs text-gray-500 mt-2">Supports CSV, XLS, XLSX files up to 10MB</p>
                } @else {
                  <div class="flex items-center justify-center space-x-4">
                    <div class="flex items-center space-x-2">
                      <lucide-angular [img]="FileTextIcon" [size]="20" class="text-green-600"></lucide-angular>
                      <span class="font-medium text-gray-900">{{ uploadedFile()!.name }}</span>
                      <span class="text-sm text-gray-500">({{ formatFileSize(uploadedFile()!.size) }})</span>
                    </div>
                    <button 
                      (click)="removeFile()"
                      class="p-1 hover:bg-gray-100 rounded"
                    >
                      <lucide-angular [img]="XIcon" [size]="16" class="text-gray-500"></lucide-angular>
                    </button>
                  </div>
                  @if (parseProgress() < 100) {
                    <div class="mt-4">
                      <div class="bg-gray-200 rounded-full h-2">
                        <div 
                          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          [style.width.%]="parseProgress()"
                        ></div>
                      </div>
                      <p class="text-sm text-gray-600 mt-2">Parsing file... {{ parseProgress() }}%</p>
                    </div>
                  }
                }
              </div>

              @if (parseError()) {
                <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div class="flex">
                    <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-500 mr-3 mt-0.5"></lucide-angular>
                    <div>
                      <h4 class="text-sm font-medium text-red-800">Parse Error</h4>
                      <p class="text-sm text-red-700 mt-1">{{ parseError() }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Step 2: Field Mapping -->
          @if (currentStep() === 'mapping') {
            <div class="p-6">
              <div class="mb-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Map Your Fields</h3>
                <p class="text-gray-600">Match your file columns to the opportunity fields</p>
              </div>

              <div class="space-y-4">
                @for (mapping of fieldMappings(); track mapping.targetField) {
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ getFieldDisplayName(mapping.targetField) }}
                        @if (mapping.required) {
                          <span class="text-red-500">*</span>
                        }
                      </label>
                      <p class="text-xs text-gray-500">{{ getFieldDescription(mapping.targetField) }}</p>
                    </div>
                    
                    <div>
                      <select 
                        [(ngModel)]="mapping.sourceField"
                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">-- Select Column --</option>
                        @for (col of detectedColumns(); track col) {
                          <option [value]="col">{{ col }}</option>
                        }
                      </select>
                    </div>
                    
                    <div>
                      @if (mapping.sourceField && sampleData().length > 0) {
                        <div class="text-xs">
                          <span class="text-gray-500">Sample:</span>
                          <span class="font-mono bg-gray-100 px-2 py-1 rounded ml-1">
                            {{ getSampleValue(mapping.sourceField) }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 class="text-sm font-medium text-gray-900 mb-2">Auto-detected mappings</h4>
                <button 
                  (click)="autoMapFields()"
                  class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  <lucide-angular [img]="MapPinIcon" [size]="14" class="mr-1"></lucide-angular>
                  Auto-map fields
                </button>
                <p class="text-xs text-gray-600 mt-1">Automatically match columns based on common naming patterns</p>
              </div>
            </div>
          }

          <!-- Step 3: Preview & Validate -->
          @if (currentStep() === 'preview') {
            <div class="p-6">
              <div class="mb-6 flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Preview & Validate</h3>
                  <p class="text-gray-600">Review the data before importing</p>
                </div>
                <button 
                  (click)="validateData()"
                  class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  <lucide-angular [img]="CheckIcon" [size]="14" class="mr-1"></lucide-angular>
                  Validate Data
                </button>
              </div>

              <!-- Validation Summary -->
              @if (validationErrors().length > 0) {
                <div class="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div class="flex items-start space-x-3">
                    <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-yellow-600 mt-0.5"></lucide-angular>
                    <div>
                      <h4 class="text-sm font-medium text-yellow-800">Validation Issues Found</h4>
                      <p class="text-sm text-yellow-700 mt-1">
                        {{ getErrorSummary() }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- Data Preview Table -->
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 class="text-sm font-medium text-gray-900">
                    Data Preview ({{ transformedData().length }} rows)
                  </h4>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funding Type</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer Amount</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      @for (row of getPreviewRows(); track $index; let i = $index) {
                        <tr [class.bg-red-50]="hasRowErrors(i)">
                          <td class="px-4 py-2 text-sm text-gray-900">{{ i + 1 }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900">{{ row.title || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900">{{ row.fundingType || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900">{{ formatCurrency(row.offerAmount) }}</td>
                          <td class="px-4 py-2 text-sm">
                            @if (hasRowErrors(i)) {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <lucide-angular [img]="AlertCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                                Errors
                              </span>
                            } @else {
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <lucide-angular [img]="CheckIcon" [size]="12" class="mr-1"></lucide-angular>
                                Valid
                              </span>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Error Details -->
              @if (validationErrors().length > 0) {
                <div class="mt-6">
                  <h4 class="text-sm font-medium text-gray-900 mb-2">Validation Errors</h4>
                  <div class="space-y-2 max-h-64 overflow-y-auto">
                    @for (error of validationErrors(); track $index) {
                      <div class="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <lucide-angular [img]="AlertCircleIcon" [size]="14" class="text-red-500 mt-0.5"></lucide-angular>
                        <div>
                          <span class="font-medium">Row {{ error.row + 1 }}, {{ error.field }}:</span>
                          <span class="text-red-700">{{ error.message }}</span>
                          @if (error.value !== undefined) {
                            <span class="text-gray-600">(Value: "{{ error.value }}")</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Step 4: Import Results -->
          @if (currentStep() === 'results') {
            <div class="p-6">
              @if (importResult()) {
                <div class="text-center">
                  @if (importResult()!.success) {
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <lucide-angular [img]="CheckIcon" [size]="24" class="text-green-600"></lucide-angular>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Import Successful!</h3>
                    <p class="text-gray-600 mb-4">
                      Successfully imported {{ importResult()!.imported }} funding opportunities.
                    </p>
                  } @else {
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                      <lucide-angular [img]="AlertCircleIcon" [size]="24" class="text-red-600"></lucide-angular>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Import Failed</h3>
                    <p class="text-gray-600 mb-4">
                      There were errors during the import process.
                    </p>
                  }

                  @if (importResult()!.errors.length > 0) {
                    <div class="text-left mt-6">
                      <h4 class="text-sm font-medium text-gray-900 mb-2">Import Errors</h4>
                      <div class="space-y-1 max-h-32 overflow-y-auto">
                        @for (error of importResult()!.errors; track $index) {
                          <div class="text-sm text-red-600">
                            Row {{ error.row + 1 }}: {{ error.message }}
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button 
            (click)="previousStep()"
            [disabled]="currentStep() === 'upload' || isProcessing()"
            class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <lucide-angular [img]="ArrowLeftIcon" [size]="16" class="mr-2"></lucide-angular>
            Previous
          </button>

          <div class="flex space-x-3">
            <button 
              (click)="closeModal()"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            
            @if (currentStep() === 'upload') {
              <button 
                (click)="nextStep()"
                [disabled]="!uploadedFile() || parseProgress() < 100"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Map Fields
                <lucide-angular [img]="ArrowRightIcon" [size]="16" class="ml-2"></lucide-angular>
              </button>
            } @else if (currentStep() === 'mapping') {
              <button 
                (click)="nextStep()"
                [disabled]="!canProceedFromMapping()"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Preview
                <lucide-angular [img]="ArrowRightIcon" [size]="16" class="ml-2"></lucide-angular>
              </button>
            } @else if (currentStep() === 'preview') {
              <button 
                (click)="importData()"
                [disabled]="!canImport() || isProcessing()"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isProcessing()) {
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Importing...
                } @else {
                  <lucide-angular [img]="UploadIcon" [size]="16" class="mr-2"></lucide-angular>
                  Import {{ getValidRowCount() }} Opportunities
                }
              </button>
            } @else if (currentStep() === 'results') {
              <button 
                (click)="closeModal()"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ImportOpportunityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  XIcon = X;
  CheckIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  DownloadIcon = Download;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;
  ArrowLeftIcon = ArrowLeft;
  MapPinIcon = MapPin;

  // Output events
  @Output() closeImport = new EventEmitter<void>();
  @Output() importComplete = new EventEmitter<any[]>();

  // State
  currentStep = signal<'upload' | 'mapping' | 'preview' | 'results'>('upload');
  uploadedFile = signal<File | null>(null);
  isDragging = signal(false);
  parseProgress = signal(0);
  parseError = signal<string | null>(null);
  isProcessing = signal(false);

  // Data
  rawData = signal<any[]>([]);
  detectedColumns = signal<string[]>([]);
  sampleData = signal<any[]>([]);
  transformedData = signal<any[]>([]);
  validationErrors = signal<ValidationError[]>([]);
  importResult = signal<ImportResult | null>(null);

  // Mapping
  fieldMappings = signal<FieldMapping[]>([]);

  // Steps
  steps = [
    { id: 'upload', title: 'Upload File' },
    { id: 'mapping', title: 'Map Fields' },
    { id: 'preview', title: 'Preview & Validate' },
    { id: 'results', title: 'Import Results' }
  ];

  // Field definitions for opportunity import
  private opportunityFields: FieldMapping[] = [
    { sourceField: '', targetField: 'title', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'description', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'shortDescription', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'fundingType', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'offerAmount', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'minInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'maxInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'totalAvailable', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'currency', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'decisionTimeframe', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'interestRate', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'equityOffered', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'expectedReturns', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'investmentHorizon', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'applicationDeadline', required: false, dataType: 'date' }
  ];

  ngOnInit() {
    this.fieldMappings.set([...this.opportunityFields]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // STEP NAVIGATION
  // ===============================

  isStepActive(stepId: string): boolean {
    return this.currentStep() === stepId;
  }

  isStepCompleted(stepId: string): boolean {
    const steps = ['upload', 'mapping', 'preview', 'results'];
    const currentIndex = steps.indexOf(this.currentStep());
    const stepIndex = steps.indexOf(stepId);
    return stepIndex < currentIndex;
  }

  nextStep() {
    const current = this.currentStep();
    switch (current) {
      case 'upload':
        if (this.uploadedFile() && this.parseProgress() === 100) {
          this.currentStep.set('mapping');
        }
        break;
      case 'mapping':
        if (this.canProceedFromMapping()) {
          this.processData();
          this.currentStep.set('preview');
        }
        break;
      case 'preview':
        if (this.canImport()) {
          this.importData();
        }
        break;
    }
  }

  previousStep() {
    const current = this.currentStep();
    switch (current) {
      case 'mapping':
        this.currentStep.set('upload');
        break;
      case 'preview':
        this.currentStep.set('mapping');
        break;
      case 'results':
        this.currentStep.set('preview');
        break;
    }
  }

  // ===============================
  // FILE HANDLING
  // ===============================

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      this.parseError.set('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.parseError.set('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    this.uploadedFile.set(file);
    this.parseError.set(null);
    this.parseFile(file);
  }

  private async parseFile(file: File) {
    this.parseProgress.set(0);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        await this.parseCsvFile(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await this.parseExcelFile(file);
      }
      
      this.parseProgress.set(100);
    } catch (error: any) {
      this.parseError.set(error.message || 'Failed to parse file');
      this.parseProgress.set(0);
    }
  }

private async parseCsvFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')));
          return;
        }
        
        this.rawData.set(results.data as any[]);
        this.detectedColumns.set(results.meta.fields || []);
        this.sampleData.set(results.data.slice(0, 5) as any[]);
        resolve(undefined);
      },
      error: (error) => {
        reject(new Error('Failed to parse CSV: ' + error.message));
      }
    });
  });
}
  private async parseExcelFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null 
          }) as any[][];
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file appears to be empty'));
            return;
          }
          
          // First row as headers
          const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
          const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
          
          // Convert to objects
          const parsedData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });
          
          this.rawData.set(parsedData);
          this.detectedColumns.set(headers);
          this.sampleData.set(parsedData.slice(0, 5));
          resolve();
          
        } catch (error: any) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  removeFile() {
    this.uploadedFile.set(null);
    this.rawData.set([]);
    this.detectedColumns.set([]);
    this.sampleData.set([]);
    this.parseProgress.set(0);
    this.parseError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ===============================
  // TEMPLATE DOWNLOAD
  // ===============================

  downloadTemplate(format: 'csv' | 'xlsx') {
    const templateData = [
      {
        title: 'Example Growth Capital Fund',
        description: 'Funding for established SMEs looking to expand operations and market reach',
        shortDescription: 'Growth capital for expanding SMEs',
        fundingType: 'equity',
        offerAmount: 500000,
        minInvestment: 100000,
        maxInvestment: 2000000,
        totalAvailable: 5000000,
        currency: 'ZAR',
        decisionTimeframe: 30,
        interestRate: null,
        equityOffered: 15,
        expectedReturns: 25,
        investmentHorizon: 5,
        applicationDeadline: '2024-12-31'
      },
      {
        title: 'SME Debt Financing Program',
        description: 'Traditional debt financing for working capital and equipment purchases',
        shortDescription: 'Working capital and equipment financing',
        fundingType: 'debt',
        offerAmount: 250000,
        minInvestment: 50000,
        maxInvestment: 1000000,
        totalAvailable: 2000000,
        currency: 'ZAR',
        decisionTimeframe: 14,
        interestRate: 12.5,
        equityOffered: null,
        expectedReturns: null,
        investmentHorizon: 3,
        applicationDeadline: '2024-11-30'
      }
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(templateData);
      this.downloadFile(csv, 'funding-opportunities-template.csv', 'text/csv');
    } else {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Opportunities');
      XLSX.writeFile(wb, 'funding-opportunities-template.xlsx');
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ===============================
  // FIELD MAPPING
  // ===============================

  autoMapFields() {
    const mappings = this.fieldMappings();
    const columns = this.detectedColumns();
    
    // Common field name patterns
    const patterns: Record<string, RegExp[]> = {
      title: [/^title$/i, /^name$/i, /^opportunity.?name$/i],
      description: [/^description$/i, /^desc$/i, /^details$/i],
      shortDescription: [/^short.?desc/i, /^summary$/i, /^brief$/i],
      fundingType: [/^funding.?type$/i, /^type$/i, /^fund.?type$/i],
      offerAmount: [/^offer.?amount$/i, /^amount$/i, /^funding.?amount$/i],
      minInvestment: [/^min.?investment$/i, /^minimum$/i, /^min.?amount$/i],
      maxInvestment: [/^max.?investment$/i, /^maximum$/i, /^max.?amount$/i],
      totalAvailable: [/^total.?available$/i, /^total$/i, /^available$/i],
      currency: [/^currency$/i, /^curr$/i],
      decisionTimeframe: [/^decision.?timeframe$/i, /^timeframe$/i, /^days$/i],
      interestRate: [/^interest.?rate$/i, /^rate$/i],
      equityOffered: [/^equity$/i, /^equity.?offered$/i],
      expectedReturns: [/^expected.?returns$/i, /^returns$/i],
      investmentHorizon: [/^investment.?horizon$/i, /^horizon$/i, /^years$/i],
      applicationDeadline: [/^application.?deadline$/i, /^deadline$/i, /^due.?date$/i]
    };

    mappings.forEach(mapping => {
      const fieldPatterns = patterns[mapping.targetField];
      if (!fieldPatterns) return;

      const matchedColumn = columns.find(col => 
        fieldPatterns.some(pattern => pattern.test(col))
      );

      if (matchedColumn) {
        mapping.sourceField = matchedColumn;
      }
    });

    this.fieldMappings.set([...mappings]);
  }

  getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      shortDescription: 'Short Description',
      fundingType: 'Funding Type',
      offerAmount: 'Offer Amount',
      minInvestment: 'Minimum Investment',
      maxInvestment: 'Maximum Investment',
      totalAvailable: 'Total Available',
      currency: 'Currency',
      decisionTimeframe: 'Decision Timeframe (days)',
      interestRate: 'Interest Rate (%)',
      equityOffered: 'Equity Offered (%)',
      expectedReturns: 'Expected Returns (%)',
      investmentHorizon: 'Investment Horizon (years)',
      applicationDeadline: 'Application Deadline'
    };
    return displayNames[field] || field;
  }

  getFieldDescription(field: string): string {
    const descriptions: Record<string, string> = {
      title: 'Name of the funding opportunity',
      description: 'Detailed description of the opportunity',
      shortDescription: 'Brief summary for listings',
      fundingType: 'Type: debt, equity, convertible, mezzanine, grant',
      offerAmount: 'Typical investment amount per business',
      minInvestment: 'Minimum investment amount',
      maxInvestment: 'Maximum investment amount',
      totalAvailable: 'Total funding pool available',
      currency: 'Currency code (e.g., ZAR, USD)',
      decisionTimeframe: 'Days to make funding decision',
      interestRate: 'Annual interest rate for debt funding',
      equityOffered: 'Percentage of equity offered',
      expectedReturns: 'Expected annual return percentage',
      investmentHorizon: 'Expected investment duration in years',
      applicationDeadline: 'Last date to apply (YYYY-MM-DD)'
    };
    return descriptions[field] || '';
  }

  getSampleValue(columnName: string): string {
    const sample = this.sampleData()[0];
    if (!sample || !columnName) return '';
    const value = sample[columnName];
    return value ? String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '') : '';
  }

  canProceedFromMapping(): boolean {
    const mappings = this.fieldMappings();
    const requiredMappings = mappings.filter(m => m.required);
    return requiredMappings.every(m => m.sourceField !== '');
  }

  // ===============================
  // DATA PROCESSING & VALIDATION
  // ===============================

  processData() {
    const mappings = this.fieldMappings();
    const rawData = this.rawData();
    
    const transformedData = rawData.map((row, index) => {
      const transformed: any = {};
      
      mappings.forEach(mapping => {
        if (!mapping.sourceField) return;
        
        const rawValue = row[mapping.sourceField];
        transformed[mapping.targetField] = this.transformValue(rawValue, mapping);
      });
      
      return transformed;
    });
    
    this.transformedData.set(transformedData);
  }

  private transformValue(value: any, mapping: FieldMapping): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (mapping.dataType) {
      case 'number':
        const numValue = typeof value === 'string' ? 
          parseFloat(value.replace(/[,\s]/g, '')) : Number(value);
        return isNaN(numValue) ? null : numValue;
        
      case 'string':
        return String(value).trim();
        
      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        } catch {
          return null;
        }
        
      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return ['true', 'yes', '1', 'y'].includes(str);
        
      default:
        return value;
    }
  }

  validateData() {
    const data = this.transformedData();
    const mappings = this.fieldMappings();
    const errors: ValidationError[] = [];

    data.forEach((row, rowIndex) => {
      mappings.forEach(mapping => {
        const value = row[mapping.targetField];
        
        // Required field validation
        if (mapping.required && (value === null || value === undefined || value === '')) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `${this.getFieldDisplayName(mapping.targetField)} is required`,
            severity: 'error'
          });
          return;
        }

        // Field-specific validations
        this.validateFieldValue(rowIndex, mapping.targetField, value, errors);
      });

      // Cross-field validations
      this.validateRowConstraints(rowIndex, row, errors);
    });

    this.validationErrors.set(errors);
  }

  private validateFieldValue(rowIndex: number, field: string, value: any, errors: ValidationError[]) {
    if (value === null || value === undefined) return;

    switch (field) {
      case 'fundingType':
        const validTypes = ['debt', 'equity', 'convertible', 'mezzanine', 'grant'];
        if (!validTypes.includes(value.toLowerCase())) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Funding type must be one of: ${validTypes.join(', ')}`,
            severity: 'error'
          });
        }
        break;

      case 'offerAmount':
      case 'minInvestment':
      case 'maxInvestment':
      case 'totalAvailable':
        if (typeof value === 'number' && value <= 0) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `${this.getFieldDisplayName(field)} must be greater than 0`,
            severity: 'error'
          });
        }
        break;

      case 'interestRate':
      case 'equityOffered':
      case 'expectedReturns':
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `${this.getFieldDisplayName(field)} must be between 0 and 100`,
            severity: 'warning'
          });
        }
        break;

      case 'currency':
        const validCurrencies = ['ZAR', 'USD', 'EUR', 'GBP'];
        if (typeof value === 'string' && !validCurrencies.includes(value.toUpperCase())) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Currency should be one of: ${validCurrencies.join(', ')}`,
            severity: 'warning'
          });
        }
        break;
    }
  }

  private validateRowConstraints(rowIndex: number, row: any, errors: ValidationError[]) {
    // Min/Max investment validation
    if (row.minInvestment && row.maxInvestment && row.minInvestment > row.maxInvestment) {
      errors.push({
        row: rowIndex,
        field: 'maxInvestment',
        value: row.maxInvestment,
        message: 'Maximum investment must be greater than or equal to minimum investment',
        severity: 'error'
      });
    }

    // Offer amount vs total available
    if (row.offerAmount && row.totalAvailable && row.offerAmount > row.totalAvailable) {
      errors.push({
        row: rowIndex,
        field: 'offerAmount',
        value: row.offerAmount,
        message: 'Offer amount cannot exceed total available funding',
        severity: 'warning'
      });
    }
  }

  getPreviewRows() {
    return this.transformedData().slice(0, 10);
  }

  hasRowErrors(rowIndex: number): boolean {
    return this.validationErrors().some(error => error.row === rowIndex && error.severity === 'error');
  }

  getErrorSummary(): string {
    const errors = this.validationErrors();
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    
    const parts = [];
    if (errorCount > 0) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    
    return parts.join(' and ');
  }

  canImport(): boolean {
    const errors = this.validationErrors().filter(e => e.severity === 'error');
    return errors.length === 0 && this.transformedData().length > 0;
  }

  getValidRowCount(): number {
    const data = this.transformedData();
    const errorRows = new Set(this.validationErrors()
      .filter(e => e.severity === 'error')
      .map(e => e.row));
    
    return data.filter((_, index) => !errorRows.has(index)).length;
  }

  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  // ===============================
  // IMPORT EXECUTION
  // ===============================

  async importData() {
    this.isProcessing.set(true);
    
    try {
      const validData = this.getValidRowsForImport();
      
      // Here you would call your service to create the opportunities
      // For now, we'll simulate the import
      await this.simulateImport(validData);
      
      this.importResult.set({
        success: true,
        imported: validData.length,
        errors: [],
        data: validData
      });
      
      this.currentStep.set('results');
      
      // Emit the imported data
      this.importComplete.emit(validData);
      
    } catch (error: any) {
      this.importResult.set({
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', value: null, message: error.message, severity: 'error' }],
        data: []
      });
      this.currentStep.set('results');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private getValidRowsForImport(): any[] {
    const data = this.transformedData();
    const errorRows = new Set(this.validationErrors()
      .filter(e => e.severity === 'error')
      .map(e => e.row));
    
    return data.filter((_, index) => !errorRows.has(index));
  }

  private async simulateImport(data: any[]): Promise<void> {
    // Simulate API calls with delay
    for (let i = 0; i < data.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Here you would call: await this.opportunityService.createOpportunity(data[i]);
    }
  }

  // ===============================
  // MODAL ACTIONS
  // ===============================

  closeModal() {
    this.closeImport.emit();
  }
}