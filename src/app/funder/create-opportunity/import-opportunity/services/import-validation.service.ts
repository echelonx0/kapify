// src/app/funder/create-opportunity/import-opportunity/services/import-validation.service.ts
import { Injectable } from '@angular/core';

interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

interface ParsedFileData {
  rawData: any[];
  detectedColumns: string[];
  sampleData: any[];
  fileName: string;
  fileSize: number;
}

@Injectable()
export class ImportValidationService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly VALID_EXTENSIONS = ['csv', 'xlsx', 'xls'];

  validateFile(file: File): FileValidationResult {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File too large. Please upload a file smaller than 10MB.',
      };
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !this.VALID_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload a CSV or Excel file.',
      };
    }

    return { isValid: true };
  }

  async parseFile(file: File): Promise<ParsedFileData> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    try {
      let rawData: any[];
      let detectedColumns: string[];

      if (extension === 'csv') {
        const result = await this.parseCsvFile(file);
        rawData = result.data;
        detectedColumns = result.columns;
      } else {
        const result = await this.parseExcelFile(file);
        rawData = result.data;
        detectedColumns = result.columns;
      }

      return {
        rawData,
        detectedColumns,
        sampleData: rawData.slice(0, 5),
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error: any) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  private async parseCsvFile(
    file: File
  ): Promise<{ data: any[]; columns: string[] }> {
    // Dynamic import for better tree-shaking
    const Papa = await import('papaparse');

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        complete: (results) => {
          if (results.errors.length > 0) {
            const errorMessages = results.errors
              .map((e) => e.message)
              .join(', ');
            reject(new Error(`CSV parsing errors: ${errorMessages}`));
            return;
          }

          resolve({
            data: results.data as any[],
            columns: results.meta.fields || [],
          });
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        },
      });
    });
  }

  private async parseExcelFile(
    file: File
  ): Promise<{ data: any[]; columns: string[] }> {
    // Dynamic import for better tree-shaking
    const XLSX = await import('xlsx');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: true,
            cellStyles: true,
          });

          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            reject(new Error('No sheets found in Excel file'));
            return;
          }

          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            blankrows: false,
          }) as any[][];

          if (jsonData.length === 0) {
            reject(new Error('Excel file appears to be empty'));
            return;
          }

          // Extract headers and clean them
          const headers = jsonData[0]
            .map((h) => String(h || '').trim())
            .filter((h) => h);

          if (headers.length === 0) {
            reject(new Error('No valid headers found in Excel file'));
            return;
          }

          // Extract data rows and convert to objects
          const dataRows = jsonData
            .slice(1)
            .filter((row) =>
              row.some(
                (cell) => cell !== null && cell !== undefined && cell !== ''
              )
            );

          const parsedData = dataRows.map((row) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });

          resolve({
            data: parsedData,
            columns: headers,
          });
        } catch (error: any) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async downloadTemplate(format: 'csv' | 'xlsx'): Promise<void> {
    const templateData = [
      {
        title: 'Example Growth Capital Fund',
        description:
          'Funding for established SMEs looking to expand operations and market reach',
        shortDescription: 'Growth capital for expanding SMEs',
        fundingType: ['equity'],
        offerAmount: 500000,
        minInvestment: 100000,
        maxInvestment: 2000000,
        totalAvailable: 5000000,
        currency: 'ZAR',
        decisionTimeframe: 30,
        interestRate: null,
        equityOffered: 15,
        expectedReturns: 25,
        investmentHorizon: 5,
        applicationDeadline: '2024-12-31',
      },
      {
        title: 'SME Debt Financing Program',
        description:
          'Traditional debt financing for working capital and equipment purchases',
        shortDescription: 'Working capital and equipment financing',
        fundingType: ['debt'],
        offerAmount: 250000,
        minInvestment: 50000,
        maxInvestment: 1000000,
        totalAvailable: 2000000,
        currency: 'ZAR',
        decisionTimeframe: 14,
        interestRate: 12.5,
        equityOffered: null,
        expectedReturns: null,
        investmentHorizon: 3,
        applicationDeadline: '2025-11-30',
      },
    ];

    if (format === 'csv') {
      const Papa = await import('papaparse');
      const csv = Papa.unparse(templateData);
      this.downloadFile(csv, 'funding-opportunities-template.csv', 'text/csv');
    } else {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Opportunities');
      XLSX.writeFile(wb, 'funding-opportunities-template.xlsx');
    }
  }

  private downloadFile(
    content: string,
    filename: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Data transformation utilities
  transformValue(value: any, dataType: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (dataType) {
      case 'number':
        const numValue =
          typeof value === 'string'
            ? parseFloat(value.replace(/[,\s]/g, ''))
            : Number(value);
        return isNaN(numValue) ? null : numValue;

      case 'string':
        return String(value).trim();

      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime())
            ? null
            : date.toISOString().split('T')[0];
        } catch {
          return null;
        }

      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return ['true', 'yes', '1', 'y'].includes(str);

      default:
        return value;
    }
  }

  // Validation utilities
  validateFieldValue(field: string, value: any): string | null {
    if (value === null || value === undefined) return null;

    switch (field) {
      case 'fundingType':
        const validTypes = [
          'debt',
          'equity',
          'convertible',
          'mezzanine',
          'grant',
        ];
        if (Array.isArray(value)) {
          const invalidTypes = value.filter(
            (type) => !validTypes.includes(String(type).toLowerCase())
          );
          if (invalidTypes.length > 0) {
            return `Invalid funding types: ${invalidTypes.join(
              ', '
            )}. Must be one of: ${validTypes.join(', ')}`;
          }
        } else {
          // Handle legacy single string values
          if (!validTypes.includes(String(value).toLowerCase())) {
            return `Funding type must be one of: ${validTypes.join(', ')}`;
          }
        }
        break;

      case 'offerAmount':
      case 'minInvestment':
      case 'maxInvestment':
      case 'totalAvailable':
        if (typeof value === 'number' && value <= 0) {
          return 'Amount must be greater than 0';
        }
        break;

      case 'interestRate':
      case 'equityOffered':
      case 'expectedReturns':
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          return 'Percentage must be between 0 and 100';
        }
        break;

      case 'currency':
        const validCurrencies = ['ZAR', 'USD', 'EUR', 'GBP'];
        if (
          typeof value === 'string' &&
          !validCurrencies.includes(value.toUpperCase())
        ) {
          return `Currency should be one of: ${validCurrencies.join(', ')}`;
        }
        break;
    }

    return null;
  }
}
