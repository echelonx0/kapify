// src/app/funder/components/import-opportunity/steps/mapping-step.component.ts
import { Component, signal, Input, Output, EventEmitter, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, MapPin, AlertCircle, CheckCircle } from 'lucide-angular';

import { UiButtonComponent } from '../../../../shared/components';
import { FieldMappingService } from '../services/field-mapping.service';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  displayName: string;
  description: string;
}

@Component({
  selector: 'app-mapping-step',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, UiButtonComponent],
  providers: [FieldMappingService],
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="mb-8">
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Map Your Fields</h2>
        <p class="text-gray-600">Match your file columns to the opportunity fields</p>
      </div>

      <!-- Auto-mapping Section -->
      <div class="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Auto-detect Mappings</h3>
            <p class="text-gray-600">Automatically match columns based on common naming patterns</p>
          </div>
          <ui-button variant="primary" (clicked)="autoMapFields()">
            <lucide-angular [img]="MapPinIcon" [size]="16" class="mr-2"></lucide-angular>
            Auto-map Fields
          </ui-button>
        </div>
      </div>

      <!-- Mapping Progress -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-medium text-gray-900">Field Mapping Progress</h3>
          <span class="text-sm font-medium" [class.text-green-600]="mappingProgress() === 100" [class.text-orange-600]="mappingProgress() < 100">
            {{ mappingProgress() }}% Complete
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-500"
            [class.bg-green-500]="mappingProgress() === 100"
            [class.bg-orange-500]="mappingProgress() < 100"
            [style.width.%]="mappingProgress()"
          ></div>
        </div>
        <p class="text-sm text-gray-600 mt-2">
          {{ requiredMappedCount() }} of {{ requiredFieldsCount() }} required fields mapped
        </p>
      </div>

      <!-- Field Mappings -->
      <div class="space-y-6">
        @for (mapping of fieldMappings(); track mapping.targetField) {
          <div class="border border-gray-200 rounded-lg p-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- Target Field Info -->
              <div>
                <div class="flex items-center space-x-2 mb-2">
                  <h4 class="font-medium text-gray-900">{{ mapping.displayName }}</h4>
                  @if (mapping.required) {
                    <span class="text-red-500 text-sm font-medium">Required</span>
                  }
                  @if (mapping.sourceField) {
                    <lucide-angular [img]="CheckCircleIcon" [size]="16" class="text-green-500"></lucide-angular>
                  } @else if (mapping.required) {
                    <lucide-angular [img]="AlertCircleIcon" [size]="16" class="text-red-500"></lucide-angular>
                  }
                </div>
                <p class="text-sm text-gray-600 mb-3">{{ mapping.description }}</p>
                <div class="text-xs text-gray-500">
                  <span class="inline-block bg-gray-100 px-2 py-1 rounded">{{ mapping.dataType }}</span>
                </div>
              </div>

              <!-- Source Field Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Map to Column
                </label>
                <select 
                  [(ngModel)]="mapping.sourceField"
                  (ngModelChange)="onMappingChange()"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  [class.border-red-300]="mapping.required && !mapping.sourceField"
                  [class.border-green-300]="mapping.sourceField"
                >
                  <option value="">-- Select Column --</option>
                  @for (column of availableColumns(); track column) {
                    <option [value]="column">{{ column }}</option>
                  }
                </select>
                @if (mapping.required && !mapping.sourceField) {
                  <p class="text-red-600 text-xs mt-1">This field is required</p>
                }
              </div>

              <!-- Sample Value Preview -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Sample Value
                </label>
                @if (mapping.sourceField && getSampleValue(mapping.sourceField)) {
                  <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <code class="text-sm text-gray-800">{{ getSampleValue(mapping.sourceField) }}</code>
                  </div>
                  @if (getTransformedSample(mapping.sourceField, mapping.dataType)) {
                    <div class="mt-2 text-xs text-gray-600">
                      Transformed: <span class="font-mono">{{ getTransformedSample(mapping.sourceField, mapping.dataType) }}</span>
                    </div>
                  }
                } @else {
                  <div class="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-500">
                    No column selected
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Validation Summary -->
      @if (validationErrors().length > 0) {
        <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-yellow-600 mt-0.5"></lucide-angular>
            <div>
              <h4 class="font-medium text-yellow-800 mb-2">Mapping Issues</h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                @for (error of validationErrors(); track $index) {
                  <li>• {{ error }}</li>
                }
              </ul>
            </div>
          </div>
        </div>
      }

      <!-- Mapping Success -->
      @if (canProceed()) {
        <div class="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center space-x-3">
            <lucide-angular [img]="CheckCircleIcon" [size]="20" class="text-green-600"></lucide-angular>
            <div>
              <h4 class="font-medium text-green-800">Mapping Complete</h4>
              <p class="text-sm text-green-700 mt-1">
                All required fields are mapped and ready for preview.
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class MappingStepComponent implements OnInit {
  private mappingService = new FieldMappingService();

  // Icons
  MapPinIcon = MapPin;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // Inputs
  @Input() uploadedData: any = null;

  // Outputs
  @Output() stepCompleted = new EventEmitter<boolean>();
  @Output() mappingReady = new EventEmitter<any>();

  // State
  fieldMappings = signal<FieldMapping[]>([]);
  validationErrors = signal<string[]>([]);

  // Computed properties
  availableColumns = computed(() => {
    return this.uploadedData?.detectedColumns || [];
  });

  mappingProgress = computed(() => {
    const mappings = this.fieldMappings();
    const requiredMappings = mappings.filter(m => m.required);
    const completedRequired = requiredMappings.filter(m => m.sourceField).length;
    
    if (requiredMappings.length === 0) return 100;
    return Math.round((completedRequired / requiredMappings.length) * 100);
  });

  requiredFieldsCount = computed(() => {
    return this.fieldMappings().filter(m => m.required).length;
  });

  requiredMappedCount = computed(() => {
    return this.fieldMappings().filter(m => m.required && m.sourceField).length;
  });

  canProceed = computed(() => {
    return this.mappingProgress() === 100 && this.validationErrors().length === 0;
  });

  ngOnInit() {
    this.initializeFieldMappings();
  }

  private initializeFieldMappings() {
    const mappings = this.mappingService.getDefaultFieldMappings();
    this.fieldMappings.set(mappings);
    this.validateMappings();
  }

  autoMapFields() {
    const columns = this.availableColumns();
    const mappings = this.fieldMappings();
    
    const updatedMappings = this.mappingService.autoMapFields(mappings, columns);
    this.fieldMappings.set(updatedMappings);
    this.onMappingChange();
  }

  onMappingChange() {
    this.validateMappings();
    this.emitMappingData();
  }

  private validateMappings() {
    const mappings = this.fieldMappings();
    const errors: string[] = [];

    // Check required fields
    const missingRequired = mappings
      .filter(m => m.required && !m.sourceField)
      .map(m => `${m.displayName} is required`);
    
    errors.push(...missingRequired);

    // Check for duplicate mappings
    const sourceFields = mappings
      .filter(m => m.sourceField)
      .map(m => m.sourceField);
    
    const duplicates = sourceFields.filter((field, index) => 
      sourceFields.indexOf(field) !== index
    );

    duplicates.forEach(field => {
      errors.push(`Column "${field}" is mapped to multiple fields`);
    });

    this.validationErrors.set(errors);
    
    const isComplete = this.canProceed();
    this.stepCompleted.emit(isComplete);
  }

  private emitMappingData() {
    if (this.canProceed()) {
      const mappingData = {
        mappings: this.fieldMappings(),
        uploadedData: this.uploadedData
      };
      this.mappingReady.emit(mappingData);
    }
  }

  getSampleValue(columnName: string): string {
    if (!this.uploadedData?.sampleData?.length || !columnName) return '';
    
    const sample = this.uploadedData.sampleData[0];
    const value = sample[columnName];
    
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
  }

  getTransformedSample(columnName: string, dataType: string): string {
    if (!this.uploadedData?.sampleData?.length || !columnName) return '';
    
    const sample = this.uploadedData.sampleData[0];
    const value = sample[columnName];
    
    return this.mappingService.transformValue(value, dataType);
  }
}