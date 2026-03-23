# Advanced Feedback System - Design Document

## Feature #1: Enhanced Deterministic Sanity Checks

### Overview
Implement comprehensive hard rules to prevent over-scoring and ensure fair evaluation. This builds on existing pre-validation but adds more sophisticated checks, audit logging, and score capping mechanisms.

### Architecture

```
Answer Input
    ↓
Pre-Validation (existing)
    ↓
Enhanced Sanity Checks (NEW)
    ├─ Length-based checks
    ├─ Keyword density analysis
    ├─ Technical content validation
    ├─ Coherence scoring
    └─ Score capping rules
    ↓
Gemini Evaluation
    ↓
Post-Evaluation Sanity Checks (NEW)
    ├─ Score consistency validation
    ├─ Dimension correlation checks
    └─ Final score adjustment
    ↓
Audit Logging (NEW)
    ↓
Final Score + Feedback
```

### Components

#### 1. Enhanced Pre-Validation Service
**File**: `services/sanityCheckService.js`

**Responsibilities**:
- Comprehensive answer validation
- Technical content analysis
- Keyword density calculation
- Coherence scoring
- Score cap determination

**Methods**:
```javascript
class SanityCheckService {
  // Pre-evaluation checks
  validateAnswerQuality(answer, question, context)
  calculateKeywordDensity(answer, expectedKeywords)
  assessTechnicalContent(answer, topic)
  calculateCoherenceScore(answer)
  determineScoreCaps(validationResults)
  
  // Post-evaluation checks
  validateScoreConsistency(evaluation)
  checkDimensionCorrelation(evaluation)
  applyScoreCaps(evaluation, caps)
  
  // Audit
  logSanityCheck(answer, checks, result)
}
```

#### 2. Audit Logging System
**File**: `services/auditLogger.js`

**Responsibilities**:
- Log all sanity check results
- Track score adjustments
- Store validation failures
- Generate audit reports

**Schema**:
```javascript
{
  timestamp: Date,
  sessionId: String,
  questionId: String,
  answer: String,
  checks: {
    lengthCheck: { passed: Boolean, value: Number, threshold: Number },
    keywordCheck: { passed: Boolean, density: Number, threshold: Number },
    technicalCheck: { passed: Boolean, score: Number, threshold: Number },
    coherenceCheck: { passed: Boolean, score: Number, threshold: Number }
  },
  scoreCaps: {
    correctness: Number,
    completeness: Number,
    depth: Number,
    clarity: Number
  },
  originalScore: Number,
  adjustedScore: Number,
  adjustmentReason: String
}
```

#### 3. Score Capping Rules Engine
**File**: `services/scoreCapRules.js`

**Rules**:
```javascript
const SCORE_CAP_RULES = {
  // Length-based caps
  LENGTH_RULES: {
    VERY_SHORT: { threshold: 20, caps: { completeness: 2, depth: 1 } },
    SHORT: { threshold: 50, caps: { completeness: 3, depth: 2 } },
    ADEQUATE: { threshold: 100, caps: null }
  },
  
  // Keyword density caps
  KEYWORD_RULES: {
    NO_KEYWORDS: { threshold: 0, caps: { correctness: 1, depth: 1 } },
    LOW_DENSITY: { threshold: 0.02, caps: { correctness: 2, depth: 2 } },
    ADEQUATE: { threshold: 0.05, caps: null }
  },
  
  // Technical content caps
  TECHNICAL_RULES: {
    NO_TECHNICAL: { threshold: 0, caps: { correctness: 1, completeness: 2 } },
    LOW_TECHNICAL: { threshold: 0.3, caps: { correctness: 3, completeness: 3 } },
    ADEQUATE: { threshold: 0.5, caps: null }
  },
  
  // Coherence caps
  COHERENCE_RULES: {
    INCOHERENT: { threshold: 0.3, caps: { clarity: 1, depth: 1 } },
    POOR: { threshold: 0.5, caps: { clarity: 2, depth: 2 } },
    ADEQUATE: { threshold: 0.7, caps: null }
  },
  
  // Gibberish detection
  GIBBERISH_RULES: {
    HIGH_PROBABILITY: { threshold: 0.6, caps: { all: 0 } },
    MEDIUM_PROBABILITY: { threshold: 0.4, caps: { all: 1 } },
    LOW_PROBABILITY: { threshold: 0.2, caps: null }
  }
};
```

### Implementation Details

#### Step 1: Create Sanity Check Service

**Key Algorithms**:

1. **Keyword Density Calculation**:
```javascript
keywordDensity = (technicalKeywords.length / totalWords) * 100
```

2. **Technical Content Score**:
```javascript
technicalScore = (
  domainKeywords * 0.4 +
  conceptMentions * 0.3 +
  exampleProvided * 0.2 +
  explanationDepth * 0.1
)
```

3. **Coherence Score**:
```javascript
coherenceScore = (
  sentenceStructure * 0.3 +
  logicalFlow * 0.3 +
  transitionWords * 0.2 +
  topicConsistency * 0.2
)
```

4. **Gibberish Probability**:
```javascript
gibberishScore = (
  nonDictionaryWords / totalWords * 0.4 +
  repeatedCharacters * 0.3 +
  lackOfStructure * 0.3
)
```

#### Step 2: Integrate with Answer Evaluator

