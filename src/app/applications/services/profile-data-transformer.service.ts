// src/app/profile/services/profile-data-transformer.service.ts - FIXED TYPE ISSUES
import { Injectable } from '@angular/core';
 
import { FundingApplicationProfile, BusinessAssessment, ManagementStructure, SWOTAnalysis } from '../models/funding-application.models';
import { ProfileData } from '../models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class ProfileDataTransformerService {

// Transform ProfileData to FundingApplicationProfile for backend persistence
transformToFundingProfile(profileData: Partial<ProfileData>): FundingApplicationProfile {
 return {
   companyInfo: this.transformCompanyInfo(profileData.businessInfo, profileData.personalInfo),
   supportingDocuments: profileData.supportingDocuments || profileData.documents ? 
     this.transformDocuments(profileData.supportingDocuments, profileData.documents) : undefined,
   businessAssessment: this.transformBusinessAssessment(profileData.businessReview),
   swotAnalysis: this.transformSwotAnalysis(profileData.swotAnalysis),
   managementStructure: this.transformManagementStructure(profileData.managementGovernance),
   businessStrategy: this.transformBusinessStrategy(profileData.businessPlan),
   financialProfile: this.transformFinancialProfile(profileData.financialInfo, profileData.financialAnalysis, profileData.fundingInfo)
 };
}

