// src/app/shared/services/business-rules-analysis.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs'; 
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { ApplicationFormData } from 'src/app/SMEs/applications/new-application/models/application-form.model';
 
export interface BusinessRulesResult {
  // Overall scoring
  compatibilityScore: number; // 0-100
  eligibilityStatus: 'eligible' | 'conditional' | 'ineligible';
  
  // Detailed breakdown
  industryAlignment: {
    score: number;
    match: 'strong' | 'moderate' | 'weak' | 'none';
    details: string;
  };
  
  stageCompatibility: {
    score: number;
    match: 'strong' | 'moderate' | 'weak';
    details: string;
  };
  
  financialReadiness: {
    score: number;
    level: 'strong' | 'moderate' | 'weak';
    details: string;
  };
  
  profileCompleteness: {
    score: number;
    percentage: number;
    missingCriticalSections: string[];
    missingOptionalSections: string[];
  };
  
  // Actionable feedback
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
  
  // Risk factors
  riskFlags: Array<{
    category: 'financial' | 'operational' | 'compliance' | 'completeness';
    severity: 'low' | 'medium' | 'high';
    issue: string;
    impact: string;
  }>;
  
  // Analysis metadata
  analysisMode: 'profile_only' | 'opportunity_match';
  generatedAt: Date;
}

 

@Injectable({
  providedIn: 'root'
})
export class BusinessRulesAnalysisService {

  // =======================
  // PUBLIC API
  // =======================

  /**
   * Analyze business profile readiness (standalone mode)
   */
  analyzeProfile(profile: FundingApplicationProfile): Observable<BusinessRulesResult> {
    const result = this.performProfileAnalysis(profile, null, null);
    return of(result);
  }

  /**
   * Analyze application against specific opportunity
   */
  analyzeApplication(
    profile: FundingApplicationProfile, 
    opportunity: FundingOpportunity,
    applicationData: ApplicationFormData
  ): Observable<BusinessRulesResult> {
    
    // Hard reject for amount misalignment
    if (!this.isAmountEligible(applicationData, opportunity)) {
      return of(this.createAmountRejectionResult(applicationData, opportunity));
    }
    
    const result = this.performProfileAnalysis(profile, opportunity, applicationData);
    return of(result);
  }

  // =======================
  // CORE ANALYSIS ENGINE
  // =======================

  private performProfileAnalysis(
    profile: FundingApplicationProfile,
    opportunity: FundingOpportunity | null,
    applicationData: ApplicationFormData | null
  ): BusinessRulesResult {
    
    // Calculate individual scores
    const industryAlignment = this.analyzeIndustryAlignment(profile, opportunity);
    const stageCompatibility = this.analyzeStageCompatibility(profile, opportunity);
    const financialReadiness = this.analyzeFinancialReadiness(profile, opportunity);
    const profileCompleteness = this.analyzeProfileCompleteness(profile);
    
    // Calculate overall compatibility score
    const compatibilityScore = Math.round(
      industryAlignment.score + 
      stageCompatibility.score + 
      financialReadiness.score + 
      profileCompleteness.score
    );
    
    // Determine eligibility status
    const eligibilityStatus = this.determineEligibilityStatus(
      compatibilityScore, 
      profile, 
      opportunity
    );
    
    // Generate actionable insights
    const insights = this.generateInsights(
      profile, 
      opportunity, 
      industryAlignment, 
      stageCompatibility, 
      financialReadiness, 
      profileCompleteness
    );
    
    return {
      compatibilityScore,
      eligibilityStatus,
      industryAlignment,
      stageCompatibility,
      financialReadiness,
      profileCompleteness,
      ...insights,
      analysisMode: opportunity ? 'opportunity_match' : 'profile_only',
      generatedAt: new Date()
    };
  }

  // =======================
  // AMOUNT ELIGIBILITY (HARD REJECT)
  // =======================

  private isAmountEligible(applicationData: ApplicationFormData, opportunity: FundingOpportunity): boolean {
    const requestedAmount = parseFloat(applicationData.requestedAmount);
    
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return false;
    }
    
