const { GoogleGenerativeAI } = require('@google/generative-ai');

class AnswerEvaluator {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async evaluateAnswer(question, answer, context = {}) {
        try {
            const prompt = `You are a senior technical interviewer evaluating this answer.

Question: "${question}"
Candidate Answer: "${answer}"
Context: Role - ${context.role || 'Software Engineer'}, Experience - ${context.experience || 'Mid Level'}, Topic - ${context.topic || 'General'}

Score the answer from 0-5 on each dimension and provide detailed feedback:

Return ONLY valid JSON in this exact format:
{
  "correctness": <0-5>,
  "completeness": <0-5>, 
  "depth": <0-5>,
  "clarity": <0-5>,
  "overall": <0.0-1.0>,
  "missing_points": ["point1", "point2"],
  "confidence": "low|medium|high",
  "feedback": "detailed feedback explaining the score",
  "suggestions": "specific suggestions for improvement"
}

Scoring Guidelines:
- Correctness: Technical accuracy (0=wrong, 5=perfect)
- Completeness: Covers key points (0=missing everything, 5=comprehensive)
- Depth: Surface vs deep understanding (0=shallow, 5=expert level)
- Clarity: Communication quality (0=unclear, 5=crystal clear)
- Overall: Weighted average as decimal (0.0-1.0)
- Confidence: Interviewer's assessment of candidate's certainty`;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean and parse JSON response
            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            const evaluation = JSON.parse(cleanedResponse);

            // Validate and normalize scores
            evaluation.correctness = Math.max(0, Math.min(5, evaluation.correctness || 0));
            evaluation.completeness = Math.max(0, Math.min(5, evaluation.completeness || 0));
            evaluation.depth = Math.max(0, Math.min(5, evaluation.depth || 0));
            evaluation.clarity = Math.max(0, Math.min(5, evaluation.clarity || 0));
            evaluation.overall = Math.max(0, Math.min(1, evaluation.overall || 0));

            console.log(`📊 ANSWER EVALUATION:`);
            console.log(`   Correctness: ${evaluation.correctness}/5`);
            console.log(`   Completeness: ${evaluation.completeness}/5`);
            console.log(`   Depth: ${evaluation.depth}/5`);
            console.log(`   Clarity: ${evaluation.clarity}/5`);
            console.log(`   Overall: ${evaluation.overall.toFixed(2)}/1.0`);
            console.log(`   Confidence: ${evaluation.confidence}`);

            return evaluation;
        } catch (error) {
            console.error('Error evaluating answer:', error);

            // Fallback evaluation based on answer length and keywords
            const score = this.fallbackEvaluation(answer, question);
            return {
                correctness: score.correctness,
                completeness: score.completeness,
                depth: score.depth,
                clarity: score.clarity,
                overall: score.overall,
                missing_points: [],
                confidence: score.confidence,
                feedback: "Evaluation completed with fallback scoring.",
                suggestions: "Try to provide more detailed technical explanations."
            };
        }
    }

    fallbackEvaluation(answer, question) {
        const answerLength = answer.length;
        const wordCount = answer.split(/\s+/).length;

        // Technical keywords detection
        const techKeywords = ['algorithm', 'system', 'design', 'performance', 'scale', 'database', 'api', 'service', 'architecture', 'security'];
        const keywordCount = techKeywords.filter(keyword =>
            answer.toLowerCase().includes(keyword)
        ).length;

        // Basic scoring heuristics
        let correctness = Math.min(5, Math.max(1, Math.floor(keywordCount * 1.5) + 1));
        let completeness = Math.min(5, Math.max(1, Math.floor(wordCount / 10)));
        let depth = Math.min(5, Math.max(1, Math.floor(answerLength / 50) + keywordCount));
        let clarity = Math.min(5, Math.max(2, 5 - Math.floor(answerLength / 200))); // Penalize too long answers

        const overall = (correctness + completeness + depth + clarity) / 20; // Convert to 0-1

        const confidence = overall > 0.7 ? 'high' : overall > 0.4 ? 'medium' : 'low';

        return { correctness, completeness, depth, clarity, overall, confidence };
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
}

module.exports = new AnswerEvaluator();