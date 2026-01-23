class InterviewStateManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> state
    }

    createSession(sessionId, userProfile) {
        const initialState = {
            sessionId,
            userProfile,
            currentTopic: null,
            currentRole: userProfile.role,
            difficulty: this.getInitialDifficulty(userProfile.experience),
            questionsAsked: [],
            topicsCovered: {},
            confidenceScore: 0.5,
            depthLevel: 1,
            currentRound: 'technical', // technical -> project -> hr
            totalScore: 0,
            status: 'active',
            createdAt: new Date()
        };

        this.sessions.set(sessionId, initialState);
        console.log(`📊 Created interview state for ${sessionId}`);
        return initialState;
    }

    getInitialDifficulty(experience) {
        const difficultyMap = {
            'entry': 'Easy',
            'mid': 'Medium',
            'senior': 'Hard'
        };
        return difficultyMap[experience] || 'Medium';
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (session) {
            Object.assign(session, updates);
            console.log(`📊 Updated session ${sessionId}:`, updates);
        }
        return session;
    }

    addQuestionAnswer(sessionId, question, answer, evaluation) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const qaEntry = {
            question: question.text,
            answer,
            topic: question.topic,
            difficulty: question.difficulty,
            evaluation,
            timestamp: new Date()
        };

        session.questionsAsked.push(qaEntry);
        session.totalScore += evaluation.overall * 10; // Convert to 0-10 scale

        // Update topic coverage
        if (!session.topicsCovered[question.topic]) {
            session.topicsCovered[question.topic] = {
                attempts: 0,
                avgScore: 0,
                status: 'in-progress'
            };
        }

        const topicData = session.topicsCovered[question.topic];
        topicData.attempts++;
        topicData.avgScore = ((topicData.avgScore * (topicData.attempts - 1)) + evaluation.overall) / topicData.attempts;

        // Update topic status
        if (topicData.avgScore >= 0.75) {
            topicData.status = 'strong';
        } else if (topicData.avgScore >= 0.5) {
            topicData.status = 'pass';
        } else {
            topicData.status = 'weak';
        }

        // Update confidence score (weighted average)
        const recentWeight = 0.3;
        session.confidenceScore = (session.confidenceScore * (1 - recentWeight)) + (evaluation.overall * recentWeight);

        console.log(`📊 Session ${sessionId} updated:`, {
            topic: question.topic,
            score: evaluation.overall,
            confidence: session.confidenceScore.toFixed(2),
            topicStatus: topicData.status
        });

        return session;
    }

    shouldIncreaseDepth(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || session.questionsAsked.length < 2) return false;

        const recentAnswers = session.questionsAsked.slice(-2);
        return recentAnswers.every(qa => qa.evaluation.overall >= 0.6);
    }

    shouldChangeTopic(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.currentTopic) return false;

        const topicData = session.topicsCovered[session.currentTopic];
        return topicData && topicData.avgScore >= 0.75 && session.depthLevel >= 2;
    }

    shouldIncreaseDifficulty(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return false;

        return this.shouldIncreaseDepth(sessionId) && session.confidenceScore >= 0.7;
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

    getTopicProgression() {
        return {
            'Networking': ['System Design', 'Distributed Systems'],
            'Databases': ['Indexing', 'Transactions', 'Distributed Systems'],
            'APIs': ['Security', 'Scalability'],
            'System Design': ['Scalability', 'Distributed Systems'],
            'Caching': ['Performance', 'Scalability'],
            'Security': ['Distributed Systems', 'Scalability'],
            'Concurrency': ['Distributed Systems', 'Performance'],
            'Messaging': ['Distributed Systems', 'Scalability']
        };
    }

    getNextTopic(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return null;

        const progression = this.getTopicProgression();
        const currentTopic = session.currentTopic;

        if (currentTopic && progression[currentTopic]) {
            // Find next topic that hasn't been covered well
            for (const nextTopic of progression[currentTopic]) {
                const topicData = session.topicsCovered[nextTopic];
                if (!topicData || topicData.status !== 'strong') {
                    return nextTopic;
                }
            }
        }

        // Fallback: find any uncovered topic
        const allTopics = ['Networking', 'Databases', 'APIs', 'System Design', 'Caching', 'Security', 'Concurrency', 'Messaging', 'Distributed Systems'];
        for (const topic of allTopics) {
            const topicData = session.topicsCovered[topic];
            if (!topicData || topicData.status === 'weak') {
                return topic;
            }
        }

        return 'System Design'; // Default advanced topic
    }

    logSessionState(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        console.log(`\n📊 INTERVIEW STATE - ${sessionId}`);
        console.log(`Current Topic: ${session.currentTopic}`);
        console.log(`Difficulty: ${session.difficulty}`);
        console.log(`Confidence: ${session.confidenceScore.toFixed(2)}`);
        console.log(`Depth Level: ${session.depthLevel}`);
        console.log(`Questions Asked: ${session.questionsAsked.length}`);
        console.log(`Topics Covered:`, session.topicsCovered);
        console.log('─'.repeat(50));
    }
}

module.exports = new InterviewStateManager();