const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/auth');
const interviewRoutes = require('./routes/interview');
const ragRoutes = require('./routes/rag');
const transcriptionRoutes = require('./routes/transcriptionRoutes');

// Import services
const companyRAGService = require('./services/companyRAGService');
const { startup } = require('./scripts/startup');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB with better error handling (optional for interviews)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 5s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        // Remove the problematic buffer settings to allow queuing
        // bufferMaxEntries: 0, 
        // bufferCommands: false,
    })
        .then(() => console.log('✅ MongoDB connected'))
        .catch(err => {
            console.error('⚠️  MongoDB connection error:', err.message);
            console.log('🔄 System will continue with Company RAG (MongoDB not required for interviews)');
        });
} else {
    console.log('🔄 No MongoDB URI provided, running in interview-only mode');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/interview', transcriptionRoutes);
app.use('/api/rag', ragRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Mock Interview System is running' });
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Run startup process (includes embedding generation if needed)
    try {
        console.log('🚀 Running startup process...');
        const startupSuccess = await startup();

        if (startupSuccess) {
            console.log('✅ System fully initialized and ready for interviews');
        } else {
            console.log('⚠️  Startup completed with warnings, but system is functional');
        }
    } catch (error) {
        console.error('⚠️  Startup process failed:', error);
        console.log('🔄 Server will continue running with basic functionality');
    }
});

// Export app for Vercel
module.exports = app;