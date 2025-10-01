// src/app/ai/services/modular-ai-analysis.service.ts (Updated for SME + Investor modes)
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { MarketIntelligenceService } from './market-intelligence.service';
  
import { FundingApplicationProfile, FinancialProfile, BusinessAssessment, ManagementStructure } from 'src/app/SMEs/applications/models/funding-application.models';
import { DocumentSection } from 'src/app/SMEs/models/application.models';

// Enhanced Analysis Result Interfaces for Both Modes
export interface FinancialHealthAnalysis {
  overallScore: number;
  
  // Investor mode fields
  liquidityRisk?: 'low' | 'medium' | 'high';
  profitabilityTrend?: 'improving' | 'stable' | 'declining';
  debtServiceCapability?: 'strong' | 'adequate' | 'weak';
  cashFlowStability?: 'stable' | 'volatile' | 'concerning';
  redFlags?: string[];
  positiveIndicators?: string[];
  
  // SME mode fields
  readinessLevel?: 'ready_to_apply' | 'nearly_ready' | 'needs_improvement';
  strengthsToHighlight?: string[];
  areasToImprove?: string[];
  applicationTips?: string[];
  positioningStrategy?: string;
  fundingReadiness?: {
    debtCapacity: 'high' | 'medium' | 'low';
    equityPosition: 'strong' | 'moderate' | 'weak';
    cashFlowPredictability: 'stable' | 'variable' | 'volatile';
  };
  immediateActions?: string[];
  
  // Common fields
  recommendations: string[];
  confidence: number;
}

export interface MarketPositionAnalysis {
  // Investor mode fields
  competitiveStrength?: 'strong' | 'moderate' | 'weak';
  marketOpportunity?: 'high' | 'medium' | 'low';
  timingAssessment?: 'favorable' | 'neutral' | 'challenging';
  differentiationScore?: number;
  opportunities?: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    timeframe: 'immediate' | 'short_term' | 'medium_term';
  }>;
  threats?: Array<{
    threat: string;
    severity: 'high' | 'medium' | 'low';
    probability: 'high' | 'medium' | 'low';
  }>;
  
  // SME mode fields
  marketAppealScore?: number;
  fundingAttractiveness?: 'highly_attractive' | 'moderately_attractive' | 'limited_appeal';
  competitiveAdvantages?: string[];
  marketOpportunityStory?: string;
  positioningStrategy?: string[];
  competitivePositioning?: 'market_leader' | 'strong_challenger' | 'niche_player' | 'emerging_competitor';
  marketValidation?: string[];
  timingAdvantages?: string[];
  applicationTips?: string[];
  
  // Common fields
  recommendations: string[];
  confidence: number;
}

export interface ManagementAnalysis {
  // Investor mode fields
  leadershipScore?: number;
  experienceDepth?: 'strong' | 'adequate' | 'limited';
  teamCompleteness?: 'complete' | 'mostly_complete' | 'gaps_identified';
  governanceQuality?: 'strong' | 'adequate' | 'weak';
  keyPersonRisk?: 'low' | 'medium' | 'high';
  successionPlanning?: 'strong' | 'basic' | 'absent';
  strengths?: string[];
  weaknesses?: string[];
  criticalGaps?: string[];
  developmentNeeds?: string[];
  
  // SME mode fields
  leadershipReadinessScore?: number;
  teamReadinessLevel?: 'funding_ready' | 'nearly_ready' | 'needs_strengthening';
  leadershipStrengths?: string[];
  presentationTips?: string[];
  teamStrengthening?: string[];
  governanceRecommendations?: string[];
  advisoryNeeds?: string[];
  applicationStrategy?: string;
  
  // Common fields
  recommendations: string[];
  confidence: number;
}

export interface RiskAnalysis {
  // Investor mode fields
  overallRiskScore?: number;
  riskCategories?: {
    financial: 'low' | 'medium' | 'high';
    market: 'low' | 'medium' | 'high';
    operational: 'low' | 'medium' | 'high';
    management: 'low' | 'medium' | 'high';
    regulatory: 'low' | 'medium' | 'high';
  };
  criticalRisks?: Array<{
    category: string;
    risk: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  dealBreakers?: string[];
  
  // SME mode fields
  applicationReadinessScore?: number;
  readinessLevel?: 'application_ready' | 'needs_preparation' | 'requires_work';
  potentialConcerns?: Array<{
    category: string;
    concern: string;
    impact: 'low' | 'medium' | 'high';
    addressingStrategy: string;
    documentationNeeded: string;
  }>;
  strengthsToEmphasize?: string[];
  preparationActions?: string[];
  positioningAdvice?: string[];
  applicationTips?: string[];
  
  // Common fields
  riskMitigationStrategies: string[];
  monitoringRecommendations: string[];
  confidence: number;
}

export interface ComplianceAnalysis {
  completenessScore: number;
  criticalDocumentsMissing: string[];
  documentQuality: 'high' | 'medium' | 'low';
  complianceRisk: 'low' | 'medium' | 'high';
  verificationStatus: {
    companyRegistration: 'verified' | 'pending' | 'missing';
    financialStatements: 'verified' | 'pending' | 'missing';
    taxCompliance: 'verified' | 'pending' | 'missing';
    businessPlan: 'verified' | 'pending' | 'missing';
  };
  recommendations: string[];
  confidence: number;
}

export interface ComprehensiveAnalysis {
  applicationId: string;
  overallScore: number; // 0-100
  analysisMode: 'investor' | 'sme';
  
  // Investor mode fields
  recommendation?: 'approve' | 'conditional_approve' | 'reject' | 'request_more_info';
  investmentRationale?: string;
  keyStrengths?: string[];
  majorConcerns?: string[];
  conditions?: string[];
  
  // SME mode fields
  applicationReadiness?: 'ready_to_submit' | 'needs_minor_improvements' | 'requires_major_work';
  readinessRationale?: string;
  competitiveAdvantages?: string[];
  improvementPriorities?: string[];
  actionPlan?: string[];
  
  // Module results
  financial: FinancialHealthAnalysis;
  market: MarketPositionAnalysis;
  management: ManagementAnalysis;
  compliance: ComplianceAnalysis;
  risk: RiskAnalysis;
  
  // Meta
  analysisDate: Date;
  processingTimeMs: number;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class ModularAIAnalysisService {
  private supabase = inject(SharedSupabaseService);
  private marketIntelligence = inject(MarketIntelligenceService);
  
  isAnalyzing = signal(false);
  analysisProgress = signal(0);
  currentStage = signal<string>('');
  
  /**
   * Main entry point - analyzes complete application using modular approach
   * @param application Application data
   * @param profileData Business profile
   * @param analysisMode 'investor' for investment evaluation, 'sme' for application preparation
   */
  analyzeApplication(
    application: any,
    profileData: FundingApplicationProfile,
    analysisMode: 'investor' | 'sme' = 'investor'
  ): Observable<ComprehensiveAnalysis> {
    this.isAnalyzing.set(true);
    this.analysisProgress.set(0);
    
    return from(this.performModularAnalysis(application, profileData, analysisMode)).pipe(
      tap(() => {
        this.isAnalyzing.set(false);
        this.analysisProgress.set(100);
      }),
      catchError(error => {
        this.isAnalyzing.set(false);
        throw error;
      })
    );
  }

  /**
   * Individual module analysis methods with mode support
   */
  analyzeFinancialHealth(
    financialProfile: FinancialProfile, 
    analysisMode: 'investor' | 'sme' = 'investor'
  ): Observable<FinancialHealthAnalysis> {
    return from(this.performFinancialAnalysis(financialProfile, analysisMode));
  }

  analyzeMarketPosition(
    businessData: BusinessAssessment, 
    industry: string,
    analysisMode: 'investor' | 'sme' = 'investor'
  ): Observable<MarketPositionAnalysis> {
    return from(this.performMarketAnalysis(businessData, industry, analysisMode));
  }

  analyzeManagementCapability(
    managementStructure: ManagementStructure,
    analysisMode: 'investor' | 'sme' = 'investor'
  ): Observable<ManagementAnalysis> {
    return from(this.performManagementAnalysis(managementStructure, analysisMode));
  }

  analyzeDocumentCompleteness(documents: DocumentSection): Observable<ComplianceAnalysis> {
    return from(this.performComplianceAnalysis(documents));
  }

  analyzeRiskProfile(
    profile: FundingApplicationProfile,
    industry: string,
    analysisMode: 'investor' | 'sme' = 'investor'
  ): Observable<RiskAnalysis> {
    return from(this.performRiskAnalysis(profile, industry, analysisMode));
  }

  // ===============================
  // PRIVATE IMPLEMENTATION
  // ===============================

// Update the performModularAnalysis method with better error handling

private async performModularAnalysis(
  application: any,
  profileData: FundingApplicationProfile,
  analysisMode: 'investor' | 'sme'
): Promise<ComprehensiveAnalysis> {
  const startTime = Date.now();
  
  try {
    this.currentStage.set(`Initializing ${analysisMode} analysis modules...`);
    this.analysisProgress.set(10);

    // Track which analyses succeed/fail
    const analysisResults: {
      financial?: FinancialHealthAnalysis;
      compliance?: ComplianceAnalysis;
      management?: ManagementAnalysis;
      market?: MarketPositionAnalysis;
      risk?: RiskAnalysis;
    } = {};
    
    const analysisErrors: string[] = [];

    // Financial Analysis with better error handling
    this.currentStage.set('Analyzing financial health...');
    this.analysisProgress.set(20);
    
    try {
      analysisResults.financial = await this.performFinancialAnalysis(
        profileData.financialProfile!, 
        analysisMode
      );
    } catch (error) {
      console.error('Financial analysis failed:', error);
      analysisErrors.push(`Financial analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Use fallback
      analysisResults.financial = this.generateFallbackFinancialAnalysis(
        profileData.financialProfile!, 
        analysisMode
      );
    }

    // Compliance Analysis
    this.currentStage.set('Checking document compliance...');
    this.analysisProgress.set(35);
    
    try {
      analysisResults.compliance = await this.performComplianceAnalysis(application.documents || {});
    } catch (error) {
      console.error('Compliance analysis failed:', error);
      analysisErrors.push(`Compliance analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Use simple fallback
      analysisResults.compliance = {
        completenessScore: 50,
        criticalDocumentsMissing: [],
        documentQuality: 'medium',
        complianceRisk: 'medium',
        verificationStatus: {
          companyRegistration: 'missing',
          financialStatements: 'missing',
          taxCompliance: 'missing',
          businessPlan: 'missing'
        },
        recommendations: ['Complete document upload'],
        confidence: 50
      };
    }

    // Management Analysis
    this.currentStage.set('Evaluating management capability...');
    this.analysisProgress.set(50);
    
    try {
      analysisResults.management = await this.performManagementAnalysis(
        profileData.managementStructure!, 
        analysisMode
      );
    } catch (error) {
      console.error('Management analysis failed:', error);
      analysisErrors.push(`Management analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      analysisResults.management = this.generateFallbackManagementAnalysis(
        profileData.managementStructure!, 
        analysisMode
      );
    }

    // Market Analysis
    this.currentStage.set('Analyzing market position...');
    this.analysisProgress.set(65);
    
    try {
      const industry = profileData.companyInfo?.industryType || 'unknown';
      analysisResults.market = await this.performMarketAnalysis(
        profileData.businessAssessment!, 
        industry, 
        analysisMode
      );
    } catch (error) {
      console.error('Market analysis failed:', error);
      analysisErrors.push(`Market analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      analysisResults.market = this.generateFallbackMarketAnalysis(
        profileData.businessAssessment!, 
        analysisMode
      );
    }

    // Risk Analysis
    this.currentStage.set(`Performing ${analysisMode === 'sme' ? 'application readiness' : 'risk'} assessment...`);
    this.analysisProgress.set(80);
    
    try {
      const industry = profileData.companyInfo?.industryType || 'unknown';
      analysisResults.risk = await this.performRiskAnalysis(profileData, industry, analysisMode);
    } catch (error) {
      console.error('Risk analysis failed:', error);
      analysisErrors.push(`Risk analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      analysisResults.risk = this.generateFallbackRiskAnalysis(profileData, analysisMode);
    }

    // Log errors if any occurred
    if (analysisErrors.length > 0) {
      console.warn(`Analysis completed with ${analysisErrors.length} fallbacks:`, analysisErrors);
    }

    this.currentStage.set('Generating final recommendations...');
    this.analysisProgress.set(90);

    const synthesis = await this.synthesizeAnalysis({
      financial: analysisResults.financial!,
      market: analysisResults.market!,
      management: analysisResults.management!,
      compliance: analysisResults.compliance!,
      risk: analysisResults.risk!
    }, analysisMode);

    return {
      applicationId: application.id,
      analysisMode,
      ...synthesis,
      financial: analysisResults.financial!,
      market: analysisResults.market!,
      management: analysisResults.management!,
      compliance: analysisResults.compliance!,
      risk: analysisResults.risk!,
      analysisDate: new Date(),
      processingTimeMs: Date.now() - startTime,
      confidence: this.calculateOverallConfidence([
        analysisResults.financial!,
        analysisResults.market!,
        analysisResults.management!,
        analysisResults.compliance!,
        analysisResults.risk!
      ])
    };

  } catch (error) {
    console.error('Modular analysis failed completely:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update individual analysis methods to handle Supabase errors better
private async performFinancialAnalysis(
  financialProfile: FinancialProfile, 
  analysisMode: 'investor' | 'sme'
): Promise<FinancialHealthAnalysis> {
  try {
    const { data, error } = await this.supabase.functions.invoke('analyze-financials', {
      body: {
        analysisType: 'financial_health',
        analysisMode,
        financialData: {
          monthlyRevenue: financialProfile.monthlyRevenue,
          historicalFinancials: financialProfile.historicalFinancials,
          projectedRevenue: financialProfile.projectedRevenue,
          cashFlowProjections: financialProfile.cashFlowProjections,
          profitMargin: financialProfile.profitMargin,
          debtToEquity: financialProfile.debtToEquity,
          currentRatio: financialProfile.currentRatio,
          returnOnAssets: financialProfile.returnOnAssets,
          creditFacilities: financialProfile.creditFacilities
        }
      }
    });

    // Better error handling for Supabase responses
    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Financial analysis failed: ${error.message || 'Unknown Supabase error'}`);
    }

    if (!data || !data.analysis) {
      console.error('Invalid response from financial analysis:', data);
      throw new Error('Financial analysis returned invalid data');
    }

    return data.analysis;

  } catch (error) {
    // Log the full error for debugging
    console.error('Financial analysis error details:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      profileData: {
        monthlyRevenue: financialProfile.monthlyRevenue,
        hasHistoricalData: !!financialProfile.historicalFinancials?.length
      }
    });
    
    // Re-throw with more context
    throw new Error(`Financial analysis failed: ${error instanceof Error ? error.message : 'Service unavailable'}`);
  }
}

 

  private async performMarketAnalysis(
    businessData: BusinessAssessment,
    industry: string,
    analysisMode: 'investor' | 'sme'
  ): Promise<MarketPositionAnalysis> {
    try {
      const marketData = await this.marketIntelligence
        .getMarketIntelligence(industry, { maxAge: 24 })
        .toPromise();

      const { data, error } = await this.supabase.functions.invoke('analyze-market-position', {
        body: {
          analysisType: 'market_position',
          analysisMode,
          businessData: {
            businessModel: businessData.businessModel,
            valueProposition: businessData.valueProposition,
            targetMarkets: businessData.targetMarkets,
            competitivePosition: businessData.competitivePosition,
            marketSize: businessData.marketSize,
            keyPerformanceIndicators: businessData.keyPerformanceIndicators
          },
          marketIntelligence: marketData,
          industry
        }
      });

      if (error) throw new Error(`Market analysis failed: ${error.message}`);
      return data.analysis;

    } catch (error) {
      console.warn('Market analysis failed, using fallback:', error);
      return this.generateFallbackMarketAnalysis(businessData, analysisMode);
    }
  }

  private async performManagementAnalysis(
    managementStructure: ManagementStructure,
    analysisMode: 'investor' | 'sme'
  ): Promise<ManagementAnalysis> {
    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-management', {
        body: {
          analysisType: 'management_capability',
          analysisMode,
          managementData: {
            executiveTeam: managementStructure.executiveTeam,
            managementTeam: managementStructure.managementTeam,
            boardOfDirectors: managementStructure.boardOfDirectors,
            governanceStructure: managementStructure.governanceStructure,
            advisors: managementStructure.advisors
          }
        }
      });

      if (error) throw new Error(`Management analysis failed: ${error.message}`);
      return data.analysis;

    } catch (error) {
      console.warn('Management analysis failed, using fallback:', error);
      return this.generateFallbackManagementAnalysis(managementStructure, analysisMode);
    }
  }

  private async performComplianceAnalysis(documents: DocumentSection): Promise<ComplianceAnalysis> {
    // Document compliance analysis is the same for both modes
    const requiredDocs = [
      'companyRegistration',
      'taxClearanceCertificate', 
      'auditedFinancials',
      'businessPlan'
    ];

    const availableDocs = Object.keys(documents).filter(key => documents[key]);
    const missingDocs = requiredDocs.filter(doc => !availableDocs.includes(doc));
    
    const completenessScore = ((requiredDocs.length - missingDocs.length) / requiredDocs.length) * 100;
    
    return {
      completenessScore,
      criticalDocumentsMissing: missingDocs,
      documentQuality: completenessScore > 80 ? 'high' : completenessScore > 60 ? 'medium' : 'low',
      complianceRisk: missingDocs.length > 2 ? 'high' : missingDocs.length > 0 ? 'medium' : 'low',
      verificationStatus: {
        companyRegistration: documents.companyRegistration ? 'verified' : 'missing',
        financialStatements: documents.auditedFinancials ? 'verified' : 'missing',
        taxCompliance: documents.taxClearanceCertificate ? 'verified' : 'missing',
        businessPlan: documents.businessPlan ? 'verified' : 'missing'
      },
      recommendations: this.generateComplianceRecommendations(missingDocs),
      confidence: 95
    };
  }

  private async performRiskAnalysis(
    profile: FundingApplicationProfile,
    industry: string,
    analysisMode: 'investor' | 'sme'
  ): Promise<RiskAnalysis> {
    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-risk-profile', {
        body: {
          analysisType: 'comprehensive_risk',
          analysisMode,
          profileData: profile,
          industry
        }
      });

      if (error) throw new Error(`Risk analysis failed: ${error.message}`);
      return data.analysis;

    } catch (error) {
      console.warn('Risk analysis failed, using fallback:', error);
      return this.generateFallbackRiskAnalysis(profile, analysisMode);
    }
  }

  // ===============================
  // SYNTHESIS AND UTILITIES
  // ===============================

  private async synthesizeAnalysis(modules: {
    financial: FinancialHealthAnalysis;
    market: MarketPositionAnalysis;
    management: ManagementAnalysis;
    compliance: ComplianceAnalysis;
    risk: RiskAnalysis;
  }, analysisMode: 'investor' | 'sme'): Promise<{
    overallScore: number;
    recommendation?: 'approve' | 'conditional_approve' | 'reject' | 'request_more_info';
    investmentRationale?: string;
    keyStrengths?: string[];
    majorConcerns?: string[];
    conditions?: string[];
    applicationReadiness?: 'ready_to_submit' | 'needs_minor_improvements' | 'requires_major_work';
    readinessRationale?: string;
    competitiveAdvantages?: string[];
    improvementPriorities?: string[];
    actionPlan?: string[];
  }> {
    
    // Calculate weighted overall score
    const weights = { financial: 0.3, market: 0.25, management: 0.2, compliance: 0.1, risk: 0.15 };
    const overallScore = Math.round(
      modules.financial.overallScore * weights.financial +
      this.getMarketScore(modules.market, analysisMode) * weights.market +
      this.getManagementScore(modules.management, analysisMode) * weights.management +
      modules.compliance.completenessScore * weights.compliance +
      this.getRiskScore(modules.risk, analysisMode) * weights.risk
    );

    if (analysisMode === 'sme') {
      return this.synthesizeSMEAnalysis(modules, overallScore);
    }
    
    return this.synthesizeInvestorAnalysis(modules, overallScore);
  }

  private synthesizeSMEAnalysis(modules: any, overallScore: number) {
    let applicationReadiness: 'ready_to_submit' | 'needs_minor_improvements' | 'requires_major_work';
    
    if (modules.compliance.completenessScore < 70) {
      applicationReadiness = 'requires_major_work';
    } else if (overallScore >= 75) {
      applicationReadiness = 'ready_to_submit';
    } else if (overallScore >= 60) {
      applicationReadiness = 'needs_minor_improvements';
    } else {
      applicationReadiness = 'requires_major_work';
    }

    const competitiveAdvantages = [
      ...(modules.financial.strengthsToHighlight?.slice(0, 2) || []),
      ...(modules.market.competitiveAdvantages?.slice(0, 2) || []),
      ...(modules.management.leadershipStrengths?.slice(0, 2) || [])
    ].slice(0, 5);

    const improvementPriorities = [
      ...(modules.financial.areasToImprove?.slice(0, 2) || []),
      ...(modules.risk.preparationActions?.slice(0, 2) || []),
      ...(modules.management.teamStrengthening?.slice(0, 1) || [])
    ].slice(0, 4);

    const actionPlan = [
      ...(modules.financial.immediateActions?.slice(0, 2) || []),
      ...(modules.compliance.recommendations.slice(0, 2)),
      ...(modules.risk.preparationActions?.slice(0, 2) || [])
    ].slice(0, 5);

    return {
      overallScore,
      applicationReadiness,
      readinessRationale: this.generateSMERationale(modules, overallScore),
      competitiveAdvantages,
      improvementPriorities,
      actionPlan
    };
  }

  private synthesizeInvestorAnalysis(modules: any, overallScore: number) {
    let recommendation: 'approve' | 'conditional_approve' | 'reject' | 'request_more_info';
    
    if (modules.compliance.completenessScore < 70) {
      recommendation = 'request_more_info';
    } else if (overallScore >= 75 && (modules.risk.overallRiskScore || 100) < 40) {
      recommendation = 'approve';
    } else if (overallScore >= 60 && (modules.risk.overallRiskScore || 100) < 60) {
      recommendation = 'conditional_approve';
    } else {
      recommendation = 'reject';
    }

    const keyStrengths = [
      ...(modules.financial.positiveIndicators?.slice(0, 2) || []),
      ...(modules.market.opportunities?.slice(0, 2).map((o: any) => o.opportunity) || []),
      ...(modules.management.strengths?.slice(0, 2) || [])
    ].slice(0, 5);

    const majorConcerns = [
      ...(modules.financial.redFlags?.slice(0, 2) || []),
      ...(modules.risk.criticalRisks?.slice(0, 2).map((r: any) => r.risk) || []),
      ...(modules.management.criticalGaps?.slice(0, 1) || [])
    ].slice(0, 4);

    const conditions = recommendation === 'conditional_approve' ? [
      ...modules.compliance.recommendations.slice(0, 2),
      ...modules.risk.riskMitigationStrategies.slice(0, 2)
    ] : [];

    return {
      overallScore,
      recommendation,
      investmentRationale: this.generateInvestmentRationale(modules, overallScore),
      keyStrengths,
      majorConcerns,
      conditions
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private getMarketScore(market: MarketPositionAnalysis, analysisMode: 'investor' | 'sme'): number {
    if (analysisMode === 'sme' && market.marketAppealScore !== undefined) {
      return market.marketAppealScore;
    }
    if (analysisMode === 'investor' && market.competitiveStrength) {
      return this.marketPositionToScore(market.competitiveStrength);
    }
    return 50; // Default
  }

  private getManagementScore(management: ManagementAnalysis, analysisMode: 'investor' | 'sme'): number {
    if (analysisMode === 'sme' && management.leadershipReadinessScore !== undefined) {
      return management.leadershipReadinessScore;
    }
    if (analysisMode === 'investor' && management.leadershipScore !== undefined) {
      return management.leadershipScore;
    }
    return 50; // Default
  }

  private getRiskScore(risk: RiskAnalysis, analysisMode: 'investor' | 'sme'): number {
    if (analysisMode === 'sme' && risk.applicationReadinessScore !== undefined) {
      return risk.applicationReadinessScore;
    }
    if (analysisMode === 'investor' && risk.overallRiskScore !== undefined) {
      return 100 - risk.overallRiskScore; // Invert risk to positive score
    }
    return 50; // Default
  }

  private marketPositionToScore(position: string): number {
    switch (position) {
      case 'strong': return 85;
      case 'moderate': return 65;
      case 'weak': return 35;
      default: return 50;
    }
  }

  private calculateOverallConfidence(analyses: Array<{ confidence: number }>): number {
    const total = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0);
    return Math.round(total / analyses.length);
  }

  private generateComplianceRecommendations(missingDocs: string[]): string[] {
    const recommendations: string[] = [];
    
    if (missingDocs.includes('companyRegistration')) {
      recommendations.push('Provide CIPC company registration certificate');
    }
    if (missingDocs.includes('taxClearanceCertificate')) {
      recommendations.push('Submit SARS tax clearance certificate');
    }
    if (missingDocs.includes('auditedFinancials')) {
      recommendations.push('Provide latest audited financial statements');
    }
    if (missingDocs.includes('businessPlan')) {
      recommendations.push('Submit comprehensive business plan');
    }
    
    return recommendations;
  }

  private generateSMERationale(modules: any, score: number): string {
    if (score >= 75) {
      return 'Your application shows strong readiness across key areas. You have solid financial performance, clear market positioning, and capable leadership that should appeal to funders.';
    } else if (score >= 60) {
      return 'Your application has good foundation but would benefit from addressing a few key areas to maximize funding success. Focus on the improvement priorities identified.';
    } else {
      return 'Your application needs strengthening in several areas before submission. Work through the action plan to significantly improve your funding prospects.';
    }
  }

  private generateInvestmentRationale(modules: any, score: number): string {
    if (score >= 75) {
      return 'Strong investment opportunity with solid financials, good market position, and capable management team.';
    } else if (score >= 60) {
      return 'Moderate investment opportunity with some strengths but requires conditions to mitigate identified risks.';
    } else {
      return 'Investment not recommended due to significant concerns across multiple areas requiring substantial improvement.';
    }
  }

  // ===============================
  // FALLBACK IMPLEMENTATIONS (Simplified)
  // ===============================

  private generateFallbackFinancialAnalysis(profile: FinancialProfile, analysisMode: 'investor' | 'sme'): FinancialHealthAnalysis {
    const baseScore = Math.min(70, Math.max(30, 
      (profile.monthlyRevenue || 0) > 100000 ? 60 : 40
    ));

    if (analysisMode === 'sme') {
      return {
        overallScore: baseScore,
        readinessLevel: baseScore > 60 ? 'nearly_ready' : 'needs_improvement',
        strengthsToHighlight: ['Established revenue base'],
        areasToImprove: ['Document financial projections'],
        applicationTips: ['Present financials clearly with trend analysis'],
        immediateActions: ['Gather 3 years of financial statements'],
        recommendations: ['Strengthen financial documentation'],
        confidence: 60
      };
    }

    return {
      overallScore: baseScore,
      liquidityRisk: 'medium',
      profitabilityTrend: 'stable',
      debtServiceCapability: 'adequate',
      cashFlowStability: 'stable',
      redFlags: [],
      positiveIndicators: ['Positive revenue'],
      recommendations: ['Conduct detailed financial due diligence'],
      confidence: 60
    };
  }

  private generateFallbackMarketAnalysis(businessData: BusinessAssessment, analysisMode: 'investor' | 'sme'): MarketPositionAnalysis {
    if (analysisMode === 'sme') {
      return {
        marketAppealScore: 60,
        fundingAttractiveness: 'moderately_attractive',
        competitiveAdvantages: ['Clear market opportunity'],
        marketOpportunityStory: 'Emerging market with growth potential',
        positioningStrategy: ['Focus on market opportunity'],
        competitivePositioning: 'emerging_competitor',
        applicationTips: ['Document market size and growth'],
        recommendations: ['Conduct market research'],
        confidence: 60
      };
    }

    return {
      competitiveStrength: 'moderate',
      marketOpportunity: 'medium',
      timingAssessment: 'neutral',
      differentiationScore: 50,
      opportunities: [{ opportunity: 'Market expansion', potential: 'medium', timeframe: 'medium_term' }],
      threats: [{ threat: 'Competition', severity: 'medium', probability: 'medium' }],
      recommendations: ['Conduct market research'],
      confidence: 60
    };
  }

  private generateFallbackManagementAnalysis(structure: ManagementStructure, analysisMode: 'investor' | 'sme'): ManagementAnalysis {
    const teamSize = (structure.executiveTeam?.length || 0) + (structure.managementTeam?.length || 0);
    
    if (analysisMode === 'sme') {
      return {
        leadershipReadinessScore: Math.min(70, teamSize * 20),
        teamReadinessLevel: teamSize > 2 ? 'nearly_ready' : 'needs_strengthening',
        leadershipStrengths: ['Committed founding team'],
        presentationTips: ['Highlight team experience'],
        teamStrengthening: ['Consider adding experienced advisors'],
        applicationStrategy: 'Focus on team commitment and vision',
        recommendations: ['Strengthen team profile'],
        confidence: 70
      };
    }

    return {
      leadershipScore: Math.min(70, teamSize * 20),
      experienceDepth: 'adequate',
      teamCompleteness: teamSize > 2 ? 'mostly_complete' : 'gaps_identified',
      governanceQuality: 'weak',
      keyPersonRisk: 'medium',
      strengths: ['Team commitment'],
      weaknesses: ['Limited governance'],
      recommendations: ['Strengthen management team'],
      confidence: 70
    };
  }

  private generateFallbackRiskAnalysis(profile: FundingApplicationProfile, analysisMode: 'investor' | 'sme'): RiskAnalysis {
    if (analysisMode === 'sme') {
      return {
        applicationReadinessScore: 65,
        readinessLevel: 'needs_preparation',
        strengthsToEmphasize: ['Business fundamentals in place'],
        preparationActions: ['Strengthen documentation'],
        positioningAdvice: ['Focus on growth potential'],
        applicationTips: ['Be transparent about challenges'],
        riskMitigationStrategies: ['Regular monitoring'],
        monitoringRecommendations: ['Monthly reviews'],
        confidence: 65
      };
    }

    return {
      overallRiskScore: 50,
      riskCategories: {
        financial: 'medium',
        market: 'medium',
        operational: 'medium',
        management: 'medium',
        regulatory: 'low'
      },
      criticalRisks: [],
      riskMitigationStrategies: ['Regular assessment'],
      monitoringRecommendations: ['Monthly reviews'],
      confidence: 65
    };
  }
}