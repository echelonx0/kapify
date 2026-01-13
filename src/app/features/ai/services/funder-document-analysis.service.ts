// // // src/app/ai/services/funder-document-analysis.service.ts
// // import { Injectable, inject, signal } from '@angular/core';
// // import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
// // import { tap, catchError } from 'rxjs/operators';
// // import { AuthService } from 'src/app/auth/services/production.auth.service';
// // import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// // export interface ProcessingStatus {
// //   stage:
// //     | 'uploading'
// //     | 'extracting'
// //     | 'market_research'
// //     | 'ai_analysis'
// //     | 'completed'
// //     | 'error';
// //   message: string;
// //   details?: string;
// //   progress?: number;
// //   isError?: boolean;
// // }

// // export interface DocumentAnalysisResult {
// //   matchScore: number;
// //   successProbability: number;
// //   competitivePositioning: 'strong' | 'moderate' | 'weak';
// //   marketTimingInsight: 'favorable' | 'neutral' | 'challenging';
// //   hiddenGemIndicators: string[];
// //   contrarianSignals: string[];
// //   strengths: string[];
// //   improvementAreas: string[];
// //   riskFactors: Array<{
// //     factor: string;
// //     severity: 'low' | 'medium' | 'high';
// //     impact: string;
// //   }>;
// //   marketIntelligence: {
// //     sector: string;
// //     trends: string[];
// //     competitorActivity: string[];
// //     timingInsights: string[];
// //     fundingTrends: {
// //       averageRoundSize: number;
// //       totalFunding: number;
// //       dealCount: number;
// //       valuationTrend: 'up' | 'down' | 'stable';
// //     };
// //     riskFactors: Array<{
// //       factor: string;
// //       severity: 'low' | 'medium' | 'high';
// //       impact: string;
// //     }>;
// //     opportunities: Array<{
// //       opportunity: string;
// //       rationale: string;
// //       timeframe: string;
// //     }>;
// //   };
// //   // keyInsights: string[];
// //   keyInsights: Array<{
// //     title: string;
// //     executiveSummary: string;
// //     coreInsight: string;
// //     supportingEvidence: string[];
// //     contrarianAngle: string;
// //     implications: {
// //       upside: string;
// //       downside: string;
// //       executionRisks: string;
// //     };
// //     reasoningChain: Array<{
// //       step: number;
// //       reasoning: string;
// //       evidenceReference?: string;
// //     }>;
// //     investorTakeaway: string;
// //   }>;

// //   recommendations: string[];
// //   sources: Array<{
// //     type: string;
// //     title: string;
// //     url?: string;
// //     relevance: string;
// //   }>;
// //   searchQueries: string[];
// //   confidence: number;
// //   generatedAt: string;
// //   processingTimeMs: number;
// // }

// // @Injectable({
// //   providedIn: 'root',
// // })
// // export class FunderDocumentAnalysisService {
// //   private supabase = inject(SharedSupabaseService);
// //   private authService = inject(AuthService);

// //   private processingStatusSubject =
// //     new BehaviorSubject<ProcessingStatus | null>(null);
// //   processingStatus$ = this.processingStatusSubject.asObservable();
// //   private currentAnalysisResult = signal<DocumentAnalysisResult | null>(null);

// //   setCurrentAnalysisResult(result: DocumentAnalysisResult) {
// //     this.currentAnalysisResult.set(result);
// //   }

// //   getCurrentAnalysisResult(): DocumentAnalysisResult | null {
// //     return this.currentAnalysisResult();
// //   }

// //   clearCurrentAnalysisResult() {
// //     this.currentAnalysisResult.set(null);
// //   }
// //   /**
// //    * Analyze uploaded PDF document
// //    */
// //   analyzeDocument(file: File): Observable<DocumentAnalysisResult> {
// //     return from(this.performAnalysis(file)).pipe(
// //       tap((result) => {
// //         this.emitStatus({
// //           stage: 'completed',
// //           message: 'Analysis completed successfully',
// //           details: `Generated insights with ${result.confidence}% confidence`,
// //         });
// //       }),
// //       catchError((error) => {
// //         this.emitStatus({
// //           stage: 'error',
// //           message: 'Analysis failed',
// //           details: error.message,
// //           isError: true,
// //         });
// //         return throwError(() => error);
// //       })
// //     );
// //   }

