import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Invoice, InvoiceService } from './invoice.service';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice.component.html',
  //   styleUrls: ['./invoice.component.css'],
})
export class InvoiceComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadInvoices();
  }

  private loadInvoices() {
    this.loading.set(true);
    this.error.set(null);

    this.invoiceService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load invoices:', err);
        this.error.set('Failed to load invoices. Please try again.');
        this.loading.set(false);
      },
    });
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
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatCredits(credits: number): string {
    return new Intl.NumberFormat('en-ZA').format(credits);
  }

  viewInvoice(invoice: Invoice) {
    if (invoice.zohoInvoiceId) {
      // Open Zoho invoice in new tab (if public URL available)
      // For now, just log - we'll implement this after Zoho integration
      console.log('View invoice:', invoice.zohoInvoiceId);
    }
  }

  downloadInvoice(invoice: Invoice) {
    if (invoice.zohoInvoiceId) {
      // Download from Zoho (implement after integration)
      console.log('Download invoice:', invoice.zohoInvoiceId);
    }
  }

  retry() {
    this.loadInvoices();
  }

  goToCredits() {
    this.router.navigate(['/finance/credits']);
  }
}
