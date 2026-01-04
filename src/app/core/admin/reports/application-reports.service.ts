import { Injectable } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface ApplicationReportRow {
  id: string;
  applicant_id: string;
  title: string;
  description?: string;
  status?: string;
  stage?: string;
  form_data?: any;
  documents?: any;
  review_notes?: any;
  terms?: any;
  submitted_at?: string;
  review_started_at?: string;
  reviewed_at?: string;
  decided_at?: string;
  created_at?: string;
  updated_at?: string;
  opportunity_id?: string;
  ai_analysis_status?: string;
  ai_match_score?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationsReportService {
  constructor(private supabase: SharedSupabaseService) {}

  /**
   * Load all applications for reporting.
   * fields: array of column names as strings
   */
  async loadApplications(fields?: string[]): Promise<ApplicationReportRow[]> {
    await this.supabase.ensureInitialized();

    const selectFields = fields && fields.length ? fields.join(', ') : '*';

    const { data, error } = await this.supabase
      .from('applications')
      .select(selectFields);

    if (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }

    // Type-safe casting via unknown
    return (data as unknown as ApplicationReportRow[]) || [];
  }

  /**
   * Load applications filtered by status.
   */
  async loadApplicationsByStatus(
    status: string,
    fields?: string[]
  ): Promise<ApplicationReportRow[]> {
    await this.supabase.ensureInitialized();

    const selectFields = fields && fields.length ? fields.join(', ') : '*';

    const { data, error } = await this.supabase
      .from('applications')
      .select(selectFields)
      .eq('status', status);

    if (error) {
      console.error('Error fetching applications by status:', error);
      throw error;
    }

    // Type-safe casting via unknown
    return (data as unknown as ApplicationReportRow[]) || [];
  }
}