private transformSwotAnalysis(swotAnalysis: any): SWOTAnalysis | undefined {
 if (!swotAnalysis) return undefined;

 return {
   strengths: swotAnalysis.strengths || [],
   weaknesses: swotAnalysis.weaknesses || [],
   opportunities: swotAnalysis.opportunities || [],
   threats: swotAnalysis.threats || [],
   strategicPriorities: swotAnalysis.strategicPriorities || [],
   riskMitigation: swotAnalysis.riskMitigation || [],
   competitiveAdvantages: swotAnalysis.competitiveAdvantages || []
 };
}

  // Transform FundingApplicationProfile back to ProfileData for UI consumption
  transformFromFundingProfile(fundingProfile: FundingApplicationProfile): Partial<ProfileData> {
    return {
      businessInfo: this.extractBusinessInfo(fundingProfile.companyInfo),
      personalInfo: this.extractPersonalInfo(fundingProfile.companyInfo),
      supportingDocuments: fundingProfile.supportingDocuments,
      businessReview: this.extractBusinessReview(fundingProfile.businessAssessment),
      swotAnalysis: fundingProfile.swotAnalysis,
      managementGovernance: this.extractManagementGovernance(fundingProfile.managementStructure),
      businessPlan: this.extractBusinessPlan(fundingProfile.businessStrategy),
      financialInfo: this.extractFinancialInfo(fundingProfile.financialProfile),
      financialAnalysis: this.extractFinancialAnalysis(fundingProfile.financialProfile),
      fundingInfo: this.extractFundingInfo(fundingProfile.financialProfile, fundingProfile.businessStrategy)
    };
  }

  // ===============================
  // TRANSFORM TO BACKEND METHODS
  // ===============================

  private transformBusinessAssessment(businessReview: any): BusinessAssessment | undefined {
    if (!businessReview) return undefined;

    return {
      businessModel: businessReview.businessModel || '',
      valueProposition: businessReview.valueProposition || '',
      targetMarkets: businessReview.targetMarkets || [],
      customerSegments: businessReview.customerSegments || '',
      marketSize: businessReview.marketSize || '',
      competitivePosition: businessReview.competitivePosition || '',
      marketShare: businessReview.marketShare || undefined,
      growthRate: businessReview.growthRate || undefined,
      operationalCapacity: businessReview.operationalCapacity || '',
      supplyChain: businessReview.supplyChain || '',
      technologyUse: businessReview.technologyUse || '',
      qualityStandards: businessReview.qualityStandards || '',
      keyPerformanceIndicators: businessReview.keyPerformanceIndicators || [],
      salesChannels: businessReview.salesChannels || [],
      customerRetention: businessReview.customerRetention || undefined
    };
  }

  private transformManagementStructure(managementGovernance: any): ManagementStructure | undefined {
    if (!managementGovernance) return undefined;

    return {
      executiveTeam: managementGovernance.managementTeam?.map((member: any) => ({
        id: member.id || '',
        fullName: member.fullName || '',
        position: member.role || '',
        qualifications: member.qualification || '',
        experience: member.yearsOfExperience || 0,
        previousRoles: member.previousRoles || '',
        equity: member.equity || undefined
      })) || [],
      managementTeam: managementGovernance.managementTeam || [],
      boardOfDirectors: managementGovernance.boardOfDirectors || [],
      governanceStructure: managementGovernance.governanceStructure || '',
      decisionMakingProcess: managementGovernance.decisionMakingProcess || '',
      reportingStructure: managementGovernance.reportingStructure || '',
      advisors: managementGovernance.advisors || undefined,
      consultants: managementGovernance.consultants || undefined
    };
  }

  private transformBusinessStrategy(businessPlan: any): any {
    if (!businessPlan) return undefined;

    return {
      executiveSummary: businessPlan.executiveSummary || '',
      missionStatement: businessPlan.missionStatement || '',
      visionStatement: businessPlan.visionStatement || '',
      strategicObjectives: businessPlan.strategicObjectives || [],
      marketAnalysis: businessPlan.marketAnalysis || '',
      competitiveStrategy: businessPlan.competitiveStrategy || '',
      pricingStrategy: businessPlan.pricingStrategy || '',
      marketingStrategy: businessPlan.marketingStrategy || '',
      expansionPlans: businessPlan.expansionPlans || '',
      productDevelopment: businessPlan.productDevelopment || '',
      marketEntry: businessPlan.marketEntry || '',
      scalingStrategy: businessPlan.scalingStrategy || '',
      revenueProjections: businessPlan.revenueProjections || [],
      profitabilityTimeline: businessPlan.profitabilityTimeline || '',
      breakEvenAnalysis: businessPlan.breakEvenAnalysis || '',
      returnOnInvestment: businessPlan.returnOnInvestment || '',
      fundingRequirements: businessPlan.fundingRequirements || undefined,
      useOfFunds: businessPlan.useOfFunds || '',
      repaymentStrategy: businessPlan.repaymentStrategy || undefined,
      exitStrategy: businessPlan.exitStrategy || undefined
    };
  }

  private transformCompanyInfo(businessInfo?: ProfileData['businessInfo'], personalInfo?: ProfileData['personalInfo']) {
    if (!businessInfo) return undefined;

    return {
      companyName: businessInfo.companyName || '',
      registrationNumber: businessInfo.registrationNumber || '',
      vatNumber: businessInfo.vatNumber,
      industryType: businessInfo.industry || '',
      businessActivity: businessInfo.industry || '',
      foundingYear: new Date().getFullYear() - (businessInfo.yearsInOperation || 0),
      operationalYears: businessInfo.yearsInOperation || 0,
      companyType: 'pty_ltd' as const,
      ownership: [],
      employeeCount: businessInfo.numberOfEmployees || '',
      registeredAddress: businessInfo.physicalAddress ? {
        street: businessInfo.physicalAddress.street || '',
        city: businessInfo.physicalAddress.city || '',
        province: businessInfo.physicalAddress.province || '',
        postalCode: businessInfo.physicalAddress.postalCode || '',
        country: 'South Africa'
      } : {
        street: '', city: '', province: '', postalCode: '', country: 'South Africa'
      },
      operationalAddress: businessInfo.physicalAddress ? {
        street: businessInfo.physicalAddress.street || '',
        city: businessInfo.physicalAddress.city || '',
        province: businessInfo.physicalAddress.province || '',
        postalCode: businessInfo.physicalAddress.postalCode || '',
        country: 'South Africa'
      } : {
        street: '', city: '', province: '', postalCode: '', country: 'South Africa'
      },
      contactPerson: personalInfo ? {
        fullName: `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
        position: personalInfo.position || '',
        email: personalInfo.email || '',
        phone: personalInfo.phone || '',
        idNumber: personalInfo.idNumber
      } : {
        fullName: '', position: '', email: '', phone: ''
      },
      taxComplianceStatus: 'compliant' as const,
      bbbeeLevel: undefined,
      regulatoryLicenses: []
    };
  }

  private transformDocuments(supportingDocs?: Record<string, any>, legacyDocs?: ProfileData['documents']) {
    const result: any = {};

    if (supportingDocs) {
      Object.assign(result, supportingDocs);
    }

    if (legacyDocs) {
      if (legacyDocs.cipDocument) result.companyProfile = legacyDocs.cipDocument;
      if (legacyDocs.financialStatements) result.currentYearFinancials = legacyDocs.financialStatements;
      if (legacyDocs.bankStatements) result.priorYearFinancialYear1 = legacyDocs.bankStatements;
      if (legacyDocs.managementAccounts) result.assetRegister = legacyDocs.managementAccounts;
      if (legacyDocs.businessPlan) result.businessPlan = legacyDocs.businessPlan;
      if (legacyDocs.taxClearance) result.taxPin = legacyDocs.taxClearance;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  private transformFinancialProfile(
    financialInfo?: ProfileData['financialInfo'], 
    financialAnalysis?: ProfileData['financialAnalysis'],
    fundingInfo?: ProfileData['fundingInfo']
  ) {
    if (!financialInfo && !financialAnalysis && !fundingInfo) return undefined;

    const currentYear = new Date().getFullYear();

    return {
      historicalFinancials: this.buildHistoricalFinancials(financialInfo, financialAnalysis),
      currentAssets: this.parseNumberFromString(financialInfo?.monthlyRevenue) * 12 || 0,
      currentLiabilities: 0,
      netWorth: this.parseNumberFromString(financialInfo?.monthlyRevenue) * 12 - this.parseNumberFromString(financialInfo?.existingDebt) || 0,
      monthlyRevenue: this.parseNumberFromString(financialInfo?.monthlyRevenue) || 0,
      monthlyCosts: 0,
      cashFlow: this.parseNumberFromString(financialInfo?.monthlyRevenue) || 0,
      projectedRevenue: [{
        year: currentYear + 1,
        optimistic: (this.parseNumberFromString(financialInfo?.annualRevenue) || 0) * 1.2,
        realistic: this.parseNumberFromString(financialInfo?.annualRevenue) || 0,
        pessimistic: (this.parseNumberFromString(financialInfo?.annualRevenue) || 0) * 0.8,
        assumptions: 'Based on current performance trends'
      }],
      projectedProfitability: [{
        year: currentYear + 1,
        optimistic: 0.15,
        realistic: this.parseNumberFromString(financialInfo?.profitMargin) / 100 || 0.1,
        pessimistic: 0.05,
        assumptions: 'Conservative profit margin estimates'
      }],
      cashFlowProjections: [],
      profitMargin: this.parseNumberFromString(financialInfo?.profitMargin) || 0,
      debtToEquity: this.calculateDebtToEquity(financialInfo),
      currentRatio: 1.0,
      returnOnAssets: 0.1,
      primaryBank: financialInfo?.bankingDetails?.bankName || '',
      bankingHistory: financialInfo?.bankingDetails?.yearsWithBank || 0,
      creditFacilities: [],
      creditRating: financialInfo?.creditRating
    };
  }

  // ===============================
  // EXTRACT FROM BACKEND METHODS
  // ===============================

  private extractBusinessInfo(companyInfo: any) {
    if (!companyInfo) return undefined;

    return {
      companyName: companyInfo.companyName || '',
      registrationNumber: companyInfo.registrationNumber || '',
      vatNumber: companyInfo.vatNumber,
      industry: companyInfo.industryType || '',
      yearsInOperation: companyInfo.operationalYears || 0,
      numberOfEmployees: companyInfo.employeeCount || '',
      physicalAddress: companyInfo.registeredAddress || {
        street: '', city: '', province: '', postalCode: ''
      }
    };
  }

  private extractPersonalInfo(companyInfo: any) {
    if (!companyInfo?.contactPerson) return undefined;

    const fullNameParts = (companyInfo.contactPerson.fullName || '').split(' ');
    return {
      firstName: fullNameParts[0] || '',
      lastName: fullNameParts.slice(1).join(' ') || '',
      email: companyInfo.contactPerson.email || '',
      phone: companyInfo.contactPerson.phone || '',
      idNumber: companyInfo.contactPerson.idNumber || '',
      position: companyInfo.contactPerson.position || ''
    };
  }

  private extractBusinessReview(businessAssessment: BusinessAssessment | undefined): Record<string, any> | undefined {
    if (!businessAssessment) return undefined;

    return {
      businessModel: businessAssessment.businessModel,
      valueProposition: businessAssessment.valueProposition,
      targetMarkets: businessAssessment.targetMarkets,
      customerSegments: businessAssessment.customerSegments,
      marketSize: businessAssessment.marketSize,
      competitivePosition: businessAssessment.competitivePosition,
      marketShare: businessAssessment.marketShare,
      growthRate: businessAssessment.growthRate,
      operationalCapacity: businessAssessment.operationalCapacity,
      supplyChain: businessAssessment.supplyChain,
      technologyUse: businessAssessment.technologyUse,
      qualityStandards: businessAssessment.qualityStandards,
      keyPerformanceIndicators: businessAssessment.keyPerformanceIndicators,
      salesChannels: businessAssessment.salesChannels,
      customerRetention: businessAssessment.customerRetention
    };
  }

  private extractManagementGovernance(managementStructure: ManagementStructure | undefined) {
    if (!managementStructure) return undefined;

    return {
      managementTeam: managementStructure.managementTeam || [],
      boardOfDirectors: managementStructure.boardOfDirectors || [],
      managementCommittee: [] // Add default empty array to satisfy interface
    };
  }

  private extractBusinessPlan(businessStrategy: any): Record<string, any> | undefined {
    if (!businessStrategy) return undefined;

    return {
      executiveSummary: businessStrategy.executiveSummary,
      missionStatement: businessStrategy.missionStatement,
      visionStatement: businessStrategy.visionStatement,
      strategicObjectives: businessStrategy.strategicObjectives,
      marketAnalysis: businessStrategy.marketAnalysis,
      competitiveStrategy: businessStrategy.competitiveStrategy,
      pricingStrategy: businessStrategy.pricingStrategy,
      marketingStrategy: businessStrategy.marketingStrategy,
      expansionPlans: businessStrategy.expansionPlans,
      productDevelopment: businessStrategy.productDevelopment,
      marketEntry: businessStrategy.marketEntry,
      scalingStrategy: businessStrategy.scalingStrategy,
      revenueProjections: businessStrategy.revenueProjections,
      profitabilityTimeline: businessStrategy.profitabilityTimeline,
      breakEvenAnalysis: businessStrategy.breakEvenAnalysis,
      returnOnInvestment: businessStrategy.returnOnInvestment,
      fundingRequirements: businessStrategy.fundingRequirements,
      useOfFunds: businessStrategy.useOfFunds,
      repaymentStrategy: businessStrategy.repaymentStrategy,
      exitStrategy: businessStrategy.exitStrategy
    };
  }

  private extractFinancialInfo(financialProfile: any) {
    if (!financialProfile) return undefined;

    return {
      monthlyRevenue: financialProfile.monthlyRevenue?.toString() || '',
      annualRevenue: (financialProfile.monthlyRevenue * 12)?.toString() || '',
      profitMargin: financialProfile.profitMargin?.toString() || '',
      existingDebt: '0',
      creditRating: financialProfile.creditRating || '',
      bankingDetails: {
        bankName: financialProfile.primaryBank || '',
        accountType: 'business',
        yearsWithBank: financialProfile.bankingHistory || 0
      }
    };
  }

  private extractFinancialAnalysis(financialProfile: any) {
    if (!financialProfile) return undefined;

    return {
      template: undefined,
      notes: '',
      incomeStatement: [],
      financialRatios: [],
      lastUpdated: new Date().toISOString()
    };
  }

  private extractFundingInfo(financialProfile: any, businessStrategy: any) {
    const fundingReq = businessStrategy?.fundingRequirements;
    
    return {
      amountRequired: fundingReq?.totalAmountRequired?.toString() || '',
      purposeOfFunding: fundingReq?.fundingPurpose || '',
      timelineRequired: fundingReq?.timeline || '',
      repaymentPeriod: fundingReq?.repaymentTerms || '',
      collateralAvailable: !!fundingReq?.collateral,
      collateralDescription: fundingReq?.collateral || undefined
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private parseNumberFromString(value?: string): number {
    if (!value || typeof value !== 'string') return 0;
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  private buildHistoricalFinancials(financialInfo?: ProfileData['financialInfo'], financialAnalysis?: ProfileData['financialAnalysis']) {
    if (!financialInfo) return [];

    const currentYear = new Date().getFullYear();
    const monthlyRevenue = this.parseNumberFromString(financialInfo.monthlyRevenue);
    const annualRevenue = monthlyRevenue * 12;
    const profitMargin = this.parseNumberFromString(financialInfo.profitMargin) / 100;

    return [
      {
        year: currentYear - 2,
        revenue: annualRevenue * 0.8,
        grossProfit: annualRevenue * 0.8 * 0.6,
        netProfit: annualRevenue * 0.8 * profitMargin,
        assets: annualRevenue * 0.8 * 1.2,
        liabilities: annualRevenue * 0.8 * 0.3,
        cashFlow: annualRevenue * 0.8 * profitMargin * 1.2
      },
      {
        year: currentYear - 1,
        revenue: annualRevenue * 0.9,
        grossProfit: annualRevenue * 0.9 * 0.6,
        netProfit: annualRevenue * 0.9 * profitMargin,
        assets: annualRevenue * 0.9 * 1.2,
        liabilities: annualRevenue * 0.9 * 0.3,
        cashFlow: annualRevenue * 0.9 * profitMargin * 1.2
      },
      {
        year: currentYear,
        revenue: annualRevenue,
        grossProfit: annualRevenue * 0.6,
        netProfit: annualRevenue * profitMargin,
        assets: annualRevenue * 1.2,
        liabilities: annualRevenue * 0.3,
        cashFlow: annualRevenue * profitMargin * 1.2
      }
    ];
  }

  private calculateDebtToEquity(financialInfo?: ProfileData['financialInfo']): number {
    if (!financialInfo) return 0;
    
    const debt = this.parseNumberFromString(financialInfo.existingDebt);
    const revenue = this.parseNumberFromString(financialInfo.annualRevenue);
    const equity = revenue * 0.3;
    
    return equity > 0 ? debt / equity : 0;
  }
}