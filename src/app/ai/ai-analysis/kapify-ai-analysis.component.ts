// src/app/ai/ai-analysis/kapify-ai-analysis.component.ts

import { Component, Input, Output, EventEmitter, signal, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Child Components
import { AnalysisLauncherComponent } from './evaluation-component/evaluation.component';
import { BusinessRulesResultsComponent } from './components/business-rules-results.component';
import { AiAnalysisProgressComponent } from './components/ai-analysis-progress.component';
import { ComprehensiveAnalysisResultsComponent } from './components/comprehensive-analysis-results.component';
import { AnalysisErrorComponent } from './components/analysis-error.component';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { ModularAIAnalysisService, ComprehensiveAnalysis } from '../services/modular-ai-analysis.service';
import { BusinessRulesAnalysisService, BusinessRulesResult } from '../services/business-rules.service';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
import { ApplicationFormData } from 'src/app/SMEs/applications/new-application/models/application-form.model';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

 
type AnalysisState = 'pre-analysis' | 'business-rules' | 'ai-progress' | 'ai-results' | 'error';

@Component({
  selector: 'app-enhanced-ai-analysis',
  standalone: true,
  imports: [
    CommonModule,
    AnalysisLauncherComponent,
    BusinessRulesResultsComponent,
    AiAnalysisProgressComponent,
    ComprehensiveAnalysisResultsComponent,
    AnalysisErrorComponent
  ],
  template: `
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      
      @switch (currentState()) {
        
        @case ('pre-analysis') {
          <app-analysis-launcher
            [analysisMode]="analysisMode"
            [analysisPerspective]="analysisPerspective"
            [canAnalyze]="canAnalyze()"
            [validationIssues]="validationIssues()"
            [isLoadingProfile]="isLoadingProfile()"
            (startAnalysis)="startAnalysis()" />
        }
        
        @case ('business-rules') {
          <app-business-rules-results
            [result]="businessRulesResult()!"
            [analysisMode]="analysisMode"
            [analysisPerspective]="analysisPerspective"
            (startComprehensiveAnalysis)="startComprehensiveAnalysis()"
            (improveApplication)="handleImproveApplication()"
            (proceedWithApplication)="handleProceedWithApplication()"
            (refreshAnalysis)="refreshAnalysis()" />
        }
        
        @case ('ai-progress') {
          <app-ai-analysis-progress
            [currentStage]="getCurrentStage()"
            [progress]="getAnalysisProgress()"
            [analysisPerspective]="analysisPerspective"
            (cancelAnalysis)="cancelAnalysis()" />
        }
        
        @case ('ai-results') {
          <app-comprehensive-analysis-results
            [analysis]="comprehensiveAnalysis()!"
            [analysisPerspective]="analysisPerspective"
            [analysisWarnings]="analysisWarnings()"
            (improveApplication)="handleImproveApplication()"
            (proceedWithApplication)="handleProceedWithApplication()"
            (refreshAnalysis)="refreshAnalysis()"
            (retryAnalysis)="retryAnalysisWithDiagnostics()" />
        }
        
        @case ('error') {
          <app-analysis-error
            [error]="analysisError()!"
            [analysisPerspective]="analysisPerspective"
            (retry)="retryAnalysisWithDiagnostics()"
            (dismiss)="clearError()" />
        }
      }
      
    </div>
  `
})
export class KapifyAIAnalysisComponent implements OnInit, OnDestroy {

  @Input() opportunity: FundingOpportunity | null = null;
   @Input() applicationData: ApplicationFormData | null = null; 
  @Input() applicationId: string | null = null;  
  @Input() businessProfile?: FundingApplicationProfile; 
  @Input() isSubmitted = false;
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  
  @Output() analysisCompleted = new EventEmitter<ComprehensiveAnalysis>();
  @Output() improvementRequested = new EventEmitter<void>();
  @Output() proceedRequested = new EventEmitter<void>();

  // Services
  private backendService = inject(FundingProfileBackendService);
  private businessRulesService = inject(BusinessRulesAnalysisService);
  private modularAIService = inject(ModularAIAnalysisService);
  private destroy$ = new Subject<void>();

  // State Management
  currentState = signal<AnalysisState>('pre-analysis');
  
  // Data State
  private loadedProfile = signal<FundingApplicationProfile | null>(null);
  businessRulesResult = signal<BusinessRulesResult | null>(null);
  comprehensiveAnalysis = signal<ComprehensiveAnalysis | null>(null);
  
  // Loading & Error State
  isLoadingProfile = signal(false);
  analysisError = signal<string | null>(null);
  analysisWarnings = signal<string[]>([]);

  // Computed Properties
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

  ngOnInit() {
    if (!this.businessProfile) {
      this.loadBusinessProfile();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =======================
  // PROFILE MANAGEMENT
  // =======================

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
          this.currentState.set('error');
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

    this.clearState();
    this.performBusinessRulesAnalysis();
  }

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
        this.currentState.set('business-rules');
        console.log('Business rules analysis completed:', result);
      },
      error: (error) => {
        console.error('Business rules analysis failed:', error);
        this.analysisError.set('Failed to perform initial analysis');
        this.currentState.set('error');
      }
    });
  }

  startComprehensiveAnalysis() {
    if (!this.canAnalyze()) return;

    this.currentState.set('ai-progress');
    this.analysisWarnings.set([]);

    const profile = this.currentProfile()!;
    const application = {
      id: this.applicationId || `temp_${Date.now()}`,
      documents: {},
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
        this.currentState.set('ai-results');
        
        if (result.confidence < 80) {
          this.analysisWarnings.set([
            'Some analysis modules used fallback data due to service issues.',
            'Results may be less accurate than usual.',
            'Consider retrying the analysis later for improved accuracy.'
          ]);
        }
        
        console.log('Comprehensive analysis completed:', result);
      },
      error: (error) => {
        console.error('Comprehensive analysis failed:', error);
        this.handleAnalysisError(error);
      }
    });
  }

  // =======================
  // EVENT HANDLERS
  // =======================

  refreshAnalysis() {
    this.startAnalysis();
  }

  retryAnalysisWithDiagnostics() {
    const profile = this.currentProfile();
    
    console.log('Retrying analysis with diagnostics:', {
      hasProfile: !!profile,
      hasFinancialData: !!profile?.financialProfile,
      monthlyRevenue: profile?.financialProfile?.monthlyRevenue,
      hasApplicationData: !!this.applicationData,
      applicationId: this.applicationId,
      analysisPerspective: this.analysisPerspective
    });
    
    this.startComprehensiveAnalysis();
  }

  cancelAnalysis() {
    // Return to business rules if available, otherwise go to pre-analysis
    if (this.businessRulesResult()) {
      this.currentState.set('business-rules');
    } else {
      this.currentState.set('pre-analysis');
    }
  }

  clearError() {
    this.analysisError.set(null);
    // Return to appropriate previous state
    if (this.businessRulesResult()) {
      this.currentState.set('business-rules');
    } else {
      this.currentState.set('pre-analysis');
    }
  }

  handleImproveApplication() {
    this.improvementRequested.emit();
  }

  handleProceedWithApplication() {
    this.proceedRequested.emit();
  }

  // =======================
  // UTILITY METHODS
  // =======================

  getCurrentStage(): string {
    if (this.modularAIService.currentStage()) {
      return this.modularAIService.currentStage();
    }
    return 'Initializing analysis...';
  }

  getAnalysisProgress(): number {
    return this.modularAIService.analysisProgress() || 0;
  }

  private clearState() {
    this.businessRulesResult.set(null);
    this.comprehensiveAnalysis.set(null);
    this.analysisError.set(null);
    this.analysisWarnings.set([]);
  }

  private handleAnalysisError(error: any) {
    let userMessage = 'Analysis could not be completed. ';
    
    if (error.message?.includes('Financial analysis')) {
      userMessage += 'There was an issue processing your financial data. Please ensure all financial information is complete and try again.';
    } else if (error.message?.includes('timeout')) {
      userMessage += 'The analysis is taking longer than expected. Please try again.';
    } else if (error.message?.includes('Invalid JSON') || error.message?.includes('Service unavailable')) {
      userMessage += 'Our analysis service is temporarily unavailable. Please try again in a few minutes.';
    } else {
      userMessage += 'Please check your internet connection and try again. If the problem persists, contact support.';
    }
    
    this.analysisError.set(userMessage);
    this.currentState.set('error');
  }
}