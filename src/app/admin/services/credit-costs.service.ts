// src/app/admin/services/credit-costs.service.ts
import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject } from 'rxjs';
import { map, catchError, tap, takeUntil } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

/**
 * Credit action cost record from database
 */
export interface CreditActionCost {
  id: string;
  action_key: string;
  cost: number;
  display_name: string;
  description: string | null;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Audit log entry for cost changes
 */
export interface CreditCostAuditEntry {
  id: string;
  user_id: string;
  action: string;
  message: string;
  entity_type: string;
  entity_id: string;
  metadata: {
    action_key: string;
    old_cost?: number;
    new_cost?: number;
    old_display_name?: string;
    new_display_name?: string;
    old_is_active?: boolean;
    new_is_active?: boolean;
  };
  created_at: string;
  user_email?: string;
}

/**
 * Update cost request
 */
export interface UpdateCostRequest {
  action_key: string;
  cost?: number;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Add cost request
 */
export interface AddCostRequest {
  action_key: string;
  cost: number;
  display_name: string;
  description?: string;
}

/**
 * CreditCostsService
 * 
 * Manages credit action costs configuration.
 * Used by admin for CRUD operations and by CreditDeductionService for cost lookups.
 * 
 * Responsibilities:
 * - Fetch all action costs (admin view)
 * - Fetch active costs (client lookup)
 * - Update/add/delete action costs with audit logging
 * - Fetch audit history
 */
@Injectable({ providedIn: 'root' })
export class CreditCostsService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache for active costs (used by CreditDeductionService)
  private costsCache = new Map<string, number>();
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Observable for all costs (admin view)
  private costsSubject = new BehaviorSubject<CreditActionCost[]>([]);
  public costs$ = this.costsSubject.asObservable();

  constructor() {
    console.log('✅ CreditCostsService initialized');
  }

  // ===============================
  // COST FETCHING
  // ===============================

