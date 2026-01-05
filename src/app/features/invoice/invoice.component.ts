import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService, Invoice } from './invoice.service';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
})
export class InvoiceComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  downloadingId = signal<string | null>(null);

  ngOnInit() {
    this.loadInvoices();
  }

  /**
   * Load invoices from service
   */
  private loadInvoices() {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        console.log('✅ Loaded invoices:', invoices.length);
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Failed to load invoices:', err);
        this.error.set('Failed to load invoices. Please try again.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Download invoice as PDF
   * Generates PDF from invoice data using browser print
   */
  downloadInvoice(invoice: Invoice): void {
    if (this.downloadingId()) {
      return;
    }

    this.downloadingId.set(invoice.id);

    try {
      this.generateAndDownloadPDF(invoice);
      console.log('⬇️ Invoice download started');
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error);
    } finally {
      setTimeout(() => {
        this.downloadingId.set(null);
      }, 1500);
    }
  }

  /**
   * Generate PDF and trigger download via print dialog
   */
  private generateAndDownloadPDF(invoice: Invoice): void {
    const htmlContent = this.generateInvoiceHTML(invoice);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    const originalTitle = document.title;
    document.title = `Invoice-${
      invoice.zohoInvoiceNumber || invoice.id.slice(0, 8)
    }`;

    const originalBody = document.body.innerHTML;
    document.body.innerHTML = htmlContent;

    window.print();

    document.body.innerHTML = originalBody;
    document.title = originalTitle;
    tempDiv.remove();
  }

  /**
   * Generate invoice HTML for PDF
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    const invoiceNumber = invoice.zohoInvoiceNumber || invoice.id.slice(0, 8);
    const today = new Date(invoice.createdAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice ${invoiceNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              background: white;
              padding: 40px;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 60px;
              border-bottom: 2px solid #14b8a6;
              padding-bottom: 30px;
            }
            .company-info h1 {
              font-size: 28px;
              font-weight: bold;
              color: #14b8a6;
              margin-bottom: 5px;
            }
            .company-info p {
              font-size: 14px;
              color: #64748b;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 15px;
            }
            .detail-row {
              display: flex;
              justify-content: flex-end;
              gap: 40px;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .detail-label {
              color: #64748b;
              min-width: 100px;
              text-align: right;
            }
            .detail-value {
              color: #1e293b;
              font-weight: 500;
              min-width: 150px;
              text-align: right;
            }
            .section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 40px;
            }
            .info-block h3 {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            .info-block p {
              font-size: 15px;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .line-items {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            .line-items thead {
              background-color: #f1f5f9;
              border-bottom: 2px solid #e2e8f0;
            }
            .line-items th {
              padding: 12px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .line-items td {
              padding: 15px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
              color: #1e293b;
            }
            .line-items tr:last-child td {
              border-bottom: none;
            }
            .qty {
              text-align: center;
            }
            .price {
              text-align: right;
            }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
            }
            .totals-content {
              min-width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 14px;
            }
            .total-row.final {
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              margin-top: 12px;
              font-size: 18px;
              font-weight: bold;
              color: #14b8a6;
            }
            .total-label {
              color: #64748b;
            }
            .total-value {
              color: #1e293b;
              font-weight: 500;
              text-align: right;
            }
            .notes {
              background-color: #f8fafc;
              border-left: 4px solid #14b8a6;
              padding: 15px;
              margin-top: 40px;
              border-radius: 4px;
            }
            .notes-title {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 8px;
              letter-spacing: 0.5px;
            }
            .notes-content {
              font-size: 14px;
              color: #475569;
            }
            .notes-content p {
              margin-bottom: 8px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
              text-align: center;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              margin-left: 10px;
            }
            .badge-paid {
              background-color: #dcfce7;
              color: #166534;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                <h1>KAPIFY</h1>
                <p>Platform Credit Invoice</p>
              </div>
              <div class="invoice-details">
                <h2>INVOICE</h2>
                <div class="detail-row">
                  <span class="detail-label">Invoice #</span>
                  <span class="detail-value">${invoiceNumber}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">${today}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value">
                    <span class="badge badge-paid">${this.getStatusText(
                      invoice.status
                    ).toUpperCase()}</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="section">
              <table class="line-items">
                <thead>
                  <tr>
                    <th style="width: 50%;">Description</th>
                    <th class="qty" style="width: 15%;">Qty</th>
                    <th class="price" style="width: 20%;">Unit Price</th>
                    <th class="price" style="width: 15%;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${invoice.creditAmount.toLocaleString()} Kapify Platform Credits</td>
                    <td class="qty">1</td>
                    <td class="price">${this.formatAmount(
                      invoice.amountZar
                    )}</td>
                    <td class="price"><strong>${this.formatAmount(
                      invoice.amountZar
                    )}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totals -->
            <div class="totals">
              <div class="totals-content">
                <div class="total-row">
                  <span class="total-label">Subtotal</span>
                  <span class="total-value">${this.formatAmount(
                    invoice.amountZar
                  )}</span>
                </div>
                <div class="total-row final">
                  <span class="total-label">Total Amount</span>
                  <span class="total-value">${this.formatAmount(
                    invoice.amountZar
                  )}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="notes">
              <div class="notes-title">Payment Details</div>
              <div class="notes-content">
                <p><strong>Payment Method:</strong> ${this.getProviderBadgeText(
                  invoice.paymentProvider
                )}</p>
                <p><strong>Reference:</strong> ${this.getPaymentReference(
                  invoice
                )}</p>
                <p style="margin-top: 10px; font-style: italic;">Thank you for your purchase on Kapify. Credits are active immediately and can be used for platform services.</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>This is an automatically generated invoice. Please keep it for your records.</p>
              <p style="margin-top: 10px;">Kapify © ${new Date().getFullYear()} | www.kapify.co.za</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get status display text
   */
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

  /**
   * Get payment provider badge text
   */
  getProviderBadgeText(provider: 'stripe' | 'paystack'): string {
    return provider === 'paystack' ? 'Paystack' : 'Stripe';
  }

  /**
   * Get payment reference (Paystack or Stripe)
   */
  getPaymentReference(invoice: Invoice): string {
    if (invoice.paymentProvider === 'paystack' && invoice.paystackReference) {
      return invoice.paystackReference;
    }
    if (invoice.stripeSessionId) {
      return invoice.stripeSessionId.substring(0, 20) + '...';
    }
    return 'N/A';
  }

  /**
   * Get status badge color based on invoice status
   */
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

  /**
   * Get payment provider badge color
   */
  getProviderBadgeColor(provider: 'stripe' | 'paystack'): string {
    return provider === 'paystack'
      ? 'bg-teal-50 text-teal-700 border-teal-200/50'
      : 'bg-purple-50 text-purple-700 border-purple-200/50';
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format amount as ZAR currency
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Format credits with thousand separator
   */
  formatCredits(credits: number): string {
    return new Intl.NumberFormat('en-ZA').format(credits);
  }

  /**
   * Check if download is in progress
   */
  isDownloading(invoiceId: string): boolean {
    return this.downloadingId() === invoiceId;
  }

  /**
   * Retry loading invoices
   */
  retry() {
    this.loadInvoices();
  }

  /**
   * Navigate to credits page
   */
  goToCredits() {
    this.router.navigate(['/credits']);
  }

  /**
   * Navigate to home
   */
  goHome() {
    this.router.navigate(['/dashboard/home']);
  }
}
