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
       console.log(extractedText);
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

// Enhanced PDF extraction with Gemini AI as primary method
private async extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF extraction for:', file.name, 'Size:', file.size);
    
    // Method 1: Try Gemini AI first (most reliable for all PDF types)
    try {
      const text = await this.extractWithGeminiAI(file);
      const cleanText = this.cleanAndValidateText(text);
      if (this.isValidText(cleanText)) {
        console.log('Gemini AI extraction successful, length:', cleanText.length);
        return cleanText;
      }
    } catch (error) {
      console.warn('Gemini AI extraction failed:', error);
    }
    
    // Method 2: Fallback to PDF.js for simple text PDFs
    try {
      const text = await this.extractWithPDFJS(file);
      const cleanText = this.cleanAndValidateText(text);
      if (this.isValidText(cleanText)) {
        console.log('PDF.js extraction successful, length:', cleanText.length);
        return cleanText;
      }
    } catch (error) {
      console.warn('PDF.js extraction failed:', error);
    }
    
    throw new Error('Unable to extract readable text. This PDF may be image-based, corrupted, or unsupported.');
    
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// NEW: Gemini AI PDF extraction method
private async extractWithGeminiAI(file: File): Promise<string> {
  this.emitStatus({
    stage: 'extracting',
    message: 'Using AI to extract text...',
    details: 'Processing PDF with advanced AI vision',
    progress: 20
  });

  try {
    // Convert file to base64
    const base64Data = await this.fileToBase64(file);
    
    // Call your Edge Function that handles Gemini AI
    const { data, error } = await this.supabase.functions.invoke('extract-pdf-text', {
      body: {
        pdfData: base64Data,
        fileName: file.name,
        mimeType: 'application/pdf'
      }
    });

    if (error) {
      throw new Error(`Gemini extraction failed: ${error.message}`);
    }

    if (!data?.success || !data?.extractedText) {
      throw new Error('No text extracted by Gemini AI');
    }

    return data.extractedText;

  } catch (error) {
    console.error('Gemini AI extraction failed:', error);
    throw error;
  }
}

private async fileToBase64(file: File): Promise<string> {
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

// Keep existing PDF.js method as fallback with version fix
private async extractWithPDFJS(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Fix version mismatch by using same version as library
  try {
    if (pdfjsLib.version) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      console.log('Using PDF.js version:', pdfjsLib.version);
    } else {
      // Fallback - disable worker entirely for compatibility
      // pdfjsLib.GlobalWorkerOptions.workerSrc = null;
      console.log('Using PDF.js without worker');
    }
  } catch (e) {
    console.warn('Could not set PDF.js worker:', e);
    // pdfjsLib.GlobalWorkerOptions.workerSrc = null;
  }

  const arrayBuffer = await file.arrayBuffer();
  
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    verbosity: 0,
    disableFontFace: true,
    disableRange: true,
    disableStream: true,
  }).promise;

  let fullText = '';
  const maxPages = Math.min(pdf.numPages, 50);

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item: any) => {
          return item.str && 
                 typeof item.str === 'string' && 
                 item.str.trim().length > 0 &&
                 /[a-zA-Z0-9\s.,!?;:'"()-]/.test(item.str);
        })
        .map((item: any) => item.str.trim())
        .filter(str => str.length > 0)
        .join(' ');

      if (pageText && pageText.length > 10) {
        fullText += pageText + '\n\n';
        
        if (fullText.length > 50000) {
          console.log('Stopping extraction - sufficient content extracted');
          break;
        }
      }
    } catch (pageError) {
      console.warn(`Failed to extract page ${pageNum}:`, pageError);
      continue;
    }
  }

  return fullText;
}
 

private async extractWithFormData(file: File): Promise<string> {
  // This method sends the PDF to a text extraction service
  // You'll need to implement this if you have access to OCR services
  // For now, return empty to skip this method
  return '';
}

private cleanAndValidateText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove non-printable characters but keep basic punctuation
    .replace(/[^\x20-\x7E\n\r\t]/g, '')
    // Remove obvious binary/encoded patterns
    .replace(/[A-Za-z0-9+/]{20,}={0,2}/g, '') // Base64-like patterns
    .replace(/\\[xuU][0-9a-fA-F]{2,8}/g, '') // Unicode escape sequences
    .replace(/[{}[\]()<>]/g, ' ') // PDF markup
    // Clean up multiple spaces and newlines
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

private isValidText(text: string): boolean {
  if (!text || text.length < 100) {
    return false;
  }

  // Check for minimum readable content
  const alphaNumeric = text.replace(/[^a-zA-Z0-9]/g, '');
  const alphaNumericRatio = alphaNumeric.length / text.length;
  
  // Should be at least 40% alphanumeric for readable text
  if (alphaNumericRatio < 0.4) {
    console.log('Text validation failed: insufficient alphanumeric content');
    return false;
  }

  // Check for common English words (basic validation)
  const commonWords = ['the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at'];
  const lowerText = text.toLowerCase();
  const foundWords = commonWords.filter(word => lowerText.includes(word)).length;
  
  if (foundWords < 3) {
    console.log('Text validation failed: insufficient common words');
    return false;
  }

  return true;
}

// Update the validation before sending to Edge Function
private async callAnalysisEdgeFunction(
  content: string, 
  fileName: string
): Promise<Omit<DocumentAnalysisResult, 'processingTimeMs' | 'generatedAt'>> {

  // Enhanced validation
  if (!content || content.trim().length < 100) {
    throw new Error('PDF extraction failed - no readable content found. The document may be image-based or corrupted.');
  }

  // Check for binary content indicators
  const binaryIndicators = [
    /[^\x20-\x7E\n\r\t]/g, // Non-printable characters
    /[A-Za-z0-9+/]{50,}={0,2}/g, // Long base64-like strings
    /\0/g, // Null bytes
  ];

  for (const indicator of binaryIndicators) {
    const matches = content.match(indicator);
    if (matches && matches.length > content.length * 0.1) {
      throw new Error('Document contains too much binary data. Please ensure the PDF contains selectable text.');
    }
  }

  // Reasonable size limit (adjust as needed)
  const MAX_CHARS = 75000; // Leave room for API overhead
  if (content.length > MAX_CHARS) {
    console.log(`Content too long (${content.length} chars), truncating to ${MAX_CHARS}`);
    content = content.substring(0, MAX_CHARS) + '\n\n[Content truncated due to length...]';
  }

  console.log('Sending to analysis:', {
    contentLength: content.length,
    fileName,
    preview: content.substring(0, 200) + '...'
  });

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
      .select('result_data, created_at')  // ✅ FIXED: use result_data, not analysis_result
      .eq('content_hash', contentHash)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data.result_data;  // ✅ FIXED: use result_data
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
      .select('confidence_score, processing_time_ms, result_data')  // ✅ FIXED: use result_data
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
      .map(item => item.result_data?.marketIntelligence?.sector)  // ✅ FIXED: use result_data
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