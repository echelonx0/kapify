// // supabase/functions/analyze-document/index.ts
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import pdfParse from 'npm:pdf-parse@1.1.1';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers':
//     'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// };

// Deno.serve(async (req) => {
//   const requestId = crypto.randomUUID().slice(0, 8);
//   const startTime = Date.now();

//   console.log(`[${requestId}] === ANALYSIS START ===`);

//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { status: 200, headers: corsHeaders });
//   }

//   try {
//     const supabaseUrl = Deno.env.get('SUPABASE_URL');
//     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
//     const claudeKey = Deno.env.get('CLAUDE_KEY');

//     // ✅ Better environment validation
//     if (!claudeKey || claudeKey.trim() === '') {
//       console.error(`[${requestId}] CLAUDE_KEY not set or empty`);
//       return jsonResponse(
//         { error: 'API configuration error. Contact support.', requestId },
//         500
//       );
//     }

//     if (!claudeKey.startsWith('sk-ant-')) {
//       console.error(`[${requestId}] Invalid CLAUDE_KEY format`);
//       return jsonResponse(
//         { error: 'Invalid API key configuration', requestId },
//         500
//       );
//     }

//     console.log(
//       `[${requestId}] Config - Claude key: ${claudeKey.slice(0, 15)}...`
//     );

//     const supabaseClient = createClient(
//       supabaseUrl ?? '',
//       supabaseAnonKey ?? '',
//       {
//         global: {
//           headers: {
//             Authorization: req.headers.get('Authorization') || '',
//           },
//         },
//       }
//     );

//     // Verify user
//     const {
//       data: { user },
//       error: authError,
//     } = await supabaseClient.auth.getUser();
//     if (authError || !user) {
//       console.error(`[${requestId}] Auth failed`);
//       return jsonResponse({ error: 'Unauthorized', requestId }, 401);
//     }

//     console.log(`[${requestId}] User: ${user.id}`);

//     // === INITIAL REQUEST LOGGING ===
//     const rawBody = await req.text();
//     console.log(`[${requestId}] === REQUEST RECEIVED ===`);
//     console.log(`[${requestId}] Raw body size: ${rawBody.length} bytes`);

//     const requestData = JSON.parse(rawBody);
//     const { pdfData, fileName } = requestData;

//     if (!pdfData) {
//       console.error(`[${requestId}] Missing pdfData in request body`);
//       return jsonResponse({ error: 'PDF data required', requestId }, 400);
//     }

//     const base64Size = pdfData.length;
//     const estimatedBinarySize = Math.round(base64Size * 0.75); // Base64 is ~33% larger
//     const estimatedMB = (estimatedBinarySize / 1024 / 1024).toFixed(2);

//     console.log(`[${requestId}] === FILE METADATA ===`);
//     console.log(`[${requestId}] File name: ${fileName}`);
//     console.log(
//       `[${requestId}] Base64 size: ${base64Size.toLocaleString()} bytes`
//     );
//     console.log(
//       `[${requestId}] Estimated binary size: ${estimatedBinarySize.toLocaleString()} bytes (${estimatedMB}MB)`
//     );
//     console.log(`[${requestId}] Base64 prefix: ${pdfData.substring(0, 50)}...`);
//     console.log(
//       `[${requestId}] Base64 suffix: ...${pdfData.substring(
//         pdfData.length - 50
//       )}`
//     );

//     // Extract text from PDF
//     console.log(`[${requestId}] === EXTRACTION START ===`);
//     const extractionStartTime = Date.now();
//     const extractedText = await extractTextFromPdf(
//       pdfData,
//       fileName,
//       requestId
//     );
//     const extractionTime = Date.now() - extractionStartTime;

//     if (!extractedText || extractedText.trim().length < 50) {
//       console.error(
//         `[${requestId}] Insufficient text extracted: ${
//           extractedText?.length || 0
//         } chars`
//       );
//       return jsonResponse(
//         {
//           error:
//             'No readable text found in PDF. Document may be scanned or corrupted.',
//           requestId,
//           success: false,
//           diagnostics: {
//             extractedCharacters: extractedText?.length || 0,
//             fileName,
//             extractionTimeMs: extractionTime,
//           },
//         },
//         400
//       );
//     }

//     // === EXTRACTION DIAGNOSTICS ===
//     const textLength = extractedText.length;
//     const wordCount = extractedText.split(/\s+/).filter((word) => word).length;
//     const lineCount = extractedText.split('\n').length;
//     const averageWordLength = (textLength / wordCount).toFixed(2);
//     const extractionEfficiency = (
//       (textLength / estimatedBinarySize) *
//       100
//     ).toFixed(1);

