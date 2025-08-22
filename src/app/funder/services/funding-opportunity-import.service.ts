// src/app/funder/services/funding-opportunity-import.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/supabase.service';
import { FunderOnboardingService } from './funder-onboarding.service';
 

// Import-specific interfaces
export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportFieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  transform?: (value: any) => any;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportValidationError[];
  processedData?: any[];
}

export interface ParsedFileData {
  data: any[];
  columns: string[];
  sampleRows: any[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FundingOpportunityImportService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private onboardingService = inject(FunderOnboardingService);

  // State management
  isProcessing = signal(false);
  isValidating = signal(false);
  parseProgress = signal(0);
  importProgress = signal(0);
  currentError = signal<string | null>(null);

  // Field mappings definition
  private readonly FIELD_MAPPINGS: ImportFieldMapping[] = [
    { sourceField: '', targetField: 'title', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'description', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'shortDescription', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'fundingType', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'offerAmount', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'minInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'maxInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'totalAvailable', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'currency', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'decisionTimeframe', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'interestRate', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'equityOffered', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'expectedReturns', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'investmentHorizon', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'applicationDeadline', required: false, dataType: 'date' },
    { sourceField: '', targetField: 'repaymentTerms', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'securityRequired', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'useOfFunds', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'investmentStructure', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'exitStrategy', required: false, dataType: 'string' }
  ];

  constructor() {
    console.log('📥 FundingOpportunityImportService initialized');
  }

  // ===============================
  // FILE PARSING METHODS
  // ===============================

  /**
   * Parse CSV file and extract data
   */
  parseCsvFile(file: File): Observable<ParsedFileData> {
    this.parseProgress.set(0);
    this.currentError.set(null);

    return new Observable(observer => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          try {
            if (results.errors.length > 0) {
              const errorMessage = 'CSV parsing errors: ' + results.errors.map(e => e.message).join(', ');
              observer.error(new Error(errorMessage));
              return;
            }
            
            const parseData: ParsedFileData = {
              data: results.data as any[],
              columns: results.meta.fields || [],
              sampleRows: (results.data as any[]).slice(0, 5),
              errors: []
            };
            
            this.parseProgress.set(100);
            observer.next(parseData);
            observer.complete();
          } catch (error) {
            observer.error(error);
          }
        },
        error: (error) => {
          observer.error(new Error('Failed to parse CSV: ' + error.message));
        }
      });
    });
  }

  /**
   * Parse Excel file and extract data
   */
  parseExcelFile(file: File): Observable<ParsedFileData> {
    this.parseProgress.set(0);
    this.currentError.set(null);

    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null 
          }) as any[][];
          
          if (jsonData.length === 0) {
            observer.error(new Error('Excel file appears to be empty'));
            return;
          }
          
          // First row as headers
          const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
          const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
          
          // Convert to objects
          const parsedData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });
          
          const parseData: ParsedFileData = {
            data: parsedData,
            columns: headers,
            sampleRows: parsedData.slice(0, 5),
            errors: []
          };
          
          this.parseProgress.set(100);
          observer.next(parseData);
          observer.complete();
          
        } catch (error: any) {
          observer.error(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        observer.error(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // ===============================
  // FIELD MAPPING METHODS
  // ===============================

  /**
   * Get default field mappings
   */
  getFieldMappings(): ImportFieldMapping[] {
    return [...this.FIELD_MAPPINGS];
  }

  /**
   * Auto-map fields based on common naming patterns
   */
  autoMapFields(detectedColumns: string[]): ImportFieldMapping[] {
    const mappings = this.getFieldMappings();
    
    // Common field name patterns
    const patterns: Record<string, RegExp[]> = {
      title: [/^title$/i, /^name$/i, /^opportunity.?name$/i, /^fund.?name$/i],
      description: [/^description$/i, /^desc$/i, /^details$/i, /^full.?desc/i],
      shortDescription: [/^short.?desc/i, /^summary$/i, /^brief$/i, /^short.?summary$/i],
      fundingType: [/^funding.?type$/i, /^type$/i, /^fund.?type$/i, /^investment.?type$/i],
      offerAmount: [/^offer.?amount$/i, /^amount$/i, /^funding.?amount$/i, /^investment.?amount$/i],
      minInvestment: [/^min.?investment$/i, /^minimum$/i, /^min.?amount$/i, /^min.?funding$/i],
      maxInvestment: [/^max.?investment$/i, /^maximum$/i, /^max.?amount$/i, /^max.?funding$/i],
      totalAvailable: [/^total.?available$/i, /^total$/i, /^available$/i, /^pool.?size$/i],
      currency: [/^currency$/i, /^curr$/i, /^money.?type$/i],
      decisionTimeframe: [/^decision.?timeframe$/i, /^timeframe$/i, /^days$/i, /^decision.?time$/i],
      interestRate: [/^interest.?rate$/i, /^rate$/i, /^apr$/i],
      equityOffered: [/^equity$/i, /^equity.?offered$/i, /^ownership$/i],
      expectedReturns: [/^expected.?returns$/i, /^returns$/i, /^roi$/i],
      investmentHorizon: [/^investment.?horizon$/i, /^horizon$/i, /^years$/i, /^duration$/i],
      applicationDeadline: [/^application.?deadline$/i, /^deadline$/i, /^due.?date$/i, /^closing.?date$/i]
    };

    mappings.forEach(mapping => {
      const fieldPatterns = patterns[mapping.targetField];
      if (!fieldPatterns) return;

      const matchedColumn = detectedColumns.find(col => 
        fieldPatterns.some(pattern => pattern.test(col))
      );

      if (matchedColumn) {
        mapping.sourceField = matchedColumn;
      }
    });

    return mappings;
  }

  // ===============================
  // DATA VALIDATION METHODS
  // ===============================

  /**
   * Validate mapped data
   */
  validateImportData(
    rawData: any[], 
    fieldMappings: ImportFieldMapping[]
  ): Observable<{ transformedData: any[]; errors: ImportValidationError[] }> {
    this.isValidating.set(true);
    this.currentError.set(null);

    return from(this.performValidation(rawData, fieldMappings)).pipe(
      tap(() => {
        this.isValidating.set(false);
      }),
      catchError(error => {
        this.isValidating.set(false);
        this.currentError.set(error.message);
        return throwError(() => error);
      })
    );
  }

  private async performValidation(
    rawData: any[], 
    fieldMappings: ImportFieldMapping[]
  ): Promise<{ transformedData: any[]; errors: ImportValidationError[] }> {
    const transformedData: any[] = [];
    const errors: ImportValidationError[] = [];

    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      const transformedRow: any = {};

      // Transform each field according to mapping
      for (const mapping of fieldMappings) {
        if (!mapping.sourceField) {
          if (mapping.required) {
            errors.push({
              row: rowIndex,
              field: mapping.targetField,
              value: null,
              message: `${this.getFieldDisplayName(mapping.targetField)} is required but not mapped`,
              severity: 'error'
            });
          }
          continue;
        }

        const rawValue = row[mapping.sourceField];
        const transformedValue = this.transformValue(rawValue, mapping);
        transformedRow[mapping.targetField] = transformedValue;

        // Validate the transformed value
        const fieldErrors = this.validateFieldValue(rowIndex, mapping, transformedValue);
        errors.push(...fieldErrors);
      }

      // Cross-field validation
      const rowErrors = this.validateRowConstraints(rowIndex, transformedRow);
      errors.push(...rowErrors);

      transformedData.push(transformedRow);
    }

    return { transformedData, errors };
  }

  private transformValue(value: any, mapping: ImportFieldMapping): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (mapping.dataType) {
      case 'number':
        const numValue = typeof value === 'string' ? 
          parseFloat(value.replace(/[,\s]/g, '')) : Number(value);
        return isNaN(numValue) ? null : numValue;
        
      case 'string':
        return String(value).trim();
        
      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
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

  private validateFieldValue(
    rowIndex: number, 
    mapping: ImportFieldMapping, 
    value: any
  ): ImportValidationError[] {
    const errors: ImportValidationError[] = [];

    // Required field validation
    if (mapping.required && (value === null || value === undefined || value === '')) {
      errors.push({
        row: rowIndex,
        field: mapping.targetField,
        value,
        message: `${this.getFieldDisplayName(mapping.targetField)} is required`,
        severity: 'error'
      });
      return errors;
    }

    if (value === null || value === undefined) return errors;

    // Field-specific validations
    switch (mapping.targetField) {
      case 'fundingType':
        const validTypes = ['debt', 'equity', 'convertible', 'mezzanine', 'grant'];
        if (!validTypes.includes(String(value).toLowerCase())) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `Funding type must be one of: ${validTypes.join(', ')}`,
            severity: 'error'
          });
        }
        break;

      case 'offerAmount':
      case 'minInvestment':
      case 'maxInvestment':
      case 'totalAvailable':
        if (typeof value === 'number' && value <= 0) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `${this.getFieldDisplayName(mapping.targetField)} must be greater than 0`,
            severity: 'error'
          });
        }
        break;

      case 'interestRate':
      case 'equityOffered':
      case 'expectedReturns':
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `${this.getFieldDisplayName(mapping.targetField)} must be between 0 and 100`,
            severity: 'warning'
          });
        }
        break;

      case 'currency':
        const validCurrencies = ['ZAR', 'USD', 'EUR', 'GBP'];
        if (typeof value === 'string' && !validCurrencies.includes(value.toUpperCase())) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `Currency should be one of: ${validCurrencies.join(', ')}`,
            severity: 'warning'
          });
        }
        break;
    }

    return errors;
  }

  private validateRowConstraints(rowIndex: number, row: any): ImportValidationError[] {
    const errors: ImportValidationError[] = [];

    // Min/Max investment validation
    if (row.minInvestment && row.maxInvestment && row.minInvestment > row.maxInvestment) {
      errors.push({
        row: rowIndex,
        field: 'maxInvestment',
        value: row.maxInvestment,
        message: 'Maximum investment must be greater than or equal to minimum investment',
        severity: 'error'
      });
    }

    // Offer amount vs total available
    if (row.offerAmount && row.totalAvailable && row.offerAmount > row.totalAvailable) {
      errors.push({
        row: rowIndex,
        field: 'offerAmount',
        value: row.offerAmount,
        message: 'Offer amount cannot exceed total available funding',
        severity: 'warning'
      });
    }

    return errors;
  }

  // ===============================
  // IMPORT EXECUTION METHODS
  // ===============================

  /**
   * Import validated opportunities to database
   */
  importOpportunities(validatedData: any[]): Observable<ImportResult> {
    this.isProcessing.set(true);
    this.importProgress.set(0);
    this.currentError.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isProcessing.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    // First validate user can create opportunities
    return this.validateUserCanImport(currentAuth.id).pipe(
      switchMap(() => this.performBulkImport(currentAuth.id, validatedData)),
      tap(result => {
        this.isProcessing.set(false);
        this.importProgress.set(100);
        console.log(`Import completed: ${result.imported} imported, ${result.failed} failed`);
      }),
      catchError(error => {
        this.isProcessing.set(false);
        this.currentError.set(error.message);
        console.error('Import failed:', error);
        return throwError(() => error);
      })
    );
  }

  private validateUserCanImport(userId: string): Observable<boolean> {
    // Check if user has completed onboarding
    return this.onboardingService.checkOnboardingStatus().pipe(
      switchMap(state => {
        if (!state.canCreateOpportunities) {
          return throwError(() => new Error(
            'Please complete your organization setup before importing opportunities'
          ));
        }
        return of(true);
      })
    );
  }

  private performBulkImport(userId: string, validatedData: any[]): Observable<ImportResult> {
    return from(this.bulkImportToDatabase(userId, validatedData));
  }

  private async bulkImportToDatabase(userId: string, validatedData: any[]): Promise<ImportResult> {
    console.log(`🚀 Starting bulk import of ${validatedData.length} opportunities`);

    // Get organization ID
    const organizationId = await this.getOrganizationId(userId);
    const results: ImportResult = { 
      success: true, 
      imported: 0, 
      failed: 0, 
      errors: [],
      processedData: []
    };

    for (let i = 0; i < validatedData.length; i++) {
      const opportunity = validatedData[i];
      
      try {
        // Update progress
        this.importProgress.set(Math.round((i / validatedData.length) * 100));

        // Transform to database format
        const dbOpportunity = this.transformForDatabase(userId, organizationId, opportunity);
        
        console.log(`Importing opportunity ${i + 1}/${validatedData.length}: ${opportunity.title}`);

        // Insert to database
        const { data, error } = await this.supabaseService
          .from('funding_opportunities')
          .insert(dbOpportunity)
          .select()
          .single();

        if (error) {
          console.error(`Failed to import opportunity ${i + 1}:`, error);
          results.failed++;
          results.errors.push({
            row: i,
            field: 'database',
            value: opportunity.title,
            message: this.formatDatabaseError(error),
            severity: 'error'
          });
        } else {
          console.log(`Successfully imported opportunity ${i + 1}: ${data.id}`);
          results.imported++;
          results.processedData?.push(data);
        }

      } catch (error: any) {
        console.error(`Exception importing opportunity ${i + 1}:`, error);
        results.failed++;
        results.errors.push({
          row: i,
          field: 'general',
          value: opportunity.title || 'Unknown',
          message: error.message,
          severity: 'error'
        });
      }
    }

    results.success = results.imported > 0;
    console.log(`✅ Import completed: ${results.imported} imported, ${results.failed} failed`);
    
    return results;
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private async getOrganizationId(userId: string): Promise<string> {
    const { data: org, error } = await this.supabaseService
      .from('funder_organizations')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !org) {
      throw new Error('Organization not found. Please complete your organization setup first.');
    }

    return org.id;
  }

  private transformForDatabase(userId: string, organizationId: string, opportunity: any): any {
    return {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      created_by: userId,
      title: opportunity.title?.trim() || '',
      description: opportunity.description?.trim() || '',
      short_description: opportunity.shortDescription?.trim() || '',
      target_company_profile: opportunity.targetCompanyProfile?.trim() || null,
      offer_amount: Math.max(0, opportunity.offerAmount || 0),
      min_investment: Math.max(0, opportunity.minInvestment || 0),
      max_investment: opportunity.maxInvestment ? 
        Math.max(opportunity.maxInvestment, opportunity.minInvestment || 0) : 0,
      currency: opportunity.currency || 'ZAR',
      funding_type: opportunity.fundingType?.toLowerCase(),
      interest_rate: opportunity.interestRate || null,
      equity_offered: opportunity.equityOffered || null,
      repayment_terms: opportunity.repaymentTerms?.trim() || null,
      security_required: opportunity.securityRequired?.trim() || null,
      use_of_funds: opportunity.useOfFunds?.trim() || null,
      investment_structure: opportunity.investmentStructure?.trim() || null,
      expected_returns: opportunity.expectedReturns || null,
      investment_horizon: opportunity.investmentHorizon || null,
      exit_strategy: opportunity.exitStrategy?.trim() || null,
      application_deadline: opportunity.applicationDeadline?.toISOString() || null,
      decision_timeframe: Math.max(1, opportunity.decisionTimeframe || 30),
      application_process: {},
      eligibility_criteria: {
        industries: [],
        businessStages: [],
        excludeCriteria: []
      },
      status: 'active',
      total_available: Math.max(0, opportunity.totalAvailable || 0),
      amount_committed: 0,
      amount_deployed: 0,
      max_applications: opportunity.maxApplications ? 
        Math.max(1, opportunity.maxApplications) : null,
      current_applications: 0,
      view_count: 0,
      application_count: 0,
      auto_match: true,
      match_criteria: null,
      deal_lead: userId,
      deal_team: [userId],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    };
  }

  private formatDatabaseError(error: any): string {
    if (error.message?.includes('violates check constraint')) {
      if (error.message.includes('funding_opportunities_check')) {
        return 'Investment amounts invalid: Maximum must be ≥ minimum investment';
      } else if (error.message.includes('min_investment_check')) {
        return 'Minimum investment must be greater than 0';
      } else if (error.message.includes('offer_amount_check')) {
        return 'Offer amount must be greater than 0';
      } else if (error.message.includes('total_available_check')) {
        return 'Total available must be greater than 0';
      }
    }
    
    return error.message || 'Database error occurred';
  }

  getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      shortDescription: 'Short Description',
      fundingType: 'Funding Type',
      offerAmount: 'Offer Amount',
      minInvestment: 'Minimum Investment',
      maxInvestment: 'Maximum Investment',
      totalAvailable: 'Total Available',
      currency: 'Currency',
      decisionTimeframe: 'Decision Timeframe',
      interestRate: 'Interest Rate',
      equityOffered: 'Equity Offered',
      expectedReturns: 'Expected Returns',
      investmentHorizon: 'Investment Horizon',
      applicationDeadline: 'Application Deadline'
    };
    return displayNames[field] || field;
  }

  // ===============================
  // TEMPLATE GENERATION
  // ===============================

  /**
   * Generate sample template data
   */
  generateSampleData(): any[] {
    return [
      {
        title: 'Growth Capital for Tech Startups',
        description: 'Funding for established technology companies looking to expand operations, enter new markets, or develop new products',
        shortDescription: 'Growth capital for expanding tech companies',
        fundingType: 'equity',
        offerAmount: 500000,
        minInvestment: 100000,
        maxInvestment: 2000000,
        totalAvailable: 5000000,
        currency: 'ZAR',
        decisionTimeframe: 30,
        equityOffered: 15,
        expectedReturns: 25,
        investmentHorizon: 5,
        applicationDeadline: '2024-12-31'
      },
      {
        title: 'SME Working Capital Fund',
        description: 'Short-term financing to help small and medium enterprises manage cash flow and operational expenses',
        shortDescription: 'Working capital for SME operations',
        fundingType: 'debt',
        offerAmount: 250000,
        minInvestment: 50000,
        maxInvestment: 1000000,
        totalAvailable: 3000000,
        currency: 'ZAR',
        decisionTimeframe: 14,
        interestRate: 12.5,
        investmentHorizon: 2,
        applicationDeadline: '2024-11-30'
      }
    ];
  }

  /**
   * Reset all state
   */
  resetState(): void {
    this.isProcessing.set(false);
    this.isValidating.set(false);
    this.parseProgress.set(0);
    this.importProgress.set(0);
    this.currentError.set(null);
  }
}