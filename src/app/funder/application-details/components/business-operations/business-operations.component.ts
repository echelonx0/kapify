// src/app/funder/application-details/components/business-assessment-viewer/business-assessment-viewer.component.ts
import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Building2,
  Users,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle,
  Package,
  Cpu,
  BarChart3,
} from 'lucide-angular';

interface KPI {
  metric: string;
  value: number;
  unit: string;
  period: string;
}

// ✅ Flexible interface that accepts any shape of business review data
interface BusinessAssessment extends Record<string, any> {
  // Mapped from business review form (optional, may not always be present)
  accountingSystem?: string;
  payrollSystem?: string;
  financeFunction?: string;
  financeStaffCount?: number;
  hasFinancialManager?: string;
  totalStaffCount?: number;
  hrFunctions?: string;
  hasPoliciesAndProcedures?: string;
  policyReviewFrequency?: string;
  assetsInsured?: string;
  criticalSystems?: string;

  // Financial statements
  financialStatementsAudited?: string;
  budgetAvailable?: string;
  longTermContracts?: string;
  offBalanceSheetFunding?: string;
  assetRegisterAvailable?: string;
  lenderPermissionsRequired?: string;

  // Additional fields from businessModel
  businessModel?: string;
  valueProposition?: string;
  targetMarkets?: string[];
  customerSegments?: string;
  marketSize?: string;
  competitivePosition?: string;
  operationalCapacity?: string;
  supplyChain?: string;
  technologyUse?: string;
  keyPerformanceIndicators?: KPI[];
  salesChannels?: string[];
  customerRetention?: number;
}

interface MetricCard {
  label: string;
  value: string | number;
  icon: any;
  colorClass: string;
  bgClass: string;
}

@Component({
  selector: 'app-business-assessment-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './business-operations.component.html',
})
export class BusinessAssessmentViewerComponent {
  @Input() set businessAssessment(
    value: BusinessAssessment | null | undefined
  ) {
    this._businessAssessment.set(value || null);
  }

  private _businessAssessment = signal<BusinessAssessment | null>(null);

  // Icons
  Building2Icon = Building2;
  UsersIcon = Users;
  FileTextIcon = FileText;
  ShieldIcon = Shield;
  TrendingUpIcon = TrendingUp;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  PackageIcon = Package;
  CpuIcon = Cpu;
  BarChart3Icon = BarChart3;

  // Computed properties
  hasData = computed(() => !!this._businessAssessment());

  operationsMetrics = computed((): MetricCard[] => {
    const assessment = this._businessAssessment();
    if (!assessment) return [];

    const metrics: MetricCard[] = [];

    // Accounting System
    if (assessment.accountingSystem || assessment.operationalCapacity) {
      metrics.push({
        label: 'Accounting System',
        value: this.formatSystemName(
          assessment.accountingSystem || assessment.operationalCapacity || ''
        ),
        icon: this.FileTextIcon,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50 border-blue-200/50',
      });
    }

    // Payroll System
    if (assessment.payrollSystem || assessment.supplyChain) {
      metrics.push({
        label: 'Payroll System',
        value: this.formatSystemName(
          assessment.payrollSystem || assessment.supplyChain || ''
        ),
        icon: this.UsersIcon,
        colorClass: 'text-green-600',
        bgClass: 'bg-green-50 border-green-200/50',
      });
    }

    // Finance Function
    if (assessment.financeFunction || assessment.technologyUse) {
      metrics.push({
        label: 'Finance Function',
        value: this.formatValue(
          assessment.financeFunction || assessment.technologyUse || ''
        ),
        icon: this.TrendingUpIcon,
        colorClass: 'text-purple-600',
        bgClass: 'bg-purple-50 border-purple-200/50',
      });
    }

    // HR Functions
    if (assessment.hrFunctions || assessment.customerSegments) {
      metrics.push({
        label: 'HR Functions',
        value: this.formatValue(
          assessment.hrFunctions || assessment.customerSegments || ''
        ),
        icon: this.UsersIcon,
        colorClass: 'text-orange-600',
        bgClass: 'bg-orange-50 border-orange-200/50',
      });
    }

    return metrics;
  });

  staffingMetrics = computed((): MetricCard[] => {
    const assessment = this._businessAssessment();
    if (!assessment) return [];

    const metrics: MetricCard[] = [];

    // Finance Staff Count
    const financeStaff =
      assessment.financeStaffCount ||
      assessment.keyPerformanceIndicators?.find((kpi) =>
        kpi.metric.toLowerCase().includes('finance')
      )?.value;

    if (financeStaff !== undefined) {
      metrics.push({
        label: 'Finance Staff',
        value: financeStaff,
        icon: this.UsersIcon,
        colorClass: 'text-teal-600',
        bgClass: 'bg-teal-50 border-teal-200/50',
      });
    }

    // Total Staff Count
    const totalStaff =
      assessment.totalStaffCount ||
      assessment.keyPerformanceIndicators?.find((kpi) =>
        kpi.metric.toLowerCase().includes('total')
      )?.value;

    if (totalStaff !== undefined) {
      metrics.push({
        label: 'Total Staff',
        value: totalStaff,
        icon: this.Building2Icon,
        colorClass: 'text-slate-600',
        bgClass: 'bg-slate-50 border-slate-200/50',
      });
    }

    // Customer Retention
    if (assessment.customerRetention !== undefined) {
      metrics.push({
        label: 'Customer Retention',
        value: `${assessment.customerRetention}%`,
        icon: this.TrendingUpIcon,
        colorClass: 'text-green-600',
        bgClass: 'bg-green-50 border-green-200/50',
      });
    }

    return metrics;
  });

