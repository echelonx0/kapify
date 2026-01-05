import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from 'src/app/auth/services/production.auth.service';

export interface InvoicePdfResponse {
  success: boolean;
  downloadUrl: string;
  invoiceNumber?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ZohoInvoiceService {
  private authService = inject(AuthService);
  private supabaseUrl = environment.supabaseUrl;
  private supabaseKey = environment.supabaseAnonKey;

  /**
   * Get PDF download URL for an invoice
   * Calls backend edge function to fetch from Zoho API
   */
  getInvoicePdfUrl(invoiceId: string): Observable<string> {
    const authToken = this.authService.getAccessToken();
    if (!authToken) {
      return throwError(() => new Error('Not authenticated'));
    }

    const request = from(this.fetchPdfUrl(invoiceId, authToken));

    return request.pipe(
      tap((response) => {
        console.log('✅ PDF URL obtained for invoice:', invoiceId);
      }),
      map((response: InvoicePdfResponse) => {
        if (!response.success || !response.downloadUrl) {
          throw new Error(response.error || 'Failed to get PDF URL');
        }
        return response.downloadUrl;
      }),
      catchError((error) => {
        console.error('❌ Failed to get invoice PDF:', error);
        const message =
          error?.message || 'Failed to download invoice. Please try again.';
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Fetch PDF URL from backend
   */
  private async fetchPdfUrl(
    invoiceId: string,
    authToken: string
  ): Promise<InvoicePdfResponse> {
    const response = await fetch(
      `${this.supabaseUrl}/functions/v1/get-invoice-pdf`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          apikey: this.supabaseKey,
        },
        body: JSON.stringify({ invoiceId }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error || `HTTP ${response.status}: Failed to fetch PDF`
      );
    }

    return await response.json();
  }

  /**
   * Open invoice in Zoho portal
   * Direct link - no API call needed
   */
  openInvoiceInZoho(invoiceId: string): void {
    const zohoPortalUrl = `https://books.zoho.com/app/invoices/${invoiceId}`;
    window.open(zohoPortalUrl, '_blank');
  }

  /**
   * Download invoice PDF
   * Gets URL and triggers browser download
   */
  downloadInvoicePdf(invoiceId: string, invoiceNumber: string): void {
    this.getInvoicePdfUrl(invoiceId).subscribe({
      next: (downloadUrl) => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Invoice-${invoiceNumber}.pdf`;
        link.click();
        console.log('⬇️ Invoice download started');
      },
      error: (error) => {
        console.error('❌ Download failed:', error);
        // Fallback: open in Zoho portal
        console.log('Opening in Zoho portal as fallback...');
        this.openInvoiceInZoho(invoiceId);
      },
    });
  }
}
