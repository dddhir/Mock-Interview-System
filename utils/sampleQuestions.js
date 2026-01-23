const Question = require('../models/Question');

const sampleQuestions = [
    // Technical - JavaScript/Node.js
    {
        questionText: "Explain the difference between let, const, and var in JavaScript.",
        company: "General",
        role: "Frontend Developer",
        topic: "javascript",
        difficulty: "easy",
        section: "technical",
        tags: ["javascript", "variables", "scope"],
        expectedAnswer: "var is function-scoped, let and const are block-scoped. const cannot be reassigned.",
        followUpQuestions: ["What is hoisting?", "Explain temporal dead zone"]
    },
    {
        questionText: "How does event loop work in Node.js?",
        company: "General",
        role: "Backend Developer",
        topic: "nodejs",
        difficulty: "medium",
        section: "technical",
        tags: ["nodejs", "event-loop", "asynchronous"],
        expectedAnswer: "Event loop handles asynchronous operations using phases like timers, I/O callbacks, etc.",
        followUpQuestions: ["What are the phases of event loop?", "Difference between process.nextTick and setImmediate"]
    },
    {
        questionText: "What is closure in JavaScript and provide an example?",
        company: "General",
        role: "Frontend Developer",
        topic: "javascript",
        difficulty: "medium",
        section: "technical",
        tags: ["javascript", "closure", "scope"],
        expectedAnswer: "Closure is when inner function has access to outer function's variables even after outer function returns.",
        followUpQuestions: ["What are practical uses of closures?", "Memory implications of closures"]
    },

    // Technical - React
    {
        questionText: "Explain the difference between state and props in React.",
        company: "General",
        role: "Frontend Developer",
        topic: "react",
        difficulty: "easy",
        section: "technical",
        tags: ["react", "state", "props"],
        expectedAnswer: "Props are passed from parent to child, state is internal to component and can change.",
        followUpQuestions: ["When to use state vs props?", "How to pass data from child to parent?"]
    },
    {
        questionText: "What are React hooks and why were they introduced?",
        company: "General",
        role: "Frontend Developer",
        topic: "react",
        difficulty: "medium",
        section: "technical",
        tags: ["react", "hooks", "functional-components"],
        expectedAnswer: "Hooks allow using state and lifecycle methods in functional components.",
        followUpQuestions: ["Explain useState and useEffect", "What are custom hooks?"]
    },

    // Technical - Database
    {
        questionText: "Explain ACID properties in database transactions.",
        company: "General",
        role: "Backend Developer",
        topic: "database",
        difficulty: "medium",
        section: "technical",
        tags: ["database", "acid", "transactions"],
        expectedAnswer: "Atomicity, Consistency, Isolation, Durability - ensures reliable database transactions.",
        followUpQuestions: ["What happens when ACID properties are violated?", "Difference between SQL and NoSQL ACID compliance"]
    },
    {
        questionText: "What is the difference between SQL and NoSQL databases?",
        company: "General",
        role: "Backend Developer",
        topic: "database",
        difficulty: "easy",
        section: "technical",
        tags: ["database", "sql", "nosql"],
        expectedAnswer: "SQL databases are relational with fixed schema, NoSQL are non-relational with flexible schema.",
        followUpQuestions: ["When to use SQL vs NoSQL?", "Examples of each type"]
    },

    // Technical - System Design
    {
        questionText: "How would you design a URL shortener like bit.ly?",
        company: "General",
        role: "Backend Developer",
        topic: "system-design",
        difficulty: "hard",
        section: "technical",
        tags: ["system-design", "scalability", "architecture"],
        expectedAnswer: "Use base62 encoding, database for URL mapping, caching, load balancing.",
        followUpQuestions: ["How to handle high traffic?", "Database sharding strategies"]
    },

    // Project Questions
    {
        questionText: "Tell me about a challenging project you worked on and how you overcame the difficulties.",
        company: "General",
        role: "Software Engineer",
        topic: "project-experience",
        difficulty: "medium",
        section: "project",
        tags: ["project", "problem-solving", "experience"],
        expectedAnswer: "Should include specific project, challenges faced, solutions implemented, and results.",
        followUpQuestions: ["What would you do differently?", "What did you learn from this project?"]
    },
    {
        questionText: "How do you handle version control in team projects?",
        company: "General",
        role: "Software Engineer",
        topic: "collaboration",
        difficulty: "easy",
        section: "project",
        tags: ["git", "version-control", "teamwork"],
        expectedAnswer: "Use Git with branching strategies, pull requests, code reviews.",
        followUpQuestions: ["Explain Git workflow you prefer", "How to resolve merge conflicts?"]
    },
    {
        questionText: "Describe your approach to testing in software development.",
        company: "General",
        role: "Software Engineer",
        topic: "testing",
        difficulty: "medium",
        section: "project",
        tags: ["testing", "quality-assurance", "development"],
        expectedAnswer: "Unit tests, integration tests, end-to-end tests, TDD/BDD approaches.",
        followUpQuestions: ["What testing frameworks do you use?", "How do you ensure test coverage?"]
    },

    // HR Questions
    {
        questionText: "Why do you want to work for our company?",
        company: "General",
        role: "Software Engineer",
        topic: "motivation",
        difficulty: "easy",
        section: "hr",
        tags: ["motivation", "company-fit", "career"],
        expectedAnswer: "Research company values, products, culture and align with personal goals.",
        followUpQuestions: ["What do you know about our products?", "How do you see yourself growing here?"]
    },
    {
        questionText: "What are your strengths and weaknesses?",
        company: "General",
        role: "Software Engineer",
        topic: "self-assessment",
        difficulty: "easy",
        section: "hr",
        tags: ["self-awareness", "personal-development"],
        expectedAnswer: "Honest self-assessment with examples and improvement plans for weaknesses.",
        followUpQuestions: ["How are you working on your weaknesses?", "Give examples of your strengths in action"]
    },
    {
        questionText: "Where do you see yourself in 5 years?",
        company: "General",
        role: "Software Engineer",
        topic: "career-goals",
        difficulty: "easy",
        section: "hr",
        tags: ["career-planning", "ambition", "growth"],
        expectedAnswer: "Realistic career progression aligned with company opportunities.",
        followUpQuestions: ["What skills do you want to develop?", "How does this role fit your career plan?"]
    },
    {
        questionText: "How do you handle stress and pressure?",
        company: "General",
        role: "Software Engineer",
        topic: "stress-management",
        difficulty: "medium",
        section: "hr",
        tags: ["stress-management", "resilience", "work-life-balance"],
        expectedAnswer: "Specific strategies for managing stress with examples from experience.",
        followUpQuestions: ["Describe a high-pressure situation you handled", "How do you prioritize tasks under pressure?"]
    },

    // Additional Technical Questions
    {
        questionText: "What is the difference between Promise and async/await in JavaScript?",
        company: "General",
        role: "Frontend Developer",
        topic: "javascript",
        difficulty: "medium",
        section: "technical",
        tags: ["javascript", "promises", "async-await"],
        expectedAnswer: "Promises are objects representing eventual completion, async/await is syntactic sugar for promises.",
        followUpQuestions: ["How do you handle errors in async/await?", "What is Promise.all()?"]
    },
    {
        questionText: "Explain REST API principles and HTTP methods.",
        company: "General",
        role: "Backend Developer",
        topic: "api",
        difficulty: "easy",
        section: "technical",
        tags: ["rest", "api", "http"],
        expectedAnswer: "REST uses HTTP methods (GET, POST, PUT, DELETE) for stateless communication.",
        followUpQuestions: ["What is the difference between PUT and PATCH?", "How do you handle API versioning?"]
    },
    {
        questionText: "How would you optimize a slow database query?",
        company: "General",
        role: "Backend Developer",
        topic: "database",
        difficulty: "hard",
        section: "technical",
        tags: ["database", "optimization", "performance"],
        expectedAnswer: "Use indexes, analyze query execution plan, optimize joins, consider caching.",
        followUpQuestions: ["What are database indexes?", "When would you use database sharding?"]
    },
    {
        questionText: "Explain the concept of responsive design.",
        company: "General",
        role: "Frontend Developer",
        topic: "css",
        difficulty: "easy",
        section: "technical",
        tags: ["css", "responsive", "design"],
        expectedAnswer: "Design that adapts to different screen sizes using media queries, flexible grids.",
        followUpQuestions: ["What are CSS media queries?", "Mobile-first vs desktop-first approach?"]
    },

    // More Project Questions
    {
        questionText: "How do you ensure code quality in your projects?",
        company: "General",
        role: "Software Engineer",
        topic: "code-quality",
        difficulty: "medium",
        section: "project",
        tags: ["code-quality", "best-practices", "development"],
        expectedAnswer: "Code reviews, linting, testing, documentation, consistent coding standards.",
        followUpQuestions: ["What tools do you use for code quality?", "How do you handle technical debt?"]
    },
    {
        questionText: "Describe your experience with CI/CD pipelines.",
        company: "General",
        role: "Software Engineer",
        topic: "devops",
        difficulty: "medium",
        section: "project",
        tags: ["ci-cd", "devops", "automation"],
        expectedAnswer: "Automated testing, building, and deployment processes using tools like Jenkins, GitHub Actions.",
        followUpQuestions: ["What are the benefits of CI/CD?", "How do you handle deployment rollbacks?"]
    },

    // More HR Questions
    {
        questionText: "Tell me about a time you disagreed with a team member.",
        company: "General",
        role: "Software Engineer",
        topic: "teamwork",
        difficulty: "medium",
        section: "hr",
        tags: ["teamwork", "conflict-resolution", "communication"],
        expectedAnswer: "Specific example showing professional disagreement resolution and collaboration.",
        followUpQuestions: ["How do you handle conflicts in a team?", "What makes a good team player?"]
    },
    {
        questionText: "What motivates you in your work?",
        company: "General",
        role: "Software Engineer",
        topic: "motivation",
        difficulty: "easy",
        section: "hr",
        tags: ["motivation", "passion", "career"],
        expectedAnswer: "Genuine interests in technology, problem-solving, learning, making impact.",
        followUpQuestions: ["How do you stay updated with technology?", "What are your learning goals?"]
    }
];

const seedQuestions = async () => {
    try {
        // Clear existing questions
        await Question.deleteMany({});

        // Insert sample questions
        const insertedQuestions = await Question.insertMany(sampleQuestions);

        console.log(`Seeded ${insertedQuestions.length} sample questions`);
        return insertedQuestions;
    } catch (error) {
        console.error('Error seeding questions:', error);
        throw error;
    }
};

module.exports = { sampleQuestions, seedQuestions };