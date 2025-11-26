// src/app/SMEs/profile/steps/financial-analysis/services/financial-ratio-calculator.service.ts
import { Injectable } from '@angular/core';
import {
  FinancialRowData,
  BalanceSheetRowData,
  CashFlowRowData,
  FinancialRatioData,
} from '../utils/excel-parser.service';

/**
 * Context object passed to formula functions
 * Contains all financial data needed for ratio calculations
 */
export interface FinancialDataContext {
  incomeStatement: FinancialRowData[];
  balanceSheet: BalanceSheetRowData[];
  cashFlow: CashFlowRowData[];
  columnCount: number;
}

/**
 * Configuration for a financial ratio formula
 * Designed to be easily extractable to database in Phase 2
 */
export interface RatioFormulaConfig {
  id: string;
  label: string;
  type: 'percentage' | 'ratio' | 'currency';
  category: 'profitability' | 'liquidity' | 'leverage' | 'efficiency' | 'growth';
  dependsOn: ('income' | 'balance' | 'cashflow')[];
  description: string;
  formula: (ctx: FinancialDataContext, colIndex: number) => number;
}

/**
 * Calculated fields configuration for Income Statement
 */
export interface CalculatedFieldConfig {
  label: string;
  formula: (data: FinancialRowData[], colIndex: number) => number;
}

@Injectable({
  providedIn: 'root',
})
export class FinancialRatioCalculatorService {
  // ===============================
  // INCOME STATEMENT CALCULATED FIELDS
  // ===============================

  private readonly incomeCalculatedFields: CalculatedFieldConfig[] = [
    {
      label: 'Gross Profit',
      formula: (data, col) => {
        const revenue = this.findRowValue(data, 'Revenue', col);
        const costOfSales = this.findRowValue(data, 'Cost of sales', col);
        return revenue + costOfSales; // Cost of sales is negative
      },
    },
    {
      label: 'EBITDA',
      formula: (data, col) => {
        const grossProfit = this.findRowValue(data, 'Gross Profit', col);
        const admin = this.findRowValue(data, 'Administrative expenses', col);
        const opExp = this.findRowValue(
          data,
          'Other Operating Expenses (Excl depreciation & amortisation)',
          col
        );
        const salaries = this.findRowValue(data, 'Salaries & Staff Cost', col);
        return grossProfit + admin + opExp + salaries; // Expenses are negative
      },
    },
    {
      label: 'Profit before tax',
      formula: (data, col) => {
        const ebitda = this.findRowValue(data, 'EBITDA', col);
        const interestIncome = this.findRowValue(data, 'Interest Income', col);
        const financeCost = this.findRowValue(data, 'Finances Cost', col);
        const depreciation = this.findRowValue(
          data,
          'Depreciation & Amortisation',
          col
        );
        return ebitda + interestIncome + financeCost + depreciation;
      },
    },
  ];

  // ===============================
  // FINANCIAL RATIO FORMULAS
  // ===============================

