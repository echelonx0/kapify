export interface ReportField {
  key: string;
  label: string;
  exportable?: boolean;
}

export const APPLICATION_REPORT_FIELDS: ReportField[] = [
  { key: 'title', label: 'Application Title' },
  { key: 'status', label: 'Application Status' },
  { key: 'stage', label: 'Review Stage' },

  { key: 'ai_match_score', label: 'AI Match Score' },
  { key: 'ai_analysis_status', label: 'AI Analysis Status' },

  { key: 'submitted_at', label: 'Submitted Date' },
  { key: 'review_started_at', label: 'Review Started Date' },
  { key: 'reviewed_at', label: 'Reviewed Date' },
  { key: 'decided_at', label: 'Decision Date' },

  { key: 'created_at', label: 'Created Date' },
  { key: 'updated_at', label: 'Last Updated' },
];
