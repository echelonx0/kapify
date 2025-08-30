// src/app/funder/components/ai-assistant-modal.component.ts
import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, FileSearch, Users, TrendingUp, Shield, X, Loader2, CheckCircle, AlertTriangle } from 'lucide-angular';
 
import { AIAssistantService, AIAnalysisRequest, } from './services/ai-assistant.service';
import { FundingApplication } from 'src/app/SMEs/services/application-management.service';
import { AIAnalysisResult } from 'src/app/ai/services/ai-analysis.service';
 

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
  
  ],
  template: `
 
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
       riskFactors: [],
       recommendations: [],

       generatedAt: 'new Date()',
       matchScore: 0,
       successProbability: 0,
       competitivePositioning: 'strong',
       strengths: [],
       improvementAreas: [],
       keyInsights: []
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