    return requestedAmount >= opportunity.minInvestment && 
           requestedAmount <= opportunity.maxInvestment;
  }

  private createAmountRejectionResult(
    applicationData: ApplicationFormData, 
    opportunity: FundingOpportunity
  ): BusinessRulesResult {
    const requestedAmount = parseFloat(applicationData.requestedAmount);
    
    let rejectionReason: string;
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      rejectionReason = "Invalid funding amount specified";
    } else if (requestedAmount < opportunity.minInvestment) {
      rejectionReason = `Requested amount (${this.formatCurrency(requestedAmount)}) is below minimum investment of ${this.formatCurrency(opportunity.minInvestment)}`;
    } else {
      rejectionReason = `Requested amount (${this.formatCurrency(requestedAmount)}) exceeds maximum investment of ${this.formatCurrency(opportunity.maxInvestment)}`;
    }

    return {
      compatibilityScore: 0,
      eligibilityStatus: 'ineligible',
      industryAlignment: { score: 0, match: 'none', details: 'Amount eligibility failed' },
      stageCompatibility: { score: 0, match: 'weak', details: 'Amount eligibility failed' },
      financialReadiness: { score: 0, level: 'weak', details: rejectionReason },
      profileCompleteness: { score: 0, percentage: 0, missingCriticalSections: [], missingOptionalSections: [] },
      strengths: [],
      improvementAreas: [`Adjust funding amount to between ${this.formatCurrency(opportunity.minInvestment)} and ${this.formatCurrency(opportunity.maxInvestment)}`],
      recommendations: [
        'Review the opportunity investment range',
        'Consider adjusting your funding requirements',
        'Look for opportunities that match your funding needs'
      ],
      riskFlags: [{
        category: 'financial',
        severity: 'high',
        issue: 'Amount misalignment',
        impact: rejectionReason
      }],
      analysisMode: 'opportunity_match',
      generatedAt: new Date()
    };
  }

  // =======================
  // INDIVIDUAL ANALYZERS
  // =======================

  private analyzeIndustryAlignment(
    profile: FundingApplicationProfile, 
    opportunity: FundingOpportunity | null
  ): BusinessRulesResult['industryAlignment'] {
    
    if (!opportunity) {
      // Profile-only mode: assess industry clarity
      const industry = profile.companyInfo?.industryType;
      if (!industry) {
        return { score: 10, match: 'none', details: 'Industry not specified in profile' };
      }
      return { score: 30, match: 'strong', details: `Industry clearly defined: ${industry}` };
    }
    
    // Opportunity match mode
    const profileIndustry = profile.companyInfo?.industryType?.toLowerCase();
    const targetIndustries = opportunity.eligibilityCriteria?.industries || [];
    
    if (!profileIndustry) {
      return { score: 5, match: 'none', details: 'Industry not specified in profile' };
    }
    
    if (targetIndustries.length === 0) {
      return { score: 25, match: 'moderate', details: 'Opportunity accepts all industries' };
    }
    
    // Direct match
    const directMatch = targetIndustries.some(target => 
      target.toLowerCase().includes(profileIndustry) || 
      profileIndustry.includes(target.toLowerCase())
    );
    
    if (directMatch) {
      return { score: 30, match: 'strong', details: `Strong industry alignment: ${profileIndustry}` };
    }
    
    // Related industry logic
    const relatedMatch = this.checkRelatedIndustries(profileIndustry, targetIndustries);
    if (relatedMatch) {
      return { score: 20, match: 'moderate', details: `Related industry match: ${profileIndustry}` };
    }
    
    return { score: 5, match: 'weak', details: `Industry mismatch: ${profileIndustry} not in target industries` };
  }

  private analyzeStageCompatibility(
    profile: FundingApplicationProfile, 
    opportunity: FundingOpportunity | null
  ): BusinessRulesResult['stageCompatibility'] {
    
    const yearsInOperation = this.calculateYearsInOperation(profile);
    const businessStage = this.determineBusinessStage(profile, yearsInOperation);
    
    if (!opportunity) {
      // Profile-only mode
      return {
        score: 25,
        match: 'strong',
        details: `Business stage: ${businessStage} (${yearsInOperation} years in operation)`
      };
    }
    
    // Opportunity match mode
    const targetStages = opportunity.eligibilityCriteria?.businessStages || [];
    
    if (targetStages.length === 0) {
      return { score: 20, match: 'moderate', details: 'Opportunity accepts all business stages' };
    }
    
    const stageMatch = targetStages.some(stage => 
      stage.toLowerCase() === businessStage.toLowerCase()
    );
    
    if (stageMatch) {
      return { score: 25, match: 'strong', details: `Perfect stage match: ${businessStage}` };
    }
    
    // Adjacent stage compatibility
    const adjacentMatch = this.checkAdjacentStages(businessStage, targetStages);
    if (adjacentMatch) {
      return { score: 15, match: 'moderate', details: `Adjacent stage compatibility: ${businessStage}` };
    }
    
    return { score: 5, match: 'weak', details: `Stage mismatch: ${businessStage} not suitable for this opportunity` };
  }

  private analyzeFinancialReadiness(
    profile: FundingApplicationProfile, 
    opportunity: FundingOpportunity | null
  ): BusinessRulesResult['financialReadiness'] {
    
    const annualRevenue = profile.financialProfile?.monthlyRevenue ? 
      profile.financialProfile.monthlyRevenue * 12 : 0;
    
    const hasFinancials = this.checkFinancialDocuments(profile);
    const financialRatios = this.assessFinancialRatios(profile);
    
    let baseScore = 0;
    let level: 'strong' | 'moderate' | 'weak' = 'weak';
    let details = '';
    
    // Base revenue assessment
    if (annualRevenue > 5000000) {
      baseScore += 15;
      details = `Strong revenue: ${this.formatCurrency(annualRevenue)}`;
    } else if (annualRevenue > 1000000) {
      baseScore += 10;
      details = `Moderate revenue: ${this.formatCurrency(annualRevenue)}`;
    } else if (annualRevenue > 0) {
      baseScore += 5;
      details = `Early revenue: ${this.formatCurrency(annualRevenue)}`;
    } else {
      details = 'Revenue not disclosed or pre-revenue stage';
    }
    
    // Financial documentation bonus
    if (hasFinancials.current && hasFinancials.historical) {
      baseScore += 8;
      details += ' • Complete financial records';
    } else if (hasFinancials.current) {
      baseScore += 5;
      details += ' • Current financials available';
    } else {
      details += ' • Financial documentation missing';
    }
    
    // Financial health assessment
    if (financialRatios.profitMargin > 10) {
      baseScore += 2;
      details += ' • Profitable operations';
    } else if (financialRatios.profitMargin > 0) {
      baseScore += 1;
      details += ' • Break-even operations';
    }
    
    // Opportunity-specific revenue requirements
    if (opportunity) {
      const minRevenue = opportunity.eligibilityCriteria?.minRevenue;
      const maxRevenue = opportunity.eligibilityCriteria?.maxRevenue;
      
      if (minRevenue && annualRevenue < minRevenue) {
        baseScore = Math.max(0, baseScore - 10);
        details += ` • Below minimum revenue requirement (${this.formatCurrency(minRevenue)})`;
      }
      
      if (maxRevenue && annualRevenue > maxRevenue) {
        baseScore = Math.max(0, baseScore - 5);
        details += ` • Above maximum revenue threshold`;
      }
    }
    
    // Determine level
    if (baseScore >= 20) level = 'strong';
    else if (baseScore >= 10) level = 'moderate';
    else level = 'weak';
    
    return { score: Math.min(25, baseScore), level, details };
  }

  private analyzeProfileCompleteness(
    profile: FundingApplicationProfile
  ): BusinessRulesResult['profileCompleteness'] {
    
    const sections = [
      { key: 'companyInfo', name: 'Company Information', critical: true, weight: 4 },
      { key: 'financialProfile', name: 'Financial Profile', critical: true, weight: 4 },
      { key: 'businessStrategy', name: 'Business Strategy', critical: true, weight: 3 },
      { key: 'businessAssessment', name: 'Business Assessment', critical: false, weight: 2 },
      { key: 'managementStructure', name: 'Management Structure', critical: false, weight: 2 },
      { key: 'supportingDocuments', name: 'Supporting Documents', critical: true, weight: 3 },
      { key: 'swotAnalysis', name: 'SWOT Analysis', critical: false, weight: 2 }
    ];
    
    let completedWeight = 0;
    let totalWeight = 0;
    const missingCritical: string[] = [];
    const missingOptional: string[] = [];
    
    sections.forEach(section => {
      const sectionData = (profile as any)[section.key];
      const isComplete = this.isSectionComplete(section.key, sectionData);
      
      totalWeight += section.weight;
      if (isComplete) {
        completedWeight += section.weight;
      } else {
        if (section.critical) {
          missingCritical.push(section.name);
        } else {
          missingOptional.push(section.name);
        }
      }
    });
    
    const percentage = Math.round((completedWeight / totalWeight) * 100);
    let score = Math.round((percentage / 100) * 20);
    
    // Penalize missing critical sections more heavily
    score = Math.max(0, score - (missingCritical.length * 3));
    
    return {
      score,
      percentage,
      missingCriticalSections: missingCritical,
      missingOptionalSections: missingOptional
    };
  }

  // =======================
  // INSIGHT GENERATION
  // =======================

  private generateInsights(
    profile: FundingApplicationProfile,
    opportunity: FundingOpportunity | null,
    industryAlignment: BusinessRulesResult['industryAlignment'],
    stageCompatibility: BusinessRulesResult['stageCompatibility'],
    financialReadiness: BusinessRulesResult['financialReadiness'],
    profileCompleteness: BusinessRulesResult['profileCompleteness']
  ): Pick<BusinessRulesResult, 'strengths' | 'improvementAreas' | 'recommendations' | 'riskFlags'> {
    
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    const recommendations: string[] = [];
    const riskFlags: BusinessRulesResult['riskFlags'] = [];
    
    // Generate strengths
    if (industryAlignment.score >= 20) {
      strengths.push(`Strong industry alignment: ${industryAlignment.details}`);
    }
    if (stageCompatibility.score >= 20) {
      strengths.push(`Business stage well-suited for this type of funding`);
    }
    if (financialReadiness.score >= 15) {
      strengths.push(`Solid financial foundation with documented performance`);
    }
    if (profileCompleteness.score >= 15) {
      strengths.push(`Comprehensive business profile demonstrates preparation`);
    }
    
    // Generate improvement areas and recommendations
    if (profileCompleteness.missingCriticalSections.length > 0) {
      improvementAreas.push(`Complete critical sections: ${profileCompleteness.missingCriticalSections.join(', ')}`);
      recommendations.push('Focus on completing critical profile sections first for better funding readiness');
    }
    
    if (financialReadiness.score < 10) {
      improvementAreas.push('Strengthen financial documentation and performance metrics');
      recommendations.push('Prepare comprehensive financial statements and projections');
      
      riskFlags.push({
        category: 'financial',
        severity: 'medium',
        issue: 'Limited financial documentation',
        impact: 'May require additional due diligence or affect funding terms'
      });
    }
    
    if (industryAlignment.score < 15 && opportunity) {
      improvementAreas.push('Consider opportunities that better align with your industry');
      recommendations.push('Look for funders specializing in your industry sector');
    }
    
    // Generate general recommendations
    if (opportunity) {
      recommendations.push('Review opportunity-specific requirements thoroughly');
      if (stageCompatibility.score < 15) {
        recommendations.push('Consider if your business stage aligns with funder expectations');
      }
    } else {
      recommendations.push('Complete any missing profile sections to improve funding readiness');
      recommendations.push('Consider obtaining professional financial projections if not available');
    }
    
    // Add compliance/operational risks
    if (!profile.companyInfo?.taxComplianceStatus || profile.companyInfo.taxComplianceStatus !== 'compliant') {
      riskFlags.push({
        category: 'compliance',
        severity: 'high',
        issue: 'Tax compliance status unclear',
        impact: 'Essential for most funding applications'
      });
    }
    
    return { strengths, improvementAreas, recommendations, riskFlags };
  }

  // =======================
  // HELPER METHODS
  // =======================

  private determineEligibilityStatus(
    compatibilityScore: number,
    profile: FundingApplicationProfile,
    opportunity: FundingOpportunity | null
  ): BusinessRulesResult['eligibilityStatus'] {
    
    if (compatibilityScore >= 70) return 'eligible';
    if (compatibilityScore >= 40) return 'conditional';
    return 'ineligible';
  }

  private calculateYearsInOperation(profile: FundingApplicationProfile): number {
    const foundingYear = profile.companyInfo?.foundingYear;
    if (!foundingYear) return 0;
    
    return new Date().getFullYear() - foundingYear;
  }

  private determineBusinessStage(profile: FundingApplicationProfile, yearsInOperation: number): string {
    const revenue = profile.financialProfile?.monthlyRevenue ? 
      profile.financialProfile.monthlyRevenue * 12 : 0;
    
    if (yearsInOperation <= 2 || revenue < 500000) return 'startup';
    if (yearsInOperation <= 5 && revenue < 5000000) return 'growth';
    if (revenue >= 5000000) return 'mature';
    return 'early-stage';
  }

  private checkRelatedIndustries(profileIndustry: string, targetIndustries: string[]): boolean {
    const relatedMappings: Record<string, string[]> = {
      'technology': ['fintech', 'software', 'it', 'digital', 'tech'],
      'financial': ['fintech', 'banking', 'insurance', 'investment'],
      'manufacturing': ['automotive', 'industrial', 'production'],
      'healthcare': ['medical', 'pharmaceutical', 'biotech', 'health']
    };
    
    for (const [category, related] of Object.entries(relatedMappings)) {
      if (related.some(r => profileIndustry.includes(r))) {
        return targetIndustries.some(target => 
          target.toLowerCase().includes(category) || related.includes(target.toLowerCase())
        );
      }
    }
    
    return false;
  }

  private checkAdjacentStages(businessStage: string, targetStages: string[]): boolean {
    const stageProgression = ['startup', 'early-stage', 'growth', 'mature'];
    const currentIndex = stageProgression.indexOf(businessStage.toLowerCase());
    
    if (currentIndex === -1) return false;
    
    const adjacentStages = [
      stageProgression[currentIndex - 1],
      stageProgression[currentIndex + 1]
    ].filter(Boolean);
    
    return targetStages.some(target => 
      adjacentStages.includes(target.toLowerCase())
    );
  }

  private checkFinancialDocuments(profile: FundingApplicationProfile): {
    current: boolean;
    historical: boolean;
  } {
    const docs = profile.supportingDocuments;
    return {
      current: !!(docs?.currentYearFinancials || docs?.auditedFinancials?.length),
      historical: !!(docs?.priorYearFinancialYear1 || docs?.priorYearFinancialYear2)
    };
  }

  private assessFinancialRatios(profile: FundingApplicationProfile): {
    profitMargin: number;
    debtToEquity: number;
    currentRatio: number;
  } {
    const financial = profile.financialProfile;
    return {
      profitMargin: financial?.profitMargin || 0,
      debtToEquity: financial?.debtToEquity || 0,
      currentRatio: financial?.currentRatio || 1
    };
  }

  private isSectionComplete(sectionKey: string, sectionData: any): boolean {
    if (!sectionData) return false;
    
    const criticalFields: Record<string, string[]> = {
      'companyInfo': ['companyName', 'registrationNumber', 'industryType'],
      'financialProfile': ['currentAssets', 'monthlyRevenue'],
      'businessStrategy': ['executiveSummary', 'missionStatement'],
      'supportingDocuments': ['companyProfile', 'currentYearFinancials'],
      'businessAssessment': ['businessModel', 'valueProposition'],
      'managementStructure': ['executiveTeam'],
      'swotAnalysis': ['strengths', 'weaknesses']
    };
    
    const required = criticalFields[sectionKey] || [];
    return required.every(field => sectionData[field]);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}