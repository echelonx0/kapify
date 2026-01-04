# Market Position Analysis Prompt

**Service Name:** `analyze-market-position`  
**Edge Function:** `analyze-market-position`  
**Model:** Gemini 2.5 Flash  
**Uses Grounding:** No (Analyzes provided data)  
**Dual Mode:** Yes (Investor + SME modes)  
**Version:** 1.0.0  
**Last Updated:** 2025-01-20

---

## Purpose

Analyze a business's competitive market position and strategic advantages. This service operates in two distinct modes:
- **Investor Mode:** Evaluates investment viability and competitive strength
- **SME Mode:** Helps businesses frame their market story for funding applications

---

## Key Features

✅ **Dual Analysis Perspectives** - Investor evaluation OR SME application guidance  
✅ **Competitive Differentiation** - Assesses unique value propositions and advantages  
✅ **Market Opportunity Sizing** - Evaluates addressable market and growth potential  
✅ **Strategic Positioning** - Analyzes competitive landscape and positioning strategy  
✅ **Actionable Recommendations** - Provides specific next steps based on analysis mode

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `analysisType` | string | Yes | Must be "market_position" |
| `businessData` | object | Yes | Business model, value prop, target markets, KPIs |
| `marketIntelligence` | object | Yes | Real-time market data from market-intelligence service |
| `industry` | string | Yes | Industry classification |
| `analysisMode` | string | No | "investor" (default) or "sme" |

### Business Data Structure
```typescript
{
  businessModel: string,
  valueProposition: string,
  targetMarkets: string[],
  competitivePosition: string,
  marketSize: string,
  keyPerformanceIndicators: string[]
}
```

---

## High-Level Logic Flow

```
1. AUTHENTICATION & VALIDATION
   - Validate user session
   - Check analysisType === 'market_position'
   - Validate required parameters exist
   - Return 400 if validation fails

2. MODE DETECTION
   - Check analysisMode parameter (default: 'investor')
   - Branch logic based on mode:
     * Investor → Investment evaluation perspective
     * SME → Application preparation perspective

3. PROMPT CONSTRUCTION
   - Build context section with business + market data
   - Select appropriate analysis framework:
     
     INVESTOR MODE:
     - Assess competitive strength
     - Evaluate market opportunity size
     - Determine market timing
     - Calculate differentiation score
     - Identify barriers and threats
     
     SME MODE:
     - Assess funding appeal
     - Identify competitive advantages to emphasize
     - Spot potential funder concerns
     - Provide positioning strategies
     - Recommend market validation steps

4. AI ANALYSIS
   - Configure Gemini 2.5 Flash
   - Set temperature to 0.3 (balanced analysis)
   - Execute generation with mode-specific prompt
   - Parse JSON response

5. RESPONSE VALIDATION
   - Validate all required fields present
   - Check value ranges (scores 0-100)
   - Validate enum values
   - Ensure arrays are properly structured

6. FALLBACK HANDLING
   - If AI generation fails:
     * Generate rule-based fallback analysis
     * Use business data completeness as scoring factor
     * Provide generic but useful recommendations
   - Lower confidence score for fallback responses

7. RESPONSE DELIVERY
   - Return structured analysis object
   - Include confidence score
   - Provide mode-specific insights
```

---

## Output Structure

### Investor Mode Output
```json
{
  "competitiveStrength": "strong | moderate | weak",
  "marketOpportunity": "high | medium | low",
  "timingAssessment": "favorable | neutral | challenging",
  "differentiationScore": "number 0-100",
  "marketSharePotential": "high | medium | low",
  "competitiveThreat": "low | medium | high",
  "barriers": {
    "entryBarriers": "low | medium | high",
    "scalingBarriers": "low | medium | high",
    "competitiveBarriers": "low | medium | high"
  },
  "opportunities": [
    {
      "opportunity": "string",
      "potential": "high | medium | low",
      "timeframe": "immediate | short_term | medium_term"
    }
  ],
  "threats": [
    {
      "threat": "string",
      "severity": "high | medium | low",
      "probability": "high | medium | low"
    }
  ],
  "recommendations": ["string"],
  "confidence": "number 0-100"
}
```

### SME Mode Output
```json
{
  "marketAppealScore": "number 0-100",
  "fundingAttractiveness": "highly_attractive | moderately_attractive | limited_appeal",
  "competitiveAdvantages": ["differentiators to highlight"],
  "marketOpportunityStory": "compelling narrative about market size/timing",
  "potentialMarketConcerns": [
    {
      "concern": "what funders might question",
      "severity": "low | medium | high",
      "response": "how to address concern",
      "evidence": "what data/proof to provide"
    }
  ],
  "positioningStrategy": ["how to frame market opportunity"],
  "competitivePositioning": "market_leader | strong_challenger | niche_player | emerging_competitor",
  "marketValidation": ["additional research/validation needed"],
  "timingAdvantages": ["market timing factors that favor business"],
  "applicationTips": ["specific advice for presenting to funders"],
  "confidence": "number 0-100"
}
```

---

## Prompt Strategy

### Investor Mode Strategy

**Role:** Market strategy analyst specializing in competitive positioning

