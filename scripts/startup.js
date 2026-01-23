const { generateAllEmbeddings } = require('./generateEmbeddings');
const companyManager = require('../services/companyManager');
const embeddingStorage = require('../services/embeddingStorage');

async function startup() {
    console.log('🚀 Starting AI Mock Interview System...');
    console.log('='.repeat(80));

    try {
        // Check environment
        console.log('🔧 Checking environment...');
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            console.log('⚠️  No GOOGLE_GENAI_API_KEY found, using text-based similarity');
        } else {
            console.log('✅ Google Gemini API key found');
        }

        // Display company information
        console.log('\n📊 Company Dataset Analysis:');
        const companies = companyManager.getAllCompanies();
        console.log(`Found ${companies.length} company datasets:`);

        companies.forEach(company => {
            const hasEmbeddings = embeddingStorage.hasEmbeddings(company.id);
            console.log(`   ${hasEmbeddings ? '✅' : '❌'} ${company.displayName} (${company.filename})`);
        });

        // Check if we need to generate embeddings
        const companiesWithoutEmbeddings = companies.filter(company =>
            !embeddingStorage.hasEmbeddings(company.id)
        );

        if (companiesWithoutEmbeddings.length > 0) {
            console.log(`\n🔄 ${companiesWithoutEmbeddings.length} companies need embedding generation...`);
            await generateAllEmbeddings();
        } else {
            console.log('\n✅ All companies already have embeddings cached');
        }

        // Initialize RAG service to load embeddings into memory
        console.log('\n🧠 Initializing Company RAG Service...');
        const companyRAGService = require('../services/companyRAGService');
        await companyRAGService.initialize();
        console.log('✅ Company RAG Service initialized');

        // Display final statistics
        console.log('\n📈 System Ready:');
        const storageStats = embeddingStorage.getStorageStats();
        console.log(`   Companies: ${storageStats.totalCompanies}`);

        let totalQuestions = 0;
        Object.values(storageStats.companies).forEach(stats => {
            if (stats.questionCount) {
                totalQuestions += stats.questionCount;
            }
        });
        console.log(`   Total Questions: ${totalQuestions}`);
        console.log(`   Embeddings Storage: ${Object.keys(storageStats.companies).length} files`);

        console.log('\n🎉 AI Mock Interview System is ready!');
        console.log('='.repeat(80));

        return true;

    } catch (error) {
        console.error('❌ Startup failed:', error);
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    startup()
        .then((success) => {
            if (success) {
                console.log('✅ Startup completed successfully');
                process.exit(0);
            } else {
                console.log('❌ Startup failed');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Startup error:', error);
            process.exit(1);
        });
}

module.exports = { startup };