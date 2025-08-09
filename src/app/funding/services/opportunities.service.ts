// src/app/shared/services/opportunities.service.ts
import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs'; 
import { FundingOpportunity } from '../../shared/models/funder.models';

@Injectable({
  providedIn: 'root'
})
export class OpportunitiesService {
  private opportunities = signal<FundingOpportunity[]>([]);

  constructor() {
    this.loadMockData();
  }

  private loadMockData() {
    const mockOpportunities: FundingOpportunity[] = [
      {
        id: 'opp-001',
        fundId: 'fund-001',
        organizationId: 'org-001',
        title: 'Tech Startup Growth Capital',
        description: 'We are looking for innovative technology startups in South Africa that are ready to scale. Our growth capital fund focuses on companies with proven business models, strong management teams, and clear path to profitability. We provide not just funding but also strategic guidance, market access, and operational support to help you reach the next level.',
        shortDescription: 'Growth capital for innovative tech startups ready to scale operations.',
        offerAmount: 2500000,
        minInvestment: 500000,
        maxInvestment: 5000000,
        currency: 'ZAR',
        fundingType: 'equity',
        equityOffered: 15,
        useOfFunds: 'Working capital, team expansion, market development, technology infrastructure',
        investmentStructure: 'Equity investment with board seat and quarterly reporting requirements',
        expectedReturns: 25,
        investmentHorizon: 5,
        exitStrategy: 'Strategic acquisition or IPO within 3-5 years',
        applicationDeadline: new Date('2025-12-31'),
        decisionTimeframe: 45,
        applicationProcess: [
          {
            step: 1,
            name: 'Initial Application',
            description: 'Submit business overview and financials',
            requiredDocuments: ['Business Plan', 'Financial Statements', 'Pitch Deck'],
            timeframe: 7,
            isOptional: false
          },
          {
            step: 2,
            name: 'Due Diligence',
            description: 'Detailed review of business and market',
            requiredDocuments: ['Legal Documents', 'IP Portfolio', 'Customer References'],
            timeframe: 21,
            isOptional: false
          },
          {
            step: 3,
            name: 'Investment Committee',
            description: 'Final approval and term sheet',
            requiredDocuments: [],
            timeframe: 14,
            isOptional: false
          }
        ],
        eligibilityCriteria: {
          industries: ['technology', 'fintech', 'healthtech'],
          businessStages: ['growth', 'early_stage'],
          minRevenue: 1000000,
          maxRevenue: 50000000,
          minYearsOperation: 2,
          geographicRestrictions: ['western_cape', 'gauteng'],
          requiresCollateral: false,
          excludeCriteria: ['gambling', 'tobacco']
        },
        targetCompanyProfile: 'Technology companies with strong growth potential and scalable business models',
        status: 'active',
        totalAvailable: 50000000,
        amountCommitted: 15000000,
        amountDeployed: 8000000,
        maxApplications: 20,
        currentApplications: 12,
        viewCount: 245,
        applicationCount: 18,
        conversionRate: 15,
        dealLead: 'user-001',
        dealTeam: ['user-001', 'user-002'],
        autoMatch: true,
        matchCriteria: {
          industryWeight: 30,
          sizeWeight: 25,
          stageWeight: 20,
          locationWeight: 15,
          readinessWeight: 10,
          riskWeight: 0,
          minMatchScore: 70
        },
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-08-01'),
        publishedAt: new Date('2025-02-01')
      },
      {
        id: 'opp-002',
        fundId: 'fund-002',
        organizationId: 'org-002',
        title: 'Manufacturing Equipment Finance',
        description: 'Specialized debt financing for established manufacturing companies looking to upgrade equipment, expand production capacity, or modernize operations. We understand the capital-intensive nature of manufacturing and offer flexible repayment terms aligned with cash flow cycles.',
        shortDescription: 'Equipment financing for manufacturing companies with flexible terms.',
        offerAmount: 5000000,
        minInvestment: 1000000,
        maxInvestment: 15000000,
        currency: 'ZAR',
        fundingType: 'debt',
        interestRate: 14.5,
        repaymentTerms: '60-month term with seasonal payment adjustments available',
        securityRequired: 'Equipment pledge and corporate guarantee',
        useOfFunds: 'Equipment purchase, facility upgrades, working capital for expansion',
        investmentStructure: 'Senior secured debt with equipment as primary collateral',
        investmentHorizon: 5,
        applicationDeadline: new Date('2025-11-30'),
        decisionTimeframe: 30,
        applicationProcess: [
          {
            step: 1,
            name: 'Application Submission',
            description: 'Submit financial information and equipment specifications',
            requiredDocuments: ['Financial Statements', 'Equipment Quotes', 'Business Plan'],
            timeframe: 5,
            isOptional: false
          },
          {
            step: 2,
            name: 'Credit Assessment',
            description: 'Credit review and equipment valuation',
            requiredDocuments: ['Tax Returns', 'Bank Statements', 'Equipment Appraisal'],
            timeframe: 15,
            isOptional: false
          },
          {
            step: 3,
            name: 'Final Approval',
            description: 'Credit committee approval and documentation',
            requiredDocuments: ['Legal Documents', 'Insurance Policies'],
            timeframe: 10,
            isOptional: false
          }
        ],
        eligibilityCriteria: {
          industries: ['manufacturing', 'automotive', 'food_processing'],
          businessStages: ['established', 'mature'],
          minRevenue: 5000000,
          maxRevenue: 200000000,
          minYearsOperation: 3,
          requiresCollateral: true,
          excludeCriteria: []
        },
        targetCompanyProfile: 'Established manufacturing companies with steady cash flows and equipment financing needs',
        status: 'active',
        totalAvailable: 100000000,
        amountCommitted: 25000000,
        amountDeployed: 18000000,
        maxApplications: 15,
        currentApplications: 8,
        viewCount: 156,
        applicationCount: 11,
        conversionRate: 73,
        dealLead: 'user-003',
        dealTeam: ['user-003', 'user-004'],
        autoMatch: true,
        matchCriteria: {
          industryWeight: 35,
          sizeWeight: 30,
          stageWeight: 15,
          locationWeight: 10,
          readinessWeight: 10,
          riskWeight: 0,
          minMatchScore: 75
        },
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-08-05'),
        publishedAt: new Date('2025-02-15')
      },
      {
        id: 'opp-003',
        fundId: 'fund-003',
        organizationId: 'org-003',
        title: 'Retail Chain Expansion Fund',
        description: 'Mezzanine financing for successful retail businesses looking to expand their footprint across South Africa. We target retailers with proven concepts, strong unit economics, and experienced management teams ready for multi-location growth.',
        shortDescription: 'Mezzanine financing for retail expansion across multiple locations.',
        offerAmount: 8000000,
        minInvestment: 3000000,
        maxInvestment: 20000000,
        currency: 'ZAR',
        fundingType: 'mezzanine',
        interestRate: 16,
        equityOffered: 10,
        repaymentTerms: 'Interest-only for 12 months, then principal and interest over 84 months',
        useOfFunds: 'Store openings, inventory, working capital, marketing campaigns',
        investmentStructure: 'Subordinated debt with equity kicker and conversion rights',
        expectedReturns: 22,
        investmentHorizon: 7,
        exitStrategy: 'Refinancing, acquisition, or equity conversion',
        applicationDeadline: new Date('2025-10-31'),
        decisionTimeframe: 60,
        applicationProcess: [
          {
            step: 1,
            name: 'Concept Review',
            description: 'Evaluate retail concept and expansion plan',
            requiredDocuments: ['Business Plan', 'Store Performance Data', 'Market Analysis'],
            timeframe: 10,
            isOptional: false
          },
          {
            step: 2,
            name: 'Financial Analysis',
            description: 'Detailed financial review and projections',
            requiredDocuments: ['Financial Statements', 'Cash Flow Projections', 'Lease Agreements'],
            timeframe: 30,
            isOptional: false
          },
          {
            step: 3,
            name: 'Management Assessment',
            description: 'Leadership team evaluation and references',
            requiredDocuments: ['Management CVs', 'References', 'Organizational Chart'],
            timeframe: 20,
            isOptional: false
          }
        ],
        eligibilityCriteria: {
          industries: ['retail', 'consumer_goods', 'hospitality'],
          businessStages: ['growth', 'established'],
          minRevenue: 10000000,
          maxRevenue: 100000000,
          minYearsOperation: 3,
          geographicRestrictions: [],
          requiresCollateral: true,
          excludeCriteria: ['online_only']
        },
        targetCompanyProfile: 'Successful retail chains with proven concepts ready for geographic expansion',
        status: 'active',
        totalAvailable: 150000000,
        amountCommitted: 45000000,
        amountDeployed: 28000000,
        currentApplications: 6,
        viewCount: 189,
        applicationCount: 9,
        conversionRate: 67,
        dealLead: 'user-005',
        dealTeam: ['user-005', 'user-006'],
        autoMatch: true,
        matchCriteria: {
          industryWeight: 40,
          sizeWeight: 25,
          stageWeight: 20,
          locationWeight: 5,
          readinessWeight: 10,
          riskWeight: 0,
          minMatchScore: 65
        },
        createdAt: new Date('2025-03-01'),
        updatedAt: new Date('2025-08-03'),
        publishedAt: new Date('2025-03-15')
      },
      {
        id: 'opp-004',
        fundId: 'fund-004',
        organizationId: 'org-004',
        title: 'AgriTech Innovation Grant',
        description: 'Non-dilutive grant funding for agricultural technology companies developing innovative solutions for food security, sustainable farming, and agricultural productivity in Africa. This program supports early-stage companies with breakthrough technologies.',
        shortDescription: 'Non-dilutive grants for agricultural technology innovation.',
        offerAmount: 1000000,
        minInvestment: 250000,
        maxInvestment: 2000000,
        currency: 'ZAR',
        fundingType: 'grant',
        useOfFunds: 'Research and development, prototype development, pilot programs, IP protection',
        investmentStructure: 'Grant funding with milestone-based disbursement',
        applicationDeadline: new Date('2025-09-30'),
        decisionTimeframe: 90,
        applicationProcess: [
          {
            step: 1,
            name: 'Technology Assessment',
            description: 'Evaluate innovation potential and technical feasibility',
            requiredDocuments: ['Technical Proposal', 'Patent Applications', 'Prototype Data'],
            timeframe: 30,
            isOptional: false
          },
          {
            step: 2,
            name: 'Impact Evaluation',
            description: 'Assess potential agricultural and social impact',
            requiredDocuments: ['Impact Statement', 'Market Research', 'Pilot Results'],
            timeframe: 45,
            isOptional: false
          },
          {
            step: 3,
            name: 'Selection Committee',
            description: 'Final review by expert panel',
            requiredDocuments: ['Presentation Materials', 'Reference Letters'],
            timeframe: 15,
            isOptional: false
          }
        ],
        eligibilityCriteria: {
          industries: ['agriculture', 'technology', 'sustainability'],
          businessStages: ['startup', 'early_stage'],
          minYearsOperation: 1,
          requiresCollateral: false,
          excludeCriteria: []
        },
        targetCompanyProfile: 'Early-stage agtech companies with innovative solutions for African agriculture',
        status: 'active',
        totalAvailable: 25000000,
        amountCommitted: 8000000,
        amountDeployed: 3000000,
        maxApplications: 50,
        currentApplications: 23,
        viewCount: 312,
        applicationCount: 31,
        conversionRate: 35,
        dealLead: 'user-007',
        dealTeam: ['user-007', 'user-008'],
        autoMatch: false,
        createdAt: new Date('2025-04-01'),
        updatedAt: new Date('2025-08-07'),
        publishedAt: new Date('2025-04-15')
      },
      {
        id: 'opp-005',
        fundId: 'fund-001',
        organizationId: 'org-001',
        title: 'Export Finance Facility',
        description: 'Trade finance solutions for SMEs looking to expand into international markets. We provide working capital, letters of credit, and export credit insurance to support international trade activities and market expansion.',
        shortDescription: 'Trade finance for SMEs expanding into international markets.',
        offerAmount: 3000000,
        minInvestment: 500000,
        maxInvestment: 10000000,
        currency: 'USD',
        fundingType: 'debt',
        interestRate: 12,
        repaymentTerms: 'Revolving credit facility with 12-month review cycles',
        securityRequired: 'Export receivables and credit insurance',
        useOfFunds: 'Working capital, inventory, export credit insurance, market development',
        investmentStructure: 'Revolving credit facility secured by export receivables',
        investmentHorizon: 3,
        decisionTimeframe: 21,
        applicationProcess: [
          {
            step: 1,
            name: 'Export Readiness Assessment',
            description: 'Evaluate export capability and market knowledge',
            requiredDocuments: ['Export Plan', 'Financial Statements', 'Product Certifications'],
            timeframe: 7,
            isOptional: false
          },
          {
            step: 2,
            name: 'Credit Review',
            description: 'Assess creditworthiness and trade experience',
            requiredDocuments: ['Trade References', 'Bank Statements', 'Export History'],
            timeframe: 14,
            isOptional: false
          }
        ],
        eligibilityCriteria: {
          industries: ['manufacturing', 'agriculture', 'technology', 'consumer_goods'],
          businessStages: ['growth', 'established'],
          minRevenue: 5000000,
          minYearsOperation: 2,
          requiresCollateral: true,
          excludeCriteria: ['services_only']
        },
        targetCompanyProfile: 'Established SMEs with export potential and international market opportunities',
        status: 'active',
        totalAvailable: 75000000,
        amountCommitted: 22000000,
        amountDeployed: 15000000,
        maxApplications: 25,
        currentApplications: 14,
        viewCount: 198,
        applicationCount: 19,
        conversionRate: 58,
        dealLead: 'user-009',
        dealTeam: ['user-009', 'user-010'],
        autoMatch: true,
        matchCriteria: {
          industryWeight: 25,
          sizeWeight: 30,
          stageWeight: 20,
          locationWeight: 5,
          readinessWeight: 20,
          riskWeight: 0,
          minMatchScore: 70
        },
        createdAt: new Date('2025-05-01'),
        updatedAt: new Date('2025-08-06'),
        publishedAt: new Date('2025-05-20')
      }
    ];

    this.opportunities.set(mockOpportunities);
  }

