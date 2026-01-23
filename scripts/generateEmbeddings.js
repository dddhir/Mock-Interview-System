const companyRAGService = require('../services/companyRAGService');
const embeddingStorage = require('../services/embeddingStorage');
const companyManager = require('../services/companyManager');

async function generateAllEmbeddings() {
    console.log('🚀 Starting embedding generation for all companies...');

    try {
        // Initialize the RAG service
        await companyRAGService.initialize();

        // Get all companies
        const companies = companyManager.getAllCompanies();
        console.log(`📊 Found ${companies.length} companies to process`);

        let totalGenerated = 0;
        let totalCached = 0;

        for (const company of companies) {
            console.log(`\n🏢 Processing ${company.displayName}...`);

            // Check if embeddings already exist
            if (embeddingStorage.hasEmbeddings(company.id)) {
                console.log(`✅ Embeddings already exist for ${company.displayName}, skipping...`);
                totalCached++;
            } else {
                console.log(`🔄 Generating new embeddings for ${company.displayName}...`);
                // The initialization process will generate and cache embeddings
                totalGenerated++;
            }
        }

        // Display final statistics
        console.log('\n' + '='.repeat(80));
        console.log('📈 EMBEDDING GENERATION COMPLETE');
        console.log('='.repeat(80));
        console.log(`✅ Companies processed: ${companies.length}`);
        console.log(`🆕 New embeddings generated: ${totalGenerated}`);
        console.log(`💾 Cached embeddings used: ${totalCached}`);

        // Show storage statistics
        const storageStats = embeddingStorage.getStorageStats();
        console.log(`📁 Total storage files: ${storageStats.totalCompanies}`);

        let totalQuestions = 0;
        Object.values(storageStats.companies).forEach(stats => {
            if (stats.questionCount) {
                totalQuestions += stats.questionCount;
            }
        });
        console.log(`📊 Total questions with embeddings: ${totalQuestions}`);

        // Show company statistics
        const ragStats = companyRAGService.getStats();
        console.log('\n📋 Company Question Counts:');
        Object.entries(ragStats.byCompany).forEach(([company, count]) => {
            if (count > 0) {
                const companyInfo = companyManager.getCompanyById(company);
                const displayName = companyInfo ? companyInfo.displayName : company;
                console.log(`   ${displayName}: ${count} questions`);
            }
        });

        console.log('='.repeat(80));
        console.log('🎉 All embeddings generated and cached successfully!');

    } catch (error) {
        console.error('❌ Error generating embeddings:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateAllEmbeddings()
        .then(() => {
            console.log('✅ Embedding generation completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Embedding generation failed:', error);
            process.exit(1);
        });
}

module.exports = { generateAllEmbeddings };