import { Injectable } from '@angular/core';

import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SharedSupabaseService } from './shared-supabase.service';

export interface OrgWallet {
  id: string;
  organization_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface OrgTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class OrgCreditService {
  constructor(private supabase: SharedSupabaseService) {}

  /** Ensure wallet exists for org */
  async getOrCreateOrgWallet(orgId: string): Promise<OrgWallet> {
    const { data, error } = await this.supabase.client
      .from('credits_wallets')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (data) return data;
    if (error && error.code !== 'PGRST116') throw error;

    const { data: newWallet, error: insertError } = await this.supabase.client
      .from('credits_wallets')
      .insert({ organization_id: orgId })
      .select()
      .single();

    if (insertError) throw insertError;
    return newWallet;
  }

  /** Get current balance */
  async getBalance(orgId: string): Promise<number> {
    const wallet = await this.getOrCreateOrgWallet(orgId);
    return wallet.balance;
  }

  /** Spend credits for org */
  spendCredits(
    orgId: string,
    amount: number,
    description: string,
    userId?: string
  ) {
    return from(
      this.supabase.client.rpc('spend_org_credits', {
        p_org_id: orgId,
        p_amount: amount,
        p_description: description,
        p_user_id: userId,
      })
    );
  }

  /** Add credits (e.g., after payment success) */
  addCredits(
    orgId: string,
    amount: number,
    description: string,
    userId?: string
  ) {
    return from(
      this.supabase.client.rpc('add_org_credits', {
        p_org_id: orgId,
        p_amount: amount,
        p_description: description,
        p_user_id: userId,
      })
    );
  }

  /** Get transactions */
  getTransactions(orgId: string): Observable<OrgTransaction[]> {
    return from(
      this.supabase.client
        .from('credits_transactions')
        .select('*, wallet:credits_wallets!inner(organization_id)')
        .eq('wallet.organization_id', orgId)
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as OrgTransaction[]));
  }
}
