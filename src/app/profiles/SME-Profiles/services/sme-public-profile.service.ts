// src/app/SMEs/profile/services/sme-public-profile.service.ts
// FIXED: Corrected the filter syntax error (.is to .not)

import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

interface Organization {
  id: string;
  name: string;
  organization_type: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  is_verified: boolean;
}

interface DocumentRow {
  id: string;
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  public_url: string;
  category: string;
  status: 'uploaded' | 'processing' | 'approved' | 'rejected';
  uploaded_at: string;
}

interface PublicProfileDTO {
  organizationId: string;
  organization: Organization | null;
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
  documents: DocumentRow[];
}

interface PublicDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  fileSize: number;
  uploadedAt: Date;
  publicUrl: string;
  verificationStatus: 'uploaded' | 'processing' | 'approved' | 'rejected';
}

interface PublicProfileData {
  slug: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;

  companyName: string;
  industry: string;
  yearsInOperation: number;
  employeeCount: string;
  monthlyRevenue: string;
  requestedFunding: string;

  completionPercentage: number;
  readinessScore: number;
  lastUpdated: Date;

  documents: PublicDocument[];
  dataRoomUrl: string;

  sections: any[];
}

@Injectable({
  providedIn: 'root',
})
export class SMEPublicProfileService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Fetch public profile by slug directly from Supabase
   * FIXED: Corrected filter syntax
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
   * FIXED: Changed .is('slug', 'is not null') to .not('slug', 'is', null)
   */
  private async fetchProfileBySlug(slug: string): Promise<PublicProfileDTO> {
    try {
      console.log(`🔍 Fetching profile for slug: ${slug}`);

      // Step 1: Find organization_id by slug (FIXED: Filter syntax)
      const { data: sectionWithSlug, error: slugError } = await this.supabase
        .from('business_plan_sections')
        .select('organization_id')
        .eq('slug', slug)
        .not('slug', 'is', null)
        .single();

      if (slugError || !sectionWithSlug) {
        throw new Error(
          `Profile not found: ${slugError?.message || 'No slug match'}`
        );
      }

      const organizationId = sectionWithSlug.organization_id;
      console.log(`✅ Found organization: ${organizationId}`);

      // Step 2: Parallel fetch org, sections, and documents
      const [
        { data: organization, error: orgError },
        { data: sections, error: sectionsError },
        { data: documents, error: docsError },
      ] = await Promise.all([
        this.supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single(),
        this.supabase
          .from('business_plan_sections')
          .select('*')
          .eq('organization_id', organizationId)
          .order('updated_at', { ascending: false }),
        this.supabase
          .from('documents')
          .select('*')
          .eq('organization_id', organizationId)
          .in('status', ['approved', 'verified']),
      ]);

      if (orgError) {
        console.warn('Organization not found, continuing with sections only');
      }

      if (sectionsError) {
        throw new Error(
          `Failed to fetch profile sections: ${sectionsError.message}`
        );
      }

      if (docsError) {
        console.warn('Failed to fetch documents:', docsError.message);
      }

      if (!sections || sections.length === 0) {
        throw new Error('Profile sections not found');
      }

      // Step 3: Transform sections into profile DTO
      const dto: PublicProfileDTO = {
        organizationId,
        organization: organization || null,
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
        documents: documents || [],
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

      console.log(
        `✅ Profile loaded: ${sections.length} sections, ${
          documents?.length || 0
        } documents`
      );
      return dto;
    } catch (error) {
      console.error('Error in fetchProfileBySlug:', error);
      throw error;
    }
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

    // Transform documents
    const documents: PublicDocument[] = (dto.documents || []).map(
      (doc: DocumentRow) => ({
        id: doc.id,
        name: doc.original_name,
        type: doc.mime_type.split('/')[1] || 'file',
        category: doc.category,
        fileSize: doc.file_size,
        uploadedAt: new Date(doc.uploaded_at),
        publicUrl: doc.public_url,
        verificationStatus: doc.status,
      })
    );

    // Generate data room URL
    const dataRoomUrl = this.generateDataRoomUrl(dto.organizationId);

    return {
      slug: dto.slug,
      organizationId: dto.organizationId,
      organizationName: dto.organization?.name || 'Organization',
      organizationType: dto.organization?.organization_type || 'sme',

      companyName: businessInfo.companyName || 'Not specified',
      industry: businessInfo.industry || 'Not specified',
      yearsInOperation: businessInfo.yearsInOperation || 0,
      employeeCount: businessInfo.numberOfEmployees || 'Not specified',
      monthlyRevenue: financialInfo.monthlyRevenue || 'Not specified',
      requestedFunding: fundingInfo.amountRequired || 'Not specified',

      completionPercentage,
      readinessScore,
      lastUpdated: new Date(dto.updated_at),

      documents,
      dataRoomUrl,

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

    if (dto.business_info?.companyName) score += 5;
    if (dto.business_info?.registrationNumber) score += 5;
    if (dto.business_info?.industry) score += 5;
    if (dto.business_info?.numberOfEmployees) score += 5;

    const docCount = Object.keys(dto.supporting_documents || {}).length;
    if (docCount > 0) score += 15;

    if (dto.business_review?.businessModel) score += 5;
    if (dto.business_review?.targetMarkets?.length > 0) score += 5;
    if (dto.business_review?.valueProposition) score += 5;

    if (dto.swot_analysis?.strengths?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.weaknesses?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.opportunities?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.threats?.length >= 2) score += 2.5;

    if (dto.management_governance?.managementTeam?.length > 0) score += 10;

    if (dto.business_plan?.missionStatement) score += 5;
    if (dto.business_plan?.strategicObjectives?.length > 0) score += 5;
    if (dto.business_plan?.expansionPlans) score += 5;

    if (dto.financial_info?.monthlyRevenue) score += 7.5;
    if (dto.funding_info?.amountRequired) score += 7.5;

    return Math.round((score / maxScore) * 100);
  }

  private calculateReadiness(dto: PublicProfileDTO): number {
    let score = 0;

    if (dto.business_info?.companyName) score += 5;
    if (dto.business_info?.registrationNumber) score += 5;
    if (dto.business_info?.industry) score += 5;
    if (dto.personal_info?.firstName) score += 5;

    const docCount = Object.keys(dto.supporting_documents || {}).length;
    if (docCount > 0) score += 5;
    if (
      dto.supporting_documents?.companyProfile ||
      dto.supporting_documents?.cipDocument
    )
      score += 5;
    if (dto.supporting_documents?.financialStatements) score += 5;

    if (dto.business_review?.businessModel) score += 5;
    if (dto.business_review?.targetMarkets?.length > 0) score += 5;
    if (dto.business_review?.valueProposition) score += 5;

    if (dto.swot_analysis?.strengths?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.weaknesses?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.opportunities?.length >= 2) score += 2.5;
    if (dto.swot_analysis?.threats?.length >= 2) score += 2.5;

    if (dto.management_governance?.managementTeam?.length > 0) score += 10;

    if (dto.business_plan?.missionStatement) score += 5;
    if (dto.business_plan?.strategicObjectives?.length > 0) score += 5;
    if (dto.business_plan?.expansionPlans) score += 5;

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

  /**
   * Generate data room URL
   */
  private generateDataRoomUrl(organizationId: string): string {
    return `/org/${organizationId}/data-room`;
  }
}
