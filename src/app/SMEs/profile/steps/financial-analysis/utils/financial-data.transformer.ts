// // src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer-refactored.ts
// import {
//   FinancialTableSection,
//   FinancialTableRow,
// } from '../financial-table/financial-data-table.component';
// import {
//   FinancialRowData,
//   BalanceSheetRowData,
//   CashFlowRowData,
//   FinancialRatioData,
// } from './excel-parser.service';

// export class FinancialDataTransformer {
//   /**
//    * Transform Income Statement rows + income ratios into table sections
//    * Income statement data + separate collapsible section (orange) for income ratios
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

//     // Add income-based ratios as separate collapsible section (orange, expanded by default)
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
//    * NO REDUNDANT HEADERS - Clean structure:
//    * - Non-Current Assets
//    * - Current Assets
//    * - Total Assets (bold, teal-50 bg, as final row with spacing after)
//    * - Equities (with spacing before)
//    * - Liabilities (long-term)
//    * - Current Liabilities
//    * - Total Equities and Liabilities (bold, teal-50 bg, as final row with spacing after)
//    * - Financial Ratios (collapsible, orange, with spacing before)
//    */
//   static transformBalanceSheet(
//     balanceData: BalanceSheetRowData[],
//     balanceRatios?: FinancialRatioData[]
//   ): FinancialTableSection[] {
//     if (balanceData.length === 0) return [];

//     const sections: FinancialTableSection[] = [];

//     // Extract and group asset rows by subsection
//     const assetsBySubsection = this.groupAssetsBySubsection(balanceData);

//     // ===== NON-CURRENT ASSETS =====
//     if (assetsBySubsection.nonCurrent.length > 0) {
//       sections.push({
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

//     // ===== CURRENT ASSETS =====
//     if (assetsBySubsection.current.length > 0) {
//       sections.push({
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

//     // ===== TOTAL ASSETS (bold row with design system styling) =====
//     const totalAssets = balanceData.find(
//       (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
//     );
//     if (totalAssets) {
//       sections.push({
//         title: 'Total Assets',
//         rows: [
//           {
//             label: totalAssets.label,
//             values: totalAssets.values,
//             editable: false,
//             isCalculated: true,
//             isBold: true,
//             isTotal: true,
//             type: 'currency' as const,
//             // Design system: bg-teal-50, top border, bold text
//             styling: {
//               rowClass: 'bg-teal-50 border-t-2 border-slate-200',
//               labelClass: 'font-bold text-slate-900',
//             },
//           },
//         ],
//         isCollapsible: false,
//         defaultExpanded: true,
//         isSimpleRow: true,
//         spacingAfter: 'lg', // Space before next major section (Equities)
//       });
//     }

//     // ===== EQUITIES (with spacing before) =====
//     const equities = balanceData.filter((r) => r.category === 'equity');
//     if (equities.length > 0) {
//       sections.push({
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
//         spacingBefore: 'lg', // Visual break from assets section
//       });
//     }

//     // ===== LONG-TERM LIABILITIES =====
//     const longTermLiabilities = balanceData.filter(
//       (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
//     );
//     if (longTermLiabilities.length > 0) {
//       sections.push({
//         title: 'Liabilities',
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

//     // ===== CURRENT LIABILITIES =====
//     const currentLiabilities = balanceData.filter(
//       (r) => r.category === 'liabilities' && r.subcategory === 'current'
//     );
//     if (currentLiabilities.length > 0) {
//       sections.push({
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

//     // ===== TOTAL EQUITIES AND LIABILITIES (bold row with design system styling) =====
//     const totalEL = balanceData.find(
//       (r) =>
//         r.label.toLowerCase() === 'total equities and liabilities' &&
//         r.category === 'liabilities'
//     );
//     if (totalEL) {
//       sections.push({
//         title: 'Total Equities and Liabilities',
//         rows: [
//           {
//             label: totalEL.label,
//             values: totalEL.values,
//             editable: false,
//             isCalculated: true,
//             isBold: true,
//             isTotal: true,
//             type: 'currency' as const,
//             // Design system: bg-teal-50, top border, bold text
//             styling: {
//               rowClass: 'bg-teal-50 border-t-2 border-slate-200',
//               labelClass: 'font-bold text-slate-900',
//             },
//           },
//         ],
//         isCollapsible: false,
//         defaultExpanded: true,
//         isSimpleRow: true,
//         spacingAfter: 'lg', // Space before ratios section
//       });
//     }

//     // ===== FINANCIAL RATIOS (collapsible, orange, with spacing before) =====
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
//    * Groups by: Operating | Investing | Financing | Summary
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

//     // ===== OPERATING ACTIVITIES =====
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

//     // ===== INVESTING ACTIVITIES =====
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

