// import { Injectable, inject } from '@angular/core';
// import {
//   KapifyReports,
//   // KapifyReportsExportOptions,
// } from '../models/kapify-reports.interface';
// import { KapifyReportsTransformerService } from './kapify-reports-transformer.service';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// /**
//  * KapifyReports Export Service
//  * Handles exporting reports to Excel, PDF, CSV formats
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class KapifyReportsExportService {
//   private transformer = inject(KapifyReportsTransformerService);
//   private supabase = inject(SharedSupabaseService);

//   /**
//    * Export reports to Excel
//    */
//   async exportToExcel(
//     reports: KapifyReports[],
//     fileName?: string
//   ): Promise<Blob> {
//     console.log(`📊 [EXPORT] Exporting ${reports.length} reports to Excel`);

//     try {
//       const XLSX = await this.dynamicImport('xlsx');

//       // Prepare data for Excel
//       const wsData = this.prepareExcelData(reports);

//       // Create workbook
//       const ws = XLSX.utils.aoa_to_sheet(wsData);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Reports');

//       // Set column widths
//       ws['!cols'] = this.getExcelColumnWidths();

//       // Freeze header row
//       ws['!freeze'] = { xSplit: 0, ySplit: 1 };

//       // Generate Excel file
//       const timestamp = new Date().toISOString().split('T')[0];
//       const finalFileName =
//         fileName || `KapifyReports_${timestamp}_${reports.length}records.xlsx`;

//       const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//       const blob = new Blob([buffer], {
//         type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       });

//       console.log(`✅ [EXPORT] Excel file created: ${finalFileName}`);
//       this.downloadFile(blob, finalFileName);

//       return blob;
//     } catch (error) {
//       console.error('❌ [EXPORT] Error exporting to Excel:', error);
//       throw error;
//     }
//   }

//   /**
//    * Export reports to CSV
//    */
//   async exportToCSV(
//     reports: KapifyReports[],
//     fileName?: string
//   ): Promise<Blob> {
//     console.log(`📋 [EXPORT] Exporting ${reports.length} reports to CSV`);

//     try {
//       // Prepare CSV content
//       const csv = this.prepareCSVData(reports);

//       // Create blob
//       const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

//       // Download
//       const timestamp = new Date().toISOString().split('T')[0];
//       const finalFileName =
//         fileName || `KapifyReports_${timestamp}_${reports.length}records.csv`;

//       console.log(`✅ [EXPORT] CSV file created: ${finalFileName}`);
//       this.downloadFile(blob, finalFileName);

//       return blob;
//     } catch (error) {
//       console.error('❌ [EXPORT] Error exporting to CSV:', error);
//       throw error;
//     }
//   }

//   /**
//    * Export reports to PDF (simplified - no autotable dependency)
//    */
//   async exportToPDF(
//     reports: KapifyReports[],
//     fileName?: string
//   ): Promise<Blob> {
//     console.log(`📄 [EXPORT] Exporting ${reports.length} reports to PDF`);

//     try {
//       const { jsPDF } = await import('jspdf');

//       // Create PDF
//       const doc = new jsPDF({
//         orientation: 'landscape',
//         unit: 'mm',
//         format: 'a4',
//       });

//       // Prepare table data
//       const { headers, rows } = this.preparePDFData(reports);

//       // Add header
//       doc.setFontSize(16);
//       doc.text('KapifyReports', 10, 10);
//       doc.setFontSize(10);
//       doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 16);

//       // Add table manually without plugin
//       this.addTableToDoc(doc, headers, rows);

//       // Add footer
//       const pageCount = doc.getNumberOfPages();
//       for (let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);
//         doc.setFontSize(8);
//         doc.text(
//           `Page ${i} of ${pageCount}`,
//           doc.internal.pageSize.getWidth() / 2,
//           doc.internal.pageSize.getHeight() - 5,
//           { align: 'center' }
//         );
//       }

//       // Generate PDF
//       const blob = doc.output('blob');

//       // Download
//       const timestamp = new Date().toISOString().split('T')[0];
//       const finalFileName =
//         fileName || `KapifyReports_${timestamp}_${reports.length}records.pdf`;

//       console.log(`✅ [EXPORT] PDF file created: ${finalFileName}`);
//       this.downloadFile(blob, finalFileName);

//       return blob;
//     } catch (error) {
//       console.error('❌ [EXPORT] Error exporting to PDF:', error);
//       throw error;
//     }
//   }

//   /**
//    * Manually add table to jsPDF document
//    */
//   private addTableToDoc(doc: any, headers: string[], rows: any[][]): void {
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const margin = 10;
//     const startY = 25;
//     const cellHeight = 7;
//     const headerHeight = 8;
//     const columnWidth = (pageWidth - margin * 2) / headers.length;

//     let currentY = startY;

//     // Draw header
//     doc.setFillColor(20, 184, 166); // teal-500
//     doc.setTextColor(255, 255, 255);
//     doc.setFont(undefined, 'bold');
//     doc.setFontSize(9);

//     headers.forEach((header, i) => {
//       doc.rect(
//         margin + i * columnWidth,
//         currentY,
//         columnWidth,
//         headerHeight,
//         'F'
//       );
//       doc.text(
//         header,
//         margin + i * columnWidth + 2,
//         currentY + headerHeight / 2 + 2,
//         { maxWidth: columnWidth - 4, align: 'left' }
//       );
//     });

//     currentY += headerHeight;

//     // Draw rows
//     doc.setTextColor(0, 0, 0);
//     doc.setFont(undefined, 'normal');
//     doc.setFontSize(8);

//     rows.forEach((row, rowIndex) => {
//       // Check if we need a new page
//       if (currentY + cellHeight > pageHeight - margin) {
//         doc.addPage();
//         currentY = margin;

//         // Redraw header on new page
//         doc.setFillColor(20, 184, 166);
//         doc.setTextColor(255, 255, 255);
//         doc.setFont(undefined, 'bold');
//         doc.setFontSize(9);

//         headers.forEach((header, i) => {
//           doc.rect(
//             margin + i * columnWidth,
//             currentY,
//             columnWidth,
//             headerHeight,
//             'F'
//           );
//           doc.text(
//             header,
//             margin + i * columnWidth + 2,
//             currentY + headerHeight / 2 + 2,
//             { maxWidth: columnWidth - 4, align: 'left' }
//           );
//         });

//         currentY += headerHeight;
//         doc.setTextColor(0, 0, 0);
//         doc.setFont(undefined, 'normal');
//         doc.setFontSize(8);
//       }

//       // Alternate row colors
//       if (rowIndex % 2 === 0) {
//         doc.setFillColor(241, 245, 249); // slate-50
//         doc.rect(margin, currentY, pageWidth - margin * 2, cellHeight, 'F');
//       }

//       // Draw cell borders
//       row.forEach((cell, colIndex) => {
//         doc.rect(
//           margin + colIndex * columnWidth,
//           currentY,
//           columnWidth,
//           cellHeight
//         );
//         doc.text(
//           String(cell),
//           margin + colIndex * columnWidth + 2,
//           currentY + 5,
//           {
//             maxWidth: columnWidth - 4,
//             align: 'left',
//           }
//         );
//       });

//       currentY += cellHeight;
//     });
//   }

//   // ===============================
//   // HELPER METHODS
//   // ===============================

//   /**
//    * Prepare data for Excel export
//    */
//   private prepareExcelData(reports: KapifyReports[]): any[][] {
//     // Header row
//     const headers = [
//       'No.',
//       'Business Name',
//       'Industry',
//       'Address',
//       'Business Details',
//       'Stage',
//       'Years Operating',
//       'Employees',
//       'BBBEE Level',
//       'Province',
//       'Annual Revenue',
//       'Contact First Name',
//       'Contact Last Name',
//       'Email',
//       'Phone',
//       'Role',
//       'Amount Requested',
//       'Funding Type',
//       'Funding Opportunity',
//       'Use of Funds',
//       'Application Status',
//     ];

//     // Data rows
//     const rows = reports.map((report) => [
//       report.no,
//       report.nameOfBusiness,
//       report.industry,
//       report.physicalAddress,
//       report.businessDetails,
//       report.businessStage,
//       report.yearsInOperation,
//       report.numberOfEmployees,
//       report.bbbeeLeve || '',
//       report.province,
//       this.transformer.formatNumber(report.priorYearAnnualRevenue),
//       report.firstName,
//       report.surname,
//       report.email,
//       report.phoneNumber,
//       report.role,
//       this.transformer.formatNumber(report.amountRequested),
//       report.fundingType,
//       report.fundingOpportunity,
//       report.useOfFunds,
//       report.applicationStatus,
//     ]);

//     return [headers, ...rows];
//   }

//   /**
//    * Get Excel column widths
//    */
//   private getExcelColumnWidths(): Array<{ wch: number }> {
//     return [
//       { wch: 4 }, // No.
//       { wch: 20 }, // Business Name
//       { wch: 15 }, // Industry
//       { wch: 30 }, // Address
//       { wch: 25 }, // Business Details
//       { wch: 12 }, // Stage
//       { wch: 10 }, // Years Operating
//       { wch: 10 }, // Employees
//       { wch: 10 }, // BBBEE Level
//       { wch: 12 }, // Province
//       { wch: 15 }, // Annual Revenue
//       { wch: 15 }, // Contact First Name
//       { wch: 15 }, // Contact Last Name
//       { wch: 20 }, // Email
//       { wch: 15 }, // Phone
//       { wch: 15 }, // Role
//       { wch: 15 }, // Amount Requested
//       { wch: 12 }, // Funding Type
//       { wch: 20 }, // Funding Opportunity
//       { wch: 30 }, // Use of Funds
//       { wch: 12 }, // Application Status
//     ];
//   }

//   /**
//    * Prepare data for PDF export
//    */
//   private preparePDFData(reports: KapifyReports[]): {
//     headers: string[];
//     rows: any[][];
//   } {
//     const headers = [
//       'No.',
//       'Business',
//       'Industry',
//       'Contact',
//       'Email',
//       'Amount',
//       'Type',
//       'Status',
//     ];

//     const rows = reports.map((report) => [
//       report.no.toString(),
//       report.nameOfBusiness,
//       report.industry,
//       `${report.firstName} ${report.surname}`,
//       report.email,
//       this.transformer.formatCurrency(report.amountRequested),
//       report.fundingType,
//       report.applicationStatus,
//     ]);

//     return { headers, rows };
//   }

//   /**
//    * Prepare data for CSV export
//    */
//   private prepareCSVData(reports: KapifyReports[]): string {
//     const headers = [
//       'No.',
//       'Business Name',
//       'Industry',
//       'Address',
//       'Business Details',
//       'Stage',
//       'Years Operating',
//       'Employees',
//       'BBBEE Level',
//       'Province',
//       'Annual Revenue',
//       'Contact First Name',
//       'Contact Last Name',
//       'Email',
//       'Phone',
//       'Role',
//       'Amount Requested',
//       'Funding Type',
//       'Funding Opportunity',
//       'Use of Funds',
//       'Application Status',
//     ];

//     // Escape CSV values
//     const rows = reports.map((report) =>
//       [
//         report.no,
//         this.escapeCSV(report.nameOfBusiness),
//         this.escapeCSV(report.industry),
//         this.escapeCSV(report.physicalAddress),
//         this.escapeCSV(report.businessDetails),
//         report.businessStage,
//         report.yearsInOperation,
//         report.numberOfEmployees,
//         report.bbbeeLeve || '',
//         this.escapeCSV(report.province),
//         report.priorYearAnnualRevenue,
//         this.escapeCSV(report.firstName),
//         this.escapeCSV(report.surname),
//         this.escapeCSV(report.email),
//         this.escapeCSV(report.phoneNumber),
//         this.escapeCSV(report.role),
//         report.amountRequested,
//         report.fundingType,
//         this.escapeCSV(report.fundingOpportunity),
//         this.escapeCSV(report.useOfFunds),
//         report.applicationStatus,
//       ].join(',')
//     );

//     return [headers.join(','), ...rows].join('\n');
//   }

//   /**
//    * Escape CSV value
//    */
//   private escapeCSV(value: string): string {
//     if (!value) return '';

//     if (value.includes(',') || value.includes('"') || value.includes('\n')) {
//       return `"${value.replace(/"/g, '""')}"`;
//     }

//     return value;
//   }

//   /**
//    * Download file to user's device
//    */
//   private downloadFile(blob: Blob, fileName: string): void {
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = fileName;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);

