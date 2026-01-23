# 🎯 AI Mock Interview System

An intelligent mock interview platform that creates personalized interview experiences using RAG (Retrieval-Augmented Generation) and AI. The system analyzes resumes, extracts projects and skills, and generates dynamic questions from a database of 1500+ real company interview questions.

## ✨ Features

### 🧠 **Intelligent Question Generation**

- **RAG-Powered**: 1500+ questions from 25 top tech companies (Google, Microsoft, Amazon, Meta, etc.)
- **Dynamic Flow**: Questions adapt based on user responses and profile
- **No Repetition**: Smart filtering prevents duplicate questions
- **Company-Specific**: Prioritizes target company's interview style

### 📄 **Smart Resume Processing**

- **Multi-Format Support**: PDF, DOC, DOCX, TXT
- **Regex-Based Extraction**: Reliable parsing of projects, experience, and skills
- **Quality Filtering**: Only extracts legitimate projects with tech stacks
- **Project Analysis**: Distinguishes between project titles and bullet points

### 🎮 **Personalized Experience**

- **Adaptive Difficulty**: Questions match experience level (Fresher to Staff)
- **Skill-Based Matching**: Questions relevant to user's tech stack
- **Flexible Length**: 1-20 questions (API credit control)
- **Real-Time Evaluation**: AI-powered answer assessment

### 🏗️ **Modern Tech Stack**

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React, Vite, TailwindCSS
- **AI**: Google Gemini 2.0 Flash
- **Storage**: CSV-based question database with vector embeddings

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB Atlas account
- Google Gemini API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ai-mock-interview-system.git
   cd ai-mock-interview-system
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:

   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_GENAI_API_KEY=your_gemini_api_key
   NODE_ENV=development
   TEST_MODE=false
   ```

5. **Start the application**

   **Backend (Terminal 1):**

   ```bash
   npm run dev
   ```

   **Frontend (Terminal 2):**

   ```bash
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001

## 📊 System Architecture

### Question Generation Flow

```
Resume Upload → Project/Skill Extraction → Company Selection →
CSV Question Search → Gemini Evaluation → Dynamic Next Question
```

### Data Sources

- **25 Company CSVs**: Google, Microsoft, Amazon, Meta, Netflix, etc.
- **1500+ Questions**: Technical, behavioral, and project-based
- **Smart Matching**: Semantic similarity + text matching
- **Fallback AI**: Gemini generates contextual questions when needed

## 🎯 How It Works

1. **Setup Phase**:
   - Upload resume (auto-extracts projects/skills)
   - Select target company and role
   - Choose experience level and question count

2. **Interview Phase**:
   - First question from company's question bank
   - AI evaluates each answer for satisfaction
   - Dynamic topic progression based on responses
   - Smart question selection prevents repetition

3. **Evaluation**:
   - Real-time scoring and feedback
   - Performance analysis
   - Interview history tracking

## 📁 Project Structure

```
ai-mock-interview-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   └── contexts/       # React contexts
├── services/               # Backend services
│   ├── resumeProcessor.js  # Resume parsing logic
│   ├── companyRAGService.js # Question matching
│   └── geminiService.js    # AI integration
├── routes/                 # API routes
├── models/                 # Database models
├── Questions Dataset/      # Company question CSVs
├── embeddings/            # Cached vector embeddings
└── scripts/               # Utility scripts
```

## 🔧 Configuration

### Question Count Options

- **5 Questions**: Quick practice (~10 mins)
- **10 Questions**: Standard interview (~20 mins)
- **15 Questions**: Comprehensive (~30 mins)
- **20 Questions**: Full interview (~45 mins)

### Supported Companies

Google, Microsoft, Amazon, Meta, Netflix, Apple, Adobe, Airbnb, Bloomberg, Flipkart, IBM, Intel, LinkedIn, Nvidia, Oracle, PayPal, Qualcomm, Salesforce, Samsung, SAP, Stripe, Swiggy, Uber, Zomato, Atlassian

## �️ Development

### Available Scripts

**Backend:**

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run generate-embeddings` - Generate question embeddings

**Frontend:**

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing

```bash
# Test resume processing
node test-enhanced-system.js

# Test question generation
node test-gemini-rag.js
```

## 🔒 Security Features

- Environment variable protection (.env in .gitignore)
- JWT-based authentication
- Input validation and sanitization
- File upload restrictions (type and size)
- API rate limiting considerations

## 📈 Performance

- **Fast Resume Processing**: Regex-based parsing (no AI overhead)
- **Efficient Question Matching**: Cached embeddings + text similarity
- **Minimal API Usage**: Gemini only for evaluation and fallback
- **Scalable Architecture**: Stateless design with session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent question generation
- Company interview question datasets
- Open source community for tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

**Built with ❤️ for better interview preparation**
