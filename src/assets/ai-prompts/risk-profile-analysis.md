# Risk Profile Analysis Prompt

**Service Name:** `analyze-risk-profile`  
**Edge Function:** `analyze-risk-profile`  
**Model:** Gemini 2.5 Flash  
**Uses Grounding:** No (Analyzes provided data)  
**Dual Mode:** Yes (Investor + SME modes)  
**Version:** 1.0.0  
**Last Updated:** 2025-01-20

---

## Purpose

Perform comprehensive risk assessment across multiple business dimensions. This service operates in two modes:
- **Investor Mode:** Evaluates investment risk and potential deal breakers
- **SME Mode:** Assesses funding application readiness and provides preparation guidance

---

## Key Features

✅ **Multi-Dimensional Risk Assessment** - Financial, market, operational, management, regulatory  
✅ **Dual Perspectives** - Investment risk OR application readiness  
✅ **Critical Risk Identification** - Highlights material risks with impact/probability  
✅ **Mitigation Strategies** - Actionable recommendations to address risks  
✅ **Proactive Guidance** - SME mode helps prepare before submitting applications

---

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `analysisType` | string | Yes | Must be "comprehensive_risk" |
| `profileData` | object | Yes | Complete business profile data |
| `industry` | string | Yes | Industry classification |
| `analysisMode` | string | No | "investor" (default) or "sme" |

### Profile Data Structure
```typescript
{
  companyInfo: {
    name: string,
    registrationNumber: string,
    yearEstablished: number,
    // ... other company details
  },
  financialProfile: {
    monthlyRevenue: number,
    debtToEquity: number,
    currentRatio: number,
    creditRating: string,
    // ... other financial metrics
  },
  managementStructure: {
    executiveTeam: Person[],
    managementTeam: Person[],
    boardOfDirectors: Person[]
  },
  businessAssessment: {
    businessModel: string,
    marketSize: string,
    competitivePosition: string,
    // ... other business factors
  }
}
```

---

## High-Level Logic Flow

```
1. AUTHENTICATION & VALIDATION
   - Validate user session
   - Check analysisType === 'comprehensive_risk'
   - Validate profile data exists
   - Return 400 if validation fails

2. MODE DETECTION
   - Check analysisMode parameter (default: 'investor')
   - Select analysis framework:
     * Investor → Risk evaluation for investment decisions
     * SME → Application readiness assessment

3. DATA ANALYSIS
   - Extract key risk indicators:
     * Financial: Debt levels, revenue, ratios
     * Management: Team size, experience, structure
     * Operational: Processes, systems, scalability
     * Market: Competition, positioning, demand
     * Regulatory: Compliance, industry regulations

4. PROMPT CONSTRUCTION
   - Build comprehensive context with profile summary
   - Include relevant industry information
   - Select mode-specific analysis instructions:
     
     INVESTOR MODE:
     - Calculate overall risk score (0-100, higher = riskier)
     - Categorize risks by dimension
     - Identify critical risks with impact/probability
     - Develop mitigation strategies
     - Flag potential deal breakers
     
     SME MODE:
     - Calculate application readiness score (0-100, higher = better)
     - Identify potential funder concerns
     - Provide addressing strategies for each concern
     - Suggest ways to position challenges positively
     - Recommend preparation actions

5. AI RISK ASSESSMENT
   - Configure Gemini 2.5 Flash
   - Set temperature to 0.2 (factual, consistent)
   - Execute generation with mode-specific prompt
   - Parse JSON response

6. RESPONSE VALIDATION
   - Validate required fields and structure
   - Check score ranges (0-100)
   - Validate enum values and categories
   - Ensure arrays properly formatted

7. FALLBACK ANALYSIS
   - If AI fails, generate rule-based assessment:
     * Calculate risk score from key metrics
     * Provide standard risk categorization
     * Generate generic mitigation strategies
   - Lower confidence for fallback (60-70%)

8. RESPONSE DELIVERY
   - Return structured risk/readiness assessment
   - Include confidence score
   - Provide mode-specific guidance
```

---

## Output Structure

### Investor Mode Output
```json
{
  "overallRiskScore": "number 0-100 (higher = more risky)",
  "riskCategories": {
    "financial": "low | medium | high",
    "market": "low | medium | high",
    "operational": "low | medium | high",
    "management": "low | medium | high",
    "regulatory": "low | medium | high"
  },
  "criticalRisks": [
    {
      "category": "string",
      "risk": "string",
      "impact": "low | medium | high",
      "probability": "low | medium | high",
      "mitigation": "string"
    }
  ],
  "riskMitigationStrategies": ["string"],
  "monitoringRecommendations": ["string"],
  "dealBreakers": ["string"],
  "confidence": "number 0-100"
}
```

