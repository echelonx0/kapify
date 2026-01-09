// // src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer.ts
// import { FinancialTableSection } from '../financial-table/financial-data-table.component';
// import {
//   FinancialRowData,
//   BalanceSheetRowData,
//   CashFlowRowData,
//   FinancialRatioData,
// } from './excel-parser.service';

// export class FinancialDataTransformer {
//   /**
//    * Transform Income Statement rows + income ratios into table sections
//    */
//   static transformIncomeStatement(
//     incomeData: FinancialRowData[],
//     incomeRatios?: FinancialRatioData[]
//   ): FinancialTableSection[] {
//     if (incomeData.length === 0) return [];

//     const sections: FinancialTableSection[] = [
//       {
//         title: 'Income Statement',
//         rows: incomeData.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable ?? true,
//           isCalculated: !row.editable,
//           isBold: this.isBoldIncomeRow(row.label),
//           isTotal: this.isTotalIncomeRow(row.label),
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       },
//     ];

//     if (incomeRatios && incomeRatios.length > 0) {
//       sections.push({
//         title: 'Financial Performance Ratios',
//         rows: incomeRatios.map((ratio) => ({
//           label: ratio.label,
//           values: ratio.values,
//           editable: false,
//           isCalculated: true,
//           isBold: false,
//           isTotal: false,
//           type: ratio.type,
//           suffix:
//             ratio.type === 'percentage'
//               ? '%'
//               : ratio.type === 'ratio'
//               ? 'x'
//               : '',
//         })),
//         isCollapsible: true,
//         defaultExpanded: true,
//         accentColor: 'orange',
//       });
//     }

//     return sections;
//   }

//   /**
//    * Transform Balance Sheet rows + balance sheet ratios into table sections
//    * NESTED: Grouped under containers with NO redundant headers for total rows
//    *
//    * ASSETS (collapsible container)
//    * ├─ Non-Current Assets (section with header)
//    * ├─ Current Assets (section with header)
//    * └─ Total Assets (NO header, just the row with teal-50 + bold)
//    *
//    * EQUITIES AND LIABILITIES (collapsible container)
//    * ├─ Equities (section with header)
//    * ├─ Liabilities (section with header)
//    * ├─ Current Liabilities (section with header)
//    * └─ Total Equities and Liabilities (NO header, just the row with teal-50 + bold)
//    *
//    * Financial Ratios (regular section, collapsible, orange)
//    */
//   static transformBalanceSheet(
//     balanceData: BalanceSheetRowData[],
//     balanceRatios?: FinancialRatioData[]
//   ): FinancialTableSection[] {
//     if (balanceData.length === 0) return [];

//     const sections: FinancialTableSection[] = [];

//     // Extract and group asset rows by subsection
//     const assetsBySubsection = this.groupAssetsBySubsection(balanceData);

//     // ===== ASSETS GROUP CONTAINER =====
//     const assetChildren: FinancialTableSection[] = [];

//     // Non-Current Assets child section
//     if (assetsBySubsection.nonCurrent.length > 0) {
//       assetChildren.push({
//         title: 'Non-Current Assets',
//         rows: assetsBySubsection.nonCurrent.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: false,
//           isTotal: false,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     // Current Assets child section
//     if (assetsBySubsection.current.length > 0) {
//       assetChildren.push({
//         title: 'Current Assets',
//         rows: assetsBySubsection.current.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: false,
//           isTotal: false,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     // Total Assets - NO section header, just the row
//     const totalAssets = balanceData.find(
//       (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
//     );
//     if (totalAssets) {
//       assetChildren.push({
//         title: '', // Empty title = no header rendered
//         rows: [
//           {
//             label: totalAssets.label,
//             values: totalAssets.values,
//             editable: false,
//             isCalculated: true,
//             isBold: true,
//             isTotal: true,
//             type: 'currency' as const,
//             styling: {
//               rowClass: 'bg-teal-50 border-t-2 border-slate-200',
//               labelClass: 'font-bold text-slate-900',
//             },
//           },
//         ],
//         isCollapsible: false,
//         defaultExpanded: true,
//         isHeaderless: true, // Skip header rendering
//       });
//     }

//     // Add ASSETS group container
//     if (assetChildren.length > 0) {
//       sections.push({
//         title: 'ASSETS',
//         rows: [],
//         children: assetChildren,
//         isGroupContainer: true,
//         isCollapsible: true,
//         defaultExpanded: true,
//         spacingAfter: 'lg',
//       });
//     }

//     // ===== EQUITIES & LIABILITIES GROUP CONTAINER =====
//     const liabilityChildren: FinancialTableSection[] = [];

//     // Equities child section
//     const equities = balanceData.filter((r) => r.category === 'equity');
//     if (equities.length > 0) {
//       liabilityChildren.push({
//         title: 'Equities',
//         rows: equities.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: false,
//           isTotal: false,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     // Liabilities child section (long-term)
//     const longTermLiabilities = balanceData.filter(
//       (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
//     );
//     if (longTermLiabilities.length > 0) {
//       liabilityChildren.push({
//         title: 'Non Current Liabilities',
//         rows: longTermLiabilities.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: false,
//           isTotal: false,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     // Current Liabilities child section
//     const currentLiabilities = balanceData.filter(
//       (r) => r.category === 'liabilities' && r.subcategory === 'current'
//     );
//     if (currentLiabilities.length > 0) {
//       liabilityChildren.push({
//         title: 'Current Liabilities',
//         rows: currentLiabilities.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: false,
//           isTotal: false,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     // Total Equities and Liabilities - NO section header, just the row
//     const totalEL = balanceData.find(
//       (r) =>
//         r.label.toLowerCase() === 'total equities and liabilities' &&
//         r.category === 'liabilities'
//     );
//     if (totalEL) {
//       liabilityChildren.push({
//         title: '', // Empty title = no header rendered
//         rows: [
//           {
//             label: totalEL.label,
//             values: totalEL.values,
//             editable: false,
//             isCalculated: true,
//             isBold: true,
//             isTotal: true,
//             type: 'currency' as const,
//             styling: {
//               rowClass: 'bg-teal-50 border-t-2 border-slate-200',
//               labelClass: 'font-bold text-slate-900',
//             },
//           },
//         ],
//         isCollapsible: false,
//         defaultExpanded: true,
//         isHeaderless: true, // Skip header rendering
//       });
//     }

//     // Add EQUITIES AND LIABILITIES group container
//     if (liabilityChildren.length > 0) {
//       sections.push({
//         title: 'EQUITIES AND LIABILITIES',
//         rows: [],
//         children: liabilityChildren,
//         isGroupContainer: true,
//         isCollapsible: true,
//         defaultExpanded: true,
//         spacingBefore: 'lg',
//         spacingAfter: 'lg',
//       });
//     }

//     // ===== FINANCIAL RATIOS (regular section, not grouped) =====
//     if (balanceRatios && balanceRatios.length > 0) {
//       sections.push({
//         title: 'Financial Ratios',
//         rows: balanceRatios.map((ratio) => ({
//           label: ratio.label,
//           values: ratio.values,
//           editable: false,
//           isCalculated: true,
//           isBold: false,
//           isTotal: false,
//           type: ratio.type,
//           suffix:
//             ratio.type === 'percentage'
//               ? '%'
//               : ratio.type === 'ratio'
//               ? 'x'
//               : '',
//         })),
//         isCollapsible: true,
//         defaultExpanded: true,
//         accentColor: 'orange',
//         spacingBefore: 'lg',
//       });
//     }

//     return sections;
//   }

//   /**
//    * Transform Cash Flow rows into organized sections
//    */
//   static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
//     if (data.length === 0) return [];

//     const operatingRows: CashFlowRowData[] = [];
//     const investingRows: CashFlowRowData[] = [];
//     const financingRows: CashFlowRowData[] = [];
//     const summaryRows: CashFlowRowData[] = [];

