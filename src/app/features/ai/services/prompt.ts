// // supabase/functions/analyze-document/index.ts
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import pdfParse from 'npm:pdf-parse@1.1.1';

// /* ---------------------------------- CORS --------------------------------- */

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers':
//     'authorization, x-client-info, apikey, content-type',
//   'Access-Control-Allow-Methods': 'POST, OPTIONS',
// };

// /* ---------------------------------- MAIN --------------------------------- */

// Deno.serve(async (req) => {
//   const requestId = crypto.randomUUID().slice(0, 8);
//   const startTime = Date.now();

//   console.log(`[${requestId}] === ANALYSIS START ===`);

//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { status: 200, headers: corsHeaders });
//   }

//   try {
//     /* --------------------------- ENV VALIDATION --------------------------- */

//     const supabaseUrl = Deno.env.get('SUPABASE_URL');
//     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
//     const claudeKey = Deno.env.get('CLAUDE_KEY');

//     if (!claudeKey || !claudeKey.startsWith('sk-ant-')) {
//       console.error(`[${requestId}] Invalid CLAUDE_KEY`);
//       return jsonResponse(
//         { error: 'API configuration error', requestId },
//         500
//       );
//     }

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

//     /* ------------------------------ AUTH ---------------------------------- */

//     const {
//       data: { user },
//       error: authError,
//     } = await supabaseClient.auth.getUser();

//     if (authError || !user) {
//       console.error(`[${requestId}] Unauthorized`);
//       return jsonResponse({ error: 'Unauthorized', requestId }, 401);
//     }

//     console.log(`[${requestId}] User: ${user.id}`);

//     /* --------------------------- REQUEST BODY ----------------------------- */

//     const rawBody = await req.text();
//     const { pdfData, fileName, orgId } = JSON.parse(rawBody);

//     if (!pdfData) {
//       return jsonResponse({ error: 'PDF data required', requestId }, 400);
//     }

//     if (!orgId) {
//       return jsonResponse({ error: 'Organization ID required', requestId }, 400);
//     }

//     /* -------------------------- PDF EXTRACTION ----------------------------- */

//     const extractionStart = Date.now();
//     const extractedText = await extractTextFromPdf(
//       pdfData,
//       fileName,
//       requestId
//     );
//     const extractionTime = Date.now() - extractionStart;

//     if (!extractedText || extractedText.length < 100) {
//       return jsonResponse(
//         {
//           error: 'No readable text found in PDF',
//           requestId,
//         },
//         400
//       );
//     }

//     const wordCount = extractedText.split(/\s+/).length;

//     /* ---------------------------- CLAUDE CALL ------------------------------ */

//     console.log(`[${requestId}] === CLAUDE ANALYSIS START ===`);

//     const analysisResult = await callClaudeWithContinuation(
//       extractedText,
//       fileName,
//       claudeKey,
//       requestId
//     );

//     /* ------------------------------ STORAGE -------------------------------- */

//     const contentHash = await generateContentHash(extractedText);

//     await storeAnalysisResult(supabaseClient, {
//       userId: user.id,
//       fileName,
//       contentHash,
//       result: analysisResult,
//       requestId,
//       orgId,
//     });

//     const totalTime = Date.now() - startTime;

//     console.log(`[${requestId}] === COMPLETE (${totalTime}ms) ===`);

//     return jsonResponse({
//       success: true,
//       result: analysisResult,
//       metadata: {
//         wordCount,
//         extractionTimeMs: extractionTime,
//       },
//       processingTimeMs: totalTime,
//       requestId,
//     });
//   } catch (error) {
//     console.error(`[${requestId}] FAILED`, error);
//     return jsonResponse(
//       {
//         success: false,
//         error:
//           error instanceof Error ? error.message : 'Unexpected server error',
//         requestId,
//       },
//       500
//     );
//   }
// });

// /* ============================= PDF EXTRACTION ============================= */

// async function extractTextFromPdf(
//   base64Pdf: string,
//   fileName: string,
//   requestId: string
// ): Promise<string> {
//   try {
//     const binaryString = atob(base64Pdf);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }

//     const data = await pdfParse(bytes);

//     return data.text.replace(/\s+/g, ' ').trim();
//   } catch (error) {
//     console.error(`[${requestId}] PDF extraction failed`, error);
//     throw new Error('PDF extraction failed');
//   }
// }

// /* ============================ PROMPT BUILDER ============================== */

// function buildInvestmentAnalysisPrompt(extractedText: string): string {
//   const preview =
//     extractedText.length > 12000
//       ? extractedText.slice(0, 12000) + '\n[DOCUMENT CONTINUES]'
//       : extractedText;

//   return `
// You are a senior contrarian investment analyst performing deep diligence.

// DOCUMENT:
// ${preview}

// OBJECTIVE:
// Generate a professional-grade investment memo.

