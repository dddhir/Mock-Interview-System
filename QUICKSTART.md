# 🚀 Quick Start Guide

## Prerequisites

- Node.js (v16+)
- Python 3.8+
- MongoDB (local or Atlas)
- Google Gemini API key

## 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

## 2. Setup Environment

```bash
# Update .env file with your API key
GOOGLE_GENAI_API_KEY=your_actual_api_key_here
```

## 3. Install Dependencies

```bash
# Backend dependencies (already done)
npm install

# Frontend dependencies (already done)
cd client && npm install && cd ..
```

## 4. Setup ChromaDB & Database

```bash
# Option A: Run setup script (Windows)
setup.bat

# Option B: Manual setup
pip install chromadb
chroma run --host localhost --port 8000
# In another terminal:
node scripts/setup.js
```

## 5. Start the Application

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

## 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ChromaDB: http://localhost:8000

## 🎯 First Steps

1. Register a new account
2. Complete your profile
3. Upload your resume (optional)
4. Start your first mock interview!

## 🔧 Troubleshooting

### ChromaDB Issues

```bash
# If ChromaDB fails to start
pip install --upgrade chromadb
chroma run --host localhost --port 8000
```

### MongoDB Issues

- Make sure MongoDB is running locally, or
- Update `MONGODB_URI` in `.env` to use MongoDB Atlas

### API Key Issues

- Verify your Gemini API key is correct
- Check API quotas and billing in Google Cloud Console

## 📚 Features to Try

- **Smart Question Selection**: Questions adapt to your answers
- **Resume Analysis**: Upload resume for personalized questions
- **Multi-Round Interviews**: Technical → Project → HR rounds
- **Real-time Feedback**: Instant AI evaluation and scoring
- **Progress Tracking**: View your interview history and improvement

## 🆘 Need Help?

- Check the main README.md for detailed documentation
- Review the API endpoints in the code
- Ensure all services are running (MongoDB, ChromaDB, Backend, Frontend)