//     console.log(`[${requestId}] === EXTRACTION RESULTS ===`);
//     console.log(
//       `[${requestId}] Extracted characters: ${textLength.toLocaleString()}`
//     );
//     console.log(`[${requestId}] Word count: ${wordCount.toLocaleString()}`);
//     console.log(`[${requestId}] Line count: ${lineCount.toLocaleString()}`);
//     console.log(
//       `[${requestId}] Average word length: ${averageWordLength} chars`
//     );
//     console.log(
//       `[${requestId}] Extraction efficiency: ${extractionEfficiency}% (chars vs binary size)`
//     );
//     console.log(`[${requestId}] Extraction time: ${extractionTime}ms`);
//     console.log(
//       `[${requestId}] Text preview (first 200 chars): ${extractedText.substring(
//         0,
//         200
//       )}...`
//     );
//     console.log(
//       `[${requestId}] Text preview (last 200 chars): ...${extractedText.substring(
//         textLength - 200
//       )}`
//     );

//     // Calculate metadata
//     const pageCount = Math.ceil(wordCount / 500);
//     const sectionCount =
//       (extractedText.match(/^#{1,6}\s+/gm) || []).length || 1;

//     const metadata = {
//       wordCount,
//       pageCount,
//       sectionCount,
//       extractionEfficiency: parseFloat(extractionEfficiency),
//       extractionTimeMs: extractionTime,
//     };

//     console.log(
//       `[${requestId}] Metadata - Words: ${wordCount}, Pages: ${pageCount}, Sections: ${sectionCount}`
//     );

//     // CALL CLAUDE FOR ANALYSIS
//     console.log(`[${requestId}] === CLAUDE ANALYSIS START ===`);
//     const analysisResult = await callClaudeAPI(
//       extractedText,
//       fileName,
//       claudeKey,
//       requestId
//     );

//     // Store result
//     const contentHash = await generateContentHash(extractedText);
//     await storeAnalysisResult(supabaseClient, {
//       userId: user.id,
//       fileName,
//       contentHash,
//       result: analysisResult,
//       requestId,
//     });

//     const totalTime = Date.now() - startTime;
//     console.log(`[${requestId}] === COMPLETE === ${totalTime}ms`);

//     return jsonResponse({
//       success: true,
//       result: analysisResult,
//       metadata,
//       processingTimeMs: totalTime,
//       requestId,
//     });
//   } catch (error) {
//     const totalTime = Date.now() - startTime;
//     console.error(`[${requestId}] FAILED (${totalTime}ms):`, error);

//     const message = error instanceof Error ? error.message : 'Unknown error';
//     let status = 500;

//     if (message.includes('429')) status = 429;
//     if (message.includes('timeout')) status = 408;
//     if (message.includes('API key')) status = 401;

//     return jsonResponse(
//       {
//         error: message,
//         requestId,
//         success: false,
//       },
//       status
//     );
//   }
// });

// /**
//  * Extract text from PDF base64 data using pdf-parse
//  */
// async function extractTextFromPdf(
//   base64Pdf: string,
//   fileName: string,
//   requestId: string
// ): Promise<string> {
//   try {
//     console.log(`[${requestId}] Starting PDF extraction...`);

//     // Decode base64 to binary
//     const binaryString = atob(base64Pdf);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }

//     console.log(`[${requestId}] Decoded base64 to ${bytes.length} bytes`);

//     // Parse PDF using pdf-parse
//     console.log(`[${requestId}] Parsing PDF with pdf-parse...`);
//     const parseStartTime = Date.now();
//     const data = await pdfParse(bytes);
//     const parseTime = Date.now() - parseStartTime;

//     console.log(`[${requestId}] PDF parsing complete in ${parseTime}ms`);
//     console.log(`[${requestId}] PDF pages: ${data.numpages}`);
//     console.log(`[${requestId}] PDF version: ${data.version || 'unknown'}`);
//     console.log(
//       `[${requestId}] Extracted raw text length: ${data.text.length} characters`
//     );

//     // Clean text
//     let extractedText = data.text.replace(/\s+/g, ' ').trim();

//     const cleanedLength = extractedText.length;
//     const reductionPercent = (
//       ((data.text.length - cleanedLength) / data.text.length) *
//       100
//     ).toFixed(1);

//     console.log(
//       `[${requestId}] After normalization: ${cleanedLength} characters`
//     );
//     console.log(`[${requestId}] Whitespace reduction: ${reductionPercent}%`);