  private readonly ratioFormulas: RatioFormulaConfig[] = [
    // Profitability Ratios
    {
      id: 'roe',
      label: 'Return on Equity (ROE)',
      type: 'percentage',
      category: 'profitability',
      dependsOn: ['income', 'balance'],
      description: 'Net Profit / Total Equity',
      formula: (ctx, col) => {
        const netProfit = this.getIncomeValue(ctx, 'Profit/(Loss) for the period', col) ||
                          this.getIncomeValue(ctx, 'Profit before tax', col);
        const equity = this.getBalanceValue(ctx, 'equity', 'Total', col);
        return equity !== 0 ? (netProfit / equity) * 100 : 0;
      },
    },
    {
      id: 'roa',
      label: 'Return on Assets (ROA)',
      type: 'percentage',
      category: 'profitability',
      dependsOn: ['income', 'balance'],
      description: 'Net Profit / Total Assets',
      formula: (ctx, col) => {
        const netProfit = this.getIncomeValue(ctx, 'Profit/(Loss) for the period', col) ||
                          this.getIncomeValue(ctx, 'Profit before tax', col);
        const assets = this.getBalanceValue(ctx, 'assets', 'Total Assets', col);
        return assets !== 0 ? (netProfit / assets) * 100 : 0;
      },
    },
    {
      id: 'gross_margin',
      label: 'Gross profit margin',
      type: 'percentage',
      category: 'profitability',
      dependsOn: ['income'],
      description: 'Gross Profit / Revenue',
      formula: (ctx, col) => {
        const grossProfit = this.getIncomeValue(ctx, 'Gross Profit', col);
        const revenue = this.getIncomeValue(ctx, 'Revenue', col);
        return revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
      },
    },
    {
      id: 'operating_margin',
      label: 'Operating margin (EBITDA)',
      type: 'percentage',
      category: 'profitability',
      dependsOn: ['income'],
      description: 'EBITDA / Revenue',
      formula: (ctx, col) => {
        const ebitda = this.getIncomeValue(ctx, 'EBITDA', col);
        const revenue = this.getIncomeValue(ctx, 'Revenue', col);
        return revenue !== 0 ? (ebitda / revenue) * 100 : 0;
      },
    },
    {
      id: 'net_margin',
      label: 'Net Operating Profit Margin',
      type: 'percentage',
      category: 'profitability',
      dependsOn: ['income'],
      description: 'Net Profit / Revenue',
      formula: (ctx, col) => {
        const netProfit = this.getIncomeValue(ctx, 'Profit/(Loss) for the period', col) ||
                          this.getIncomeValue(ctx, 'Profit before tax', col);
        const revenue = this.getIncomeValue(ctx, 'Revenue', col);
        return revenue !== 0 ? (netProfit / revenue) * 100 : 0;
      },
    },

    // Liquidity Ratios
    {
      id: 'current_ratio',
      label: 'Current Ratio',
      type: 'ratio',
      category: 'liquidity',
      dependsOn: ['balance'],
      description: 'Current Assets / Current Liabilities',
      formula: (ctx, col) => {
        const currentAssets = this.getBalanceSubcategoryTotal(ctx, 'assets', 'current', col);
        const currentLiabilities = this.getBalanceSubcategoryTotal(ctx, 'liabilities', 'current', col);
        return currentLiabilities !== 0 ? currentAssets / Math.abs(currentLiabilities) : 0;
      },
    },
    {
      id: 'quick_ratio',
      label: 'Acid Test Ratio (Quick Ratio)',
      type: 'ratio',
      category: 'liquidity',
      dependsOn: ['balance'],
      description: '(Current Assets - Inventory) / Current Liabilities',
      formula: (ctx, col) => {
        const currentAssets = this.getBalanceSubcategoryTotal(ctx, 'assets', 'current', col);
        const inventory = this.getBalanceRowValue(ctx, 'Inventory', col);
        const currentLiabilities = this.getBalanceSubcategoryTotal(ctx, 'liabilities', 'current', col);
        return currentLiabilities !== 0
          ? (currentAssets - inventory) / Math.abs(currentLiabilities)
          : 0;
      },
    },

    // Leverage Ratios
    {
      id: 'debt_equity',
      label: 'Debt Equity Ratio (Total liabilities)',
      type: 'ratio',
      category: 'leverage',
      dependsOn: ['balance'],
      description: 'Total Liabilities / Total Equity',
      formula: (ctx, col) => {
        const totalLiabilities = this.getBalanceValue(ctx, 'liabilities', 'Total Liabilities', col);
        const equity = this.getBalanceValue(ctx, 'equity', 'Total', col);
        return equity !== 0 ? Math.abs(totalLiabilities) / equity : 0;
      },
    },
    {
      id: 'interest_coverage',
      label: 'Interest Cover Ratio',
      type: 'ratio',
      category: 'leverage',
      dependsOn: ['income'],
      description: 'EBITDA / Finance Costs',
      formula: (ctx, col) => {
        const ebitda = this.getIncomeValue(ctx, 'EBITDA', col);
        const financeCost = this.getIncomeValue(ctx, 'Finances Cost', col);
        // Finance cost is typically negative, so we use absolute value
        return financeCost !== 0 ? ebitda / Math.abs(financeCost) : 0;
      },
    },

    // Efficiency Ratios
    {
      id: 'cost_income',
      label: 'Cost to Income ratio',
      type: 'percentage',
      category: 'efficiency',
      dependsOn: ['income'],
      description: 'Operating Costs / Revenue',
      formula: (ctx, col) => {
        const admin = this.getIncomeValue(ctx, 'Administrative expenses', col);
        const opExp = this.getIncomeValue(
          ctx,
          'Other Operating Expenses (Excl depreciation & amortisation)',
          col
        );
        const salaries = this.getIncomeValue(ctx, 'Salaries & Staff Cost', col);
        const revenue = this.getIncomeValue(ctx, 'Revenue', col);
        const totalCosts = Math.abs(admin) + Math.abs(opExp) + Math.abs(salaries);
        return revenue !== 0 ? (totalCosts / revenue) * 100 : 0;
      },
    },
    {
      id: 'roi',
      label: 'Return on Investment (ROI)',
      type: 'percentage',
      category: 'efficiency',
      dependsOn: ['income', 'balance'],
      description: 'Net Profit / Total Equity',
      formula: (ctx, col) => {
        const netProfit = this.getIncomeValue(ctx, 'Profit/(Loss) for the period', col) ||
                          this.getIncomeValue(ctx, 'Profit before tax', col);
        const equity = this.getBalanceValue(ctx, 'equity', 'Total', col);
        return equity !== 0 ? (netProfit / equity) * 100 : 0;
      },
    },

    // Growth Ratios
    {
      id: 'sales_growth',
      label: 'Sales Growth',
      type: 'percentage',
      category: 'growth',
      dependsOn: ['income'],
      description: '(Current Revenue - Prior Revenue) / Prior Revenue',
      formula: (ctx, col) => {
        if (col === 0) return 0; // No prior period for first column
        const currentRevenue = this.getIncomeValue(ctx, 'Revenue', col);
        const priorRevenue = this.getIncomeValue(ctx, 'Revenue', col - 1);
        return priorRevenue !== 0
          ? ((currentRevenue - priorRevenue) / Math.abs(priorRevenue)) * 100
          : 0;
      },
    },

    // Investment Value
    {
      id: 'equity_value',
      label: 'Equity Investment Value',
      type: 'currency',
      category: 'efficiency',
      dependsOn: ['balance'],
      description: 'Total Equity',
      formula: (ctx, col) => {
        return this.getBalanceValue(ctx, 'equity', 'Total', col);
      },
    },
  ];

