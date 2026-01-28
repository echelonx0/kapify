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

  /**
   * Enhanced invoice generation method for InvoiceComponent
   * Uses invoice_details JSONB snapshot for accurate historical data
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    const invoiceNumber = invoice.zohoInvoiceNumber || invoice.id.slice(0, 8);
    const details = invoice.invoiceDetails;

    const date = new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format address from invoice details (safely handle undefined)
    const addressLines = [
      details?.address_line1,
      details?.address_line2,
      details?.city && details?.province
        ? `${details.city}, ${details.province}`
        : '',
      details?.postal_code,
      details?.country,
    ]
      .filter((line) => line && line.trim())
      .join('<br />');

    // ✅ FIXED: Safe VAT check with proper optional chaining
    const isVatRegistered =
      details && details.vat_number && details.vat_number !== '0000000000';

    // Footer tax status section - always present
    const taxStatusFooter = isVatRegistered
      ? `
        <div class="footer-section">
          <div class="footer-label">Tax Status</div>
          <div class="footer-value">VAT Registered</div>
        </div>
        <div class="footer-section">
          <div class="footer-label">VAT Number</div>
          <div class="footer-value">${details?.vat_number || 'N/A'}</div>
        </div>
      `
      : `
        <div class="footer-section">
          <div class="footer-label">Tax Status</div>
          <div class="footer-value">Not VAT Registered</div>
        </div>
      `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: white;
    }

    .invoice-container {
      max-width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }

    /* Header */
    .invoice-header {
      margin-bottom: 40px;
      border-bottom: 2px solid #14b8a6;
      padding-bottom: 20px;
    }

    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #14b8a6;
      margin-bottom: 5px;
    }

    .company-tagline {
      font-size: 12px;
      color: #64748b;
      letter-spacing: 1px;
    }

    /* Invoice Meta */
    .invoice-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }

    .meta-section {
      font-size: 12px;
    }

    .meta-label {
      font-weight: bold;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .meta-value.reference {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 5px 8px;
      border-radius: 4px;
    }

    /* Invoice To */
    .invoice-to {
      margin-bottom: 40px;
    }

    .invoice-to-label {
      font-weight: bold;
      text-transform: uppercase;
      color: #64748b;
      font-size: 11px;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .invoice-to-content {
      font-size: 13px;
      line-height: 1.8;
    }

    .business-name {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .legal-name {
      font-size: 12px;
      color: #64748b;
      font-style: italic;
      margin-bottom: 8px;
    }

    .address {
      font-size: 12px;
      line-height: 1.6;
      color: #475569;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }

    .items-table thead {
      background: #f8fafc;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }

    .items-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .items-table tr:last-child td {
      border-bottom: 2px solid #cbd5e1;
    }

    .item-description {
      color: #1e293b;
      font-weight: 500;
    }

    .item-qty {
      text-align: center;
      color: #64748b;
    }

    .item-price {
      text-align: right;
      color: #1e293b;
      font-weight: 500;
    }

    .item-total {
      text-align: right;
      color: #1e293b;
      font-weight: 600;
    }

    /* Totals */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-content {
      width: 300px;
    }

    .total-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 20px;
      padding: 10px 0;
      font-size: 13px;
    }

    .total-row.total {
      border-top: 2px solid #14b8a6;
      padding: 15px 0;
      font-weight: bold;
      font-size: 16px;
      color: #14b8a6;
    }

    .total-label {
      color: #475569;
      text-align: right;
    }

    .total-value {
      text-align: right;
      font-weight: 500;
    }

    /* Footer */
    .invoice-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }

    .footer-info {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }

    .footer-section {
      font-size: 10px;
    }

    .footer-label {
      font-weight: 600;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }

    .footer-value {
      font-size: 11px;
      color: #1e293b;
    }

    .footer-note {
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      font-style: italic;
    }

    /* Print styles */
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-container {
        max-width: 100%;
        height: auto;
        margin: 0;
        padding: 20px;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-name">KAPIFY</div>
      <div class="company-tagline">Platform Credits Invoice</div>
    </div>

    <!-- Meta Information -->
    <div class="invoice-meta">
      <div class="meta-section">
        <div class="meta-label">Invoice Number</div>
        <div class="meta-value">${invoiceNumber}</div>
        <div class="meta-label">Invoice Date</div>
        <div class="meta-value">${date}</div>
      </div>
      <div class="meta-section">
        <div class="meta-label">Reference</div>
        <div class="meta-value reference">${invoice.paystackReference || invoice.stripeSessionId || 'N/A'}</div>
        <div class="meta-label">Status</div>
        <div class="meta-value">${this.getInvoiceStatusDisplay(invoice.status)}</div>
      </div>
    </div>

    <!-- Invoice To -->
    <div class="invoice-to">
      <div class="invoice-to-label">Invoice For</div>
      <div class="invoice-to-content">
        <div class="business-name">${details?.business_name || 'Business Name'}</div>
        ${details?.legal_name && details.legal_name !== details?.business_name ? `<div class="legal-name">${details.legal_name}</div>` : ''}
        <div class="address">${addressLines}</div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Description</th>
          <th style="width: 15%;">Qty</th>
          <th style="width: 17.5%;">Unit Price</th>
          <th style="width: 17.5%;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="item-description">${invoice.creditAmount.toLocaleString('en-ZA')} Platform Credits</td>
          <td class="item-qty">1</td>
          <td class="item-price">R${invoice.amountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
          <td class="item-total">R${invoice.amountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-content">
        <div class="total-row">
          <span class="total-label">Subtotal:</span>
          <span class="total-value">R${invoice.amountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="total-row total">
          <span class="total-label">Total Amount Due:</span>
          <span class="total-value">R${invoice.amountZar.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-info">
        <div class="footer-section">
          <div class="footer-label">Payment Method</div>
          <div class="footer-value">${invoice.paymentProvider === 'paystack' ? 'Paystack' : invoice.paymentProvider === 'stripe' ? 'Stripe' : 'Unknown'}</div>
        </div>
        ${taxStatusFooter}
      </div>
      <div class="footer-note">
        This is an automatically generated invoice. Credits purchased on the Kapify platform are non-refundable and non-transferable. For support, contact support@kapify.africa
      </div>
    </div>
  </div>
</body>
</html>
  `;
  }

  /**
   * Helper method to get invoice status display
   */
  private getInvoiceStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      paid: 'Paid',
      sent: 'Sent',
      failed: 'Failed',
    };
    return statusMap[status] || status;
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
