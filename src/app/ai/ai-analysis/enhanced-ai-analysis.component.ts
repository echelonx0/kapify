// src/app/ai/ai-analysis/enhanced-ai-analysis.component.ts

import { Component, Input, Output, EventEmitter, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2, Target, Award, Shield, RefreshCw, XCircle, Mail, Clock, FileText } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { AIAnalysisService, AIAnalysisRequest, AIAnalysisResult } from '../services/ai-analysis.service';
import { BusinessRulesAnalysisService, BusinessRulesResult } from '../services/business-rules.service';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
 
export interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

 

// Background job response type
export interface AIAnalysisJobResponse {
  jobId: string;
  status: string;
  message?: string;
}

// Union type for AI analysis responses
export type AIAnalysisResponse = AIAnalysisResult | AIAnalysisJobResponse;

// Type guard to check if response is a job response
function isJobResponse(response: AIAnalysisResponse): response is AIAnalysisJobResponse {
  return 'jobId' in response;
}

@Component({
  selector: 'app-enhanced-ai-analysis',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  templateUrl: './enhanced-ai-analysis.component.html'
})
export class EnhancedAIAnalysisComponent implements OnDestroy {

  @Input() opportunity: FundingOpportunity | null = null;
  @Input() applicationData: CoverInformation | null = null;
  @Input() applicationId: string | null = null;  
  @Input() businessProfile?: FundingApplicationProfile; 
  @Input() isSubmitted = false;
    // Inject the service
  private backendService = inject(FundingProfileBackendService);
   private loadedProfile = signal<FundingApplicationProfile | null>(null);
     // Update computed to use loaded or passed profile
  private currentProfile = computed(() => this.businessProfile || this.loadedProfile());
  
  // Analysis mode: 'profile' for standalone, 'opportunity' for opportunity-specific
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  
  @Output() analysisCompleted = new EventEmitter<AIAnalysisResult>();
  @Output() improvementRequested = new EventEmitter<void>();
  @Output() proceedRequested = new EventEmitter<void>();

  // Services
  private businessRulesService = inject(BusinessRulesAnalysisService);
  private aiAnalysisService = inject(AIAnalysisService);
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

  // State
  businessRulesResult = signal<BusinessRulesResult | null>(null);
  aiAnalysisResult = signal<AIAnalysisResult | null>(null);
  isAnalyzing = signal(false);
  analysisError = signal<string | null>(null);
  
  // AI Email status
  aiEmailRequested = signal(false);
  aiEmailSent = signal(false);
  aiEmailError = signal<string | null>(null);
  aiJobId = signal<string | null>(null);

  // Computed properties
  canAnalyze = computed(() => {
     const profile = this.currentProfile();
    if (!profile) return false;
    if (!this.businessProfile) return false;
    
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
    
    // Profile mode - just needs business profile
    return true;
  });

  hasError = computed(() => !!this.analysisError());
  showBusinessRules = computed(() => !!this.businessRulesResult());
  showAIResults = computed(() => !!this.aiAnalysisResult());

  constructor() {
    console.log('Enhanced AI Analysis Component initialized');
  }

  ngOnInit() {
  if (!this.businessProfile) {
    this.loadBusinessProfile();
  }
}
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBusinessProfile() {
  this.backendService.loadSavedProfile()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (profile) => {
        this.loadedProfile.set(profile);
      },
      error: (error) => {
        console.error('Failed to load business profile:', error);
        this.analysisError.set('Failed to load business profile');
      }
    });
}
  // =======================
  // MAIN ANALYSIS TRIGGER
  // =======================

  startAnalysis() {
    if (!this.canAnalyze()) {
      console.warn('Cannot analyze - missing required data');
      return;
    }

    // Clear previous results
    this.businessRulesResult.set(null);
    this.aiAnalysisResult.set(null);
    this.analysisError.set(null);
    this.aiEmailRequested.set(false);
    this.aiEmailSent.set(false);
    this.aiEmailError.set(null);
    this.aiJobId.set(null);

    // Start with business rules analysis (always instant)
    this.performBusinessRulesAnalysis();
  }

