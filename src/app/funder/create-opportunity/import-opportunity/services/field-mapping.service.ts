// src/app/funder/components/import-opportunity/services/field-mapping.service.ts
import { Injectable } from '@angular/core';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  displayName: string;
  description: string;
}

@Injectable()
export class FieldMappingService {
  
  getDefaultFieldMappings(): FieldMapping[] {
    return [
      {
        sourceField: '',
        targetField: 'title',
        required: true,
        dataType: 'string',
        displayName: 'Title',
        description: 'Name of the funding opportunity'
      },
      {
        sourceField: '',
        targetField: 'description',
        required: true,
        dataType: 'string',
        displayName: 'Description',
        description: 'Detailed description of the opportunity'
      },
      {
        sourceField: '',
        targetField: 'shortDescription',
        required: true,
        dataType: 'string',
        displayName: 'Short Description',
        description: 'Brief summary for listings'
      },
      {
        sourceField: '',
        targetField: 'fundingType',
        required: true,
        dataType: 'string',
        displayName: 'Funding Type',
        description: 'Type: debt, equity, convertible, mezzanine, grant'
      },
      {
        sourceField: '',
        targetField: 'offerAmount',
        required: true,
        dataType: 'number',
        displayName: 'Offer Amount',
        description: 'Typical investment amount per business'
      },
      {
        sourceField: '',
        targetField: 'totalAvailable',
        required: true,
        dataType: 'number',
        displayName: 'Total Available',
        description: 'Total funding pool available'
      },
      {
        sourceField: '',
        targetField: 'minInvestment',
        required: false,
        dataType: 'number',
        displayName: 'Minimum Investment',
        description: 'Minimum investment amount'
      },
      {
        sourceField: '',
        targetField: 'maxInvestment',
        required: false,
        dataType: 'number',
        displayName: 'Maximum Investment',
        description: 'Maximum investment amount'
      },
      {
        sourceField: '',
        targetField: 'currency',
        required: false,
        dataType: 'string',
        displayName: 'Currency',
        description: 'Currency code (e.g., ZAR, USD)'
      },
      {
        sourceField: '',
        targetField: 'decisionTimeframe',
        required: false,
        dataType: 'number',
        displayName: 'Decision Timeframe',
        description: 'Days to make funding decision'
      },
      {
        sourceField: '',
        targetField: 'interestRate',
        required: false,
        dataType: 'number',
        displayName: 'Interest Rate (%)',
        description: 'Annual interest rate for debt funding'
      },
      {
        sourceField: '',
        targetField: 'equityOffered',
        required: false,
        dataType: 'number',
        displayName: 'Equity Offered (%)',
        description: 'Percentage of equity offered'
      },
      {
        sourceField: '',
        targetField: 'expectedReturns',
        required: false,
        dataType: 'number',
        displayName: 'Expected Returns (%)',
        description: 'Expected annual return percentage'
      },
      {
        sourceField: '',
        targetField: 'investmentHorizon',
        required: false,
        dataType: 'number',
        displayName: 'Investment Horizon (years)',
        description: 'Expected investment duration in years'
      },
      {
        sourceField: '',
        targetField: 'applicationDeadline',
        required: false,
        dataType: 'date',
        displayName: 'Application Deadline',
        description: 'Last date to apply (YYYY-MM-DD)'
      }
    ];
  }

