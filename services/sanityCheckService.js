/**
 * Sanity Check Service
 * Implements comprehensive validation and score capping rules
 * to prevent over-scoring and ensure fair evaluation
 */

class SanityCheckService {
    constructor() {
        // Technical keywords database by domain
        this.technicalKeywords = {
            javascript: ['function', 'variable', 'const', 'let', 'var', 'arrow', 'callback', 'promise', 'async', 'await', 'closure', 'scope', 'hoisting', 'prototype', 'this', 'bind', 'call', 'apply'],
            react: ['component', 'jsx', 'props', 'state', 'hook', 'usestate', 'useeffect', 'virtual dom', 'reconciliation', 'lifecycle', 'render', 'context', 'redux', 'fiber'],
            nodejs: ['express', 'middleware', 'route', 'server', 'http', 'request', 'response', 'stream', 'buffer', 'event loop', 'callback', 'module', 'npm', 'package'],
            database: ['sql', 'nosql', 'query', 'index', 'schema', 'table', 'document', 'collection', 'join', 'transaction', 'acid', 'normalization', 'mongodb', 'postgresql'],
            algorithms: ['complexity', 'big o', 'time', 'space', 'sorting', 'searching', 'recursion', 'dynamic programming', 'greedy', 'divide and conquer', 'graph', 'tree', 'hash'],
            'system-design': ['scalability', 'load balancing', 'caching', 'microservices', 'api', 'rest', 'distributed', 'consistency', 'availability', 'partition', 'cap theorem', 'sharding'],
            general: ['algorithm', 'data structure', 'performance', 'optimization', 'design pattern', 'architecture', 'security', 'testing', 'debugging', 'refactoring']
        };

        // Transition words for coherence
        this.transitionWords = [
            'however', 'therefore', 'moreover', 'furthermore', 'additionally',
            'consequently', 'meanwhile', 'nevertheless', 'thus', 'hence',
            'for example', 'for instance', 'in addition', 'on the other hand',
            'as a result', 'in contrast', 'similarly', 'likewise'
        ];

        // Common filler words
        this.fillerWords = [
            'um', 'uh', 'er', 'ah', 'like', 'you know', 'i mean',
            'sort of', 'kind of', 'basically', 'actually', 'literally'
        ];
    }

    /**
     * Main validation method - performs all sanity checks
     */
    validateAnswerQuality(answer, question, context = {}) {
        const results = {
            timestamp: new Date(),
            answer: answer,
            question: question,
            context: context,
            checks: {},
            scoreCaps: {},
            shouldRejectEarly: false,
            rejectionReason: null
        };

        // Run all checks
        results.checks.length = this.checkLength(answer);
        results.checks.keywords = this.calculateKeywordDensity(answer, context.topic);
        results.checks.technical = this.assessTechnicalContent(answer, context.topic);
        results.checks.coherence = this.calculateCoherenceScore(answer);
        results.checks.gibberish = this.detectGibberish(answer);

        // Determine if early rejection is needed
        if (results.checks.gibberish.probability > 0.6) {
            results.shouldRejectEarly = true;
            results.rejectionReason = 'High gibberish probability detected';
        }

        // Determine score caps based on checks
        results.scoreCaps = this.determineScoreCaps(results.checks);

        return results;
    }

    /**
     * Check answer length and categorize
     */
    checkLength(answer) {
        const wordCount = answer.trim().split(/\s+/).length;
        const charCount = answer.trim().length;

        let category = 'ADEQUATE';
        if (wordCount < 20) category = 'VERY_SHORT';
        else if (wordCount < 50) category = 'SHORT';

        return {
            wordCount,
            charCount,
            category,
            passed: wordCount >= 20,
            threshold: 20
        };
    }

    /**
     * Calculate keyword density
     */
    calculateKeywordDensity(answer, topic = 'general') {
        const answerLower = answer.toLowerCase();
        const words = answer.trim().split(/\s+/);
        const totalWords = words.length;

        // Get relevant keywords for topic
        const relevantKeywords = this.technicalKeywords[topic] || this.technicalKeywords.general;
        
        // Count keyword occurrences
        const foundKeywords = relevantKeywords.filter(keyword => 
            answerLower.includes(keyword.toLowerCase())
        );

        const keywordCount = foundKeywords.length;
        const density = totalWords > 0 ? (keywordCount / totalWords) : 0;

        let category = 'ADEQUATE';
        if (keywordCount === 0) category = 'NO_KEYWORDS';
        else if (density < 0.02) category = 'LOW_DENSITY';

        return {
            keywordCount,
            totalWords,
            density: parseFloat(density.toFixed(4)),
            category,
            foundKeywords,
            passed: keywordCount > 0,
            threshold: 0.02
        };
    }

    /**
     * Assess technical content quality
     */
    assessTechnicalContent(answer, topic = 'general') {
        const answerLower = answer.toLowerCase();
        
        // Get domain-specific keywords
        const domainKeywords = this.technicalKeywords[topic] || this.technicalKeywords.general;
        const domainMatches = domainKeywords.filter(kw => answerLower.includes(kw.toLowerCase()));
        
        // Check for concept explanations (words like "because", "since", "therefore")
        const explanationWords = ['because', 'since', 'therefore', 'thus', 'hence', 'as a result', 'due to'];
        const hasExplanation = explanationWords.some(word => answerLower.includes(word));
        
        // Check for examples (words like "example", "instance", "such as")
        const exampleWords = ['example', 'instance', 'such as', 'like', 'for instance'];
        const hasExample = exampleWords.some(word => answerLower.includes(word));
        
        // Calculate technical score
        const domainScore = Math.min(1.0, domainMatches.length / 5); // Max at 5 keywords
        const explanationScore = hasExplanation ? 0.3 : 0;
        const exampleScore = hasExample ? 0.2 : 0;
        const depthScore = answer.length > 100 ? 0.1 : 0;
        
        const technicalScore = (
            domainScore * 0.4 +
            explanationScore +
            exampleScore +
            depthScore
        );

        let category = 'ADEQUATE';
        if (technicalScore === 0) category = 'NO_TECHNICAL';
        else if (technicalScore < 0.3) category = 'LOW_TECHNICAL';

        return {
            score: parseFloat(technicalScore.toFixed(2)),
            category,
            domainMatches: domainMatches.length,
            hasExplanation,
            hasExample,
            passed: technicalScore >= 0.3,
            threshold: 0.3
        };
    }

    /**
     * Calculate coherence score
     */
    calculateCoherenceScore(answer) {
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = answer.trim().split(/\s+/);
        
        // Sentence structure score
        const avgSentenceLength = words.length / Math.max(sentences.length, 1);
        const structureScore = (avgSentenceLength >= 8 && avgSentenceLength <= 30) ? 0.3 : 0.15;
        
        // Transition words score
        const answerLower = answer.toLowerCase();
        const transitionCount = this.transitionWords.filter(word => 
            answerLower.includes(word)
        ).length;
        const transitionScore = Math.min(0.3, transitionCount * 0.1);
        
        // Logical flow (check for repeated words - indicates focus)
        const wordFreq = {};
        words.forEach(word => {
            const clean = word.toLowerCase().replace(/[^a-z]/g, '');
            if (clean.length > 3) {
                wordFreq[clean] = (wordFreq[clean] || 0) + 1;
            }
        });
        const repeatedWords = Object.values(wordFreq).filter(count => count > 1).length;
        const flowScore = Math.min(0.2, repeatedWords * 0.02);
        
        // Topic consistency (no excessive filler words)
        const fillerCount = this.fillerWords.filter(filler => 
            answerLower.includes(filler)
        ).length;
        const consistencyScore = fillerCount < 3 ? 0.2 : 0.1;
        
        const coherenceScore = structureScore + transitionScore + flowScore + consistencyScore;

        let category = 'ADEQUATE';
        if (coherenceScore < 0.3) category = 'INCOHERENT';
        else if (coherenceScore < 0.5) category = 'POOR';

        return {
            score: parseFloat(coherenceScore.toFixed(2)),
            category,
            sentenceCount: sentences.length,
            avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
            transitionCount,
            fillerCount,
            passed: coherenceScore >= 0.5,
            threshold: 0.5
        };
    }

