import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

interface PublicProfileDTO {
  slug: string;
  business_info: any;
  personal_info: any;
  financial_info: any;
  funding_info: any;
  supporting_documents: any;
  business_review: any;
  swot_analysis: any;
  management_governance: any;
  business_plan: any;
  updated_at: string;
}

interface PublicProfileData {
  slug: string;
  companyName: string;
  industry: string;
  yearsInOperation: number;
  employeeCount: string;
  monthlyRevenue: string;
  requestedFunding: string;
  completionPercentage: number;
  readinessScore: number;
  lastUpdated: Date;
  sections: any[];
}

@Injectable({
  providedIn: 'root',
})
export class SMEPublicProfileService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Fetch public profile by slug directly from Supabase
   * Uses RLS policies to ensure public read access
   */
  getPublicProfile(slug: string): Observable<PublicProfileData> {
    return from(this.fetchProfileBySlug(slug)).pipe(
      map((dto) => this.transformToPublicView(dto)),
      catchError((error) => {
        console.error('Failed to fetch public profile:', error);
        return throwError(
          () => new Error(`Profile not found: ${error?.message}`)
        );
      })
    );
  }

  /**
   * Fetch profile from Supabase by slug
   * Gets all sections for the user matching the slug
   */
  private async fetchProfileBySlug(slug: string): Promise<PublicProfileDTO> {
    // First, find the user_id by slug from any section
    const { data: sectionWithSlug, error: slugError } = await this.supabase
      .from('business_plan_sections')
      .select('user_id')
      .eq('slug', slug)
      .single();

    if (slugError || !sectionWithSlug) {
      throw new Error(
        `Profile not found: ${slugError?.message || 'No slug match'}`
      );
    }

    const userId = sectionWithSlug.user_id;

    // Now fetch all sections for this user
    const { data: sections, error } = await this.supabase
      .from('business_plan_sections')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!sections || sections.length === 0) {
      throw new Error('Profile sections not found');
    }

    // Transform sections into profile DTO
    const dto: PublicProfileDTO = {
      slug,
      business_info: {},
      personal_info: {},
      financial_info: {},
      funding_info: {},
      supporting_documents: {},
      business_review: {},
      swot_analysis: {},
      management_governance: {},
      business_plan: {},
      updated_at: sections[0]?.updated_at || new Date().toISOString(),
    };

    // Map each section to corresponding DTO field
    sections.forEach((section: any) => {
      switch (section.section_type) {
        case 'company-info':
          dto.business_info = section.data;
          break;
        case 'documents':
          dto.supporting_documents = section.data;
          break;
        case 'business-assessment':
          dto.business_review = section.data;
          break;
        case 'swot-analysis':
          dto.swot_analysis = section.data;
          break;
        case 'management':
          dto.management_governance = section.data;
          break;
        case 'business-strategy':
          dto.business_plan = section.data;
          break;
        case 'financial-profile':
          dto.financial_info = section.data;
          break;
      }
    });

    return dto;
  }

  /**
   * Transform backend DTO to public view format
   */
  private transformToPublicView(dto: PublicProfileDTO): PublicProfileData {
    const businessInfo = dto.business_info || {};
    const financialInfo = dto.financial_info || {};
    const fundingInfo = dto.funding_info || {};
    const supportingDocuments = dto.supporting_documents || {};
    const businessReview = dto.business_review || {};
    const swotAnalysis = dto.swot_analysis || {};
    const managementGovernance = dto.management_governance || {};
    const businessPlan = dto.business_plan || {};

    const completionPercentage = this.calculateCompletion(dto);
    const readinessScore = this.calculateReadiness(dto);

    return {
      slug: dto.slug,
      companyName: businessInfo.companyName || 'Not specified',
      industry: businessInfo.industry || 'Not specified',
      yearsInOperation: businessInfo.yearsInOperation || 0,
      employeeCount: businessInfo.numberOfEmployees || 'Not specified',
      monthlyRevenue: financialInfo.monthlyRevenue || 'Not specified',
      requestedFunding: fundingInfo.amountRequired || 'Not specified',
      completionPercentage,
      readinessScore,
      lastUpdated: new Date(dto.updated_at),
      sections: [
        this.buildCompanyInfoSection(businessInfo),
        this.buildDocumentsSection(supportingDocuments),
        this.buildBusinessAssessmentSection(businessReview),
        this.buildSwotSection(swotAnalysis),
        this.buildManagementSection(managementGovernance),
        this.buildStrategySection(businessPlan),
        this.buildFinancialSection(financialInfo, fundingInfo),
      ],
    };
  }

  // ===== SECTION BUILDERS =====

  private buildCompanyInfoSection(businessInfo: any) {
    return {
      stepId: 'company-info',
      title: 'Company Information',
      completed: !!businessInfo.companyName,
      completionPercentage: this.calculateSectionCompletion([
        businessInfo.companyName,
        businessInfo.registrationNumber,
        businessInfo.industry,
      ]),
      keyData: [
        {
          label: 'Company Name',
          value: businessInfo.companyName || 'Not provided',
        },
        {
          label: 'Registration',
          value: businessInfo.registrationNumber || 'Not provided',
        },
        { label: 'Industry', value: businessInfo.industry || 'Not provided' },
        {
          label: 'Years Operating',
          value: businessInfo.yearsInOperation
            ? `${businessInfo.yearsInOperation}`
            : 'Not provided',
        },
        {
          label: 'Employees',
          value: businessInfo.numberOfEmployees || 'Not provided',
        },
      ],
    };
  }

  private buildDocumentsSection(docs: any) {
    const docCount = Object.keys(docs).length;
    return {
      stepId: 'documents',
      title: 'Supporting Documents',
      completed: docCount > 0,
      completionPercentage: docCount > 0 ? 100 : 0,
      keyData: [
        { label: 'Documents Uploaded', value: `${docCount} files` },
        {
          label: 'Company Registration',
          value:
            docs.companyProfile || docs.cipDocument ? 'Yes' : 'Not provided',
        },
        {
          label: 'Financial Statements',
          value: docs.financialStatements ? 'Yes' : 'Not provided',
        },
        {
          label: 'Tax Compliance',
          value: docs.taxPin || docs.taxClearance ? 'Yes' : 'Not provided',
        },
      ],
    };
  }

  private buildBusinessAssessmentSection(assessment: any) {
    return {
      stepId: 'business-assessment',
      title: 'Business Assessment',
      completed: !!assessment.businessModel,
      completionPercentage: this.calculateSectionCompletion([
        assessment.businessModel,
        assessment.targetMarkets?.length,
        assessment.valueProposition,
      ]),
      keyData: [
        {
          label: 'Business Model',
          value: assessment.businessModel || 'Not defined',
        },
        {
          label: 'Target Markets',
          value: assessment.targetMarkets?.length
            ? `${assessment.targetMarkets.length} markets`
            : 'Not specified',
        },
        {
          label: 'Value Proposition',
          value: assessment.valueProposition || 'Not defined',
        },
      ],
    };
  }

  private buildSwotSection(swot: any) {
    return {
      stepId: 'swot-analysis',
      title: 'SWOT Analysis',
      completed:
        (swot.strengths?.length || 0) >= 2 &&
        (swot.weaknesses?.length || 0) >= 2 &&
        (swot.opportunities?.length || 0) >= 2 &&
        (swot.threats?.length || 0) >= 2,
      completionPercentage: this.calculateSwotCompletion(swot),
      keyData: [
        {
          label: 'Strengths',
          value: `${swot.strengths?.length || 0} identified`,
        },
        {
          label: 'Weaknesses',
          value: `${swot.weaknesses?.length || 0} identified`,
        },
        {
          label: 'Opportunities',
          value: `${swot.opportunities?.length || 0} identified`,
        },
        { label: 'Threats', value: `${swot.threats?.length || 0} identified` },
      ],
    };
  }

  private buildManagementSection(management: any) {
    return {
      stepId: 'management',
      title: 'Management & Governance',
      completed: (management.managementTeam?.length || 0) > 0,
      completionPercentage:
        (management.managementTeam?.length || 0) > 0 ? 100 : 0,
      keyData: [
        {
          label: 'Management Team',
          value: `${management.managementTeam?.length || 0} members`,
        },
        {
          label: 'Board of Directors',
          value: `${management.boardOfDirectors?.length || 0} members`,
        },
      ],
    };
  }

  private buildStrategySection(strategy: any) {
    return {
      stepId: 'business-strategy',
      title: 'Business Strategy',
      completed: !!strategy.missionStatement,
      completionPercentage: this.calculateSectionCompletion([
        strategy.missionStatement,
        strategy.strategicObjectives?.length,
        strategy.expansionPlans,
      ]),
      keyData: [
        {
          label: 'Mission Statement',
          value: strategy.missionStatement ? 'Defined' : 'Not defined',
        },
        {
          label: 'Strategic Objectives',
          value:
            strategy.strategicObjectives?.length > 0
              ? `${strategy.strategicObjectives.length} objectives`
              : 'Not defined',
        },
        {
          label: 'Growth Strategy',
          value: strategy.expansionPlans ? 'Defined' : 'Not defined',
        },
      ],
    };
  }

  private buildFinancialSection(financial: any, fundingInfo: any) {
    return {
      stepId: 'financial-profile',
      title: 'Financial Profile',
      completed: !!financial.monthlyRevenue && !!fundingInfo.amountRequired,
      completionPercentage: this.calculateSectionCompletion([
        financial.monthlyRevenue,
        financial.monthlyExpenses,
        fundingInfo.amountRequired,
        fundingInfo.purposeOfFunding,
      ]),
      keyData: [
        {
          label: 'Monthly Revenue',
          value: `R${financial.monthlyRevenue || '0'}`,
        },
        {
          label: 'Monthly Expenses',
          value: `R${financial.monthlyExpenses || '0'}`,
        },
        {
          label: 'Funding Requested',
          value: `R${fundingInfo.amountRequired || '0'}`,
        },
        {
          label: 'Purpose of Funding',
          value: fundingInfo.purposeOfFunding || 'Not specified',
        },
      ],
    };
  }

  // ===== CALCULATION HELPERS =====

  private calculateCompletion(dto: PublicProfileDTO): number {
    let score = 0;
    const maxScore = 100;

    // Company info (20 points)
    if (dto.business_info?.companyName) score += 5;
    if (dto.business_info?.registrationNumber) score += 5;
    if (dto.business_info?.industry) score += 5;
    if (dto.business_info?.numberOfEmployees) score += 5;

    // Documents (15 points)
    const docCount = Object.keys(dto.supporting_documents || {}).length;
    if (docCount > 0) score += 15;

    // Business assessment (15 points)
    if (dto.business_review?.businessModel) score += 5;
    if (dto.business_review?.targetMarkets?.length > 0) score += 5;
    if (dto.business_review?.valueProposition) score += 5;

    // SWOT (10 points)
    if (dto.swot_analysis?.strengths?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.weaknesses?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.opportunities?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.threats?.length >= 2) score += 2.5;

    // Management (10 points)
    if (dto.management_governance?.managementTeam?.length > 0) score += 10;

    // Strategy (15 points)
    if (dto.business_plan?.missionStatement) score += 5;
    if (dto.business_plan?.strategicObjectives?.length > 0) score += 5;
    if (dto.business_plan?.expansionPlans) score += 5;

    // Financial (15 points)
    if (dto.financial_info?.monthlyRevenue) score += 7.5;
    if (dto.funding_info?.amountRequired) score += 7.5;

    return Math.round((score / maxScore) * 100);
  }

  private calculateReadiness(dto: PublicProfileDTO): number {
    let score = 0;

    // Company info (20 points)
    if (dto.business_info?.companyName) score += 5;
    if (dto.business_info?.registrationNumber) score += 5;
    if (dto.business_info?.industry) score += 5;
    if (dto.personal_info?.firstName) score += 5;

    // Documents (15 points)
    const docCount = Object.keys(dto.supporting_documents || {}).length;
    if (docCount > 0) score += 5;
    if (
      dto.supporting_documents?.companyProfile ||
      dto.supporting_documents?.cipDocument
    )
      score += 5;
    if (dto.supporting_documents?.financialStatements) score += 5;

    // Business assessment (15 points)
    if (dto.business_review?.businessModel) score += 5;
    if (dto.business_review?.targetMarkets?.length > 0) score += 5;
    if (dto.business_review?.valueProposition) score += 5;

    // SWOT (10 points)
    if (dto.swot_analysis?.strengths?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.weaknesses?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.opportunities?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.threats?.length >= 2) score += 2.5;

    // Management (10 points)
    if (dto.management_governance?.managementTeam?.length > 0) score += 10;

    // Strategy (15 points)
    if (dto.business_plan?.missionStatement) score += 5;
    if (dto.business_plan?.strategicObjectives?.length > 0) score += 5;
    if (dto.business_plan?.expansionPlans) score += 5;

    // Financial (15 points)
    if (dto.financial_info?.monthlyRevenue) score += 5;
    if (dto.funding_info?.amountRequired) score += 5;
    if (dto.funding_info?.purposeOfFunding) score += 5;

    return Math.round(score);
  }

  private calculateSectionCompletion(fields: any[]): number {
    if (fields.length === 0) return 0;
    const completed = fields.filter(
      (f) => f && (!Array.isArray(f) || f.length > 0)
    ).length;
    return Math.round((completed / fields.length) * 100);
  }

  private calculateSwotCompletion(swot: any): number {
    let completed = 0;
    if (swot.strengths?.length >= 2) completed++;
    if (swot.weaknesses?.length >= 2) completed++;
    if (swot.opportunities?.length >= 2) completed++;
    if (swot.threats?.length >= 2) completed++;
    return (completed / 4) * 100;
  }
}