  autoMapFields(mappings: FieldMapping[], columns: string[]): FieldMapping[] {
    // Common field name patterns for auto-mapping
    const patterns: Record<string, RegExp[]> = {
      title: [/^title$/i, /^name$/i, /^opportunity.?name$/i, /^funding.?name$/i],
      description: [/^description$/i, /^desc$/i, /^details$/i, /^full.?description$/i],
      shortDescription: [/^short.?desc/i, /^summary$/i, /^brief$/i, /^short.?summary$/i],
      fundingType: [/^funding.?type$/i, /^type$/i, /^fund.?type$/i, /^investment.?type$/i],
      offerAmount: [/^offer.?amount$/i, /^amount$/i, /^funding.?amount$/i, /^investment.?amount$/i],
      minInvestment: [/^min.?investment$/i, /^minimum$/i, /^min.?amount$/i, /^min.?funding$/i],
      maxInvestment: [/^max.?investment$/i, /^maximum$/i, /^max.?amount$/i, /^max.?funding$/i],
      totalAvailable: [/^total.?available$/i, /^total$/i, /^available$/i, /^total.?funding$/i],
      currency: [/^currency$/i, /^curr$/i, /^money.?type$/i],
      decisionTimeframe: [/^decision.?timeframe$/i, /^timeframe$/i, /^days$/i, /^decision.?time$/i],
      interestRate: [/^interest.?rate$/i, /^rate$/i, /^apr$/i, /^interest$/i],
      equityOffered: [/^equity$/i, /^equity.?offered$/i, /^stake$/i, /^ownership$/i],
      expectedReturns: [/^expected.?returns$/i, /^returns$/i, /^roi$/i, /^expected.?roi$/i],
      investmentHorizon: [/^investment.?horizon$/i, /^horizon$/i, /^years$/i, /^duration$/i],
      applicationDeadline: [/^application.?deadline$/i, /^deadline$/i, /^due.?date$/i, /^closing.?date$/i]
    };

    const updatedMappings = mappings.map(mapping => {
      const fieldPatterns = patterns[mapping.targetField];
      if (!fieldPatterns) return mapping;

      const matchedColumn = columns.find(col => 
        fieldPatterns.some(pattern => pattern.test(col))
      );

      return {
        ...mapping,
        sourceField: matchedColumn || mapping.sourceField
      };
    });

    return updatedMappings;
  }