    /**
     * Detect gibberish probability
     */
    detectGibberish(answer) {
        const words = answer.trim().split(/\s+/);
        const totalWords = words.length;
        
        // Common English words (expanded from pre-validation)
        const commonWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which',
            'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
            'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than',
            'too', 'very', 'just', 'also', 'even', 'back', 'because', 'before', 'after', 'above',
            'below', 'between', 'through', 'during', 'into', 'from', 'about', 'against', 'among'
        ]);
        
        // Technical words
        const allTechnicalWords = new Set();
        Object.values(this.technicalKeywords).forEach(keywords => {
            keywords.forEach(kw => allTechnicalWords.add(kw.toLowerCase()));
        });
        
        // Count non-dictionary words
        const nonDictionaryWords = words.filter(word => {
            const clean = word.toLowerCase().replace(/[^a-z]/g, '');
            return clean.length >= 2 && 
                   !commonWords.has(clean) && 
                   !allTechnicalWords.has(clean) &&
                   clean.length < 15; // Very long words might be technical
        });
        
        const nonDictionaryRatio = nonDictionaryWords.length / Math.max(totalWords, 1);
        
        // Check for repeated characters (aaaa, bbbb)
        const repeatedChars = (answer.match(/(.)\1{3,}/g) || []).length;
        const repeatedRatio = repeatedChars / Math.max(answer.length, 1);
        
        // Check for lack of structure (no punctuation)
        const hasPunctuation = /[.!?,;:]/.test(answer);
        const structureScore = hasPunctuation ? 0 : 0.3;
        
        // Calculate gibberish probability
        const gibberishProbability = (
            nonDictionaryRatio * 0.4 +
            repeatedRatio * 0.3 +
            structureScore
        );

        let category = 'LOW_PROBABILITY';
        if (gibberishProbability > 0.6) category = 'HIGH_PROBABILITY';
        else if (gibberishProbability > 0.4) category = 'MEDIUM_PROBABILITY';

        return {
            probability: parseFloat(gibberishProbability.toFixed(2)),
            category,
            nonDictionaryWords: nonDictionaryWords.length,
            nonDictionaryRatio: parseFloat(nonDictionaryRatio.toFixed(2)),
            repeatedChars,
            hasPunctuation,
            passed: gibberishProbability < 0.4,
            threshold: 0.4
        };
    }

    /**
     * Determine score caps based on all checks
     */
    determineScoreCaps(checks) {
        const caps = {
            correctness: 5,
            completeness: 5,
            depth: 5,
            clarity: 5,
            overall: 10
        };

        // Apply length-based caps
        if (checks.length.category === 'VERY_SHORT') {
            caps.completeness = Math.min(caps.completeness, 2);
            caps.depth = Math.min(caps.depth, 1);
        } else if (checks.length.category === 'SHORT') {
            caps.completeness = Math.min(caps.completeness, 3);
            caps.depth = Math.min(caps.depth, 2);
        }

        // Apply keyword density caps
        if (checks.keywords.category === 'NO_KEYWORDS') {
            caps.correctness = Math.min(caps.correctness, 1);
            caps.depth = Math.min(caps.depth, 1);
        } else if (checks.keywords.category === 'LOW_DENSITY') {
            caps.correctness = Math.min(caps.correctness, 2);
            caps.depth = Math.min(caps.depth, 2);
        }

        // Apply technical content caps
        if (checks.technical.category === 'NO_TECHNICAL') {
            caps.correctness = Math.min(caps.correctness, 1);
            caps.completeness = Math.min(caps.completeness, 2);
        } else if (checks.technical.category === 'LOW_TECHNICAL') {
            caps.correctness = Math.min(caps.correctness, 3);
            caps.completeness = Math.min(caps.completeness, 3);
        }

        // Apply coherence caps
        if (checks.coherence.category === 'INCOHERENT') {
            caps.clarity = Math.min(caps.clarity, 1);
            caps.depth = Math.min(caps.depth, 1);
        } else if (checks.coherence.category === 'POOR') {
            caps.clarity = Math.min(caps.clarity, 2);
            caps.depth = Math.min(caps.depth, 2);
        }

        // Apply gibberish caps (most severe)
        if (checks.gibberish.category === 'HIGH_PROBABILITY') {
            caps.correctness = 0;
            caps.completeness = 0;
            caps.depth = 0;
            caps.clarity = 0;
            caps.overall = 0;
        } else if (checks.gibberish.category === 'MEDIUM_PROBABILITY') {
            caps.correctness = Math.min(caps.correctness, 1);
            caps.completeness = Math.min(caps.completeness, 1);
            caps.depth = Math.min(caps.depth, 1);
            caps.clarity = Math.min(caps.clarity, 1);
        }

        // Calculate overall cap
        caps.overall = Math.round((caps.correctness + caps.completeness + caps.depth + caps.clarity) / 4 * 2);

        return caps;
    }

    /**
     * Apply score caps to evaluation
     */
    applyScoreCaps(evaluation, caps) {
        const adjustments = [];

        // Apply caps to each dimension
        if (evaluation.correctness > caps.correctness) {
            adjustments.push(`Correctness capped from ${evaluation.correctness} to ${caps.correctness}`);
            evaluation.correctness = caps.correctness;
        }

        if (evaluation.completeness > caps.completeness) {
            adjustments.push(`Completeness capped from ${evaluation.completeness} to ${caps.completeness}`);
            evaluation.completeness = caps.completeness;
        }

        if (evaluation.depth > caps.depth) {
            adjustments.push(`Depth capped from ${evaluation.depth} to ${caps.depth}`);
            evaluation.depth = caps.depth;
        }

        if (evaluation.clarity > caps.clarity) {
            adjustments.push(`Clarity capped from ${evaluation.clarity} to ${caps.clarity}`);
            evaluation.clarity = caps.clarity;
        }

        // Recalculate overall score
        const newOverall = (evaluation.correctness + evaluation.completeness + evaluation.depth + evaluation.clarity) / 20;
        const newScore = Math.round(newOverall * 10);

        if (newScore < evaluation.score) {
            adjustments.push(`Overall score adjusted from ${evaluation.score} to ${newScore}`);
            evaluation.overall = newOverall;
            evaluation.score = newScore;
        }

        // Add adjustment metadata
        evaluation.score_adjustments = adjustments;
        evaluation.caps_applied = caps;
        evaluation.was_capped = adjustments.length > 0;

        return evaluation;
    }

    /**
     * Validate score consistency (post-evaluation check)
     */
    validateScoreConsistency(evaluation) {
        const issues = [];

        // Check if dimensions are correlated reasonably
        const avgDimension = (evaluation.correctness + evaluation.completeness + evaluation.depth + evaluation.clarity) / 4;
        const variance = [
            Math.abs(evaluation.correctness - avgDimension),
            Math.abs(evaluation.completeness - avgDimension),
            Math.abs(evaluation.depth - avgDimension),
            Math.abs(evaluation.clarity - avgDimension)
        ];
        const maxVariance = Math.max(...variance);

        if (maxVariance > 3) {
            issues.push('High variance between dimensions detected');
        }

        // Check if overall score matches dimensions
        const expectedOverall = (evaluation.correctness + evaluation.completeness + evaluation.depth + evaluation.clarity) / 20;
        const overallDiff = Math.abs(evaluation.overall - expectedOverall);

        if (overallDiff > 0.1) {
            issues.push('Overall score does not match dimension scores');
            evaluation.overall = expectedOverall;
            evaluation.score = Math.round(expectedOverall * 10);
        }

        evaluation.consistency_issues = issues;
        evaluation.is_consistent = issues.length === 0;

        return evaluation;
    }

    /**
     * Generate early rejection response
     */
    generateEarlyRejectionResponse(sanityChecks) {
        return {
            correctness: 0,
            completeness: 0,
            depth: 0,
            clarity: 0,
            overall: 0.0,
            score: 0,
            feedback: "Your response does not meet minimum quality standards for evaluation. Please provide a clear, technical answer with proper structure and relevant content.",
            confidence: "low",
            missing_points: [sanityChecks.rejectionReason],
            suggestions: "Provide a meaningful technical answer with proper terminology, structure, and explanation.",
            strengths: [],
            areas_for_improvement: ["Answer quality", "Technical content", "Coherence"],
            follow_up_topics: [],
            sanity_checks: sanityChecks.checks,
            was_rejected_early: true,
            rejection_reason: sanityChecks.rejectionReason
        };
    }
}

module.exports = new SanityCheckService();