//     for (const row of data) {
//       switch (row.category) {
//         case 'operating':
//           operatingRows.push(row);
//           break;
//         case 'investing':
//           investingRows.push(row);
//           break;
//         case 'financing':
//           financingRows.push(row);
//           break;
//         case 'summary':
//           summaryRows.push(row);
//           break;
//       }
//     }

//     const sections: FinancialTableSection[] = [];

//     if (operatingRows.length > 0) {
//       const operatingHeaderRow = operatingRows.find(
//         (r) =>
//           !r.editable &&
//           !r.isSubtotal &&
//           r.label.toLowerCase().includes('cash flows from operating')
//       );
//       const operatingHeader =
//         operatingHeaderRow?.label || 'Operating Activities';
//       const operatingItems = operatingRows.filter(
//         (r) => r !== operatingHeaderRow
//       );

//       sections.push({
//         title: operatingHeader,
//         rows: operatingItems.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: row.isSubtotal,
//           isTotal: row.isSubtotal,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     if (investingRows.length > 0) {
//       const investingHeaderRow = investingRows.find(
//         (r) =>
//           !r.editable &&
//           !r.isSubtotal &&
//           r.label.toLowerCase().includes('cash flows from investing')
//       );
//       const investingHeader =
//         investingHeaderRow?.label || 'Investing Activities';
//       const investingItems = investingRows.filter(
//         (r) => r !== investingHeaderRow
//       );

//       sections.push({
//         title: investingHeader,
//         rows: investingItems.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: row.isSubtotal,
//           isTotal: row.isSubtotal,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     if (financingRows.length > 0) {
//       const financingHeaderRow = financingRows.find(
//         (r) =>
//           !r.editable &&
//           !r.isSubtotal &&
//           r.label.toLowerCase().includes('cash flows from financing')
//       );
//       const financingHeader =
//         financingHeaderRow?.label || 'Financing Activities';
//       const financingItems = financingRows.filter(
//         (r) => r !== financingHeaderRow
//       );

//       sections.push({
//         title: financingHeader,
//         rows: financingItems.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: row.isSubtotal,
//           isTotal: row.isSubtotal,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     if (summaryRows.length > 0) {
//       sections.push({
//         title: 'Summary',
//         rows: summaryRows.map((row) => ({
//           label: row.label,
//           values: row.values,
//           editable: row.editable,
//           isCalculated: !row.editable,
//           isBold: row.isSubtotal,
//           isTotal: row.isSubtotal,
//           type: 'currency' as const,
//         })),
//         isCollapsible: false,
//         defaultExpanded: true,
//       });
//     }

//     return sections;
//   }

//   /**
//    * Transform Financial Ratios into organized sections by type
//    */
//   static transformFinancialRatios(
//     incomeRatios?: FinancialRatioData[],
//     balanceRatios?: FinancialRatioData[]
//   ): FinancialTableSection[] {
//     const sections: FinancialTableSection[] = [];

//     if (incomeRatios && incomeRatios.length > 0) {
//       sections.push({
//         title: 'Income Statement Ratios',
//         rows: incomeRatios.map((ratio) => ({
//           label: ratio.label,
//           values: ratio.values,
//           editable: false,
//           isCalculated: true,
//           isBold: false,
//           isTotal: false,
//           type: ratio.type,
//           suffix:
//             ratio.type === 'percentage'
//               ? '%'
//               : ratio.type === 'ratio'
//               ? 'x'
//               : '',
//         })),
//         isCollapsible: true,
//         defaultExpanded: true,
//         accentColor: 'orange',
//       });
//     }

//     if (balanceRatios && balanceRatios.length > 0) {
//       sections.push({
//         title: 'Balance Sheet Ratios',
//         rows: balanceRatios.map((ratio) => ({
//           label: ratio.label,
//           values: ratio.values,
//           editable: false,
//           isCalculated: true,
//           isBold: false,
//           isTotal: false,
//           type: ratio.type,
//           suffix:
//             ratio.type === 'percentage'
//               ? '%'
//               : ratio.type === 'ratio'
//               ? 'x'
//               : '',
//         })),
//         isCollapsible: true,
//         defaultExpanded: true,
//         accentColor: 'orange',
//         spacingBefore: 'md',
//       });
//     }

