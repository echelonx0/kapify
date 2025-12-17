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
  isPurchaseModalOpen = signal(false);

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
   * Get payment provider badge color
   */
  getProviderBadgeColor(provider: 'stripe' | 'paystack'): string {
    return provider === 'paystack'
      ? 'bg-teal-50 text-teal-700 border-teal-200/50'
      : 'bg-purple-50 text-purple-700 border-purple-200/50';
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
   * View invoice in Zoho (if available)
   */
  viewInvoice(invoice: Invoice) {
    if (invoice.zohoInvoiceId) {
      console.log('📄 View invoice:', invoice.zohoInvoiceNumber);
      // TODO: Implement viewing invoice in Zoho dashboard
      // Could open Zoho portal or embed iframe
    }
  }

  /**
   * Download invoice from Zoho (if available)
   */
  downloadInvoice(invoice: Invoice) {
    if (invoice.zohoInvoiceId) {
      console.log('⬇️ Download invoice:', invoice.zohoInvoiceNumber);
      // TODO: Implement downloading invoice PDF from Zoho
      // Use Zoho API to get PDF download link
    }
  }

  /**
   * Retry loading invoices
   */
  retry() {
    this.loadInvoices();
  }

  /**
   * Open purchase credits modal
   */
  goToCredits() {
    this.router.navigate(['/credits']);
  }

  /**
   * Navigate to home
   */
  goHome() {
    this.router.navigate(['/']);
  }
}
