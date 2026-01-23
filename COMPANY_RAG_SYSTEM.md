# AI Mock Interview System - Company RAG Implementation

## 🎯 Overview

This system provides company-specific AI mock interviews using Retrieval-Augmented Generation (RAG) with real interview questions from 27+ top tech companies. The system intelligently selects follow-up questions based on your answers using semantic similarity and Gemini AI decision-making.

## 🏢 Supported Companies

The system includes interview questions from:

- **FAANG**: Meta (Facebook), Apple, Amazon, Netflix, Google
- **Tech Giants**: Microsoft, Adobe, Intel, IBM, Oracle, SAP
- **Unicorns**: Uber, Airbnb, Stripe, LinkedIn, PayPal
- **Others**: Nvidia, Qualcomm, Salesforce, Samsung, Bloomberg, Atlassian
- **Indian Companies**: Flipkart, Swiggy, Zomato

## 🚀 Key Features

### 1. **Pre-generated Embeddings**

- All company questions have pre-computed embeddings stored locally
- No need to regenerate embeddings on every startup
- Fast question retrieval and similarity matching

### 2. **Company-Specific Interviews**

- Select from 27+ companies in the dropdown
- Questions are filtered to only come from the selected company
- Each company has 50-200+ real interview questions

### 3. **Intelligent Question Flow**

- RAG-powered similarity search finds relevant follow-up questions
- Gemini AI makes decisions about interview progression
- Adaptive difficulty based on your answers

### 4. **No Authentication Required**

- Direct access to company interviews
- Mock user profile with realistic resume data
- Focus on testing the RAG system, not user management

## 📁 System Architecture

```
services/
├── companyManager.js          # Manages company datasets and metadata
├── embeddingStorage.js        # Handles embedding caching and storage
├── companyRAGService.js       # Core RAG functionality
├── interviewStateManager.js   # Tracks interview state and progress
├── answerEvaluator.js         # Evaluates answers using Gemini AI
└── questionDecisionEngine.js  # Makes intelligent question selection decisions

scripts/
├── generateEmbeddings.js      # Pre-generates embeddings for all companies
├── startup.js                 # System initialization and health checks
└── test-system.js             # Comprehensive system testing

embeddings/                    # Cached embedding files (auto-generated)
├── google_embeddings.json
├── microsoft_embeddings.json
└── ... (one file per company)
```

## 🛠️ Setup Instructions

### 1. **Environment Setup**

```bash
# Copy environment file
cp .env.example .env

# Add your Gemini API key (optional - system works without it)
GOOGLE_GENAI_API_KEY=your_api_key_here
TEST_MODE=true  # Uses text similarity if no API key
```

### 2. **Install Dependencies**

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. **Generate Embeddings (First Time)**

```bash
# Generate embeddings for all companies
npm run generate-embeddings

# Or use the full startup process
npm run startup
```

### 4. **Start the System**

```bash
# Start backend (includes embedding generation if needed)
npm run start

# In another terminal, start frontend
cd client && npm start
```

### 5. **Test the System**

```bash
# Run comprehensive system test
node test-system.js
```

## 🎮 Usage

1. **Navigate to Test Interface**: `http://localhost:3000/test-interview`
2. **Select Company**: Choose from the dropdown (e.g., Google, Microsoft, Netflix)
3. **Set Role & Experience**: Configure your interview parameters
4. **Start Interview**: Begin with company-specific questions
5. **Answer Questions**: Provide detailed technical answers
6. **Get Follow-ups**: System finds relevant questions based on your answers

## 📊 System Statistics

After initialization, you'll see:

```
📈 COMPANY RAG SERVICE STATISTICS
================================================================================
Google: 156 questions, 156 with embeddings
Microsoft: 142 questions, 142 with embeddings
Netflix: 98 questions, 98 with embeddings
Meta: 134 questions, 134 with embeddings
Amazon: 187 questions, 187 with embeddings
... (and 22 more companies)
--------------------------------------------------------------------------------
Total: 3,247 questions across 27/27 companies
================================================================================
```

## 🧠 How RAG Works

### 1. **Question Embedding**

- Each question is converted to a 384-dimensional vector
- Uses Google's Gemini embedding model (or text-based fallback)
- Embeddings are cached locally for fast retrieval

### 2. **Similarity Search**

- Your answer is embedded using the same method
- Cosine similarity calculated against all company questions
- Combined with text-based matching for better accuracy

### 3. **Intelligent Selection**

- Gemini AI analyzes the context and makes decisions:
  - Continue with similar topics
  - Increase difficulty
  - Switch to different areas
  - Move to next interview round

### 4. **Company Filtering**

- Only questions from the selected company are considered
- No mixing of questions from different companies
- Maintains authentic company interview experience

## 🔧 Available Scripts

```bash
npm run start                 # Start server with full initialization
npm run dev                   # Development mode with nodemon
npm run generate-embeddings   # Generate embeddings for all companies
npm run startup              # Run startup checks and embedding generation
npm run setup               # Full setup: startup + start server
node test-system.js         # Test all system components
```

## 📈 Performance Optimizations

### 1. **Embedding Caching**

- Embeddings generated once and stored in `embeddings/` folder
- Startup time reduced from 5+ minutes to seconds
- No API calls needed for cached embeddings

### 2. **Smart Loading**

- Only loads embeddings for companies with questions
- Lazy loading of company data
- Memory-efficient storage format

### 3. **Fast Similarity Search**

- Pre-computed embeddings enable instant similarity calculation
- Combined text + embedding similarity for better accuracy
- Efficient filtering of already-asked questions

## 🐛 Troubleshooting

### **No Companies in Dropdown**

```bash
# Check if CSV files exist
ls "Questions Dataset/"

# Regenerate embeddings
npm run generate-embeddings
```

### **Slow Startup**

```bash
# Check if embeddings are cached
ls embeddings/

# If missing, generate them
npm run generate-embeddings
```

### **API Errors**

```bash
# Set test mode in .env
TEST_MODE=true

# System will use text-based similarity instead of Gemini embeddings
```

### **Question Repetition**

- System tracks asked questions and excludes them from RAG search
- If all questions exhausted, generates dynamic fallback questions
- Check console logs for filtering statistics

## 🎯 Testing Different Scenarios

### **Test Company Coverage**

```javascript
// Check which companies have questions
const companies = companyManager.getAllCompanies();
companies.forEach((c) =>
  console.log(`${c.displayName}: ${c.questionCount} questions`)
);
```

### **Test RAG Similarity**

```javascript
// Test similarity search
const questions = await companyRAGService.findRelevantQuestions(
  "google",
  "I use React and Node.js for web development",
  { role: "Software Engineer", experience: "mid" },
  5
);
```

### **Test Question Filtering**

```javascript
// Test company-specific filtering
const googleQuestions = companyRAGService.companyQuestions["google"];
console.log(`Google has ${googleQuestions.length} questions`);
```

## 🚀 Next Steps

1. **Add More Companies**: Drop new CSV files in `Questions Dataset/`
2. **Improve Embeddings**: Experiment with different embedding models
3. **Enhanced Filtering**: Add role-specific and difficulty-based filtering
4. **Analytics**: Track question effectiveness and user performance
5. **Real-time Updates**: Hot-reload new questions without restart

## 📝 Notes

- **No Database Required**: System works entirely with CSV files and local storage
- **Offline Capable**: Once embeddings are generated, works without internet
- **Scalable**: Easy to add new companies by adding CSV files
- **Customizable**: Modify question selection logic in `companyRAGService.js`

---

**Ready to test company-specific AI interviews with RAG-powered question selection!** 🎉