// //   private async performAnalysis(file: File): Promise<DocumentAnalysisResult> {
// //     const startTime = Date.now();

// //     try {
// //       // Step 1: Validate file
// //       this.emitStatus({
// //         stage: 'uploading',
// //         message: 'Validating document...',
// //         details: 'Checking file format and size',
// //         progress: 5,
// //       });

// //       if (!file.type.includes('pdf')) {
// //         throw new Error('Please upload a PDF file');
// //       }

// //       if (file.size > 50 * 1024 * 1024) {
// //         throw new Error('File size must be less than 50MB');
// //       }

// //       // Step 2: Convert PDF to base64
// //       this.emitStatus({
// //         stage: 'extracting',
// //         message: 'Preparing document...',
// //         details: `Converting ${(file.size / 1024 / 1024).toFixed(2)}MB PDF`,
// //         progress: 15,
// //       });

// //       const base64Pdf = await this.fileToBase64(file);

// //       // Step 3: Send to Edge Function (extraction + analysis happens server-side)
// //       this.emitStatus({
// //         stage: 'extracting',
// //         message: 'Extracting and analyzing...',
// //         details: 'Processing with AI',
// //         progress: 30,
// //       });

// //       const analysisResult = await this.callAnalysisFunction(
// //         base64Pdf,
// //         file.name
// //       );

// //       this.emitStatus({
// //         stage: 'ai_analysis',
// //         message: 'Investment analysis complete',
// //         progress: 95,
// //       });

// //       // Add metadata
// //       const processingTime = Date.now() - startTime;
// //       const result: DocumentAnalysisResult = {
// //         ...analysisResult,
// //         processingTimeMs: processingTime,
// //         generatedAt: new Date().toISOString(),
// //       };

// //       return result;
// //     } catch (error) {
// //       console.error('Document analysis failed:', error);
// //       throw new Error(
// //         error instanceof Error ? error.message : 'Analysis failed'
// //       );
// //     }
// //   }

// //   /**
// //    * Convert file to base64
// //    */
// //   private fileToBase64(file: File): Promise<string> {
// //     return new Promise((resolve, reject) => {
// //       const reader = new FileReader();
// //       reader.onload = () => {
// //         const base64 = (reader.result as string).split(',')[1];
// //         resolve(base64);
// //       };
// //       reader.onerror = () => reject(new Error('Failed to read file'));
// //       reader.readAsDataURL(file);
// //     });
// //   }

// //   private async callAnalysisFunction(
// //     base64Pdf: string,
// //     fileName: string
// //   ): Promise<Omit<DocumentAnalysisResult, 'processingTimeMs' | 'generatedAt'>> {
// //     console.log('Sending PDF to analysis function...');

// //     try {
// //       const orgId = this.authService.getCurrentUserOrganizationId();

// //       if (!orgId) {
// //         throw new Error('Organization ID not found');
// //       }

// //       const { data, error } = await this.supabase.functions.invoke(
// //         'analyse-investment-proposal',
// //         {
// //           body: {
// //             pdfData: base64Pdf,
// //             fileName,
// //             orgId,
// //             includeMarketIntelligence: true,
// //           },
// //         }
// //       );

// //       if (error) {
// //         console.error('Supabase function error:', error);
// //         throw new Error(`Analysis service error: ${error.message}`);
// //       }

// //       if (!data) {
// //         throw new Error('No response from analysis service');
// //       }

// //       if (!data.success) {
// //         const errorMsg = data.error || 'Analysis failed without specific error';
// //         console.error('Analysis failed:', errorMsg);
// //         throw new Error(errorMsg);
// //       }

// //       // Validate result
// //       this.validateAnalysisResult(data.result);

// //       return data.result;
// //     } catch (error) {
// //       console.error('Analysis function error:', error);