//     console.log(`💾 [DOWNLOAD] File downloaded: ${fileName}`);
//   }

//   /**
//    * Dynamic import for optional dependencies
//    */
//   private async dynamicImport(moduleName: string): Promise<any> {
//     try {
//       if (moduleName === 'xlsx') {
//         return await import('xlsx');
//       } else if (moduleName === 'jspdf') {
//         return await import('jspdf');
//       } else if (moduleName === 'jspdf-autotable') {
//         return await import('jspdf-autotable');
//       }
//     } catch (error) {
//       console.error(
//         `❌ [EXPORT] Failed to import ${moduleName}. Make sure it's installed.`,
//         error
//       );
//       throw new Error(
//         `Missing dependency: ${moduleName}. Install with: npm install ${moduleName}`
//       );
//     }
//   }

//   /**
//    * Filter reports to only include user's own + organization's applications
//    */
//   async filterReportsByUserAndOrg(
//     reports: KapifyReports[]
//   ): Promise<KapifyReports[]> {
//     try {
//       const userId = this.supabase.getCurrentUserId();
//       if (!userId) {
//         throw new Error('User not authenticated');
//       }

//       // Get organization user IDs
//       const orgUserIds = await this.getOrganizationUserIds(userId);

//       // Filter reports - match on email (since KapifyReports has email field)
//       // OR match on applicantId if we add it to the interface
//       const userEmails = await this.getUserEmails(orgUserIds);

