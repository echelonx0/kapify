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
    <!-- Premium Card with Gradient Accent -->
    <div class="section-card">
      <div class="section-header">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white">
                <lucide-icon [name]="FileTextIcon" [size]="20"></lucide-icon>
              </div>
              <h3 class="section-title">Financial Analysis Notes</h3>
            </div>
            <p class="section-description">
              Document your financial assumptions, methodology, and key insights for institutional review
            </p>
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
      </div>

      <!-- Notes Input Area -->
      <div class="p-6 space-y-4">
        
        <!-- Textarea with Focus Ring -->
        <div class="relative">
          <textarea
            [(ngModel)]="notes"
            (input)="onNotesChange()"
            (blur)="saveNotes()"
            [placeholder]="placeholderText"
            [maxlength]="maxCharacters"
            rows="6"
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

        <!-- Quick Tips Section -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <lucide-icon [name]="LightbulbIcon" [size]="16"></lucide-icon>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-blue-900 mb-2">Tips for Institutional Review</h4>
              <ul class="space-y-1.5 text-xs text-blue-800">
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Explain key assumptions behind revenue projections</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Document methodology for financial ratios calculation</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Highlight any anomalies or seasonal variations</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Reference industry benchmarks where applicable</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Template Suggestions -->
        @if (notes().length === 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            @for (suggestion of quickSuggestions; track suggestion.title) {
              <button
                (click)="applySuggestion(suggestion.text)"
                class="text-left p-3 rounded-lg border-2 border-gray-200 hover:border-primary-300 
                       hover:bg-primary-50 transition-all duration-200 group">
                <p class="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary-700">
                  {{ suggestion.title }}
                </p>
                <p class="text-xs text-gray-500 line-clamp-2">{{ suggestion.preview }}</p>
              </button>
            }
          </div>
        }
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
  maxCharacters = 2000;

  // Computed values
  characterCount = computed(() => this.notes().length);
  
  placeholderText = `Example: "Revenue projections are based on conservative 15% YoY growth, aligned with industry benchmarks for our sector. EBITDA margins assume operational efficiency improvements from our planned digital transformation initiative. Financial ratios calculated using standard formulas, with debt-equity ratio reflecting our planned Series A funding round..."`;

  // Quick suggestion templates
  quickSuggestions = [
    {
      title: 'Revenue Assumptions',
      preview: 'Document your revenue growth assumptions and market factors...',
      text: 'Revenue projections are based on [X%] growth rate, considering [market factors]. Key drivers include [list drivers]. Conservative estimates account for [risk factors].'
    },
    {
      title: 'Cost Structure',
      preview: 'Explain your cost allocation and efficiency measures...',
      text: 'Cost structure reflects [operational model]. COGS assumptions based on [supplier agreements/industry standards]. Operating expenses optimized through [efficiency initiatives].'
    },
    {
      title: 'Financial Ratios',
      preview: 'Clarify ratio calculations and benchmarks...',
      text: 'Financial ratios calculated using [methodology]. Current ratios benchmarked against [industry standards]. Target improvements driven by [strategic initiatives].'
    },
    {
      title: 'Risk Factors',
      preview: 'Identify key financial risks and mitigation...',
      text: 'Key financial risks include [list risks]. Mitigation strategies: [describe approach]. Contingency plans ensure [financial stability measures].'
    }
  ];

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

  applySuggestion(text: string) {
    this.notes.set(text);
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