  /**
   * Get all action costs (admin view - includes inactive)
   */
  getAllCosts(): Observable<CreditActionCost[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchAllCosts()).pipe(
      tap((costs) => {
        this.costsSubject.next(costs);
        this.updateCache(costs);
        this.isLoading.set(false);
        console.log(`✅ Loaded ${costs.length} credit action costs`);
      }),
      catchError((err) => {
        const message = err?.message || 'Failed to load credit costs';
        this.error.set(message);
        this.isLoading.set(false);
        console.error('❌ Failed to load credit costs:', err);
        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch all costs from database via RPC
   */
  private async fetchAllCosts(): Promise<CreditActionCost[]> {
    const { data, error } = await this.supabase.rpc('get_credit_action_costs');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get active costs only (for client-side cost lookups)
   * Uses cache when available
   */
  async getActiveCosts(): Promise<Map<string, number>> {
    // Return cache if valid
    if (this.isCacheValid()) {
      return this.costsCache;
    }

    try {
      const { data, error } = await this.supabase.rpc('get_active_credit_costs');

      if (error) throw error;

      // Update cache
      this.costsCache.clear();
      (data || []).forEach((item: { action_key: string; cost: number }) => {
        this.costsCache.set(item.action_key, item.cost);
      });
      this.cacheTimestamp = Date.now();

      console.log(`✅ Refreshed credit costs cache: ${this.costsCache.size} actions`);
      return this.costsCache;
    } catch (err) {
      console.error('❌ Failed to fetch active costs:', err);
      // Return existing cache even if stale, or empty map
      return this.costsCache.size > 0 ? this.costsCache : new Map();
    }
  }

  /**
   * Get cost for a specific action
   * Uses cache, falls back to default if not found
   */
  async getCost(actionKey: string, defaultCost: number = 0): Promise<number> {
    const costs = await this.getActiveCosts();
    return costs.get(actionKey) ?? defaultCost;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return (
      this.costsCache.size > 0 &&
      Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS
    );
  }

  /**
   * Update cache from full costs list
   */
  private updateCache(costs: CreditActionCost[]): void {
    this.costsCache.clear();
    costs
      .filter((c) => c.is_active)
      .forEach((c) => this.costsCache.set(c.action_key, c.cost));
    this.cacheTimestamp = Date.now();
  }

  /**
   * Force cache refresh
   */
  invalidateCache(): void {
    this.cacheTimestamp = 0;
    console.log('🔄 Credit costs cache invalidated');
  }

  // ===============================
  // COST MANAGEMENT (ADMIN)
  // ===============================

  /**
   * Update an existing action cost
   */
  updateCost(request: UpdateCostRequest): Observable<{ success: boolean; old_cost: number; new_cost: number }> {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.supabase.getCurrentUserId();

    return from(
      this.supabase.rpc('update_credit_action_cost', {
        p_action_key: request.action_key,
        p_cost: request.cost,
        p_display_name: request.display_name,
        p_description: request.description,
        p_is_active: request.is_active,
        p_admin_id: userId,
      })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return result.data as { success: boolean; old_cost: number; new_cost: number };
      }),
      tap((result) => {
        this.invalidateCache();
        this.isLoading.set(false);
        console.log(`✅ Updated cost for ${request.action_key}: ${result.old_cost} → ${result.new_cost}`);
      }),
      catchError((err) => {
        const message = err?.message || 'Failed to update credit cost';
        this.error.set(message);
        this.isLoading.set(false);
        console.error('❌ Failed to update credit cost:', err);
        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Add a new action cost
   */
  addCost(request: AddCostRequest): Observable<{ success: boolean; id: string; action_key: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.supabase.getCurrentUserId();

    return from(
      this.supabase.rpc('add_credit_action_cost', {
        p_action_key: request.action_key,
        p_cost: request.cost,
        p_display_name: request.display_name,
        p_description: request.description || null,
        p_admin_id: userId,
      })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return result.data as { success: boolean; id: string; action_key: string };
      }),
      tap((result) => {
        this.invalidateCache();
        this.isLoading.set(false);
        console.log(`✅ Added new action cost: ${result.action_key}`);
      }),
      catchError((err) => {
        const message = err?.message || 'Failed to add credit cost';
        this.error.set(message);
        this.isLoading.set(false);
        console.error('❌ Failed to add credit cost:', err);
        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Delete an action cost (only custom actions, not core)
   */
  deleteCost(actionKey: string): Observable<{ success: boolean }> {
    this.isLoading.set(true);
    this.error.set(null);

    const userId = this.supabase.getCurrentUserId();

    return from(
      this.supabase.rpc('delete_credit_action_cost', {
        p_action_key: actionKey,
        p_admin_id: userId,
      })
    ).pipe(
      map((result) => {
        if (result.error) throw result.error;
        return result.data as { success: boolean };
      }),
      tap(() => {
        this.invalidateCache();
        this.isLoading.set(false);
        console.log(`✅ Deleted action cost: ${actionKey}`);
      }),
      catchError((err) => {
        const message = err?.message || 'Failed to delete credit cost';
        this.error.set(message);
        this.isLoading.set(false);
        console.error('❌ Failed to delete credit cost:', err);
        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // AUDIT HISTORY
  // ===============================

  /**
   * Get audit history for credit cost changes
   */
  getAuditHistory(limit: number = 50): Observable<CreditCostAuditEntry[]> {
    return from(this.fetchAuditHistory(limit)).pipe(
      catchError((err) => {
        console.error('❌ Failed to fetch audit history:', err);
        return throwError(() => new Error('Failed to load audit history'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch audit history from activities table
   */
  private async fetchAuditHistory(limit: number): Promise<CreditCostAuditEntry[]> {
    const { data: activities, error } = await this.supabase
      .from('activities')
      .select('*')
      .eq('type', 'admin')
      .in('action', ['credit_cost_updated', 'credit_cost_created', 'credit_cost_deleted'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch user emails for display
    const userIds = [...new Set((activities || []).map((a) => a.user_id).filter(Boolean))];
    
    let userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);
      
      userMap = new Map((users || []).map((u) => [u.id, u.email]));
    }

    return (activities || []).map((activity) => ({
      id: activity.id,
      user_id: activity.user_id,
      action: activity.action,
      message: activity.message,
      entity_type: activity.entity_type,
      entity_id: activity.entity_id,
      metadata: activity.metadata || {},
      created_at: activity.created_at,
      user_email: userMap.get(activity.user_id),
    }));
  }

  // ===============================
  // CLEANUP
  // ===============================

  ngOnDestroy(): void {
    console.log('🧹 CreditCostsService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.costsSubject.complete();
  }
}