//       const filtered = reports.filter((report) =>
//         userEmails.includes(report.email)
//       );

//       console.log(
//         `🔒 [EXPORT] Filtered ${reports.length} → ${filtered.length} reports (user + org only)`
//       );

//       return filtered;
//     } catch (error) {
//       console.error('❌ [EXPORT] Error filtering reports:', error);
//       // Fallback: return empty to prevent leaking data
//       return [];
//     }
//   }

//   /**
//    * Get organization user IDs (including current user)
//    */
//   private async getOrganizationUserIds(userId: string): Promise<string[]> {
//     try {
//       // Get user's organizations
//       const { data: orgUsers, error: orgError } = await this.supabase
//         .from('organization_users')
//         .select('organization_id')
//         .eq('user_id', userId)
//         .eq('status', 'active');

//       if (orgError) {
//         console.warn('⚠️ [EXPORT] Error fetching org membership:', orgError);
//         return [userId]; // Fallback to just current user
//       }

//       if (!orgUsers || orgUsers.length === 0) {
//         return [userId]; // User not in any org
//       }

//       const orgIds = orgUsers.map((ou) => ou.organization_id);

//       // Get all users in these organizations
//       const { data: allOrgUsers, error: allUsersError } = await this.supabase
//         .from('organization_users')
//         .select('user_id')
//         .in('organization_id', orgIds)
//         .eq('status', 'active');

