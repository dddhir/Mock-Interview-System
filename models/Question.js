const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    section: { type: String, enum: ['technical', 'project', 'hr'], required: true },
    tags: [String],
    expectedAnswer: String,
    followUpQuestions: [String]
}, { timestamps: true });

// Index for efficient querying
questionSchema.index({ company: 1, role: 1, section: 1, topic: 1 });
questionSchema.index({ section: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);