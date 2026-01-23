@echo off
echo ========================================
echo AI Mock Interview System - Setup
echo ========================================

echo.
echo 1. Installing dependencies...
call npm install

echo.
echo 2. Setting up client dependencies...
cd client
call npm install
cd ..

echo.
echo 3. Checking environment configuration...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  Please edit .env file and add your GOOGLE_GENAI_API_KEY
    echo    (Optional - system works without it using text similarity)
) else (
    echo ✅ .env file already exists
)

echo.
echo 4. Generating embeddings for all companies...
call npm run generate-embeddings

echo.
echo ========================================
echo ✅ Setup Complete!
echo ========================================
echo.
echo 🚀 To start the system:
echo    1. Backend: npm run start
echo    2. Frontend: cd client && npm start
echo    3. Open: http://localhost:3000/test-interview
echo.
echo 📊 System includes:
echo    • 25+ company datasets (Google, Microsoft, Netflix, etc.)
echo    • 1500+ real interview questions
echo    • RAG-powered question selection
echo    • Company-specific interviews
echo    • No authentication required
echo.
echo 🧪 Test the system: node test-system.js
echo ========================================

pause