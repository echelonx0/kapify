import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Upload,
  FileText,
  Globe,
  Sparkles,
  CheckCircle,
  X,
} from 'lucide-angular';
import { EventEmitter, Output } from '@angular/core';

interface ProcessingStage {
  icon: any;
  title: string;
  description: string;
  details: string[];
  color: 'teal' | 'blue' | 'purple' | 'emerald' | 'indigo';
}

@Component({
  selector: 'app-how-analysis-works',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/25 backdrop-blur-sm"
        (click)="closeModal()"
      ></div>

      <!-- Modal shell (handles rounding) -->
      <div
        class="relative bg-white rounded-2xl shadow-md max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <!-- Scroll container -->
        <div class="max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div
            class="sticky top-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white z-10"
          >
            <h2 class="text-lg font-bold text-slate-900">
              How AI Analysis Works
            </h2>
            <button
              (click)="closeModal()"
              class="text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1"
            >
              <lucide-icon [img]="XIcon" [size]="20"></lucide-icon>
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-8">
            <!-- Intro -->
            <p class="text-slate-700 leading-relaxed">
              Our AI-powered analysis evaluates your business proposal against
              global market benchmarks. Here's exactly what happens:
            </p>

            <!-- Processing Stages -->
            <div class="space-y-4">
              @for (stage of stages; track stage.color; let i = $index) {
              <div
                class="group relative overflow-hidden rounded-2xl border transition-all duration-200"
              >
                <div
                  class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  [class]="getStageGradient(stage.color)"
                ></div>

                <div class="relative p-5 flex gap-4">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                    [class]="getIconBg(stage.color)"
                  >
                    <lucide-icon
                      [img]="stage.icon"
                      [size]="24"
                      [class]="getIconColor(stage.color)"
                    ></lucide-icon>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 mb-1">
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-xs font-bold"
                        [class]="getStageBadge(stage.color)"
                      >
                        Stage {{ i + 1 }}
                      </span>
                      <h3 class="text-base font-semibold text-slate-900">
                        {{ stage.title }}
                      </h3>
                    </div>

                    <p class="text-sm text-slate-700 mb-2 leading-relaxed">
                      {{ stage.description }}
                    </p>

                    <div class="space-y-1 text-xs text-slate-600">
                      @for (detail of stage.details; track $index) {
                      <div class="flex items-start gap-2">
                        <span class="text-slate-400 mt-1">•</span>
                        <span>{{ detail }}</span>
                      </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
              }
            </div>

            <!-- Timeline -->
            <div class="flex justify-center">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-teal-500"></div>
                <span class="text-xs font-semibold text-teal-600 uppercase">
                  Total time: 2–5 minutes
                </span>
                <div class="w-2 h-2 rounded-full bg-teal-500"></div>
              </div>
            </div>

            <!-- Key Features -->
            <div class="space-y-3">
              <h3 class="text-sm font-semibold text-slate-900 uppercase">
                What You Get
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (feature of keyFeatures; track feature.title) {
                <div
                  class="flex items-start gap-3 p-3 rounded-xl border bg-gradient-to-br from-teal-50/50 to-emerald-50/50"
                >
                  <lucide-icon
                    [img]="CheckCircleIcon"
                    [size]="18"
                    class="text-green-600 mt-0.5"
                  ></lucide-icon>
                  <div>
                    <div class="text-sm font-medium text-slate-900">
                      {{ feature.title }}
                    </div>
                    <div class="text-xs text-slate-600">
                      {{ feature.description }}
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>

            <!-- Privacy -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
              <p class="text-xs font-semibold uppercase text-slate-900">
                Data Security
              </p>
              <p class="text-xs text-slate-600 mt-1">
                Your document is analyzed securely and stored only in accordance
                with your own privacy settings. Market data comes from real-time
                public sources and industry databases.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="sticky bottom-0 px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end backdrop-blur"
          >
            <button
              (click)="closeModal()"
              class="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 active:bg-teal-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HowAnalysisWorksComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  XIcon = X;
  CheckCircleIcon = CheckCircle;

  isOpen = signal(true);

  stages: ProcessingStage[] = [
    {
      icon: Upload,
      title: 'Document Processing',
      description: 'Your PDF is securely uploaded and prepared for analysis.',
      details: [
        'File validation and security scan',
        'Text extraction from document',
        'Content structure analysis',
      ],
      color: 'teal',
    },
    {
      icon: FileText,
      title: 'Content Extraction',
      description:
        'We extract and organize key information from your document.',
      details: [
        'Business model identification',
        'Financial metrics extraction',
        'Market positioning analysis',
      ],
      color: 'blue',
    },
    {
      icon: Globe,
      title: 'Market Intelligence',
      description:
        'Real-time data gathering from global market sources and industry databases.',
      details: [
        'Current funding trends',
        'Competitor benchmarking',
        'Industry valuation metrics',
      ],
      color: 'purple',
    },
    {
      icon: Sparkles,
      title: 'AI Analysis',
      description:
        'Advanced algorithms evaluate your proposal against market benchmarks.',
      details: [
        'Investment score calculation',
        'Success probability assessment',
        'Risk factor identification',
      ],
      color: 'emerald',
    },
    {
      icon: CheckCircle,
      title: 'Insights Generation',
      description:
        'Comprehensive analysis compiled into actionable recommendations.',
      details: [
        'Strategic recommendations',
        'Strength & improvement areas',
        'Downloadable detailed report',
      ],
      color: 'indigo',
    },
  ];

  keyFeatures = [
    {
      title: 'Investment Score',
      description: 'AI-calculated investability rating',
    },
    { title: 'Success Probability', description: 'Funding success prediction' },
    { title: 'Market Intelligence', description: 'Real-time benchmarks' },
    { title: 'Risk Assessment', description: 'Comprehensive risk analysis' },
    { title: 'Strategic Recommendations', description: 'Actionable insights' },
    { title: 'Downloadable Report', description: 'Shareable document' },
  ];

  ngOnInit() {}

  closeModal() {
    this.closed.emit();
  }

  getStageGradient(color: string): string {
    return {
      teal: 'bg-gradient-to-r from-teal-50/30 to-emerald-50/30',
      blue: 'bg-gradient-to-r from-blue-50/30 to-cyan-50/30',
      purple: 'bg-gradient-to-r from-purple-50/30 to-pink-50/30',
      emerald: 'bg-gradient-to-r from-emerald-50/30 to-teal-50/30',
      indigo: 'bg-gradient-to-r from-indigo-50/30 to-blue-50/30',
    }[color]!;
  }

  getIconBg(color: string): string {
    return {
      teal: 'bg-teal-100',
      blue: 'bg-blue-100',
      purple: 'bg-purple-100',
      emerald: 'bg-emerald-100',
      indigo: 'bg-indigo-100',
    }[color]!;
  }

  getIconColor(color: string): string {
    return `text-${color}-600`;
  }

  getStageBadge(color: string): string {
    return `bg-${color}-100 text-${color}-700`;
  }
}
