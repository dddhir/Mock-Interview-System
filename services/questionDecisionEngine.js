const { GoogleGenerativeAI } = require('@google/generative-ai');

class QuestionDecisionEngine {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async decideNextAction(currentQuestion, userAnswer, evaluation, interviewState, availableQuestions) {
        try {
            const prompt = `You are a senior technical interviewer. Based on the candidate's answer, decide the next interview action.

CURRENT CONTEXT:
Question: "${currentQuestion.text}"
Topic: "${currentQuestion.topic}"
Difficulty: "${currentQuestion.difficulty}"
Candidate Answer: "${userAnswer}"

EVALUATION SCORES:
Correctness: ${evaluation.correctness}/5
Completeness: ${evaluation.completeness}/5  
Depth: ${evaluation.depth}/5
Clarity: ${evaluation.clarity}/5
Overall: ${evaluation.overall.toFixed(2)}/1.0
Confidence: ${evaluation.confidence}

INTERVIEW STATE:
Current Topic: ${interviewState.currentTopic}
Difficulty Level: ${interviewState.difficulty}
Confidence Score: ${interviewState.confidenceScore.toFixed(2)}
Depth Level: ${interviewState.depthLevel}
Topics Covered: ${JSON.stringify(interviewState.topicsCovered)}

AVAILABLE FOLLOW-UP QUESTIONS:
${availableQuestions.slice(0, 3).map((q, i) => `${i + 1}. "${q.question}" (${q.topic}, ${q.difficulty})`).join('\n')}

DECISION RULES:
- If incorrect (correctness < 3): ask simpler question on same topic
- If correct but shallow (depth < 3): ask deeper follow-up on same topic  
- If correct and deep (correctness >= 4, depth >= 3): increase difficulty OR move topic
- If unclear (clarity < 3): ask clarification question
- If topic mastered (avgScore >= 0.75, depth >= 2): move to next topic

Return ONLY valid JSON:
{
  "action": "follow_up|go_deeper|move_topic|increase_difficulty|clarify|complete_round",
  "reasoning": "why this decision was made",
  "nextTopic": "topic name if changing topics",
  "nextDifficulty": "difficulty level if changing",
  "useAvailableQuestion": true/false,
  "selectedQuestionIndex": 0-2,
  "customQuestion": "custom question text if needed"
}`;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            const decision = JSON.parse(cleanedResponse);

            console.log(`🧠 INTERVIEWER DECISION:`);
            console.log(`   Action: ${decision.action}`);
            console.log(`   Reasoning: ${decision.reasoning}`);
            if (decision.nextTopic) console.log(`   Next Topic: ${decision.nextTopic}`);
            if (decision.nextDifficulty) console.log(`   Next Difficulty: ${decision.nextDifficulty}`);

            return decision;
        } catch (error) {
            console.error('Error in decision engine:', error);
            return this.fallbackDecision(evaluation, interviewState, availableQuestions);
        }
    }

    fallbackDecision(evaluation, interviewState, availableQuestions) {
        console.log(`🔄 Using fallback decision logic`);

        // Simple rule-based decisions
        if (evaluation.correctness < 2) {
            return {
                action: "follow_up",
                reasoning: "Answer was incorrect, asking simpler follow-up",
                useAvailableQuestion: true,
                selectedQuestionIndex: 0
            };
        }

        if (evaluation.correctness >= 3 && evaluation.depth < 3) {
            return {
                action: "go_deeper",
                reasoning: "Answer was correct but shallow, going deeper",
                useAvailableQuestion: true,
                selectedQuestionIndex: 0
            };
        }

        if (evaluation.correctness >= 4 && evaluation.depth >= 3) {
            const shouldChangeTopic = interviewState.depthLevel >= 2 &&
                interviewState.topicsCovered[interviewState.currentTopic]?.avgScore >= 0.75;

            if (shouldChangeTopic) {
                return {
                    action: "move_topic",
                    reasoning: "Topic mastered, moving to new topic",
                    nextTopic: this.getNextTopic(interviewState),
                    useAvailableQuestion: true,
                    selectedQuestionIndex: 0
                };
            } else {
                return {
                    action: "increase_difficulty",
                    reasoning: "Good answer, increasing difficulty",
                    nextDifficulty: this.getNextDifficulty(interviewState.difficulty),
                    useAvailableQuestion: true,
                    selectedQuestionIndex: 0
                };
            }
        }

        return {
            action: "follow_up",
            reasoning: "Standard follow-up",
            useAvailableQuestion: true,
            selectedQuestionIndex: 0
        };
    }

    getNextTopic(interviewState) {
        const progression = {
            'Networking': 'System Design',
            'Databases': 'Distributed Systems',
            'APIs': 'Security',
            'System Design': 'Scalability',
            'Caching': 'Performance',
            'Security': 'Distributed Systems'
        };

        return progression[interviewState.currentTopic] || 'System Design';
    }

    getNextDifficulty(currentDifficulty) {
        const progression = {
            'Easy': 'Medium',
            'Easy-Medium': 'Medium',
            'Medium': 'Medium-Hard',
            'Medium-Hard': 'Hard',
            'Hard': 'Hard'
        };
        return progression[currentDifficulty] || currentDifficulty;
    }
}

module.exports = new QuestionDecisionEngine();