**Analysis Framework:**
1. Competitive strength assessment (differentiation + positioning)
2. Market opportunity evaluation (size + accessibility)
3. Timing analysis (favorable conditions vs. headwinds)
4. Barrier identification (entry, scaling, competition)
5. Opportunity/threat mapping with timeframes
6. Strategic recommendations

**Critical Instructions:**
- Base analysis on provided market intelligence data
- Focus on material factors affecting investment returns
- Provide quantitative scores where possible
- Consider both current state and future potential
- Flag confidence level based on data quality

### SME Mode Strategy

**Role:** Market strategy consultant helping SMEs prepare funding applications

**Analysis Framework:**
1. Funding appeal assessment (how attractive to funders)
2. Competitive advantage identification (what to emphasize)
3. Concern anticipation (what funders will question)
4. Positioning strategy (how to frame story)
5. Market validation (what evidence to gather)
6. Application optimization (specific tips)

**Critical Instructions:**
- Empowering, solution-focused tone
- Frame weaknesses as growth opportunities
- Provide actionable preparation steps
- Focus on helping them succeed, not discouraging
- Specific advice for funder presentations

---

## Scoring Logic

### Investor Mode - Differentiation Score
```
Base Score: 30
+ Value Proposition (clear & strong): +20
+ Target Markets (well-defined): +20
+ Competitive Position (documented): +15
+ KPIs (tracked & improving): +15

Maximum: 100
```

### SME Mode - Market Appeal Score
```
Base Score: 45
+ Value Proposition (clear): +20
+ Target Markets (defined): +20
+ KPIs (tracked): +15

Maximum: 85 (realistic ceiling for SMEs)
```

---

## Mode Comparison

| Aspect | Investor Mode | SME Mode |
|--------|--------------|----------|
| **Perspective** | External evaluator | Internal coach |
| **Focus** | Investment viability | Application strength |
| **Tone** | Analytical, objective | Empowering, constructive |
| **Output** | Risk/return assessment | Preparation guidance |
| **Recommendations** | Strategic advice | Action steps |
| **Concerns** | Deal breakers | Addressable issues |

---

## Error Handling

### Invalid Analysis Type
- Returns 400 with error message
- No analysis performed

### Missing Required Data
- Fallback analysis with reduced confidence
- Uses whatever data is available
- Provides generic recommendations

### AI Generation Failure
- Rule-based fallback analysis
- Scoring based on data completeness
- Confidence score: 60-70%

### Invalid Mode Parameter
- Defaults to 'investor' mode
- Logs warning
- Continues with analysis

---

## Performance Considerations

### Processing Time
- Typical: 2-4 seconds
- No external data fetching
- Pure analysis of provided data

### No Caching
- Each analysis is specific to unique business data
- Caching not applicable
- Real-time analysis on every request

### Resource Usage
- Lightweight compared to market intelligence
- No grounding tools needed
- Single AI generation call

---

## Use Cases

### Investor Mode Use Cases
1. **Due Diligence:** Evaluate competitive positioning of potential investment
2. **Portfolio Review:** Assess market position of existing portfolio companies
3. **Opportunity Screening:** Quick market viability assessment
4. **Risk Analysis:** Identify competitive threats and barriers

### SME Mode Use Cases
1. **Application Preparation:** Identify areas to strengthen before applying
2. **Pitch Refinement:** Learn how to frame market story effectively
3. **Concern Mitigation:** Proactively address potential funder questions
4. **Documentation Planning:** Understand what evidence to gather

---

## Fallback Analysis Logic

### When AI Fails
The system generates rule-based analysis using:

**Data Completeness Scoring:**
- Has value proposition (50+ chars): +20 points
- Has target markets: +20 points
- Has KPIs: +15 points

**Default Recommendations:**
- Strengthen value proposition differentiation
- Conduct detailed competitive analysis
- Develop market entry strategy for target segments

**Generic Insights:**
- Based on industry best practices
- Not tailored to specific business
- Lower confidence (60-70%)

---

## Configuration

### Temperature: 0.3
- Balanced between factual and analytical
- Allows for strategic interpretation
- Still grounded in provided data

### Model: Gemini 2.5 Flash
- Fast analysis
- Good reasoning for strategic assessment
- Handles structured output well

### Max Tokens: 3072
- Sufficient for detailed analysis
- Supports comprehensive recommendations
- Allows for multiple insights per category

---

## Integration Points

### Upstream Dependencies
- **Market Intelligence Service:** Provides market context
- **Profile Service:** Supplies business data
- **Application Service:** Provides opportunity context

### Downstream Consumers
- **AI Assistant Component:** Displays insights to users
- **Application Analysis:** Part of comprehensive evaluation
- **Dashboard Widgets:** Summary metrics and scores

---

## Maintenance Notes

### Prompt Tuning Opportunities
- Adjust scoring weights based on actual funder priorities
- Refine SME mode tone based on user feedback
- Enhance investor mode with sector-specific factors
- Add industry-specific analysis variations

### Known Limitations
- Quality depends on completeness of business data
- Generic recommendations if data is sparse
- No industry-specific competitive dynamics (yet)
- SME mode assumes certain funder priorities

### Future Enhancements
- Industry-specific analysis templates
- Historical comparison (track position over time)
- Competitor benchmarking (if data available)
- Geographic market variations
- Funding stage-specific analysis
