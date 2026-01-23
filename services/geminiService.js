const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.apiAvailable = false;

        if (process.env.GOOGLE_GENAI_API_KEY && process.env.GEMINI_API_DISABLED !== 'true') {
            try {
                this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
                // Use the working model
                this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                this.apiAvailable = true;
                console.log('🤖 Gemini API initialized (will test on first use)');
            } catch (error) {
                console.log('⚠️  Gemini API initialization failed, using fallback mode');
                this.apiAvailable = false;
            }
        } else {
            console.log('🧪 Gemini API disabled or no key provided, using fallback mode');
        }
    }

    async evaluateAnswer(question, answer, context = {}) {
        // Always use fallback in test mode or if API is disabled
        if (process.env.TEST_MODE === 'true' || process.env.GEMINI_API_DISABLED === 'true' || !this.apiAvailable) {
            console.log('🧪 Using enhanced fallback evaluation');
            return this.enhancedFallbackEvaluation(answer, question, context);
        }

        try {
            const prompt = `
        Evaluate this interview answer and provide feedback in JSON format:
        
        Question: "${question}"
        Answer: "${answer}"
        Context: Role - ${context.role || 'Software Engineer'}, Experience - ${context.experience || 'Entry Level'}
        
        Provide response in this exact JSON format:
        {
          "score": <number between 1-10>,
          "feedback": "<detailed feedback explaining strengths and areas for improvement>",
          "suggestions": "<specific suggestions for better answers>",
          "followUpTopics": ["<topic1>", "<topic2>"]
        }
        
        Consider:
        - Technical accuracy
        - Communication clarity
        - Depth of understanding
        - Relevance to the role
        - Areas for improvement
      `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean and parse JSON response
            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            const evaluation = JSON.parse(cleanedResponse);
            console.log('🤖 Gemini evaluation successful');
            return evaluation;

        } catch (error) {
            console.error('Gemini evaluation error, using fallback:', error.message);
            this.apiAvailable = false; // Disable API for future calls
            return this.enhancedFallbackEvaluation(answer, question, context);
        }
    }

    enhancedFallbackEvaluation(answer, question, context = {}) {
        const answerLength = answer.length;
        const wordCount = answer.split(/\s+/).length;

        // Technical keywords detection
        const techKeywords = [
            'algorithm', 'system', 'design', 'performance', 'scale', 'database', 'api',
            'service', 'architecture', 'security', 'cache', 'load', 'balance', 'microservice',
            'rest', 'graphql', 'sql', 'nosql', 'redis', 'mongodb', 'postgresql', 'mysql',
            'javascript', 'python', 'java', 'react', 'nodejs', 'express', 'docker', 'kubernetes',
            'aws', 'cloud', 'deployment', 'ci/cd', 'testing', 'optimization', 'scalability'
        ];

        const keywordCount = techKeywords.filter(keyword =>
            answer.toLowerCase().includes(keyword)
        ).length;

        // Quality indicators
        const hasExamples = /example|instance|case|scenario|situation/.test(answer.toLowerCase());
        const hasNumbers = /\d+/.test(answer);
        const hasComparisons = /versus|vs|compared|better|worse|advantage|disadvantage/.test(answer.toLowerCase());
        const hasTechnicalDepth = keywordCount >= 3;

        // Calculate base score
        let score = 5; // Start with middle score

        // Length and detail bonus
        if (wordCount >= 50) score += 1;
        if (wordCount >= 100) score += 1;

        // Technical content bonus
        if (keywordCount >= 2) score += 1;
        if (keywordCount >= 4) score += 1;

        // Quality indicators bonus
        if (hasExamples) score += 1;
        if (hasNumbers) score += 0.5;
        if (hasComparisons) score += 0.5;
        if (hasTechnicalDepth) score += 1;

        // Experience level adjustment
        if (context.experience === 'senior' && keywordCount < 2) score -= 1;
        if (context.experience === 'entry' && keywordCount >= 3) score += 0.5;

        // Ensure score is within bounds
        score = Math.min(10, Math.max(1, Math.round(score)));

        // Generate contextual feedback
        let feedback = `Your answer demonstrates ${score >= 7 ? 'good' : score >= 5 ? 'adequate' : 'basic'} understanding. `;

        if (keywordCount >= 3) {
            feedback += "You used relevant technical terminology effectively. ";
        } else {
            feedback += "Consider including more specific technical details. ";
        }

        if (hasExamples) {
            feedback += "Good use of examples to illustrate your points. ";
        } else {
            feedback += "Adding concrete examples would strengthen your answer. ";
        }

        // Generate suggestions
        let suggestions = [];
        if (wordCount < 30) suggestions.push("Provide more detailed explanations");
        if (keywordCount < 2) suggestions.push("Include more technical terminology");
        if (!hasExamples) suggestions.push("Use specific examples to illustrate concepts");
        if (!hasNumbers) suggestions.push("Include metrics or quantitative details when relevant");

        if (suggestions.length === 0) {
            suggestions.push("Continue providing detailed, technical responses");
        }

        return {
            score: score,
            feedback: feedback,
            suggestions: suggestions.join(", "),
            followUpTopics: this.extractFollowUpTopics(answer, keywordCount)
        };
    }

    extractFollowUpTopics(answer, keywordCount) {
        const topics = [];
        const lowerAnswer = answer.toLowerCase();

        if (lowerAnswer.includes('database') || lowerAnswer.includes('sql')) {
            topics.push('database optimization', 'indexing strategies');
        }
        if (lowerAnswer.includes('api') || lowerAnswer.includes('rest')) {
            topics.push('API design patterns', 'rate limiting');
        }
        if (lowerAnswer.includes('scale') || lowerAnswer.includes('performance')) {
            topics.push('scalability patterns', 'performance monitoring');
        }
        if (lowerAnswer.includes('cache') || lowerAnswer.includes('redis')) {
            topics.push('caching strategies', 'cache invalidation');
        }
        if (lowerAnswer.includes('security') || lowerAnswer.includes('auth')) {
            topics.push('security best practices', 'authentication methods');
        }

        // Default topics if none detected
        if (topics.length === 0) {
            topics.push('implementation details', 'best practices');
        }

        return topics.slice(0, 2); // Return max 2 topics
    }

    fallbackEvaluation(answer, question) {
        // Keep the old method for compatibility
        return {
            score: 5,
            feedback: "Unable to evaluate answer at this time.",
            suggestions: "Please try again.",
            followUpTopics: []
        };
    }

    async generateFollowUpQuestion(previousQ, userAnswer, userProfile, availableQuestions = []) {
        try {
            const prompt = `
        Based on the previous question and user's answer, decide the next action:
        
        Previous Question: "${previousQ}"
        User Answer: "${userAnswer}"
        User Profile: ${JSON.stringify(userProfile)}
        Available Similar Questions: ${JSON.stringify(availableQuestions.slice(0, 3))}
        
        Respond in JSON format:
        {
          "action": "CONTINUE" or "SATISFIED",
          "nextQuestion": "<question text if CONTINUE>",
          "reasoning": "<why this decision was made>",
          "topic": "<topic of next question if CONTINUE>"
        }
        
        Rules:
        - If answer is comprehensive and shows good understanding, return "SATISFIED"
        - If answer lacks depth or has gaps, return "CONTINUE" with a follow-up question
        - Use available similar questions when possible, or generate a new one
        - Keep questions relevant to the user's experience level
      `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error generating follow-up question:', error);
            return {
                action: "SATISFIED",
                nextQuestion: "",
                reasoning: "Error in question generation",
                topic: ""
            };
        }
    }

    async generateQuestionFromResume(resumeContent, role, company) {
        try {
            // Extract key information from resume first
            const resumeLength = resumeContent.length;
            const resumePreview = resumeContent.substring(0, 1000); // First 1000 chars for context

            const prompt = `
        Based on this resume content, generate specific project-based interview questions:
        
        Resume Content (${resumeLength} characters): "${resumePreview}${resumeLength > 1000 ? '...' : ''}"
        Target Role: "${role}"
        Company: "${company}"
        
        Analyze the resume and generate 3 personalized questions in JSON format:
        {
          "questions": [
            {
              "question": "<specific question about their experience/projects>",
              "topic": "<main topic from their background>",
              "difficulty": "medium",
              "reasoning": "<why this question is relevant to their experience>"
            }
          ]
        }
        
        Requirements:
        - Ask about SPECIFIC technologies, projects, or experiences mentioned in the resume
        - Reference actual work experience or projects they've done
        - Ask about challenges they might have faced in their projects
        - Focus on problem-solving and technical decisions
        - Make questions relevant to the target role
        
        Example good questions:
        - "I see you worked with React at [Company]. How did you handle state management in complex components?"
        - "Tell me about the [specific project] you mentioned. What was the biggest technical challenge?"
        - "You have experience with [technology]. How would you scale it for high traffic?"
      `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error generating resume-based questions:', error);
            return {
                questions: [{
                    question: "Tell me about a challenging project you worked on.",
                    topic: "project experience",
                    difficulty: "medium",
                    reasoning: "General project discussion"
                }]
            };
        }
    }

    async generateFinalFeedback(interviewSession) {
        // Generate fallback feedback if model not available
        const generateFallbackFeedback = () => {
            const avgScore = interviewSession.totalScore / Math.max(interviewSession.questionsAsked.length, 1);
            const performance = avgScore >= 8 ? 'Excellent' : avgScore >= 6 ? 'Good' : avgScore >= 4 ? 'Fair' : 'Needs Improvement';

            return {
                overallScore: avgScore,
                strengths: [
                    "Completed the interview session",
                    avgScore >= 6 ? "Demonstrated good technical knowledge" : "Showed willingness to learn"
                ],
                improvements: [
                    avgScore < 7 ? "Provide more detailed technical explanations" : "Continue building expertise",
                    "Practice explaining complex concepts clearly"
                ],
                recommendations: [
                    "Review core concepts for your target role",
                    "Practice with more mock interviews"
                ],
                nextSteps: [
                    "Study areas where you felt less confident",
                    "Build projects to strengthen practical skills"
                ],
                summary: `${performance} performance with an average score of ${avgScore.toFixed(1)}/10. Keep practicing!`
            };
        };

        if (!this.model || !this.apiAvailable) {
            return generateFallbackFeedback();
        }

        try {
            const prompt = `
        Provide comprehensive interview feedback based on this session:
        
        Role: ${interviewSession.role}
        Company: ${interviewSession.company}
        Questions & Answers: ${JSON.stringify(interviewSession.questionsAsked.slice(0, 10))}
        Total Score: ${interviewSession.totalScore}
        
        Provide detailed feedback in JSON format:
        {
          "overallScore": <average score>,
          "strengths": ["<strength1>", "<strength2>"],
          "improvements": ["<area1>", "<area2>"],
          "recommendations": ["<recommendation1>", "<recommendation2>"],
          "nextSteps": ["<step1>", "<step2>"],
          "summary": "<overall performance summary>"
        }
      `;

            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Error generating final feedback:', error);
            return generateFallbackFeedback();
        }
    }
}

module.exports = new GeminiService();