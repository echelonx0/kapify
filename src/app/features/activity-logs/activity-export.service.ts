import { Injectable, inject } from '@angular/core';
import {
  Activity,
  ActivityRepositoryService,
  ActivityFilters,
} from './activity-repository.service';

@Injectable({ providedIn: 'root' })
export class ActivityExportService {
  private activityRepository = inject(ActivityRepositoryService);

  /**
   * Export activities to Excel format
   */
  async exportToExcel(filters?: ActivityFilters): Promise<void> {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');

      // Fetch all activities matching filters
      const activities = await new Promise<Activity[]>((resolve, reject) => {
        this.activityRepository.getAllActivities(filters).subscribe({
          next: resolve,
          error: reject,
        });
      });

      if (activities.length === 0) {
        alert('No activities to export');
        return;
      }

      // Transform activities to export format
      const exportData = activities.map((activity) => ({
        Date: this.formatDate(activity.created_at),
        Time: this.formatTime(activity.created_at),
        Type: this.capitalizeText(activity.type),
        Action: this.capitalizeText(activity.action),
        Message: activity.message,
        Status: this.capitalizeText(activity.status),
        Amount: activity.amount ? this.formatCurrency(activity.amount) : '—',
        'Entity Type': activity.entity_type || '—',
        'Entity ID': activity.entity_id || '—',
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 12 }, // Type
        { wch: 15 }, // Action
        { wch: 30 }, // Message
        { wch: 12 }, // Status
        { wch: 12 }, // Amount
        { wch: 15 }, // Entity Type
        { wch: 20 }, // Entity ID
      ];

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');

      // Generate filename
      const filename = `activity-logs-${
        new Date().toISOString().split('T')[0]
      }.xlsx`;

      // Download
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Excel export failed:', error);
      throw new Error('Failed to export to Excel');
    }
  }

  /**
   * Export activities to PDF format
   */
  async exportToPdf(filters?: ActivityFilters): Promise<void> {
    try {
      // Dynamically import jsPDF and autoTable
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      // Fetch all activities
      const activities = await new Promise<Activity[]>((resolve, reject) => {
        this.activityRepository.getAllActivities(filters).subscribe({
          next: resolve,
          error: reject,
        });
      });

      if (activities.length === 0) {
        alert('No activities to export');
        return;
      }

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Header
      pdf.setFontSize(18);
      pdf.setTextColor(15, 124, 125); // teal-700
      pdf.text('Activity Log', margin, margin);

      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-600
      const now = new Date();
      pdf.text(`Generated: ${now.toLocaleString()}`, margin, margin + 8);
      pdf.text(`Total Activities: ${activities.length}`, margin, margin + 14);

      // Table headers
      const tableHeaders = [
        'Date',
        'Type',
        'Action',
        'Message',
        'Status',
        'Amount',
      ];

      // Table rows
      const tableRows = activities.map((activity) => [
        this.formatDate(activity.created_at),
        this.capitalizeText(activity.type),
        this.capitalizeText(activity.action),
        activity.message.substring(0, 40) +
          (activity.message.length > 40 ? '...' : ''),
        this.capitalizeText(activity.status),
        activity.amount ? this.formatCurrency(activity.amount) : '—',
      ]);

      // Generate table
      autoTable(pdf, {
        head: [tableHeaders],
        body: tableRows,
        startY: margin + 20,
        margin: margin,
        headStyles: {
          fillColor: [15, 124, 125], // teal-700
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: {
          textColor: [51, 65, 85], // slate-700
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },

        columnStyles: {
          0: { halign: 'left', cellWidth: 20 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'left', cellWidth: 25 },
          3: { halign: 'left' },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'right', cellWidth: 22 },
        },
      });

      // Footer
      const pageCount = (pdf as any).internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - margin - 20,
          pageHeight - margin + 5
        );
      }

      // Download
      const filename = `activity-logs-${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error('Failed to export to PDF');
    }
  }

  /**
   * Format date to readable string
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time to readable string
   */
  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format amount as currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Capitalize text
   */
  private capitalizeText(text: string): string {
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