  // ===============================
  // LABELS FOR CALCULATED FIELDS
  // ===============================

  /**
   * Get list of Income Statement field labels that are calculated (not editable)
   */
  getCalculatedIncomeFields(): string[] {
    return this.incomeCalculatedFields.map((f) => f.label);
  }

  /**
   * Get list of all calculated field labels across all statement types
   */
  getAllCalculatedFields(): {
    incomeStatement: string[];
    balanceSheet: string[];
    cashFlow: string[];
  } {
    return {
      incomeStatement: this.getCalculatedIncomeFields(),
      balanceSheet: [
        'Total Current Assets',
        'Total Non-Current Assets',
        'Total Assets',
        'Total Current Liabilities',
        'Total Non-Current Liabilities',
        'Total Liabilities',
        'Total Equity',
        'Total Shareholders Equity',
        'Total Equities and Liabilities',
      ],
      cashFlow: [
        'Net cash from operating activities',
        'Net cash used in investing activities',
        'Net cash used in financing activities',
        'Net increase in cash and cash equivalents',
        'Cash and cash equivalents at end of period',
      ],
    };
  }

  // ===============================
  // RECALCULATION METHODS
  // ===============================

  /**
   * Recalculate all calculated fields in Income Statement
   * Call this after any Income Statement cell edit
   */
  recalculateIncomeStatement(data: FinancialRowData[]): FinancialRowData[] {
    const result = [...data];
    const columnCount = data[0]?.values.length || 0;

    for (const fieldConfig of this.incomeCalculatedFields) {
      const rowIndex = result.findIndex((r) => r.label === fieldConfig.label);
      if (rowIndex !== -1) {
        const newValues: number[] = [];
        for (let col = 0; col < columnCount; col++) {
          newValues.push(fieldConfig.formula(result, col));
        }
        result[rowIndex] = {
          ...result[rowIndex],
          values: newValues,
        };
      }
    }

    return result;
  }

