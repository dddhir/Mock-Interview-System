const express = require('express');
const multer = require('multer');
const Question = require('../models/Question');
const geminiService = require('../services/geminiService');
const companyRAGService = require('../services/companyRAGService');
const interviewStateManager = require('../services/interviewStateManager');
const answerEvaluator = require('../services/answerEvaluator');
const questionDecisionEngine = require('../services/questionDecisionEngine');
const resumeProcessor = require('../services/resumeProcessor');
const questionBankService = require('../services/questionBankService');
const geminiDecisionService = require('../services/geminiDecisionService');
const skillDatabase = require('../services/skillDatabase');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.'));
        }
    }
});



// Topic weights based on role
const getTopicWeights = (role, techStack = []) => {
    const baseWeights = {
        'backend': {
            'nodejs': 0.9, 'express': 0.8, 'database': 0.9, 'api': 0.8,
            'javascript': 0.7, 'python': 0.6, 'system-design': 0.8
        },
        'frontend': {
            'react': 0.9, 'javascript': 0.9, 'css': 0.8, 'html': 0.7,
            'typescript': 0.8, 'ui-ux': 0.7, 'performance': 0.6
        },
        'fullstack': {
            'javascript': 0.9, 'react': 0.8, 'nodejs': 0.8, 'database': 0.7,
            'api': 0.8, 'system-design': 0.6
        },
        'data-scientist': {
            'python': 0.9, 'machine-learning': 0.9, 'statistics': 0.8,
            'sql': 0.8, 'data-analysis': 0.9
        }
    };

    let weights = baseWeights[role.toLowerCase()] || baseWeights['fullstack'];

    // Boost weights for user's tech stack
    techStack.forEach(tech => {
        if (weights[tech.toLowerCase()]) {
            weights[tech.toLowerCase()] += 0.2;
        }
    });

    return weights;
};

// Weighted random selection
const selectTopicByWeight = (weights) => {
    const topics = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const topic of topics) {
        random -= weights[topic];
        if (random <= 0) return topic;
    }

    return topics[0];
};

// Initialize interview session (no authentication required)
router.post('/start', async (req, res) => {
    try {
        const { company, role, experience, skills, resumeContent, projects, workExperience, questionCount } = req.body;

        if (!company || !role || !experience) {
            return res.status(400).json({
                message: 'Company, role, and experience are required'
            });
        }

        const sessionId = uuidv4();
        const maxQuestions = Math.min(Math.max(questionCount || 10, 1), 20); // Clamp between 1-20

        // Create enhanced user profile with comprehensive resume data
        const resumeData = {
            content: resumeContent || '',
            skills: skills || [],
            projects: projects || [],
            experience: workExperience || []
        };

        console.log('📄 Starting interview:');
        console.log(`   Company: ${company}`);
        console.log(`   Role: ${role}`);
        console.log(`   Experience: ${experience}`);
        console.log(`   Max Questions: ${maxQuestions}`);
        console.log(`   Skills: ${skills?.length || 0}`);
        console.log(`   Projects: ${projects?.length || 0}`);
        console.log(`   Work Experience: ${workExperience?.length || 0}`);

        // Get FIRST question from company dataset (not personalized)
        let initialQuestion;
        try {
            initialQuestion = await companyRAGService.getInitialQuestion(
                company,
                role,
                experience,
                skills || [],
                []
            );
            console.log(`✅ First question from ${company} dataset`);
        } catch (error) {
            console.error('Error getting company question:', error);
            return res.status(404).json({
                message: `No questions available for ${company}`
            });
        }

        // Create user profile for state manager
        const userProfile = {
            id: 'test-user-123',
            role,
            experience,
            skills: skills || [],
            company,
            resumeData: resumeData
        };

        // Create interview state
        const interviewState = interviewStateManager.createSession(sessionId, userProfile);
        interviewState.company = company;
        interviewState.skills = skills || [];
        interviewState.resumeData = resumeData;
        interviewState.maxQuestions = maxQuestions;
        interviewState.currentQuestion = {
            id: initialQuestion.id,
            text: initialQuestion.text,
            topic: initialQuestion.topic,
            section: initialQuestion.section,
            difficulty: initialQuestion.difficulty || 'Medium'
        };

        // Create new interview session
        const newSession = {
            sessionId,
            company,
            role,
            experience,
            skills: skills || [],
            resumeData: resumeData,
            maxQuestions: maxQuestions,
            currentRound: 'technical',
            questionsAsked: [],
            totalScore: 0,
            status: 'active',
            currentQuestion: interviewState.currentQuestion
        };

        // Store session in global memory
        if (!global.testSessions) global.testSessions = [];
        global.testSessions.push(newSession);
        console.log(`✅ Created interview session: ${sessionId} (max ${maxQuestions} questions)`);

        res.json({
            success: true,
            sessionId,
            question: initialQuestion,
            maxQuestions: maxQuestions,
            message: `Interview started! ${maxQuestions} questions from ${company}`
        });

    } catch (error) {
        console.error('Start interview error:', error);
        res.status(500).json({ message: 'Server error starting interview' });
    }
});