// //       if (error instanceof Error) {
// //         // Better error categorization
// //         if (error.message.includes('429')) {
// //           throw new Error(
// //             'API quota exceeded. Please try again in a few moments.'
// //           );
// //         }
// //         if (error.message.includes('timeout')) {
// //           throw new Error('Analysis timed out. Please try a shorter document.');
// //         }
// //         if (
// //           error.message.includes('API key') ||
// //           error.message.includes('401') ||
// //           error.message.includes('403')
// //         ) {
// //           throw new Error('Claude API configuration error. Contact support.');
// //         }
// //         if (error.message.includes('404')) {
// //           throw new Error('Claude API endpoint error. Contact support.');
// //         }
// //         // Pass through other errors
// //         throw error;
// //       }

// //       throw new Error('Analysis failed unexpectedly');
// //     }
// //   }
// //   /**
// //    * Validate analysis result and ensure all required fields exist
// //    */
// //   private validateAnalysisResult(result: unknown): void {
// //     const analysis = result as Record<string, unknown>;

// //     // Set defaults for any missing fields
// //     if (!('matchScore' in analysis))
// //       (analysis as Record<string, unknown>)['matchScore'] = 50;
// //     if (!('successProbability' in analysis))
// //       (analysis as Record<string, unknown>)['successProbability'] = 50;
// //     if (!('competitivePositioning' in analysis))
// //       (analysis as Record<string, unknown>)['competitivePositioning'] =
// //         'moderate';
// //     if (!('marketTimingInsight' in analysis))
// //       (analysis as Record<string, unknown>)['marketTimingInsight'] = 'neutral';
// //     if (!('hiddenGemIndicators' in analysis))
// //       (analysis as Record<string, unknown>)['hiddenGemIndicators'] = [];
// //     if (!('contrarianSignals' in analysis))
// //       (analysis as Record<string, unknown>)['contrarianSignals'] = [];
// //     if (!('strengths' in analysis))
// //       (analysis as Record<string, unknown>)['strengths'] = [];
// //     if (!('improvementAreas' in analysis))
// //       (analysis as Record<string, unknown>)['improvementAreas'] = [];
// //     if (!('riskFactors' in analysis))
// //       (analysis as Record<string, unknown>)['riskFactors'] = [];
// //     if (!('marketIntelligence' in analysis)) {
// //       (analysis as Record<string, unknown>)['marketIntelligence'] = {
// //         sector: 'Unknown',
// //         trends: [],
// //         competitorActivity: [],
// //         timingInsights: [],
// //         fundingTrends: {
// //           averageRoundSize: 0,
// //           totalFunding: 0,
// //           dealCount: 0,
// //           valuationTrend: 'stable',
// //         },
// //         riskFactors: [],
// //         opportunities: [],
// //       };
// //     }
// //     if (!('keyInsights' in analysis))
// //       (analysis as Record<string, unknown>)['keyInsights'] = [];
// //     if (!('recommendations' in analysis))
// //       (analysis as Record<string, unknown>)['recommendations'] = [];
// //     if (!('sources' in analysis))
// //       (analysis as Record<string, unknown>)['sources'] = [];
// //     if (!('searchQueries' in analysis))
// //       (analysis as Record<string, unknown>)['searchQueries'] = [];
// //     if (!('confidence' in analysis))
// //       (analysis as Record<string, unknown>)['confidence'] = 60;
// //   }

// //   private emitStatus(status: ProcessingStatus): void {
// //     this.processingStatusSubject.next(status);
// //   }

// //   clearStatus(): void {
// //     this.processingStatusSubject.next(null);
// //   }
// // }

// import { Injectable, inject, signal } from '@angular/core';
// import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
// import { tap, catchError } from 'rxjs/operators';
// import { AuthService } from 'src/app/auth/services/production.auth.service';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// export interface ProcessingStatus {
//   stage:
//     | 'uploading'
//     | 'extracting'
//     | 'market_research'
//     | 'ai_analysis'
//     | 'completed'
//     | 'error';
//   message: string;
//   details?: string;
//   progress?: number;
//   isError?: boolean;
// }

