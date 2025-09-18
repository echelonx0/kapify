// src/app/funder/components/import-opportunity/steps/upload-step.component.ts
import { Component, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, FileText, X, AlertCircle, Download } from 'lucide-angular';

import { UiButtonComponent } from '../../../../shared/components';
import { ImportValidationService } from '../services/import-validation.service';

interface ParsedFileData {
  rawData: any[];
  detectedColumns: string[];
  sampleData: any[];
  fileName: string;
  fileSize: number;
}

@Component({
  selector: 'app-upload-step',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  providers: [ImportValidationService],
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Upload Your File</h2>
        <p class="text-gray-600">Upload a CSV or Excel file containing your funding opportunities data</p>
      </div>

      <!-- Template Download Section -->
      <div class="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="DownloadIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
          <div class="flex-1">
            <h3 class="text-lg font-medium text-blue-900 mb-2">Download Template</h3>
            <p class="text-blue-700 mb-4">
              Get started with our pre-formatted template to ensure proper data structure and faster import.
            </p>
            <div class="flex space-x-3">
              <ui-button variant="primary" size="sm" (clicked)="downloadTemplate('csv')">
                <lucide-angular [img]="FileTextIcon" [size]="14" class="mr-2"></lucide-angular>
                CSV Template
              </ui-button>
              <ui-button variant="outline" size="sm" (clicked)="downloadTemplate('xlsx')">
                <lucide-angular [img]="FileTextIcon" [size]="14" class="mr-2"></lucide-angular>
                Excel Template
              </ui-button>
            </div>
          </div>
        </div>
      </div>

      <!-- File Upload Area -->
      <div class="mb-8">
        @if (!uploadedFile()) {
          <div 
            class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
            [class.border-blue-500]="isDragging()"
            [class.bg-blue-50]="isDragging()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <lucide-angular [img]="UploadIcon" [size]="48" class="mx-auto text-gray-400 mb-4"></lucide-angular>
            <h3 class="text-xl font-medium text-gray-900 mb-2">Upload your file</h3>
            <p class="text-gray-600 mb-6">Drag and drop your CSV or Excel file here, or click to browse</p>
            
            <input 
              type="file" 
              #fileInput 
              (change)="onFileSelected($event)"
              accept=".csv,.xlsx,.xls"
              class="hidden"
            >
            
            <ui-button variant="primary">
              <lucide-angular [img]="UploadIcon" [size]="16" class="mr-2"></lucide-angular>
              Choose File
            </ui-button>
            
            <p class="text-sm text-gray-500 mt-4">Supports CSV, XLS, XLSX files up to 10MB</p>
          </div>
        } @else {
          <!-- File Selected -->
          <div class="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-angular [img]="FileTextIcon" [size]="24" class="text-blue-600"></lucide-angular>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ uploadedFile()!.name }}</h4>
                  <p class="text-sm text-gray-600">{{ formatFileSize(uploadedFile()!.size) }}</p>
                </div>
              </div>
              <button 
                (click)="removeFile()"
                class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <lucide-angular [img]="XIcon" [size]="20" class="text-gray-500"></lucide-angular>
              </button>
            </div>

            <!-- Parsing Progress -->
            @if (parseProgress() < 100 && parseProgress() > 0) {
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Parsing file...</span>
                  <span class="text-sm text-gray-600">{{ parseProgress() }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    [style.width.%]="parseProgress()"
                  ></div>
                </div>
              </div>
            }

            <!-- Parse Success -->
            @if (parseProgress() === 100 && parsedData()) {
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center space-x-2 mb-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <lucide-angular [img]="FileTextIcon" [size]="14" class="text-green-600"></lucide-angular>
                  </div>
                  <h4 class="font-medium text-green-900">File parsed successfully</h4>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-green-700 font-medium">Rows found:</span>
                    <span class="text-green-900 ml-2">{{ parsedData()!.rawData.length }}</span>
                  </div>
                  <div>
                    <span class="text-green-700 font-medium">Columns found:</span>
                    <span class="text-green-900 ml-2">{{ parsedData()!.detectedColumns.length }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Parse Error -->
      @if (parseError()) {
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-500 mt-0.5"></lucide-angular>
            <div>
              <h4 class="font-medium text-red-800 mb-1">Parse Error</h4>
              <p class="text-red-700 text-sm">{{ parseError() }}</p>
              <ui-button variant="outline" size="sm" (clicked)="retryParsing()" class="mt-3">
                Try Again
              </ui-button>
            </div>
          </div>
        </div>
      }

      <!-- Data Preview -->
      @if (parsedData() && parsedData()!.sampleData.length > 0) {
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 class="font-medium text-gray-900">Data Preview</h4>
            <p class="text-sm text-gray-600 mt-1">First 3 rows of your data</p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  @for (column of parsedData()!.detectedColumns; track column) {
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {{ column }}
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (row of parsedData()!.sampleData.slice(0, 3); track $index) {
                  <tr>
                    @for (column of parsedData()!.detectedColumns; track column) {
                      <td class="px-4 py-2 text-sm text-gray-900 max-w-32 truncate">
                        {{ row[column] || '-' }}
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class UploadStepComponent implements OnInit {
  private validationService = new ImportValidationService();

  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  XIcon = X;
  AlertCircleIcon = AlertCircle;
  DownloadIcon = Download;

  // Outputs
  @Output() stepCompleted = new EventEmitter<boolean>();
  @Output() dataReady = new EventEmitter<ParsedFileData>();

  // State
  uploadedFile = signal<File | null>(null);
  isDragging = signal(false);
  parseProgress = signal(0);
  parseError = signal<string | null>(null);
  parsedData = signal<ParsedFileData | null>(null);

  ngOnInit() {
    // Initialize component
  }

  // File handling
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

  private async handleFile(file: File) {
    // Reset state
    this.parseError.set(null);
    this.parseProgress.set(0);
    this.parsedData.set(null);

    // Validate file
    const validation = this.validationService.validateFile(file);
    if (!validation.isValid) {
      this.parseError.set(validation.error || 'Invalid file');
      return;
    }

    this.uploadedFile.set(file);
    
    try {
      this.parseProgress.set(10);
      const parsed = await this.validationService.parseFile(file);
      this.parseProgress.set(100);
      
      this.parsedData.set(parsed);
      this.stepCompleted.emit(true);
      this.dataReady.emit(parsed);
      
    } catch (error: any) {
      this.parseError.set(error.message || 'Failed to parse file');
      this.parseProgress.set(0);
      this.stepCompleted.emit(false);
    }
  }

  removeFile() {
    this.uploadedFile.set(null);
    this.parsedData.set(null);
    this.parseProgress.set(0);
    this.parseError.set(null);
    this.stepCompleted.emit(false);
  }

  retryParsing() {
    const file = this.uploadedFile();
    if (file) {
      this.handleFile(file);
    }
  }

  // Template download
  async downloadTemplate(format: 'csv' | 'xlsx') {
    try {
      await this.validationService.downloadTemplate(format);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  }

  // Utilities
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}