// Submit answer and get next question
router.post('/submit-answer', async (req, res) => {
    try {
        const { sessionId, questionId, answer } = req.body;

        if (!sessionId || !questionId || !answer) {
            return res.status(400).json({
                message: 'Session ID, question ID, and answer are required'
            });
        }

        // Validate answer length and content
        if (answer.trim().length < 10) {
            return res.status(400).json({
                message: 'Please provide a more detailed answer (minimum 10 characters)'
            });
        }

        // Check for non-meaningful answers
        const meaninglessAnswers = ['done', 'ok', 'yes', 'no', 'idk', 'skip', 'pass'];
        if (meaninglessAnswers.includes(answer.trim().toLowerCase())) {
            return res.status(400).json({
                message: 'Please provide a meaningful technical answer to the question'
            });
        }

        // Mock user and find session (in-memory for testing)
        const user = {
            id: 'test-user-123',
            skills: ['javascript', 'react', 'nodejs', 'python', 'mongodb'],
            resume: {
                content: 'Experienced software engineer with 3 years of experience in React, Node.js, and MongoDB.',
                filename: 'test-resume.pdf'
            },
            interviewSessions: global.testSessions || []
        };

        const session = user.interviewSessions.find(s => s.sessionId === sessionId);

        if (!session || session.status !== 'active') {
            return res.status(404).json({ message: 'Active session not found' });
        }

        // Get the question details (either from DB or current session)
        let questionText;
        let questionTopic;

        console.log('Processing answer for questionId:', questionId);
        console.log('Session currentQuestion:', session.currentQuestion);

        if (questionId === 'generated' || !questionId || questionId.includes('_')) {
            // This is a generated question or company RAG question, get it from session
            questionText = session.currentQuestion?.text || 'Generated question';
            questionTopic = session.currentQuestion?.topic || 'general';
        } else {
            // This is a database question (MongoDB ObjectId format)
            try {
                const question = await Question.findById(questionId);
                if (!question) {
                    // Fallback to session if not found in DB
                    questionText = session.currentQuestion?.text || 'Question not found';
                    questionTopic = session.currentQuestion?.topic || 'general';
                } else {
                    questionText = question.questionText;
                    questionTopic = question.topic;
                }
            } catch (error) {
                // Invalid ObjectId format, use session data
                console.log('Using session data for questionId:', questionId);
                questionText = session.currentQuestion?.text || 'Question not found';
                questionTopic = session.currentQuestion?.topic || 'general';
            }
        }

        // Get interview state
        const interviewState = interviewStateManager.getSession(sessionId);

        // Simple answer evaluation (focus on RAG, not complex feedback)
        let evaluation;

        // Basic scoring based on answer quality indicators
        const answerLength = answer.length;
        const wordCount = answer.split(/\s+/).length;
        const techKeywords = ['system', 'design', 'performance', 'scale', 'database', 'api', 'service', 'architecture', 'security', 'cache', 'load', 'balance'];
        const keywordCount = techKeywords.filter(keyword => answer.toLowerCase().includes(keyword)).length;

        // Calculate score based on length, keywords, and structure
        let score = 5; // Base score
        if (wordCount >= 20) score += 1;
        if (wordCount >= 50) score += 1;
        if (keywordCount >= 2) score += 1;
        if (keywordCount >= 4) score += 1;
        if (answer.includes('example') || answer.includes('instance')) score += 1;

        // Add some randomness for variety
        score += Math.floor(Math.random() * 2);
        score = Math.min(10, Math.max(3, score));

        evaluation = {
            score: score,
            feedback: `Score: ${score}/10. ${score >= 7 ? 'Good technical answer!' : score >= 5 ? 'Adequate response.' : 'Could use more detail.'}`,
            suggestions: "Continue with the interview.",
            followUpTopics: []
        };

        console.log(`📊 Quick evaluation: ${score}/10 (${wordCount} words, ${keywordCount} tech keywords)`);

        // Update interview state with new Q&A
        if (interviewState) {
            const currentQuestion = {
                text: questionText,
                topic: questionTopic,
                difficulty: session.currentQuestion?.difficulty || 'Medium'
            };

            interviewStateManager.addQuestionAnswer(
                sessionId,
                currentQuestion,
                answer,
                evaluation.detailed || { overall: evaluation.score / 10 }
            );
        }

        // Add Q&A to session for compatibility
        const qaEntry = {
            question: questionText,
            answer,
            score: evaluation.score,
            feedback: evaluation.feedback,
            topic: questionTopic,
            timestamp: new Date()
        };

        session.questionsAsked.push(qaEntry);
        session.totalScore += evaluation.score;

        // Extract already asked questions to avoid repetition
        const alreadyAsked = session.questionsAsked.map(qa => qa.question);
        console.log(`📊 Progress: ${session.questionsAsked.length}/${session.maxQuestions || 10} questions`);

        let nextQuestion = null;
        let sessionComplete = false;
        const maxQuestions = session.maxQuestions || 10;
        const questionsAnswered = session.questionsAsked.length;

        // Check if we've reached max questions
        if (questionsAnswered >= maxQuestions) {
            sessionComplete = true;
            session.status = 'completed';
            console.log(`🎉 Interview complete!`);
        } else {
            // Step 1: Ask Gemini if the answer was satisfactory for their level
            let shouldMoveToNextTopic = false;
            let geminiSuggestion = null;

            try {
                console.log('🤖 Asking Gemini to evaluate answer...');
                const evalPrompt = `You are interviewing a ${session.experience} level candidate for ${session.role}.

Question: "${questionText}"
Answer: "${answer}"

Is this answer satisfactory for a ${session.experience} level candidate?
Reply ONLY with JSON: {"satisfied": true/false, "nextTopic": "suggested topic", "reason": "brief reason"}`;

                const genAI = new (require('@google/generative-ai').GoogleGenerativeAI)(process.env.GOOGLE_GENAI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(evalPrompt);
                const evalResponse = result.response.text().trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
                geminiSuggestion = JSON.parse(evalResponse);
                shouldMoveToNextTopic = geminiSuggestion.satisfied;
                console.log(`🤖 Gemini: ${shouldMoveToNextTopic ? 'Move to next topic' : 'Need follow-up'}`);
            } catch (error) {
                console.log('Gemini eval skipped:', error.message);
                shouldMoveToNextTopic = true;
            }

            // Step 2: Build search terms from user profile
            const userSkills = session.skills || [];
            const searchTerms = geminiSuggestion?.nextTopic
                ? [geminiSuggestion.nextTopic, ...userSkills]
                : userSkills;

            console.log(`🔍 Searching for: ${searchTerms.slice(0, 3).join(', ')}...`);

            // Step 3: Search company CSV first
            let relevantQuestions = await companyRAGService.findRelevantQuestions(
                session.company,
                searchTerms.join(' ') || answer,
                { role: session.role, experience: session.experience, skills: userSkills },
                10,
                alreadyAsked
            );

            // Step 4: If no questions, search other companies
            if (relevantQuestions.length === 0) {
                console.log(`⚠️ No questions in ${session.company}, trying others...`);
                const others = ['google', 'microsoft', 'amazon', 'meta'].filter(c => c !== session.company.toLowerCase());

                for (const other of others) {
                    relevantQuestions = await companyRAGService.findRelevantQuestions(
                        other, searchTerms.join(' ') || answer,
                        { role: session.role, experience: session.experience, skills: userSkills },
                        5, alreadyAsked
                    );
                    if (relevantQuestions.length > 0) {
                        console.log(`✅ Found in ${other}`);
                        break;
                    }
                }
            }

            // Step 5: Select question from CSV
            if (relevantQuestions.length > 0) {
                const idx = Math.floor(Math.random() * Math.min(relevantQuestions.length, 3));
                const selected = relevantQuestions[idx];
                nextQuestion = {
                    id: `csv_${Date.now()}`,
                    text: selected.question,
                    topic: selected.role || 'Technical',
                    section: 'technical',
                    difficulty: selected.difficulty || 'Medium'
                };
                console.log(`✅ CSV: "${nextQuestion.text.substring(0, 50)}..."`);
            }

            // Step 6: Gemini fallback ONLY if no CSV questions
            if (!nextQuestion) {
                console.log('⚠️ No CSV questions, Gemini fallback...');
                try {
                    const ctx = await geminiDecisionService.generateContextualQuestion(
                        answer, session.company, session.role, session.experience,
                        geminiSuggestion?.nextTopic || 'technical'
                    );
                    if (ctx?.text) {
                        nextQuestion = {
                            id: `gemini_${Date.now()}`,
                            text: ctx.text,
                            topic: ctx.topic || 'Technical',
                            section: 'technical',
                            difficulty: 'Medium'
                        };
                        console.log(`✅ Gemini: "${nextQuestion.text.substring(0, 50)}..."`);
                    }
                } catch (e) {
                    console.log('Gemini failed:', e.message);
                }
            }

            // Step 7: Final fallback
            if (!nextQuestion) {
                try {
                    nextQuestion = await companyRAGService.getInitialQuestion(
                        session.company, session.role, session.experience, [], alreadyAsked
                    );
                } catch (e) {
                    sessionComplete = true;
                    session.status = 'completed';
                }
            }
        }

        if (nextQuestion) session.currentQuestion = nextQuestion;

        const response = {
            success: true,
            evaluation,
            sessionComplete,
            questionsAsked: session.questionsAsked.length,
            maxQuestions: session.maxQuestions || 10,
            totalScore: session.totalScore
        };

        if (nextQuestion && !sessionComplete) {
            response.nextQuestion = nextQuestion;
        }

        if (sessionComplete) {
            const avgScore = session.totalScore / Math.max(session.questionsAsked.length, 1);
            response.finalFeedback = {
                overallScore: avgScore.toFixed(1),
                totalQuestions: session.questionsAsked.length,
                performance: avgScore >= 7 ? 'Excellent' : avgScore >= 5 ? 'Good' : 'Needs Improvement',
                message: `Interview completed! You answered ${session.questionsAsked.length} questions with an average score of ${avgScore.toFixed(1)}/10`
            };
        }

        console.log(`✅ Response: ${sessionComplete ? 'Interview Complete' : `Next question ready (${session.questionsAsked.length}/${session.maxQuestions || 10})`}`);
        res.json(response);

    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ message: 'Server error processing answer' });
    }
});

