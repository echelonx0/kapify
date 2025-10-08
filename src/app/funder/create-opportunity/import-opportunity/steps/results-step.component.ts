// src/app/funder/components/import-opportunity/steps/results-step.component.ts
import { Component, signal, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-angular';

import { UiButtonComponent } from '../../../../shared/components';

interface ImportResults {
  success: boolean;
  imported: number;
  failed: number;
  warnings: number;
  message: string;
  details?: string[];
  errors?: string[];
}

@Component({
  selector: 'app-results-step',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="p-8">
      <!-- Header -->
      <div class="mb-8 text-center">
        @if (importResults()?.success) {
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <lucide-angular [img]="CheckCircleIcon" [size]="32" class="text-green-600"></lucide-angular>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Import Successful!</h2>
          <p class="text-lg text-gray-600">
            Your funding opportunities have been imported and are now live.
          </p>
        } @else {
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <lucide-angular [img]="AlertCircleIcon" [size]="32" class="text-red-600"></lucide-angular>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Import Failed</h2>
          <p class="text-lg text-gray-600">
            There were issues during the import process.
          </p>
        }
      </div>

      <!-- Results Summary -->
      @if (importResults()) {
        <div class="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <!-- Successfully Imported -->
          @if (importResults()!.imported > 0) {
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-green-900 mb-2">{{ importResults()!.imported }}</div>
              <div class="text-sm font-medium text-green-600">Successfully Imported</div>
            </div>
          }

          <!-- Failed -->
          @if (importResults()!.failed > 0) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-red-900 mb-2">{{ importResults()!.failed }}</div>
              <div class="text-sm font-medium text-red-600">Failed to Import</div>
            </div>
          }

          <!-- Warnings -->
          @if (importResults()!.warnings > 0) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div class="text-3xl font-bold text-yellow-900 mb-2">{{ importResults()!.warnings }}</div>
              <div class="text-sm font-medium text-yellow-600">With Warnings</div>
            </div>
          }
        </div>
      }

      <!-- Success Details -->
      @if (importResults()?.success && importResults()?.details) {
        <div class="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="CheckCircleIcon" [size]="20" class="text-green-600 mt-0.5"></lucide-angular>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-green-900 mb-2">Import Complete</h3>
              <p class="text-green-700 mb-4">{{ importResults()!.message }}</p>
              
              @if (importResults()!.details!.length > 0) {
                <div class="space-y-2">
                  <h4 class="font-medium text-green-900">Import Details:</h4>
                  <ul class="text-sm text-green-700 space-y-1">
                    @for (detail of importResults()!.details!; track $index) {
                      <li>• {{ detail }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Error Details -->
      @if (importResults() && !importResults()!.success && importResults()!.errors) {
        <div class="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-600 mt-0.5"></lucide-angular>
            <div class="flex-1">
              <h3 class="text-lg font-medium text-red-900 mb-2">Import Errors</h3>
              <p class="text-red-700 mb-4">{{ importResults()!.message }}</p>
              
              @if (importResults()!.errors!.length > 0) {
                <div class="space-y-2">
                  <h4 class="font-medium text-red-900">Error Details:</h4>
                  <ul class="text-sm text-red-700 space-y-1">
                    @for (error of importResults()!.errors!; track $index) {
                      <li>• {{ error }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Next Steps -->
      <div class="border border-gray-200 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
        
        @if (importResults()?.success) {
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Review Your Opportunities</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Check your dashboard to view and manage your newly imported funding opportunities.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Configure Settings</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Fine-tune opportunity settings, application criteria, and matching preferences.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Start Receiving Applications</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Your opportunities are now live and SMEs can start applying for funding.
                </p>
              </div>
            </div>
          </div>
        } @else {
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-orange-600">1</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Fix Data Issues</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Review the error details above and correct the data in your source file.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-orange-600">2</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Try Import Again</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Once you've fixed the issues, you can attempt the import process again.
                </p>
              </div>
            </div>
            
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                <span class="text-xs font-bold text-orange-600">3</span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900">Create Manually</h4>
                <p class="text-sm text-gray-600 mt-1">
                  Alternatively, you can create opportunities one by one using our form interface.
                </p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        @if (importResults()?.success) {
          <ui-button variant="primary" (clicked)="viewDashboard()">
            <lucide-angular [img]="TrendingUpIcon" [size]="16" class="mr-2"></lucide-angular>
            View Dashboard
          </ui-button>
          
          <ui-button variant="outline" (clicked)="viewOpportunities()">
            <lucide-angular [img]="FileTextIcon" [size]="16" class="mr-2"></lucide-angular>
            View Opportunities
          </ui-button>
        } @else {
          <ui-button variant="primary" (clicked)="tryAgain()">
            Try Import Again
          </ui-button>
          
          <ui-button variant="outline" (clicked)="createManually()">
            Create Manually
          </ui-button>
        }
        
        <ui-button variant="ghost" (clicked)="finishImport()">
          Done
        </ui-button>
      </div>
    </div>
  `
})
export class ResultsStepComponent {
  // Icons
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;

  // Use signal input for Angular 17+
  importResults = input<ImportResults | null>(null);

  // Outputs
  @Output() importComplete = new EventEmitter<void>();

  // Action methods
  viewDashboard() {
    this.importComplete.emit();
  }

  viewOpportunities() {
    // Navigate to opportunities list
    this.importComplete.emit();
  }

  tryAgain() {
    // Reset to upload step
    window.location.reload();
  }

  createManually() {
    // Navigate to manual creation
    this.importComplete.emit();
  }

  finishImport() {
    this.importComplete.emit();
  }
}