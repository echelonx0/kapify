import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface Invoice {
  id: string;
  organizationId: string;
  paymentProvider: 'stripe' | 'paystack';
  stripeSessionId?: string | null;
  paystackReference?: string | null;
  zohoInvoiceId: string | null;
  zohoInvoiceNumber: string | null;
  creditAmount: number;
  amountZar: number;
  status: 'sent' | 'paid' | 'failed';
  zohoContactId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawInvoice {
  id: string;
  organization_id: string;
  stripe_session_id: string | null;
  paystack_reference: string | null;
  zoho_invoice_id: string | null;
  zoho_invoice_number: string | null;
  credit_amount: number;
  amount_zar: string;
  status: string;
  zoho_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  /**
   * Get all invoices for the current organization
   */
  getInvoices(): Observable<Invoice[]> {
    return from(this.fetchInvoices()).pipe(
      map((invoices) => invoices.map((inv) => this.transformInvoice(inv))),
      catchError((error) => {
        console.error('❌ Failed to fetch invoices:', error);
        return throwError(
          () => new Error(error.message || 'Failed to load invoices')
        );
      })
    );
  }

  /**
   * Get a single invoice by ID
   */
  getInvoiceById(invoiceId: string): Observable<Invoice | null> {
    return from(this.fetchInvoiceById(invoiceId)).pipe(
      map((invoice) => (invoice ? this.transformInvoice(invoice) : null)),
      catchError((error) => {
        console.error('❌ Failed to fetch invoice:', error);
        return throwError(
          () => new Error(error.message || 'Failed to load invoice')
        );
      })
    );
  }

  /**
   * Get invoices by Paystack reference
   */
  getInvoiceByPaystackReference(reference: string): Observable<Invoice | null> {
    return from(this.fetchInvoiceByPaystackReference(reference)).pipe(
      map((invoice) => (invoice ? this.transformInvoice(invoice) : null)),
      catchError((error) => {
        console.error('❌ Failed to fetch invoice by reference:', error);
        return throwError(
          () =>
            new Error(error.message || 'Failed to load invoice by reference')
        );
      })
    );
  }

  /**
   * Fetch invoices from database
   */
  private async fetchInvoices(): Promise<RawInvoice[]> {
    const orgId = this.getCurrentUserOrganizationId();

    if (!orgId) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as RawInvoice[]) || [];
  }

  /**
   * Fetch single invoice by ID
   */
  private async fetchInvoiceById(
    invoiceId: string
  ): Promise<RawInvoice | null> {
    const orgId = this.getCurrentUserOrganizationId();

    if (!orgId) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as RawInvoice) || null;
  }

  /**
   * Fetch invoice by Paystack reference
   */
  private async fetchInvoiceByPaystackReference(
    reference: string
  ): Promise<RawInvoice | null> {
    const orgId = this.getCurrentUserOrganizationId();

    if (!orgId) {
      throw new Error('Organization not found');
    }

    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .eq('paystack_reference', reference)
      .eq('organization_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data as RawInvoice) || null;
  }

  /**
   * Get current user's organization ID
   */
  private getCurrentUserOrganizationId(): string | null {
    try {
      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        console.error('Organization ID not found');
        return null;
      }
      return orgId;
    } catch (error) {
      console.error('Error getting organization ID:', error);
      return null;
    }
  }

  /**
   * Transform database invoice to app interface
   */
  private transformInvoice(dbInvoice: RawInvoice): Invoice {
    // Determine payment provider based on which reference is present
    const paymentProvider = dbInvoice.paystack_reference
      ? 'paystack'
      : 'stripe';

    return {
      id: dbInvoice.id,
      organizationId: dbInvoice.organization_id,
      paymentProvider,
      stripeSessionId:
        paymentProvider === 'stripe' ? dbInvoice.stripe_session_id : undefined,
      paystackReference:
        paymentProvider === 'paystack'
          ? dbInvoice.paystack_reference
          : undefined,
      zohoInvoiceId: dbInvoice.zoho_invoice_id,
      zohoInvoiceNumber: dbInvoice.zoho_invoice_number,
      creditAmount: dbInvoice.credit_amount,
      amountZar: parseFloat(dbInvoice.amount_zar),
      status: dbInvoice.status as 'sent' | 'paid' | 'failed',
      zohoContactId: dbInvoice.zoho_contact_id,
      createdAt: dbInvoice.created_at,
      updatedAt: dbInvoice.updated_at,
    };
  }
}
