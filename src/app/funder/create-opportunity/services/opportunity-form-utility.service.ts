// import { Injectable } from '@angular/core';
// import { FundingOpportunity, OpportunityFormData } from '../shared/funding.interfaces';

// /**
//  * OpportunityFormUtilityService
//  * Handles data transformation, validation, and error parsing for opportunity forms
//  * Keeps component clean by centralizing business logic
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class OpportunityFormUtilityService {
//   /**
//    * Parse number value, handling strings with commas/spaces
//    */
//   parseNumberValue(value: string | number | undefined): number {
//     if (typeof value === 'number') return value;
//     if (!value) return 0;
//     const cleaned = String(value).replace(/[^\d.]/g, '');
//     return parseFloat(cleaned) || 0;
//   }

//   /**
//    * Validate investment amount bounds
//    * Ensures min <= typical <= max with sensible defaults
//    */
//   validateInvestmentBounds(
//     minInv: number,
//     typicalInv: number,
//     maxInv: number
//   ): {
//     min: number;
//     typical: number;
//     max: number;
//   } {
//     const validatedMin = Math.max(1, minInv || 1);
//     const validatedMax = Math.max(validatedMin, maxInv || typicalInv);
//     const validatedTypical = Math.max(
//       validatedMin,
//       Math.min(typicalInv, validatedMax)
//     );

//     return {
//       min: validatedMin,
//       typical: validatedTypical,
//       max: validatedMax,
//     };
//   }

//   /**
//    * Validate all required fields for publishing
//    * Returns null if valid, error message if invalid
//    */
//   validateRequiredFields(data: OpportunityFormData): string | null {
//     if (!data.title?.trim()) {
//       return 'Opportunity title is required.';
//     }
//     if (!data.description?.trim()) {
//       return 'Full description is required.';
//     }
//     if (!data.fundingType) {
//       return 'Funding type must be selected.';
//     }
//     if (
//       !data.typicalInvestment ||
//       this.parseNumberValue(data.typicalInvestment) <= 0
//     ) {
//       return 'Typical investment must be specified and greater than zero.';
//     }
//     if (!data.decisionTimeframe) {
//       return 'Decision timeframe must be specified.';
//     }
//     return null;
//   }

//   /**
//    * Extract error message from various error formats
//    * Handles Supabase errors, validation errors, and generic errors
//    */
//   extractErrorMessage(error: any): string {
//     if (error?.error?.message) return error.error.message;
//     if (error?.message) return error.message;
//     if (error?.details) return error.details;

//     if (error?.hint) {
//       return `${error.hint} Please check your data and try again.`;
//     }

//     if (error?.code) {
//       return this.getErrorMessageByCode(error.code);
//     }

//     return 'An unexpected error occurred while publishing. Please try again.';
//   }

//   /**
//    * Map Supabase error codes to user-friendly messages
//    */
//   private getErrorMessageByCode(code: string): string {
//     const errorCodeMap: Record<string, string> = {
//       PGRST: 'Database connection error. Please try again.',
//       '23505': 'This opportunity already exists. Please use a different title.',
//       '23503': 'Referenced organization or fund not found.',
//       '42601': 'Invalid data format. Please review your inputs.',
//       '42883': 'Database configuration error. Please contact support.',
//     };

//     for (const [errorCode, message] of Object.entries(errorCodeMap)) {
//       if (code.includes(errorCode)) {
//         return message;
//       }
//     }

//     return `Error code ${code}: Unable to publish. Please try again.`;
//   }

//   /**
//    * Build complete opportunity data object from form data
//    * Includes validation and normalization of all fields
//    */
//   buildOpportunityData(
//     formData: OpportunityFormData,
//     organizationId: string
//   ): {
//     isValid: boolean;
//     error?: string;
//     data?: Partial<FundingOpportunity>;
//   } {
//     // Validate required fields first
//     const validationError = this.validateRequiredFields(formData);
//     if (validationError) {
//       return { isValid: false, error: validationError };
//     }

//     // Validate investment bounds
//     const typicalInv = this.parseNumberValue(formData.typicalInvestment) || 1;
//     const minInv = this.parseNumberValue(formData.minInvestment) || 1;
//     const maxInv = this.parseNumberValue(formData.maxInvestment) || typicalInv;

//     const { min, typical, max } = this.validateInvestmentBounds(
//       minInv,
//       typicalInv,
//       maxInv
//     );

//     const opportunityData: Partial<FundingOpportunity> = {
//       title: formData.title.trim(),
//       description: formData.description.trim(),
//       shortDescription: formData.shortDescription.trim(),

//       fundingOpportunityImageUrl:
//         formData.fundingOpportunityImageUrl?.trim() || undefined,
//       fundingOpportunityVideoUrl:
//         formData.fundingOpportunityVideoUrl?.trim() || undefined,
//       funderOrganizationName:
//         formData.funderOrganizationName?.trim() || undefined,
//       funderOrganizationLogoUrl:
//         formData.funderOrganizationLogoUrl?.trim() || undefined,

//       fundId: organizationId,
//       organizationId: organizationId,

//       offerAmount: max,
//       minInvestment: min,
//       maxInvestment: max,
//       totalAvailable: typical,

//       investmentCriteria:
//         formData.investmentCriteria?.length > 0
//           ? formData.investmentCriteria
//           : undefined,
//       exclusionCriteria:
//         formData.exclusionCriteria?.length > 0
//           ? formData.exclusionCriteria
//           : undefined,
//       targetIndustries: formData.targetIndustries,
//       businessStages: formData.businessStages,
//       minRevenue: formData.minRevenue,
//       maxRevenue: formData.maxRevenue,
//       minYearsOperation: formData.minYearsOperation,
//       geographicRestrictions: formData.geographicRestrictions,
//       requiresCollateral: formData.requiresCollateral,

//       currency: formData.currency,
//       fundingType: formData.fundingType as any,
//       interestRate: formData.interestRate
//         ? Number(formData.interestRate)
//         : undefined,
//       equityOffered: formData.equityOffered
//         ? Number(formData.equityOffered)
//         : undefined,
//       repaymentTerms: formData.repaymentTerms?.trim() || undefined,
//       securityRequired: formData.securityRequired?.trim() || undefined,
//       useOfFunds: formData.useOfFunds?.trim(),
//       investmentStructure: formData.investmentStructure?.trim(),
//       expectedReturns: formData.expectedReturns
//         ? Number(formData.expectedReturns)
//         : undefined,
//       investmentHorizon: formData.investmentHorizon
//         ? Number(formData.investmentHorizon)
//         : undefined,
//       exitStrategy: formData.exitStrategy?.trim() || undefined,
//       applicationDeadline: formData.applicationDeadline
//         ? new Date(formData.applicationDeadline)
//         : undefined,
//       decisionTimeframe: Math.max(1, Number(formData.decisionTimeframe) || 30),

//       maxApplications: formData.maxApplications
//         ? Math.max(1, this.parseNumberValue(formData.maxApplications))
//         : undefined,

//       eligibilityCriteria: {
//         industries: formData.targetIndustries || [],
//         businessStages: formData.businessStages || [],
//         minRevenue: formData.minRevenue
//           ? Math.max(0, this.parseNumberValue(formData.minRevenue))
//           : undefined,
//         maxRevenue: formData.maxRevenue
//           ? Math.max(0, this.parseNumberValue(formData.maxRevenue))
//           : undefined,
//         minYearsOperation: formData.minYearsOperation
//           ? Math.max(0, Number(formData.minYearsOperation))
//           : undefined,
//         geographicRestrictions:
//           formData.geographicRestrictions?.length > 0
//             ? formData.geographicRestrictions
//             : undefined,
//         requiresCollateral: formData.requiresCollateral,
//       },

//       autoMatch: formData.autoMatch,
//       status: 'draft',

//       currentApplications: 0,
//       viewCount: 0,
//       applicationCount: 0,
//     };

//     return { isValid: true, data: opportunityData };
//   }
// }