//     if (!extractedText || extractedText.length < 50) {
//       console.warn(
//         `[${requestId}] Low text yield: ${extractedText.length} chars from ${data.numpages} pages`
//       );
//       throw new Error(
//         `Insufficient readable text (${extractedText.length} chars). Document may be scanned or image-based.`
//       );
//     }

//     console.log(
//       `[${requestId}] PDF extraction successful: ${cleanedLength} chars from ${data.numpages} pages`
//     );

//     return extractedText;
//   } catch (error) {
//     console.error(
//       `[${requestId}] PDF extraction error:`,
//       error instanceof Error ? error.message : error
//     );
//     throw new Error(
//       error instanceof Error
//         ? `PDF extraction failed: ${error.message}`
//         : 'PDF extraction failed'
//     );
//   }
// }

// /**
//  * Build investment analysis prompt
//  */
// function buildInvestmentAnalysisPrompt(extractedText: string): string {
//   const textPreview =
//     extractedText.length > 5000
//       ? extractedText.substring(0, 5000) + '\n[... document continues ...]'
//       : extractedText;

//   return `You are an expert investment analyst analyzing a business document.

// DOCUMENT CONTENT:
// ${textPreview}

// Analyze this opportunity using contrarian investment principles:
// 1. Resourcefulness over capital requirements
// 2. Hidden competitive moats (non-obvious advantages)
// 3. Anti-fragile characteristics (stronger during downturns)
// 4. Evidence of adaptive management
// 5. Market timing and positioning

// Provide analysis as JSON:
// {
//   "matchScore": <0-100>,
//   "successProbability": <0-100>,
//   "competitivePositioning": "<strong|moderate|weak>",
//   "marketTimingInsight": "<favorable|neutral|challenging>",
//   "hiddenGemIndicators": ["indicator1", "indicator2", "indicator3"],
//   "contrarianSignals": ["signal1", "signal2"],
//   "strengths": ["strength1", "strength2", "strength3"],
//   "improvementAreas": ["area1", "area2", "area3"],
//   "riskFactors": [
//     {"factor": "risk1", "severity": "high", "impact": "description"},
//     {"factor": "risk2", "severity": "medium", "impact": "description"}
//   ],
//   "marketIntelligence": {
//     "sector": "identified_sector",
//     "trends": ["trend1", "trend2"],
//     "competitorActivity": ["activity1", "activity2"],
//     "timingInsights": ["insight1", "insight2"],
//     "fundingTrends": {
//       "averageRoundSize": 5000000,
//       "totalFunding": 50000000,
//       "dealCount": 10,
//       "valuationTrend": "up"
//     },
//     "riskFactors": ["risk1", "risk2"],
//     "opportunities": [
//       {"opportunity": "opp1", "rationale": "why", "timeframe": "when"}
//     ]
//   },
//  "keyInsights": [
//   {
//     "title": "Insight title",
//     "executiveSummary": "High-level summary (1–2 paragraphs)",
//     "coreInsight": "Deep narrative explanation. This section may be several pages long and should fully unpack the insight.",
//     "supportingEvidence": [
//       "Direct references to the document",
//       "Observed patterns or signals",
//       "Market or operational indicators"
//     ],
//     "contrarianAngle": "Why this insight is non-obvious or mispriced by the market",
//     "implications": {
//       "upside": "What goes right if this insight holds",
//       "downside": "What fails if this insight is wrong",
//       "executionRisks": "What must be true operationally"
//     },
//     "reasoningChain": [
//       {
//         "step": 1,
//         "reasoning": "Explicit logical step",
//         "evidenceReference": "Document or market signal"
//       }
//     ],
//     "investorTakeaway": "Clear decision-relevant conclusion"
//   }
// ],

//   "recommendations": ["rec1", "rec2", "rec3"]
// }
// Key Insights Requirements:
// - Produce 3–5 key insights.
// - Each insight should be detailed enough to span multiple pages if printed.
// - Do not summarize; fully reason step-by-step.
// - Assume the reader is a professional investor performing deep diligence.

// Return ONLY valid JSON, no markdown or extra text. `;
// }

// /**
//  * Call Claude API for analysis
//  */
// async function callClaudeAPI(
//   extractedText: string,
//   fileName: string,
//   apiKey: string,
//   requestId: string
// ): Promise<Record<string, unknown>> {
//   try {
//     const prompt = buildInvestmentAnalysisPrompt(extractedText);

//     console.log(`[${requestId}] Calling Claude API...`);
//     const apiStartTime = Date.now();

