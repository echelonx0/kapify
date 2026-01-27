import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoiceService, Invoice } from './invoice.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice.component.html',
})
export class InvoiceComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  downloadingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInvoices();
  }

  private loadInvoices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load invoices.');
        this.loading.set(false);
      },
    });
  }

  downloadInvoice(invoice: Invoice): void {
    if (this.downloadingId()) {
      return;
    }

    this.downloadingId.set(invoice.id);

    try {
      this.openPrintWindow(invoice);
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
    } finally {
      setTimeout(() => this.downloadingId.set(null), 1500);
    }
  }

  private openPrintWindow(invoice: Invoice): void {
    const html = this.generateInvoiceHTML(invoice);
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      throw new Error('Popup blocked');
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  private generateInvoiceHTML(invoice: Invoice): string {
    const invoiceNumber = invoice.zohoInvoiceNumber || invoice.id.slice(0, 8);

    const date = new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      padding: 40px;
      color: #1e293b;
    }
    h1 { color: #14b8a6; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 30px;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    th { background: #f1f5f9; }
    .totals {
      margin-top: 30px;
      text-align: right;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>KAPIFY</h1>
  <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
  <p><strong>Date:</strong> ${date}</p>
  <p><strong>Status:</strong> ${this.getStatusText(invoice.status)}</p>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.creditAmount.toLocaleString()} Platform Credits</td>
        <td>1</td>
        <td>${this.formatAmount(invoice.amountZar)}</td>
        <td>${this.formatAmount(invoice.amountZar)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    Total: ${this.formatAmount(invoice.amountZar)}
  </div>

  <p style="margin-top:40px;font-size:12px;color:#64748b">
    Automatically generated invoice.
  </p>
</body>
</html>
    `;
  }

  retry(): void {
    this.loadInvoices();
  }

  goBack(): void {
    window.history.back();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'sent':
        return 'Sent';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  }

  formatCredits(credits: number): string {
    return new Intl.NumberFormat('en-ZA').format(credits);
  }

  isDownloading(id: string): boolean {
    return this.downloadingId() === id;
  }

  getProviderBadgeText(provider: 'stripe' | 'paystack'): string {
    return provider === 'paystack' ? 'Paystack' : 'Stripe';
  }

  getProviderBadgeColor(provider: 'stripe' | 'paystack'): string {
    return provider === 'paystack'
      ? 'bg-teal-50 text-teal-700 border-teal-200/50'
      : 'bg-purple-50 text-purple-700 border-purple-200/50';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200/50';
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200/50';
    }
  }
}
