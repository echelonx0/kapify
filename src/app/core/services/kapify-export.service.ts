import { Injectable } from '@angular/core';
import {
  ExportOptions,
  ExportColumn,
} from '../models/export-options.interface';

@Injectable({ providedIn: 'root' })
export class GenericExportService {
  async export<T>(data: T[], options: ExportOptions<T>): Promise<Blob> {
    switch (options.format) {
      case 'excel':
        return this.exportExcel(data, options);
      case 'csv':
        return this.exportCSV(data, options);
      case 'pdf':
        return this.exportPDF(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  // ======================
  // EXCEL
  // ======================
  private async exportExcel<T>(
    data: T[],
    options: ExportOptions<T>
  ): Promise<Blob> {
    const XLSX = await import('xlsx');

    const rows = this.buildRows(data, options.columns);
    const headers = options.columns.map((c) => c.header);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = options.columns.map((c) => ({ wch: c.width || 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    this.download(blob, `${options.fileName}.xlsx`);
    return blob;
  }

  // ======================
  // CSV
  // ======================
  private async exportCSV<T>(
    data: T[],
    options: ExportOptions<T>
  ): Promise<Blob> {
    const headers = options.columns.map((c) => c.header).join(',');

    const rows = this.buildRows(data, options.columns).map((row) =>
      row.map(this.escapeCSV).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    this.download(blob, `${options.fileName}.csv`);
    return blob;
  }

  // ======================
  // PDF (Simple Table)
  // ======================
  private async exportPDF<T>(
    data: T[],
    options: ExportOptions<T>
  ): Promise<Blob> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: options.pdf?.orientation || 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    if (options.pdf?.title) {
      doc.setFontSize(14);
      doc.text(options.pdf.title, 10, 10);
    }

    const headers = options.columns.map((c) => c.header);
    const rows = this.buildRows(data, options.columns);

    let y = 20;
    const colWidth = 280 / headers.length;

    headers.forEach((h, i) => {
      doc.text(h, 10 + i * colWidth, y);
    });

    y += 6;

    rows.forEach((row) => {
      row.forEach((cell, i) => {
        doc.text(String(cell), 10 + i * colWidth, y);
      });
      y += 6;
    });

    const blob = doc.output('blob');
    this.download(blob, `${options.fileName}.pdf`);
    return blob;
  }

  // ======================
  // HELPERS
  // ======================
  private buildRows<T>(data: T[], columns: ExportColumn<T>[]): any[][] {
    return data.map((row, index) =>
      columns.map((col) => {
        const raw = col.value
          ? col.value(row, index)
          : (row[col.key as keyof T] as any);

        return col.format ? col.format(raw) : raw;
      })
    );
  }

  private escapeCSV(value: any): string {
    if (value == null) return '';
    const str = String(value);
    return str.includes(',') || str.includes('"')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