//       if (allUsersError) {
//         console.warn('⚠️ [EXPORT] Error fetching org users:', allUsersError);
//         return [userId];
//       }

//       const userIds = [
//         ...new Set(allOrgUsers?.map((ou) => ou.user_id).filter(Boolean) || []),
//       ];

//       // Always include current user
//       if (!userIds.includes(userId)) {
//         userIds.push(userId);
//       }

//       console.log('👥 [EXPORT] Organization user IDs:', userIds.length);

//       return userIds;
//     } catch (error) {
//       console.error('❌ [EXPORT] Error getting org user IDs:', error);
//       return [userId]; // Fallback to current user only
//     }
//   }

//   /**
//    * Get user emails from user IDs
//    */
//   private async getUserEmails(userIds: string[]): Promise<string[]> {
//     const { data } = await this.supabase
//       .from('users')
//       .select('email')
//       .in('id', userIds);

//     return data?.map((u) => u.email) || [];
//   }
// }
import { Injectable, inject } from '@angular/core';
import { KapifyReports } from '../models/kapify-reports.interface';
import { KapifyReportsTransformerService } from './kapify-reports-transformer.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { GenericExportService } from 'src/app/core/services/kapify-export.service';
import { ExportColumn } from 'src/app/core/models/export-options.interface';
import { ReportExportConfig } from './kapify-reports.service';