  // Get all opportunities
  getOpportunities(): Observable<FundingOpportunity[]> {
    return of(this.opportunities()).pipe(delay(500));
  }

  // Get opportunities by status
  getOpportunitiesByStatus(status: FundingOpportunity['status']): Observable<FundingOpportunity[]> {
    const filtered = this.opportunities().filter(opp => opp.status === status);
    return of(filtered).pipe(delay(300));
  }

  // Get opportunities by funding type
  getOpportunitiesByType(fundingType: FundingOpportunity['fundingType']): Observable<FundingOpportunity[]> {
    const filtered = this.opportunities().filter(opp => opp.fundingType === fundingType);
    return of(filtered).pipe(delay(300));
  }

  // Get opportunity by id
  getOpportunityById(id: string): Observable<FundingOpportunity | undefined> {
    const opportunity = this.opportunities().find(opp => opp.id === id);
    return of(opportunity).pipe(delay(300));
  }

  // Search opportunities
  searchOpportunities(query: string): Observable<FundingOpportunity[]> {
    const searchTerm = query.toLowerCase();
    const filtered = this.opportunities().filter(opp => 
      opp.title.toLowerCase().includes(searchTerm) ||
      opp.description.toLowerCase().includes(searchTerm) ||
      opp.shortDescription.toLowerCase().includes(searchTerm) ||
      opp.eligibilityCriteria.industries.some(industry => 
        industry.toLowerCase().includes(searchTerm)
      )
    );
    return of(filtered).pipe(delay(500));
  }

