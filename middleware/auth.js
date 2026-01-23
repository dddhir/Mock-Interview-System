const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        try {
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
        } catch (dbError) {
            console.error('Database error in auth, using fallback:', dbError.message);
            // Fallback user for testing when MongoDB is down
            req.user = {
                id: decoded.id,
                email: 'test@example.com',
                name: 'Test User',
                skills: ['javascript', 'react', 'nodejs'],
                resume: null,
                interviewSessions: []
            };
        }

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };