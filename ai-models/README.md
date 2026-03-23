# 🤖 Enhanced AI Feedback Service

Advanced interview evaluation using DistilBERT and disfluency detection models.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager
- At least 4GB RAM (8GB recommended)

### Installation

1. **Navigate to AI models directory:**
   ```bash
   cd ai-models
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the AI service:**
   ```bash
   python start.py
   ```

The service will start on `http://localhost:8000`

### Verification

Check if the service is running:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": 2,
  "fallback_mode": false
}
```

## 🧠 Model Architecture

### DistilBERT Evaluator
- **Purpose**: Technical accuracy and semantic analysis
- **Capabilities**: 
  - Technical concept recognition
  - Answer completeness assessment
  - Semantic coherence analysis
  - Domain-specific knowledge evaluation

### Disfluency Detector
- **Purpose**: Communication quality analysis
- **Capabilities**:
  - Filler word detection
  - Hesitation pattern recognition
  - Speech confidence scoring
  - Fluency assessment

## 📊 API Endpoints

### Health Check
```
GET /health
```

### Evaluate Answer
```
POST /evaluate
Content-Type: application/json

{
  "question": "Explain how binary search works",
  "answer": "Binary search is an algorithm that...",
  "context": {
    "role": "Software Engineer",
    "experience": "Mid Level",
    "topic": "Algorithms"
  }
}
```

### Batch Evaluation
```
POST /batch-evaluate
Content-Type: application/json

[
  {
    "question": "Question 1",
    "answer": "Answer 1",
    "context": {...}
  },
  {
    "question": "Question 2", 
    "answer": "Answer 2",
    "context": {...}
  }
]
```

### Model Status
```
GET /models/status
```

## 🔧 Configuration

### Environment Variables
- `AI_SERVICE_PORT`: Port for the AI service (default: 8000)
- `MODEL_CACHE_DIR`: Directory for model caching
- `LOG_LEVEL`: Logging level (INFO, DEBUG, WARNING, ERROR)

### Performance Tuning
- **CPU**: Service will use all available CPU cores
- **Memory**: Models require ~2GB RAM when loaded
- **GPU**: CUDA support automatically detected if available

## 🚨 Troubleshooting

### Common Issues

1. **Models not loading:**
   ```
   Error: Failed to load DistilBERT models
   ```
   **Solution**: Ensure you have sufficient RAM and internet connection for model download

2. **Port already in use:**
   ```
   Error: Port 8000 is already in use
   ```
   **Solution**: Kill existing process or change port in configuration

3. **Dependencies missing:**
   ```
   ImportError: No module named 'transformers'
   ```
   **Solution**: Run `pip install -r requirements.txt`

### Performance Issues

- **Slow evaluation**: First evaluation takes longer due to model loading
- **Memory usage**: Models are cached in memory for faster subsequent evaluations
- **GPU acceleration**: Install CUDA-compatible PyTorch for GPU acceleration

## 📈 Integration with Main System

The AI service integrates with the main Node.js backend through:

1. **Health checks**: Automatic service availability detection
2. **Fallback mechanism**: Graceful degradation to Gemini-only evaluation
3. **Enhanced feedback**: Multi-model analysis for comprehensive evaluation
4. **Real-time processing**: Sub-2-second response times for single evaluations

## 🔄 Development

### Running in Development Mode
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test evaluation endpoint
curl -X POST http://localhost:8000/evaluate \
  -H "Content-Type: application/json" \
  -d '{"question": "Test question", "answer": "Test answer", "context": {}}'
```

### Adding New Models

1. Create model class in `models/` directory
2. Implement required methods: `load_model()`, `evaluate()`, `get_status()`
3. Register model in `main.py` startup sequence
4. Update `FeedbackSynthesizer` to include new model outputs

## 📝 License

This AI service is part of the AI Mock Interview System and follows the same licensing terms.