import { Component, model, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FileText,
  Check,
  AlertCircle,
  Lightbulb,
  Plus,
} from 'lucide-angular';

@Component({
  selector: 'app-financial-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div class="flex items-start gap-3">
          <div
            class="bg-teal-100 text-teal-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <lucide-icon [name]="FileTextIcon" [size]="20"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-slate-900">
              Financial Analysis Notes
            </h3>
            <p class="text-sm text-slate-600 mt-0.5">
              Provide assumptions and key insights behind your financial data
            </p>
          </div>
        </div>

        <!-- Character Counter Badge -->
        <div class="flex flex-col items-end gap-2 flex-shrink-0">
          <div
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200"
            [ngClass]="getCharacterCountStyle()"
          >
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

      <!-- Quick Tips Tabs -->
      <div class="border-b border-slate-200">
        <nav class="-mb-px flex gap-6 overflow-x-auto">
          @for (suggestion of quickSuggestions; track suggestion.title) {
          <button
            (click)="activeSuggestion.set(suggestion.title)"
            [class]="
              activeSuggestion() === suggestion.title
                ? 'border-b-2 border-teal-500 text-teal-600'
                : 'border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            "
            class="whitespace-nowrap py-3 font-medium text-sm transition-colors duration-200"
          >
            {{ suggestion.title }}
          </button>
          }
        </nav>
      </div>

      <!-- Active Suggestion Card -->
      <div class="bg-teal-50 rounded-2xl border border-teal-300/50 p-6">
        <div class="flex items-start gap-4">
          <div
            class="bg-teal-100 text-teal-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <lucide-icon [name]="LightbulbIcon" [size]="16"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-teal-900 mb-2">
              {{ getActiveSuggestion()?.title }}
            </h4>
            <p class="text-sm text-teal-800 mb-4 leading-relaxed">
              {{ getActiveSuggestion()?.preview }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                (click)="applySuggestion(getActiveSuggestion()!.text, false)"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <lucide-icon [name]="PlusIcon" [size]="16"></lucide-icon>
                {{ notes().length === 0 ? 'Use Template' : 'Replace' }}
              </button>
              @if (notes().length > 0) {
              <button
                (click)="applySuggestion(getActiveSuggestion()!.text, true)"
                class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <lucide-icon [name]="PlusIcon" [size]="16"></lucide-icon>
                Append Section
              </button>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Textarea -->
      <div class="relative">
        <label class="block text-sm font-semibold text-slate-900 mb-2">
          Your Notes
        </label>
        <textarea
          [(ngModel)]="notes"
          (input)="onNotesChange()"
          (blur)="saveNotes()"
          [placeholder]="placeholderText"
          [maxlength]="maxCharacters"
          rows="8"
          class="w-full px-4 py-2.5 border border-slate-200 rounded-xl
                 text-slate-900 placeholder-slate-400
                 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                 transition-all duration-200 resize-none
                 hover:border-slate-300"
          [class.border-amber-300]="isNearLimit()"
        ></textarea>

        <!-- Character Warning -->
        @if (isNearLimit()) {
        <div
          class="absolute -bottom-6 left-0 flex items-center gap-1.5 text-amber-700 text-xs"
        >
          <lucide-icon [name]="AlertCircleIcon" [size]="12"></lucide-icon>
          <span>Approaching character limit</span>
        </div>
        }
      </div>

      <!-- Tips Section -->
      <div class="bg-amber-50 rounded-2xl border border-amber-200/50 p-6">
        <div class="flex items-start gap-4">
          <div
            class="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          >
            <lucide-icon [name]="LightbulbIcon" [size]="16"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-amber-900 mb-3">
              Tips for Institutional Review
            </h4>
            <ul class="space-y-2 text-sm text-amber-800">
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0 font-bold"
                  >•</span
                >
                <span>Explain key assumptions behind revenue projections</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0 font-bold"
                  >•</span
                >
                <span
                  >Document methodology for financial ratios calculation</span
                >
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0 font-bold"
                  >•</span
                >
                <span>Highlight any anomalies or seasonal variations</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-amber-400 mt-0.5 flex-shrink-0 font-bold"
                  >•</span
                >
                <span>Reference industry benchmarks where applicable</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(-2px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
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
    `,
  ],
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
  PlusIcon = Plus;

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
      text: 'Revenue Assumptions: Revenue projections are based on [X%] growth rate, considering [market factors]. Key drivers include [list drivers]. Conservative estimates account for [risk factors].',
    },
    {
      title: 'Cost Structure',
      preview: 'Explain your cost allocation and efficiency measures.',
      text: 'Cost Structure: Cost structure reflects [operational model]. COGS assumptions based on [supplier agreements/industry standards]. Operating expenses optimized through [efficiency initiatives].',
    },
    {
      title: 'Financial Ratios',
      preview: 'Clarify ratio calculations and benchmarks.',
      text: 'Financial Ratios: Calculated using [methodology]. Current ratios benchmarked against [industry standards]. Target improvements driven by [strategic initiatives].',
    },
    {
      title: 'Risk Factors',
      preview: 'Identify key financial risks and mitigation strategies.',
      text: 'Risk Factors: Key financial risks include [list risks]. Mitigation strategies: [describe approach]. Contingency plans ensure [financial stability measures].',
    },
  ];

  getActiveSuggestion() {
    return this.quickSuggestions.find(
      (s) => s.title === this.activeSuggestion()
    );
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

    if (count > limit * 0.9) return 'bg-amber-100 text-amber-700';
    if (count > limit * 0.75) return 'bg-amber-100 text-amber-700';
    if (count > limit * 0.5) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  }
}
