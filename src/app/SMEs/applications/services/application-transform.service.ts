import { Injectable, inject } from '@angular/core';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { OpportunityApplication } from 'src/app/SMEs/profile/models/sme-profile.models';

export interface TransformedApplication {
  id: string;
  title: string;
  applicationNumber?: string;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'withdrawn';
  fundingType?: string[];
  requestedAmount: number;
  currency: string;
  currentStage?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  // For funder view
  applicantName?: string;
  applicantCompany?: string;
  opportunityTitle?: string;
  // For SME view
  opportunityId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationTransformService {
  /**
   * Extract requested amount from application data
   * SME: form_data.requestedAmount (root level)
   * Funder: formData.requestedAmount or formData.coverInformation.requestedAmount
   */
  extractRequestedAmount(
    data: Record<string, any> | any,
    context?: string
  ): number {
    if (!data) {
      console.warn(
        `[ApplicationTransform] Missing data${context ? ` (${context})` : ''}`
      );
      return 0;
    }

    // Primary: root level (SME form_data structure)
    if (data.requestedAmount || data.requestedAmount === 0) {
      return this.parseAmount(data.requestedAmount);
    }

    // Fallback: nested under coverInformation (alternative structure)
    if (
      data.coverInformation?.requestedAmount ||
      data.coverInformation?.requestedAmount === 0
    ) {
      return this.parseAmount(data.coverInformation.requestedAmount);
    }

    console.warn(
      `[ApplicationTransform] Could not extract requestedAmount${
        context ? ` (${context})` : ''
      } - returning 0`
    );
    return 0;
  }

  /**
   * Parse amount safely (handles string or number)
   */
  private parseAmount(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Transform SME OpportunityApplication to unified format
   */
  transformSMEApplication(app: OpportunityApplication): TransformedApplication {
    const rawFundingType = app.opportunity?.fundingType;

    return {
      id: app.id,
      title: app.title,
      applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
      status: app.status,
      fundingType: Array.isArray(rawFundingType)
        ? rawFundingType
        : rawFundingType
        ? [rawFundingType]
        : [],
      requestedAmount: this.extractRequestedAmount(
        app.coverInformation,
        `SME:${app.id}`
      ),
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.getStageDisplayName(app.stage),
      description: app.description || app.coverInformation.purposeStatement,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      opportunityId: app.opportunityId,
      opportunityTitle: app.opportunity?.title,
    };
  }

  /**
   * Transform Funder FundingApplication to unified format
   */
  transformFunderApplication(app: FundingApplication): TransformedApplication {
    const rawFundingType = app.opportunity?.fundingType;

    return {
      id: app.id,
      title: app.title,
      status: app.status,
      fundingType: Array.isArray(rawFundingType)
        ? rawFundingType
        : rawFundingType
        ? [rawFundingType]
        : [],
      requestedAmount: this.extractRequestedAmount(
        app.formData,
        `Funder:${app.id}`
      ),
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.getStageDisplayName(app.stage),
      description: app.description,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      applicantName: `${app.applicant?.firstName || ''} ${
        app.applicant?.lastName || ''
      }`.trim(),
      applicantCompany: app.applicant?.companyName,
      opportunityTitle: app.opportunity?.title,
    };
  }

  /**
   * Get human-readable stage name
   */
  private getStageDisplayName(stage: string): string {
    const stageMap: Record<string, string> = {
      initial_review: 'Initial Review',
      due_diligence: 'Due Diligence',
      investment_committee: 'Investment Committee',
      documentation: 'Documentation',
      completed: 'Completed',
    };
    return (
      stageMap[stage] ||
      stage.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }
}