/**
 * MERGED KapifyReports Export Service
 * - Exports existing KapifyReports to Excel/PDF/CSV
 * - Exports saved application reports with stored configuration
 *
 * USAGE:
 * 1. For existing reports: exportToExcel(reports), exportToPDF(reports), exportToCSV(reports)
 * 2. For saved reports: exportReport(data, config, fileName)
 */
@Injectable({
  providedIn: 'root',
})
export class KapifyReportsExportService {
  private transformer = inject(KapifyReportsTransformerService);
  private supabase = inject(SharedSupabaseService);
  private exportService = inject(GenericExportService);

  // ===============================
  // EXISTING REPORTS EXPORT
  // ===============================

  /**
   * Export existing KapifyReports to Excel
   */
  async exportToExcel(
    reports: KapifyReports[],
    fileName?: string
  ): Promise<Blob> {
    console.log(`📊 [EXPORT] Exporting ${reports.length} reports to Excel`);

    try {
      const XLSX = await this.dynamicImport('xlsx');

      // Prepare data for Excel
      const wsData = this.prepareExcelData(reports);

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reports');

      // Set column widths
      ws['!cols'] = this.getExcelColumnWidths();

      // Freeze header row
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };

      // Generate Excel file
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFileName =
        fileName || `KapifyReports_${timestamp}_${reports.length}records.xlsx`;

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      console.log(`✅ [EXPORT] Excel file created: ${finalFileName}`);
      this.downloadFile(blob, finalFileName);

      return blob;
    } catch (error) {
      console.error('❌ [EXPORT] Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Export existing KapifyReports to CSV
   */
  async exportToCSV(
    reports: KapifyReports[],
    fileName?: string
  ): Promise<Blob> {
    console.log(`📋 [EXPORT] Exporting ${reports.length} reports to CSV`);

    try {
      // Prepare CSV content
      const csv = this.prepareCSVData(reports);

      // Create blob
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      // Download
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFileName =
        fileName || `KapifyReports_${timestamp}_${reports.length}records.csv`;

      console.log(`✅ [EXPORT] CSV file created: ${finalFileName}`);
      this.downloadFile(blob, finalFileName);

      return blob;
    } catch (error) {
      console.error('❌ [EXPORT] Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export existing KapifyReports to PDF (simplified - no autotable dependency)
   */
  async exportToPDF(
    reports: KapifyReports[],
    fileName?: string
  ): Promise<Blob> {
    console.log(`📄 [EXPORT] Exporting ${reports.length} reports to PDF`);

    try {
      const { jsPDF } = await import('jspdf');

      // Create PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Prepare table data
      const { headers, rows } = this.preparePDFData(reports);

      // Add header
      doc.setFontSize(16);
      doc.text('KapifyReports', 10, 10);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 10, 16);

      // Add table manually without plugin
      this.addTableToDoc(doc, headers, rows);

      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        );
      }

      // Generate PDF
      const blob = doc.output('blob');

      // Download
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFileName =
        fileName || `KapifyReports_${timestamp}_${reports.length}records.pdf`;

      console.log(`✅ [EXPORT] PDF file created: ${finalFileName}`);
      this.downloadFile(blob, finalFileName);

      return blob;
    } catch (error) {
      console.error('❌ [EXPORT] Error exporting to PDF:', error);
      throw error;
    }
  }

  // ===============================
  // SAVED REPORTS EXPORT
  // ===============================

  /**
   * Export a saved application report using its stored configuration
   * Used by KapifyApplicationReportsComponent
   */
  async exportReport(
    data: any[], // ApplicationReportRecord[]
    config: ReportExportConfig,
    fileName: string
  ): Promise<void> {
    // Map field names to display labels
    const fieldLabels: Record<string, string> = {
      nameOfBusiness: 'Business Name',
      industry: 'Industry',
      businessStage: 'Business Stage',
      yearsInOperation: 'Years in Operation',
      numberOfEmployees: 'Employees',
      province: 'Province',
      priorYearAnnualRevenue: 'Prior Year Revenue',
      firstName: 'First Name',
      surname: 'Surname',
      email: 'Email',
      phoneNumber: 'Phone Number',
      amountRequested: 'Amount Requested',
      fundingType: 'Funding Type',
      applicationStatus: 'Application Status',
      funderName: 'Funder Name',
      createdAt: 'Created Date',
      updatedAt: 'Updated Date',
    };

    // Build columns from selected fields
    const columns: ExportColumn<any>[] = config.selectedFields
      .map((fieldKey: string) => {
        const column: ExportColumn<any> = {
          header: fieldLabels[fieldKey] || fieldKey,
          key: fieldKey as keyof any,
          width: 15,
        };

        // Apply formatting based on field type
        if (
          fieldKey === 'amountRequested' ||
          fieldKey === 'priorYearAnnualRevenue'
        ) {
          column.format = (val) => this.formatCurrency(val);
        } else if (fieldKey === 'createdAt' || fieldKey === 'updatedAt') {
          column.format = (val) => this.formatDate(val);
        }

        return column;
      })
      .filter((col) => col.key); // Ensure only valid columns

    // Execute export with the stored configuration
    await this.exportService.export(data, {
      fileName,
      format: config.format,
      columns,
      pdf: {
        title: fileName,
        orientation: 'landscape',
      },
    });
  }

  // ===============================
  // HELPER METHODS - EXISTING REPORTS
  // ===============================

  /**
   * Manually add table to jsPDF document
   */
  private addTableToDoc(doc: any, headers: string[], rows: any[][]): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const startY = 25;
    const cellHeight = 7;
    const headerHeight = 8;
    const columnWidth = (pageWidth - margin * 2) / headers.length;

    let currentY = startY;

    // Draw header
    doc.setFillColor(20, 184, 166); // teal-500
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);

    headers.forEach((header, i) => {
      doc.rect(
        margin + i * columnWidth,
        currentY,
        columnWidth,
        headerHeight,
        'F'
      );
      doc.text(
        header,
        margin + i * columnWidth + 2,
        currentY + headerHeight / 2 + 2,
        { maxWidth: columnWidth - 4, align: 'left' }
      );
    });

    currentY += headerHeight;

    // Draw rows
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);

    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY + cellHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;