// export interface NextStep {
//   step: string;
//   rationale: string;
//   timeframe?: string;
// }

// export interface DocumentAnalysisResult {
//   matchScore: number;
//   successProbability: number;
//   competitivePositioning: 'strong' | 'moderate' | 'weak';
//   marketTimingInsight: 'favorable' | 'neutral' | 'challenging';
//   hiddenGemIndicators: string[];
//   contrarianSignals: string[];
//   strengths: string[];
//   improvementAreas: string[];
//   riskFactors: Array<{
//     factor: string;
//     severity: 'low' | 'medium' | 'high';
//     impact: string;
//   }>;
//   marketIntelligence: {
//     sector: string;
//     trends: string[];
//     competitorActivity: string[];
//     timingInsights: string[];
//     fundingTrends: {
//       averageRoundSize: number;
//       totalFunding: number;
//       dealCount: number;
//       valuationTrend: 'up' | 'down' | 'stable';
//     };
//     riskFactors: Array<{
//       factor: string;
//       severity: 'low' | 'medium' | 'high';
//       impact: string;
//     }>;
//     opportunities: Array<{
//       opportunity: string;
//       rationale: string;
//       timeframe: string;
//     }>;
//   };
//   keyInsights: Array<{
//     title: string;
//     executiveSummary: string;
//     coreInsight: string;
//     supportingEvidence: string[];
//     contrarianAngle: string;
//     implications: {
//       upside: string;
//       downside: string;
//       executionRisks: string;
//     };
//     reasoningChain: Array<{
//       step: number;
//       reasoning: string;
//       evidenceReference?: string;
//     }>;
//     investorTakeaway: string;
//   }>;
//   conclusion: string;
//   nextSteps: NextStep[];
//   recommendations: string[];
//   sources: Array<{
//     type: string;
//     title: string;
//     url?: string;
//     relevance: string;
//   }>;
//   searchQueries: string[];
//   confidence: number;
//   generatedAt: string;
//   processingTimeMs: number;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class FunderDocumentAnalysisService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);

//   private processingStatusSubject =
//     new BehaviorSubject<ProcessingStatus | null>(null);
//   processingStatus$ = this.processingStatusSubject.asObservable();
//   private currentAnalysisResult = signal<DocumentAnalysisResult | null>(null);

//   setCurrentAnalysisResult(result: DocumentAnalysisResult) {
//     this.currentAnalysisResult.set(result);
//   }

//   getCurrentAnalysisResult(): DocumentAnalysisResult | null {
//     return this.currentAnalysisResult();
//   }

//   clearCurrentAnalysisResult() {
//     this.currentAnalysisResult.set(null);
//   }

//   /**
//    * Analyze uploaded PDF document
//    */
//   analyzeDocument(
//     file: File,
//     companyName: string
//   ): Observable<DocumentAnalysisResult> {
//     return from(this.performAnalysis(file, companyName)).pipe(
//       tap((result) => {
//         this.emitStatus({
//           stage: 'completed',
//           message: 'Analysis completed successfully',
//           details: `Generated insights with ${result.confidence}% confidence`,
//         });
//       }),
//       catchError((error) => {
//         this.emitStatus({
//           stage: 'error',
//           message: 'Analysis failed',
//           details: error.message,
//           isError: true,
//         });
//         return throwError(() => error);
//       })
//     );
//   }

//   private async performAnalysis(
//     file: File,
//     companyName: string
//   ): Promise<DocumentAnalysisResult> {
//     const startTime = Date.now();

//     try {
//       // Step 1: Validate file
//       this.emitStatus({
//         stage: 'uploading',
//         message: 'Validating document...',
//         details: 'Checking file format and size',
//         progress: 5,
//       });

//       if (!file.type.includes('pdf')) {
//         throw new Error('Please upload a PDF file');
//       }

//       if (file.size > 50 * 1024 * 1024) {
//         throw new Error('File size must be less than 50MB');
//       }

