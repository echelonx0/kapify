// src/app/ai/services/funder-document-analysis.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

export interface ProcessingStatus {
  stage: 'uploading' | 'extracting' | 'market_research' | 'ai_analysis' | 'completed' | 'error';
  message: string;
  details?: string;
  progress?: number;
  isError?: boolean;
}

export interface DocumentAnalysisResult {
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
  keyInsights: string[];
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
  providedIn: 'root'
})
export class FunderDocumentAnalysisService {
  private supabase = inject(SharedSupabaseService);
  
  // Status tracking
  private processingStatusSubject = new BehaviorSubject<ProcessingStatus | null>(null);
  processingStatus$ = this.processingStatusSubject.asObservable();

  /**
   * Analyze uploaded document with AI and market intelligence
   */
  analyzeDocument(file: File): Observable<DocumentAnalysisResult> {
    return from(this.performAnalysis(file)).pipe(
      tap(result => {
        this.emitStatus({
          stage: 'completed',
          message: 'Analysis completed successfully',
          details: `Generated insights with ${result.confidence}% confidence`
        });
      }),
      catchError(error => {
        this.emitStatus({
          stage: 'error',
          message: 'Analysis failed',
          details: error.message,
          isError: true
        });
        return throwError(() => error);
      })
    );
  }

  private async performAnalysis(file: File): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Upload and extract text
      this.emitStatus({
        stage: 'uploading',
        message: 'Processing document...',
        details: 'Reading PDF content',
        progress: 10
      });

      const extractedText = await this.extractTextFromPDF(file);
      
      this.emitStatus({
        stage: 'extracting',
        message: 'Content extracted successfully',
        details: `Extracted ${extractedText.length} characters`,
        progress: 30
      });

      // Step 2: Analyze with AI including market intelligence
      this.emitStatus({
        stage: 'market_research',
        message: 'Gathering market intelligence...',
        details: 'Searching for real-time market data',
        progress: 50
      });

      console.log(extractedText.length);
// In your Angular service, add this check before calling Edge Function
if (!extractedText || extractedText.trim().length < 100) {
  throw new Error('PDF extraction failed - no readable content found');
}

if (extractedText.length > 100000) {
  const charCount = extractedText.length.toLocaleString();
  throw new Error(`Document too large: ${charCount} characters (limit: 100,000). Please use a shorter document.`);
}
      const analysisResult = await this.callAnalysisEdgeFunction(extractedText, file.name);
      
      this.emitStatus({
        stage: 'ai_analysis',
        message: 'Generating AI insights...',
        details: 'Analyzing competitive positioning and risks',
        progress: 80
      });

      // Add processing metadata
      const processingTime = Date.now() - startTime;
      const result: DocumentAnalysisResult = {
        ...analysisResult,
        processingTimeMs: processingTime,
        generatedAt: new Date().toISOString()
      };

      // Store analysis for audit trail
      await this.storeAnalysisResult(file.name, extractedText, result);

      return result;

    } catch (error) {
      console.error('Document analysis failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Analysis failed');
    }
  }

  // Enhanced PDF extraction method for your service
// Replace the extractTextFromPDF and related methods in your service with this:

private async extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF extraction for:', file.name);
    
    // Method 1: Try modern PDF.js with proper version handling
    try {
      const text = await this.extractWithVersionSafePDFJS(file);
      if (text && text.trim().length > 50) {
        console.log('PDF.js extraction successful');
        return text;
      }
    } catch (versionError) {
      console.warn('Version-safe PDF.js failed:', versionError);
    }
    
    // Method 2: Try legacy approach
    try {
      const text = await this.extractWithLegacyPDFJS(file);
      if (text && text.trim().length > 50) {
        console.log('Legacy PDF.js extraction successful');
        return text;
      }
    } catch (legacyError) {
      console.warn('Legacy PDF.js failed:', legacyError);
    }
    
    // Method 3: Try FileReader fallback
    try {
      const fallbackText = await this.extractWithFileReader(file);
      if (fallbackText && fallbackText.trim().length > 50) {
        console.log('FileReader extraction successful');
        return fallbackText;
      }
    } catch (fallbackError) {
      console.warn('FileReader extraction failed:', fallbackError);
    }
    
    throw new Error('Unable to extract meaningful text from PDF');
    
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

