export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ExportOptions<T> {
  fileName: string;
  format: ExportFormat;
  columns: ExportColumn<T>[];
  pdf?: {
    title?: string;
    orientation?: 'portrait' | 'landscape';
  };
}

export interface ExportColumn<T> {
  header: string;
  key?: keyof T;
  value?: (row: T, index: number) => any;
  width?: number; // Excel / PDF
  format?: (value: any) => any; // Formatting hook
}