//       // Step 2: Convert PDF to base64
//       this.emitStatus({
//         stage: 'extracting',
//         message: 'Preparing document...',
//         details: `Converting ${(file.size / 1024 / 1024).toFixed(2)}MB PDF`,
//         progress: 15,
//       });

//       const base64Pdf = await this.fileToBase64(file);

//       // Step 3: Send to Edge Function (extraction + analysis happens server-side)
//       this.emitStatus({
//         stage: 'extracting',
//         message: 'Extracting and analyzing...',
//         details: 'Processing with AI',
//         progress: 30,
//       });

//       const analysisResult = await this.callAnalysisFunction(
//         base64Pdf,
//         file.name,
//         companyName
//       );

//       this.emitStatus({
//         stage: 'ai_analysis',
//         message: 'Investment analysis complete',
//         progress: 95,
//       });

//       // Add metadata
//       const processingTime = Date.now() - startTime;
//       const result: DocumentAnalysisResult = {
//         ...analysisResult,
//         processingTimeMs: processingTime,
//         generatedAt: new Date().toISOString(),
//       };

//       return result;
//     } catch (error) {
//       console.error('Document analysis failed:', error);
//       throw new Error(
//         error instanceof Error ? error.message : 'Analysis failed'
//       );
//     }
//   }

//   /**
//    * Convert file to base64
//    */
//   private fileToBase64(file: File): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         const base64 = (reader.result as string).split(',')[1];
//         resolve(base64);
//       };
//       reader.onerror = () => reject(new Error('Failed to read file'));
//       reader.readAsDataURL(file);
//     });
//   }

//   private async callAnalysisFunction(
//     base64Pdf: string,
//     fileName: string,
//     companyName: string
//   ): Promise<Omit<DocumentAnalysisResult, 'processingTimeMs' | 'generatedAt'>> {
//     console.log('Sending PDF to analysis function...');

//     try {
//       const orgId = this.authService.getCurrentUserOrganizationId();

//       if (!orgId) {
//         throw new Error('Organization ID not found');
//       }

//       const { data, error } = await this.supabase.functions.invoke(
//         //'analyse-investment-proposal',
//         'analyze-document',
//         {
//           body: {
//             pdfData: base64Pdf,
//             fileName,
//             companyName,
//             orgId,
//             includeMarketIntelligence: true,
//           },
//         }
//       );

//       if (error) {
//         console.error('Supabase function error:', error);
//         throw new Error(`Analysis service error: ${error.message}`);
//       }

//       if (!data) {
//         throw new Error('No response from analysis service');
//       }

//       if (!data.success) {
//         const errorMsg = data.error || 'Analysis failed without specific error';
//         console.error('Analysis failed:', errorMsg);
//         throw new Error(errorMsg);
//       }

//       // Validate result
//       this.validateAnalysisResult(data.result);

//       return data.result;
//     } catch (error) {
//       console.error('Analysis function error:', error);

//       if (error instanceof Error) {
//         // Better error categorization
//         if (error.message.includes('429')) {
//           throw new Error(
//             'API quota exceeded. Please try again in a few moments.'
//           );
//         }
//         if (error.message.includes('timeout')) {
//           throw new Error('Analysis timed out. Please try a shorter document.');
//         }
//         if (
//           error.message.includes('API key') ||
//           error.message.includes('401') ||
//           error.message.includes('403')
//         ) {
//           throw new Error('Claude API configuration error. Contact support.');
//         }
//         if (error.message.includes('404')) {
//           throw new Error('Claude API endpoint error. Contact support.');
//         }
//         // Pass through other errors
//         throw error;
//       }

//       throw new Error('Analysis failed unexpectedly');
//     }
//   }

//   /**
//    * Validate analysis result and ensure all required fields exist
//    */
//   private validateAnalysisResult(result: unknown): void {
//     const analysis = result as Record<string, unknown>;