  transformValue(value: any, dataType: string): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    try {
      switch (dataType) {
        case 'number':
          const numValue = typeof value === 'string' ? 
            parseFloat(value.replace(/[,\s]/g, '')) : Number(value);
          return isNaN(numValue) ? '' : numValue.toString();
          
        case 'string':
          return String(value).trim();
          
        case 'date':
          const date = new Date(value);
          return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
          
        case 'boolean':
          if (typeof value === 'boolean') return value.toString();
          const str = String(value).toLowerCase();
          return ['true', 'yes', '1', 'y'].includes(str) ? 'true' : 'false';
          
        default:
          return String(value);
      }
    } catch {
      return '';
    }
  }

  transformRowData(row: any, mappings: FieldMapping[]): any {
    const transformed: any = {};
    
    mappings.forEach(mapping => {
      if (!mapping.sourceField) return;
      
      const rawValue = row[mapping.sourceField];
      transformed[mapping.targetField] = this.transformValueTyped(rawValue, mapping.dataType);
    });
    
    return transformed;
  }

  private transformValueTyped(value: any, dataType: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (dataType) {
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

  validateMapping(mappings: FieldMapping[]): string[] {
    const errors: string[] = [];

    // Check for required fields
    const missingRequired = mappings
      .filter(m => m.required && !m.sourceField)
      .map(m => `${m.displayName} is required but not mapped`);
    
    errors.push(...missingRequired);

    // Check for duplicate source mappings
    const sourceFields = mappings
      .filter(m => m.sourceField)
      .map(m => m.sourceField);
    
    const duplicates = new Set<string>();
    sourceFields.forEach((field, index) => {
      if (sourceFields.indexOf(field) !== index) {
        duplicates.add(field);
      }
    });

    duplicates.forEach(field => {
      errors.push(`Column "${field}" is mapped to multiple fields`);
    });

    return errors;
  }

  calculateMappingCompletion(mappings: FieldMapping[]): number {
    const requiredMappings = mappings.filter(m => m.required);
    const completedRequired = requiredMappings.filter(m => m.sourceField).length;
    
    if (requiredMappings.length === 0) return 100;
    return Math.round((completedRequired / requiredMappings.length) * 100);
  }

  getMappingScore(mappings: FieldMapping[], columns: string[]): number {
    let score = 0;
    let maxScore = 0;

    mappings.forEach(mapping => {
      const weight = mapping.required ? 3 : 1; // Required fields worth more
      maxScore += weight;
      
      if (mapping.sourceField) {
        score += weight;
      }
    });

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  // Field-specific validation patterns
  getFieldValidationPattern(targetField: string): RegExp | null {
    switch (targetField) {
      case 'currency':
        return /^[A-Z]{3}$/; // ISO currency codes
      case 'fundingType':
        return /^(debt|equity|convertible|mezzanine|grant)$/i;
      default:
        return null;
    }
  }

  suggestBestMatch(targetField: string, columns: string[]): string | null {
    const patterns = this.getFieldPatterns();
    const fieldPatterns = patterns[targetField];
    
    if (!fieldPatterns) return null;

    // Find exact matches first
    for (const pattern of fieldPatterns) {
      const exactMatch = columns.find(col => pattern.test(col));
      if (exactMatch) return exactMatch;
    }

    // Find partial matches with scoring
    const partialMatches = columns
      .map(col => ({
        column: col,
        score: this.calculateMatchScore(col, fieldPatterns)
      }))
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);

    return partialMatches.length > 0 ? partialMatches[0].column : null;
  }

  private getFieldPatterns(): Record<string, RegExp[]> {
    return {
      title: [/^title$/i, /^name$/i, /^opportunity.?name$/i, /^funding.?name$/i],
      description: [/^description$/i, /^desc$/i, /^details$/i, /^full.?description$/i],
      shortDescription: [/^short.?desc/i, /^summary$/i, /^brief$/i, /^short.?summary$/i],
      fundingType: [/^funding.?type$/i, /^type$/i, /^fund.?type$/i, /^investment.?type$/i],
      offerAmount: [/^offer.?amount$/i, /^amount$/i, /^funding.?amount$/i, /^investment.?amount$/i],
      minInvestment: [/^min.?investment$/i, /^minimum$/i, /^min.?amount$/i, /^min.?funding$/i],
      maxInvestment: [/^max.?investment$/i, /^maximum$/i, /^max.?amount$/i, /^max.?funding$/i],
      totalAvailable: [/^total.?available$/i, /^total$/i, /^available$/i, /^total.?funding$/i],
      currency: [/^currency$/i, /^curr$/i, /^money.?type$/i],
      decisionTimeframe: [/^decision.?timeframe$/i, /^timeframe$/i, /^days$/i, /^decision.?time$/i],
      interestRate: [/^interest.?rate$/i, /^rate$/i, /^apr$/i, /^interest$/i],
      equityOffered: [/^equity$/i, /^equity.?offered$/i, /^stake$/i, /^ownership$/i],
      expectedReturns: [/^expected.?returns$/i, /^returns$/i, /^roi$/i, /^expected.?roi$/i],
      investmentHorizon: [/^investment.?horizon$/i, /^horizon$/i, /^years$/i, /^duration$/i],
      applicationDeadline: [/^application.?deadline$/i, /^deadline$/i, /^due.?date$/i, /^closing.?date$/i]
    };
  }

  private calculateMatchScore(columnName: string, patterns: RegExp[]): number {
    let score = 0;
    const lowerColumn = columnName.toLowerCase();

    patterns.forEach(pattern => {
      if (pattern.test(columnName)) {
        score += 10; // Exact pattern match
      } else {
        // Check for partial matches (word boundaries)
        const patternSource = pattern.source.toLowerCase();
        const words = patternSource
          .replace(/[\^\$\(\)\[\]\{\}\*\+\?\|\\\.\!]/g, '')
          .split(/[\s\.\?]+/)
          .filter(w => w.length > 2);

        words.forEach(word => {
          if (lowerColumn.includes(word)) {
            score += 2; // Partial word match
          }
        });
      }
    });

    return score;
  }
}