### SME Mode Output
```json
{
  "applicationReadinessScore": "number 0-100 (higher = better prepared)",
  "readinessLevel": "application_ready | needs_preparation | requires_work",
  "potentialConcerns": [
    {
      "category": "Financial | Market | Operational | Management | Regulatory",
      "concern": "specific issue funders might question",
      "impact": "low | medium | high",
      "addressingStrategy": "specific action to resolve/mitigate",
      "documentationNeeded": "what evidence/docs to prepare"
    }
  ],
  "strengthsToEmphasize": ["areas with strong positioning"],
  "preparationActions": ["immediate steps to strengthen application"],
  "positioningAdvice": ["how to frame weaknesses positively"],
  "riskMitigationStrategies": ["proactive measures to implement"],
  "monitoringRecommendations": ["ongoing tracking to maintain strength"],
  "applicationTips": ["specific advice for presenting to funders"],
  "confidence": "number 0-100"
}
```

---

## Risk Assessment Dimensions

### 1. Financial Risk Factors
**Analyzed Metrics:**
- Debt-to-equity ratio (>1.0 = high risk)
- Current ratio (<1.2 = liquidity concern)
- Monthly revenue (<$100k = traction concern)
- Credit rating
- Cash flow stability

**Risk Indicators:**
- High debt levels → Sustainability concern
- Low liquidity → Cash flow risk
- Low revenue → Market validation concern

### 2. Market Risk Factors
**Analyzed Metrics:**
- Competitive position clarity
- Market size definition
- Target customer segments
- Value proposition strength

**Risk Indicators:**
- Unclear positioning → Viability concern
- No defined markets → Strategy concern
- Weak value prop → Differentiation risk

### 3. Operational Risk Factors
**Analyzed Metrics:**
- Business model clarity
- Process documentation
- Scalability indicators
- System dependencies

**Risk Indicators:**
- Undefined processes → Scaling risk
- Single points of failure → Continuity concern
- Manual operations → Efficiency risk

### 4. Management Risk Factors
**Analyzed Metrics:**
- Executive team size
- Management team experience
- Board composition and oversight
- Key person dependencies

**Risk Indicators:**
- Small team (<3) → Scalability concern
- No board → Governance risk
- Founder-dependent → Succession risk

### 5. Regulatory Risk Factors
**Analyzed Metrics:**
- Industry-specific compliance
- License requirements
- Data protection requirements
- Employment regulations

**Risk Indicators:**
- Non-compliance → Legal risk
- Missing licenses → Operational risk
- Regulatory changes → Adaptation concern

---

## Scoring Logic

### Investor Mode - Risk Score Calculation
```
Base Risk Score: 50

INCREASE RISK IF:
+ Debt-to-equity > 1.0: +15 points
+ Current ratio < 1.0: +10 points
+ Monthly revenue < $50k: +10 points
+ Management team < 3: +15 points
+ No board of directors: +5 points

DECREASE RISK IF:
- Strong financial metrics: -10 points
- Large experienced team: -10 points
- Clear competitive position: -5 points

Range: 20-85 (capped at extremes)
```

### SME Mode - Readiness Score Calculation
```
Application Readiness = 100 - Risk Score

Readiness Levels:
- 75-100: application_ready
- 60-74: needs_preparation
- 0-59: requires_work
```

---

## Prompt Strategy

### Investor Mode Strategy

**Role:** Risk management expert for investment decisions

**Analysis Framework:**
1. Holistic risk assessment across all dimensions
2. Material risk identification (significant impact potential)
3. Impact × Probability matrix for critical risks
4. Mitigation strategy development
5. Deal breaker flagging (risks that prevent investment)
6. Monitoring recommendation for ongoing risk tracking

**Critical Instructions:**
- Focus on material risks affecting returns or viability
- Consider complete business profile, not isolated factors
- Provide specific, actionable mitigation strategies
- Flag deal breakers clearly
- Rate confidence based on data completeness

### SME Mode Strategy

**Role:** Business consultant preparing SMEs for funding applications

**Analysis Framework:**
1. Application readiness assessment (how prepared for scrutiny)
2. Potential funder concern identification
3. Proactive addressing strategies for each concern
4. Positive positioning of challenges as opportunities
5. Documentation and preparation recommendations
6. Application optimization tips

**Critical Instructions:**
- Empowering, action-oriented tone
- Frame as preparation and opportunity, not warnings
- Provide specific actions to resolve concerns
- Help them succeed by being prepared
- Solution-focused guidance

