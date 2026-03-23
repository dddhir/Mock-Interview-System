const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Ensure environment variables are loaded
const sanityCheckService = require('./sanityCheckService');
const auditLogger = require('./auditLogger');

class AnswerEvaluator {
    constructor() {
        console.log('🔑 Initializing AnswerEvaluator with API key:', process.env.GOOGLE_GENAI_API_KEY ? 'Present' : 'Missing');
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async evaluateAnswer(question, answer, context = {}) {
        try {
            console.log('🔍 Starting answer evaluation with enhanced sanity checks...');
            
            // Step 1: Basic pre-validation (existing)
            const preValidation = this.preValidateAnswer(answer);
            if (!preValidation.isValid) {
                console.log('❌ Answer failed pre-validation:', preValidation.reason);
                return {
                    correctness: 0,
                    completeness: 0,
                    depth: 0,
                    clarity: 0,
                    overall: 0.0,
                    score: 0,
                    feedback: preValidation.feedback,
                    confidence: "low",
                    missing_points: [preValidation.reason],
                    suggestions: "Please provide a meaningful, technical answer that addresses the question.",
                    strengths: [],
                    areas_for_improvement: ["Answer relevance", "Technical content", "Question comprehension"],
                    follow_up_topics: []
                };
            }
            
            // Step 2: Enhanced sanity checks (NEW)
            console.log('🔬 Running enhanced sanity checks...');
            const sanityChecks = sanityCheckService.validateAnswerQuality(answer, question, context);
            
            console.log(`   Length: ${sanityChecks.checks.length.wordCount} words (${sanityChecks.checks.length.category})`);
            console.log(`   Keywords: ${sanityChecks.checks.keywords.keywordCount} found (${sanityChecks.checks.keywords.category})`);
            console.log(`   Technical: ${sanityChecks.checks.technical.score} (${sanityChecks.checks.technical.category})`);
            console.log(`   Coherence: ${sanityChecks.checks.coherence.score} (${sanityChecks.checks.coherence.category})`);
            console.log(`   Gibberish: ${sanityChecks.checks.gibberish.probability} (${sanityChecks.checks.gibberish.category})`);
            
            // Step 3: Early rejection if needed
            if (sanityChecks.shouldRejectEarly) {
                console.log('❌ Early rejection triggered:', sanityChecks.rejectionReason);
                const rejectionResponse = sanityCheckService.generateEarlyRejectionResponse(sanityChecks);
                
                // Log early rejection
                await auditLogger.logEvaluation({
                    sessionId: context.sessionId,
                    userId: context.userId,
                    question: question,
                    answer: answer,
                    evaluation: rejectionResponse,
                    sanityChecks: sanityChecks.checks,
                    capsApplied: sanityChecks.scoreCaps,
                    adjustments: [],
                    wasRejectedEarly: true,
                    rejectionReason: sanityChecks.rejectionReason,
                    context: context
                });
                
                return rejectionResponse;
            }
            
            // Step 4: Gemini evaluation
            console.log('🤖 Proceeding to Gemini evaluation...');
            const evaluation = await this.geminiEvaluation(question, answer, context);
            
            // Step 5: Apply score caps
            console.log('🔒 Applying score caps...');
            const cappedEvaluation = sanityCheckService.applyScoreCaps(evaluation, sanityChecks.scoreCaps);
            
            if (cappedEvaluation.was_capped) {
                console.log('⚠️  Score adjustments applied:', cappedEvaluation.score_adjustments);
            }
            
            // Step 6: Validate consistency
            console.log('✓ Validating score consistency...');
            const validatedEvaluation = sanityCheckService.validateScoreConsistency(cappedEvaluation);
            
            // Step 7: Add sanity check metadata
            validatedEvaluation.sanity_checks = sanityChecks.checks;
            
            console.log(`✅ Final score: ${validatedEvaluation.score}/10 (Capped: ${validatedEvaluation.was_capped})`);
            
            // Step 8: Apply leniency (add points if low, don't reduce if high)
            console.log('💚 Applying leniency adjustment...');
            this.applyLeniency(validatedEvaluation);
            
            // Step 9: Log to audit system
            await auditLogger.logEvaluation({
                sessionId: context.sessionId,
                userId: context.userId,
                question: question,
                answer: answer,
                evaluation: validatedEvaluation,
                sanityChecks: sanityChecks.checks,
                capsApplied: sanityChecks.scoreCaps,
                adjustments: validatedEvaluation.score_adjustments || [],
                wasRejectedEarly: false,
                context: context
            });
            
            return validatedEvaluation;
            
        } catch (error) {
            console.error('Error in answer evaluation:', error);
            return await this.fallbackEvaluation(answer, question);
        }
    }

    preValidateAnswer(answer) {
        const trimmedAnswer = answer.trim().toLowerCase();
        const wordCount = answer.trim().split(/\s+/).length;
        
        // Check for too short answers
        if (wordCount < 5) {
            return {
                isValid: false,
                reason: "Answer too short - minimum 5 words required",
                feedback: "Your response is insufficient for evaluation. Please provide a comprehensive technical explanation with at least five words, including relevant concepts, examples, and detailed reasoning to demonstrate your understanding."
            };
        }
        
        // Check for meaningless answers
        const meaninglessPatterns = [
            /^(i don't know|idk|no idea|not sure|dunno)$/,
            /^(yes|no|ok|okay|done|skip|pass|next)$/,
            /^[a-z]\s*$/,  // Single letters
            /^\d+\s*$/,    // Just numbers
            /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/, // Just symbols
            /^(.)\1{10,}/, // Repeated characters (aaaaaaa...)
            /^(haha|lol|lmao|rofl|hehe)+$/,
            /^(test|testing|hello|hi|hey)$/
        ];
        
        for (const pattern of meaninglessPatterns) {
            if (pattern.test(trimmedAnswer)) {
                return {
                    isValid: false,
                    reason: "Non-meaningful answer detected",
                    feedback: "Your response lacks technical substance and meaningful content. Please provide a detailed technical explanation that demonstrates your understanding of the concepts, includes relevant terminology, and shows practical knowledge."
                };
            }
        }
        
        // Check for gibberish (high ratio of non-dictionary words)
        const words = trimmedAnswer.split(/\s+/);
        const commonWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
            // Technical words
            'javascript', 'react', 'node', 'html', 'css', 'api', 'database', 'function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'component', 'state', 'props', 'hook', 'class', 'method', 'algorithm', 'data', 'structure', 'system', 'design', 'performance', 'security', 'server', 'client', 'frontend', 'backend', 'framework', 'library', 'code', 'programming', 'development', 'software', 'application', 'web', 'mobile', 'user', 'interface', 'experience'
        ]);
        
        const recognizedWords = words.filter(word => {
            const cleanWord = word.replace(/[^a-z]/g, '');
            return cleanWord.length >= 2 && (commonWords.has(cleanWord) || cleanWord.length >= 4);
        });
        
        const recognitionRatio = recognizedWords.length / words.length;
        if (recognitionRatio < 0.4 && words.length > 3) {
            return {
                isValid: false,
                reason: "Answer appears to contain gibberish or non-technical content",
                feedback: "Your response contains unclear or non-technical content that cannot be properly evaluated. Please provide a clear, structured technical answer using appropriate terminology and complete sentences to demonstrate your knowledge."
            };
        }
        
        return { isValid: true };
    }

