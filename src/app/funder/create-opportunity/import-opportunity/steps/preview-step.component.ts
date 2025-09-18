// src/app/funder/components/import-opportunity/steps/preview-step.component.ts
import { Component, signal, Input, Output, EventEmitter, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, AlertCircle, Eye, RefreshCw } from 'lucide-angular';

import { UiButtonComponent } from '../../../../shared/components';
import { ImportValidationService } from '../services/import-validation.service';
import { FieldMappingService } from '../services/field-mapping.service';

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  errors: ValidationError[];
}

@Component({
  selector: 'app-preview-step',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  providers: [ImportValidationService, FieldMappingService],
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">Preview & Validate</h2>
            <p class="text-gray-600">Review your data before importing</p>
          </div>
          <ui-button variant="outline" (clicked)="validateData()">
            <lucide-angular [img]="RefreshCwIcon" [size]="16" class="mr-2"></lucide-angular>
            Re-validate
          </ui-button>
        </div>
      </div>

      <!-- Validation Summary -->
      @if (validationSummary()) {
        <div class="mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <!-- Total Rows -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-blue-900">{{ validationSummary()!.totalRows }}</div>
            <div class="text-sm text-blue-600">Total Rows</div>
          </div>
          
          <!-- Valid Rows -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="text-2xl font-bold text-green-900">{{ validationSummary()!.validRows }}</div>
            <div class="text-sm text-green-600">Valid Rows</div>
          </div>
          
          <!-- Error Rows -->
          @if (validationSummary()!.errorRows > 0) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="text-2xl font-bold text-red-900">{{ validationSummary()!.errorRows }}</div>
              <div class="text-sm text-red-600">Error Rows</div>
            </div>
          }
          
          <!-- Warning Rows -->
          @if (validationSummary()!.warningRows > 0) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="text-2xl font-bold text-yellow-900">{{ validationSummary()!.warningRows }}</div>
              <div class="text-sm text-yellow-600">Warning Rows</div>
            </div>
          }
        </div>
      }

      <!-- Status Alert -->
      @if (validationSummary()) {
        @if (canImport()) {
          <div class="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-start space-x-3">
              <lucide-angular [img]="CheckCircleIcon" [size]="20" class="text-green-600 mt-0.5"></lucide-angular>
              <div>
                <h4 class="font-medium text-green-800">Ready to Import</h4>
                <p class="text-sm text-green-700 mt-1">
                  {{ validationSummary()!.validRows }} opportunities are ready to be imported.
                  @if (validationSummary()!.warningRows > 0) {
                    {{ validationSummary()!.warningRows }} rows have warnings but can still be imported.
                  }
                </p>
              </div>
            </div>
          </div>
        } @else {
          <div class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-start space-x-3">
              <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-600 mt-0.5"></lucide-angular>
              <div>
                <h4 class="font-medium text-red-800">Cannot Import</h4>
                <p class="text-sm text-red-700 mt-1">
                  {{ validationSummary()!.errorRows }} rows have errors that must be fixed before importing.
                  Please review and correct the data in your source file.
                </p>
              </div>
            </div>
          </div>
        }
      }

      <!-- Data Preview Table -->
      @if (previewData().length > 0) {
        <div class="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Data Preview</h4>
              <div class="text-sm text-gray-600">
                Showing {{ Math.min(previewData().length, maxPreviewRows) }} of {{ previewData().length }} rows
              </div>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funding Type
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer Amount
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Available
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (row of previewData().slice(0, maxPreviewRows); track $index; let i = $index) {
                  <tr [class.bg-red-50]="hasRowErrors(i)" [class.bg-yellow-50]="hasRowWarnings(i) && !hasRowErrors(i)">
                    <td class="px-4 py-2 text-sm text-gray-900">{{ i + 1 }}</td>
                    <td class="px-4 py-2 text-sm">
                      @if (hasRowErrors(i)) {
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <lucide-angular [img]="AlertCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                          Error
                        </span>
                      } @else if (hasRowWarnings(i)) {
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <lucide-angular [img]="AlertCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                          Warning
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <lucide-angular [img]="CheckCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                          Valid
                        </span>
                      }
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-900 max-w-32 truncate">{{ row.title || '-' }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ row.fundingType || '-' }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ formatCurrency(row.offerAmount) }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ formatCurrency(row.totalAvailable) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Validation Errors Details -->
      @if (validationSummary() && validationSummary()!.errors.length > 0) {
        <div class="border border-gray-200 rounded-lg overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 class="font-medium text-gray-900">Validation Issues</h4>
            <p class="text-sm text-gray-600 mt-1">Review and fix these issues in your source file</p>
          </div>
          
          <div class="max-h-64 overflow-y-auto">
            <div class="divide-y divide-gray-200">
              @for (error of validationSummary()!.errors.slice(0, 50); track $index) {
                <div class="p-4" [class.bg-red-50]="error.severity === 'error'" [class.bg-yellow-50]="error.severity === 'warning'">
                  <div class="flex items-start space-x-3">
                    <lucide-angular 
                      [img]="AlertCircleIcon" 
                      [size]="16" 
                      [class.text-red-500]="error.severity === 'error'"
                      [class.text-yellow-500]="error.severity === 'warning'"
                      class="mt-0.5"
                    ></lucide-angular>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium" 
                         [class.text-red-800]="error.severity === 'error'"
                         [class.text-yellow-800]="error.severity === 'warning'">
                        Row {{ error.row + 1 }}, {{ error.field }}
                      </p>
                      <p class="text-sm" 
                         [class.text-red-700]="error.severity === 'error'"
                         [class.text-yellow-700]="error.severity === 'warning'">
                        {{ error.message }}
                      </p>
                      @if (error.value !== undefined && error.value !== null) {
                        <p class="text-xs text-gray-600 mt-1">
                          Value: "{{ error.value }}"
                        </p>
                      }
                    </div>
                  </div>
                </div>
              }
              
              @if (validationSummary()!.errors.length > 50) {
                <div class="p-4 bg-gray-50 text-center">
                  <p class="text-sm text-gray-600">
                    Showing first 50 of {{ validationSummary()!.errors.length }} issues.
                    Fix these issues to see more.
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PreviewStepComponent implements OnInit {
  private validationService = new ImportValidationService();
  private mappingService = new FieldMappingService();

  // Icons
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  EyeIcon = Eye;
  RefreshCwIcon = RefreshCw;

  // Inputs
  @Input() transformedData: any = null;

  // Outputs
  @Output() stepCompleted = new EventEmitter<boolean>();
  @Output() validDataReady = new EventEmitter<any[]>();

  // State
  previewData = signal<any[]>([]);
  validationSummary = signal<ValidationSummary | null>(null);
  isValidating = signal(false);
  maxPreviewRows = 20;

  // Make Math available in template
  Math = Math;

  // Computed
  canImport = computed(() => {
    const summary = this.validationSummary();
    return summary ? summary.errorRows === 0 && summary.validRows > 0 : false;
  });

  ngOnInit() {
    if (this.transformedData) {
      this.processTransformedData();
    }
  }

  private processTransformedData() {
    if (!this.transformedData?.mappings || !this.transformedData?.uploadedData) {
      return;
    }

    const { mappings, uploadedData } = this.transformedData;
    
    // Transform raw data using mappings
    const transformedRows = uploadedData.rawData.map((row: any) => 
      this.mappingService.transformRowData(row, mappings)
    );

    this.previewData.set(transformedRows);
    this.validateData();
  }

  validateData() {
    this.isValidating.set(true);
    
    setTimeout(() => {
      const data = this.previewData();
      const errors: ValidationError[] = [];
      
      data.forEach((row, rowIndex) => {
        // Validate required fields
        this.validateRequiredFields(row, rowIndex, errors);
        
        // Validate field values
        this.validateFieldValues(row, rowIndex, errors);
        
        // Cross-field validations
        this.validateRowConstraints(row, rowIndex, errors);
      });

      const summary = this.calculateValidationSummary(data, errors);
      this.validationSummary.set(summary);
      
      const isValid = this.canImport();
      this.stepCompleted.emit(isValid);
      
      // DON'T auto-emit valid data - wait for user to click "Import"
      // if (isValid) {
      //   const validRows = this.getValidRows(data, errors);
      //   this.validDataReady.emit(validRows);
      // }
      
      this.isValidating.set(false);
    }, 100);
  }

  // Add method to manually trigger import
  triggerImport() {
    if (this.canImport()) {
      const data = this.previewData();
      const errors = this.validationSummary()?.errors || [];
      const validRows = this.getValidRows(data, errors);
      this.validDataReady.emit(validRows);
    }
  }

  private validateRequiredFields(row: any, rowIndex: number, errors: ValidationError[]) {
    const requiredFields = ['title', 'description', 'shortDescription', 'fundingType', 'offerAmount', 'totalAvailable'];
    
    requiredFields.forEach(field => {
      if (!row[field] || (typeof row[field] === 'string' && !row[field].trim())) {
        errors.push({
          row: rowIndex,
          field,
          value: row[field],
          message: `${this.getFieldDisplayName(field)} is required`,
          severity: 'error'
        });
      }
    });
  }

  private validateFieldValues(row: any, rowIndex: number, errors: ValidationError[]) {
    Object.keys(row).forEach(field => {
      const value = row[field];
      if (value === null || value === undefined) return;

      const errorMessage = this.validationService.validateFieldValue(field, value);
      if (errorMessage) {
        errors.push({
          row: rowIndex,
          field,
          value,
          message: errorMessage,
          severity: field === 'currency' ? 'warning' : 'error'
        });
      }
    });
  }

  private validateRowConstraints(row: any, rowIndex: number, errors: ValidationError[]) {
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

  private calculateValidationSummary(data: any[], errors: ValidationError[]): ValidationSummary {
    const errorRows = new Set(errors.filter(e => e.severity === 'error').map(e => e.row));
    const warningRows = new Set(errors.filter(e => e.severity === 'warning').map(e => e.row));
    
    return {
      totalRows: data.length,
      validRows: data.length - errorRows.size,
      errorRows: errorRows.size,
      warningRows: warningRows.size - errorRows.size, // Exclude rows that also have errors
      errors
    };
  }

  private getValidRows(data: any[], errors: ValidationError[]): any[] {
    const errorRowIndices = new Set(
      errors.filter(e => e.severity === 'error').map(e => e.row)
    );
    
    return data.filter((_, index) => !errorRowIndices.has(index));
  }

  hasRowErrors(rowIndex: number): boolean {
    const summary = this.validationSummary();
    return summary ? summary.errors.some(e => e.row === rowIndex && e.severity === 'error') : false;
  }

  hasRowWarnings(rowIndex: number): boolean {
    const summary = this.validationSummary();
    return summary ? summary.errors.some(e => e.row === rowIndex && e.severity === 'warning') : false;
  }

  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(Number(amount));
  }

  private getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      shortDescription: 'Short Description',
      fundingType: 'Funding Type',
      offerAmount: 'Offer Amount',
      totalAvailable: 'Total Available'
    };
    return displayNames[field] || field;
  }
}