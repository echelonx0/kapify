// src/app/funder/components/ai-assistant-modal.component.ts
import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, FileSearch, Users, TrendingUp, Shield, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import { AIAssistantService, AIAnalysisRequest, AIAnalysisResult } from '../../shared/services/ai-assistant.service';
import { FundingApplication } from 'src/app/SMEs/services/application-management.service';
 

interface AIAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: 'application_review' | 'background_check' | 'market_research' | 'risk_assessment';
  estimatedTime: string;
  available: boolean;
}

@Component({
  selector: 'app-ai-assistant-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="closeModal()"></div>
      
      <!-- Modal -->
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-neutral-200">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="BotIcon" [size]="24" class="text-white" />
              </div>
              <div>
                <h2 class="text-xl font-semibold text-neutral-900">AI Assistant</h2>
                <p class="text-sm text-neutral-600">Powered by advanced AI analysis</p>
              </div>
            </div>
            <button (click)="closeModal()" class="text-neutral-400 hover:text-neutral-600">
              <lucide-icon [img]="XIcon" [size]="24" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6">
            @if (!selectedAction && !analysisResult()) {
              <!-- Action Selection View -->
              <div>
                <h3 class="text-lg font-medium text-neutral-900 mb-2">Choose an Analysis</h3>
                <p class="text-neutral-600 mb-6">Select the type of AI-powered analysis you'd like to perform on this application:</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (action of availableActions; track action.id) {
                    <button
                      (click)="selectAction(action)"
                      [disabled]="!action.available"
                      class="p-4 border border-neutral-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                      [class]="action.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
                    >
                      <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <lucide-icon [img]="action.icon" [size]="20" class="text-blue-600" />
                        </div>
                        <div class="flex-1">
                          <h4 class="font-medium text-neutral-900 mb-1">{{ action.title }}</h4>
                          <p class="text-sm text-neutral-600 mb-2">{{ action.description }}</p>
                          <div class="flex items-center space-x-2 text-xs text-neutral-500">
                            <span>⏱️ {{ action.estimatedTime }}</span>
                            @if (!action.available) {
                              <span class="text-amber-600">• Coming Soon</span>
                            }
                          </div>
                        </div>
                      </div>
                    </button>
                  }
                </div>
              </div>
            } @else if (selectedAction && !analysisResult() && !isProcessing) {
              <!-- Confirmation View -->
              <div class="text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <lucide-icon [img]="selectedAction.icon" [size]="32" class="text-blue-600" />
                </div>
                <h3 class="text-lg font-medium text-neutral-900 mb-2">{{ selectedAction.title }}</h3>
                <p class="text-neutral-600 mb-6 max-w-lg mx-auto">
                  {{ selectedAction.description }}
                </p>
                
                <div class="bg-neutral-50 rounded-lg p-4 mb-6">
                  <h4 class="text-sm font-medium text-neutral-900 mb-2">Application Details</h4>
                  <div class="text-sm text-neutral-600">
                    <p><strong>Title:</strong> {{ application?.title }}</p>
                    <p><strong>Applicant:</strong> {{ application?.applicant?.firstName }} {{ application?.applicant?.lastName }}</p>
                    <p><strong>Company:</strong> {{ application?.applicant?.companyName || 'N/A' }}</p>
                    <p><strong>Status:</strong> {{ application?.status | titlecase }}</p>
                  </div>
                </div>

                <div class="flex justify-center space-x-3">
                  <ui-button variant="outline" (clicked)="goBack()">
                    Back
                  </ui-button>
                  <ui-button variant="primary" (clicked)="startAnalysis()">
                    Start {{ selectedAction.title }}
                  </ui-button>
                </div>
              </div>
            } @else if (isProcessing) {
              <!-- Processing View -->
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <lucide-icon [img]="Loader2Icon" [size]="32" class="text-blue-600 animate-spin" />
                </div>
                <h3 class="text-lg font-medium text-neutral-900 mb-2">Analysis in Progress</h3>
                <p class="text-neutral-600 mb-4">
                  Our AI is Analysing...
                </p>
                <div class="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-600">
                  <p>⏱️ Estimated time: {{ selectedAction?.estimatedTime || '2-3 minutes' }}</p>
                  <p class="mt-2">Please wait while we process the analysis...</p>
                </div>
              </div>
            } @else if (analysisResult()) {
              <!-- Results View -->
              <div class="max-h-[60vh] overflow-y-auto">
                <div class="flex items-center space-x-3 mb-4">
                  <lucide-icon [img]="CheckCircleIcon" [size]="24" class="text-green-500" />
                  <h3 class="text-lg font-medium text-neutral-900">{{ analysisResult()?.analysisType }}</h3>
                  <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {{ analysisResult()?.confidence }}% confidence
                  </span>
                </div>

                <!-- Summary -->
                <div class="mb-6">
                  <h4 class="font-medium text-neutral-900 mb-2">Summary</h4>
                  <p class="text-neutral-700 bg-neutral-50 rounded-lg p-3">{{ analysisResult()?.summary }}</p>
                </div>

                <!-- Key Findings -->
                @if (analysisResult()?.keyFindings?.length) {
                  <div class="mb-6">
                    <h4 class="font-medium text-neutral-900 mb-2">Key Findings</h4>
                    <ul class="space-y-2">
                      @for (finding of analysisResult()!.keyFindings; track finding) {
                        <li class="flex items-start space-x-2 text-sm">
                          <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-500 mt-0.5" />
                          <span class="text-neutral-700">{{ finding }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }

                <!-- Risk Factors -->
                @if (analysisResult()?.riskFactors?.length) {
                  <div class="mb-6">
                    <h4 class="font-medium text-neutral-900 mb-2">Risk Factors</h4>
                    <div class="space-y-3">
                      @for (risk of analysisResult()!.riskFactors; track risk.factor) {
                        <div class="border rounded-lg p-3" 
                             [class]="getRiskBorderClass(risk.severity)">
                          <div class="flex items-start space-x-2">
                            <lucide-icon [img]="AlertTriangleIcon" [size]="16" 
                                       [class]="getRiskIconClass(risk.severity)" />
                            <div>
                              <div class="flex items-center space-x-2">
                                <span class="font-medium text-neutral-900">{{ risk.factor }}</span>
                                <span class="px-2 py-1 rounded-full text-xs font-medium"
                                      [class]="getRiskBadgeClass(risk.severity)">
                                  {{ risk.severity | titlecase }}
                                </span>
                              </div>
                              <p class="text-sm text-neutral-600 mt-1">{{ risk.description }}</p>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Recommendations -->
                @if (analysisResult()?.recommendations?.length) {
                  <div class="mb-6">
                    <h4 class="font-medium text-neutral-900 mb-2">Recommendations</h4>
                    <ul class="space-y-2">
                      @for (recommendation of analysisResult()!.recommendations; track recommendation) {
                        <li class="flex items-start space-x-2 text-sm">
                          <span class="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                          <span class="text-neutral-700">{{ recommendation }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                }

                <!-- Sources -->
                @if (analysisResult()?.sources?.length) {
                  <div class="text-xs text-neutral-500 border-t pt-3">
                    <span>Sources: {{ analysisResult()!.sources!.join(', ') }}</span>
                    <span class="ml-4">Generated: {{ formatDate(analysisResult()!.generatedAt) }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex justify-end space-x-3 p-6 border-t border-neutral-200 bg-neutral-50">
            @if (analysisResult()) {
              <ui-button variant="outline" (clicked)="startNewAnalysis()">
                New Analysis
              </ui-button>
              <ui-button variant="primary" (clicked)="closeModal()">
                Done
              </ui-button>
            } @else if (!isProcessing) {
              <ui-button variant="outline" (clicked)="closeModal()">
                Cancel
              </ui-button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class AIAssistantModalComponent {
  @Input() application: FundingApplication | null = null;
  @Input() isOpen = false;
  @Output() closeRequested = new EventEmitter<void>();

  private aiService = inject(AIAssistantService);

  // Icons
  BotIcon = Bot;
  FileSearchIcon = FileSearch;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  XIcon = X;
  Loader2Icon = Loader2;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;

  // Component state
  selectedAction: AIAction | null = null;
  analysisResult = signal<AIAnalysisResult | null>(null);
  isProcessing = false;

  availableActions: AIAction[] = [
    {
      id: 'application_review',
      title: 'Application Review',
      description: 'Comprehensive AI analysis of the application documents, financial projections, and business model.',
      icon: this.FileSearchIcon,
      type: 'application_review',
      estimatedTime: '2-3 minutes',
      available: true
    },
    {
      id: 'background_check',
      title: 'Background Check',
      description: 'Verify founder credentials, check credit history, and analyze professional backgrounds.',
      icon: this.UsersIcon,
      type: 'background_check',
      estimatedTime: '3-4 minutes',
      available: true
    },
    {
      id: 'market_research',
      title: 'Market Research',
      description: 'Live market data analysis, competitive landscape assessment, and growth opportunity evaluation.',
      icon: this.TrendingUpIcon,
      type: 'market_research',
      estimatedTime: '4-5 minutes',
      available: true
    },
    {
      id: 'risk_assessment',
      title: 'Risk Assessment',
      description: 'Comprehensive risk analysis including financial, operational, and market risks.',
      icon: this.ShieldIcon,
      type: 'risk_assessment',
      estimatedTime: '2-3 minutes',
      available: true
    }
  ];

  selectAction(action: AIAction) {
    if (!action.available) return;
    this.selectedAction = action;
  }

  goBack() {
    this.selectedAction = null;
  }

  startNewAnalysis() {
    this.selectedAction = null;
    this.analysisResult.set(null);
    this.isProcessing = false;
  }

  async startAnalysis() {
    if (!this.selectedAction || !this.application) return;

    this.isProcessing = true;

    const request: AIAnalysisRequest = {
      type: this.selectedAction.type,
      applicationId: this.application.id,
      context: {
        applicantProfile: this.application.applicant,
        applicationData: this.application.formData,
        opportunityData: this.application.opportunity,
        additionalData: {
          status: this.application.status,
          stage: this.application.stage,
          submittedAt: this.application.submittedAt,
          reviewNotes: this.application.reviewNotes
        }
      }
    };

    try {
      let result: AIAnalysisResult;

      // switch (this.selectedAction.type) {
      //   case 'application_review':
      //     result = await this.aiService.reviewApplication(request).toPromise();
      //     break;
      //   case 'background_check':
      //     result = await this.aiService.performBackgroundCheck(request).toPromise();
      //     break;
      //   case 'market_research':
      //     result = await this.aiService.conductMarketResearch(request).toPromise();
      //     break;
      //   case 'risk_assessment':
      //     result = await this.aiService.assessRisk(request).toPromise();
      //     break;
      //   default:
      //     throw new Error('Unknown analysis type');
      // }
     let demoresult: AIAnalysisResult = {
       analysisType: '',
       summary: '',
       keyFindings: [],
       riskFactors: [],
       recommendations: [],
       confidence: 0,
       generatedAt: new Date(),
       sources: []
     }

      this.analysisResult.set(demoresult);
    } catch (error) {
      console.error('Error performing AI analysis:', error);
      // Handle error - could show error message
    } finally {
      this.isProcessing = false;
    }
  }

  closeModal() {
    this.closeRequested.emit();
    this.resetModal();
  }

  private resetModal() {
    this.selectedAction = null;
    this.analysisResult.set(null);
    this.isProcessing = false;
  }

  // Helper methods for styling
  getRiskBorderClass(severity: string): string {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-amber-200 bg-amber-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-neutral-200';
    }
  }

  getRiskIconClass(severity: string): string {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-green-500';
      default: return 'text-neutral-500';
    }
  }

  getRiskBadgeClass(severity: string): string {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}