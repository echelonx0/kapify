import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { AuthService } from '../../auth/services/production.auth.service';

export interface FundingOpportunity {
  id: string;
  funderOrganizationId: string; // FK to organizations table
  title: string;
  description: string;
  shortDescription?: string;
  offerAmount: number;
  minInvestment: number;
  maxInvestment: number;
  currency: string;
  interestRate?: number;
  equityOffered?: number;
  status: 'active' | 'inactive' | 'closed' | 'pending_review';
  targetCompanyProfile?: string;
  useOfFunds?: string;
  investmentStructure?: string;
  expectedReturns?: number;
  investmentHorizon?: number;
  exitStrategy?: string;
  applicationDeadline?: Date;
  decisionTimeframe?: number;
  totalAvailable: number;
  amountCommitted: number;
  amountDeployed: number;
  viewCount: number;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string; // User ID who created
}

@Injectable({ providedIn: 'root' })
export class FundingOpportunityRepository {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  /**
   * Get opportunities for the current user's organization
   */
  getOpportunitiesForCurrentOrganization(): Observable<FundingOpportunity[]> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of([]);
    }

    return this.getOpportunitiesByFunderOrganization(orgId);
  }

  /**
   * Get opportunities by funder organization ID
   */
  getOpportunitiesByFunderOrganization(
    funderOrgId: string
  ): Observable<FundingOpportunity[]> {
    return from(
      this.supabaseService
        .from('funding_opportunities')
        .select('*')
        .eq('funder_organization_id', funderOrgId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((opp) => this.mapDatabaseToModel(opp));
      }),
      catchError((error) => {
        console.error('Failed to fetch opportunities:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single opportunity by ID
   */
  getOpportunity(id: string): Observable<FundingOpportunity> {
    return from(
      this.supabaseService
        .from('funding_opportunities')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('Opportunity not found');
        return this.mapDatabaseToModel(data);
      }),
      catchError((error) => {
        console.error('Failed to fetch opportunity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new funding opportunity
   */
  createOpportunity(
    opportunity: Omit<FundingOpportunity, 'id' | 'createdAt' | 'updatedAt'>
  ): Observable<FundingOpportunity> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return throwError(() => new Error('No organization found'));
    }

    const validation = this.validateOpportunity(opportunity);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    const dbData = this.mapModelToDatabase({
      ...opportunity,
      funderOrganizationId: orgId,
      createdBy: user.id,
    });

    return from(
      this.supabaseService
        .from('funding_opportunities')
        .insert([dbData])
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('No data returned from insert');
        return this.mapDatabaseToModel(data);
      }),
      catchError((error) => {
        console.error('Failed to create opportunity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update funding opportunity
   */
  updateOpportunity(
    id: string,
    updates: Partial<FundingOpportunity>
  ): Observable<FundingOpportunity> {
    const validation = this.validateOpportunity(updates as any);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    const dbData = this.mapModelToDatabase(updates as any);
    dbData.updated_at = new Date().toISOString();

    return from(
      this.supabaseService
        .from('funding_opportunities')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) throw new Error('No data returned from update');
        return this.mapDatabaseToModel(data);
      }),
      catchError((error) => {
        console.error('Failed to update opportunity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete funding opportunity
   */
  deleteOpportunity(id: string): Observable<boolean> {
    return from(
      this.supabaseService.from('funding_opportunities').delete().eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      }),
      catchError((error) => {
        console.error('Failed to delete opportunity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Publish funding opportunity
   */
  publishOpportunity(id: string): Observable<FundingOpportunity> {
    return this.updateOpportunity(id, {
      status: 'active',
      publishedAt: new Date(),
    } as any);
  }

  // ===============================
  // PRIVATE HELPERS
  // ===============================

  private mapDatabaseToModel(dbOpp: any): FundingOpportunity {
    return {
      id: dbOpp.id,
      funderOrganizationId: dbOpp.funder_organization_id,
      title: dbOpp.title,
      description: dbOpp.description,
      shortDescription: dbOpp.short_description,
      offerAmount: dbOpp.offer_amount,
      minInvestment: dbOpp.min_investment,
      maxInvestment: dbOpp.max_investment,
      currency: dbOpp.currency,
      interestRate: dbOpp.interest_rate,
      equityOffered: dbOpp.equity_offered,
      status: dbOpp.status,
      targetCompanyProfile: dbOpp.target_company_profile,
      useOfFunds: dbOpp.use_of_funds,
      investmentStructure: dbOpp.investment_structure,
      expectedReturns: dbOpp.expected_returns,
      investmentHorizon: dbOpp.investment_horizon,
      exitStrategy: dbOpp.exit_strategy,
      applicationDeadline: dbOpp.application_deadline
        ? new Date(dbOpp.application_deadline)
        : undefined,
      decisionTimeframe: dbOpp.decision_timeframe,
      totalAvailable: dbOpp.total_available,
      amountCommitted: dbOpp.amount_committed,
      amountDeployed: dbOpp.amount_deployed,
      viewCount: dbOpp.view_count,
      applicationCount: dbOpp.application_count,
      createdAt: new Date(dbOpp.created_at),
      updatedAt: new Date(dbOpp.updated_at),
      publishedAt: dbOpp.published_at
        ? new Date(dbOpp.published_at)
        : undefined,
      createdBy: dbOpp.created_by,
    };
  }

  private mapModelToDatabase(opp: any): any {
    return {
      funder_organization_id: opp.funderOrganizationId,
      title: opp.title?.trim(),
      description: opp.description?.trim(),
      short_description: opp.shortDescription?.trim(),
      offer_amount: opp.offerAmount,
      min_investment: opp.minInvestment,
      max_investment: opp.maxInvestment,
      currency: opp.currency,
      interest_rate: opp.interestRate,
      equity_offered: opp.equityOffered,
      status: opp.status || 'pending_review',
      target_company_profile: opp.targetCompanyProfile?.trim(),
      use_of_funds: opp.useOfFunds?.trim(),
      investment_structure: opp.investmentStructure?.trim(),
      expected_returns: opp.expectedReturns,
      investment_horizon: opp.investmentHorizon,
      exit_strategy: opp.exitStrategy?.trim(),
      application_deadline: opp.applicationDeadline?.toISOString(),
      decision_timeframe: opp.decisionTimeframe,
      total_available: opp.totalAvailable,
      amount_committed: opp.amountCommitted || 0,
      amount_deployed: opp.amountDeployed || 0,
      view_count: opp.viewCount || 0,
      application_count: opp.applicationCount || 0,
      published_at: opp.publishedAt?.toISOString(),
      created_by: opp.createdBy,
    };
  }

  private validateOpportunity(opp: Partial<FundingOpportunity>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!opp.title?.trim()) {
      errors.push('Title is required');
    } else if (opp.title.length > 255) {
      errors.push('Title must be less than 255 characters');
    }

    if (!opp.description?.trim()) {
      errors.push('Description is required');
    }

    if (!opp.offerAmount || opp.offerAmount <= 0) {
      errors.push('Offer amount must be greater than 0');
    }

    if (!opp.minInvestment || opp.minInvestment <= 0) {
      errors.push('Minimum investment must be greater than 0');
    }

    if (!opp.maxInvestment || opp.maxInvestment <= 0) {
      errors.push('Maximum investment must be greater than 0');
    }

    if (
      opp.minInvestment &&
      opp.maxInvestment &&
      opp.minInvestment > opp.maxInvestment
    ) {
      errors.push('Minimum investment cannot exceed maximum investment');
    }

    if (!opp.currency?.trim()) {
      errors.push('Currency is required');
    }

    if (
      opp.funderOrganizationId &&
      !this.isValidUUID(opp.funderOrganizationId)
    ) {
      errors.push('Invalid funder organization ID');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
