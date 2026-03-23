# Advanced Feedback System - Requirements

## Overview
Enhance the interview feedback system with grounded evaluation, semantic scoring, adaptive intelligence, and analytics to provide more accurate, consistent, and personalized feedback.

## User Stories

### Epic 1: Grounded Evaluation Layer
**As an** interviewer
**I want** answers evaluated against a reference knowledge base
**So that** scoring is consistent, fair, and based on objective criteria rather than subjective LLM judgment

#### Acceptance Criteria
- [ ] 1.1 Each question has a structured knowledge base with:
  - Ideal answer
  - Key concepts list (required)
  - Advanced concepts list (bonus)
  - Common mistakes list
- [ ] 1.2 System extracts concepts from candidate answer before LLM evaluation
- [ ] 1.3 System compares extracted concepts against expected concepts
- [ ] 1.4 System generates structured analysis:
  - Missing concepts
  - Covered concepts
  - Incorrect claims
- [ ] 1.5 Structured analysis is sent to Gemini for depth/reasoning evaluation
- [ ] 1.6 Completeness score is deterministic based on concept coverage

### Epic 2: Embedding-Based Semantic Scoring
**As a** system administrator
**I want** objective similarity scoring between candidate and ideal answers
**So that** scoring is less opinion-driven and more measurable

#### Acceptance Criteria
- [ ] 2.1 System generates embeddings for candidate answers
- [ ] 2.2 System generates embeddings for ideal answers
- [ ] 2.3 System calculates cosine similarity (0-1 scale)
- [ ] 2.4 Similarity score detects vague paraphrasing vs true coverage
- [ ] 2.5 Final completeness score combines:
  - 60% Gemini score
  - 40% similarity score
- [ ] 2.6 Depth estimation based on semantic similarity

### Epic 3: Communication Intelligence Metrics
**As a** candidate
**I want** quantitative communication metrics
**So that** I can see objective measures of my communication quality

#### Acceptance Criteria
- [ ] 3.1 System tracks words per minute (if voice-based)
- [ ] 3.2 System counts pause frequency
- [ ] 3.3 System detects filler words ("um", "like", "actually")
- [ ] 3.4 System measures sentence length variation
- [ ] 3.5 System calculates grammar error density
- [ ] 3.6 Communication metrics feed into clarity score
- [ ] 3.7 Metrics displayed as supporting evidence in feedback

### Epic 4: Adaptive Scoring by Role & Experience
**As a** candidate
**I want** scoring adapted to my role and experience level
**So that** expectations are appropriate and feedback is relevant

#### Acceptance Criteria
- [ ] 4.1 System adjusts dimension weights by role:
  - Fresher: Focus on correctness + basics
  - Senior: Emphasize depth + tradeoffs
  - System Design: Emphasize structure + scalability
- [ ] 4.2 System adjusts expected depth threshold by experience
- [ ] 4.3 System applies strictness multiplier based on level
- [ ] 4.4 Feedback references role-specific expectations
- [ ] 4.5 Scoring rubric dynamically adapts per interview

### Epic 5: Follow-Up Question Engine
**As an** interviewer
**I want** the system to ask probing follow-up questions
**So that** shallow explanations are challenged and depth is tested

#### Acceptance Criteria
- [ ] 5.1 System detects shallow explanations (low depth score)
- [ ] 5.2 System generates contextual follow-up questions
- [ ] 5.3 Follow-ups probe specific gaps identified
- [ ] 5.4 Example: "React uses Virtual DOM" → "Explain reconciliation"
- [ ] 5.5 Follow-up questions are relevant to original answer
- [ ] 5.6 System tracks follow-up answer quality separately

### Epic 6: Calibration & Score Normalization
**As a** system administrator
**I want** automated score calibration
**So that** scoring remains fair and consistent over time

#### Acceptance Criteria
- [ ] 6.1 System runs weekly benchmark testing
- [ ] 6.2 Predefined gold-standard answers stored
- [ ] 6.3 Statistical normalization applied if drift detected
- [ ] 6.4 Auto-scaling if average scores become inflated
- [ ] 6.5 Calibration reports generated weekly
- [ ] 6.6 Admin dashboard shows scoring trends

### Epic 7: Improvement Trajectory Analytics
**As a** candidate
**I want** to track my improvement over multiple interviews
**So that** I can see my progress and identify persistent weaknesses

#### Acceptance Criteria
- [ ] 7.1 System tracks dimension scores across interviews
- [ ] 7.2 Dashboard shows:
  - Depth score trend
  - Completeness improvement
  - Communication consistency
  - Concept mastery heatmap
- [ ] 7.3 System calculates improvement percentages
- [ ] 7.4 Insights like "Improved depth by 22% in last 5 interviews"
- [ ] 7.5 Visual charts show progress over time
- [ ] 7.6 Identifies consistently weak areas

### Epic 8: Mistake Pattern Recognition
**As a** candidate
**I want** the system to identify my repeated mistakes
**So that** I can focus on persistent weaknesses

#### Acceptance Criteria
- [ ] 8.1 System tracks repeated weaknesses across interviews:
  - Always missing trade-offs
  - Weak in concurrency questions
  - Poor structure in system design