//     return sections;
//   }

//   // ===== PRIVATE HELPERS =====

//   private static groupAssetsBySubsection(data: BalanceSheetRowData[]): {
//     nonCurrent: BalanceSheetRowData[];
//     current: BalanceSheetRowData[];
//   } {
//     return {
//       nonCurrent: data.filter(
//         (r) => r.category === 'assets' && r.subcategory === 'non-current'
//       ),
//       current: data.filter(
//         (r) => r.category === 'assets' && r.subcategory === 'current'
//       ),
//     };
//   }

//   private static isBoldIncomeRow(label: string): boolean {
//     const boldRows = [
//       'Gross Profit',
//       'EBITDA',
//       'Profit before tax',
//       'Profit/(Loss) for the period',
//     ];
//     return boldRows.some((row) => label.toLowerCase() === row.toLowerCase());
//   }

//   private static isTotalIncomeRow(label: string): boolean {
//     const totalRows = [
//       'Gross Profit',
//       'EBITDA',
//       'Profit before tax',
//       'Profit/(Loss) for the period',
//     ];
//     return totalRows.some((row) => label.toLowerCase() === row.toLowerCase());
//   }
// }
// src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer.ts
import { FinancialTableSection } from '../financial-table/financial-data-table.component';
import {
  FinancialRowData,
  BalanceSheetRowData,
  CashFlowRowData,
  FinancialRatioData,
} from './excel-parser.service';

export class FinancialDataTransformer {
  /**
   * Transform Income Statement rows + income ratios into table sections
   */
  static transformIncomeStatement(
    incomeData: FinancialRowData[],
    incomeRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (incomeData.length === 0) return [];

    const sections: FinancialTableSection[] = [
      {
        title: 'Income Statement',
        rows: incomeData.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable ?? true,
          isCalculated: !row.editable,
          isBold: this.isBoldIncomeRow(row.label),
          isTotal: this.isTotalIncomeRow(row.label),
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      },
    ];

    if (incomeRatios && incomeRatios.length > 0) {
      sections.push({
        title: 'Financial Performance Ratios',
        rows: incomeRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
      });
    }

    return sections;
  }

