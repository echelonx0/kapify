// src/app/ai/ai-analysis/components/analysis-error.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, XCircle, RefreshCw, MessageCircle } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-analysis-error',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="px-8 py-10 text-center">
      <div class="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
        <lucide-icon [img]="XCircleIcon" [size]="24" class="text-red-600" />
      </div>
      <h3 class="text-xl font-semibold text-gray-900 mb-3">
        {{ getErrorTitle() }}
      </h3>
      
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 max-w-lg mx-auto mb-6">
        <p class="text-red-800 text-sm leading-relaxed">{{ error }}</p>
      </div>
      
      <!-- Helpful troubleshooting tips -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto mb-6">
        <h4 class="font-semibold text-blue-900 mb-2">Troubleshooting Tips:</h4>
        <ul class="text-blue-800 text-sm text-left space-y-1">
          @for (tip of getTroubleshootingTips(); track $index) {
            <li>• {{ tip }}</li>
          }
        </ul>
      </div>
      
      <div class="flex justify-center space-x-4">
        <ui-button variant="outline" (click)="handleDismiss()">
          Dismiss
        </ui-button>
        <ui-button variant="primary" (click)="handleRetry()">
          <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
          Try Again
        </ui-button>
      </div>
      
      <!-- Contact support option for persistent issues -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <p class="text-gray-600 text-sm">
          Still having issues? 
          <button class="text-blue-600 hover:text-blue-800 font-medium ml-1" (click)="contactSupport()">
            <lucide-icon [img]="MessageCircleIcon" [size]="14" class="inline mr-1" />
            Contact Support
          </button>
        </p>
      </div>
    </div>
  `
})
export class AnalysisErrorComponent {
  @Input() error!: string;
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  
  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  // Icons
  XCircleIcon = XCircle;
  RefreshCwIcon = RefreshCw;
  MessageCircleIcon = MessageCircle;

  getErrorTitle(): string {
    return this.analysisPerspective === 'sme' 
      ? 'Analysis Failed' 
      : 'Due Diligence Analysis Failed';
  }

  getTroubleshootingTips(): string[] {
    const commonTips = [
      'Ensure your internet connection is stable',
      'Try refreshing the page and starting over'
    ];

    if (this.analysisPerspective === 'sme') {
      return [
        'Ensure your business profile is complete',
        'Check that financial data includes revenue amounts',
        ...commonTips
      ];
    } else {
      return [
        'Verify all application data is properly submitted',
        'Check that required documents are uploaded',
        ...commonTips
      ];
    }
  }

  handleRetry() {
    this.retry.emit();
  }

  handleDismiss() {
    this.dismiss.emit();
  }

  contactSupport() {
    // Implement support contact logic
    console.log('Contact support requested');
    // Could open a modal, navigate to support page, or open email client
  }
}