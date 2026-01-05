import { Injectable } from '@angular/core';
import { KapifyReports } from './kapify-reports.interface';
import {
  EnrichedApplication,
  FinancialProfileData,
} from './kapify-reports-repository.service';

@Injectable({
  providedIn: 'root',
})
export class KapifyReportsTransformerService {
  /**
   * Transform enriched application to KapifyReports format
   */
  transformToReport(
    enriched: EnrichedApplication,
    rowIndex: number
  ): KapifyReports {
    const app = enriched.application;
    const user = enriched.user;
    const companyInfo = enriched.companyInfo;
    const opportunity = enriched.opportunity;
    const financialProfile = enriched.financialProfile;
    const formData = app.formData || {};

    console.log(`🔄 [TRANSFORM] Transforming application: ${app.id}`);

    try {
      const report: KapifyReports = {
        // Sequential identifier
        no: rowIndex,

        // Company Details Section
        nameOfBusiness: companyInfo?.companyName || '',
        industry: companyInfo?.industryType || '',
        physicalAddress: this.formatAddress(companyInfo?.registeredAddress),
        businessDetails:
          formData['purposeStatement'] ||
          companyInfo?.businessActivity ||
          app.description ||
          '',
        businessStage: this.mapBusinessStage(companyInfo?.companyType),
        yearsInOperation: companyInfo?.operationalYears || 0,
        numberOfEmployees: this.parseNumber(companyInfo?.employeeCount),
        bbbeeLeve: (companyInfo?.bbbeeLevel as any) || undefined,
        province: companyInfo?.registeredAddress?.province || '',
        priorYearAnnualRevenue:
          this.calculateAnnualRevenue(financialProfile) || 0,

        // Contact Person Details Section
        firstName: this.extractFirstName(user?.first_name || ''),
        surname: this.extractLastName(
          user?.last_name || '',
          companyInfo?.contactPerson?.fullName || ''
        ),
        email: user?.email || companyInfo?.contactPerson?.email || '',
        phoneNumber: companyInfo?.contactPerson?.phone || '',
        role: companyInfo?.contactPerson?.position || '',

        // Funding Details Section
        amountRequested: this.parseNumber(formData['requestedAmount']) || 0,
        fundingType: this.mapFundingType(opportunity?.funding_type),
        fundingOpportunity: opportunity?.title || '',
        useOfFunds: formData['useOfFunds'] || '',
        applicationStatus: this.mapApplicationStatus(app.status),
      };

      console.log(
        `✅ [TRANSFORM] Application transformed: ${report.nameOfBusiness}`
      );
      return report;
    } catch (error) {
      console.error(`❌ [TRANSFORM] Error transforming application:`, error);
      throw error;
    }
  }

  /**
   * Transform batch of enriched applications
   */
  transformBatch(enrichedApplications: EnrichedApplication[]): KapifyReports[] {
    console.log(
      `🔄 [TRANSFORM] Transforming batch of ${enrichedApplications.length} applications`
    );

    try {
      const reports = enrichedApplications.map((enriched, index) =>
        this.transformToReport(enriched, index + 1)
      );

      console.log(
        `✅ [TRANSFORM] Batch transformed successfully: ${reports.length} reports`
      );
      return reports;
    } catch (error) {
      console.error('❌ [TRANSFORM] Error transforming batch:', error);
      throw error;
    }
  }

  // ===============================
  // MAPPING & FORMATTING METHODS
  // ===============================

  /**
   * Format address as string
   */
  private formatAddress(address?: any): string {
    if (!address) return '';

    const parts = [
      address.street,
      address.city,
      address.province,
      address.postalCode,
    ].filter((part) => part && part.trim());

    return parts.join(', ');
  }

  /**
   * Map business stage from company type
   */
  private mapBusinessStage(
    companyType?: string
  ):
    | 'Pre-Launch'
    | 'Startup'
    | 'Early Growth'
    | 'Growth'
    | 'Mature'
    | 'Expansion' {
    const stageMap: Record<string, any> = {
      pty_ltd: 'Growth',
      close_corporation: 'Growth',
      sole_proprietor: 'Startup',
      partnership: 'Early Growth',
      npo: 'Early Growth',
    };

    return stageMap[companyType || ''] || 'Growth';
  }

  /**
   * Parse number from string or number
   */
  private parseNumber(value?: string | number): number {
    if (!value) return 0;

    if (typeof value === 'number') {
      return value;
    }

    // Remove non-numeric characters except decimal point
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate annual revenue from monthly
   */
  private calculateAnnualRevenue(
    financialProfile?: FinancialProfileData | null
  ): number {
    if (!financialProfile?.monthlyRevenue) return 0;

    const monthly = this.parseNumber(financialProfile.monthlyRevenue);
    return monthly * 12;
  }

  /**
   * Extract first name from user data
   */
  private extractFirstName(firstName: string): string {
    if (!firstName) return '';

    // If it's a full name, extract first part
    const parts = firstName.split(' ');
    return parts[0] || '';
  }

  /**
   * Extract last name with fallback to contact person
   */
  private extractLastName(lastName: string, contactFullName?: string): string {
    if (lastName && lastName.trim()) {
      return lastName;
    }

    if (!contactFullName) return '';

    // Extract from contact person's full name
    const parts = contactFullName.split(' ');
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }

    return '';
  }

  /**
   * Map funding type array to first type string
   */
  private mapFundingType(
    fundingTypes?: string[]
  ): 'Equity' | 'Debt' | 'Grant' | 'Hybrid' {
    if (!fundingTypes || fundingTypes.length === 0) {
      return 'Hybrid';
    }

    const typeMap: Record<string, any> = {
      equity: 'Equity',
      debt: 'Debt',
      grant: 'Grant',
      convertible: 'Hybrid',
      mezzanine: 'Hybrid',
      revenue_share: 'Hybrid',
      invoice_financing: 'Debt',
      purchase_order: 'Debt',
    };

    // Map first funding type, default to Hybrid if multiple
    const firstType = fundingTypes[0]?.toLowerCase();
    return typeMap[firstType] || 'Hybrid';
  }

  /**
   * Map application status to report status
   */
  private mapApplicationStatus(
    status?: string
  ):
    | 'Draft'
    | 'Submitted'
    | 'Review'
    | 'Under Review'
    | 'Approved'
    | 'Rejected'
    | 'Withdrawn' {
    const statusMap: Record<string, any> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };

    return statusMap[status || 'draft'] || 'Draft';
  }

  /**
   * Get status display color for UI
   */
  getStatusColor(status: KapifyReports['applicationStatus']): string {
    const colorMap: Record<string, string> = {
      Draft: 'bg-slate-100 text-slate-700',
      Submitted: 'bg-blue-100 text-blue-700',
      Review: 'bg-amber-100 text-amber-700',
      'Under Review': 'bg-amber-100 text-amber-700',
      Approved: 'bg-green-100 text-green-700',
      Rejected: 'bg-red-100 text-red-700',
      Withdrawn: 'bg-gray-100 text-gray-700',
    };

    return colorMap[status] || 'bg-slate-100 text-slate-700';
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    if (isNaN(amount)) return '0';

    const formatted = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    return formatted;
  }

  /**
   * Format number with thousands separator
   */
  formatNumber(value: number): string {
    if (isNaN(value)) return '0';

    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