//     // Set defaults for any missing fields
//     if (!('matchScore' in analysis))
//       (analysis as Record<string, unknown>)['matchScore'] = 50;
//     if (!('successProbability' in analysis))
//       (analysis as Record<string, unknown>)['successProbability'] = 50;
//     if (!('competitivePositioning' in analysis))
//       (analysis as Record<string, unknown>)['competitivePositioning'] =
//         'moderate';
//     if (!('marketTimingInsight' in analysis))
//       (analysis as Record<string, unknown>)['marketTimingInsight'] = 'neutral';
//     if (!('hiddenGemIndicators' in analysis))
//       (analysis as Record<string, unknown>)['hiddenGemIndicators'] = [];
//     if (!('contrarianSignals' in analysis))
//       (analysis as Record<string, unknown>)['contrarianSignals'] = [];
//     if (!('strengths' in analysis))
//       (analysis as Record<string, unknown>)['strengths'] = [];
//     if (!('improvementAreas' in analysis))
//       (analysis as Record<string, unknown>)['improvementAreas'] = [];
//     if (!('riskFactors' in analysis))
//       (analysis as Record<string, unknown>)['riskFactors'] = [];
//     if (!('marketIntelligence' in analysis)) {
//       (analysis as Record<string, unknown>)['marketIntelligence'] = {
//         sector: 'Unknown',
//         trends: [],
//         competitorActivity: [],
//         timingInsights: [],
//         fundingTrends: {
//           averageRoundSize: 0,
//           totalFunding: 0,
//           dealCount: 0,
//           valuationTrend: 'stable',
//         },
//         riskFactors: [],
//         opportunities: [],
//       };
//     }
//     if (!('keyInsights' in analysis))
//       (analysis as Record<string, unknown>)['keyInsights'] = [];
//     if (!('conclusion' in analysis))
//       (analysis as Record<string, unknown>)['conclusion'] = '';
//     if (!('nextSteps' in analysis))
//       (analysis as Record<string, unknown>)['nextSteps'] = [];
//     if (!('recommendations' in analysis))
//       (analysis as Record<string, unknown>)['recommendations'] = [];
//     if (!('sources' in analysis))
//       (analysis as Record<string, unknown>)['sources'] = [];
//     if (!('searchQueries' in analysis))
//       (analysis as Record<string, unknown>)['searchQueries'] = [];
//     if (!('confidence' in analysis))
//       (analysis as Record<string, unknown>)['confidence'] = 60;
//   }

//   private emitStatus(status: ProcessingStatus): void {
//     this.processingStatusSubject.next(status);
//   }

//   clearStatus(): void {
//     this.processingStatusSubject.next(null);
//   }
// }

import { Injectable, inject, signal } from '@angular/core';
import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface ProcessingStatus {
  stage:
    | 'uploading'
    | 'extracting'
    | 'market_research'
    | 'ai_analysis'
    | 'completed'
    | 'error';
  message: string;
  details?: string;
  progress?: number;
  isError?: boolean;
}

export interface NextStep {
  step: string;
  rationale: string;
  timeframe?: string;
}

export interface DocumentAnalysisResult {
  companyName: string; // NEW: Company name for report header
  documentSummary: string; // Half-page objective summary (300-400 words)
  matchScore: number;
  successProbability: number;
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  marketTimingInsight: 'favorable' | 'neutral' | 'challenging';
  hiddenGemIndicators: string[];
  contrarianSignals: string[];
  strengths: string[];
  improvementAreas: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  marketIntelligence: {
    sector: string;
    trends: string[];
    competitorActivity: string[];
    timingInsights: string[];
    fundingTrends: {
      averageRoundSize: number;
      totalFunding: number;
      dealCount: number;
      valuationTrend: 'up' | 'down' | 'stable';
    };
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      impact: string;
    }>;
    opportunities: Array<{
      opportunity: string;
      rationale: string;
      timeframe: string;
    }>;
  };
  keyInsights: Array<{
    title: string;
    executiveSummary: string;
    coreInsight: string;
    supportingEvidence: string[];
    contrarianAngle: string;
    implications: {
      upside: string;
      downside: string;
      executionRisks: string;
    };
    reasoningChain: Array<{
      step: number;
      reasoning: string;
      evidenceReference?: string;
    }>;
    investorTakeaway: string;
  }>;
  conclusion: string; // Comprehensive investment recommendation
  nextSteps: NextStep[];
  recommendations: string[];
  sources: Array<{
    type: string;
    title: string;
    url?: string;
    relevance: string;
  }>;
  searchQueries: string[];
  confidence: number;
  generatedAt: string;
  processingTimeMs: number;
}

