class SkillDatabase {
    constructor() {
        this.skills = [
            // Programming Languages
            'JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
            'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Lua', 'Dart', 'Elixir', 'Haskell',

            // Frontend Technologies
            'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js', 'Gatsby', 'Ember.js',
            'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material-UI', 'Ant Design', 'Chakra UI',
            'Styled Components', 'SASS', 'LESS', 'CSS3', 'HTML5', 'Webpack', 'Vite', 'Parcel',

            // Backend Technologies
            'Node.js', 'Express.js', 'Nest.js', 'Koa.js', 'Fastify', 'Django', 'Flask', 'FastAPI',
            'Spring Boot', 'Spring Framework', 'Laravel', 'Symfony', 'CodeIgniter', 'Ruby on Rails',
            'ASP.NET', '.NET Core', 'Gin', 'Echo', 'Fiber', 'Phoenix', 'Actix',

            // Databases
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'MariaDB',
            'Cassandra', 'DynamoDB', 'Firebase', 'Supabase', 'CouchDB', 'Neo4j', 'InfluxDB',
            'Elasticsearch', 'Apache Solr', 'Amazon RDS', 'Google Cloud SQL',

            // Cloud Platforms
            'AWS', 'Azure', 'Google Cloud Platform', 'GCP', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean',
            'Linode', 'Vultr', 'IBM Cloud', 'Oracle Cloud', 'Alibaba Cloud',

            // AWS Services
            'EC2', 'S3', 'Lambda', 'RDS', 'DynamoDB', 'CloudFront', 'Route 53', 'VPC', 'IAM',
            'CloudWatch', 'ECS', 'EKS', 'Elastic Beanstalk', 'API Gateway', 'SQS', 'SNS',

            // DevOps & Tools
            'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
            'Ansible', 'Terraform', 'Puppet', 'Chef', 'Vagrant', 'Helm', 'ArgoCD', 'Prometheus',
            'Grafana', 'ELK Stack', 'Splunk', 'Datadog', 'New Relic',

            // Version Control
            'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN', 'Mercurial',

            // Testing
            'Jest', 'Mocha', 'Chai', 'Cypress', 'Selenium', 'Playwright', 'Puppeteer', 'JUnit',
            'TestNG', 'PyTest', 'RSpec', 'PHPUnit', 'Postman', 'Insomnia',

            // Mobile Development
            'React Native', 'Flutter', 'Ionic', 'Xamarin', 'Swift', 'Objective-C', 'Kotlin',
            'Android Studio', 'Xcode', 'Cordova', 'PhoneGap',

            // Data Science & ML
            'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
            'Seaborn', 'Plotly', 'Jupyter', 'Apache Spark', 'Hadoop', 'Kafka', 'Airflow',
            'MLflow', 'Kubeflow', 'OpenCV', 'NLTK', 'spaCy',

            // Methodologies & Concepts
            'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD', 'DDD', 'SOLID',
            'Design Patterns', 'Microservices', 'Monolith', 'Serverless', 'Event-Driven Architecture',
            'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'OAuth', 'JWT', 'SAML',

            // Specialized Skills
            'Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
            'Blockchain', 'Cryptocurrency', 'Smart Contracts', 'Web3', 'Ethereum', 'Solidity',
            'Game Development', 'Unity', 'Unreal Engine', 'Godot', 'AR/VR', 'IoT',

            // Fullstack Combinations
            'MERN Stack', 'MEAN Stack', 'LAMP Stack', 'Django + React', 'Laravel + Vue',
            'Spring + Angular', 'ASP.NET + React', 'Python Fullstack', 'JavaScript Fullstack',
            'Java Fullstack', 'PHP Fullstack', 'Ruby Fullstack', 'C# Fullstack'
        ];

        // Create search index
        this.searchIndex = this.createSearchIndex();
    }

    createSearchIndex() {
        const index = new Map();

        this.skills.forEach(skill => {
            const words = skill.toLowerCase().split(/[\s\-\+\.]+/);
            words.forEach(word => {
                if (word.length >= 2) {
                    if (!index.has(word)) {
                        index.set(word, new Set());
                    }
                    index.get(word).add(skill);
                }
            });

            // Also index the full skill name
            const fullName = skill.toLowerCase().replace(/[\s\-\+\.]+/g, '');
            if (!index.has(fullName)) {
                index.set(fullName, new Set());
            }
            index.get(fullName).add(skill);
        });

        return index;
    }

    searchSkills(query, limit = 10) {
        if (!query || query.length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase().trim();
        const results = new Set();

        // Direct matches
        this.skills.forEach(skill => {
            if (skill.toLowerCase().includes(searchTerm)) {
                results.add(skill);
            }
        });

        // Index-based matches
        for (const [indexTerm, skills] of this.searchIndex.entries()) {
            if (indexTerm.includes(searchTerm) || searchTerm.includes(indexTerm)) {
                skills.forEach(skill => results.add(skill));
            }
        }

        // Convert to array and sort by relevance
        const resultsArray = Array.from(results);

        // Sort by relevance (exact matches first, then starts with, then contains)
        resultsArray.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();

            // Exact match
            if (aLower === searchTerm) return -1;
            if (bLower === searchTerm) return 1;

            // Starts with
            if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
            if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm)) return 1;

            // Length (shorter is more relevant)
            return a.length - b.length;
        });

        return resultsArray.slice(0, limit);
    }

    getAllSkills() {
        return [...this.skills].sort();
    }

    getSkillsByCategory() {
        return {
            'Programming Languages': this.skills.filter(skill =>
                ['JavaScript', 'Python', 'Java', 'TypeScript', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin'].includes(skill)
            ),
            'Frontend': this.skills.filter(skill =>
                ['React', 'Vue.js', 'Angular', 'Next.js', 'HTML5', 'CSS3', 'Bootstrap', 'Tailwind CSS'].includes(skill)
            ),
            'Backend': this.skills.filter(skill =>
                ['Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'ASP.NET'].includes(skill)
            ),
            'Databases': this.skills.filter(skill =>
                ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQL Server'].includes(skill)
            ),
            'Cloud': this.skills.filter(skill =>
                ['AWS', 'Azure', 'Google Cloud Platform', 'Docker', 'Kubernetes'].includes(skill)
            ),
            'DevOps': this.skills.filter(skill =>
                ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible'].includes(skill)
            )
        };
    }
}

module.exports = new SkillDatabase();