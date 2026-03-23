const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name: name || ''
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                skills: user.skills,
                experience: user.experience
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, bio, skills, experience } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name: name || req.user.name,
                bio: bio || req.user.bio,
                skills: skills || req.user.skills,
                experience: experience || req.user.experience
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// Get user interview history
router.get('/interview-history', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('interviewSessions');
        
        if (!user || !user.interviewSessions) {
            return res.json({
                success: true,
                history: []
            });
        }

        // Transform data for chart consumption
        const history = user.interviewSessions
            .filter(session => session.status === 'completed')
            .map(session => {
                const avgScore = session.totalScore / Math.max(session.questionsAsked.length, 1);
                
                // Calculate technical score (average of technical questions)
                const technicalQuestions = session.questionsAsked.filter(qa => 
                    qa.topic && !['HR', 'Behavioral', 'General'].includes(qa.topic)
                );
                const technicalScore = technicalQuestions.length > 0 
                    ? technicalQuestions.reduce((sum, qa) => sum + (qa.score || 0), 0) / technicalQuestions.length
                    : avgScore;

                return {
                    sessionId: session.sessionId,
                    date: session.completedAt || session.createdAt,
                    company: session.company,
                    role: session.role,
                    experience: session.experience,
                    overallScore: avgScore,
                    technicalScore: technicalScore,
                    questionsAnswered: session.questionsAsked.length,
                    duration: session.completedAt && session.createdAt 
                        ? Math.round((new Date(session.completedAt) - new Date(session.createdAt)) / (1000 * 60)) + ' min'
                        : null,
                    topics: [...new Set(session.questionsAsked.map(qa => qa.topic).filter(Boolean))]
                };
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Interview history fetch error:', error);
        res.status(500).json({ message: 'Server error fetching interview history' });
    }
});

module.exports = router;