@Injectable({
  providedIn: 'root',
})
export class FunderDocumentAnalysisService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  private processingStatusSubject =
    new BehaviorSubject<ProcessingStatus | null>(null);
  processingStatus$ = this.processingStatusSubject.asObservable();
  private currentAnalysisResult = signal<DocumentAnalysisResult | null>(null);

  setCurrentAnalysisResult(result: DocumentAnalysisResult) {
    this.currentAnalysisResult.set(result);
  }

  getCurrentAnalysisResult(): DocumentAnalysisResult | null {
    return this.currentAnalysisResult();
  }

  clearCurrentAnalysisResult() {
    this.currentAnalysisResult.set(null);
  }

  /**
   * Analyze uploaded PDF document
   */
  analyzeDocument(
    file: File,
    companyName: string
  ): Observable<DocumentAnalysisResult> {
    return from(this.performAnalysis(file, companyName)).pipe(
      tap((result) => {
        this.emitStatus({
          stage: 'completed',
          message: 'Analysis completed successfully',
          details: `Generated insights with ${result.confidence}% confidence`,
        });
      }),
      catchError((error) => {
        this.emitStatus({
          stage: 'error',
          message: 'Analysis failed',
          details: error.message,
          isError: true,
        });
        return throwError(() => error);
      })
    );
  }

  private async performAnalysis(
    file: File,
    companyName: string
  ): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Validate file
      this.emitStatus({
        stage: 'uploading',
        message: 'Validating document...',
        details: 'Checking file format and size',
        progress: 5,
      });

      if (!file.type.includes('pdf')) {
        throw new Error('Please upload a PDF file');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size must be less than 50MB');
      }

      // Step 2: Convert PDF to base64
      this.emitStatus({
        stage: 'extracting',
        message: 'Preparing document...',
        details: `Converting ${(file.size / 1024 / 1024).toFixed(2)}MB PDF`,
        progress: 15,
      });

      const base64Pdf = await this.fileToBase64(file);

      // Step 3: Send to Edge Function
      this.emitStatus({
        stage: 'extracting',
        message: 'Extracting and analyzing...',
        details: 'Processing with AI',
        progress: 30,
      });

      const analysisResult = await this.callAnalysisFunction(
        base64Pdf,
        file.name,
        companyName
      );

      this.emitStatus({
        stage: 'ai_analysis',
        message: 'Investment analysis complete',
        progress: 95,
      });

      // Add metadata
      const processingTime = Date.now() - startTime;
      const result: DocumentAnalysisResult = {
        ...analysisResult,
        processingTimeMs: processingTime,
        generatedAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Analysis failed'
      );
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private async callAnalysisFunction(
    base64Pdf: string,
    fileName: string,
    companyName: string
  ): Promise<Omit<DocumentAnalysisResult, 'processingTimeMs' | 'generatedAt'>> {
    console.log('Sending PDF to analysis function...');

    try {
      const orgId = this.authService.getCurrentUserOrganizationId();

      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const { data, error } = await this.supabase.functions.invoke(
        // 'analyze-document',
        'analyse-investment-proposal',
        {
          body: {
            pdfData: base64Pdf,
            fileName,
            companyName,
            orgId,
            includeMarketIntelligence: true,
          },
        }
      );

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Analysis service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response from analysis service');
      }

      if (!data.success) {
        const errorMsg = data.error || 'Analysis failed without specific error';
        console.error('Analysis failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate result
      this.validateAnalysisResult(data.result);

      return data.result;
    } catch (error) {
      console.error('Analysis function error:', error);

      if (error instanceof Error) {
        if (error.message.includes('429')) {
          throw new Error(
            'API quota exceeded. Please try again in a few moments.'
          );
        }
        if (error.message.includes('timeout')) {
          throw new Error('Analysis timed out. Please try a shorter document.');
        }
        if (
          error.message.includes('API key') ||
          error.message.includes('401') ||
          error.message.includes('403')
        ) {
          throw new Error('Claude API configuration error. Contact support.');
        }
        if (error.message.includes('404')) {
          throw new Error('Claude API endpoint error. Contact support.');
        }
        throw error;
      }

      throw new Error('Analysis failed unexpectedly');
    }
  }

  /**
   * Validate analysis result and ensure all required fields exist
   */
  private validateAnalysisResult(result: unknown): void {
    const analysis = result as Record<string, unknown>;

    // Validate companyName
    if (!('companyName' in analysis) || !analysis['companyName']) {
      (analysis as Record<string, unknown>)['companyName'] = 'Unknown Company';
    }

    // Validate documentSummary
    if (!('documentSummary' in analysis)) {
      (analysis as Record<string, unknown>)['documentSummary'] =
        'No document summary available.';
    }

    if (!('matchScore' in analysis))
      (analysis as Record<string, unknown>)['matchScore'] = 50;
    if (!('successProbability' in analysis))
      (analysis as Record<string, unknown>)['successProbability'] = 50;
    if (!('competitivePositioning' in analysis))
      (analysis as Record<string, unknown>)['competitivePositioning'] =
        'moderate';
    if (!('marketTimingInsight' in analysis))
      (analysis as Record<string, unknown>)['marketTimingInsight'] = 'neutral';
    if (!('hiddenGemIndicators' in analysis))
      (analysis as Record<string, unknown>)['hiddenGemIndicators'] = [];
    if (!('contrarianSignals' in analysis))
      (analysis as Record<string, unknown>)['contrarianSignals'] = [];
    if (!('strengths' in analysis))
      (analysis as Record<string, unknown>)['strengths'] = [];
    if (!('improvementAreas' in analysis))
      (analysis as Record<string, unknown>)['improvementAreas'] = [];
    if (!('riskFactors' in analysis))
      (analysis as Record<string, unknown>)['riskFactors'] = [];
    if (!('marketIntelligence' in analysis)) {
      (analysis as Record<string, unknown>)['marketIntelligence'] = {
        sector: 'Unknown',
        trends: [],
        competitorActivity: [],
        timingInsights: [],
        fundingTrends: {
          averageRoundSize: 0,
          totalFunding: 0,
          dealCount: 0,
          valuationTrend: 'stable',
        },
        riskFactors: [],
        opportunities: [],
      };
    }
    if (!('keyInsights' in analysis))
      (analysis as Record<string, unknown>)['keyInsights'] = [];
    if (!('conclusion' in analysis))
      (analysis as Record<string, unknown>)['conclusion'] = '';
    if (!('nextSteps' in analysis))
      (analysis as Record<string, unknown>)['nextSteps'] = [];
    if (!('recommendations' in analysis))
      (analysis as Record<string, unknown>)['recommendations'] = [];
    if (!('sources' in analysis))
      (analysis as Record<string, unknown>)['sources'] = [];
    if (!('searchQueries' in analysis))
      (analysis as Record<string, unknown>)['searchQueries'] = [];
    if (!('confidence' in analysis))
      (analysis as Record<string, unknown>)['confidence'] = 60;

    // CRITICAL: Validate and sanitize sources array
    const sources = analysis['sources'] as any[];
    if (Array.isArray(sources)) {
      analysis['sources'] = sources
        .filter((s) => s && typeof s === 'object')
        .map((s) => ({
          type: s.type || 'document',
          title: s.title || 'Untitled',
          url: s.url || undefined,
          relevance: s.relevance || 'Referenced',
        }));
    }
  }

  private emitStatus(status: ProcessingStatus): void {
    this.processingStatusSubject.next(status);
  }

  clearStatus(): void {
    this.processingStatusSubject.next(null);
  }
}
