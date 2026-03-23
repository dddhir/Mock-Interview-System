"""
Enhanced AI Feedback Service
Provides advanced interview evaluation using DistilBERT and disfluency models
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import logging
from contextlib import asynccontextmanager

from models.distilbert_evaluator import DistilBERTEvaluator
from models.disfluency_detector import DisfluencyDetector
from services.feedback_synthesizer import FeedbackSynthesizer
from utils.text_processor import TextProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model instances
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup"""
    logger.info("🚀 Loading AI models...")
    
    try:
        # Load DistilBERT model
        logger.info("Loading DistilBERT evaluator...")
        models["distilbert"] = DistilBERTEvaluator()
        await models["distilbert"].load_model()
        
        # Load Disfluency detector
        logger.info("Loading disfluency detector...")
        models["disfluency"] = DisfluencyDetector()
        await models["disfluency"].load_model()
        
        # Initialize feedback synthesizer
        models["synthesizer"] = FeedbackSynthesizer(
            distilbert_model=models["distilbert"],
            disfluency_model=models["disfluency"]
        )
        
        logger.info("✅ All models loaded successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        # Continue without models for graceful degradation
        models["fallback_mode"] = True
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down AI models...")

app = FastAPI(
    title="Enhanced AI Feedback Service",
    description="Advanced interview evaluation using DistilBERT and disfluency models",
    version="1.0.0",
    lifespan=lifespan
)

# Request/Response Models
class InterviewAnswer(BaseModel):
    question: str
    answer: str
    context: Dict = {}
    audio_features: Optional[Dict] = None  # For future audio analysis

class EvaluationResponse(BaseModel):
    technical_accuracy: Dict
    communication_quality: Dict
    semantic_analysis: Dict
    overall_score: float
    confidence: float
    detailed_feedback: str
    improvement_suggestions: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]
    follow_up_topics: List[str]
    processing_time: float

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": len([k for k in models.keys() if k != "fallback_mode"]),
        "fallback_mode": models.get("fallback_mode", False)
    }

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(request: InterviewAnswer):
    """
    Evaluate interview answer using multiple AI models
    """
    start_time = asyncio.get_event_loop().time()
    
    try:
        # Check if models are available
        if models.get("fallback_mode"):
            raise HTTPException(
                status_code=503, 
                detail="AI models not available, use fallback evaluation"
            )
        
        # Process the answer through multiple models
        logger.info(f"Evaluating answer for question: {request.question[:50]}...")
        
        # Run evaluations in parallel
        tasks = [
            models["distilbert"].evaluate(request.question, request.answer, request.context),
            models["disfluency"].analyze(request.answer, request.audio_features),
        ]
        
        distilbert_result, disfluency_result = await asyncio.gather(*tasks)
        
        # Synthesize comprehensive feedback
        evaluation = await models["synthesizer"].synthesize_feedback(
            question=request.question,
            answer=request.answer,
            context=request.context,
            distilbert_analysis=distilbert_result,
            disfluency_analysis=disfluency_result
        )
        
        processing_time = asyncio.get_event_loop().time() - start_time
        evaluation["processing_time"] = processing_time
        
        logger.info(f"✅ Evaluation completed in {processing_time:.2f}s")
        return EvaluationResponse(**evaluation)
        
    except Exception as e:
        logger.error(f"❌ Evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.post("/batch-evaluate")
async def batch_evaluate(requests: List[InterviewAnswer]):
    """
    Batch evaluation for multiple answers
    """
    try:
        tasks = [evaluate_answer(request) for request in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return {
            "results": results,
            "total_processed": len(requests),
            "successful": len([r for r in results if not isinstance(r, Exception)])
        }
        
    except Exception as e:
        logger.error(f"❌ Batch evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch evaluation failed: {str(e)}")

@app.get("/models/status")
async def get_model_status():
    """Get status of all loaded models"""
    status = {}
    
    for model_name, model in models.items():
        if model_name == "fallback_mode":
            continue
            
        try:
            if hasattr(model, 'get_status'):
                status[model_name] = await model.get_status()
            else:
                status[model_name] = {"loaded": True, "ready": True}
        except Exception as e:
            status[model_name] = {"loaded": False, "error": str(e)}
    
    return {
        "models": status,
        "fallback_mode": models.get("fallback_mode", False)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )