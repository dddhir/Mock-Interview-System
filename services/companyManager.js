const fs = require('fs');
const path = require('path');

class CompanyManager {
    constructor() {
        this.datasetsPath = path.join(__dirname, '..', 'Questions Dataset');
        this.companies = [];
        this.loadCompanies();
    }

    loadCompanies() {
        try {
            const files = fs.readdirSync(this.datasetsPath);

            this.companies = files
                .filter(file => {
                    return file.endsWith('.csv') &&
                        !file.includes('common_hr') &&
                        !file.includes('project_experience');
                })
                .map(file => {
                    // Extract company name from filename
                    const companyName = file.replace('_Interview_Questions.csv', '');
                    const normalizedName = companyName.toLowerCase();

                    return {
                        id: normalizedName,
                        name: companyName,
                        displayName: this.formatDisplayName(companyName),
                        filename: file,
                        filePath: path.join(this.datasetsPath, file)
                    };
                })
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            console.log(`🏢 Found ${this.companies.length} companies:`);
            this.companies.forEach(company => {
                console.log(`   • ${company.displayName} (${company.filename})`);
            });

        } catch (error) {
            console.error('❌ Error loading companies:', error);
            this.companies = [];
        }
    }

    formatDisplayName(companyName) {
        // Handle special cases for better display names
        const specialCases = {
            'meta': 'Meta (Facebook)',
            'linkedin': 'LinkedIn',
            'paypal': 'PayPal',
            'sap': 'SAP'
        };

        const normalized = companyName.toLowerCase();
        if (specialCases[normalized]) {
            return specialCases[normalized];
        }

        // Capitalize first letter of each word
        return companyName
            .split(/[-_\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    getAllCompanies() {
        return this.companies;
    }

    getCompanyById(id) {
        return this.companies.find(company => company.id === id.toLowerCase());
    }

    getCompanyByName(name) {
        return this.companies.find(company =>
            company.name.toLowerCase() === name.toLowerCase() ||
            company.displayName.toLowerCase() === name.toLowerCase()
        );
    }

    getCompaniesForDropdown() {
        return this.companies.map(company => ({
            value: company.id,
            label: company.displayName,
            questionFile: company.filename
        }));
    }

    validateCompany(companyId) {
        const company = this.getCompanyById(companyId);
        if (!company) {
            throw new Error(`Company '${companyId}' not found. Available companies: ${this.companies.map(c => c.id).join(', ')}`);
        }

        if (!fs.existsSync(company.filePath)) {
            throw new Error(`Question file not found for ${company.displayName}: ${company.filename}`);
        }

        return company;
    }

    getStats() {
        return {
            totalCompanies: this.companies.length,
            companies: this.companies.map(company => ({
                id: company.id,
                displayName: company.displayName,
                hasFile: fs.existsSync(company.filePath),
                fileSize: fs.existsSync(company.filePath) ? fs.statSync(company.filePath).size : 0
            }))
        };
    }
}

module.exports = new CompanyManager();