  /**
   * Recalculate all financial ratios based on current financial data
   * Call this after any Income Statement or Balance Sheet change
   */
  recalculateRatios(
    incomeStatement: FinancialRowData[],
    balanceSheet: BalanceSheetRowData[],
    cashFlow: CashFlowRowData[],
    existingRatios: FinancialRatioData[]
  ): FinancialRatioData[] {
    const columnCount = incomeStatement[0]?.values.length || 9;

    const ctx: FinancialDataContext = {
      incomeStatement,
      balanceSheet,
      cashFlow,
      columnCount,
    };

    // Create new ratio data based on formulas
    const calculatedRatios: FinancialRatioData[] = this.ratioFormulas.map(
      (formula) => {
        // Check if ratio already exists (preserve any manual overrides if needed)
        const existing = existingRatios.find((r) => r.label === formula.label);

        const values: number[] = [];
        for (let col = 0; col < columnCount; col++) {
          try {
            const value = formula.formula(ctx, col);
            values.push(isFinite(value) ? value : 0);
          } catch (e) {
            console.warn(`Error calculating ${formula.label} for col ${col}:`, e);
            values.push(existing?.values[col] || 0);
          }
        }

        return {
          label: formula.label,
          values,
          type: formula.type,
          editable: false, // Ratios are calculated, not manually editable
        };
      }
    );

    // Preserve any custom ratios that were in existingRatios but not in our formulas
    const formulaLabels = this.ratioFormulas.map((f) => f.label);
    const customRatios = existingRatios.filter(
      (r) => !formulaLabels.includes(r.label)
    );

    return [...calculatedRatios, ...customRatios];
  }

  /**
   * Get the formula configuration for a specific ratio
   * Useful for displaying formula descriptions in UI
   */
  getRatioConfig(ratioLabel: string): RatioFormulaConfig | undefined {
    return this.ratioFormulas.find((f) => f.label === ratioLabel);
  }

  /**
   * Get all ratio formulas grouped by category
   */
  getRatiosByCategory(): Map<string, RatioFormulaConfig[]> {
    const grouped = new Map<string, RatioFormulaConfig[]>();

    for (const formula of this.ratioFormulas) {
      const existing = grouped.get(formula.category) || [];
      existing.push(formula);
      grouped.set(formula.category, existing);
    }

    return grouped;
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  /**
   * Find a row by label and return its value at the specified column
   */
  private findRowValue(
    data: FinancialRowData[],
    label: string,
    colIndex: number
  ): number {
    const row = data.find((r) =>
      r.label.toLowerCase().includes(label.toLowerCase())
    );
    return row?.values[colIndex] ?? 0;
  }

  /**
   * Get value from Income Statement by label
   */
  private getIncomeValue(
    ctx: FinancialDataContext,
    label: string,
    colIndex: number
  ): number {
    const row = ctx.incomeStatement.find((r) =>
      r.label.toLowerCase().includes(label.toLowerCase())
    );
    return row?.values[colIndex] ?? 0;
  }

  /**
   * Get value from Balance Sheet by category and label pattern
   */
  private getBalanceValue(
    ctx: FinancialDataContext,
    category: 'assets' | 'liabilities' | 'equity',
    labelPattern: string,
    colIndex: number
  ): number {
    const row = ctx.balanceSheet.find(
      (r) =>
        r.category === category &&
        r.label.toLowerCase().includes(labelPattern.toLowerCase())
    );
    return row?.values[colIndex] ?? 0;
  }

  /**
   * Get a specific Balance Sheet row value by label
   */
  private getBalanceRowValue(
    ctx: FinancialDataContext,
    label: string,
    colIndex: number
  ): number {
    const row = ctx.balanceSheet.find((r) =>
      r.label.toLowerCase().includes(label.toLowerCase())
    );
    return row?.values[colIndex] ?? 0;
  }

  /**
   * Get total for a Balance Sheet subcategory (current/non-current assets/liabilities)
   */
  private getBalanceSubcategoryTotal(
    ctx: FinancialDataContext,
    category: 'assets' | 'liabilities' | 'equity',
    subcategory: 'current' | 'non-current',
    colIndex: number
  ): number {
    // Look for a "Total" row for this subcategory
    const totalRow = ctx.balanceSheet.find(
      (r) =>
        r.category === category &&
        r.subcategory === subcategory &&
        r.label.toLowerCase().includes('total')
    );

    if (totalRow) {
      return totalRow.values[colIndex] ?? 0;
    }

    // If no total row, sum all rows in this subcategory
    const rows = ctx.balanceSheet.filter(
      (r) =>
        r.category === category &&
        r.subcategory === subcategory &&
        !r.label.toLowerCase().includes('total')
    );

    return rows.reduce((sum, row) => sum + (row.values[colIndex] ?? 0), 0);
  }

  /**
   * Get value from Cash Flow statement by label
   */
  private getCashFlowValue(
    ctx: FinancialDataContext,
    label: string,
    colIndex: number
  ): number {
    const row = ctx.cashFlow.find((r) =>
      r.label.toLowerCase().includes(label.toLowerCase())
    );
    return row?.values[colIndex] ?? 0;
  }
}
