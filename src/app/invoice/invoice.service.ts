// import { Injectable, inject } from '@angular/core';
// import { Observable, from, throwError } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';
// import { SharedSupabaseService } from '../shared/services/shared-supabase.service';

// export interface Invoice {
//   id: string;
//   organizationId: string;
//   stripeSessionId: string;
//   zohoInvoiceId?: string;
//   zohoInvoiceNumber?: string;
//   creditAmount: number;
//   amountZar: number;
//   status: 'sent' | 'paid' | 'failed';
//   zohoContactId?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class InvoiceService {
//   private supabase = inject(SharedSupabaseService);

//   /**
//    * Get all invoices for current user's organization
//    */
//   getInvoices(): Observable<Invoice[]> {
//     const userId = this.supabase.getCurrentUserId();
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.fetchInvoices(userId)).pipe(
//       map((invoices) =>
//         invoices.sort(
//           (a, b) =>
//             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         )
//       ),
//       catchError((error) => {
//         console.error('Failed to fetch invoices:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   /**
//    * Get single invoice by ID
//    */
//   getInvoiceById(id: string): Observable<Invoice | null> {
//     return from(this.fetchInvoiceById(id)).pipe(
//       catchError((error) => {
//         console.error('Failed to fetch invoice:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   /**
//    * Fetch invoices from database
//    */
//   private async fetchInvoices(userId: string): Promise<Invoice[]> {
//     // First get user's organization from user_profiles
//     const { data: profile, error: profileError } = await this.supabase.client
//       .from('user_profiles')
//       .select('organization_id')
//       .eq('user_id', userId)
//       .single();

//     if (profileError || !profile?.organization_id) {
//       throw new Error('Organization not found');
//     }

//     // Fetch invoices for organization
//     const { data, error } = await this.supabase.client
//       .from('invoices')
//       .select('*')
//       .eq('organization_id', profile.organization_id)
//       .order('created_at', { ascending: false });

//     if (error) {
//       throw new Error(`Failed to fetch invoices: ${error.message}`);
//     }

//     return (data || []).map(this.transformInvoice);
//   }

//   /**
//    * Fetch single invoice
//    */
//   private async fetchInvoiceById(id: string): Promise<Invoice | null> {
//     const { data, error } = await this.supabase.client
//       .from('invoices')
//       .select('*')
//       .eq('id', id)
//       .single();

//     if (error) {
//       throw new Error(`Failed to fetch invoice: ${error.message}`);
//     }

//     return data ? this.transformInvoice(data) : null;
//   }

//   /**
//    * Transform database invoice to local model
//    */
//   private transformInvoice(data: any): Invoice {
//     return {
//       id: data.id,
//       organizationId: data.organization_id,
//       stripeSessionId: data.stripe_session_id,
//       zohoInvoiceId: data.zoho_invoice_id,
//       zohoInvoiceNumber: data.zoho_invoice_number,
//       creditAmount: data.credit_amount,
//       amountZar: parseFloat(data.amount_zar),
//       status: data.status,
//       zohoContactId: data.zoho_contact_id,
//       createdAt: data.created_at,
//       updatedAt: data.updated_at,
//     };
//   }
// }
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from '../shared/services/shared-supabase.service';

export interface Invoice {
  id: string;
  organizationId: string;
  stripeSessionId: string;
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
  stripe_session_id: string;
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

  getInvoices(): Observable<Invoice[]> {
    return from(this.fetchInvoices()).pipe(
      map((invoices) => invoices.map(this.transformInvoice)),
      catchError((error) => {
        console.error('❌ Failed to fetch invoices:', error);
        return throwError(
          () => new Error(error.message || 'Failed to load invoices')
        );
      })
    );
  }

  private async fetchInvoices(): Promise<RawInvoice[]> {
    const orgId = await this.getCurrentUserOrganizationId();

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

  private async getCurrentUserOrganizationId(): Promise<string | null> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await this.supabase.client
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data.organization_id;
  }

  private transformInvoice(dbInvoice: RawInvoice): Invoice {
    return {
      id: dbInvoice.id,
      organizationId: dbInvoice.organization_id,
      stripeSessionId: dbInvoice.stripe_session_id,
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