// KEY INSIGHTS REQUIREMENTS:
// - Produce 3–5 key insights.
// - EACH insight must be deeply reasoned and long-form.
// - Each insight should be detailed enough to span multiple pages if printed.
// - Explicitly explain WHY the insight matters and HOW it was derived.
// - Assume the reader is a fund partner evaluating deployment risk.

// RETURN ONLY VALID JSON.

// JSON SCHEMA:
// {
//   "matchScore": 0-100,
//   "successProbability": 0-100,
//   "competitivePositioning": "strong|moderate|weak",
//   "marketTimingInsight": "favorable|neutral|challenging",
//   "hiddenGemIndicators": [],
//   "contrarianSignals": [],
//   "strengths": [],
//   "improvementAreas": [],
//   "riskFactors": [
//     { "factor": "", "severity": "low|medium|high", "impact": "" }
//   ],
//   "marketIntelligence": {
//     "sector": "",
//     "trends": [],
//     "competitorActivity": [],
//     "timingInsights": [],
//     "fundingTrends": {
//       "averageRoundSize": 0,
//       "totalFunding": 0,
//       "dealCount": 0,
//       "valuationTrend": "up|down|stable"
//     },
//     "riskFactors": [],
//     "opportunities": [
//       { "opportunity": "", "rationale": "", "timeframe": "" }
//     ]
//   },
//   "keyInsights": [
//     {
//       "title": "",
//       "executiveSummary": "",
//       "coreInsight": "",
//       "supportingEvidence": [],
//       "contrarianAngle": "",
//       "implications": {
//         "upside": "",
//         "downside": "",
//         "executionRisks": ""
//       },
//       "reasoningChain": [
//         { "step": 1, "reasoning": "", "evidenceReference": "" }
//       ],
//       "investorTakeaway": ""
//     }
//   ],
//   "recommendations": [],
//   "confidence": 0
// }
// `;
// }

// /* ============================ CLAUDE CALL ================================ */

// async function callClaudeWithContinuation(
//   extractedText: string,
//   fileName: string,
//   apiKey: string,
//   requestId: string
// ): Promise<Record<string, unknown>> {
//   let accumulatedText = '';

//   const callClaude = async (prompt: string) => {
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
//         messages: [{ role: 'user', content: prompt }],
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Claude API error: ${errorText}`);
//     }

//     const data = await response.json();
//     return data.content?.[0]?.text || '';
//   };

//   accumulatedText = await callClaude(
//     buildInvestmentAnalysisPrompt(extractedText)
//   );

//   let parsed = extractJsonFromText(accumulatedText);

//   if (!parsed) {
//     console.warn(`[${requestId}] JSON incomplete, requesting continuation`);
//     const continuation = await callClaude(
//       'Continue exactly where you left off. Return ONLY valid JSON.'
//     );
//     accumulatedText += continuation;
//     parsed = extractJsonFromText(accumulatedText);
//   }

//   if (!parsed) {
//     console.error(`[${requestId}] Failed to parse Claude output`);
//     return getFallbackResponse();
//   }

//   return parsed;
// }

// /* ============================ JSON UTILITIES ============================== */

// function extractJsonFromText(text: string): Record<string, unknown> | null {
//   try {
//     const match = text.match(/\{[\s\S]*\}/);
//     return match ? JSON.parse(match[0]) : null;
//   } catch {
//     return null;
//   }
// }

// function getFallbackResponse(): Record<string, unknown> {
//   return {
//     matchScore: 50,
//     successProbability: 50,
//     competitivePositioning: 'moderate',
//     marketTimingInsight: 'neutral',
//     hiddenGemIndicators: [],
//     contrarianSignals: [],
//     strengths: [],
//     improvementAreas: [],
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
//     keyInsights: [],
//     recommendations: [],
//     confidence: 50,
//   };
// }

// /* =============================== STORAGE ================================= */

// async function generateContentHash(content: string): Promise<string> {
//   const encoder = new TextEncoder();
//   const data = encoder.encode(content);
//   const hash = await crypto.subtle.digest('SHA-256', data);
//   return Array.from(new Uint8Array(hash))
//     .map((b) => b.toString(16).padStart(2, '0'))
//     .join('');
// }

// async function storeAnalysisResult(
//   supabase: ReturnType<typeof createClient>,
//   params: {
//     userId: string;
//     fileName: string;
//     contentHash: string;
//     result: Record<string, unknown>;
//     requestId: string;
//     orgId: string;
//   }
// ) {
//   try {
//     await supabase.from('ai_analysis_results').insert({
//       user_id: params.userId,
//       org_id: params.orgId,
//       content_hash: params.contentHash,
//       analysis_type: 'opportunity',
//       analysis_result: params.result,
//       model_version: 'claude-sonnet-4-20250514',
//       processing_time_ms: 0,
//     });
//   } catch (error) {
//     console.warn(`[${params.requestId}] Storage warning`, error);
//   }
// }

// /* =============================== RESPONSE ================================= */

// function jsonResponse(body: Record<string, unknown>, status = 200): Response {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: {
//       ...corsHeaders,
//       'Content-Type': 'application/json',
//     },
//   });
// }