private async extractWithVersionSafePDFJS(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load pdf.js dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Try to get the actual version
      let workerSrc: string;
      
      if (pdfjsLib.version) {
        // Use the exact version from the library
        workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      } else {
        // Fallback to a known working version
        workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      
      console.log('Using PDF.js version:', pdfjsLib.version || 'unknown');
      console.log('Worker source:', workerSrc);
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Load the PDF document with error handling
          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0, // Reduce console noise
            // Add these options for better compatibility
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.11.174'}/cmaps/`,
            cMapPacked: true,
          });
          
          const pdf = await loadingTask.promise;
          let fullText = '';
          
          // Extract text from each page
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              
              // Combine text items into readable format
              const pageText = textContent.items
                .filter((item: any) => item.str && typeof item.str === 'string')
                .map((item: any) => item.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              if (pageText) {
                fullText += pageText + '\n\n';
              }
            } catch (pageError) {
              console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
              // Continue with other pages
            }
          }
          
          resolve(fullText.trim());
        } catch (error) {
          console.error('PDF.js processing error:', error);
          reject(error);
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      reject(error);
    }
  });
}

private async extractWithLegacyPDFJS(file: File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Import without setting worker first
      const pdfjsLib = await import('pdfjs-dist');
      
      // Use the built-in worker if available
      if ('getDocument' in pdfjsLib) {
        const arrayBuffer = await file.arrayBuffer();
        
        // Try without setting worker source (use default)
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          verbosity: 0,
        }).promise;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
              .filter((item: any) => item.str)
              .map((item: any) => item.str)
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            fullText += pageText + '\n\n';
          } catch (pageError) {
            console.warn(`Legacy: Failed to extract text from page ${pageNum}:`, pageError);
          }
        }
        
        resolve(fullText.trim());
      } else {
        reject(new Error('PDF.js not properly loaded'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

private async extractWithFileReader(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        
        // Try to extract text using regex patterns
        let extractedText = '';
        
        // Pattern 1: Look for text between stream/endstream
        const streamMatches = result.match(/stream\s*(.*?)\s*endstream/gs);
        if (streamMatches) {
          streamMatches.forEach(match => {
            const content = match
              .replace(/stream|endstream/g, '')
              .replace(/BT|ET|Td|TJ|Tj|'|"/g, ' ')
              .replace(/\[|\]|\(|\)/g, ' ')
              .replace(/[0-9]+\s+[0-9]+\s+R/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (content.length > 10) {
              extractedText += content + ' ';
            }
          });
        }
        
        // Pattern 2: Look for parentheses content (often contains text)
        const textMatches = result.match(/\((.*?)\)/g);
        if (textMatches) {
          textMatches.forEach(match => {
            const content = match
              .replace(/^\(|\)$/g, '')
              .replace(/\\[nr]/g, ' ')
              .trim();
            
            if (content.length > 2 && /[a-zA-Z]/.test(content)) {
              extractedText += content + ' ';
            }
          });
        }
        
        const cleanedText = extractedText
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedText.length > 20) {
          resolve(cleanedText);
        } else {
          reject(new Error('No readable text found in PDF using fallback method'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = () => {
      reject(new Error('Failed to read PDF file with FileReader'));
    };
    
    fileReader.readAsText(file, 'utf-8');
  });
}

 

 

  private async callAnalysisEdgeFunction(
    content: string, 
    fileName: string
  ): Promise<Omit<DocumentAnalysisResult, 'processingTimeMs' | 'generatedAt'>> {

    
    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-document', {
        body: {
          content,
          fileName,
          analysisType: 'investment_analysis',
          includeMarketIntelligence: true,
          analysisMode: 'document_upload'
        }
      });

      if (error) {
        throw new Error(`Analysis service error: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Analysis failed without specific error');
      }

      // Validate response structure
      this.validateAnalysisResult(data.result);

      return data.result;

    } catch (error) {
      console.error('Edge function call failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('AI service temporarily unavailable. Please try again in a few minutes.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Analysis timed out. Please try with a shorter document.');
        }
        throw error;
      }
      
      throw new Error('AI analysis service is currently unavailable');
    }
  }

  private validateAnalysisResult(result: any): void {
    const requiredFields = [
      'matchScore',
      'successProbability', 
      'competitivePositioning',
      'strengths',
      'improvementAreas',
      'keyInsights',
      'recommendations'
    ];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Invalid analysis result: missing ${field}`);
      }
    }

    // Validate score ranges
    if (result.matchScore < 0 || result.matchScore > 100) {
      throw new Error('Invalid match score in analysis result');
    }

    if (result.successProbability < 0 || result.successProbability > 100) {
      throw new Error('Invalid success probability in analysis result');
    }

    // Validate arrays
    const arrayFields = ['strengths', 'improvementAreas', 'keyInsights', 'recommendations'];
    for (const field of arrayFields) {
      if (!Array.isArray(result[field])) {
        throw new Error(`Invalid analysis result: ${field} must be an array`);
      }
    }
  }

  private async storeAnalysisResult(
    fileName: string, 
    content: string, 
    result: DocumentAnalysisResult
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('document_analysis_results')
        .insert({
          file_name: fileName,
          content_hash: await this.generateContentHash(content),
          analysis_type: 'investment_analysis',
          result_data: result,
          confidence_score: result.confidence,
          processing_time_ms: result.processingTimeMs,
          sources: result.sources || [],
          search_queries: result.searchQueries || [],
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to store analysis result:', error);
        // Don't throw - storage failure shouldn't break the analysis
      }
    } catch (error) {
      console.warn('Failed to store analysis result:', error);
    }
  }

  private async generateContentHash(content: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to simple hash
      return `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private emitStatus(status: ProcessingStatus): void {
    this.processingStatusSubject.next(status);
  }

  /**
   * Clear processing status
   */
  clearStatus(): void {
    this.processingStatusSubject.next(null);
  }

  /**
   * Get cached analysis results for a document
   */
  getCachedAnalysis(contentHash: string): Observable<DocumentAnalysisResult | null> {
    return from(this.fetchCachedAnalysis(contentHash));
  }

  private async fetchCachedAnalysis(contentHash: string): Promise<DocumentAnalysisResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('document_analysis_results')
        .select('result_data, created_at')
        .eq('content_hash', contentHash)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.result_data;
    } catch {
      return null;
    }
  }

  /**
   * Get analysis statistics for admin dashboard
   */
  getAnalysisStats(): Observable<{
    totalAnalyses: number;
    averageConfidence: number;
    averageProcessingTime: number;
    topIndustries: Array<{ industry: string; count: number }>;
  }> {
    return from(this.fetchAnalysisStats());
  }

  private async fetchAnalysisStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('document_analysis_results')
        .select('confidence_score, processing_time_ms, result_data')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error || !data) {
        throw error;
      }

      // Calculate statistics
      const totalAnalyses = data.length;
      const averageConfidence = data.reduce((sum, item) => sum + (item.confidence_score || 0), 0) / totalAnalyses;
      const averageProcessingTime = data.reduce((sum, item) => sum + (item.processing_time_ms || 0), 0) / totalAnalyses;

      // Extract industries from market intelligence
      const industries = data
        .map(item => item.result_data?.marketIntelligence?.sector)
        .filter(Boolean);
      
      const industryCount = industries.reduce((acc: Record<string, number>, industry) => {
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});

      const topIndustries = Object.entries(industryCount)
        .map(([industry, count]) => ({ industry, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalAnalyses,
        averageConfidence: Math.round(averageConfidence),
        averageProcessingTime: Math.round(averageProcessingTime),
        topIndustries
      };
    } catch (error) {
      console.error('Failed to fetch analysis stats:', error);
      throw error;
    }
  }
}