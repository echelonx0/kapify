# Market Intelligence Analysis Prompt

**Service Name:** `market-intelligence`  
**Edge Function:** `market-intelligence`  
**Model:** Gemini 2.5 Flash  
**Uses Grounding:** Yes (Real-time web data)  
**Version:** 1.0.0  
**Last Updated:** 2025-01-20

---

## Purpose

Generate comprehensive, data-driven market intelligence reports by analyzing real-time web data about specific industries. This service provides investors and SMEs with current market trends, competitive landscape insights, funding data, and timing recommendations.

---

## Key Features

✅ **Real-time Data Collection** - Uses Google Search grounding to gather current information  
✅ **Multi-dimensional Analysis** - Covers trends, competitors, regulations, funding, risks  
✅ **Actionable Insights** - Provides timing recommendations and opportunity identification  
✅ **Source Attribution** - Tracks all data sources for transparency and verification  
✅ **Confidence Scoring** - Rates reliability of intelligence based on data quality

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `industry` | string | Yes | Target industry (e.g., "FinTech", "Healthcare", "Manufacturing") |
| `sector` | string | No | Specific sector within industry for narrower focus |
| `cacheKey` | string | No | Unique key for caching results |
| `maxAgeHours` | number | No | Maximum age of cached data before refresh (default: 24) |

---

## High-Level Logic Flow

```
1. AUTHENTICATION
   - Validate user session via Supabase Auth
   - Extract JWT from request headers
   - Return 401 if not authenticated

2. INPUT VALIDATION
   - Check that industry parameter is provided
   - Validate parameter types and formats
   - Return 400 if validation fails

3. CACHE CHECK
   - Build cache key from industry + sector
   - Query market_intelligence_cache table
   - Check if cached data exists and is not expired
   - If valid cache hit → Skip to step 6

4. WEB SEARCH & DATA COLLECTION
   - Configure Gemini 2.5 Flash with grounding tools:
     * googleSearch: Find recent articles, reports, funding news
     * urlContext: Extract detailed information from sources
   - Build comprehensive prompt requesting:
     * Market size and growth trends
     * Recent funding rounds and valuations
     * Competitor activities and news
     * Regulatory changes
     * Risk factors and opportunities
   - Set temperature to 0.2 (factual analysis)
   - Execute AI generation with grounding

5. RESPONSE PROCESSING
   - Extract text response from Gemini
   - Parse JSON structure from response
   - Validate required fields exist
   - Extract grounding metadata:
     * Web search queries used
     * Sources accessed (URLs, titles)
     * Relevance scores
   - Calculate confidence score based on:
     * Number of quality sources found
     * Data completeness
     * Source diversity

6. CACHE STORAGE
   - Store intelligence data in market_intelligence_cache
   - Set expiration time (maxAgeHours)
   - Include sources and search queries
   - Save confidence score

7. ACTIVITY LOGGING
   - Log intelligence request in intelligence_audit_log:
     * User ID
     * Query parameters
     * Sources accessed
     * Processing time
     * Success/failure status

8. RESPONSE DELIVERY
   - Return structured intelligence object:
     * Industry analysis data
     * Trends and insights
     * Funding data
     * Risk factors
     * Opportunities
     * Sources and confidence score
     * Cache metadata
```

---

## Output Structure

```json
{
  "industry": "string",
  "sector": "string | null",
  "trends": ["array of current market trends with timeframes"],
  "competitorActivity": ["recent competitor actions and news"],
  "regulatoryChanges": ["new regulations affecting industry"],
  "timingInsights": ["market timing recommendations with rationale"],
  "fundingTrends": {
    "averageRoundSize": "number (USD)",
    "totalFunding": "number (last quarter USD)",
    "dealCount": "number of deals last quarter",
    "valuationTrend": "up | down | stable"
  },
  "riskFactors": [
    {
      "factor": "specific risk name",
      "severity": "low | medium | high",
      "impact": "detailed description",
      "timeframe": "immediate | short_term | medium_term | long_term"
    }
  ],
  "opportunities": [
    {
      "opportunity": "specific opportunity description",
      "rationale": "why this is an opportunity",
      "timeframe": "how long window exists"
    }
  ],
  "sources": [
    {
      "type": "search_query | web_source | news | report",
      "title": "source title",
      "url": "source URL (if available)",
      "query": "search query used (if applicable)",
      "relevance": "high | medium | low",
      "timestamp": "ISO date"
    }
  ],
  "searchQueries": ["array of search queries executed"],
  "confidence": "number 0-100",
  "lastUpdated": "ISO date",
  "cacheKey": "string"
}
```

---

## Prompt Strategy

### Role Definition
The AI acts as a **market intelligence analyst** with access to real-time data and financial expertise.

### Search Instructions
The prompt explicitly instructs the AI to:
1. Search for recent funding rounds and valuations
2. Find market size and growth data
3. Gather competitor news and activities
4. Identify regulatory changes
5. Assess economic factors

### Critical Requirements
- **Recency:** Focus on last 6 months of data
- **Authority:** Prioritize authoritative sources (financial news, industry reports, regulatory filings)
- **Balance:** Include both positive and negative indicators
- **Specificity:** Avoid generic statements, provide concrete data with timeframes

### Quality Control
- Validates JSON structure before returning
- Requires minimum data completeness
- Falls back to basic analysis if grounding fails
- Confidence score reflects data quality

---

## Error Handling

### Grounding Failure
If web grounding fails or returns insufficient data:
- Falls back to `generateBasicMarketIntelligence()`
- Uses Gemini without grounding for generic industry knowledge
- Sets confidence score to 50% to indicate reduced reliability
- Still provides useful baseline intelligence

### Cache Failures
- Non-critical: If caching fails, still returns intelligence
- Logs warning but doesn't block response
- Next request will generate fresh data

### Authentication Errors
- Returns 401 with clear error message
- No intelligence data exposed to unauthenticated users

---

## Performance Considerations

### Caching Strategy
- Default cache: 24 hours
- Reduces API calls and improves response time
- Stale cache (4x maxAge) used as fallback if fresh generation fails

### Rate Limiting
- No explicit rate limiting in function
- Relies on Supabase edge function limits
- Caching reduces effective request volume

### Processing Time
- Typical: 3-8 seconds with grounding
- Fallback (no grounding): 1-3 seconds
- Logged for monitoring

---

## Use Cases

### For Investors
- **Due Diligence:** Current market conditions for target industry
- **Timing Decisions:** Is now a good time to invest?
- **Risk Assessment:** What threats exist in this space?
- **Opportunity Identification:** Where are the gaps?

### For SMEs
- **Funding Strategy:** What's the current funding climate?
- **Market Positioning:** How to position against competitors?
- **Risk Mitigation:** What challenges to prepare for?
- **Growth Planning:** Where are opportunities emerging?

---

## Configuration

### Temperature: 0.2
- Low temperature for factual, consistent intelligence
- Reduces creative interpretation
- Focuses on data-driven insights

### Model: Gemini 2.5 Flash
- Fast response times
- Good balance of quality and speed
- Supports grounding tools

### Grounding Tools
```typescript
const tools = [
  { googleSearch: {} },  // Search recent web content
  { urlContext: {} }     // Extract from specific URLs
];
```

---

## Maintenance Notes

### Regular Updates Needed
- Review prompt effectiveness quarterly
- Update search instruction specificity based on results
- Adjust confidence calculation as data patterns emerge
- Monitor source quality and diversity

### Known Limitations
- Grounding limited to English content primarily
- Some industries have better data availability than others
- Very niche sectors may have sparse results
- Regulatory data may lag official announcements

### Future Enhancements
- Industry-specific prompt variants
- Geographic market filtering
- Historical trend comparison
- Custom source prioritization per industry
