const { GoogleGenerativeAI } = require('@google/generative-ai');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const embeddingStorage = require('./embeddingStorage');
const companyManager = require('./companyManager');

class CompanyRAGService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
        this.embeddingModel = null;

        // Company-specific question stores (will be populated dynamically)
        this.companyQuestions = {
            'general': [] // fallback
        };

        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Company RAG Service...');

            // Initialize embedding model
            if (process.env.TEST_MODE === 'true') {
                console.log('🧪 Test mode: Using text similarity only');
                this.embeddingModel = null;
            } else {
                try {
                    this.embeddingModel = this.genAI.getGenerativeModel({
                        model: "embedding-001"
                    });
                    console.log('✅ Gemini embedding model initialized');
                } catch (error) {
                    console.log('⚠️  Gemini embedding not available, using text similarity');
                    this.embeddingModel = null;
                }
            }

            // Load or generate company embeddings
            await this.loadAllCompanyEmbeddings();

            this.initialized = true;
            console.log('✅ Company RAG Service initialized successfully');

            // Display stats
            this.displayStats();
        } catch (error) {
            console.error('❌ Company RAG Service initialization error:', error);
            this.initialized = true; // Continue with basic functionality
        }
    }

    async loadAllCompanyEmbeddings() {
        const companies = companyManager.getAllCompanies();
        console.log(`📊 Loading embeddings for ${companies.length} companies...`);

        for (const company of companies) {
            try {
                // Try to load cached embeddings first
                const cachedEmbeddings = await embeddingStorage.loadEmbeddings(company.id);

                if (cachedEmbeddings && cachedEmbeddings.length > 0) {
                    this.companyQuestions[company.id] = cachedEmbeddings;
                    console.log(`✅ Loaded ${cachedEmbeddings.length} cached questions for ${company.displayName}`);
                } else {
                    // Generate new embeddings
                    console.log(`🔄 Generating new embeddings for ${company.displayName}...`);
                    await this.loadAndGenerateEmbeddings(company);
                }
            } catch (error) {
                console.error(`❌ Error loading embeddings for ${company.displayName}:`, error);
                this.companyQuestions[company.id] = [];
            }
        }

        // Log final stats
        const totalQuestions = Object.values(this.companyQuestions).reduce((sum, questions) => sum + questions.length, 0);
        console.log(`📈 Total questions loaded: ${totalQuestions} across ${companies.length} companies`);
    }

    async loadAndGenerateEmbeddings(company) {
        const questions = await this.loadCSVQuestions(company.filePath, company.id);

        if (questions.length > 0) {
            // Generate embeddings for all questions
            console.log(`🧠 Generating embeddings for ${questions.length} ${company.displayName} questions...`);

            for (let i = 0; i < questions.length; i++) {
                questions[i].embedding = await this.generateEmbedding(questions[i].question);

                // Show progress for large datasets
                if ((i + 1) % 10 === 0 || i === questions.length - 1) {
                    console.log(`   Progress: ${i + 1}/${questions.length} embeddings generated`);
                }
            }

            // Store in memory and cache to disk
            this.companyQuestions[company.id] = questions;
            await embeddingStorage.saveEmbeddings(company.id, questions);

            console.log(`✅ Generated and cached ${questions.length} embeddings for ${company.displayName}`);
        }
    }

    async loadCSVQuestions(filePath, companyId) {
        return new Promise((resolve, reject) => {
            const questions = [];

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Question && row.Question.trim()) {
                        questions.push({
                            company: row['Company Name'] || companyId,
                            role: row.Role || 'Software Engineer',
                            question: row.Question.trim(),
                            difficulty: row.Difficulty || 'Medium',
                            experience: row.Experience || 'General interview question',
                            embedding: null // Will be generated
                        });
                    }
                })
                .on('end', () => {
                    console.log(`📄 Loaded ${questions.length} questions from CSV for ${companyId}`);
                    resolve(questions);
                })
                .on('error', reject);
        });
    }

    async generateEmbedding(text) {
        try {
            if (this.embeddingModel) {
                const result = await this.embeddingModel.embedContent(text);
                if (result.embedding?.values) {
                    return result.embedding.values;
                }
            }
        } catch (error) {
            // Silently fall back to text-based embedding
        }

        // Enhanced text-based embedding fallback
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const embedding = new Array(384).fill(0);

        console.log(`\n🧠 GENERATING EMBEDDING FOR: "${text}"`);
        console.log(`📝 Extracted words: [${words.join(', ')}]`);

        words.forEach((word, index) => {
            const hash = word.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);

            console.log(`   Word "${word}" → Hash: ${hash}`);

            // More distributed embedding - use more positions per word
            for (let i = 0; i < 16; i++) { // Increased from 8 to 16
                const pos = (Math.abs(hash) + i * 23) % 384; // Different step size
                const value = Math.sin(hash + i) * 0.05; // Smaller individual values
                embedding[pos] += value;

                // Add secondary positions for better distribution
                const pos2 = (Math.abs(hash * 3) + i * 31) % 384;
                embedding[pos2] += Math.cos(hash + i) * 0.03;
            }

            // Add word-length based features
            const lengthFeature = word.length / 10.0;
            for (let i = 0; i < 8; i++) {
                const pos = (word.length * 17 + i * 41) % 384;
                embedding[pos] += lengthFeature * 0.02;
            }
        });

        // Normalize the embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        const normalizedEmbedding = magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;

        // Show first 20 dimensions of the embedding
        console.log(`🔢 Embedding (first 20 dims): [${normalizedEmbedding.slice(0, 20).map(n => n.toFixed(4)).join(', ')}...]`);
        console.log(`📏 Magnitude: ${magnitude.toFixed(4)}, Total dimensions: ${normalizedEmbedding.length}`);

        return normalizedEmbedding;
    }

    // Calculate cosine similarity between two embeddings
    cosineSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    // Simple text similarity as fallback
    textSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);

        // Exact word matches
        const exactMatches = words1.filter(word => words2.includes(word));

        // Partial matches (substring matching)
        let partialMatches = 0;
        words1.forEach(w1 => {
            words2.forEach(w2 => {
                if (w1.includes(w2) || w2.includes(w1)) {
                    partialMatches += 0.5; // Half credit for partial matches
                }
            });
        });

        // Technical keyword bonus
        const techKeywords = ['api', 'system', 'service', 'data', 'server', 'client', 'network', 'database', 'scale', 'performance', 'security', 'auth', 'load', 'cache', 'queue'];
        let techBonus = 0;
        techKeywords.forEach(keyword => {
            if (text1.toLowerCase().includes(keyword) && text2.toLowerCase().includes(keyword)) {
                techBonus += 0.1;
            }
        });

        const union = [...new Set([...words1, ...words2])];
        const baseScore = exactMatches.length / Math.max(union.length, 1);
        const partialScore = partialMatches / Math.max(union.length, 1);

        const finalScore = baseScore + partialScore + techBonus;

        // Debug logging
        if (exactMatches.length > 0 || partialMatches > 0 || techBonus > 0) {
            console.log(`      📊 Similarity breakdown: exact=${exactMatches.length}, partial=${partialMatches.toFixed(1)}, tech=${techBonus.toFixed(1)} → ${finalScore.toFixed(4)}`);
        }

        return Math.min(1.0, finalScore); // Cap at 1.0
    }

    async findRelevantQuestions(company, userAnswer, userProfile, limit = 5, excludeQuestions = []) {
        try {
            // Normalize company name
            const normalizedCompany = company.toLowerCase();
            let questionPool = this.companyQuestions[normalizedCompany] || [];

            // Fallback to general questions if company not found
            if (questionPool.length === 0) {
                console.log(`⚠️  No questions found for ${company}, using general pool`);
                questionPool = [
                    ...(this.companyQuestions.google || []),
                    ...(this.companyQuestions.microsoft || []),
                    ...(this.companyQuestions.netflix || [])
                ];
            }

            if (questionPool.length === 0) {
                console.log('⚠️  No questions available in any pool');
                return [];
            }

            // Filter out already asked questions STRICTLY
            if (excludeQuestions.length > 0) {
                console.log(`🚫 Filtering out ${excludeQuestions.length} already asked questions`);
                const originalCount = questionPool.length;

                questionPool = questionPool.filter(q => {
                    const questionText = q.question.toLowerCase().trim();
                    const isExcluded = excludeQuestions.some(asked => {
                        const askedText = asked.toLowerCase().trim();
                        // Strict matching - exact or very similar
                        return questionText === askedText ||
                            questionText.includes(askedText) ||
                            askedText.includes(questionText) ||
                            this.stringSimilarity(questionText, askedText) > 0.7;
                    });
                    return !isExcluded;
                });

                console.log(`✅ Filtered question pool: ${originalCount} → ${questionPool.length} questions remaining`);
            }

            if (questionPool.length === 0) {
                console.log('⚠️  All questions exhausted, returning empty');
                return [];
            }

            // RANDOMIZE the pool first to avoid always getting same questions
            const shuffledPool = this.shuffleArray([...questionPool]);

            // Filter by role/experience first
            let filteredPool = this.filterByRole(shuffledPool, userProfile.role);
            filteredPool = this.filterByExperience(filteredPool, userProfile.experience);

            // If filtering is too restrictive, use shuffled pool
            if (filteredPool.length < limit) {
                filteredPool = shuffledPool;
            }

            // Take random subset for scoring (to add variety)
            const sampleSize = Math.min(filteredPool.length, 20);
            const sampledQuestions = filteredPool.slice(0, sampleSize);

            // Generate embedding for user answer
            const answerEmbedding = await this.generateEmbedding(userAnswer);

            console.log(`\n🔍 Finding relevant questions from ${sampledQuestions.length} candidates`);

            // Calculate similarity scores
            const scoredQuestions = sampledQuestions.map((q, index) => {
                let similarity = 0;

                const textSim = this.textSimilarity(userAnswer, q.question);

                if (q.embedding && answerEmbedding) {
                    const embeddingSim = this.cosineSimilarity(q.embedding, answerEmbedding);
                    similarity = (textSim * 0.6) + (embeddingSim * 0.4);
                } else {
                    similarity = textSim;
                }

                // Add randomness factor to prevent same questions
                const randomFactor = Math.random() * 0.15;

                return {
                    ...q,
                    similarity: similarity + randomFactor
                };
            });

            // Sort by similarity and return top results
            const topQuestions = scoredQuestions
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            console.log(`🔍 Selected ${topQuestions.length} questions for ${company}`);
            topQuestions.forEach((q, i) => {
                console.log(`   ${i + 1}. "${q.question.substring(0, 50)}..."`);
            });

            return topQuestions;

        } catch (error) {
            console.error('Error finding relevant questions:', error);
            return [];
        }
    }

    // Helper to shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // String similarity for better duplicate detection
    stringSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        const intersection = words1.filter(w => words2.includes(w));
        return intersection.length / Math.max(words1.length, words2.length);
    }

    async getInitialQuestion(company, role, experience, skills = [], excludeQuestions = []) {
        try {
            const normalizedCompany = company.toLowerCase();
            let questionPool = this.companyQuestions[normalizedCompany] || [];

            if (questionPool.length === 0) {
                // Fallback to any available questions
                questionPool = [
                    ...(this.companyQuestions.google || []),
                    ...(this.companyQuestions.microsoft || []),
                    ...(this.companyQuestions.netflix || [])
                ];
            }

            if (questionPool.length === 0) {
                throw new Error('No questions available');
            }

            // SHUFFLE first for randomness
            questionPool = this.shuffleArray([...questionPool]);

            // Filter out already asked questions
            if (excludeQuestions.length > 0) {
                questionPool = questionPool.filter(q => {
                    const questionText = q.question.toLowerCase().trim();
                    return !excludeQuestions.some(asked => {
                        const askedText = asked.toLowerCase().trim();
                        return questionText === askedText ||
                            this.stringSimilarity(questionText, askedText) > 0.7;
                    });
                });
            }

            // Filter by role - but keep it loose
            let filteredQuestions = questionPool.filter(q => {
                if (!q.role) return true;
                const qRole = q.role.toLowerCase();
                const targetRole = role.toLowerCase();

                // Match if any keyword overlaps
                const roleWords = targetRole.split(/\s+/);
                return roleWords.some(word => qRole.includes(word)) ||
                    qRole.includes('software') || qRole.includes('engineer');
            });

            // If too restrictive, use full pool
            if (filteredQuestions.length < 5) {
                filteredQuestions = questionPool;
            }

            // Filter by experience level loosely
            const expFiltered = filteredQuestions.filter(q => {
                if (!q.experience) return true;
                const qExp = q.experience.toLowerCase();
                const targetExp = experience.toLowerCase();

                if (targetExp === 'fresher' || targetExp === 'junior') {
                    return !qExp.includes('senior') && !qExp.includes('staff');
                }
                if (targetExp === 'senior' || targetExp === 'staff') {
                    return !qExp.includes('fresher') && !qExp.includes('junior');
                }
                return true;
            });

            // Use experience filtered if we have enough questions
            const finalQuestions = expFiltered.length >= 3 ? expFiltered : filteredQuestions;

            if (finalQuestions.length === 0) {
                console.log('⚠️  Creating dynamic fallback question');
                return this.createDynamicQuestion(company, role, experience);
            }

            // Select RANDOM question from filtered set
            const randomIndex = Math.floor(Math.random() * finalQuestions.length);
            const selectedQuestion = finalQuestions[randomIndex];

            console.log(`✅ Selected random question for ${company} (${role}, ${experience}):`);
            console.log(`   "${selectedQuestion.question.substring(0, 60)}..."`);
            console.log(`   Pool size: ${finalQuestions.length}, Selected index: ${randomIndex}`);

            return {
                id: `${company}_${Date.now()}_${randomIndex}`,
                text: selectedQuestion.question,
                topic: selectedQuestion.topic || selectedQuestion.role,
                section: 'technical',
                difficulty: selectedQuestion.difficulty || 'Medium',
                company: selectedQuestion.company || company,
                role: selectedQuestion.role,
                experience: selectedQuestion.experience
            };

        } catch (error) {
            console.error('Error getting initial question:', error);
            throw error;
        }
    }

    filterByExperience(questions, experience) {
        const experienceMap = {
            'fresher': ['Fresher'],
            'junior': ['Junior'],
            'mid': ['Mid-Level'],
            'senior': ['Senior'],
            'staff': ['Staff']
        };

        const allowedLevels = experienceMap[experience] || ['Mid-Level'];

        const filtered = questions.filter(q => {
            if (!q.experience) return true; // Include questions without experience specified
            return allowedLevels.some(level =>
                q.experience.toLowerCase().includes(level.toLowerCase())
            );
        });

        console.log(`🎯 Experience filter (${experience}): ${questions.length} → ${filtered.length} questions`);
        return filtered;
    }

    filterByRole(questions, targetRole) {
        if (!targetRole) return questions;

        const roleKeywords = targetRole.toLowerCase().split(' ');

        // First, try exact role matching
        const exactMatches = questions.filter(q => {
            if (!q.role) return false;
            const questionRole = q.role.toLowerCase();
            return roleKeywords.every(keyword => questionRole.includes(keyword));
        });

        if (exactMatches.length > 0) {
            console.log(`🎯 Exact role filter (${targetRole}): ${questions.length} → ${exactMatches.length} questions`);
            return exactMatches;
        }

        // If no exact matches, try broader matching
        const broadMatches = questions.filter(q => {
            if (!q.role) return false;
            const questionRole = q.role.toLowerCase();

            // Check for role type matches
            const roleTypes = {
                'backend': ['backend', 'server', 'api'],
                'frontend': ['frontend', 'ui', 'client'],
                'fullstack': ['fullstack', 'full stack', 'full-stack'],
                'data': ['data', 'analytics', 'scientist'],
                'devops': ['devops', 'infrastructure', 'cloud'],
                'mobile': ['mobile', 'android', 'ios'],
                'qa': ['qa', 'test', 'quality']
            };

            for (const [type, keywords] of Object.entries(roleTypes)) {
                if (roleKeywords.some(keyword => keyword.includes(type))) {
                    return keywords.some(k => questionRole.includes(k));
                }
            }

            // Fallback to any keyword match
            return roleKeywords.some(keyword => questionRole.includes(keyword));
        });

        if (broadMatches.length > 0) {
            console.log(`🎯 Broad role filter (${targetRole}): ${questions.length} → ${broadMatches.length} questions`);
            return broadMatches;
        }

        // If still no matches, return software engineer questions as fallback
        const fallbackMatches = questions.filter(q => {
            if (!q.role) return false;
            const questionRole = q.role.toLowerCase();
            return questionRole.includes('software') || questionRole.includes('engineer');
        });

        console.log(`🎯 Fallback role filter (${targetRole}): ${questions.length} → ${fallbackMatches.length} questions`);
        return fallbackMatches.length > 0 ? fallbackMatches : questions;
    }

    filterBySkills(questions, skills) {
        if (!skills || skills.length === 0) return questions;

        const skillKeywords = skills.map(skill => skill.toLowerCase());

        const filtered = questions.filter(q => {
            const questionText = q.question.toLowerCase();
            const questionTopic = (q.topic || '').toLowerCase();

            // Check if question mentions any of the user's skills
            return skillKeywords.some(skill =>
                questionText.includes(skill) ||
                questionTopic.includes(skill)
            );
        });

        // If skill-based filtering is too restrictive, return original questions
        if (filtered.length === 0) {
            console.log(`🎯 Skill filter too restrictive, keeping all questions`);
            return questions;
        }

        console.log(`🎯 Skill filter (${skills.join(', ')}): ${questions.length} → ${filtered.length} questions`);
        return filtered;
    }

    createDynamicQuestion(company, role, experience) {
        const dynamicQuestions = [
            `Tell me about your experience as a ${role} and what interests you about working at ${company}.`,
            `How would you approach building a scalable ${role.toLowerCase()} solution at ${company}?`,
            `Describe a challenging technical problem you've solved as a ${role}.`,
            `What technologies would you use to build a modern application at ${company}?`,
            `How do you ensure code quality and maintainability in your ${role.toLowerCase()} work?`
        ];

        const randomQuestion = dynamicQuestions[Math.floor(Math.random() * dynamicQuestions.length)];

        return {
            id: `dynamic_${Date.now()}`,
            text: randomQuestion,
            topic: role,
            section: 'technical',
            difficulty: experience === 'fresher' ? 'Easy' : experience === 'senior' || experience === 'staff' ? 'Hard' : 'Medium',
            company: company,
            isDynamic: true
        };
    }

    getAvailableCompanies() {
        return companyManager.getCompaniesForDropdown().map(company => ({
            ...company,
            questionCount: this.companyQuestions[company.value]?.length || 0
        }));
    }

    displayStats() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 COMPANY RAG SERVICE STATISTICS');
        console.log('='.repeat(80));

        const companies = companyManager.getAllCompanies();
        let totalQuestions = 0;
        let companiesWithQuestions = 0;

        companies.forEach(company => {
            const questions = this.companyQuestions[company.id] || [];
            const questionCount = questions.length;

            if (questionCount > 0) {
                companiesWithQuestions++;
                totalQuestions += questionCount;

                const withEmbeddings = questions.filter(q => q.embedding).length;
                console.log(`${company.displayName}: ${questionCount} questions, ${withEmbeddings} with embeddings`);
            } else {
                console.log(`${company.displayName}: No questions loaded`);
            }
        });

        console.log('-'.repeat(80));
        console.log(`Total: ${totalQuestions} questions across ${companiesWithQuestions}/${companies.length} companies`);
        console.log('='.repeat(80) + '\n');
    }

    getStats() {
        const stats = {
            totalQuestions: 0,
            byCompany: {},
            initialized: this.initialized
        };

        Object.entries(this.companyQuestions).forEach(([company, questions]) => {
            stats.byCompany[company] = questions.length;
            stats.totalQuestions += questions.length;
        });

        return stats;
    }
}

module.exports = new CompanyRAGService();