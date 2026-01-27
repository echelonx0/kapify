import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { ApplicationReportRecord } from '../analysis-history/components/report-builder-modal/report-builder.component';
import { AuthService } from 'src/app/auth/services/production.auth.service';

export interface ReportExportConfig {
  format: 'excel' | 'pdf' | 'csv';
  selectedFields: string[];
  dateRange: { start?: string; end?: string };
}

export interface KapifyApplicationReport {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  report_data: ApplicationReportRecord[];
  export_config: ReportExportConfig;
  created_at: string;
  updated_at: string;
}

export interface SaveReportRequest {
  title: string;
  report_data: ApplicationReportRecord[];
  export_config: ReportExportConfig;
}

@Injectable({
  providedIn: 'root',
})
export class KapifyReportsService {
  private authservice = inject(AuthService);
  private supabase = inject(SharedSupabaseService);
  private readonly TABLE = 'kapify_application_reports';

  /**
   * Generate UUID v4 for client-side ID generation
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Save a generated report to organization
   * All team members with org access can view it
   * created_by tracks who created it, but report is visible to all org members
   */
  saveReport(request: SaveReportRequest): Observable<KapifyApplicationReport> {
    const userId = this.authservice.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const orgId = this.authservice.getCurrentUserOrganizationId();
    if (!orgId) {
      return throwError(() => new Error('Organization not found'));
    }

    const now = new Date().toISOString();
    const reportId = this.generateUUID();

    // Report is org-scoped (all members see it), but track who created it
    const reportData = {
      id: reportId,
      organization_id: orgId,
      created_by: userId, // ✅ Required field, tracks creator
      title: request.title,
      report_data: request.report_data,
      export_config: request.export_config,
      created_at: now,
      updated_at: now,
    };

    console.log('📝 Saving report to organization:', {
      reportId,
      orgId,
      userId,
      title: request.title,
      recordCount: request.report_data.length,
    });

    // Insert report
    return from(
      this.supabase.from(this.TABLE).insert([reportData], { count: 'exact' })
    ).pipe(
      tap((response: any) => {
        console.log('✅ INSERT response:', response);
      }),
      map((response: any) => {
        // Check for Supabase error response
        if (response && response.error) {
          throw new Error(
            `Supabase error: ${response.error.message || 'Unknown error'}`
          );
        }

        // If we get here, INSERT succeeded
        console.log('✅ Report saved to organization:', reportId);
        return reportData as KapifyApplicationReport;
      }),
      catchError((error: any) => {
        const errorMsg =
          error?.message ||
          error?.statusText ||
          error?.details ||
          'Unknown error';

        console.error('❌ Failed to save report:', {
          error: errorMsg,
          status: error?.status,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        });

        return throwError(
          () => new Error(`Failed to save report: ${errorMsg}`)
        );
      })
    );
  }

  /**
   * Get all reports for the current organization
   * All authenticated team members can see these
   */
  getReportsForOrganization(): Observable<KapifyApplicationReport[]> {
    const orgId = this.authservice.getCurrentUserOrganizationId();
    if (!orgId) {
      return throwError(() => new Error('Organization not found'));
    }

    console.log('📋 Fetching reports for organization:', orgId);

    return from(
      this.supabase
        .from(this.TABLE)
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
    ).pipe(
      map((response: any) => {
        console.log('✅ Fetched reports:', response.data?.length || 0);
        return (response.data || []).map((report: any) =>
          this.transformReport(report)
        );
      }),
      catchError((error) => {
        console.error('❌ Error loading reports:', error);
        return throwError(
          () =>
            new Error(
              `Failed to load reports: ${error?.message || 'Unknown error'}`
            )
        );
      })
    );
  }

  /**
   * Get a single report by ID
   */
  getReportById(reportId: string): Observable<KapifyApplicationReport> {
    return from(
      this.supabase.from(this.TABLE).select('*').eq('id', reportId).single()
    ).pipe(
      map((response: any) => this.transformReport(response.data)),
      catchError((error) => {
        console.error('❌ Error loading report:', error);
        return throwError(
          () =>
            new Error(
              `Failed to load report: ${error?.message || 'Unknown error'}`
            )
        );
      })
    );
  }

  /**
   * Delete a report
   * Works because RLS allows authenticated users to delete any report (for now)
   * Production: restrict to org admins or creator
   */
  deleteReport(reportId: string): Observable<void> {
    return from(
      this.supabase.from(this.TABLE).delete().eq('id', reportId)
    ).pipe(
      tap(() => {
        console.log('✅ Report deleted:', reportId);
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('❌ Error deleting report:', error);
        return throwError(
          () =>
            new Error(
              `Failed to delete report: ${error?.message || 'Unknown error'}`
            )
        );
      })
    );
  }

  /**
   * Transform database report to local interface
   */
  private transformReport(data: any): KapifyApplicationReport {
    if (!data) {
      throw new Error('Report data is null or undefined');
    }

    return {
      id: data.id,
      organization_id: data.organization_id,
      created_by: data.created_by,
      title: data.title,
      report_data: data.report_data || [],
      export_config: data.export_config || {},
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