- [ ] 8.2 Macro-feedback generated:
  - "You often explain 'what' but not 'why'"
  - "You consistently miss edge cases"
- [ ] 8.3 Pattern recognition uses minimum 3 interviews
- [ ] 8.4 Patterns displayed in profile/dashboard
- [ ] 8.5 Recommendations based on patterns

### Epic 9: Deterministic Sanity Checks
**As a** system administrator
**I want** hard rules to prevent over-scoring
**So that** inflated scores are impossible

#### Acceptance Criteria
- [ ] 9.1 If answer length < 20 words → cap completeness at 2/5
- [ ] 9.2 If incorrect core definition → cap correctness at 2/5
- [ ] 9.3 If gibberish probability > 0.6 → auto score 0
- [ ] 9.4 If no technical keywords → cap technical score at 1/5
- [ ] 9.5 Sanity checks logged for audit
- [ ] 9.6 Override mechanism for edge cases

### Epic 10: Model Self-Consistency Check
**As a** system administrator
**I want** LLM scoring validated for consistency
**So that** randomness is reduced and reliability improved

#### Acceptance Criteria
- [ ] 10.1 System calls Gemini twice for same answer
- [ ] 10.2 Scores compared for consistency
- [ ] 10.3 If difference > 2 points → average them
- [ ] 10.4 If difference > 3 points → flag for review
- [ ] 10.5 Consistency metrics tracked
- [ ] 10.6 Low consistency triggers re-evaluation

## Technical Requirements

### Performance
- Embedding generation: < 500ms per answer
- Concept extraction: < 200ms per answer
- Total evaluation time: < 5 seconds per answer
- Follow-up generation: < 2 seconds

### Data Storage
- Question knowledge base: JSON/MongoDB
- Embeddings: Vector database (Pinecone/Weaviate) or local storage
- Analytics: Time-series database for trends
- Patterns: Aggregated in user profile

### APIs & Services
- Embedding service: OpenAI/Cohere/local model
- Concept extraction: NLP library (spaCy/NLTK)
- Vector similarity: cosine similarity calculation
- Analytics: Aggregation pipeline

### Scalability
- Support 1000+ concurrent evaluations
- Store embeddings for 100k+ questions
- Track analytics for 10k+ users
- Pattern recognition across millions of answers

## Non-Functional Requirements

### Accuracy
- Concept extraction: 90%+ precision
- Semantic similarity: Correlation > 0.8 with human judgment
- Pattern recognition: 85%+ accuracy

### Consistency
- Score variance < 10% for same answer
- Calibration maintains fairness within 5% tolerance
- Deterministic checks prevent 100% of over-scoring

### Usability
- Analytics dashboard loads < 2 seconds
- Feedback displays all dimensions clearly
- Progress charts are interactive and intuitive

### Maintainability
- Knowledge base easily updatable
- Calibration runs automatically
- Monitoring alerts for drift

## Success Metrics

### Quantitative
- Reduce score variance by 50%
- Increase user satisfaction by 30%
- Improve feedback specificity by 40%
- Reduce false positives by 60%

### Qualitative
- Users report feedback is "fair and consistent"
- Users can track improvement clearly
- Feedback feels personalized to role/level
- System catches shallow answers effectively

## Dependencies

### External Services
- OpenAI API (embeddings)
- Gemini API (evaluation)
- Vector database (optional)

### Internal Services
- Question database
- User profile system
- Analytics pipeline
- Notification system

## Risks & Mitigations

### Risk 1: Embedding costs
**Mitigation**: Cache embeddings, use local models for high volume

### Risk 2: Knowledge base maintenance
**Mitigation**: Automated extraction from existing answers, crowdsourcing

### Risk 3: Complexity overhead
**Mitigation**: Phased rollout, feature flags, gradual migration

### Risk 4: Performance degradation
**Mitigation**: Async processing, caching, optimization

## Implementation Priority

### Phase 1 (High Priority - Weeks 1-2)
1. Grounded Evaluation Layer (Epic 1)
2. Deterministic Sanity Checks (Epic 9)
3. Adaptive Scoring by Role (Epic 4)

### Phase 2 (Medium Priority - Weeks 3-4)
4. Embedding-Based Semantic Scoring (Epic 2)
5. Communication Intelligence Metrics (Epic 3)
6. Model Self-Consistency Check (Epic 10)

### Phase 3 (Enhancement - Weeks 5-6)
7. Follow-Up Question Engine (Epic 5)
8. Improvement Trajectory Analytics (Epic 7)
9. Mistake Pattern Recognition (Epic 8)

### Phase 4 (Optimization - Weeks 7-8)
10. Calibration & Score Normalization (Epic 6)
11. Performance optimization
12. Advanced analytics features

## Open Questions

1. Which embedding model to use? (OpenAI vs local vs Cohere)
2. How to build initial knowledge base? (Manual vs automated)
3. Should follow-ups be optional or mandatory?
4. What's the minimum number of interviews for pattern recognition?
5. How to handle edge cases in deterministic checks?
6. Should we support voice-based answers initially?

## Notes

- Start with text-based answers, add voice later
- Knowledge base can start small and grow
- Analytics can be added incrementally
- Focus on accuracy before speed
- User feedback will guide prioritization