  // Filter opportunities by criteria
  filterOpportunities(filters: {
    fundingTypes?: string[];
    industries?: string[];
    minAmount?: number;
    maxAmount?: number;
    currencies?: string[];
  }): Observable<FundingOpportunity[]> {
    let filtered = this.opportunities();

    if (filters.fundingTypes?.length) {
      filtered = filtered.filter(opp => filters.fundingTypes!.includes(opp.fundingType));
    }

    if (filters.industries?.length) {
      filtered = filtered.filter(opp => 
        opp.eligibilityCriteria.industries.some(industry => 
          filters.industries!.includes(industry)
        )
      );
    }

    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(opp => opp.minInvestment >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(opp => opp.maxInvestment <= filters.maxAmount!);
    }

    if (filters.currencies?.length) {
      filtered = filtered.filter(opp => filters.currencies!.includes(opp.currency));
    }

    return of(filtered).pipe(delay(400));
  }

  // Get opportunities for SME matching
  getMatchingOpportunities(smeProfile: {
    industry: string;
    businessStage: string;
    revenue: number;
    yearsOperation: number;
    location: string;
  }): Observable<FundingOpportunity[]> {
    const matched = this.opportunities().filter(opp => {
      const criteria = opp.eligibilityCriteria;
      
      // Check industry match
      const industryMatch = criteria.industries.includes(smeProfile.industry);
      
      // Check business stage match  
      const stageMatch = criteria.businessStages.includes(smeProfile.businessStage);
      
      // Check revenue range
      const revenueMatch = (!criteria.minRevenue || smeProfile.revenue >= criteria.minRevenue) &&
                          (!criteria.maxRevenue || smeProfile.revenue <= criteria.maxRevenue);
      
      // Check years operation
      const yearsMatch = !criteria.minYearsOperation || smeProfile.yearsOperation >= criteria.minYearsOperation;
      
      // Check geographic restrictions
      const locationMatch = !criteria.geographicRestrictions?.length || 
                           criteria.geographicRestrictions.includes(smeProfile.location);
      
      return industryMatch && stageMatch && revenueMatch && yearsMatch && locationMatch && opp.status === 'active';
    });

    return of(matched).pipe(delay(600));
  }

