// src/app/profile/steps/financial-analysis/components/financial-upload/financial-upload.component.ts
import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-angular';
import { ParseProgress } from 'src/app/SMEs/profile/steps/financial-analysis/utils/excel-parser.service';
import { UiCardComponent, UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-financial-upload',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiButtonComponent,
    LucideAngularModule,
  ],
  template: `
    <ui-card class="shadow-md rounded-xl border border-gray-100">
      <div class="p-8">
        @if (!hasData() && !uploadedFile()) {
        <!-- Upload Area -->
        <div class="text-center">
          <lucide-icon
            [name]="FileSpreadsheetIcon"
            [size]="56"
            class="mx-auto text-primary-400 mb-4"
          />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            Import Financial Data
          </h3>
          <p class="text-gray-600 mb-6">
            Use our template with predefined columns and rows to fill in your
            financial projections. The template includes income statement and
            financial ratios sections.
          </p>

          <!-- Template Download -->
          <div class="mb-6">
            <ui-button variant="outline" (clicked)="templateDownload.emit()">
              <lucide-icon [name]="DownloadIcon" [size]="16" class="mr-2" />
              Download Template
            </ui-button>
            <p class="text-sm text-gray-500 mt-2">
              Use <strong>this template</strong> with predefined columns and
              rows to fill in the dataset.
            </p>
          </div>

          <!-- Drop Zone -->
          <div
            class="border-2 border-dashed border-gray-300 rounded-xl p-10 transition-colors hover:border-primary-500 hover:bg-primary-50"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <lucide-icon
              [name]="UploadIcon"
              [size]="36"
              class="mx-auto text-primary-400 mb-3"
            />
            <p class="text-lg font-medium text-gray-700 mb-2">
              Click to upload or drag and drop
            </p>
            <p class="text-sm text-gray-500 mb-4">
              Excel files (.xlsx, .xls) up to 10MB
            </p>

            <ui-button
              variant="primary"
              [loading]="isProcessing()"
              (clicked)="triggerFileUpload()"
            >
              <lucide-icon [name]="UploadIcon" [size]="16" class="mr-2" />
              {{ getProcessingStatusText() }}
            </ui-button>
          </div>
        </div>
        } @else {
        <!-- File Uploaded Status -->
        <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <lucide-icon
                [name]="CheckCircleIcon"
                [size]="20"
                class="text-primary-600 mr-3"
              />
              <div>
                <p class="font-medium text-primary-900">
                  Financial template processed
                </p>
                @if (uploadedFile()) {
                <p class="text-sm text-primary-700">
                  {{ uploadedFile()!.name }} ({{
                    formatFileSize(uploadedFile()!.size)
                  }})
                </p>
                } @if (isValidTemplate()) {
                <p class="text-sm text-primary-600">
                  ✓ Template structure validated • {{ completionPercentage() }}%
                  complete
                </p>
                }
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <ui-button
                variant="outline"
                size="sm"
                (clicked)="dataDownload.emit()"
                title="Download current data as Excel"
              >
                <lucide-icon [name]="DownloadIcon" [size]="16" />
              </ui-button>

              <ui-button
                variant="outline"
                size="sm"
                (clicked)="fileRemove.emit()"
                class="text-red-600 hover:bg-red-50"
                title="Remove and start over"
              >
                <lucide-icon [name]="XIcon" [size]="16" />
              </ui-button>
            </div>
          </div>
        </div>
        }

        <!-- Error Display -->
        @if (error()) {
        <div class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <lucide-icon
              [name]="AlertCircleIcon"
              [size]="20"
              class="text-red-600 mr-3"
            />
            <div>
              <p class="font-medium text-red-900">Upload Error</p>
              <p class="text-sm text-red-700 mt-1">{{ error() }}</p>
            </div>
            <ui-button
              variant="ghost"
              size="sm"
              (clicked)="errorClear.emit()"
              class="ml-auto text-red-600 hover:text-red-800"
            >
              <lucide-icon [name]="XIcon" [size]="16" />
            </ui-button>
          </div>
        </div>
        }

        <!-- Warnings Display -->
        @if (warnings().length > 0) {
        <div class="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div class="flex items-start">
            <lucide-icon
              [name]="AlertCircleIcon"
              [size]="20"
              class="text-orange-600 mr-3 mt-0.5"
            />
            <div class="flex-1">
              <p class="font-medium text-orange-900">Template Warnings</p>
              <ul class="text-sm text-orange-700 mt-1 space-y-1">
                @for (warning of warnings(); track warning) {
                <li>• {{ warning }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
        }
      </div>
    </ui-card>
  `,
})
export class FinancialUploadComponent {
  // Inputs
  hasData = input<boolean>(false);
  uploadedFile = input<File | null>(null);
  isProcessing = input<boolean>(false);
  error = input<string | null>(null);
  warnings = input<string[]>([]);
  progress = input<ParseProgress | null>(null);
  isValidTemplate = input<boolean>(false);
  completionPercentage = input<number>(0);

  // Outputs
  fileSelected = output<File>();
  templateDownload = output<void>();
  dataDownload = output<void>();
  fileRemove = output<void>();
  errorClear = output<void>();

  // Icons
  UploadIcon = Upload;
  DownloadIcon = Download;
  FileSpreadsheetIcon = FileSpreadsheet;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  XIcon = X;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('border-primary-500', 'bg-primary-100');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-100');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-100');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileSelected.emit(files[0]);
    }
  }

  triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.fileSelected.emit(file);
      }
    };
    input.click();
  }

  getProcessingStatusText(): string {
    const prog = this.progress();
    if (prog) return prog.message;
    if (this.isProcessing()) return 'Processing...';
    return 'Choose File';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
