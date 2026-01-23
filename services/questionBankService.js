const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class QuestionBankService {
    constructor() {
        this.hrQuestions = [];
        this.projectExperienceQuestions = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('📚 Initializing Question Bank Service...');

            const datasetsPath = path.join(__dirname, '..', 'Questions Dataset');

            // Load HR questions
            await this.loadHRQuestions(path.join(datasetsPath, 'common_hr_interview_questions.csv'));

            // Load project/experience questions
            await this.loadProjectExperienceQuestions(path.join(datasetsPath, 'project_experience_interview_questions.csv'));

            this.initialized = true;
            console.log('✅ Question Bank Service initialized successfully');
            console.log(`   HR Questions: ${this.hrQuestions.length}`);
            console.log(`   Project/Experience Questions: ${this.projectExperienceQuestions.length}`);

        } catch (error) {
            console.error('❌ Question Bank Service initialization error:', error);
            this.initialized = true; // Continue with empty arrays
        }
    }

    async loadHRQuestions(filePath) {
        return new Promise((resolve, reject) => {
            const questions = [];

            if (!fs.existsSync(filePath)) {
                console.log('⚠️  HR questions CSV not found, using fallback questions');
                this.hrQuestions = this.getFallbackHRQuestions();
                resolve();
                return;
            }

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Question && row.Question.trim()) {
                        questions.push({
                            company: row.Company || 'Common',
                            role: row.Role || 'All Roles',
                            question: row.Question.trim(),
                            difficulty: row.Difficulty || 'Medium',
                            topic: row.Topic || 'General'
                        });
                    }
                })
                .on('end', () => {
                    this.hrQuestions = questions;
                    console.log(`✅ Loaded ${questions.length} HR questions`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    async loadProjectExperienceQuestions(filePath) {
        return new Promise((resolve, reject) => {
            const questions = [];

            if (!fs.existsSync(filePath)) {
                console.log('⚠️  Project/Experience questions CSV not found, using fallback questions');
                this.projectExperienceQuestions = this.getFallbackProjectQuestions();
                resolve();
                return;
            }

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Question && row.Question.trim()) {
                        questions.push({
                            company: row.Company || 'Common',
                            role: row.Role || 'All Technical Roles',
                            question: row.Question.trim(),
                            difficulty: row.Difficulty || 'Medium',
                            topic: row.Topic || 'Project Experience'
                        });
                    }
                })
                .on('end', () => {
                    this.projectExperienceQuestions = questions;
                    console.log(`✅ Loaded ${questions.length} Project/Experience questions`);
                    resolve();
                })
                .on('error', reject);
        });
    }

    getRandomHRQuestion(excludeQuestions = []) {
        const availableQuestions = this.hrQuestions.filter(q =>
            !excludeQuestions.some(asked =>
                asked.toLowerCase().includes(q.question.toLowerCase().substring(0, 30))
            )
        );

        if (availableQuestions.length === 0) {
            console.log('⚠️  All HR questions have been asked, using fallback');
            return this.getFallbackHRQuestions()[0];
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];

        console.log(`✅ Selected HR question: ${selectedQuestion.question.substring(0, 50)}...`);

        return {
            id: `hr_${Date.now()}`,
            text: selectedQuestion.question,
            topic: selectedQuestion.topic,
            section: 'hr',
            difficulty: selectedQuestion.difficulty,
            company: 'HR'
        };
    }

    getRandomProjectExperienceQuestion(excludeQuestions = []) {
        const availableQuestions = this.projectExperienceQuestions.filter(q =>
            !excludeQuestions.some(asked =>
                asked.toLowerCase().includes(q.question.toLowerCase().substring(0, 30))
            )
        );

        if (availableQuestions.length === 0) {
            console.log('⚠️  All project/experience questions have been asked, using fallback');
            return this.getFallbackProjectQuestions()[0];
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];

        console.log(`✅ Selected project/experience question: ${selectedQuestion.question.substring(0, 50)}...`);

        return {
            id: `project_${Date.now()}`,
            text: selectedQuestion.question,
            topic: selectedQuestion.topic,
            section: 'project',
            difficulty: selectedQuestion.difficulty,
            company: 'Project'
        };
    }

    getProjectQuestionsByTopic(topic, limit = 3, excludeQuestions = []) {
        const topicQuestions = this.projectExperienceQuestions.filter(q =>
            q.topic.toLowerCase().includes(topic.toLowerCase()) &&
            !excludeQuestions.some(asked =>
                asked.toLowerCase().includes(q.question.toLowerCase().substring(0, 30))
            )
        );

        return topicQuestions.slice(0, limit).map(q => ({
            id: `project_topic_${Date.now()}_${Math.random()}`,
            text: q.question,
            topic: q.topic,
            section: 'project',
            difficulty: q.difficulty,
            company: 'Project'
        }));
    }

    getFallbackHRQuestions() {
        return [
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Describe a situation where you had to work with a difficult team member. How did you handle it and what was the outcome?',
                difficulty: 'Medium',
                topic: 'Conflict Resolution'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Tell me about a time when you failed at something. What did you learn from it?',
                difficulty: 'Medium',
                topic: 'Learning from Failure'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'How do you prioritize tasks when you have multiple deadlines approaching simultaneously?',
                difficulty: 'Medium',
                topic: 'Time Management'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Describe a situation where you had to make a decision without having all the information you needed. How did you approach it?',
                difficulty: 'Hard',
                topic: 'Decision Making'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Tell me about a time when you went above and beyond what was expected of you.',
                difficulty: 'Medium',
                topic: 'Initiative'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'How do you handle feedback or criticism about your work?',
                difficulty: 'Medium',
                topic: 'Feedback Reception'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Describe a time when you had to adapt to a significant change at work. How did you manage the transition?',
                difficulty: 'Medium',
                topic: 'Adaptability'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'What motivates you to do your best work? Can you give an example?',
                difficulty: 'Easy',
                topic: 'Motivation'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'Tell me about a time when you had to persuade someone to see things your way. What approach did you take?',
                difficulty: 'Hard',
                topic: 'Influence'
            },
            {
                company: 'Common',
                role: 'All Roles',
                question: 'How do you ensure you continue to grow and develop professionally?',
                difficulty: 'Medium',
                topic: 'Professional Development'
            }
        ];
    }

    getFallbackProjectQuestions() {
        return [
            {
                company: 'Common',
                role: 'All Technical Roles',
                question: 'Tell me about the most challenging project you\'ve worked on.',
                difficulty: 'Medium',
                topic: 'Project Overview'
            },
            {
                company: 'Common',
                role: 'All Technical Roles',
                question: 'What was your specific role and contribution to the project?',
                difficulty: 'Easy',
                topic: 'Ownership'
            },
            {
                company: 'Common',
                role: 'All Technical Roles',
                question: 'What technologies did you use and why did you choose them?',
                difficulty: 'Medium',
                topic: 'Technical Decisions'
            },
            {
                company: 'Common',
                role: 'All Technical Roles',
                question: 'How did you handle the most difficult technical challenge in the project?',
                difficulty: 'Hard',
                topic: 'Problem Solving'
            }
        ];
    }

    getStats() {
        return {
            hrQuestions: this.hrQuestions.length,
            projectExperienceQuestions: this.projectExperienceQuestions.length,
            initialized: this.initialized
        };
    }
}

module.exports = new QuestionBankService();