const fs = require('fs');
const path = require('path');

class EmbeddingStorage {
    constructor() {
        this.storageDir = path.join(__dirname, '..', 'embeddings');
        this.ensureStorageDir();
    }

    ensureStorageDir() {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
            console.log('📁 Created embeddings storage directory');
        }
    }

    getEmbeddingFilePath(company) {
        return path.join(this.storageDir, `${company}_embeddings.json`);
    }

    async saveEmbeddings(company, questionsWithEmbeddings) {
        try {
            const filePath = this.getEmbeddingFilePath(company);
            const data = {
                company,
                generatedAt: new Date().toISOString(),
                questionCount: questionsWithEmbeddings.length,
                questions: questionsWithEmbeddings
            };

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`💾 Saved ${questionsWithEmbeddings.length} embeddings for ${company}`);
            return true;
        } catch (error) {
            console.error(`❌ Error saving embeddings for ${company}:`, error);
            return false;
        }
    }

    async loadEmbeddings(company) {
        try {
            const filePath = this.getEmbeddingFilePath(company);

            if (!fs.existsSync(filePath)) {
                console.log(`📂 No cached embeddings found for ${company}`);
                return null;
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`📂 Loaded ${data.questionCount} cached embeddings for ${company} (generated: ${data.generatedAt})`);
            return data.questions;
        } catch (error) {
            console.error(`❌ Error loading embeddings for ${company}:`, error);
            return null;
        }
    }

    hasEmbeddings(company) {
        const filePath = this.getEmbeddingFilePath(company);
        return fs.existsSync(filePath);
    }

    getAllStoredCompanies() {
        try {
            const files = fs.readdirSync(this.storageDir);
            return files
                .filter(file => file.endsWith('_embeddings.json'))
                .map(file => file.replace('_embeddings.json', ''));
        } catch (error) {
            return [];
        }
    }

    getStorageStats() {
        const companies = this.getAllStoredCompanies();
        const stats = {
            totalCompanies: companies.length,
            companies: {}
        };

        companies.forEach(company => {
            try {
                const filePath = this.getEmbeddingFilePath(company);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                stats.companies[company] = {
                    questionCount: data.questionCount,
                    generatedAt: data.generatedAt,
                    fileSize: fs.statSync(filePath).size
                };
            } catch (error) {
                stats.companies[company] = { error: 'Failed to read' };
            }
        });

        return stats;
    }

    clearEmbeddings(company = null) {
        try {
            if (company) {
                const filePath = this.getEmbeddingFilePath(company);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️  Cleared embeddings for ${company}`);
                }
            } else {
                // Clear all embeddings
                const files = fs.readdirSync(this.storageDir);
                files.forEach(file => {
                    if (file.endsWith('_embeddings.json')) {
                        fs.unlinkSync(path.join(this.storageDir, file));
                    }
                });
                console.log('🗑️  Cleared all embeddings');
            }
            return true;
        } catch (error) {
            console.error('❌ Error clearing embeddings:', error);
            return false;
        }
    }
}

module.exports = new EmbeddingStorage();