"""
Disfluency Detection Model
Analyzes speech patterns, filler words, and communication quality
"""

import asyncio
import logging
import re
from typing import Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

class DisfluencyDetector:
    """
    Analyzes speech patterns and communication quality
    """
    
    def __init__(self):
        self.filler_words = self._load_filler_words()
        self.hesitation_patterns = self._load_hesitation_patterns()
        self.confidence_indicators = self._load_confidence_indicators()
        
    async def load_model(self):
        """Initialize the disfluency detection model"""
        try:
            logger.info("Loading disfluency detection patterns...")
            # In a real implementation, this would load a trained model
            # For now, we'll use rule-based detection with pattern matching
            logger.info("✅ Disfluency detector ready")
            
        except Exception as e:
            logger.error(f"❌ Failed to load disfluency detector: {e}")
            raise
    
    def _load_filler_words(self) -> Dict[str, List[str]]:
        """Load filler words categorized by type"""
        return {
            "basic_fillers": [
                "um", "uh", "er", "ah", "eh", "mm", "hmm"
            ],
            "discourse_markers": [
                "like", "you know", "i mean", "sort of", "kind of", 
                "basically", "actually", "literally", "obviously"
            ],
            "hesitation_sounds": [
                "umm", "uhh", "err", "ahh", "well", "so"
            ],
            "repetitions": [
                # These will be detected dynamically
            ]
        }
    
    def _load_hesitation_patterns(self) -> List[str]:
        """Load patterns that indicate hesitation"""
        return [
            r'\b(well|so|um|uh)\s+',  # Starting with hesitation
            r'\b(\w+)\s+\1\b',        # Word repetition
            r'\.{2,}',                # Multiple dots (pauses)
            r'\s{2,}',                # Multiple spaces (long pauses)
            r'\b(i|I)\s+(think|guess|believe)\s+',  # Uncertainty markers
        ]
    
    def _load_confidence_indicators(self) -> Dict[str, List[str]]:
        """Load indicators of confidence levels"""
        return {
            "high_confidence": [
                "definitely", "certainly", "absolutely", "clearly", "obviously",
                "without doubt", "i'm confident", "i know", "the answer is"
            ],
            "medium_confidence": [
                "i think", "probably", "likely", "it seems", "appears to be",
                "i believe", "in my opinion", "from my experience"
            ],
            "low_confidence": [
                "i'm not sure", "maybe", "perhaps", "i guess", "possibly",
                "i don't know", "not certain", "might be", "could be"
            ]
        }
    
    async def analyze(self, answer: str, audio_features: Optional[Dict] = None) -> Dict:
        """
        Comprehensive disfluency analysis
        """
        try:
            # Run analysis components in parallel
            tasks = [
                self._detect_filler_words(answer),
                self._analyze_hesitation_patterns(answer),
                self._assess_confidence_level(answer),
                self._calculate_fluency_score(answer),
                self._analyze_speech_pace(answer, audio_features)
            ]
            
            (filler_analysis, hesitation_analysis, confidence_analysis, 
             fluency_score, pace_analysis) = await asyncio.gather(*tasks)
            
            # Calculate overall communication quality score
            overall_score = self._calculate_overall_score(
                filler_analysis, hesitation_analysis, confidence_analysis, fluency_score
            )
            
            return {
                "filler_words": filler_analysis,
                "hesitation_patterns": hesitation_analysis,
                "confidence_assessment": confidence_analysis,
                "fluency_score": fluency_score,
                "speech_pace": pace_analysis,
                "overall_communication_score": overall_score,
                "recommendations": self._generate_recommendations(
                    filler_analysis, hesitation_analysis, confidence_analysis
                )
            }
            
        except Exception as e:
            logger.error(f"❌ Disfluency analysis failed: {e}")
            return self._fallback_analysis(answer)
    
    async def _detect_filler_words(self, answer: str) -> Dict:
        """Detect and count filler words"""
        try:
            answer_lower = answer.lower()
            detected_fillers = {}
            total_filler_count = 0
            
            for category, words in self.filler_words.items():
                category_count = 0
                found_words = []
                
                for word in words:
                    # Use word boundaries for accurate matching
                    pattern = r'\b' + re.escape(word) + r'\b'
                    matches = re.findall(pattern, answer_lower)
                    count = len(matches)
                    
                    if count > 0:
                        category_count += count
                        found_words.extend([word] * count)
                
                detected_fillers[category] = {
                    "count": category_count,
                    "words": found_words
                }
                total_filler_count += category_count
            
            # Calculate filler density (fillers per 100 words)
            word_count = len(answer.split())
            filler_density = (total_filler_count / max(word_count, 1)) * 100
            
            # Score based on filler density (lower is better)
            if filler_density <= 2:
                score = 10
            elif filler_density <= 5:
                score = 8
            elif filler_density <= 10:
                score = 6
            elif filler_density <= 15:
                score = 4
            else:
                score = 2
            
            return {
                "total_count": total_filler_count,
                "density": round(filler_density, 2),
                "score": score,
                "categories": detected_fillers,
                "confidence": 0.9
            }
            
        except Exception as e:
            logger.error(f"Filler word detection failed: {e}")
            return {"total_count": 0, "density": 0, "score": 7, "confidence": 0.3}
    
    async def _analyze_hesitation_patterns(self, answer: str) -> Dict:
        """Analyze hesitation patterns in the answer"""
        try:
            hesitation_count = 0
            detected_patterns = []
            
            for pattern in self.hesitation_patterns:
                matches = re.findall(pattern, answer, re.IGNORECASE)
                if matches:
                    hesitation_count += len(matches)
                    detected_patterns.extend(matches)
            
            # Detect word repetitions
            words = answer.lower().split()
            repetitions = []
            for i in range(len(words) - 1):
                if words[i] == words[i + 1] and len(words[i]) > 2:
                    repetitions.append(words[i])
                    hesitation_count += 1
            
            # Score based on hesitation frequency
            word_count = len(answer.split())
            hesitation_rate = hesitation_count / max(word_count, 1) * 100
            
            if hesitation_rate <= 1:
                score = 10
            elif hesitation_rate <= 3:
                score = 8
            elif hesitation_rate <= 6:
                score = 6
            elif hesitation_rate <= 10:
                score = 4
            else:
                score = 2
            
            return {
                "hesitation_count": hesitation_count,
                "hesitation_rate": round(hesitation_rate, 2),
                "score": score,
                "patterns_detected": detected_patterns,
                "repetitions": repetitions,
                "confidence": 0.8
            }
            
        except Exception as e:
            logger.error(f"Hesitation analysis failed: {e}")
            return {"hesitation_count": 0, "score": 7, "confidence": 0.3}
    
    async def _assess_confidence_level(self, answer: str) -> Dict:
        """Assess the confidence level of the speaker"""
        try:
            answer_lower = answer.lower()
            confidence_scores = {"high": 0, "medium": 0, "low": 0}
            
            for level, indicators in self.confidence_indicators.items():
                for indicator in indicators:
                    if indicator in answer_lower:
                        confidence_scores[level] += 1
            
            # Determine overall confidence level
            total_indicators = sum(confidence_scores.values())
            
            if total_indicators == 0:
                confidence_level = "medium"
                confidence_score = 7
            else:
                # Calculate weighted confidence
                weighted_score = (
                    confidence_scores["high"] * 10 +
                    confidence_scores["medium"] * 7 +
                    confidence_scores["low"] * 3
                ) / total_indicators
                
                if weighted_score >= 8:
                    confidence_level = "high"
                elif weighted_score >= 6:
                    confidence_level = "medium"
                else:
                    confidence_level = "low"
                
                confidence_score = weighted_score
            
            return {
                "level": confidence_level,
                "score": round(confidence_score, 1),
                "indicators": confidence_scores,
                "total_indicators": total_indicators,
                "confidence": 0.8
            }
            
        except Exception as e:
            logger.error(f"Confidence assessment failed: {e}")
            return {"level": "medium", "score": 7, "confidence": 0.3}
    
    async def _calculate_fluency_score(self, answer: str) -> Dict:
        """Calculate overall fluency score"""
        try:
            # Basic fluency metrics
            sentences = [s.strip() for s in answer.split('.') if s.strip()]
            words = answer.split()
            
            # Sentence length variation (good fluency has varied sentence lengths)
            if len(sentences) > 1:
                sentence_lengths = [len(s.split()) for s in sentences]
                length_variance = np.var(sentence_lengths)
                # Normalize variance score (moderate variance is good)
                variance_score = max(0, 10 - abs(length_variance - 5))
            else:
                variance_score = 5
            
            # Word complexity (longer words might indicate better vocabulary)
            avg_word_length = sum(len(word) for word in words) / max(len(words), 1)
            complexity_score = min(10, avg_word_length * 1.5)
            
            # Sentence structure variety
            question_count = answer.count('?')
            exclamation_count = answer.count('!')
            structure_variety = min(10, (question_count + exclamation_count) * 2 + 6)
            
            # Overall fluency score
            fluency_score = (variance_score * 0.4 + complexity_score * 0.3 + structure_variety * 0.3)
            
            return {
                "score": round(fluency_score, 1),
                "sentence_count": len(sentences),
                "avg_sentence_length": round(sum(len(s.split()) for s in sentences) / max(len(sentences), 1), 1),
                "avg_word_length": round(avg_word_length, 1),
                "sentence_variety": structure_variety,
                "confidence": 0.7
            }
            
        except Exception as e:
            logger.error(f"Fluency calculation failed: {e}")
            return {"score": 7, "confidence": 0.3}
    
    async def _analyze_speech_pace(self, answer: str, audio_features: Optional[Dict]) -> Dict:
        """Analyze speech pace (placeholder for future audio analysis)"""
        try:
            # For now, estimate pace based on text characteristics
            word_count = len(answer.split())
            
            # Estimate speaking time based on average speaking rate (150-200 WPM)
            estimated_duration = word_count / 175  # Average WPM
            
            # Pace assessment based on word density
            if word_count < 20:
                pace_assessment = "too_slow"
                pace_score = 5
            elif word_count < 50:
                pace_assessment = "slow"
                pace_score = 7
            elif word_count < 150:
                pace_assessment = "good"
                pace_score = 9
            elif word_count < 250:
                pace_assessment = "fast"
                pace_score = 8
            else:
                pace_assessment = "too_fast"
                pace_score = 6
            
            return {
                "assessment": pace_assessment,
                "score": pace_score,
                "estimated_duration": round(estimated_duration, 1),
                "word_count": word_count,
                "confidence": 0.5  # Low confidence without actual audio
            }
            
        except Exception as e:
            logger.error(f"Speech pace analysis failed: {e}")
            return {"assessment": "unknown", "score": 7, "confidence": 0.3}
    
    def _calculate_overall_score(self, filler_analysis: Dict, hesitation_analysis: Dict, 
                               confidence_analysis: Dict, fluency_score: Dict) -> Dict:
        """Calculate overall communication quality score"""
        try:
            # Weighted average of all components
            overall_score = (
                filler_analysis["score"] * 0.25 +
                hesitation_analysis["score"] * 0.25 +
                confidence_analysis["score"] * 0.25 +
                fluency_score["score"] * 0.25
            )
            
            # Overall confidence based on individual confidences
            overall_confidence = (
                filler_analysis["confidence"] * 0.25 +
                hesitation_analysis["confidence"] * 0.25 +
                confidence_analysis["confidence"] * 0.25 +
                fluency_score["confidence"] * 0.25
            )
            
            return {
                "score": round(overall_score, 1),
                "confidence": round(overall_confidence, 2),
                "components": {
                    "filler_words": filler_analysis["score"],
                    "hesitation": hesitation_analysis["score"],
                    "confidence": confidence_analysis["score"],
                    "fluency": fluency_score["score"]
                }
            }
            
        except Exception as e:
            logger.error(f"Overall score calculation failed: {e}")
            return {"score": 7, "confidence": 0.3}
    
    def _generate_recommendations(self, filler_analysis: Dict, hesitation_analysis: Dict, 
                                confidence_analysis: Dict) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        try:
            # Filler word recommendations
            if filler_analysis["density"] > 10:
                recommendations.append("Practice speaking more slowly and pause instead of using filler words")
            elif filler_analysis["density"] > 5:
                recommendations.append("Try to reduce filler words by taking brief pauses to think")
            
            # Hesitation recommendations
            if hesitation_analysis["hesitation_rate"] > 5:
                recommendations.append("Practice your answers beforehand to reduce hesitation")
                recommendations.append("Use the STAR method to structure your responses")
            
            # Confidence recommendations
            if confidence_analysis["level"] == "low":
                recommendations.append("Use more definitive language to sound more confident")
                recommendations.append("Practice positive self-talk before interviews")
            elif confidence_analysis["level"] == "high":
                recommendations.append("Great confidence level! Maintain this positive energy")
            
            # General recommendations
            if not recommendations:
                recommendations.append("Your communication style is good! Keep practicing to maintain fluency")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
            return ["Continue practicing to improve your communication skills"]
    
    def _fallback_analysis(self, answer: str) -> Dict:
        """Fallback analysis when detection fails"""
        word_count = len(answer.split())
        base_score = min(10, word_count / 15)
        
        return {
            "filler_words": {"total_count": 0, "density": 0, "score": base_score},
            "hesitation_patterns": {"hesitation_count": 0, "score": base_score},
            "confidence_assessment": {"level": "medium", "score": base_score},
            "fluency_score": {"score": base_score},
            "overall_communication_score": {"score": base_score, "confidence": 0.3},
            "recommendations": ["Analysis unavailable, continue practicing communication skills"],
            "fallback": True
        }
    
    async def get_status(self) -> Dict:
        """Get model status"""
        return {
            "loaded": True,
            "ready": True,
            "filler_categories": len(self.filler_words),
            "hesitation_patterns": len(self.hesitation_patterns)
        }