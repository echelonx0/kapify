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
  fields = APPLICATION_REPORT_FIELDS;

  selectedFields = signal<string[]>([]);
  data = signal<any[]>([]);
  loading = signal(false);

  displayedColumns = computed(() =>
    this.fields.filter((f) => this.selectedFields().includes(f.key))
  );
  constructor(private reportService: ApplicationsReportService) {}

  ngOnInit() {
    const saved = localStorage.getItem('application-report-fields');
    if (saved) {
      this.selectedFields.set(JSON.parse(saved));
    } else {
      this.selectedFields.set(this.fields.map((f) => f.key));
    }
    this.loadData();
  }

  toggleField(key: string) {
    const current = this.selectedFields();
    this.selectedFields.set(
      current.includes(key)
        ? current.filter((f) => f !== key)
        : [...current, key]
    );
  }

  saveDefault() {
    localStorage.setItem(
      'application-report-fields',
      JSON.stringify(this.selectedFields())
    );
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await this.reportService.loadApplications(
        this.selectedFields()
      );
      this.data.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.filteredData());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    XLSX.writeFile(workbook, 'applications-report.xlsx');
  }

  exportPDF() {
    const doc = new jsPDF();

    const margin = 10;
    const startY = 20;
    const rowHeight = 10;
    const colSpacing = 5;

    const columns = this.displayedColumns();
    const data = this.filteredData();

    // Draw header
    let x = margin;
    columns.forEach((col) => {
      doc.text(col.label, x, startY);
      x += 50; // adjust width per column
    });

    // Draw rows
    let y = startY + rowHeight;
    data.forEach((row) => {
      x = margin;
      columns.forEach((col) => {
        const text = row[col.key] !== undefined ? String(row[col.key]) : '';
        doc.text(text, x, y);
        x += 50; // match header column width
      });
      y += rowHeight;
    });

    doc.save('applications-report.pdf');
  }

  filteredData() {
    return this.data().map((row) => {
      const obj: any = {};
      this.selectedFields().forEach((f) => (obj[f] = row[f]));
      return obj;
    });
  }
}