  complianceMetrics = computed(() => {
    const assessment = this._businessAssessment();
    if (!assessment) return [];

    return [
      {
        label: 'Financial Statements',
        value: assessment.financialStatementsAudited || 'Not specified',
        status: this.getComplianceStatus(assessment.financialStatementsAudited),
      },
      {
        label: 'Budget Available',
        value: this.formatYesNo(
          assessment.budgetAvailable || assessment.marketSize
        ),
        status: this.getYesNoStatus(
          assessment.budgetAvailable || assessment.marketSize
        ),
      },
      {
        label: 'Asset Register',
        value: this.formatYesNo(assessment.assetRegisterAvailable),
        status: this.getYesNoStatus(assessment.assetRegisterAvailable),
      },
      {
        label: 'Policies & Procedures',
        value: this.formatYesNo(assessment.hasPoliciesAndProcedures),
        status: this.getYesNoStatus(assessment.hasPoliciesAndProcedures),
      },
      {
        label: 'Asset Insurance',
        value:
          assessment.assetsInsured ||
          assessment.valueProposition ||
          'Not specified',
        status: this.getInsuranceStatus(assessment.assetsInsured),
      },
    ].filter((metric) => metric.value !== 'Not specified');
  });

  additionalInfo = computed(() => {
    const assessment = this._businessAssessment();
    if (!assessment) return [];

    const info: Array<{ label: string; value: string }> = [];

    if (assessment.criticalSystems) {
      info.push({
        label: 'Critical Systems',
        value: assessment.criticalSystems,
      });
    }

    if (assessment.policyReviewFrequency || assessment.competitivePosition) {
      info.push({
        label: 'Policy Review Frequency',
        value: this.formatValue(
          assessment.policyReviewFrequency ||
            assessment.competitivePosition ||
            ''
        ),
      });
    }

    if (assessment.targetMarkets && assessment.targetMarkets.length > 0) {
      info.push({
        label: 'Target Markets',
        value: assessment.targetMarkets.join(', '),
      });
    }

    if (assessment.salesChannels && assessment.salesChannels.length > 0) {
      info.push({
        label: 'Sales Channels',
        value: assessment.salesChannels.join(', '),
      });
    }

    return info;
  });

  kpiMetrics = computed(() => {
    const assessment = this._businessAssessment();
    return assessment?.keyPerformanceIndicators || [];
  });

  // Helper methods
  private formatSystemName(value: string): string {
    const systemMap: Record<string, string> = {
      'sage-pastel': 'Sage Pastel',
      sap: 'SAP',
      quickbooks: 'QuickBooks',
      xero: 'Xero',
      payspace: 'PaySpace',
      other: 'Other System',
    };
    return systemMap[value] || this.formatValue(value);
  }

  private formatValue(value: string): string {
    if (!value) return '';
    return value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatYesNo(value: string | undefined): string {
    if (!value) return 'Not specified';
    if (value === 'yes' || value === 'true') return 'Yes';
    if (value === 'no' || value === 'false') return 'No';
    return this.formatValue(value);
  }

  private getComplianceStatus(
    value: string | undefined
  ): 'positive' | 'neutral' | 'negative' {
    if (!value) return 'neutral';
    if (value === 'audited') return 'positive';
    if (value === 'reviewed') return 'neutral';
    return 'negative';
  }

  private getYesNoStatus(
    value: string | undefined
  ): 'positive' | 'negative' | 'neutral' {
    if (!value) return 'neutral';
    if (value === 'yes' || value === 'true') return 'positive';
    return 'negative';
  }

  private getInsuranceStatus(
    value: string | undefined
  ): 'positive' | 'neutral' | 'negative' {
    if (!value) return 'neutral';
    if (value === 'full' || value.toLowerCase().includes('full'))
      return 'positive';
    if (value === 'partial' || value.toLowerCase().includes('partial'))
      return 'neutral';
    return 'negative';
  }

  getStatusIcon(status: 'positive' | 'neutral' | 'negative'): any {
    return status === 'positive' ? this.CheckCircleIcon : this.XCircleIcon;
  }

  getStatusColor(status: 'positive' | 'neutral' | 'negative'): string {
    if (status === 'positive') return 'text-green-600';
    if (status === 'neutral') return 'text-amber-600';
    return 'text-red-600';
  }
}
