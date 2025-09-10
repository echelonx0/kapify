// src/app/ai/ai-analysis/enhanced-ai-analysis.component.ts (Updated for SME + Investor modes)

import { Component, Input, Output, EventEmitter, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2, Target, Award, Shield, RefreshCw, XCircle, Mail, Clock, FileText, Users, DollarSign } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { UiButtonComponent } from 'src/app/shared/components';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { ModularAIAnalysisService, ComprehensiveAnalysis } from '../services/modular-ai-analysis.service';
import { BusinessRulesAnalysisService, BusinessRulesResult } from '../services/business-rules.service';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';

export interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

@Component({
  selector: 'app-enhanced-ai-analysis',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
  ],
  templateUrl: './enhanced-ai-analysis.component.html'
})
export class EnhancedAIAnalysisComponent implements OnDestroy {

  @Input() opportunity: FundingOpportunity | null = null;
  @Input() applicationData: CoverInformation | null = null;
  @Input() applicationId: string | null = null;  
  @Input() businessProfile?: FundingApplicationProfile; 
  @Input() isSubmitted = false;
  
  // Analysis mode: 'profile' for standalone, 'opportunity' for opportunity-specific
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  
  // NEW: Analysis perspective - who is viewing the analysis
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  
  @Output() analysisCompleted = new EventEmitter<ComprehensiveAnalysis>();
  @Output() improvementRequested = new EventEmitter<void>();
  @Output() proceedRequested = new EventEmitter<void>();

  // Services - Updated to use ModularAIAnalysisService
  private backendService = inject(FundingProfileBackendService);
  private businessRulesService = inject(BusinessRulesAnalysisService);
  private modularAIService = inject(ModularAIAnalysisService);
  private destroy$ = new Subject<void>();

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
  RefreshCwIcon = RefreshCw;
  XCircleIcon = XCircle;
  MailIcon = Mail;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;

  // State
  private loadedProfile = signal<FundingApplicationProfile | null>(null);
  businessRulesResult = signal<BusinessRulesResult | null>(null);
  
  // Updated for comprehensive analysis
  comprehensiveAnalysis = signal<ComprehensiveAnalysis | null>(null);
  isAnalyzing = signal(false);
  isLoadingProfile = signal(false);
  analysisError = signal<string | null>(null);
  
  // Analysis progress tracking
  analysisProgress = signal(0);
  currentAnalysisStage = signal<string>('');

  // Computed properties
  private currentProfile = computed(() => this.businessProfile || this.loadedProfile());
  
  canAnalyze = computed(() => {
    const profile = this.currentProfile();
    if (!profile) return false;
    
    if (this.analysisMode === 'opportunity') {
      if (!this.opportunity || !this.applicationData) return false;
      
      const data = this.applicationData;
      return !!(
        data.requestedAmount && 
        parseFloat(data.requestedAmount) > 0 &&
        data.purposeStatement?.trim() && 
        data.useOfFunds?.trim()
      );
    }
    
    return true;
  });

  validationIssues = computed(() => {
    const issues: string[] = [];
    const profile = this.currentProfile();
    
    if (!profile) {
      if (this.isLoadingProfile()) {
        issues.push('Loading business profile...');
      } else {
        issues.push('Business profile not available');
      }
      return issues;
    }
    
    if (this.analysisMode === 'opportunity') {
      if (!this.opportunity) issues.push('Funding opportunity data missing');
      if (!this.applicationData) issues.push('Application data missing');
      
      const data = this.applicationData;
      if (data) {
        if (!data.requestedAmount || parseFloat(data.requestedAmount) <= 0) {
          issues.push('Valid funding amount required');
        }
        if (!data.purposeStatement?.trim()) {
          issues.push('Purpose statement required');
        }
        if (!data.useOfFunds?.trim()) {
          issues.push('Use of funds description required');
        }
      }
    }
    
    return issues;
  });

  hasError = computed(() => !!this.analysisError());
  showBusinessRules = computed(() => !!this.businessRulesResult());
  showComprehensiveAnalysis = computed(() => !!this.comprehensiveAnalysis());
  isModularAnalysisRunning = computed(() => this.isAnalyzing() || this.modularAIService.isAnalyzing());

