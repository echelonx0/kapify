import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { APPLICATION_REPORT_FIELDS } from './report-fields';
import { ApplicationsReportService } from './application-reports.service';

@Component({
  standalone: true,
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  // Field configuration
  fields = APPLICATION_REPORT_FIELDS;

  // State signals
  selectedFields = signal<string[]>([]);
  data = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  exporting = signal<'excel' | 'pdf' | null>(null);

  // Computed values
  displayedColumns = computed(() =>
    this.fields.filter((f) => this.selectedFields().includes(f.key))
  );

  rowCount = computed(() => this.data().length);

  hasSelectedFields = computed(() => this.selectedFields().length > 0);

  constructor(private reportService: ApplicationsReportService) {}

  ngOnInit() {
    this.loadSavedFieldSelection();
    this.loadData();
  }

  /**
   * Load saved field selection from localStorage
   */
  private loadSavedFieldSelection() {
    const saved = localStorage.getItem('application-report-fields');
    if (saved) {
      try {
        this.selectedFields.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved fields:', e);
        this.selectAllFields();
      }
    } else {
      this.selectAllFields();
    }
  }

  /**
   * Select all fields by default
   */
  private selectAllFields() {
    this.selectedFields.set(this.fields.map((f) => f.key));
  }

  /**
   * Toggle individual field selection
   */
  toggleField(key: string) {
    const current = this.selectedFields();
    this.selectedFields.set(
      current.includes(key)
        ? current.filter((f) => f !== key)
        : [...current, key]
    );
  }

  /**
   * Select all fields
   */
  selectAll() {
    this.selectAllFields();
  }

  /**
   * Deselect all fields
   */
  deselectAll() {
    this.selectedFields.set([]);
  }

  /**
   * Save current field selection as default
   */
  saveDefault() {
    try {
      localStorage.setItem(
        'application-report-fields',
        JSON.stringify(this.selectedFields())
      );
      console.log('✅ Default field selection saved');
    } catch (e) {
      console.error('Failed to save field selection:', e);
      this.error.set('Failed to save default view');
    }
  }

  /**
   * Load application data from service
   */
  async loadData() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const data = await this.reportService.loadApplications(
        this.selectedFields()
      );
      this.data.set(data);
      console.log(`✅ Loaded ${data.length} applications`);
    } catch (e) {
      console.error('Failed to load applications:', e);
      this.error.set('Failed to load application data. Please try again.');
      this.data.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Refresh data
   */
  refresh() {
    this.loadData();
  }

  /**
   * Export data to Excel
   */
  exportExcel() {
    if (!this.hasSelectedFields() || this.data().length === 0) {
      return;
    }

    this.exporting.set('excel');

    try {
      const exportData = this.getFilteredData();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

      const fileName = `applications-report-${this.getTimestamp()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log('✅ Excel export successful:', fileName);
    } catch (e) {
      console.error('Excel export failed:', e);
      this.error.set('Failed to export Excel file');
    } finally {
      this.exporting.set(null);
    }
  }

  /**
   * Export data to PDF
   */
  exportPDF() {
    if (!this.hasSelectedFields() || this.data().length === 0) {
      return;
    }

    this.exporting.set('pdf');

    try {
      const doc = new jsPDF({
        orientation:
          this.displayedColumns().length > 5 ? 'landscape' : 'portrait',
      });

      const margin = 10;
      const startY = 20;
      const rowHeight = 8;
      const colWidth =
        (doc.internal.pageSize.getWidth() - 2 * margin) /
        this.displayedColumns().length;

      const columns = this.displayedColumns();
      const data = this.getFilteredData();

      // Title
      doc.setFontSize(16);
      doc.text('Applications Report', margin, 10);

      // Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      let x = margin;
      columns.forEach((col) => {
        doc.text(col.label, x, startY);
        x += colWidth;
      });

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let y = startY + rowHeight;

      data.forEach((row, index) => {
        // Add new page if needed
        if (y > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          y = 20;
        }

        x = margin;
        columns.forEach((col) => {
          const text = row[col.key] !== undefined ? String(row[col.key]) : '—';
          // Truncate long text
          const truncated =
            text.length > 30 ? text.substring(0, 27) + '...' : text;
          doc.text(truncated, x, y);
          x += colWidth;
        });
        y += rowHeight;
      });

      const fileName = `applications-report-${this.getTimestamp()}.pdf`;
      doc.save(fileName);

      console.log('✅ PDF export successful:', fileName);
    } catch (e) {
      console.error('PDF export failed:', e);
      this.error.set('Failed to export PDF file');
    } finally {
      this.exporting.set(null);
    }
  }

  /**
   * Get filtered data based on selected fields
   */
  private getFilteredData(): any[] {
    const selected = this.selectedFields();
    return this.data().map((row) => {
      const obj: any = {};
      selected.forEach((fieldKey) => {
        const field = this.fields.find((f) => f.key === fieldKey);
        if (field) {
          obj[field.label] = row[fieldKey];
        }
      });
      return obj;
    });
  }

  /**
   * Get timestamp for filenames
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByKey(index: number, field: any): string {
    return field.key;
  }

  /**
   * Track by function for data rows
   */
  trackByIndex(index: number): number {
    return index;
  }
}