//     // ===== FINANCING ACTIVITIES =====
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

//     // ===== SUMMARY SECTION =====
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

// // src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer-NESTED.ts
// import {
//   FinancialTableSection,
//   FinancialTableRow,
// } from '../financial-table/financial-data-table.component';
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
//    * NEW: Nested structure with group containers
//    *
//    * ASSETS (collapsible container)
//    * ├─ Non-Current Assets (child section)
//    * ├─ Current Assets (child section)
//    * └─ Total Assets (child section - single row, styled)
//    *
//    * EQUITIES AND LIABILITIES (collapsible container)
//    * ├─ Equities (child section)
//    * ├─ Liabilities (child section)
//    * ├─ Current Liabilities (child section)
//    * └─ Total Equities and Liabilities (child section - single row, styled)
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

//     // Total Assets child section (single row with styling)
//     const totalAssets = balanceData.find(
//       (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
//     );
//     if (totalAssets) {
//       assetChildren.push({
//         title: 'Total Assets',
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
//       });
//     }

//     // Add ASSETS group container
//     if (assetChildren.length > 0) {
//       sections.push({
//         title: 'ASSETS',
//         rows: [], // Group containers have no direct rows
//         children: assetChildren,
//         isGroupContainer: true,
//         isCollapsible: true,
//         defaultExpanded: true,
//         spacingAfter: 'lg', // Space before equities section
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
//         title: 'Liabilities',
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

//     // Total Equities and Liabilities child section (single row with styling)
//     const totalEL = balanceData.find(
//       (r) =>
//         r.label.toLowerCase() === 'total equities and liabilities' &&
//         r.category === 'liabilities'
//     );
//     if (totalEL) {
//       liabilityChildren.push({
//         title: 'Total Equities and Liabilities',
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
//       });
//     }

//     // Add EQUITIES AND LIABILITIES group container
//     if (liabilityChildren.length > 0) {
//       sections.push({
//         title: 'EQUITIES AND LIABILITIES',
//         rows: [], // Group containers have no direct rows
//         children: liabilityChildren,
//         isGroupContainer: true,
//         isCollapsible: true,
//         defaultExpanded: true,
//         spacingBefore: 'lg', // Space after assets
//         spacingAfter: 'lg', // Space before ratios
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
import {
  FinancialTableSection,
  FinancialTableRow,
} from '../financial-table/financial-data-table.component';
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
   * NESTED: Grouped under containers with NO redundant headers for total rows
   *
   * ASSETS (collapsible container)
   * ├─ Non-Current Assets (section with header)
   * ├─ Current Assets (section with header)
   * └─ Total Assets (NO header, just the row with teal-50 + bold)
   *
   * EQUITIES AND LIABILITIES (collapsible container)
   * ├─ Equities (section with header)
   * ├─ Liabilities (section with header)
   * ├─ Current Liabilities (section with header)
   * └─ Total Equities and Liabilities (NO header, just the row with teal-50 + bold)
   *
   * Financial Ratios (regular section, collapsible, orange)
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

    // Non-Current Assets child section
    if (assetsBySubsection.nonCurrent.length > 0) {
      assetChildren.push({
        title: 'Non-Current Assets',
        rows: assetsBySubsection.nonCurrent.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Current Assets child section
    if (assetsBySubsection.current.length > 0) {
      assetChildren.push({
        title: 'Current Assets',
        rows: assetsBySubsection.current.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Total Assets - NO section header, just the row
    const totalAssets = balanceData.find(
      (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
    );
    if (totalAssets) {
      assetChildren.push({
        title: '', // Empty title = no header rendered
        rows: [
          {
            label: totalAssets.label,
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
        isHeaderless: true, // Skip header rendering
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

    // Equities child section
    const equities = balanceData.filter((r) => r.category === 'equity');
    if (equities.length > 0) {
      liabilityChildren.push({
        title: 'Equities',
        rows: equities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Liabilities child section (long-term)
    const longTermLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
    );
    if (longTermLiabilities.length > 0) {
      liabilityChildren.push({
        title: 'Liabilities',
        rows: longTermLiabilities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Current Liabilities child section
    const currentLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'current'
    );
    if (currentLiabilities.length > 0) {
      liabilityChildren.push({
        title: 'Current Liabilities',
        rows: currentLiabilities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Total Equities and Liabilities - NO section header, just the row
    const totalEL = balanceData.find(
      (r) =>
        r.label.toLowerCase() === 'total equities and liabilities' &&
        r.category === 'liabilities'
    );
    if (totalEL) {
      liabilityChildren.push({
        title: '', // Empty title = no header rendered
        rows: [
          {
            label: totalEL.label,
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
        isHeaderless: true, // Skip header rendering
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
