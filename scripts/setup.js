const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { seedQuestions } = require('../utils/sampleQuestions');
const ragService = require('../services/ragService');
const companyRAGService = require('../services/companyRAGService');

dotenv.config();

const setupDatabase = async () => {
    try {
        console.log('🚀 Starting database setup...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-mock-interview');
        console.log('✅ Connected to MongoDB');

        // Seed sample questions
        console.log('📝 Seeding sample questions...');
        const questions = await seedQuestions();
        console.log(`✅ Seeded ${questions.length} questions`);

        // Initialize RAG service
        console.log('🧠 Initializing RAG service...');
        await ragService.initialize();
        console.log('✅ RAG service initialized');

        // Add questions to RAG store
        console.log('🔍 Adding questions to RAG store...');
        await ragService.bulkAddQuestions(questions);
        console.log('✅ Questions added to RAG store');

        // Initialize Company RAG service
        console.log('🏢 Initializing Company RAG service...');
        await companyRAGService.initialize();
        console.log('✅ Company RAG service initialized');

        console.log('🎉 Database setup completed successfully!');

        // Get company RAG stats
        const companyStats = companyRAGService.getStats();

        console.log('\n📋 Setup Summary:');
        console.log(`- MongoDB: Connected`);
        console.log(`- Questions: ${questions.length} seeded`);
        console.log(`- RAG Service: Ready (in-memory mode)`);
        console.log(`- Company RAG: ${companyStats.totalQuestions} questions loaded`);
        console.log(`- Companies: ${Object.keys(companyStats.byCompany).join(', ')}`);
        Object.entries(companyStats.byCompany).forEach(([company, count]) => {
            if (count > 0) console.log(`  - ${company}: ${count} questions`);
        });

        console.log('\n🚀 You can now start the server with: npm run dev');
        console.log('\n💡 Note: Using in-memory RAG for simplicity. Questions will be re-loaded on server restart.');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
};

// Run setup if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };