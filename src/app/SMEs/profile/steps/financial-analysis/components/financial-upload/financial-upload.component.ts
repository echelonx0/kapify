// src/app/SMEs/profile/steps/financial-analysis/components/financial-upload/financial-upload.component.ts
import { Component, input, output } from '@angular/core';
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
import { ParseProgress } from '../../utils/excel-parser.service';

@Component({
  selector: 'app-financial-upload',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div class="p-8">
        @if (!hasData() && !uploadedFile()) {
        <!-- Upload Area -->
        <div class="text-center">
          <div
            class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100 flex items-center justify-center"
          >
            <lucide-icon
              [name]="FileSpreadsheetIcon"
              [size]="32"
              class="text-teal-600"
            />
          </div>
          <h3 class="text-xl font-bold text-slate-900 mb-2">
            Import Financial Data
          </h3>
          <p class="text-slate-600 mb-6 max-w-lg mx-auto">
            Use our template with predefined columns and rows to fill in your
            financial projections. The template includes income statement,
            balance sheet, cash flow statement and financial ratios sections.
          </p>

          <!-- Template Download -->
          <div class="mb-6">
            <button
              (click)="templateDownload.emit()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-slate-100 text-slate-700 text-sm font-medium
                     hover:bg-slate-200 active:bg-slate-300
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              <lucide-icon [name]="DownloadIcon" [size]="16" />
              Download Template
            </button>
            <p class="text-sm text-slate-500 mt-2">
              Use <strong>this template</strong> with predefined columns and
              rows to fill in the dataset.
            </p>
          </div>

          <!-- Drop Zone -->
          <div
            class="border-2 border-dashed border-slate-300 rounded-2xl p-10
                   transition-all duration-200
                   hover:border-teal-400 hover:bg-teal-50/50"
            [class.border-teal-500]="isDragging"
            [class.bg-teal-50]="isDragging"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <div
              class="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center"
            >
              <lucide-icon
                [name]="UploadIcon"
                [size]="24"
                class="text-slate-600"
              />
            </div>
            <p class="text-base font-medium text-slate-900 mb-2">
              Click to upload or drag and drop
            </p>
            <p class="text-sm text-slate-500 mb-4">
              Excel files (.xlsx, .xls) up to 10MB
            </p>

            <button
              (click)="triggerFileUpload()"
              [disabled]="isProcessing()"
              class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
                     bg-teal-500 text-white text-sm font-medium
                     hover:bg-teal-600 active:bg-teal-700
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (isProcessing()) {
              <div
                class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              } @else {
              <lucide-icon [name]="UploadIcon" [size]="16" />
              }
              {{ getProcessingStatusText() }}
            </button>
          </div>
        </div>
        } @else {
        <!-- File Uploaded Status -->
        <div class="bg-teal-50 border border-teal-300/50 rounded-2xl p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon
                  [name]="CheckCircleIcon"
                  [size]="20"
                  class="text-teal-600"
                />
              </div>
              <div>
                <p class="font-semibold text-teal-900">
                  Financial template processed
                </p>
                @if (uploadedFile()) {
                <p class="text-sm text-teal-700">
                  {{ uploadedFile()!.name }} ({{
                    formatFileSize(uploadedFile()!.size)
                  }})
                </p>
                } @if (isValidTemplate()) {
                <p class="text-sm text-teal-600 mt-0.5">
                  ✓ Template structure validated • {{ completionPercentage() }}%
                  complete
                </p>
                }
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                (click)="dataDownload.emit()"
                class="p-2 rounded-lg bg-white border border-teal-200/50 text-teal-700
                       hover:bg-teal-100 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                title="Download current data as Excel"
              >
                <lucide-icon [name]="DownloadIcon" [size]="16" />
              </button>

              <button
                (click)="fileRemove.emit()"
                class="p-2 rounded-lg bg-white border border-red-200/50 text-red-600
                       hover:bg-red-50 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Remove and start over"
              >
                <lucide-icon [name]="XIcon" [size]="16" />
              </button>
            </div>
          </div>
        </div>
        }

        <!-- Error Display -->
        @if (error()) {
        <div
          class="mt-4 bg-red-50 border border-red-200/50 rounded-xl p-4 flex items-start gap-3"
        >
          <div
            class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <lucide-icon
              [name]="AlertCircleIcon"
              [size]="16"
              class="text-red-600"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-red-900">Upload Error</p>
            <p class="text-sm text-red-700 mt-1">{{ error() }}</p>
          </div>
          <button
            (click)="errorClear.emit()"
            class="p-1.5 rounded-lg text-red-600 hover:bg-red-100
                   transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <lucide-icon [name]="XIcon" [size]="16" />
          </button>
        </div>
        }

        <!-- Warnings Display -->
        @if (warnings().length > 0) {
        <div
          class="mt-4 bg-amber-50 border border-amber-200/50 rounded-xl p-4 flex items-start gap-3"
        >
          <div
            class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <lucide-icon
              [name]="AlertCircleIcon"
              [size]="16"
              class="text-amber-600"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-amber-900">Template Warnings</p>
            <ul class="text-sm text-amber-700 mt-1 space-y-1">
              @for (warning of warnings(); track warning) {
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0 font-bold"
                  >•</span
                >
                <span>{{ warning }}</span>
              </li>
              }
            </ul>
          </div>
        </div>
        }

        <!-- Progress Bar -->
        @if (progress()) {
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-700">{{
              progress()!.message
            }}</span>
            <span class="text-sm font-semibold text-teal-600"
              >{{ progress()!.progress }}%</span
            >
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
              [style.width.%]="progress()!.progress"
            ></div>
          </div>
        </div>
        }
      </div>
    </div>
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

  // Local state
  isDragging = false;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

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