// Get interview session details
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Find session in global memory (for testing)
        const sessions = global.testSessions || [];
        const session = sessions.find(s => s.sessionId === sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({
            success: true,
            session
        });

    } catch (error) {
        console.error('Get session error:', error);
        res.status(500).json({ message: 'Server error fetching session' });
    }
});

// Get user's interview history
router.get('/history', async (req, res) => {
    try {
        // Return sessions from global memory (for testing)
        const sessions = global.testSessions || [];

        res.json({
            success: true,
            sessions: sessions
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: 'Server error fetching history' });
    }
});

// Test resume processing (for testing)
router.post('/test-resume-processing', async (req, res) => {
    try {
        const { resumeContent, role, company } = req.body;

        if (!resumeContent) {
            return res.status(400).json({
                message: 'Resume content is required'
            });
        }

        console.log('📄 Testing resume processing...');

        // Extract resume information
        const resumeInfo = await resumeProcessor.extractResumeInformation(resumeContent);

        // Generate project questions if projects exist
        let projectQuestions = [];
        if (resumeInfo.projects && resumeInfo.projects.length > 0) {
            const projectQs = await resumeProcessor.generateProjectQuestions(
                resumeInfo.projects,
                role || 'Software Engineer',
                company || 'Tech Company'
            );
            projectQuestions = projectQs.questions || [];
        }

        // Generate experience questions if experience exists
        let experienceQuestions = [];
        if (resumeInfo.experience && resumeInfo.experience.length > 0) {
            const expQs = await resumeProcessor.generateExperienceQuestions(
                resumeInfo.experience,
                role || 'Software Engineer',
                company || 'Tech Company'
            );
            experienceQuestions = expQs.questions || [];
        }

        // Get sample questions from question bank
        const sampleHRQuestion = questionBankService.getRandomHRQuestion();
        const sampleProjectQuestion = questionBankService.getRandomProjectExperienceQuestion();

        res.json({
            success: true,
            resumeInfo: resumeInfo,
            generatedQuestions: {
                projectQuestions: projectQuestions,
                experienceQuestions: experienceQuestions
            },
            sampleQuestions: {
                hrQuestion: sampleHRQuestion,
                projectQuestion: sampleProjectQuestion
            },
            questionBankStats: questionBankService.getStats(),
            message: 'Resume processing completed successfully'
        });

    } catch (error) {
        console.error('Resume processing test error:', error);
        res.status(500).json({
            message: 'Server error processing resume',
            error: error.message
        });
    }
});

