import { Injectable } from '@angular/core';
import { KapifyReports } from '../models/kapify-reports.interface';

/**
 * Professional Report Export Service
 * Handles Excel, PDF, and CSV exports with beautiful formatting
 */
@Injectable({ providedIn: 'root' })
export class ReportProfessionalExportService {
  /**
   * Export to Excel with professional formatting and styling
   */
  async exportToExcel(
    records: KapifyReports[],
    reportTitle: string = 'Applications Report'
  ): Promise<void> {
    const XLSX = await import('xlsx');

    // Column headers
    const headers = [
      'No',
      'Business Name',
      'Industry',
      'Contact',
      'Email',
      'Phone',
      'Stage',
      'Years',
      'Employees',
      'Province',
      'Revenue',
      'Amount',
      'Funding',
      'Status',
      'Date',
    ];

    // Prepare data rows
    const data = records.map((r, idx) => [
      idx + 1,
      r.nameOfBusiness,
      r.industry,
      `${r.firstName} ${r.surname}`,
      r.email,
      r.phoneNumber,
      r.businessStage,
      r.yearsInOperation,
      r.numberOfEmployees,
      r.province,
      this.formatCurrency(r.priorYearAnnualRevenue),
      this.formatCurrency(r.amountRequested),
      r.fundingType,
      r.applicationStatus,
      this.formatDate(r.createdAt),
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([
      [reportTitle],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`Total Records: ${records.length}`],
      [],
      headers,
      ...data,
    ]);

    // Set column widths
    ws['!cols'] = [
      5, 22, 14, 18, 22, 14, 14, 8, 10, 12, 14, 14, 12, 14, 14,
    ].map((w) => ({ wch: w }));

    // Style header row (row 5, 1-indexed)
    headers.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: colIdx });
      if (ws[cellRef]) {
        ws[cellRef].fill = { fgColor: { rgb: 'FF14B8A6' } }; // Teal
        ws[cellRef].font = { bold: true, color: { rgb: 'FFFFFFFF' }, size: 11 };
        ws[cellRef].alignment = { horizontal: 'center', vertical: 'center' };
        ws[cellRef].border = {
          top: { style: 'thin', color: { rgb: 'FF0B7285' } },
          bottom: { style: 'thin', color: { rgb: 'FF0B7285' } },
        };
      }
    });

    // Style data rows with alternating colors
    for (let rowIdx = 5; rowIdx < records.length + 5; rowIdx++) {
      headers.forEach((_, colIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        if (ws[cellRef]) {
          ws[cellRef].fill =
            rowIdx % 2 === 0 ? { fgColor: { rgb: 'FFF8FAFC' } } : undefined;
          ws[cellRef].font = { size: 10, color: { rgb: 'FF0F172A' } };
          ws[cellRef].alignment = {
            horizontal: colIdx === 0 ? 'center' : 'left',
            vertical: 'center',
            wrapText: true,
          };
          ws[cellRef].border = {
            bottom: { style: 'thin', color: { rgb: 'FFE2E8F0' } },
          };
        }
      });
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    // Download
    const fileName = `${reportTitle.replace(
      /\s+/g,
      '_'
    )}_${this.getTimestamp()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Export to CSV with proper formatting
   */
  async exportToCSV(
    records: KapifyReports[],
    reportTitle: string = 'Applications Report'
  ): Promise<void> {
    const headers = [
      'No',
      'Business Name',
      'Industry',
      'Contact',
      'Email',
      'Phone',
      'Stage',
      'Years',
      'Employees',
      'Province',
      'Revenue',
      'Amount',
      'Funding Type',
      'Status',
      'Date',
    ];

    const rows = records.map((r, idx) => [
      idx + 1,
      this.escapeCSV(r.nameOfBusiness),
      this.escapeCSV(r.industry),
      this.escapeCSV(`${r.firstName} ${r.surname}`),
      this.escapeCSV(r.email),
      this.escapeCSV(r.phoneNumber),
      this.escapeCSV(r.businessStage),
      r.yearsInOperation,
      r.numberOfEmployees,
      this.escapeCSV(r.province),
      r.priorYearAnnualRevenue,
      r.amountRequested,
      this.escapeCSV(r.fundingType),
      this.escapeCSV(r.applicationStatus),
      this.formatDate(r.createdAt),
    ]);

    const csvContent = [
      reportTitle,
      `Generated: ${new Date().toLocaleDateString()}`,
      `Total Records: ${records.length}`,
      '',
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(
      blob,
      `${reportTitle.replace(/\s+/g, '_')}_${this.getTimestamp()}.csv`
    );
  }

  /**
   * Export to PDF with professional layout and tables
   */
  async exportToPDF(
    records: KapifyReports[],
    reportTitle: string = 'Applications Report'
  ): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const autoTable = await import('jspdf-autotable').then((m) => m.default);

    // Landscape orientation for better table fit
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Header section
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166); // Teal
    doc.text(reportTitle, 14, 15);

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Total Records: ${records.length}`, 14, 28);

    // Table headers
    const tableHeaders = [
      'No',
      'Business',
      'Industry',
      'Contact',
      'Email',
      'Stage',
      'Employees',
      'Province',
      'Amount',
      'Status',
    ];

    // Table data
    const tableData = records.map((r, idx) => [
      idx + 1,
      r.nameOfBusiness.substring(0, 18),
      r.industry.substring(0, 14),
      `${r.firstName} ${r.surname}`.substring(0, 16),
      r.email.substring(0, 18),
      r.businessStage.substring(0, 11),
      r.numberOfEmployees,
      r.province,
      this.formatCurrency(r.amountRequested),
      r.applicationStatus.substring(0, 12),
    ]);

    // Add professional table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 35,
      margin: { top: 35, right: 14, bottom: 14, left: 14 },
      headStyles: {
        fillColor: [20, 184, 166], // Teal
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 10,
        cellPadding: 3,
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: 9,
        cellPadding: 2.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light slate
      },
      columnStyles: {
        0: { halign: 'center' },
        6: { halign: 'center' },
        8: { halign: 'right' },
      },
      didDrawPage: (data: any) => {
        // Footer with page number
        const pageSize = doc.internal.pageSize;
        const pageCount = doc.internal.pages.length - 1;

        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageSize.getWidth() / 2,
          pageSize.getHeight() - 10,
          { align: 'center' }
        );

        // Footer timestamp
        doc.setFontSize(8);
        doc.setTextColor(165, 175, 185);
        doc.text(
          `© Kapify ${new Date().getFullYear()}`,
          14,
          pageSize.getHeight() - 10
        );
      },
    });

    // Download
    const fileName = `${reportTitle.replace(
      /\s+/g,
      '_'
    )}_${this.getTimestamp()}.pdf`;
    doc.save(fileName);
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Format currency in ZAR
   */
  private formatCurrency(amount: number): string {
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
   * Get timestamp for filename
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${mins}`;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
