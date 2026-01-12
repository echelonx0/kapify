import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { LucideAngularModule, ChevronDown, FileText } from 'lucide-angular';
import { KapifyAIAnalysisComponent } from 'src/app/features/ai/ai-analysis/kapify-ai-analysis.component';
import { FunderDocumentAnalysisComponent } from 'src/app/features/ai/document-analysis/funder-document-analysis.component';

type ReviewTabId = 'evaluator' | 'analysis';

interface ReviewTab {
  id: ReviewTabId;
  label: string;
  description: string;
}

@Component({
  selector: 'app-review-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FunderDocumentAnalysisComponent,
    KapifyAIAnalysisComponent,
  ],
  template: `
    <div
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden ml-24 mr-24 mt-4"
    >
      <!-- Tab Navigation -->

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Quick Evaluator Tab -->
        @if (activeTab() === 'evaluator') {
        <div id="evaluator-panel" role="tabpanel">
          <app-funder-document-analysis></app-funder-document-analysis>
        </div>
        }

        <!-- AI Analysis Tab -->
        @if (activeTab() === 'analysis') {
        <div id="analysis-panel" role="tabpanel">
          <app-enhanced-ai-analysis
            [analysisPerspective]="'investor'"
            [analysisMode]="'profile'"
            (analysisCompleted)="handleAnalysisCompleted($event)"
          ></app-enhanced-ai-analysis>
        </div>
        }
      </div>
    </div>
  `,
  styles: [],
})
export class ReviewTabComponent implements OnInit, OnDestroy {
  // private publicProfileService = inject(PublicProfileService);
  private destroy$ = new Subject<void>();

  // State
  activeTab = signal<ReviewTabId>('evaluator');

  tabs: ReviewTab[] = [
    {
      id: 'analysis',
      label: 'Profile Analysis',
      description:
        'Using your existing business data, Profile review analyzes how prepared your business is for funding. AI evaluates critical readiness factors, highlights areas needing improvement, and provides practical recommendations to help you become funding-ready.',
    },
    {
      id: 'evaluator',
      label: 'Business Plan Evaluation Tool',
      description:
        'Upload your business plan or proposal for an AI-powered evaluation. The Quick Evaluator analyzes your content, identifies strengths and gaps, and provides clear, actionable guidance to help you refine and strengthen your plan.',
    },
  ];

  // Icons
  ChevronDownIcon = ChevronDown;
  FileTextIcon = FileText;

  ngOnInit() {
    // this.loadPreferences();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Tab Navigation
  switchTab(tabId: ReviewTabId) {
    this.activeTab.set(tabId);
    this.saveTabPreference(tabId);
  }

  isActiveTab(tabId: ReviewTabId): boolean {
    return this.activeTab() === tabId;
  }

  getActiveTabDescription(): string {
    const tab = this.tabs.find((t) => t.id === this.activeTab());
    return tab?.description || '';
  }

  private saveTabPreference(tabId: ReviewTabId) {
    localStorage.setItem('profileReviewActiveTab', tabId);
  }

  // Analysis Handlers
  handleAnalysisCompleted(analysis: any) {
    console.log('Profile analysis completed:', analysis);
    // Emit or handle analysis results if needed
  }
}
