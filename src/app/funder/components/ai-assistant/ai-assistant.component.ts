// src/app/funder/components/ai-assistant.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sparkles, Lightbulb, TrendingUp, Copy, Calculator, FileText, HelpCircle } from 'lucide-angular';

interface FormData {
  fundingType: string;
  offerAmount: string;
  [key: string]: any;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-gradient-to-br from-purple-500 via-primary-500 to-indigo-600 p-0.5 rounded-xl sticky top-6">
      <div class="bg-white rounded-xl p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <lucide-icon [img]="SparklesIcon" [size]="16" class="text-white"></lucide-icon>
          </div>
          <h3 class="font-semibold text-gray-900">AI Assistant</h3>
        </div>

        <div class="space-y-4">
          <!-- AI Suggestion Card -->
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="LightbulbIcon" [size]="12" class="text-purple-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-purple-900 mb-1">Smart Suggestion</h4>
                <p class="text-xs text-purple-700 leading-relaxed">
                  {{ getSmartSuggestion() }}
                </p>
                <button 
                  class="text-xs text-purple-600 hover:text-purple-800 font-medium mt-2"
                  (click)="applySuggestion()"
                >
                  Apply suggestion →
                </button>
              </div>
            </div>
          </div>

          <!-- Market Insights -->
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="TrendingUpIcon" [size]="12" class="text-primary-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-primary-900 mb-1">Market Insight</h4>
                <p class="text-xs text-primary-700 leading-relaxed">
                  {{ getMarketInsight() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-2">
            <h4 class="text-sm font-semibold text-gray-900">Quick Actions</h4>
            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="copyFromTemplate()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="CopyIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Copy from template</span>
              </div>
            </button>
            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="calculateReturns()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="CalculatorIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Calculate returns</span>
              </div>
            </button>
            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="generateDescription()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="FileTextIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Generate description</span>
              </div>
            </button>
          </div>

          <!-- Progress Indicator -->
          <div class="border-t border-gray-200 pt-4">
            <div class="text-xs text-gray-500 mb-2">Form completion</div>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  class="bg-gradient-to-r from-primary-500 to-purple-500 h-1.5 rounded-full transition-all duration-300" 
                  [style.width.%]="completionPercentage"
                ></div>
              </div>
              <span class="text-xs font-medium text-gray-700">{{ completionPercentage }}%</span>
            </div>
          </div>

          <!-- Contextual Help -->
          @if (currentStep === 'terms') {
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <lucide-icon [img]="HelpCircleIcon" [size]="12" class="text-yellow-600"></lucide-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-yellow-900 mb-1">Pro Tip</h4>
                  <p class="text-xs text-yellow-700 leading-relaxed">
                    Debt financing typically ranges 10-18% interest rates in SA. Equity investments expect 20-35% IRR.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AiAssistantComponent {
  @Input() currentStep: string = 'basic';
  @Input() formData: FormData = {} as FormData;
  @Input() completionPercentage: number = 0;

  // Icons
  SparklesIcon = Sparkles;
  LightbulbIcon = Lightbulb;
  TrendingUpIcon = TrendingUp;
  CopyIcon = Copy;
  CalculatorIcon = Calculator;
  FileTextIcon = FileText;
  HelpCircleIcon = HelpCircle;

  getSmartSuggestion(): string {
    if (this.currentStep === 'terms' && this.formData.fundingType === 'debt') {
      return 'Based on current market rates, consider setting your interest rate between 11-14% for competitive positioning.';
    } else if (this.currentStep === 'basic') {
      return 'Consider adding specific industry focus in your title for better matching with qualified SMEs.';
    } else {
      return 'AI suggestions will appear here based on your form progress and market data.';
    }
  }

  getMarketInsight(): string {
    if (this.formData.offerAmount) {
      const amount = Number(this.formData.offerAmount);
      const lowerRange = Math.round(amount * 0.5 / 1000);
      const upperRange = Math.round(amount * 1.5 / 1000);
      return `SMEs typically seek R${lowerRange}K-R${upperRange}K investments. Your structure aligns well.`;
    } else {
      return 'Market insights will appear here based on your investment parameters.';
    }
  }

  applySuggestion(): void {
    // TODO: Implement suggestion application logic
    console.log('Applying AI suggestion...');
  }

  copyFromTemplate(): void {
    // TODO: Implement template copying logic
    console.log('Copying from template...');
  }

  calculateReturns(): void {
    // TODO: Implement returns calculation logic
    console.log('Calculating returns...');
  }

  generateDescription(): void {
    // TODO: Implement description generation logic
    console.log('Generating description...');
  }
}