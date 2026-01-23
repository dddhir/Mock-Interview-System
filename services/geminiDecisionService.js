const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiDecisionService {
    constructor() {
        const disabled = process.env.GEMINI_API_DISABLED;
        const hasKey = !!process.env.GOOGLE_GENAI_API_KEY;
        this.apiAvailable = disabled !== 'true' && hasKey;

        console.log(`🤖 GeminiDecisionService Debug:`);
        console.log(`   GEMINI_API_DISABLED: "${disabled}"`);
        console.log(`   Has API Key: ${hasKey}`);
        console.log(`   API Available: ${this.apiAvailable}`);
    }

    async decideNextAction(currentQuestion, answer, availableQuestions, sessionContext) {
        if (!this.apiAvailable || process.env.TEST_MODE === 'true') {
            return this.fallbackDecision(availableQuestions, sessionContext);
        }

        try {
            console.log('🤖 Asking Gemini to decide next interview action...');

            const prompt = `You are an expert technical interviewer. Based on the candidate's answer, decide what to do next.

CURRENT CONTEXT:
- Question: "${currentQuestion}"
- Candidate Answer: "${answer}"
- Role: ${sessionContext.role}
- Experience Level: ${sessionContext.experience}
- Questions Asked: ${sessionContext.questionsAsked}
- Current Round: ${sessionContext.currentRound}

AVAILABLE RAG QUESTIONS (top 3 most relevant):
${availableQuestions.slice(0, 3).map((q, i) =>
                `${i + 1}. "${q.question}" (Topic: ${q.role}, Similarity: ${q.similarity?.toFixed(3)})`
            ).join('\n')}

DECISION OPTIONS:
1. CONTINUE - Ask a follow-up question (use one of the available questions)
2. SWITCH_TOPIC - Move to different technical topic (use different question)  
3. NEXT_ROUND - Candidate has shown sufficient knowledge, move to next round

GUIDELINES:
- If answer is good and shows understanding: CONTINUE or SWITCH_TOPIC
- If answer covers topic well: SWITCH_TOPIC to explore other areas
- If 4+ technical questions asked: consider NEXT_ROUND
- For senior roles: expect deeper answers before switching

Respond with ONLY one word: CONTINUE, SWITCH_TOPIC, or NEXT_ROUND`;

            // Create fresh instance each time (like our working test)
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const result = await model.generateContent(prompt);
            const decision = result.response.text().trim().toUpperCase();

            console.log(`🤖 Gemini decision: ${decision}`);

            // Process the decision
            if (decision.includes('CONTINUE')) {
                return {
                    action: 'continue',
                    questionIndex: 0, // Use most relevant question
                    reasoning: 'Gemini decided to continue with follow-up questions'
                };
            } else if (decision.includes('SWITCH_TOPIC')) {
                // Find a question with different topic
                const currentTopic = currentQuestion.toLowerCase();
                let differentTopicIndex = availableQuestions.findIndex(q =>
                    q.role && !q.role.toLowerCase().includes(currentTopic) &&
                    !currentTopic.includes(q.role.toLowerCase())
                );

                if (differentTopicIndex === -1) differentTopicIndex = 1; // Fallback to second question

                return {
                    action: 'switch_topic',
                    questionIndex: Math.min(differentTopicIndex, availableQuestions.length - 1),
                    reasoning: 'Gemini decided to switch to a different topic'
                };
            } else {
                return {
                    action: 'next_round',
                    questionIndex: -1,
                    reasoning: 'Gemini decided to move to next round'
                };
            }

        } catch (error) {
            console.error('Gemini decision error, using fallback:', error.message);
            return this.fallbackDecision(availableQuestions, sessionContext);
        }
    }

    fallbackDecision(availableQuestions, sessionContext) {
        console.log('🔄 Using intelligent fallback decision logic');

        // Smart fallback logic
        if (sessionContext.questionsAsked < 3) {
            // Early in interview - continue asking
            return {
                action: 'continue',
                questionIndex: 0,
                reasoning: 'Fallback: Early in interview, continuing with questions'
            };
        } else if (sessionContext.questionsAsked < 5 && availableQuestions.length > 1) {
            // Mid interview - switch topics for variety
            return {
                action: 'switch_topic',
                questionIndex: 1,
                reasoning: 'Fallback: Switching topic for variety'
            };
        } else {
            // Later in interview - move to next round
            return {
                action: 'next_round',
                questionIndex: -1,
                reasoning: 'Fallback: Sufficient questions asked, moving to next round'
            };
        }
    }

    async generateContextualQuestion(previousAnswer, company, role, experience, topic) {
        if (!this.apiAvailable) {
            return this.generateFallbackQuestion(company, role, experience, topic);
        }

        try {
            console.log('🤖 Gemini generating contextual follow-up question...');

            const prompt = `You are an expert technical interviewer for ${company}. Generate a relevant follow-up question based on the candidate's previous answer.

CONTEXT:
- Company: ${company}
- Role: ${role}
- Experience Level: ${experience}
- Previous Answer: "${previousAnswer}"
- Topic Area: ${topic}

REQUIREMENTS:
- Generate ONE specific technical question that builds on their answer
- Make it appropriate for ${experience} level at ${company}
- Focus on deeper understanding or practical application
- Should feel natural as a follow-up to their response
- Include specific technical concepts they mentioned

EXAMPLES:
- If they mentioned React: "How would you optimize React component re-renders in a large-scale application?"
- If they mentioned databases: "What indexing strategy would you use for this type of query at scale?"
- If they mentioned AWS: "How would you design the infrastructure for high availability?"

Generate ONLY the question text, no explanations:`;

            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const result = await model.generateContent(prompt);
            const generatedQuestion = result.response.text().trim();

            console.log(`🤖 Generated contextual question: "${generatedQuestion.substring(0, 60)}..."`);

            return {
                id: `gemini_contextual_${Date.now()}`,
                text: generatedQuestion,
                topic: topic,
                section: 'technical',
                difficulty: experience === 'fresher' ? 'Easy' : experience === 'senior' || experience === 'staff' ? 'Hard' : 'Medium',
                company: company,
                role: role,
                experience: experience,
                isGeminiGenerated: true,
                contextual: true
            };

        } catch (error) {
            console.error('Gemini question generation error:', error.message);
            return this.generateFallbackQuestion(company, role, experience, topic);
        }
    }

    generateFallbackQuestion(company, role, experience, topic) {
        const fallbackQuestions = [
            `How would you handle scalability challenges in a ${role.toLowerCase()} role at ${company}?`,
            `Describe your approach to debugging complex issues in ${topic} systems.`,
            `What best practices would you follow for ${topic} development at ${company}?`,
            `How would you optimize performance in a ${topic}-heavy application?`,
            `What testing strategies would you implement for ${topic} components?`
        ];

        const randomQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];

        return {
            id: `fallback_contextual_${Date.now()}`,
            text: randomQuestion,
            topic: topic,
            section: 'technical',
            difficulty: experience === 'fresher' ? 'Easy' : experience === 'senior' || experience === 'staff' ? 'Hard' : 'Medium',
            company: company,
            role: role,
            experience: experience,
            isFallbackGenerated: true,
            contextual: true
        };
    }

    async selectBestQuestion(availableQuestions, context) {
        // Simple selection based on similarity and topic diversity
        if (availableQuestions.length === 0) return null;
        if (availableQuestions.length === 1) return availableQuestions[0];

        // Prefer questions with higher similarity but different topics
        const usedTopics = context.usedTopics || [];

        let bestQuestion = availableQuestions[0];
        let bestScore = availableQuestions[0].similarity || 0;

        availableQuestions.forEach(q => {
            let score = q.similarity || 0;

            // Boost for new topics
            if (!usedTopics.includes(q.role)) {
                score += 0.3;
            }

            // Boost for appropriate difficulty
            if (context.experience === 'senior' && q.difficulty?.toLowerCase().includes('hard')) {
                score += 0.2;
            } else if (context.experience === 'entry' && q.difficulty?.toLowerCase().includes('easy')) {
                score += 0.2;
            }

            if (score > bestScore) {
                bestScore = score;
                bestQuestion = q;
            }
        });

        return bestQuestion;
    }
}

module.exports = new GeminiDecisionService();