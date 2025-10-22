// src/app/profile/steps/financial-analysis/components/financial-notes/financial-notes.component.ts
import { Component, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Check, AlertCircle, Lightbulb } from 'lucide-angular';

@Component({
  selector: 'app-financial-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white">
            <lucide-icon [name]="FileTextIcon" [size]="20"></lucide-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Financial Analysis Notes</h3>
            <p class="text-sm text-gray-600">Please provide assumptions and key insights behind your financial data</p>
          </div>
        </div>
        
        <!-- Character Counter Badge -->
        <div class="flex flex-col items-end gap-2">
          <div class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200"
               [ngClass]="getCharacterCountStyle()">
            {{ characterCount() }} / {{ maxCharacters }}
          </div>
          
          @if (isSaved()) {
            <div class="flex items-center gap-1.5 text-green-600 animate-fade-in">
              <lucide-icon [name]="CheckIcon" [size]="14"></lucide-icon>
              <span class="text-xs font-medium">Auto-saved</span>
            </div>
          }
        </div>
      </div>

      <!-- Quick Tips Tabs (always visible for reference and building notes) -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-6 overflow-x-auto">
          @for (suggestion of quickSuggestions; track suggestion.title) {
            <button
              (click)="activeSuggestion.set(suggestion.title)"
              [class]="activeSuggestion() === suggestion.title 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200">
              {{ suggestion.title }}
            </button>
          }
        </nav>
      </div>

      <!-- Active Suggestion Content -->
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <lucide-icon [name]="LightbulbIcon" [size]="16"></lucide-icon>
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-semibold text-blue-900 mb-3">{{ getActiveSuggestion()?.title }}</h4>
            <p class="text-sm text-blue-800 mb-4 leading-relaxed">{{ getActiveSuggestion()?.preview }}</p>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                (click)="applySuggestion(getActiveSuggestion()!.text, false)"
                class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                <lucide-icon name="plus" [size]="16"></lucide-icon>
                {{ notes().length === 0 ? 'Use Template' : 'Replace' }}
              </button>
              @if (notes().length > 0) {
                <button
                  (click)="applySuggestion(getActiveSuggestion()!.text, true)"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors duration-200">
                  <lucide-icon name="plus" [size]="16"></lucide-icon>
                  Append Section
                </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Textarea with Focus Ring -->
      <div class="relative">
        <textarea
          [(ngModel)]="notes"
          (input)="onNotesChange()"
          (blur)="saveNotes()"
          [placeholder]="placeholderText"
          [maxlength]="maxCharacters"
          rows="8"
          class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl 
                 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 
                 transition-all duration-200 resize-none
                 text-gray-900 placeholder-gray-400
                 hover:border-gray-300"
          [class.border-red-300]="isNearLimit()"
        ></textarea>
        
        <!-- Character Warning -->
        @if (isNearLimit()) {
          <div class="absolute -bottom-6 left-0 flex items-center gap-1.5 text-orange-600 text-xs">
            <lucide-icon [name]="AlertCircleIcon" [size]="12"></lucide-icon>
            <span>Approaching character limit</span>
          </div>
        }
      </div>

      <!-- General Tips -->
      <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
        <div class="flex items-start gap-3">
          <div class="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
            <lucide-icon [name]="LightbulbIcon" [size]="14"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-semibold text-amber-900 mb-2">Tips for Institutional Review</h4>
            <ul class="space-y-1 text-xs text-amber-800">
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                <span>Explain key assumptions behind revenue projections</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                <span>Document methodology for financial ratios calculation</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                <span>Highlight any anomalies or seasonal variations</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                <span>Reference industry benchmarks where applicable</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-2px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fade-in 0.3s ease-out;
    }

    textarea::-webkit-scrollbar {
      width: 8px;
    }

    textarea::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 4px;
    }

    textarea::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    textarea::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class FinancialNotesComponent {
  // Model and outputs
  notes = model<string>('');
  notesSaved = output<string>();

  // Icons
  FileTextIcon = FileText;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  LightbulbIcon = Lightbulb;

  // State
  isSaved = signal(false);
  activeSuggestion = signal<string>('Revenue Assumptions');
  maxCharacters = 2000;

  // Computed values
  characterCount = computed(() => this.notes().length);
  
  placeholderText = `Example: "Revenue projections are based on conservative 15% YoY growth, aligned with industry benchmarks for our sector. EBITDA margins assume operational efficiency improvements from our planned digital transformation initiative. Financial ratios calculated using standard formulas, with debt-equity ratio reflecting our planned Series A funding round..."`;

  // Quick suggestion templates
  quickSuggestions = [
    {
      title: 'Revenue Assumptions',
      preview: 'Document your revenue growth assumptions and market factors.',
      text: 'Revenue Assumptions: Revenue projections are based on [X%] growth rate, considering [market factors]. Key drivers include [list drivers]. Conservative estimates account for [risk factors].'
    },
    {
      title: 'Cost Structure',
      preview: 'Explain your cost allocation and efficiency measures.',
      text: 'Cost Structure: Cost structure reflects [operational model]. COGS assumptions based on [supplier agreements/industry standards]. Operating expenses optimized through [efficiency initiatives].'
    },
    {
      title: 'Financial Ratios',
      preview: 'Clarify ratio calculations and benchmarks.',
      text: 'Financial Ratios: Calculated using [methodology]. Current ratios benchmarked against [industry standards]. Target improvements driven by [strategic initiatives].'
    },
    {
      title: 'Risk Factors',
      preview: 'Identify key financial risks and mitigation strategies.',
      text: 'Risk Factors: Key financial risks include [list risks]. Mitigation strategies: [describe approach]. Contingency plans ensure [financial stability measures].'
    }
  ];

  getActiveSuggestion() {
    return this.quickSuggestions.find(s => s.title === this.activeSuggestion());
  }

  onNotesChange() {
    this.isSaved.set(false);
  }

  saveNotes() {
    this.notesSaved.emit(this.notes());
    this.isSaved.set(true);
    
    // Reset saved indicator after 3 seconds
    setTimeout(() => {
      this.isSaved.set(false);
    }, 3000);
  }

  applySuggestion(text: string, append: boolean = false) {
    if (append && this.notes().length > 0) {
      // Append with line break separator
      this.notes.set(this.notes() + '\n\n' + text);
    } else {
      // Replace entire content
      this.notes.set(text);
    }
    this.onNotesChange();
  }

  isNearLimit(): boolean {
    return this.characterCount() > this.maxCharacters * 0.9;
  }

  getCharacterCountStyle(): string {
    const count = this.characterCount();
    const limit = this.maxCharacters;
    
    if (count > limit * 0.9) return 'bg-red-100 text-red-700';
    if (count > limit * 0.75) return 'bg-orange-100 text-orange-700';
    if (count > limit * 0.5) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }
}