//     const response = await fetch('https://api.anthropic.com/v1/messages', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': apiKey,
//         'anthropic-version': '2023-06-01',
//       },
//       body: JSON.stringify({
//         model: 'claude-sonnet-4-20250514',
//         max_tokens: 12000,
//         messages: [
//           {
//             role: 'user',
//             content: prompt,
//           },
//         ],
//       }),
//     });

//     const apiTime = Date.now() - apiStartTime;
//     console.log(
//       `[${requestId}] Claude response: ${apiTime}ms (${response.status})`
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(
//         `[${requestId}] Claude error (${response.status}):`,
//         errorText
//       );

//       let errorMessage = `Claude API error: ${response.status}`;
//       try {
//         const errorData = JSON.parse(errorText);
//         if (errorData.error?.message) {
//           errorMessage = errorData.error.message;
//         }
//       } catch {
//         errorMessage = `Claude API error: ${response.status} ${response.statusText}`;
//       }

//       throw new Error(errorMessage);
//     }

//     const data = (await response.json()) as Record<string, unknown>;

//     const content = data.content as Array<Record<string, unknown>> | undefined;
//     const text = (content?.[0]?.text as string) || '';

//     if (!text) {
//       console.error(`[${requestId}] Empty response from Claude`, data);
//       throw new Error('Empty response from Claude');
//     }

//     console.log(
//       `[${requestId}] Claude response length: ${text.length} characters`
//     );

//     const result = extractJsonFromText(text) || getFallbackResponse();

//     return result;
//   } catch (error) {
//     console.error(`[${requestId}] Claude API error:`, error);

//     if (error instanceof Error) {
//       throw error;
//     }

//     throw new Error('Claude API request failed');
//   }
// }

// /**
//  * Extract JSON from text response
//  */
// function extractJsonFromText(text: string): Record<string, unknown> | null {
//   try {
//     const jsonRegex = /\{[\s\S]*\}/;
//     const match = text.match(jsonRegex);

//     if (match) {
//       return JSON.parse(match[0]);
//     }

//     return null;
//   } catch (error) {
//     console.error('JSON extraction error:', error);
//     return null;
//   }
// }

// /**
//  * Fallback response if API fails
//  */
// function getFallbackResponse(): Record<string, unknown> {
//   return {
//     matchScore: 50,
//     successProbability: 50,
//     competitivePositioning: 'moderate',
//     marketTimingInsight: 'neutral',
//     hiddenGemIndicators: ['Unable to analyze - please try again'],
//     contrarianSignals: [],
//     strengths: ['Analysis temporarily unavailable'],
//     improvementAreas: ['Please retry the analysis'],
//     riskFactors: [],
//     marketIntelligence: {
//       sector: 'Unknown',
//       trends: [],
//       competitorActivity: [],
//       timingInsights: [],
//       fundingTrends: {
//         averageRoundSize: 0,
//         totalFunding: 0,
//         dealCount: 0,
//         valuationTrend: 'stable',
//       },
//       riskFactors: [],
//       opportunities: [],
//     },
//     keyInsights: ['Analysis encountered an issue'],
//     recommendations: ['Please retry the document analysis'],
//   };
// }

// /**
//  * Generate content hash
//  */
// async function generateContentHash(content: string): Promise<string> {
//   try {
//     const encoder = new TextEncoder();
//     const data = encoder.encode(content);
//     const hashBuffer = await crypto.subtle.digest('SHA-256', data);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
//   } catch {
//     return `hash_${Date.now()}`;
//   }
// }

// /**
//  * Store analysis result
//  */
// async function storeAnalysisResult(
//   supabase: ReturnType<typeof createClient>,
//   params: {
//     userId: string;
//     fileName: string;
//     contentHash: string;
//     result: Record<string, unknown>;
//     requestId: string;
//   }
// ): Promise<void> {
//   try {
//     await supabase.from('document_analysis_results').insert({
//       user_id: params.userId,
//       file_name: params.fileName,
//       content_hash: params.contentHash,
//       analysis_type: 'investment_analysis',
//       result_data: params.result,
//       confidence_score: (params.result.matchScore as number) || 50,
//       processing_time_ms: 0,
//       sources: [],
//       search_queries: [],
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString(),
//     });

//     console.log(`[${params.requestId}] Result stored in database`);
//   } catch (error) {
//     console.warn(`[${params.requestId}] Storage warning:`, error);
//   }
// }

// /**
//  * JSON response helper
//  */
// function jsonResponse(body: Record<string, unknown>, status = 200): Response {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: {
//       ...corsHeaders,
//       'Content-Type': 'application/json',
//     },
//   });
// }