        // Redraw header on new page
        doc.setFillColor(20, 184, 166);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);

        headers.forEach((header, i) => {
          doc.rect(
            margin + i * columnWidth,
            currentY,
            columnWidth,
            headerHeight,
            'F'
          );
          doc.text(
            header,
            margin + i * columnWidth + 2,
            currentY + headerHeight / 2 + 2,
            { maxWidth: columnWidth - 4, align: 'left' }
          );
        });

        currentY += headerHeight;
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
      }

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(241, 245, 249); // slate-50
        doc.rect(margin, currentY, pageWidth - margin * 2, cellHeight, 'F');
      }

      // Draw cell borders
      row.forEach((cell, colIndex) => {
        doc.rect(
          margin + colIndex * columnWidth,
          currentY,
          columnWidth,
          cellHeight
        );
        doc.text(
          String(cell),
          margin + colIndex * columnWidth + 2,
          currentY + 5,
          {
            maxWidth: columnWidth - 4,
            align: 'left',
          }
        );
      });

      currentY += cellHeight;
    });
  }

  /**
   * Prepare data for Excel export
   */
  private prepareExcelData(reports: KapifyReports[]): any[][] {
    // Header row
    const headers = [
      'No.',
      'Business Name',
      'Industry',
      'Address',
      'Business Details',
      'Stage',
      'Years Operating',
      'Employees',
      'BBBEE Level',
      'Province',
      'Annual Revenue',
      'Contact First Name',
      'Contact Last Name',
      'Email',
      'Phone',
      'Role',
      'Amount Requested',
      'Funding Type',
      'Funding Opportunity',
      'Use of Funds',
      'Application Status',
    ];

    // Data rows
    const rows = reports.map((report) => [
      report.no,
      report.nameOfBusiness,
      report.industry,
      report.physicalAddress,
      report.businessDetails,
      report.businessStage,
      report.yearsInOperation,
      report.numberOfEmployees,
      report.bbbeeLeve || '',
      report.province,
      this.transformer.formatNumber(report.priorYearAnnualRevenue),
      report.firstName,
      report.surname,
      report.email,
      report.phoneNumber,
      report.role,
      this.transformer.formatNumber(report.amountRequested),
      report.fundingType,
      report.fundingOpportunity,
      report.useOfFunds,
      report.applicationStatus,
    ]);

    return [headers, ...rows];
  }

  /**
   * Get Excel column widths
   */
  private getExcelColumnWidths(): Array<{ wch: number }> {
    return [
      { wch: 4 }, // No.
      { wch: 20 }, // Business Name
      { wch: 15 }, // Industry
      { wch: 30 }, // Address
      { wch: 25 }, // Business Details
      { wch: 12 }, // Stage
      { wch: 10 }, // Years Operating
      { wch: 10 }, // Employees
      { wch: 10 }, // BBBEE Level
      { wch: 12 }, // Province
      { wch: 15 }, // Annual Revenue
      { wch: 15 }, // Contact First Name
      { wch: 15 }, // Contact Last Name
      { wch: 20 }, // Email
      { wch: 15 }, // Phone
      { wch: 15 }, // Role
      { wch: 15 }, // Amount Requested
      { wch: 12 }, // Funding Type
      { wch: 20 }, // Funding Opportunity
      { wch: 30 }, // Use of Funds
      { wch: 12 }, // Application Status
    ];
  }

  /**
   * Prepare data for PDF export
   */
  private preparePDFData(reports: KapifyReports[]): {
    headers: string[];
    rows: any[][];
  } {
    const headers = [
      'No.',
      'Business',
      'Industry',
      'Contact',
      'Email',
      'Amount',
      'Type',
      'Status',
    ];

    const rows = reports.map((report) => [
      report.no.toString(),
      report.nameOfBusiness,
      report.industry,
      `${report.firstName} ${report.surname}`,
      report.email,
      this.transformer.formatCurrency(report.amountRequested),
      report.fundingType,
      report.applicationStatus,
    ]);

    return { headers, rows };
  }

  /**
   * Prepare data for CSV export
   */
  private prepareCSVData(reports: KapifyReports[]): string {
    const headers = [
      'No.',
      'Business Name',
      'Industry',
      'Address',
      'Business Details',
      'Stage',
      'Years Operating',
      'Employees',
      'BBBEE Level',
      'Province',
      'Annual Revenue',
      'Contact First Name',
      'Contact Last Name',
      'Email',
      'Phone',
      'Role',
      'Amount Requested',
      'Funding Type',
      'Funding Opportunity',
      'Use of Funds',
      'Application Status',
    ];

    // Escape CSV values
    const rows = reports.map((report) =>
      [
        report.no,
        this.escapeCSV(report.nameOfBusiness),
        this.escapeCSV(report.industry),
        this.escapeCSV(report.physicalAddress),
        this.escapeCSV(report.businessDetails),
        report.businessStage,
        report.yearsInOperation,
        report.numberOfEmployees,
        report.bbbeeLeve || '',
        this.escapeCSV(report.province),
        report.priorYearAnnualRevenue,
        this.escapeCSV(report.firstName),
        this.escapeCSV(report.surname),
        this.escapeCSV(report.email),
        this.escapeCSV(report.phoneNumber),
        this.escapeCSV(report.role),
        report.amountRequested,
        report.fundingType,
        this.escapeCSV(report.fundingOpportunity),
        this.escapeCSV(report.useOfFunds),
        report.applicationStatus,
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: string): string {
    if (!value) return '';

    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Download file to user's device
   */
  private downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`💾 [DOWNLOAD] File downloaded: ${fileName}`);
  }

  /**
   * Dynamic import for optional dependencies
   */
  private async dynamicImport(moduleName: string): Promise<any> {
    try {
      if (moduleName === 'xlsx') {
        return await import('xlsx');
      } else if (moduleName === 'jspdf') {
        return await import('jspdf');
      } else if (moduleName === 'jspdf-autotable') {
        return await import('jspdf-autotable');
      }
    } catch (error) {
      console.error(
        `❌ [EXPORT] Failed to import ${moduleName}. Make sure it's installed.`,
        error
      );
      throw new Error(
        `Missing dependency: ${moduleName}. Install with: npm install ${moduleName}`
      );
    }
  }

  // ===============================
  // HELPER METHODS - FORMATTING
  // ===============================

  /**
   * Format currency for ZAR
   */
  private formatCurrency(amount: number): string {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format date
   */
  private formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  /**
   * Filter reports to only include user's own + organization's applications
   */
  async filterReportsByUserAndOrg(
    reports: KapifyReports[]
  ): Promise<KapifyReports[]> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get organization user IDs
      const orgUserIds = await this.getOrganizationUserIds(userId);

      // Filter reports - match on email (since KapifyReports has email field)
      const userEmails = await this.getUserEmails(orgUserIds);

      const filtered = reports.filter((report) =>
        userEmails.includes(report.email)
      );

      console.log(
        `🔒 [EXPORT] Filtered ${reports.length} → ${filtered.length} reports (user + org only)`
      );

      return filtered;
    } catch (error) {
      console.error('❌ [EXPORT] Error filtering reports:', error);
      // Fallback: return empty to prevent leaking data
      return [];
    }
  }

  /**
   * Get organization user IDs (including current user)
   */
  private async getOrganizationUserIds(userId: string): Promise<string[]> {
    try {
      // Get user's organizations
      const { data: orgUsers, error: orgError } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (orgError) {
        console.warn('⚠️ [EXPORT] Error fetching org membership:', orgError);
        return [userId]; // Fallback to just current user
      }

      if (!orgUsers || orgUsers.length === 0) {
        return [userId]; // User not in any org
      }

      const orgIds = orgUsers.map((ou) => ou.organization_id);

      // Get all users in these organizations
      const { data: allOrgUsers, error: allUsersError } = await this.supabase
        .from('organization_users')
        .select('user_id')
        .in('organization_id', orgIds)
        .eq('status', 'active');

      if (allUsersError) {
        console.warn('⚠️ [EXPORT] Error fetching org users:', allUsersError);
        return [userId];
      }

      const userIds = [
        ...new Set(allOrgUsers?.map((ou) => ou.user_id).filter(Boolean) || []),
      ];

      // Always include current user
      if (!userIds.includes(userId)) {
        userIds.push(userId);
      }

      console.log('👥 [EXPORT] Organization user IDs:', userIds.length);

      return userIds;
    } catch (error) {
      console.error('❌ [EXPORT] Error getting org user IDs:', error);
      return [userId]; // Fallback to current user only
    }
  }

  /**
   * Get user emails from user IDs
   */
  private async getUserEmails(userIds: string[]): Promise<string[]> {
    const { data } = await this.supabase
      .from('users')
      .select('email')
      .in('id', userIds);

    return data?.map((u) => u.email) || [];
  }
}