// Update performBusinessRulesAnalysis
private performBusinessRulesAnalysis() {
  const profile = this.currentProfile();
  if (!profile) return;

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
      console.log('Business rules analysis completed:', result);
    },
    error: (error) => {
      console.error('Business rules analysis failed:', error);
      this.analysisError.set('Failed to perform initial analysis');
    }
  });
}


  // =======================
  // AI EMAIL ANALYSIS
  // =======================

  requestAIAnalysis() {
    if (this.aiEmailRequested() || !this.businessProfile) {
      return;
    }

    this.aiEmailRequested.set(true);
    this.aiEmailError.set(null);

    // Build AI analysis request
    const request = this.buildAIAnalysisRequest();
    if (!request) {
      this.aiEmailError.set('Failed to build analysis request');
      this.aiEmailRequested.set(false);
      return;
    }

    // Send to AI analysis service (background job)
    this.aiAnalysisService.analyzeApplication({ ...request, backgroundMode: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AIAnalysisResponse) => {
          if (isJobResponse(response)) {
            // Background job queued
            this.aiJobId.set(response.jobId);
            this.aiEmailSent.set(true);
            console.log('AI analysis queued:', response.jobId);
          } else {
            // Immediate response (shouldn't happen with backgroundMode: true)
            this.aiAnalysisResult.set(response);
            this.analysisCompleted.emit(response);
            console.log('AI analysis completed immediately');
          }
        },
        error: (error) => {
          console.error('AI analysis request failed:', error);
          this.aiEmailError.set(
            error?.message || 'Failed to queue AI analysis. Please try again.'
          );
          this.aiEmailRequested.set(false);
        }
      });
  }

private buildAIAnalysisRequest(): AIAnalysisRequest | null {
  const profile = this.currentProfile();
  if (!profile) return null;

  if (this.analysisMode === 'profile') {
    // Profile-only analysis
    return {
      opportunity: null,
      applicationData: null,
      businessProfile: profile
    };
  }

  // Opportunity-specific analysis
  const opportunity = this.opportunity;
  const applicationData = this.applicationData;

  if (!opportunity || !applicationData) {
    return null;
  }

  return {
    opportunity,
    applicationData: {
      requestedAmount: applicationData.requestedAmount || '0',
      purposeStatement: applicationData.purposeStatement || '',
      useOfFunds: applicationData.useOfFunds || '',
      timeline: applicationData.timeline || '',
      opportunityAlignment: applicationData.opportunityAlignment || ''
    },
    businessProfile: profile
  };
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

  retryAIRequest() {
    this.aiEmailRequested.set(false);
    this.aiEmailError.set(null);
    this.aiJobId.set(null);
    this.requestAIAnalysis();
  }

  clearError() {
    this.analysisError.set(null);
  }

  // =======================
  // VALIDATION & UI HELPERS
  // =======================

  getCannotAnalyzeReason(): string {
    if (!this.businessProfile) return 'Business profile not available';
    
    if (this.analysisMode === 'opportunity') {
      if (!this.opportunity) return 'No opportunity data available';
      if (!this.applicationData) return 'No application data available';
      
      const data = this.applicationData;
      if (!data.requestedAmount || parseFloat(data.requestedAmount) <= 0) {
        return 'Please specify a valid requested amount';
      }
      if (!data.purposeStatement?.trim()) {
        return 'Please provide a purpose statement';
      }
      if (!data.useOfFunds?.trim()) {
        return 'Please describe how you will use the funds';
      }
    }
    
    return 'Complete required fields to enable analysis';
  }

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

  getAnalysisTitle(): string {
    return this.analysisMode === 'profile' 
      ? 'Business Profile Analysis' 
      : 'Opportunity Match Analysis';
  }

  getAnalysisDescription(): string {
    return this.analysisMode === 'profile'
      ? 'Get instant insights on your business readiness for funding applications'
      : 'Get instant insights on your application\'s compatibility with this funding opportunity';
  }

  // Job status helpers
  getJobStatusMessage(): string {
    const jobId = this.aiJobId();
    if (!jobId) return '';
    
    return `Analysis request queued (Job ID: ${jobId.slice(0, 8)}...)`;
  }

  hasActiveJob(): boolean {
    return !!this.aiJobId() && this.aiEmailSent() && !this.aiEmailError();
  }
}