// Search skills for autocomplete
router.get('/skills/search', async (req, res) => {
    try {
        const { q, limit } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                skills: [],
                message: 'Query too short'
            });
        }

        const skills = skillDatabase.searchSkills(q, parseInt(limit) || 10);

        res.json({
            success: true,
            skills: skills,
            query: q,
            count: skills.length
        });

    } catch (error) {
        console.error('Skill search error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search skills',
            error: error.message
        });
    }
});

// Get all skills by category
router.get('/skills/categories', async (req, res) => {
    try {
        const categories = skillDatabase.getSkillsByCategory();

        res.json({
            success: true,
            categories: categories,
            totalSkills: skillDatabase.getAllSkills().length
        });

    } catch (error) {
        console.error('Skills categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get skill categories',
            error: error.message
        });
    }
});

// Process resume upload
router.post('/process-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No resume file uploaded'
            });
        }

        console.log(`📄 Processing resume: ${req.file.originalname} (${req.file.mimetype})`);

        // Initialize resume processor if needed
        if (!resumeProcessor.initialized) {
            await resumeProcessor.initialize();
        }

        // Process the resume
        const result = await resumeProcessor.processResume(req.file.buffer, req.file.mimetype);

        res.json({
            success: true,
            message: 'Resume processed successfully',
            skills: result.skills,
            projects: result.projects,
            experience: result.experience,
            education: result.education,
            summary: result.summary,
            content: result.content,
            stats: {
                wordCount: result.wordCount,
                characterCount: result.characterCount,
                skillsFound: result.skills.length,
                projectsFound: result.projects?.length || 0,
                experienceFound: result.experience?.length || 0,
                educationFound: result.education?.length || 0
            }
        });

    } catch (error) {
        console.error('Resume processing error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to process resume',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get available companies
router.get('/companies', async (req, res) => {
    try {
        const companies = companyRAGService.getAvailableCompanies();
        const stats = companyRAGService.getStats();

        res.json({
            success: true,
            companies: companies,
            totalCompanies: companies.length,
            totalQuestions: stats.totalQuestions,
            stats: stats
        });
    } catch (error) {
        console.error('Get companies error:', error);
        res.status(500).json({ message: 'Server error fetching companies' });
    }
});

module.exports = router;