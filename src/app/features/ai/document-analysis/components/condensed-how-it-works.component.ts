import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Upload,
  FileText,
  Globe,
  Sparkles,
  CheckCircle,
  ChevronDown,
} from 'lucide-angular';

interface Stage {
  icon: any;
  title: string;
  shortDesc: string;
  longDesc: string;
  details: string[];
}

@Component({
  selector: 'app-condensed-how-it-works',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h3 class="text-lg font-bold text-teal-600 mb-1">How It Works</h3>
      </div>

      <!-- Stages -->
      <div class="space-y-2">
        @for (stage of stages; track $index; let i = $index) {
          <button
            (click)="toggleStage(i)"
            class="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:border-teal-300"
            [class.border-teal-400]="isExpanded(i)"
            [class.bg-teal-50]="isExpanded(i)"
            [class.border-slate-200]="!isExpanded(i)"
            [class.bg-white]="!isExpanded(i)"
          >
            <!-- Stage Header -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <div
                  class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200"
                >
                  <lucide-icon
                    [img]="stage.icon"
                    [size]="16"
                    class="text-slate-600"
                  ></lucide-icon>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-slate-600 uppercase mb-1">
                    Stage {{ i + 1 }}
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 mb-1">
                    {{ stage.title }}
                  </h4>
                  <p class="text-xs text-slate-600 line-clamp-2">
                    {{ stage.shortDesc }}
                  </p>
                </div>
              </div>
              <lucide-icon
                [img]="ChevronDownIcon"
                [size]="16"
                class="text-slate-400 flex-shrink-0 transition-transform duration-200"
                [class.rotate-180]="isExpanded(i)"
              ></lucide-icon>
            </div>

            <!-- Expanded Details -->
            @if (isExpanded(i)) {
              <div class="mt-4 pt-4 border-t border-teal-200/50 space-y-3">
                <p class="text-sm text-slate-700 leading-relaxed">
                  {{ stage.longDesc }}
                </p>
                <div class="space-y-2">
                  @for (detail of stage.details; track $index) {
                    <div class="flex items-start gap-2">
                      <span class="text-teal-500 font-bold mt-0.5">•</span>
                      <span class="text-xs text-slate-700">{{ detail }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class CondensedHowItWorksComponent {
  CheckCircleIcon = CheckCircle;
  ChevronDownIcon = ChevronDown;

  expandedStages = signal<number[]>([]);

  stages: Stage[] = [
    {
      icon: Upload,
      title: 'Document Ingestion',
      shortDesc: 'Your proposal is securely processed and indexed',
      longDesc:
        'Kapify securely ingests your proposal document and prepares it for deep analysis. The system validates file integrity and extracts structured content.',
      details: [
        'Secure document validation',
        'Content extraction and indexing',
        'Data structure mapping',
      ],
    },
    {
      icon: FileText,
      title: 'Strategic Assessment',
      shortDesc: 'Business model and financial metrics are evaluated',
      longDesc:
        'Our proprietary technology assesses your business model, financial metrics, market positioning, and key operational factors against industry standards.',
      details: [
        'Business model assessment',
        'Financial metrics evaluation',
        'Operational risk analysis',
      ],
    },
    {
      icon: Globe,
      title: 'Market Benchmarking',
      shortDesc: 'Real-time comparison against market data',
      longDesc:
        'Kapify compares your proposal against current funding trends, competitor positioning, and industry valuation metrics sourced from real-time market data.',
      details: [
        'Funding landscape analysis',
        'Competitive positioning',
        'Sector valuation benchmarks',
      ],
    },
    {
      icon: Sparkles,
      title: 'Intelligence Engine',
      shortDesc: 'Proprietary algorithms calculate investment potential',
      longDesc:
        'Our proprietary business intelligence engine evaluates investment viability, market timing, competitive advantage, and probability of successful outcomes.',
      details: [
        'Investment viability score',
        'Market timing assessment',
        'Success probability modeling',
      ],
    },
    {
      icon: CheckCircle,
      title: 'Strategic Insights',
      shortDesc: 'Actionable recommendations and strategic guidance',
      longDesc:
        'Receive a comprehensive intelligence report with strategic recommendations, competitive advantages, improvement opportunities, and key risk factors.',
      details: [
        'Strategic recommendations',
        'Competitive advantage analysis',
        'Key risk identification',
      ],
    },
  ];

  keyFeatures = [
    {
      title: 'Investment Viability Score',
      desc: 'Proprietary business intelligence rating',
    },
    {
      title: 'Success Probability',
      desc: 'Funding success modeling',
    },
    {
      title: 'Market Benchmarks',
      desc: 'Real-time market data comparison',
    },
    {
      title: 'Strategic Intelligence',
      desc: 'Competitive advantage analysis',
    },
  ];

  isExpanded(index: number): boolean {
    return this.expandedStages().includes(index);
  }

  toggleStage(index: number) {
    const expanded = this.expandedStages();
    if (expanded.includes(index)) {
      this.expandedStages.set(expanded.filter((i) => i !== index));
    } else {
      // Only allow one expanded at a time for mobile-friendly UX
      this.expandedStages.set([index]);
    }
  }
}
