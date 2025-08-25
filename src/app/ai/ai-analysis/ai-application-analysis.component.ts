// src/app/applications/components/ai-analysis/ai-application-analysis.component.ts
import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2, Target, Award, Shield } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { FundingOpportunity } from '../../shared/models/funder.models';
 
interface AIAnalysisResult {
  matchScore: number;
  strengths: string[];
  improvementAreas: string[];
  successProbability: number;
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  keyInsights: string[];
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  generatedAt: Date;
}

interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

@Component({
  selector: 'app-ai-application-analysis',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  templateUrl: './ai-application-analysis.component.html'
})
export class AIApplicationAnalysisComponent {
  @Input() opportunity: FundingOpportunity | null = null;
  @Input() applicationData: CoverInformation | null = null;
  @Input() isSubmitted = false;
  
  @Output() analysisCompleted = new EventEmitter<AIAnalysisResult>();
  @Output() improvementRequested = new EventEmitter<void>();
  @Output() proceedRequested = new EventEmitter<void>();

  // Icons
  BotIcon = Bot;
  SparklesIcon = Sparkles;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  Loader2Icon = Loader2;
  TargetIcon = Target;
  AwardIcon = Award;
  ShieldIcon = Shield;

  // State
  isAnalyzing = signal(false);
  analysisResult = signal<AIAnalysisResult | null>(null);
  analysisProgress = signal(0);
  currentAnalysisStep = signal('');

  // Computed properties
  canAnalyze = computed(() => {
    if (!this.opportunity || !this.applicationData) return false;
    
    const data = this.applicationData;
    return !!(data.requestedAmount && data.purposeStatement && data.useOfFunds);
  });

  async startAnalysis() {
    if (!this.canAnalyze()) return;

    this.isAnalyzing.set(true);
    this.analysisProgress.set(0);
    this.analysisResult.set(null);

    try {
      // Simulate progressive analysis steps
      await this.runAnalysisSteps();
      
      // Generate analysis results
      const result = await this.generateAnalysisResults();
      
      this.analysisResult.set(result);
      this.analysisCompleted.emit(result);
      
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      this.isAnalyzing.set(false);
    }
  }

  private async runAnalysisSteps() {
    const steps = [
      { progress: 20, step: 'Analyzing application completeness...' },
      { progress: 40, step: 'Matching against opportunity criteria...' },
      { progress: 60, step: 'Evaluating financial requirements...' },
      { progress: 80, step: 'Assessing success probability...' },
      { progress: 100, step: 'Generating insights and recommendations...' }
    ];

    for (const { progress, step } of steps) {
      this.currentAnalysisStep.set(step);
      this.analysisProgress.set(progress);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  private async generateAnalysisResults(): Promise<AIAnalysisResult> {
    const opportunity = this.opportunity!;
    const application = this.applicationData!;
    
    const requestedAmount = parseFloat(application.requestedAmount);
    const isAmountAppropriate = requestedAmount >= opportunity.minInvestment && 
                               requestedAmount <= opportunity.maxInvestment;
    
    // Calculate match score based on various factors
    let matchScore = 60; // Base score
    
    if (isAmountAppropriate) matchScore += 15;
    if (application.purposeStatement.length > 100) matchScore += 10;
    if (application.useOfFunds.length > 100) matchScore += 10;
    if (application.opportunityAlignment.length > 50) matchScore += 5;
    
    // Add some randomness for demonstration
    matchScore = Math.min(95, matchScore + Math.random() * 10);

    return {
      matchScore: Math.round(matchScore),
      successProbability: Math.round(matchScore * 0.8 + Math.random() * 20),
      competitivePositioning: matchScore >= 80 ? 'strong' : matchScore >= 60 ? 'moderate' : 'weak',
      
      strengths: [
        'Clear funding purpose and business case',
        'Appropriate funding amount for opportunity',
        'Well-structured use of funds breakdown',
        'Strong alignment with opportunity criteria'
      ].slice(0, Math.floor(matchScore / 25) + 1),
      
      improvementAreas: [
        'Provide more detailed financial projections',
        'Include market analysis and competitive landscape',
        'Expand on risk mitigation strategies',
        'Add timeline milestones and key metrics'
      ].slice(0, Math.floor((100 - matchScore) / 20) + 1),
      
      recommendations: [
        'Consider adding more specific financial projections',
        'Include letters of intent or customer commitments',
        'Provide detailed implementation timeline',
        'Add risk assessment and mitigation plans'
      ],
      
      riskFactors: matchScore < 70 ? [
        {
          factor: 'Limited financial detail',
          severity: 'medium' as const,
          impact: 'May require additional financial documentation'
        }
      ] : [],
      
      keyInsights: [
        'Application shows strong potential for approval',
        'Funding amount is well-justified for stated purpose',
        'Business case aligns with funder priorities'
      ],
      
      generatedAt: new Date()
    };
  }

  refreshAnalysis() {
    this.startAnalysis();
  }

  improveApplication() {
    this.improvementRequested.emit();
  }

  proceedWithApplication() {
    this.proceedRequested.emit();
  }

  // UI Helper Methods
  getScoreBarClass(score: number): string {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getCompetitivePositioningClass(position: string): string {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (position) {
      case 'strong': return `${baseClass} bg-green-100 text-green-800`;
      case 'moderate': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'weak': return `${baseClass} bg-red-100 text-red-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getRiskSeverityClass(severity: string): string {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(date: Date): string {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(Math.floor((date.getTime() - Date.now()) / 60000), 'minute');
  }
}