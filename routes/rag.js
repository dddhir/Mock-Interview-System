const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { protect } = require('../middleware/auth');
const Question = require('../models/Question');
const User = require('../models/User');
const ragService = require('../services/ragService');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Extract skills from resume content
const extractSkillsFromResume = (resumeContent) => {
    const commonSkills = [
        'javascript', 'python', 'java', 'react', 'nodejs', 'express', 'mongodb',
        'mysql', 'postgresql', 'html', 'css', 'typescript', 'angular', 'vue',
        'docker', 'kubernetes', 'aws', 'git', 'linux', 'sql', 'nosql',
        'redux', 'graphql', 'rest', 'api', 'microservices', 'agile', 'scrum',
        'firebase', 'nextjs', 'tailwind', 'bootstrap', 'sass', 'webpack',
        'jest', 'cypress', 'mocha', 'redis', 'elasticsearch', 'jenkins',
        'github', 'gitlab', 'jira', 'figma', 'photoshop', 'sketch'
    ];

    const foundSkills = [];
    const lowerContent = resumeContent.toLowerCase();

    commonSkills.forEach(skill => {
        if (lowerContent.includes(skill)) {
            foundSkills.push(skill);
        }
    });

    return foundSkills;
};

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize RAG service
router.post('/initialize', async (req, res) => {
    try {
        await ragService.initialize();
        res.json({
            success: true,
            message: 'RAG service initialized successfully'
        });
    } catch (error) {
        console.error('RAG initialization error:', error);
        res.status(500).json({
            message: 'Failed to initialize RAG service',
            error: error.message
        });
    }
});

// Upload and process CSV questions
router.post('/upload-questions', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }

        const questions = [];
        const filePath = req.file.path;

        // Parse CSV file
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                if (row.question_text && row.company && row.role) {
                    questions.push({
                        questionText: row.question_text,
                        company: row.company,
                        role: row.role,
                        topic: row.topic || 'general',
                        difficulty: row.difficulty || 'medium',
                        section: row.section || 'technical',
                        tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
                        expectedAnswer: row.expected_answer || '',
                        followUpQuestions: row.follow_up_questions ?
                            row.follow_up_questions.split('|').map(q => q.trim()) : []
                    });
                }
            })
            .on('end', async () => {
                try {
                    // Save questions to MongoDB
                    const savedQuestions = await Question.insertMany(questions);

                    // Add questions to vector database
                    await ragService.bulkAddQuestions(savedQuestions);

                    // Clean up uploaded file
                    fs.unlinkSync(filePath);

                    res.json({
                        success: true,
                        message: `Successfully processed ${savedQuestions.length} questions`,
                        count: savedQuestions.length
                    });
                } catch (error) {
                    console.error('Error processing questions:', error);
                    res.status(500).json({
                        message: 'Error processing questions',
                        error: error.message
                    });
                }
            })
            .on('error', (error) => {
                console.error('CSV parsing error:', error);
                fs.unlinkSync(filePath);
                res.status(500).json({
                    message: 'Error parsing CSV file',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('Upload questions error:', error);
        res.status(500).json({
            message: 'Server error uploading questions',
            error: error.message
        });
    }
});

// Upload and process resume
router.post('/upload-resume', protect, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded' });
        }

        const filePath = req.file.path;
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        let resumeContent = '';

        // Extract text based on file type
        if (fileExtension === 'pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            resumeContent = pdfData.text;
        } else if (fileExtension === 'docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            resumeContent = result.value;
        } else if (fileExtension === 'txt') {
            resumeContent = fs.readFileSync(filePath, 'utf8');
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                message: 'Unsupported file format. Please upload PDF, DOCX, or TXT files.'
            });
        }

        // Extract skills from resume
        const extractedSkills = extractSkillsFromResume(resumeContent);

        // Save resume content and extracted skills to user profile
        await User.findByIdAndUpdate(req.user.id, {
            resume: {
                filename: req.file.originalname,
                content: resumeContent,
                uploadDate: new Date()
            },
            skills: extractedSkills // Auto-update skills from resume
        });

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Resume uploaded and processed successfully',
            resumeLength: resumeContent.length,
            extractedSkills: extractedSkills,
            skillsCount: extractedSkills.length
        });

    } catch (error) {
        console.error('Resume upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: 'Server error processing resume',
            error: error.message
        });
    }
});

// Generate resume-based questions
router.post('/generate-resume-questions', protect, async (req, res) => {
    try {
        const { role, company } = req.body;

        const user = await User.findById(req.user.id);
        if (!user.resume || !user.resume.content) {
            return res.status(400).json({
                message: 'No resume found. Please upload a resume first.'
            });
        }

        // Generate questions using Gemini
        const generatedQuestions = await geminiService.generateQuestionFromResume(
            user.resume.content,
            role || 'Software Engineer',
            company || 'Tech Company'
        );

        res.json({
            success: true,
            questions: generatedQuestions.questions,
            message: 'Resume-based questions generated successfully'
        });

    } catch (error) {
        console.error('Generate resume questions error:', error);
        res.status(500).json({
            message: 'Server error generating questions',
            error: error.message
        });
    }
});

// Search similar questions
router.post('/search-questions', async (req, res) => {
    try {
        const { query, filters = {}, limit = 5 } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const results = await ragService.searchSimilarQuestions(query, filters, limit);

        res.json({
            success: true,
            results: {
                questions: results.documents[0] || [],
                metadata: results.metadatas[0] || [],
                distances: results.distances[0] || []
            }
        });

    } catch (error) {
        console.error('Search questions error:', error);
        res.status(500).json({
            message: 'Server error searching questions',
            error: error.message
        });
    }
});

// Get question statistics
router.get('/stats', async (req, res) => {
    try {
        const totalQuestions = await Question.countDocuments();
        const questionsBySection = await Question.aggregate([
            { $group: { _id: '$section', count: { $sum: 1 } } }
        ]);
        const questionsByDifficulty = await Question.aggregate([
            { $group: { _id: '$difficulty', count: { $sum: 1 } } }
        ]);
        const questionsByRole = await Question.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Get company RAG stats
        const companyRAGService = require('../services/companyRAGService');
        const companyStats = companyRAGService.getStats();

        res.json({
            success: true,
            stats: {
                database: {
                    total: totalQuestions,
                    bySection: questionsBySection,
                    byDifficulty: questionsByDifficulty,
                    byRole: questionsByRole
                },
                companyRAG: companyStats
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            message: 'Server error fetching statistics',
            error: error.message
        });
    }
});

module.exports = router;