  constructor() {
    console.log('Enhanced AI Analysis Component initialized with perspective:', this.analysisPerspective);
  }

ngOnInit() {
  if (!this.businessProfile) {
    this.loadBusinessProfile();
  }}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBusinessProfile() {
    this.isLoadingProfile.set(true);
    this.backendService.loadSavedProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.loadedProfile.set(profile);
          this.isLoadingProfile.set(false);
        },
        error: (error) => {
          console.error('Failed to load business profile:', error);
          this.analysisError.set('Failed to load business profile');
          this.isLoadingProfile.set(false);
        }
      });
  }

  // =======================
  // ANALYSIS ORCHESTRATION
  // =======================

  startAnalysis() {
    if (!this.canAnalyze()) {
      console.warn('Cannot analyze - missing required data');
      return;
    }

    // Clear previous results
    this.businessRulesResult.set(null);
    this.comprehensiveAnalysis.set(null);
    this.analysisError.set(null);
    this.analysisProgress.set(0);

    // Start with business rules analysis (quick validation)
    this.performBusinessRulesAnalysis();
  }

  private performBusinessRulesAnalysis() {
    const profile = this.currentProfile();
    if (!profile) return;

    this.currentAnalysisStage.set('Running eligibility checks...');

    const analysisObservable = this.analysisMode === 'profile' 
      ? this.businessRulesService.analyzeProfile(profile)
      : this.businessRulesService.analyzeApplication(
          profile, 
          this.opportunity!, 
          this.applicationData!
        );

    analysisObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.businessRulesResult.set(result);
        this.analysisProgress.set(25);
        console.log('Business rules analysis completed:', result);
      },
      error: (error) => {
        console.error('Business rules analysis failed:', error);
        this.analysisError.set('Failed to perform initial analysis');
      }
    });
  }

  // =======================
  // COMPREHENSIVE AI ANALYSIS
  // =======================

  startComprehensiveAnalysis() {
    if (!this.canAnalyze()) {
      return;
    }

    this.isAnalyzing.set(true);
    this.comprehensiveAnalysis.set(null);
    this.analysisError.set(null);

    const profile = this.currentProfile()!;

    // Build application object for modular analysis
    const application = {
      id: this.applicationId || `temp_${Date.now()}`,
      documents: {}, // Would come from actual application
      ...this.applicationData
    };

    this.modularAIService.analyzeApplication(
      application,
      profile,
      this.analysisPerspective  
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.comprehensiveAnalysis.set(result);
        this.analysisCompleted.emit(result);
        this.isAnalyzing.set(false);
        console.log('Comprehensive analysis completed:', result);
      },
      error: (error) => {
        console.error('Comprehensive analysis failed:', error);
        this.analysisError.set('Comprehensive analysis failed: ' + (error.message || 'Unknown error'));
        this.isAnalyzing.set(false);
      }
    });
  }

  // =======================
  // EVENT HANDLERS
  // =======================

  refreshAnalysis() {
    this.startAnalysis();
  }

  improveApplication() {
    this.improvementRequested.emit();
  }

  proceedWithApplication() {
    this.proceedRequested.emit();
  }

  retryAnalysis() {
    this.analysisError.set(null);
    this.startAnalysis();
  }

  clearError() {
    this.analysisError.set(null);
  }

  // =======================
  // UI HELPERS - PERSPECTIVE AWARE
  // =======================

  getAnalysisTitle(): string {
    const baseTitle = this.analysisMode === 'profile' 
      ? 'Business Profile Analysis' 
      : 'Opportunity Match Analysis';
    
    const perspective = this.analysisPerspective === 'sme' ? 'Application Readiness' : 'Investment Evaluation';
    return `${baseTitle} - ${perspective}`;
  }

  getAnalysisDescription(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysisMode === 'profile'
        ? 'Comprehensive evaluation of your business readiness for funding applications with actionable improvement recommendations'
        : 'Intelligent assessment of your application\'s competitiveness and guidance to maximize funding success';
    } else {
      return this.analysisMode === 'profile'
        ? 'Investment-focused evaluation of business viability and risk assessment for funding decisions'
        : 'Due diligence analysis of application quality and investment opportunity assessment';
    }
  }

  getAnalysisCapabilities() {
    if (this.analysisPerspective === 'sme') {
      return [
        { icon: this.TargetIcon, title: 'Readiness Check', desc: 'Application competitiveness assessment', color: 'blue' },
        { icon: this.CheckCircleIcon, title: 'Eligibility Review', desc: 'Requirements validation and gaps', color: 'green' },
        { icon: this.TrendingUpIcon, title: 'Improvement Plan', desc: 'Actionable steps to strengthen profile', color: 'purple' },
        { icon: this.BotIcon, title: 'AI Insights', desc: 'Strategic positioning recommendations', color: 'amber' }
      ];
    } else {
      return [
        { icon: this.ShieldIcon, title: 'Risk Assessment', desc: 'Investment risk evaluation', color: 'red' },
        { icon: this.DollarSignIcon, title: 'Financial Review', desc: 'Financial health and projections', color: 'green' },
        { icon: this.UsersIcon, title: 'Team Analysis', desc: 'Management capability assessment', color: 'purple' },
        { icon: this.TargetIcon, title: 'Market Position', desc: 'Competitive positioning analysis', color: 'blue' }
      ];
    }
  }

  getPrimaryActionText(): string {
    return this.analysisPerspective === 'sme' ? 'Check Application Readiness' : 'Evaluate Investment Opportunity';
  }

  getComprehensiveActionText(): string {
    return this.analysisPerspective === 'sme' ? 'Get Detailed Preparation Plan' : 'Run Full Due Diligence';
  }

  // Existing UI helper methods remain the same
  getCompatibilityBadgeClass(eligibility: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (eligibility) {
      case 'eligible': return `${baseClass} bg-green-100 text-green-800`;
      case 'conditional': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'ineligible': return `${baseClass} bg-red-100 text-red-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getScoreBarClass(score: number): string {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getRiskSeverityClass(severity: string): string {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';
    switch (severity) {
      case 'high': return `${baseClass} bg-red-100 text-red-800`;
      case 'medium': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'low': return `${baseClass} bg-yellow-100 text-yellow-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getMatchQualityIcon(match: string): any {
    switch (match) {
      case 'strong': return this.CheckCircleIcon;
      case 'moderate': return this.TargetIcon;
      case 'weak': return this.AlertTriangleIcon;
      default: return this.XCircleIcon;
    }
  }

  getMatchQualityClass(match: string): string {
    switch (match) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-orange-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  // NEW: Comprehensive analysis result helpers
  getReadinessLevel(): string {
    const analysis = this.comprehensiveAnalysis();
    if (!analysis) return '';
    
    if (this.analysisPerspective === 'sme') {
      return analysis.applicationReadiness || 'unknown';
    } else {
      return analysis.recommendation || 'unknown';
    }
  }

  getReadinessColor(): string {
    const level = this.getReadinessLevel();
    
    if (this.analysisPerspective === 'sme') {
      switch (level) {
        case 'ready_to_submit': return 'green';
        case 'needs_minor_improvements': return 'orange';
        case 'requires_major_work': return 'red';
        default: return 'gray';
      }
    } else {
      switch (level) {
        case 'approve': return 'green';
        case 'conditional_approve': return 'orange';
        case 'reject': return 'red';
        case 'request_more_info': return 'blue';
        default: return 'gray';
      }
    }
  }

  getKeyInsights(): string[] {
    const analysis = this.comprehensiveAnalysis();
    if (!analysis) return [];
    
    if (this.analysisPerspective === 'sme') {
      return analysis.competitiveAdvantages || [];
    } else {
      return analysis.keyStrengths || [];
    }
  }

  getActionItems(): string[] {
    const analysis = this.comprehensiveAnalysis();
    if (!analysis) return [];
    
    if (this.analysisPerspective === 'sme') {
      return analysis.actionPlan || [];
    } else {
      return analysis.conditions || [];
    }
  }

  getCurrentStage(): string {
    if (this.modularAIService.currentStage()) {
      return this.modularAIService.currentStage();
    }
    return this.currentAnalysisStage();
  }

  getAnalysisProgress(): number {
    return this.modularAIService.analysisProgress() || this.analysisProgress();
  }
}