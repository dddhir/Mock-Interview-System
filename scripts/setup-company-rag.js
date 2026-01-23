const dotenv = require('dotenv');
const companyRAGService = require('../services/companyRAGService');

dotenv.config();

const setupCompanyRAG = async () => {
    try {
        console.log('🏢 Starting Company RAG setup...');

        // Initialize Company RAG service
        console.log('🧠 Initializing Company RAG service...');
        await companyRAGService.initialize();
        console.log('✅ Company RAG service initialized');

        // Get company RAG stats
        const companyStats = companyRAGService.getStats();

        console.log('\n📋 Company RAG Setup Summary:');
        console.log(`- Total Questions: ${companyStats.totalQuestions}`);
        console.log(`- Companies Available: ${Object.keys(companyStats.byCompany).join(', ')}`);
        Object.entries(companyStats.byCompany).forEach(([company, count]) => {
            if (count > 0) console.log(`  - ${company}: ${count} questions`);
        });

        console.log('\n🎉 Company RAG setup completed successfully!');
        console.log('\n🚀 You can now start the server and use company-specific questions!');

    } catch (error) {
        console.error('❌ Company RAG setup failed:', error);
        process.exit(1);
    }
};

// Run setup if called directly
if (require.main === module) {
    setupCompanyRAG();
}

module.exports = { setupCompanyRAG };