  /**
   * Transform Balance Sheet rows + balance sheet ratios into table sections
   * NESTED: Grouped under containers with TOTAL rows injected for each subsection
   *
   * ASSETS (collapsible container)
   * ├─ Non-Current Assets (section header row)
   * │  ├─ [data rows]
   * │  └─ Total Non-Current Assets (sum row, teal-50, bold)
   * ├─ Current Assets (section header row)
   * │  ├─ [data rows]
   * │  └─ Total Current Assets (sum row, teal-50, bold)
   * └─ Total Assets (sum row, teal-50, bold)
   */
  static transformBalanceSheet(
    balanceData: BalanceSheetRowData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (balanceData.length === 0) return [];

    const sections: FinancialTableSection[] = [];

    // Extract and group asset rows by subsection
    const assetsBySubsection = this.groupAssetsBySubsection(balanceData);

    // ===== ASSETS GROUP CONTAINER =====
    const assetChildren: FinancialTableSection[] = [];

    // Non-Current Assets child section with total
    if (assetsBySubsection.nonCurrent.length > 0) {
      const nonCurrentTotal = this.calculateSectionTotal(
        assetsBySubsection.nonCurrent
      );
      assetChildren.push({
        title: ' ',
        rows: [
          ...assetsBySubsection.nonCurrent.map((row) => ({
            label: row.label,
            values: row.values,
            editable: row.editable,
            isCalculated: !row.editable,
            isBold: false,
            isTotal: false,
            type: 'currency' as const,
          })),
          // Total row for this subsection
          // {
          //   label: 'Total Non-Current Assets',
          //   values: nonCurrentTotal,
          //   editable: false,
          //   isCalculated: true,
          //   isBold: true,
          //   isTotal: true,
          //   type: 'currency' as const,
          //   styling: {
          //     rowClass: 'bg-teal-50 border-t-2 border-slate-200',
          //     labelClass: 'font-bold text-slate-900',
          //   },
          // },
        ],
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Current Assets child section with total
    if (assetsBySubsection.current.length > 0) {
      const currentTotal = this.calculateSectionTotal(
        assetsBySubsection.current
      );
      assetChildren.push({
        title: '',
        rows: [
          ...assetsBySubsection.current.map((row) => ({
            label: row.label,
            values: row.values,
            editable: row.editable,
            isCalculated: !row.editable,
            isBold: false,
            isTotal: false,
            type: 'currency' as const,
          })),
          // Total row for this subsection
          {
            label: 'Total Current Assets',
            values: currentTotal,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Total Assets
    const totalAssets = balanceData.find(
      (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
    );
    if (totalAssets) {
      assetChildren.push({
        title: '', // Empty title = no header
        rows: [
          {
            label: 'Total Assets',
            values: totalAssets.values,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
        isHeaderless: true,
      });
    }

    // Add ASSETS group container
    if (assetChildren.length > 0) {
      sections.push({
        title: 'ASSETS',
        rows: [],
        children: assetChildren,
        isGroupContainer: true,
        isCollapsible: true,
        defaultExpanded: true,
        spacingAfter: 'lg',
      });
    }

    // ===== EQUITIES & LIABILITIES GROUP CONTAINER =====
    const liabilityChildren: FinancialTableSection[] = [];

    // Equities child section with total
    const equities = balanceData.filter((r) => r.category === 'equity');
    if (equities.length > 0) {
      const equitiesTotal = this.calculateSectionTotal(equities);
      liabilityChildren.push({
        title: '',
        rows: [
          ...equities.map((row) => ({
            label: row.label,
            values: row.values,
            editable: row.editable,
            isCalculated: !row.editable,
            isBold: false,
            isTotal: false,
            type: 'currency' as const,
          })),
          // Total row
          {
            label: 'Total Equities',
            values: equitiesTotal,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Non-Current Liabilities child section with total
    const longTermLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
    );
    if (longTermLiabilities.length > 0) {
      const ltTotal = this.calculateSectionTotal(longTermLiabilities);
      liabilityChildren.push({
        title: 'Non Current Liabilities',
        rows: [
          ...longTermLiabilities.map((row) => ({
            label: row.label,
            values: row.values,
            editable: row.editable,
            isCalculated: !row.editable,
            isBold: false,
            isTotal: false,
            type: 'currency' as const,
          })),
          // Total row
          {
            label: 'Total Non-Current Liabilities',
            values: ltTotal,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Current Liabilities child section with total
    const currentLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'current'
    );
    if (currentLiabilities.length > 0) {
      const ctTotal = this.calculateSectionTotal(currentLiabilities);
      liabilityChildren.push({
        title: '',
        rows: [
          ...currentLiabilities.map((row) => ({
            label: row.label,
            values: row.values,
            editable: row.editable,
            isCalculated: !row.editable,
            isBold: false,
            isTotal: false,
            type: 'currency' as const,
          })),
          // Total row
          {
            label: 'Total Current Liabilities',
            values: ctTotal,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Total Equities and Liabilities
    const totalEL = balanceData.find(
      (r) =>
        r.label.toLowerCase() === 'total equities and liabilities' &&
        r.category === 'liabilities'
    );
    if (totalEL) {
      liabilityChildren.push({
        title: '', // Empty title = no header
        rows: [
          {
            label: 'Total Equities and Liabilities',
            values: totalEL.values,
            editable: false,
            isCalculated: true,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
            styling: {
              rowClass: 'bg-teal-50 border-t-2 border-slate-200',
              labelClass: 'font-bold text-slate-900',
            },
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
        isHeaderless: true,
      });
    }

    // Add EQUITIES AND LIABILITIES group container
    if (liabilityChildren.length > 0) {
      sections.push({
        title: 'EQUITIES AND LIABILITIES',
        rows: [],
        children: liabilityChildren,
        isGroupContainer: true,
        isCollapsible: true,
        defaultExpanded: true,
        spacingBefore: 'lg',
        spacingAfter: 'lg',
      });
    }

    // ===== FINANCIAL RATIOS (regular section, not grouped) =====
    if (balanceRatios && balanceRatios.length > 0) {
      sections.push({
        title: 'Financial Ratios',
        rows: balanceRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
        spacingBefore: 'lg',
      });
    }

    return sections;
  }

  /**
   * Transform Cash Flow rows into organized sections
   */
  static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
    if (data.length === 0) return [];

    const operatingRows: CashFlowRowData[] = [];
    const investingRows: CashFlowRowData[] = [];
    const financingRows: CashFlowRowData[] = [];
    const summaryRows: CashFlowRowData[] = [];

    for (const row of data) {
      switch (row.category) {
        case 'operating':
          operatingRows.push(row);
          break;
        case 'investing':
          investingRows.push(row);
          break;
        case 'financing':
          financingRows.push(row);
          break;
        case 'summary':
          summaryRows.push(row);
          break;
      }
    }

    const sections: FinancialTableSection[] = [];

    if (operatingRows.length > 0) {
      const operatingHeaderRow = operatingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from operating')
      );
      const operatingHeader =
        operatingHeaderRow?.label || 'Operating Activities';
      const operatingItems = operatingRows.filter(
        (r) => r !== operatingHeaderRow
      );

      sections.push({
        title: operatingHeader,
        rows: operatingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    if (investingRows.length > 0) {
      const investingHeaderRow = investingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from investing')
      );
      const investingHeader =
        investingHeaderRow?.label || 'Investing Activities';
      const investingItems = investingRows.filter(
        (r) => r !== investingHeaderRow
      );

      sections.push({
        title: investingHeader,
        rows: investingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    if (financingRows.length > 0) {
      const financingHeaderRow = financingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from financing')
      );
      const financingHeader =
        financingHeaderRow?.label || 'Financing Activities';
      const financingItems = financingRows.filter(
        (r) => r !== financingHeaderRow
      );

      sections.push({
        title: financingHeader,
        rows: financingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    if (summaryRows.length > 0) {
      sections.push({
        title: 'Summary',
        rows: summaryRows.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    return sections;
  }

  /**
   * Transform Financial Ratios into organized sections by type
   */
  static transformFinancialRatios(
    incomeRatios?: FinancialRatioData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    const sections: FinancialTableSection[] = [];

    if (incomeRatios && incomeRatios.length > 0) {
      sections.push({
        title: 'Income Statement Ratios',
        rows: incomeRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
      });
    }

    if (balanceRatios && balanceRatios.length > 0) {
      sections.push({
        title: 'Balance Sheet Ratios',
        rows: balanceRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
        spacingBefore: 'md',
      });
    }

    return sections;
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Calculate the SUM of a section's values column by column
   */
  private static calculateSectionTotal(
    rows: BalanceSheetRowData[] | FinancialRowData[]
  ): number[] {
    if (rows.length === 0) return [];

    const columnCount = rows[0]?.values.length || 0;
    const totals: number[] = [];

    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      const sum = rows.reduce(
        (acc, row) => acc + (row.values[colIndex] || 0),
        0
      );
      totals.push(sum);
    }

    return totals;
  }

  private static groupAssetsBySubsection(data: BalanceSheetRowData[]): {
    nonCurrent: BalanceSheetRowData[];
    current: BalanceSheetRowData[];
  } {
    return {
      nonCurrent: data.filter(
        (r) => r.category === 'assets' && r.subcategory === 'non-current'
      ),
      current: data.filter(
        (r) => r.category === 'assets' && r.subcategory === 'current'
      ),
    };
  }

  private static isBoldIncomeRow(label: string): boolean {
    const boldRows = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax',
      'Profit/(Loss) for the period',
    ];
    return boldRows.some((row) => label.toLowerCase() === row.toLowerCase());
  }

  private static isTotalIncomeRow(label: string): boolean {
    const totalRows = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax',
      'Profit/(Loss) for the period',
    ];
    return totalRows.some((row) => label.toLowerCase() === row.toLowerCase());
  }
}