**Modified Flow**:
```javascript
async evaluateAnswer(question, answer, context) {
  // 1. Existing pre-validation
  const preValidation = this.preValidateAnswer(answer);
  
  // 2. NEW: Enhanced sanity checks
  const sanityChecks = await sanityCheckService.validateAnswerQuality(
    answer, question, context
  );
  
  // 3. Determine score caps
  const scoreCaps = sanityCheckService.determineScoreCaps(sanityChecks);
  
  // 4. If severe issues, return early
  if (sanityChecks.shouldRejectEarly) {
    return sanityCheckService.generateEarlyRejectionResponse(sanityChecks);
  }
  
  // 5. Gemini evaluation
  const evaluation = await this.geminiEvaluation(question, answer, context);
  
  // 6. Apply score caps
  const cappedEvaluation = sanityCheckService.applyScoreCaps(
    evaluation, scoreCaps
  );
  
  // 7. Post-evaluation validation
  const validated = sanityCheckService.validateScoreConsistency(
    cappedEvaluation
  );
  
  // 8. Audit logging
  await auditLogger.logEvaluation(answer, sanityChecks, validated);
  
  return validated;
}
```

#### Step 3: Add Audit Dashboard

**Admin Endpoint**: `/api/admin/audit`

**Features**:
- View all sanity check logs
- Filter by date, session, score adjustments
- Export audit reports
- View score adjustment statistics

### Data Flow

```
1. Answer Submitted
   ↓
2. Pre-Validation (existing)
   - Minimum length check
   - Meaningless pattern detection
   - Gibberish detection
   ↓
3. Enhanced Sanity Checks (NEW)
   - Calculate keyword density
   - Assess technical content
   - Score coherence
   - Determine score caps
   ↓
4. Early Rejection Check
   - If gibberish > 0.6 → Return 0
   - If length < 20 → Cap scores
   - If no keywords → Cap scores
   ↓
5. Gemini Evaluation
   - Get dimension scores
   - Get feedback
   ↓
6. Apply Score Caps (NEW)
   - Cap each dimension per rules
   - Adjust overall score
   - Add adjustment note to feedback
   ↓
7. Post-Evaluation Validation (NEW)
   - Check dimension correlation
   - Validate score consistency
   - Flag anomalies
   ↓
8. Audit Logging (NEW)
   - Log all checks
   - Log adjustments
   - Store for analysis
   ↓
9. Return Final Evaluation
```

### Configuration

**Environment Variables**:
```env
# Sanity Check Thresholds
SANITY_MIN_LENGTH=20
SANITY_MIN_KEYWORD_DENSITY=0.02
SANITY_MIN_TECHNICAL_SCORE=0.3
SANITY_MIN_COHERENCE=0.5
SANITY_GIBBERISH_THRESHOLD=0.6

# Audit Settings
AUDIT_ENABLED=true
AUDIT_LOG_PATH=./logs/audit
AUDIT_RETENTION_DAYS=90
```

### Testing Strategy

#### Unit Tests
1. Test each sanity check independently
2. Test score capping logic
3. Test audit logging
4. Test edge cases

#### Integration Tests
1. Test full evaluation flow with caps
2. Test early rejection scenarios
3. Test audit log generation
4. Test admin dashboard

#### Test Cases
```javascript
describe('Sanity Check Service', () => {
  test('Very short answer caps completeness to 2', () => {
    const answer = "React is a library";
    const caps = determineCaps(answer);
    expect(caps.completeness).toBe(2);
  });
  
  test('No technical keywords caps correctness to 1', () => {
    const answer = "It is very good and nice thing";
    const caps = determineCaps(answer);
    expect(caps.correctness).toBe(1);
  });
  
  test('High gibberish probability returns 0', () => {
    const answer = "asdfgh qwerty zxcvbn";
    const result = validateAnswer(answer);
    expect(result.score).toBe(0);
  });
});
```

### Performance Considerations

- **Keyword extraction**: Cache common technical keywords
- **Coherence analysis**: Use lightweight NLP, not heavy models
- **Audit logging**: Async, non-blocking
- **Score capping**: O(1) lookup in rules engine

**Target Performance**:
- Sanity checks: < 100ms
- Score capping: < 10ms
- Audit logging: < 50ms (async)
- Total overhead: < 200ms

### Monitoring & Alerts

**Metrics to Track**:
- Number of score adjustments per day
- Most common cap reasons
- Average adjustment magnitude
- Gibberish detection rate
- False positive rate

**Alerts**:
- Alert if adjustment rate > 30%
- Alert if gibberish rate > 10%
- Alert if average adjustment > 2 points

### Success Criteria

1. **Zero inflated scores** for short/gibberish answers
2. **100% audit coverage** of all evaluations
3. **< 5% false positives** (good answers capped incorrectly)
4. **< 200ms overhead** for sanity checks
5. **Admin dashboard** functional and useful

### Future Enhancements

1. Machine learning for better gibberish detection
2. Context-aware keyword lists per topic
3. Adaptive thresholds based on historical data
4. Real-time monitoring dashboard
5. Automated anomaly detection

---

## Next Steps

1. Implement `sanityCheckService.js`
2. Implement `auditLogger.js`
3. Implement `scoreCapRules.js`
4. Integrate with `answerEvaluator.js`
5. Create admin audit dashboard
6. Write comprehensive tests
7. Deploy and monitor