---

## Mode Comparison

| Aspect | Investor Mode | SME Mode |
|--------|--------------|----------|
| **Score Type** | Risk (lower = better) | Readiness (higher = better) |
| **Perspective** | External evaluator | Internal coach |
| **Focus** | Investment protection | Application success |
| **Tone** | Analytical, cautious | Empowering, constructive |
| **Output** | Risks to manage | Concerns to address |
| **Recommendations** | Risk mitigation | Preparation actions |
| **Deal Breakers** | Investment blockers | Addressable concerns |

---

## Fallback Analysis Logic

### When AI Generation Fails

**Risk Score Calculation:**
```typescript
let riskScore = 50; // Base

// Financial factors
if (debtToEquity > 1) riskScore += 15;
if (currentRatio < 1) riskScore += 10;
if (monthlyRevenue < 50000) riskScore += 10;

// Management factors
const teamSize = execTeam.length + mgmtTeam.length;
if (teamSize < 3) riskScore += 15;
if (boardSize === 0) riskScore += 5;

// Cap at realistic range
riskScore = Math.max(20, Math.min(85, riskScore));
```

**Generic Risk Categorization:**
```typescript
const riskCategories = {
  financial: debtToEquity > 1 ? 'high' : currentRatio < 1.2 ? 'medium' : 'low',
  market: hasCompetitivePosition ? 'medium' : 'high',
  operational: teamSize < 2 ? 'high' : 'medium',
  management: teamSize < 3 ? 'high' : teamSize < 5 ? 'medium' : 'low',
  regulatory: 'low' // Default unless industry-specific data
};
```

**Standard Mitigation Strategies:**
- Implement comprehensive risk monitoring
- Establish regular board oversight
- Develop contingency plans
- Build diverse revenue streams
- Strengthen management team

---

## Error Handling

### Missing Profile Data
- Performs analysis with available data
- Lower confidence score (60-70%)
- Generic recommendations
- Notes data limitations

### Invalid Analysis Type
- Returns 400 error
- Clear error message
- No analysis performed

### AI Generation Failure
- Rule-based fallback analysis
- Uses financial and management metrics
- Provides useful but generic insights
- Confidence: 70%

### Invalid Mode Parameter
- Defaults to 'investor' mode
- Logs warning
- Continues with analysis

---

## Performance Considerations

### Processing Time
- Typical: 2-4 seconds
- No external API calls
- Pure analysis of provided data

### No Caching
- Each analysis is profile-specific
- Results tied to unique business state
- Real-time analysis on every request

### Resource Usage
- Lightweight computation
- Single AI generation call
- No grounding or web searches

---

## Use Cases

### Investor Mode Use Cases
1. **Due Diligence:** Comprehensive risk evaluation before investment
2. **Portfolio Monitoring:** Ongoing risk assessment of investments
3. **Risk Comparison:** Compare risk profiles across opportunities
4. **Deal Screening:** Identify deal breakers early

### SME Mode Use Cases
1. **Pre-Application Audit:** Check readiness before applying
2. **Application Strengthening:** Identify areas to improve
3. **Concern Anticipation:** Prepare for funder questions
4. **Documentation Planning:** Know what evidence to gather

---

## Configuration

### Temperature: 0.2
- Very low for consistent, factual risk assessment
- Reduces subjective interpretation
- Focuses on data-driven analysis

### Model: Gemini 2.5 Flash
- Fast risk computation
- Good analytical reasoning
- Handles structured risk frameworks

### Max Tokens: 3072
- Sufficient for detailed risk breakdown
- Supports multiple risk categories
- Allows comprehensive recommendations

---

## Integration Points

### Upstream Dependencies
- **Profile Service:** Supplies complete business profile
- **Application Service:** Provides application context
- **Financial Service:** May provide additional financial data

### Downstream Consumers
- **AI Assistant Component:** Displays risk insights
- **Application Analysis:** Part of comprehensive evaluation
- **Dashboard:** Risk metrics and alerts

---

## Maintenance Notes

### Prompt Tuning Opportunities
- Adjust risk weighting by industry
- Refine scoring thresholds based on outcomes
- Enhance SME mode with funder feedback
- Add industry-specific risk factors

### Known Limitations
- Generic risk factors (not industry-specific yet)
- Relies on self-reported data accuracy
- No historical trend analysis
- SME mode assumes certain funder priorities

### Future Enhancements
- Industry-specific risk frameworks
- Historical risk tracking (trend analysis)
- Peer benchmarking (risk comparison)
- Automated risk monitoring alerts
- Regulatory database integration
- Third-party data verification
