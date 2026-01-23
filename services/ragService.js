const { GoogleGenerativeAI } = require('@google/generative-ai');

class RAGService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
        this.embeddingModel = null;

        // In-memory storage for questions and embeddings
        this.questionStore = [];
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🧠 Initializing RAG Service...');

            // Initialize embedding model (fallback mode)
            try {
                this.embeddingModel = this.genAI.getGenerativeModel({
                    model: "embedding-001"
                });
            } catch (error) {
                console.log('⚠️  Embedding model not available, using text similarity fallback');
                this.embeddingModel = null;
            }

            this.initialized = true;
            console.log('✅ RAG Service initialized successfully (in-memory mode)');
        } catch (error) {
            console.error('❌ RAG Service initialization error:', error);
            // Don't throw error, continue with basic functionality
            this.initialized = true;
        }
    }

    async generateEmbedding(text) {
        try {
            if (this.embeddingModel) {
                // Try different embedding approaches
                try {
                    const result = await this.embeddingModel.embedContent(text);
                    if (result.embedding?.values) {
                        console.log('✅ Generated embedding successfully');
                        return result.embedding.values;
                    }
                } catch (embeddingError) {
                    console.log('⚠️  Gemini embedding failed, trying alternative approach...');
                }
            }
        } catch (error) {
            console.log('⚠️  Embedding model not available, using text similarity fallback');
        }

        // Enhanced fallback: create a more sophisticated text-based embedding
        const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const embedding = new Array(384).fill(0);

        words.forEach((word, index) => {
            const hash = word.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);

            // Distribute word features across embedding dimensions
            for (let i = 0; i < 10; i++) {
                const pos = (Math.abs(hash) + i * 37) % 384;
                embedding[pos] += Math.sin(hash + i) * 0.1;
            }
        });

        // Normalize the embedding
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
    }

    // Simple text similarity function
    calculateTextSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
        const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 2);

        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];

        return intersection.length / union.length;
    }

    async addQuestion(question) {
        try {
            const embedding = await this.generateEmbedding(question.questionText);

            this.questionStore.push({
                id: question._id.toString(),
                text: question.questionText,
                embedding: embedding,
                metadata: {
                    company: question.company,
                    role: question.role,
                    topic: question.topic,
                    difficulty: question.difficulty,
                    section: question.section,
                    tags: question.tags.join(',')
                }
            });

            return true;
        } catch (error) {
            console.error('Error adding question to store:', error);
            return false;
        }
    }

    async searchSimilarQuestions(query, filters = {}, limit = 5) {
        try {
            if (this.questionStore.length === 0) {
                return { documents: [[]], metadatas: [[]], distances: [[]] };
            }

            // Filter questions based on metadata
            let filteredQuestions = this.questionStore;

            if (filters.section) {
                filteredQuestions = filteredQuestions.filter(q =>
                    q.metadata.section === filters.section
                );
            }

            if (filters.role) {
                filteredQuestions = filteredQuestions.filter(q =>
                    q.metadata.role.toLowerCase().includes(filters.role.toLowerCase())
                );
            }

            // Calculate similarity scores
            const scoredQuestions = filteredQuestions.map(question => ({
                ...question,
                similarity: this.calculateTextSimilarity(query, question.text)
            }));

            // Sort by similarity and take top results
            const topQuestions = scoredQuestions
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            return {
                documents: [topQuestions.map(q => q.text)],
                metadatas: [topQuestions.map(q => q.metadata)],
                distances: [topQuestions.map(q => 1 - q.similarity)]
            };
        } catch (error) {
            console.error('Error searching similar questions:', error);
            return { documents: [[]], metadatas: [[]], distances: [[]] };
        }
    }

    async getFollowUpQuestions(userAnswer, previousQuestion, userProfile) {
        try {
            // Create search query based on user answer and profile
            const searchQuery = `${userAnswer} ${userProfile.skills.join(' ')} ${userProfile.experience}`;

            const filters = {
                section: previousQuestion.section,
                role: userProfile.role || 'software engineer'
            };

            const similarQuestions = await this.searchSimilarQuestions(searchQuery, filters, 3);

            return similarQuestions.documents[0] || [];
        } catch (error) {
            console.error('Error getting follow-up questions:', error);
            return [];
        }
    }

    async bulkAddQuestions(questions) {
        try {
            console.log(`📝 Adding ${questions.length} questions to in-memory store...`);

            let successCount = 0;
            for (const question of questions) {
                const success = await this.addQuestion(question);
                if (success) successCount++;
            }

            console.log(`✅ Added ${successCount}/${questions.length} questions to store`);
            return true;
        } catch (error) {
            console.error('Error bulk adding questions:', error);
            return false;
        }
    }

    // Get statistics about stored questions
    getStats() {
        const stats = {
            total: this.questionStore.length,
            bySection: {},
            byDifficulty: {},
            byRole: {}
        };

        this.questionStore.forEach(q => {
            // Count by section
            stats.bySection[q.metadata.section] = (stats.bySection[q.metadata.section] || 0) + 1;

            // Count by difficulty
            stats.byDifficulty[q.metadata.difficulty] = (stats.byDifficulty[q.metadata.difficulty] || 0) + 1;

            // Count by role
            stats.byRole[q.metadata.role] = (stats.byRole[q.metadata.role] || 0) + 1;
        });

        return stats;
    }
}

module.exports = new RAGService();