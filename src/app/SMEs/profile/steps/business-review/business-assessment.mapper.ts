import { Injectable } from '@angular/core';
import { BusinessAssessment } from 'src/app/SMEs/applications/models/funding-application.models';

export interface BusinessAssessmentFormValue {
  accountingSystem: string;
  payrollSystem: string;
  financeFunction: string;
  financeStaffCount: string;
  hasFinancialManager: string;
  totalStaffCount: string;
  hrFunctions: string;
  hasPoliciesAndProcedures: string;
  policyReviewFrequency: string;
  assetsInsured: string;
  criticalSystems: string;
  financialStatementsAudited: string;
  budgetAvailable: string;
  longTermContracts: string;
  offBalanceSheetFunding: string;
  assetRegisterAvailable: string;
  lenderPermissionsRequired: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessAssessmentMapper {
  /**
   * Convert form values to BusinessAssessment model
   * Single responsibility: handle form → model transformation
   */
  toModel(formValue: BusinessAssessmentFormValue): BusinessAssessment {
    const financeStaffCount = parseInt(formValue.financeStaffCount) || 0;
    const totalStaffCount = parseInt(formValue.totalStaffCount) || 0;

    return {
      // Business Model & Operations
      businessModel: formValue.criticalSystems || '',
      valueProposition: '',
      targetMarkets: ['Primary market'],
      customerSegments: formValue.hrFunctions || '',

      // Market Position
      marketSize: formValue.hasPoliciesAndProcedures || '',
      competitivePosition: formValue.policyReviewFrequency || '',
      marketShare: 0,
      growthRate: 0,

      // Operations
      operationalCapacity: formValue.accountingSystem || '',
      supplyChain: formValue.payrollSystem || '',
      technologyUse: formValue.financeFunction || '',
      qualityStandards: formValue.hasFinancialManager || '',

      // Performance Metrics
      keyPerformanceIndicators: [
        {
          metric: 'Finance Staff Count',
          value: financeStaffCount,
          unit: 'people',
          period: 'current'
        },
        {
          metric: 'Total Staff Count',
          value: totalStaffCount,
          unit: 'people',
          period: 'current'
        }
      ],

      salesChannels: ['Direct sales'],
      customerRetention: 85,

      // Back Office & Financial Data
      assetsInsured: formValue.assetsInsured || '',
      hasPoliciesAndProcedures: formValue.hasPoliciesAndProcedures || '',
      financialStatementsAudited: formValue.financialStatementsAudited || '',
      budgetAvailable: formValue.budgetAvailable || '',
      longTermContracts: formValue.longTermContracts || '',
      offBalanceSheetFunding: formValue.offBalanceSheetFunding || '',
      assetRegisterAvailable: formValue.assetRegisterAvailable || '',
      lenderPermissionsRequired: formValue.lenderPermissionsRequired || ''
    } as BusinessAssessment;
  }

  /**
   * Convert BusinessAssessment model back to form values
   * Used when loading existing data
   */
  toFormValue(data: BusinessAssessment): Partial<BusinessAssessmentFormValue> {
    return {
      accountingSystem: data.operationalCapacity || '',
      payrollSystem: data.supplyChain || '',
      financeFunction: data.technologyUse || '',
      financeStaffCount: data.keyPerformanceIndicators?.[0]?.value?.toString() || '',
      hasFinancialManager: data.qualityStandards || '',
      totalStaffCount: data.keyPerformanceIndicators?.[1]?.value?.toString() || '',
      hrFunctions: data.customerSegments || '',
      hasPoliciesAndProcedures: (data as any).hasPoliciesAndProcedures || '',
      policyReviewFrequency: data.competitivePosition || '',
      assetsInsured: (data as any).assetsInsured || '',
      criticalSystems: data.businessModel || '',
      financialStatementsAudited: (data as any).financialStatementsAudited || '',
      budgetAvailable: (data as any).budgetAvailable || '',
      longTermContracts: (data as any).longTermContracts || '',
      offBalanceSheetFunding: (data as any).offBalanceSheetFunding || '',
      assetRegisterAvailable: (data as any).assetRegisterAvailable || '',
      lenderPermissionsRequired: (data as any).lenderPermissionsRequired || ''
    };
  }
}
