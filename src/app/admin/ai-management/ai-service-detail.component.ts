// src/app/admin/ai-management/ai-service-detail.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import {
  AiServicesService,
  AiService,
  AiPromptVersion,
} from '../services/ai-services.service';
import { MarkdownViewerComponent } from './markdown-viewer.component';
import {
  LucideAngularModule,
  ArrowLeft,
  Sparkles,
  Settings,
  Code,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  AlertCircle,
  Edit3,
  History,
  ExternalLink,
} from 'lucide-angular';

@Component({
  selector: 'app-ai-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    MarkdownViewerComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button
                (click)="goBack()"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <lucide-icon
                  [img]="ArrowLeftIcon"
                  [size]="20"
                  class="text-slate-600"
                />
              </button>

              @if (service()) {
              <div>
                <div class="flex items-center space-x-3 mb-1">
                  <h1 class="text-2xl font-bold text-slate-900">
                    {{ service()!.displayName }}
                  </h1>

                  <!-- Status Badge -->
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    [class]="aiService.getStatusColor(service()!.isActive)"
                  >
                    {{ service()!.isActive ? 'Active' : 'Inactive' }}
                  </span>

                  <!-- Category Badge -->
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold border"
                    [class]="aiService.getCategoryColor(service()!.category)"
                  >
                    {{ service()!.category }}
                  </span>
                </div>

                <p class="text-sm text-slate-600">
                  {{ service()!.description }}
                </p>
              </div>
              }
            </div>

            @if (service()) {
            <div class="flex items-center space-x-2">
              <button
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <lucide-icon [img]="HistoryIcon" [size]="16" class="mr-2" />
                Version History
              </button>

              <button
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-xl transition-colors"
              >
                <lucide-icon [img]="Edit3Icon" [size]="16" class="mr-2" />
                Request Change
              </button>
            </div>
            }
          </div>

          <!-- Tabs -->
          <div
            class="flex items-center space-x-1 mt-6 border-b border-slate-200"
          >
            @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="px-4 py-2 text-sm font-medium transition-all relative"
              [class]="
                activeTab() === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-500'
                  : 'text-slate-600 hover:text-slate-900'
              "
            >
              {{ tab.label }}
            </button>
            }
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-8 py-8">
        @if (aiService.isLoading()) {
        <div
          class="bg-white rounded-2xl border border-slate-200 p-12 text-center"
        >
          <div
            class="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-sm text-slate-600">Loading service details...</p>
        </div>
        } @else if (aiService.error()) {
        <div class="bg-red-50 border border-red-200/50 rounded-xl p-6">
          <div class="flex items-start space-x-3">
            <lucide-icon
              [img]="AlertCircleIcon"
              [size]="20"
              class="text-red-600 flex-shrink-0"
            />
            <div>
              <h3 class="text-sm font-semibold text-red-900">
                Error Loading Service
              </h3>
              <p class="text-xs text-red-700 mt-1">{{ aiService.error() }}</p>
            </div>
          </div>
        </div>
        } @else if (service()) {
        <!-- Tab Content -->
        @if (activeTab() === 'overview') {
        <div class="space-y-6">
          <!-- Technical Details -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="SettingsIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Technical Details
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Edge Function
                </p>
                <p
                  class="text-sm text-slate-900 font-mono bg-slate-50 px-3 py-2 rounded-lg"
                >
                  {{ service()!.edgeFunctionName }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  AI Model
                </p>
                <p class="text-sm text-slate-900">{{ service()!.modelUsed }}</p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Current Version
                </p>
                <p class="text-sm text-slate-900 font-mono">
                  {{ service()!.currentVersion }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Status
                </p>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-2 h-2 rounded-full"
                    [class]="
                      service()!.isActive ? 'bg-green-500' : 'bg-red-500'
                    "
                  ></div>
                  <span class="text-sm text-slate-900">
                    {{ service()!.isProduction ? 'Production' : 'Development' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="ZapIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Features & Capabilities
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Grounding -->
              <div
                class="flex items-start space-x-3 p-4 rounded-xl"
                [class]="
                  service()!.usesGrounding
                    ? 'bg-blue-50 border border-blue-200/50'
                    : 'bg-slate-50 border border-slate-200'
                "
              >
                <lucide-icon
                  [img]="
                    service()!.usesGrounding ? CheckCircleIcon : XCircleIcon
                  "
                  [size]="20"
                  [class]="
                    service()!.usesGrounding
                      ? 'text-blue-600'
                      : 'text-slate-400'
                  "
                />
                <div>
                  <h3
                    class="text-sm font-semibold"
                    [class]="
                      service()!.usesGrounding
                        ? 'text-blue-900'
                        : 'text-slate-600'
                    "
                  >
                    Real-time Web Grounding
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [class]="
                      service()!.usesGrounding
                        ? 'text-blue-700'
                        : 'text-slate-500'
                    "
                  >
                    {{
                      service()!.usesGrounding
                        ? 'Uses Google Search to fetch current web data and real-time information'
                        : 'Analyzes provided data without external web searches'
                    }}
                  </p>
                </div>
              </div>

              <!-- Dual Mode -->
              <div
                class="flex items-start space-x-3 p-4 rounded-xl"
                [class]="
                  service()!.hasDualMode
                    ? 'bg-purple-50 border border-purple-200/50'
                    : 'bg-slate-50 border border-slate-200'
                "
              >
                <lucide-icon
                  [img]="service()!.hasDualMode ? CheckCircleIcon : XCircleIcon"
                  [size]="20"
                  [class]="
                    service()!.hasDualMode
                      ? 'text-purple-600'
                      : 'text-slate-400'
                  "
                />
                <div>
                  <h3
                    class="text-sm font-semibold"
                    [class]="
                      service()!.hasDualMode
                        ? 'text-purple-900'
                        : 'text-slate-600'
                    "
                  >
                    Dual Analysis Mode
                  </h3>
                  <p
                    class="text-xs mt-1"
                    [class]="
                      service()!.hasDualMode
                        ? 'text-purple-700'
                        : 'text-slate-500'
                    "
                  >
                    {{
                      service()!.hasDualMode
                        ? 'Supports both Investor perspective (evaluation) and SME perspective (application guidance)'
                        : 'Single analysis mode optimized for specific use case'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Purpose & Use Cases -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="FileTextIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Purpose & Use Cases
            </h2>

            @if (service()!.promptSummary) {
            <div class="mb-6">
              <h3 class="text-sm font-semibold text-slate-900 mb-2">
                Service Purpose
              </h3>
              <p class="text-sm text-slate-700 leading-relaxed">
                {{ service()!.promptSummary }}
              </p>
            </div>
            }

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-3">
                  Primary Use Cases
                </h3>
                <ul class="space-y-2">
                  @for (useCase of getUseCases(service()!); track $index) {
                  <li class="flex items-start space-x-2 text-sm text-slate-700">
                    <lucide-icon
                      [img]="CheckCircleIcon"
                      [size]="16"
                      class="text-teal-500 flex-shrink-0 mt-0.5"
                    />
                    <span>{{ useCase }}</span>
                  </li>
                  }
                </ul>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-3">
                  Key Benefits
                </h3>
                <ul class="space-y-2">
                  @for (benefit of getBenefits(service()!); track $index) {
                  <li class="flex items-start space-x-2 text-sm text-slate-700">
                    <lucide-icon
                      [img]="ZapIcon"
                      [size]="16"
                      class="text-amber-500 flex-shrink-0 mt-0.5"
                    />
                    <span>{{ benefit }}</span>
                  </li>
                  }
                </ul>
              </div>
            </div>
          </div>

          <!-- Usage Stats -->
          @if (service()!.totalCalls > 0 || service()!.avgResponseTimeMs) {
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="ActivityIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Usage Statistics
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Total Calls
                </p>
                <p class="text-2xl font-bold text-slate-900">
                  {{ service()!.totalCalls.toLocaleString() }}
                </p>
              </div>

              @if (service()!.avgResponseTimeMs) {
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Avg Response Time
                </p>
                <p class="text-2xl font-bold text-slate-900">
                  {{ service()!.avgResponseTimeMs }}ms
                </p>
              </div>
              } @if (service()!.lastCalledAt) {
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Last Called
                </p>
                <p class="text-sm text-slate-900">
                  {{ formatDate(service()!.lastCalledAt!) }}
                </p>
              </div>
              }
            </div>
          </div>
          }
        </div>
        } @if (activeTab() === 'prompt') {
        <div class="space-y-6">
          <!-- Prompt Strategy -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="SparklesIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Prompt Strategy
            </h2>

            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-2">
                  Role Definition
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  {{ getPromptRole(service()!) }}
                </p>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-2">
                  Analysis Approach
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  {{ getPromptApproach(service()!) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Model Configuration -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="SettingsIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Model Configuration
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Model
                </p>
                <p class="text-sm text-slate-900">{{ service()!.modelUsed }}</p>
                <p class="text-xs text-slate-500 mt-1">
                  Fast response with good quality
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Temperature
                </p>
                <p class="text-sm text-slate-900">
                  {{ getTemperature(service()!) }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  {{ getTemperatureExplanation(service()!) }}
                </p>
              </div>

              <div>
                <p
                  class="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"
                >
                  Max Tokens
                </p>
                <p class="text-sm text-slate-900">
                  {{ getMaxTokens(service()!) }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  Sufficient for detailed analysis
                </p>
              </div>
            </div>
          </div>

          <!-- Input/Output -->
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h2
              class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
            >
              <lucide-icon
                [img]="FileTextIcon"
                [size]="20"
                class="mr-2 text-teal-500"
              />
              Input & Output Structure
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-3">
                  Input Parameters
                </h3>
                <div class="bg-slate-50 rounded-lg p-4 font-mono text-xs">
                  <pre class="text-slate-700">{{
                    getInputStructure(service()!)
                  }}</pre>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-slate-900 mb-3">
                  Output Format
                </h3>
                <div class="bg-slate-50 rounded-lg p-4 font-mono text-xs">
                  <pre class="text-slate-700">{{
                    getOutputStructure(service()!)
                  }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        } @if (activeTab() === 'logic') {
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2
            class="text-lg font-semibold text-slate-900 mb-4 flex items-center"
          >
            <lucide-icon
              [img]="CodeIcon"
              [size]="20"
              class="mr-2 text-teal-500"
            />
            High-Level Logic Flow
          </h2>

          <p class="text-sm text-slate-600 mb-6">
            This shows the step-by-step process of how
            {{ service()!.displayName }} works.
          </p>

          <div class="space-y-3">
            @for (step of getLogicSteps(service()!); track $index) {
            <div
              class="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all"
            >
              <div
                class="w-8 h-8 bg-teal-100 text-teal-700 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0"
              >
                {{ $index + 1 }}
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-slate-900 mb-1">
                  {{ step.title }}
                </h3>
                <p class="text-sm text-slate-700 leading-relaxed">
                  {{ step.description }}
                </p>
                @if (step.technical) {
                <div
                  class="mt-2 bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-600"
                >
                  {{ step.technical }}
                </div>
                }
              </div>
            </div>
            }
          </div>
        </div>
        } @if (activeTab() === 'documentation') {
        <div class="space-y-6">
          <!-- Markdown Viewer -->
          @if (service()!.promptFilePath) {
          <app-markdown-viewer
            [filePath]="service()!.promptFilePath"
            [showToc]="true"
          />
          } @else {
          <div class="bg-amber-50 border border-amber-200/50 rounded-xl p-6">
            <div class="flex items-start space-x-3">
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="20"
                class="text-amber-600 flex-shrink-0"
              />
              <div>
                <h3 class="text-sm font-semibold text-amber-900">
                  No Documentation Available
                </h3>
                <p class="text-xs text-amber-700 mt-1">
                  Documentation file path not configured for this service.
                </p>
              </div>
            </div>
          </div>
          }
        </div>
        } }
      </div>
    </div>
  `,
})
export class AiServiceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  aiService = inject(AiServicesService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  SparklesIcon = Sparkles;
  SettingsIcon = Settings;
  CodeIcon = Code;
  FileTextIcon = FileText;
  ActivityIcon = Activity;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  ClockIcon = Clock;
  ZapIcon = Zap;
  AlertCircleIcon = AlertCircle;
  Edit3Icon = Edit3;
  HistoryIcon = History;
  ExternalLinkIcon = ExternalLink;

  // State
  service = signal<AiService | null>(null);
  activeTab = signal<'overview' | 'prompt' | 'logic' | 'documentation'>(
    'overview'
  );

  tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'prompt' as const, label: 'Prompt Details' },
    { id: 'logic' as const, label: 'Logic Flow' },
    { id: 'documentation' as const, label: 'Documentation' },
  ];

  ngOnInit() {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadService(serviceId);
    }
  }

  private loadService(serviceId: string) {
    this.aiService.getServiceById(serviceId).subscribe({
      next: (service) => {
        this.service.set(service);
      },
      error: (error) => {
        console.error('Failed to load service:', error);
      },
    });
  }

  goBack() {
    this.router.navigate(['/administrator/ai-management']);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // ============================================================================
  // CONTENT HELPERS - Extract info based on service type
  // ============================================================================

  getUseCases(service: AiService): string[] {
    const useCases: Record<string, string[]> = {
      'market-intelligence': [
        'Due diligence for investment decisions',
        'Market timing assessment',
        'Competitive landscape analysis',
        'Risk identification and mitigation planning',
      ],
      'analyze-market-position': [
        'Competitive positioning evaluation',
        'Investment viability assessment (Investor mode)',
        'Application preparation guidance (SME mode)',
        'Market opportunity sizing',
      ],
      'analyze-risk-profile': [
        'Comprehensive risk assessment',
        'Investment risk evaluation (Investor mode)',
        'Application readiness check (SME mode)',
        'Mitigation strategy development',
      ],
    };

    return (
      useCases[service.serviceName] || [
        'Business analysis',
        'Decision support',
        'Strategic planning',
      ]
    );
  }

  getBenefits(service: AiService): string[] {
    const benefits: Record<string, string[]> = {
      'market-intelligence': [
        'Real-time, current market data',
        'Comprehensive multi-dimensional analysis',
        'Actionable timing recommendations',
        'Source attribution for verification',
      ],
      'analyze-market-position': [
        'Dual perspective analysis',
        'Quantitative scoring metrics',
        'Strategic recommendations',
        'Competitive advantage identification',
      ],
      'analyze-risk-profile': [
        'Multi-dimensional risk coverage',
        'Proactive concern identification',
        'Specific mitigation strategies',
        'Preparation action plans',
      ],
    };

    return (
      benefits[service.serviceName] || [
        'Data-driven insights',
        'Comprehensive analysis',
        'Actionable recommendations',
      ]
    );
  }

  getPromptRole(service: AiService): string {
    const roles: Record<string, string> = {
      'market-intelligence':
        'Acts as a market intelligence analyst with access to real-time web data and financial expertise.',
      'analyze-market-position':
        'Acts as a market strategy analyst specializing in competitive positioning (Investor mode) or as a business consultant helping SMEs prepare funding applications (SME mode).',
      'analyze-risk-profile':
        'Acts as a risk management expert for investment decisions (Investor mode) or as a business consultant preparing SMEs for funding scrutiny (SME mode).',
    };

    return (
      roles[service.serviceName] ||
      'AI assistant specialized in business analysis and strategic insights.'
    );
  }

  getPromptApproach(service: AiService): string {
    const approaches: Record<string, string> = {
      'market-intelligence':
        'Uses web grounding to search for recent funding rounds, market data, competitor news, and regulatory changes. Focuses on the last 6 months of activity and prioritizes authoritative sources like financial news and industry reports.',
      'analyze-market-position':
        'Analyzes provided business data and market intelligence to assess competitive strength, market opportunity, and strategic positioning. In dual mode, adapts analysis perspective between investor evaluation and SME application guidance.',
      'analyze-risk-profile':
        'Performs holistic risk assessment across financial, market, operational, management, and regulatory dimensions. In dual mode, evaluates either investment risk or application readiness depending on the intended perspective.',
    };

    return (
      approaches[service.serviceName] ||
      'Analyzes provided data using structured frameworks and generates insights with actionable recommendations.'
    );
  }

  getTemperature(service: AiService): string {
    const temps: Record<string, string> = {
      'market-intelligence': '0.2',
      'analyze-market-position': '0.3',
      'analyze-risk-profile': '0.2',
    };
    return temps[service.serviceName] || '0.2';
  }

  getTemperatureExplanation(service: AiService): string {
    const temp = this.getTemperature(service);
    if (temp === '0.2') {
      return 'Low temperature for factual, consistent analysis';
    }
    return 'Balanced between factual and analytical';
  }

  getMaxTokens(service: AiService): string {
    const tokens: Record<string, string> = {
      'market-intelligence': '4096',
      'analyze-market-position': '3072',
      'analyze-risk-profile': '3072',
    };
    return tokens[service.serviceName] || '3072';
  }

  getInputStructure(service: AiService): string {
    const inputs: Record<string, string> = {
      'market-intelligence': `{
  industry: string,
  sector?: string,
  cacheKey?: string,
  maxAgeHours?: number
}`,
      'analyze-market-position': `{
  analysisType: "market_position",
  businessData: object,
  marketIntelligence: object,
  industry: string,
  analysisMode?: "investor" | "sme"
}`,
      'analyze-risk-profile': `{
  analysisType: "comprehensive_risk",
  profileData: object,
  industry: string,
  analysisMode?: "investor" | "sme"
}`,
    };

    return inputs[service.serviceName] || '{ /* Input structure */ }';
  }

  getOutputStructure(service: AiService): string {
    const outputs: Record<string, string> = {
      'market-intelligence': `{
  trends: string[],
  fundingTrends: object,
  riskFactors: array,
  opportunities: array,
  sources: array,
  confidence: number
}`,
      'analyze-market-position': `{
  competitiveStrength: string,
  marketOpportunity: string,
  differentiationScore: number,
  opportunities: array,
  recommendations: string[]
}`,
      'analyze-risk-profile': `{
  overallRiskScore: number,
  riskCategories: object,
  criticalRisks: array,
  mitigationStrategies: string[],
  confidence: number
}`,
    };

    return outputs[service.serviceName] || '{ /* Output structure */ }';
  }

  getLogicSteps(
    service: AiService
  ): Array<{ title: string; description: string; technical?: string }> {
    const steps: Record<
      string,
      Array<{ title: string; description: string; technical?: string }>
    > = {
      'market-intelligence': [
        {
          title: 'Authentication',
          description:
            'Validates user session via Supabase Auth and checks JWT token.',
          technical:
            'const { data: { user } } = await supabaseClient.auth.getUser();',
        },
        {
          title: 'Input Validation',
          description:
            'Checks that industry parameter is provided and validates format.',
        },
        {
          title: 'Cache Check',
          description:
            'Queries cache table for existing intelligence data within maxAge threshold.',
          technical:
            'SELECT * FROM market_intelligence_cache WHERE cache_key = ? AND expires_at > NOW()',
        },
        {
          title: 'Web Search & Grounding',
          description:
            'If cache miss, configures Gemini with grounding tools to search for recent market data, funding news, and competitor activities.',
          technical: 'tools: [{ googleSearch: {} }, { urlContext: {} }]',
        },
        {
          title: 'Response Processing',
          description:
            'Parses JSON response, validates structure, extracts grounding metadata, and calculates confidence score based on source quality.',
        },
        {
          title: 'Cache Storage',
          description:
            'Stores intelligence data with expiration time for future requests.',
        },
        {
          title: 'Return Results',
          description:
            'Returns structured intelligence with trends, funding data, sources, and confidence score.',
        },
      ],
      'analyze-market-position': [
        {
          title: 'Authentication & Validation',
          description:
            'Validates user and checks that analysisType matches "market_position".',
        },
        {
          title: 'Mode Detection',
          description:
            'Determines analysis mode (investor or SME) from parameters, defaults to investor.',
        },
        {
          title: 'Data Analysis',
          description:
            'Extracts key indicators like value proposition, target markets, competitive position from business data.',
        },
        {
          title: 'Prompt Construction',
          description:
            'Builds mode-specific prompt with appropriate analysis framework and instructions.',
        },
        {
          title: 'AI Analysis',
          description:
            'Executes Gemini generation with temperature 0.3 for balanced analytical output.',
        },
        {
          title: 'Response Validation',
          description:
            'Validates all required fields, score ranges, and enum values in response.',
        },
        {
          title: 'Return Analysis',
          description:
            'Returns structured analysis with competitive assessment, opportunities, and recommendations.',
        },
      ],
      'analyze-risk-profile': [
        {
          title: 'Authentication & Validation',
          description:
            'Validates user and checks that analysisType matches "comprehensive_risk".',
        },
        {
          title: 'Mode Detection',
          description:
            'Determines if running in investor risk evaluation or SME readiness assessment mode.',
        },
        {
          title: 'Data Extraction',
          description:
            'Extracts financial metrics, management structure, and business assessment data.',
        },
        {
          title: 'Risk Calculation',
          description:
            'Analyzes metrics across five dimensions: financial, market, operational, management, regulatory.',
        },
        {
          title: 'AI Risk Assessment',
          description:
            'Executes Gemini with temperature 0.2 for consistent, factual risk evaluation.',
        },
        {
          title: 'Response Validation',
          description:
            'Validates risk scores, categories, and ensures all dimensions are covered.',
        },
        {
          title: 'Return Assessment',
          description:
            'Returns risk profile with scores, critical risks, and mitigation strategies.',
        },
      ],
    };

    return (
      steps[service.serviceName] || [
        {
          title: 'Process Input',
          description: 'Validates and processes input parameters.',
        },
        {
          title: 'Analyze Data',
          description: 'Performs analysis using AI model.',
        },
        {
          title: 'Return Results',
          description: 'Returns structured analysis results.',
        },
      ]
    );
  }

  getDocumentationSections(): string[] {
    return [
      'Purpose & Features',
      'Input Parameters',
      'Output Structure',
      'High-Level Logic Flow',
      'Prompt Strategy',
      'Configuration Details',
      'Use Cases (Investor & SME)',
      'Error Handling',
      'Performance Notes',
      'Maintenance Guidelines',
    ];
  }
}