    async geminiEvaluation(question, answer, context = {}) {
        try {
            // Load environment variables explicitly
            require('dotenv').config();
            
            const prompt = `You are a strict technical interviewer evaluating this answer for a ${context.role || 'Software Engineer'} position at ${context.experience || 'Mid Level'} level.

Question: "${question}"
Candidate Answer: "${answer}"
Context: Role - ${context.role || 'Software Engineer'}, Experience - ${context.experience || 'Mid Level'}, Topic - ${context.topic || 'General'}

EVALUATION FRAMEWORK - Analyze each dimension independently:

1. TECHNICAL CORRECTNESS (0-5):
   - Are the facts and concepts accurate?
   - Are there any technical errors or misconceptions?
   - Does it use correct terminology?
   Score: 0=completely wrong, 1=mostly wrong, 2=partially correct, 3=mostly correct, 4=correct, 5=perfectly accurate

2. COMPLETENESS (0-5):
   - Does it address all parts of the question?
   - Are key concepts covered?
   - Is anything important missing?
   Score: 0=nothing covered, 1=minimal coverage, 2=partial coverage, 3=good coverage, 4=comprehensive, 5=exhaustive

3. DEPTH OF UNDERSTANDING (0-5):
   - Does it show real understanding or just memorization?
   - Are there examples or explanations of "why"?
   - Does it connect concepts?
   Score: 0=no understanding, 1=surface level, 2=basic understanding, 3=good understanding, 4=deep understanding, 5=expert level

4. CLARITY & COMMUNICATION (0-5):
   - Is it well-structured and easy to follow?
   - Is the explanation clear?
   - Is the language appropriate for the level?
   Score: 0=incomprehensible, 1=very unclear, 2=somewhat clear, 3=clear, 4=very clear, 5=crystal clear

CUSTOMIZED FEEDBACK REQUIREMENTS:
- Generate UNIQUE feedback based on the SPECIFIC answer content
- Mention ACTUAL words/phrases from the answer
- Identify SPECIFIC missing concepts (not generic)
- Provide CONCRETE examples of what to add
- Feedback must be 30-40 words and reference the actual answer

SCORING GUIDELINES:
- Be strict: 0-1 for wrong/gibberish, 2-3 for partial, 4-5 for excellent
- Most answers should score 2-4, not 4-5
- Consider the experience level (${context.experience || 'Mid Level'})

Return ONLY valid JSON:
{
  "correctness": <0-5>,
  "completeness": <0-5>, 
  "depth": <0-5>,
  "clarity": <0-5>,
  "overall": <0.0-1.0>,
  "score": <0-10>,
  "technical_accuracy_feedback": "Specific feedback on correctness - mention actual concepts from answer",
  "completeness_feedback": "Specific feedback on what's missing - name the missing concepts",
  "depth_feedback": "Specific feedback on understanding - reference actual explanations given",
  "clarity_feedback": "Specific feedback on communication - reference actual structure/wording",
  "missing_points": ["specific missing concept 1 with detail", "specific missing concept 2 with detail"],
  "confidence": "low|medium|high",
  "feedback": "30-40 words synthesizing all dimensions, mentioning specific parts of the answer",
  "suggestions": "Concrete, actionable steps referencing the actual answer content",
  "strengths": ["specific strength 1 with example from answer", "specific strength 2 with example"],
  "areas_for_improvement": ["specific area 1 with what to add", "specific area 2 with what to add"],
  "follow_up_topics": ["specific topic 1 based on gaps", "specific topic 2 based on gaps"],
  "answer_highlights": ["quote 1 from answer that was good", "quote 2 from answer that needs work"]
}`;

            // Create a fresh instance to avoid any caching issues
            const genAI = new (require('@google/generative-ai').GoogleGenerativeAI)(process.env.GOOGLE_GENAI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean and parse JSON response
            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            const evaluation = JSON.parse(cleanedResponse);

            // Validate and normalize scores (no artificial inflation)
            evaluation.correctness = Math.max(0, Math.min(5, evaluation.correctness || 0));
            evaluation.completeness = Math.max(0, Math.min(5, evaluation.completeness || 0));
            evaluation.depth = Math.max(0, Math.min(5, evaluation.depth || 0));
            evaluation.clarity = Math.max(0, Math.min(5, evaluation.clarity || 0));
            evaluation.overall = Math.max(0, Math.min(1, evaluation.overall || 0));
            evaluation.score = Math.max(0, Math.min(10, evaluation.score || Math.round(evaluation.overall * 10)));

            // Ensure arrays exist
            evaluation.missing_points = evaluation.missing_points || [];
            evaluation.strengths = evaluation.strengths || [];
            evaluation.areas_for_improvement = evaluation.areas_for_improvement || [];
            evaluation.follow_up_topics = evaluation.follow_up_topics || [];
            evaluation.answer_highlights = evaluation.answer_highlights || [];

            // Store dimension-specific feedback
            evaluation.dimension_feedback = {
                technical_accuracy: evaluation.technical_accuracy_feedback || "Technical accuracy assessed.",
                completeness: evaluation.completeness_feedback || "Completeness evaluated.",
                depth: evaluation.depth_feedback || "Depth of understanding reviewed.",
                clarity: evaluation.clarity_feedback || "Communication clarity checked."
            };

            // Synthesize main feedback from dimensions if not provided or too short
            if (!evaluation.feedback || evaluation.feedback.split(' ').length < 30) {
                const feedbackParts = [];
                
                // Add correctness feedback
                if (evaluation.correctness <= 2) {
                    feedbackParts.push(`Technical accuracy needs improvement (${evaluation.correctness}/5).`);
                } else if (evaluation.correctness >= 4) {
                    feedbackParts.push(`Technically accurate (${evaluation.correctness}/5).`);
                }
                
                // Add completeness feedback
                if (evaluation.completeness <= 2) {
                    feedbackParts.push(`Answer is incomplete (${evaluation.completeness}/5) - missing key concepts.`);
                } else if (evaluation.completeness >= 4) {
                    feedbackParts.push(`Comprehensive coverage (${evaluation.completeness}/5).`);
                }
                
                // Add depth feedback
                if (evaluation.depth <= 2) {
                    feedbackParts.push(`Lacks depth (${evaluation.depth}/5) - needs more explanation of how/why.`);
                } else if (evaluation.depth >= 4) {
                    feedbackParts.push(`Shows deep understanding (${evaluation.depth}/5).`);
                }
                
                // Add clarity feedback
                if (evaluation.clarity <= 2) {
                    feedbackParts.push(`Communication unclear (${evaluation.clarity}/5).`);
                } else if (evaluation.clarity >= 4) {
                    feedbackParts.push(`Well-communicated (${evaluation.clarity}/5).`);
                }
                
                evaluation.feedback = feedbackParts.join(' ');
            }

            // Validate feedback length (30-40 words)
            if (evaluation.feedback) {
                const words = evaluation.feedback.split(' ');
                if (words.length < 30) {
                    evaluation.feedback += " Consider providing more detailed explanations with specific examples and technical terminology to demonstrate deeper understanding.";
                } else if (words.length > 40) {
                    evaluation.feedback = words.slice(0, 40).join(' ') + '.';
                }
            }

            console.log(`📊 GEMINI EVALUATION:`);
            console.log(`   Correctness: ${evaluation.correctness}/5 - ${evaluation.dimension_feedback.technical_accuracy.substring(0, 50)}...`);
            console.log(`   Completeness: ${evaluation.completeness}/5 - ${evaluation.dimension_feedback.completeness.substring(0, 50)}...`);
            console.log(`   Depth: ${evaluation.depth}/5 - ${evaluation.dimension_feedback.depth.substring(0, 50)}...`);
            console.log(`   Clarity: ${evaluation.clarity}/5 - ${evaluation.dimension_feedback.clarity.substring(0, 50)}...`);
            console.log(`   Overall: ${evaluation.overall.toFixed(2)}/1.0 (${evaluation.score}/10)`);
            console.log(`   Confidence: ${evaluation.confidence}`);

            // Add metadata
            evaluation.ai_enhanced = false;
            evaluation.evaluation_method = 'gemini_multidimensional';

            return evaluation;
        } catch (error) {
            console.error('Error in Gemini evaluation:', error);
            return await this.fallbackEvaluation(answer, question);
        }
    }

    fallbackEvaluation(answer, question) {
        const answerLength = answer.trim().length;
        const wordCount = answer.trim().split(/\s+/).length;

        // Check for very short or meaningless answers
        if (wordCount < 5 || answerLength < 20) {
            return {
                correctness: 0,
                completeness: 0,
                depth: 0,
                clarity: 0,
                overall: 0.0,
                score: 0,
                confidence: 'low',
                feedback: 'Answer is too brief and lacks technical content. Please provide a more detailed explanation.',
                suggestions: 'Expand your answer with specific technical details and examples.',
                strengths: [],
                areas_for_improvement: ['Answer length', 'Technical detail', 'Completeness'],
                follow_up_topics: ['Basic concepts', 'Technical fundamentals']
            };
        }

        // Basic technical keywords detection (more comprehensive)
        const techKeywords = [
            'algorithm', 'system', 'design', 'performance', 'scale', 'database', 'api', 'service', 
            'architecture', 'security', 'javascript', 'react', 'node', 'html', 'css', 'function',
            'variable', 'array', 'object', 'component', 'state', 'props', 'method', 'class',
            'framework', 'library', 'server', 'client', 'frontend', 'backend', 'data', 'structure'
        ];
        
        const keywordCount = techKeywords.filter(keyword =>
            answer.toLowerCase().includes(keyword)
        ).length;

        // More realistic scoring based on content quality
        let correctness = Math.min(3, Math.max(0, keywordCount)); // Max 3/5 for keyword matching
        let completeness = Math.min(3, Math.max(0, Math.floor(wordCount / 15))); // More words = more complete
        let depth = Math.min(2, Math.max(0, Math.floor(keywordCount / 2))); // Depth requires multiple keywords
        let clarity = Math.min(3, Math.max(1, 4 - Math.floor(answerLength / 300))); // Penalize overly long answers

        const overall = (correctness + completeness + depth + clarity) / 20; // Convert to 0-1
        const score = Math.round(overall * 10);

        const confidence = overall > 0.6 ? 'medium' : overall > 0.3 ? 'low' : 'very low';

        return {
            correctness,
            completeness,
            depth,
            clarity,
            overall,
            score,
            confidence,
            feedback: `Your answer received ${score}/10. While you included some relevant content, the response needs more technical depth and specific examples. Consider expanding on key concepts with detailed explanations and practical applications to demonstrate comprehensive understanding.`,
            suggestions: 'Include more technical terminology and provide specific examples to demonstrate understanding.',
            strengths: keywordCount > 0 ? ['Uses some technical terms'] : [],
            areas_for_improvement: ['Technical depth', 'Specific examples', 'Comprehensive coverage'],
            follow_up_topics: ['Technical fundamentals', 'Best practices', 'Advanced concepts']
        };
    }

    isSatisfactory(evaluation) {
        return evaluation.correctness >= 3 &&
            evaluation.completeness >= 3 &&
            evaluation.clarity >= 3;
    }

    needsSimplification(evaluation) {
        return evaluation.correctness < 2 || evaluation.clarity < 2;
    }

    needsDeepening(evaluation) {
        return evaluation.correctness >= 3 &&
            evaluation.completeness >= 3 &&
            evaluation.depth < 3;
    }

    canIncreaseDifficulty(evaluation) {
        return evaluation.correctness >= 4 &&
            evaluation.completeness >= 4 &&
            evaluation.depth >= 3;
    }

    /**
     * Apply leniency to scoring - add points if score is below 8, but don't reduce if 8+
     * This encourages candidates while maintaining fairness
     */
    applyLeniency(evaluation) {
        const originalScore = evaluation.score;
        
        // Apply leniency if score is below 8
        if (originalScore < 8) {
            // Add 0.5-2 points based on score range
            let leniencyBonus = 0;
            
            if (originalScore <= 2) {
                leniencyBonus = 2;      // Add 2 points for very low scores
            } else if (originalScore <= 3) {
                leniencyBonus = 1.5;    // Add 1.5 points for low scores
            } else if (originalScore < 5) {
                leniencyBonus = 1;      // Add 1 point for below average scores
            } else if (originalScore < 6) {
                leniencyBonus = 0.5;    // Add 0.5 points for average scores
            } else if (originalScore < 8) {
                leniencyBonus = 0.5;    // Add 0.5 points for good scores (6-7)
            }
            
            evaluation.score = Math.min(10, Math.round((originalScore + leniencyBonus) * 2) / 2);
            evaluation.leniency_applied = true;
            evaluation.leniency_bonus = leniencyBonus;
            evaluation.original_score = originalScore;
            
            console.log(`💚 Leniency applied: ${originalScore} → ${evaluation.score} (+${leniencyBonus})`);
        } else {
            evaluation.leniency_applied = false;
            evaluation.leniency_bonus = 0;
            evaluation.original_score = originalScore;
        }
        
        return evaluation;
    }
}

module.exports = new AnswerEvaluator();