  // Create new opportunity (for funders)
  createOpportunity(opportunity: Partial<FundingOpportunity>): Observable<FundingOpportunity> {
    const newOpportunity: FundingOpportunity = {
      id: `opp-${Date.now()}`,
      fundId: opportunity.fundId || 'fund-001',
      organizationId: opportunity.organizationId || 'org-001',
      currentApplications: 0,
      viewCount: 0,
      applicationCount: 0,
      dealLead: 'current-user',
      dealTeam: ['current-user'],
      amountCommitted: 0,
      amountDeployed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      applicationProcess: opportunity.applicationProcess || [],
      ...opportunity
    } as FundingOpportunity;

    this.opportunities.update(opportunities => [...opportunities, newOpportunity]);
    return of(newOpportunity).pipe(delay(1000));
  }

  // Update opportunity
  updateOpportunity(id: string, updates: Partial<FundingOpportunity>): Observable<FundingOpportunity | null> {
    const index = this.opportunities().findIndex(opp => opp.id === id);
    if (index === -1) {
      return of(null);
    }

    const updatedOpportunity = {
      ...this.opportunities()[index],
      ...updates,
      updatedAt: new Date()
    };

    this.opportunities.update(opportunities => {
      const newOpportunities = [...opportunities];
      newOpportunities[index] = updatedOpportunity;
      return newOpportunities;
    });

    return of(updatedOpportunity).pipe(delay(500));
  }

  // Delete opportunity
  deleteOpportunity(id: string): Observable<boolean> {
    const filtered = this.opportunities().filter(opp => opp.id !== id);
    this.opportunities.set(filtered);
    return of(true).pipe(delay(300));
  }

  // Get analytics data
  getOpportunityAnalytics(id: string): Observable<{
    views: number;
    applications: number;
    conversionRate: number;
    averageApplicationTime: number;
  }> {
    const opportunity = this.opportunities().find(opp => opp.id === id);
    if (!opportunity) {
      return of({
        views: 0,
        applications: 0,
        conversionRate: 0,
        averageApplicationTime: 0
      });
    }

    return of({
      views: opportunity.viewCount,
      applications: opportunity.applicationCount,
      conversionRate: opportunity.conversionRate || 0,
      averageApplicationTime: 12 // days
    }).pipe(delay(400));
  }
}