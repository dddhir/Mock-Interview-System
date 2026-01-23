const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const interviewSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    experience: { type: String, required: true },
    techStack: [String],
    currentRound: { type: String, enum: ['technical', 'project', 'hr'], default: 'technical' },
    currentQuestion: {
        id: String,
        text: String,
        topic: String,
        section: String
    },
    questionsAsked: [{
        question: String,
        answer: String,
        score: Number,
        feedback: String,
        topic: String,
        timestamp: { type: Date, default: Date.now }
    }],
    totalScore: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
    },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    bio: { type: String, default: '' },
    skills: [String],
    experience: { type: String, default: '' },
    resume: {
        filename: String,
        content: String,
        uploadDate: { type: Date, default: Date.now }
    },
    interviewSessions: [interviewSessionSchema]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);