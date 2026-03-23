"""
Feedback Synthesizer
Combines DistilBERT and disfluency analysis to generate comprehensive feedback
"""

import asyncio
import logging
from typing import Dict, List
import json

logger = logging.getLogger(__name__)

class FeedbackSynthesizer:
    """
    Synthesizes comprehensive feedback from multiple AI model outputs
    """
    
    def __init__(self, distilbert_model, disfluency_model):
        self.distilbert_model = distilbert_model
        self.disfluency_model = disfluency_model
        
    async def synthesize_feedback(self, question: str, answer: str, context: Dict,
                                distilbert_analysis: Dict, disfluency_analysis: Dict) -> Dict:
        """
        Synthesize comprehensive feedback from all AI analyses
        """
        try:
            # Extract key metrics
            technical_accuracy = distilbert_analysis.get("technical_accuracy", {})
            communication_quality = disfluency_analysis.get("overall_communication_score", {})
            
            # Calculate overall score (weighted combination)
            overall_score = self._calculate_weighted_score(distilbert_analysis, disfluency_analysis)
            
            # Generate detailed feedback components
            feedback_components = await asyncio.gather(
                self._generate_technical_feedback(distilbert_analysis, context),
                self._generate_communication_feedback(disfluency_analysis),
                self._generate_improvement_suggestions(distilbert_analysis, disfluency_analysis, context),
                self._identify_strengths(distilbert_analysis, disfluency_analysis),
                self._identify_improvement_areas(distilbert_analysis, disfluency_analysis)
            )
            
            (technical_feedback, communication_feedback, suggestions, 
             strengths, improvement_areas) = feedback_components
            
            # Synthesize comprehensive feedback text
            detailed_feedback = self._synthesize_detailed_feedback(
                technical_feedback, communication_feedback, distilbert_analysis, disfluency_analysis
            )
            
            # Generate follow-up topics
            follow_up_topics = self._generate_follow_up_topics(distilbert_analysis, context)
            
            return {
                "technical_accuracy": {
                    "score": technical_accuracy.get("score", 5),
                    "confidence": technical_accuracy.get("confidence", 0.5),
                    "domain": technical_accuracy.get("domain", "general"),
                    "keyword_coverage": technical_accuracy.get("keyword_coverage", 0),
                    "found_keywords": technical_accuracy.get("found_keywords", [])
                },
                "communication_quality": {
                    "score": communication_quality.get("score", 7),
                    "confidence": communication_quality.get("confidence", 0.5),
                    "filler_density": disfluency_analysis.get("filler_words", {}).get("density", 0),
                    "hesitation_rate": disfluency_analysis.get("hesitation_patterns", {}).get("hesitation_rate", 0),
                    "confidence_level": disfluency_analysis.get("confidence_assessment", {}).get("level", "medium"),
                    "fluency_score": disfluency_analysis.get("fluency_score", {}).get("score", 7)
                },
                "semantic_analysis": {
                    "coherence_score": distilbert_analysis.get("coherence", {}).get("score", 7),
                    "completeness": distilbert_analysis.get("completeness", {}).get("score", 7) / 10,
                    "depth_level": self._assess_depth_level(distilbert_analysis.get("depth", {})),
                    "relevance": 0.85  # Placeholder - would need semantic similarity model
                },
                "overall_score": overall_score,
                "confidence": min(
                    technical_accuracy.get("confidence", 0.5),
                    communication_quality.get("confidence", 0.5)
                ),
                "detailed_feedback": detailed_feedback,
                "improvement_suggestions": suggestions,
                "strengths": strengths,
                "areas_for_improvement": improvement_areas,
                "follow_up_topics": follow_up_topics
            }
            
        except Exception as e:
            logger.error(f"❌ Feedback synthesis failed: {e}")
            return self._fallback_feedback(answer)
    
    def _calculate_weighted_score(self, distilbert_analysis: Dict, disfluency_analysis: Dict) -> float:
        """Calculate weighted overall score from all analyses"""
        try:
            # Extract scores
            technical_score = distilbert_analysis.get("overall_score", 5)
            communication_score = disfluency_analysis.get("overall_communication_score", {}).get("score", 7)
            
            # Weighted combination (60% technical, 40% communication)
            overall_score = (technical_score * 0.6 + communication_score * 0.4)
            
            return round(min(10, max(0, overall_score)), 1)
            
        except Exception as e:
            logger.error(f"Score calculation failed: {e}")
            return 6.0
    
    async def _generate_technical_feedback(self, distilbert_analysis: Dict, context: Dict) -> str:
        """Generate technical feedback based on DistilBERT analysis"""
        try:
            technical_accuracy = distilbert_analysis.get("technical_accuracy", {})
            completeness = distilbert_analysis.get("completeness", {})
            depth = distilbert_analysis.get("depth", {})
            
            feedback_parts = []
            
            # Technical accuracy feedback
            accuracy_score = technical_accuracy.get("score", 5)
            if accuracy_score >= 8:
                feedback_parts.append("Your technical understanding is excellent.")
            elif accuracy_score >= 6:
                feedback_parts.append("You demonstrate good technical knowledge.")
            else:
                feedback_parts.append("Your technical explanation could be more accurate.")
            
            # Keyword coverage feedback
            found_keywords = technical_accuracy.get("found_keywords", [])
            if found_keywords:
                feedback_parts.append(f"You correctly used technical terms: {', '.join(found_keywords[:3])}.")
            
            # Completeness feedback
            completeness_score = completeness.get("score", 5)
            if completeness_score >= 8:
                feedback_parts.append("Your answer is comprehensive and well-structured.")
            elif completeness_score >= 6:
                feedback_parts.append("Your answer covers the main points adequately.")
            else:
                feedback_parts.append("Your answer could be more complete and detailed.")
            
            # Depth feedback
            depth_score = depth.get("score", 5)
            if depth_score >= 8:
                feedback_parts.append("You showed deep understanding with good examples.")
            elif depth_score < 6:
                feedback_parts.append("Try to provide more detailed explanations and examples.")
            
            return " ".join(feedback_parts)
            
        except Exception as e:
            logger.error(f"Technical feedback generation failed: {e}")
            return "Technical analysis completed with basic evaluation."
    
    async def _generate_communication_feedback(self, disfluency_analysis: Dict) -> str:
        """Generate communication feedback based on disfluency analysis"""
        try:
            filler_words = disfluency_analysis.get("filler_words", {})
            confidence_assessment = disfluency_analysis.get("confidence_assessment", {})
            fluency_score = disfluency_analysis.get("fluency_score", {})
            
            feedback_parts = []
            
            # Filler words feedback
            filler_density = filler_words.get("density", 0)
            if filler_density <= 2:
                feedback_parts.append("Your speech is very clear with minimal filler words.")
            elif filler_density <= 5:
                feedback_parts.append("Your communication is generally clear.")
            elif filler_density <= 10:
                feedback_parts.append("Try to reduce filler words for clearer communication.")
            else:
                feedback_parts.append("Focus on reducing filler words to improve clarity.")
            
            # Confidence feedback
            confidence_level = confidence_assessment.get("level", "medium")
            if confidence_level == "high":
                feedback_parts.append("You sound confident and assured in your responses.")
            elif confidence_level == "medium":
                feedback_parts.append("Your confidence level is appropriate.")
            else:
                feedback_parts.append("Try to sound more confident in your delivery.")
            
            # Fluency feedback
            fluency = fluency_score.get("score", 7)
            if fluency >= 8:
                feedback_parts.append("Your speech flows naturally and smoothly.")
            elif fluency < 6:
                feedback_parts.append("Work on improving speech fluency and rhythm.")
            
            return " ".join(feedback_parts)
            
        except Exception as e:
            logger.error(f"Communication feedback generation failed: {e}")
            return "Communication analysis completed with basic evaluation."
    
    async def _generate_improvement_suggestions(self, distilbert_analysis: Dict, 
                                             disfluency_analysis: Dict, context: Dict) -> List[str]:
        """Generate specific improvement suggestions"""
        suggestions = []
        
        try:
            # Technical improvement suggestions
            technical_accuracy = distilbert_analysis.get("technical_accuracy", {})
            if technical_accuracy.get("score", 5) < 7:
                domain = technical_accuracy.get("domain", "general")
                suggestions.append(f"Study more {domain} concepts and practice explaining them clearly")
                
                missing_keywords = technical_accuracy.get("missing_keywords", [])
                if missing_keywords:
                    suggestions.append(f"Learn about: {', '.join(missing_keywords[:3])}")
            
            # Completeness suggestions
            completeness = distilbert_analysis.get("completeness", {})
            if completeness.get("score", 5) < 7:
                if not completeness.get("has_examples", False):
                    suggestions.append("Include specific examples to illustrate your points")
                if not completeness.get("has_explanation", False):
                    suggestions.append("Provide reasoning and explanations for your statements")
            
            # Communication improvement suggestions
            filler_words = disfluency_analysis.get("filler_words", {})
            if filler_words.get("density", 0) > 5:
                suggestions.append("Practice speaking more slowly and pause instead of using filler words")
            
            hesitation = disfluency_analysis.get("hesitation_patterns", {})
            if hesitation.get("hesitation_rate", 0) > 5:
                suggestions.append("Prepare and practice common interview questions to reduce hesitation")
            
            confidence_assessment = disfluency_analysis.get("confidence_assessment", {})
            if confidence_assessment.get("level") == "low":
                suggestions.append("Use more definitive language and practice positive self-talk")
            
            # Experience-based suggestions
            experience = context.get("experience", "mid")
            if experience == "fresher":
                suggestions.append("Focus on demonstrating your learning ability and enthusiasm")
            elif experience == "senior":
                suggestions.append("Emphasize leadership experience and system design thinking")
            
            # Default suggestions if none generated
            if not suggestions:
                suggestions = [
                    "Continue practicing technical explanations with examples",
                    "Work on clear and confident communication",
                    "Review fundamental concepts in your field"
                ]
            
            return suggestions[:5]  # Limit to top 5 suggestions
            
        except Exception as e:
            logger.error(f"Suggestion generation failed: {e}")
            return ["Continue practicing technical communication skills"]
    
    async def _identify_strengths(self, distilbert_analysis: Dict, disfluency_analysis: Dict) -> List[str]:
        """Identify candidate's strengths"""
        strengths = []
        
        try:
            # Technical strengths
            technical_accuracy = distilbert_analysis.get("technical_accuracy", {})
            if technical_accuracy.get("score", 5) >= 7:
                strengths.append("Strong technical knowledge and accuracy")
            
            found_keywords = technical_accuracy.get("found_keywords", [])
            if len(found_keywords) >= 3:
                strengths.append("Good use of technical terminology")
            
            completeness = distilbert_analysis.get("completeness", {})
            if completeness.get("has_examples", False):
                strengths.append("Provides concrete examples to support points")
            
            coherence = distilbert_analysis.get("coherence", {})
            if coherence.get("score", 5) >= 8:
                strengths.append("Clear and logical structure in responses")
            
            # Communication strengths
            filler_words = disfluency_analysis.get("filler_words", {})
            if filler_words.get("density", 10) <= 3:
                strengths.append("Clear speech with minimal filler words")
            
            confidence_assessment = disfluency_analysis.get("confidence_assessment", {})
            if confidence_assessment.get("level") == "high":
                strengths.append("Confident and assured delivery")
            
            fluency_score = disfluency_analysis.get("fluency_score", {})
            if fluency_score.get("score", 5) >= 8:
                strengths.append("Natural and fluent communication style")
            
            # Default strength if none identified
            if not strengths:
                strengths = ["Demonstrates effort and engagement in responses"]
            
            return strengths[:4]  # Limit to top 4 strengths
            
        except Exception as e:
            logger.error(f"Strength identification failed: {e}")
            return ["Shows good effort in answering questions"]
    
    async def _identify_improvement_areas(self, distilbert_analysis: Dict, disfluency_analysis: Dict) -> List[str]:
        """Identify areas for improvement"""
        areas = []
        
        try:
            # Technical improvement areas
            technical_accuracy = distilbert_analysis.get("technical_accuracy", {})
            if technical_accuracy.get("score", 5) < 6:
                areas.append("Technical accuracy and depth of knowledge")
            
            completeness = distilbert_analysis.get("completeness", {})
            if completeness.get("score", 5) < 6:
                areas.append("Completeness and structure of responses")
            
            depth = distilbert_analysis.get("depth", {})
            if depth.get("score", 5) < 6:
                areas.append("Depth of understanding and analysis")
            
            # Communication improvement areas
            filler_words = disfluency_analysis.get("filler_words", {})
            if filler_words.get("density", 0) > 8:
                areas.append("Reducing filler words and hesitations")
            
            confidence_assessment = disfluency_analysis.get("confidence_assessment", {})
            if confidence_assessment.get("level") == "low":
                areas.append("Building confidence in delivery")
            
            hesitation = disfluency_analysis.get("hesitation_patterns", {})
            if hesitation.get("hesitation_rate", 0) > 8:
                areas.append("Reducing hesitation and improving fluency")
            
            return areas[:4]  # Limit to top 4 areas
            
        except Exception as e:
            logger.error(f"Improvement area identification failed: {e}")
            return ["General communication and technical skills"]
    
    def _synthesize_detailed_feedback(self, technical_feedback: str, communication_feedback: str,
                                    distilbert_analysis: Dict, disfluency_analysis: Dict) -> str:
        """Synthesize detailed feedback text"""
        try:
            feedback_sections = []
            
            # Technical analysis section
            if technical_feedback:
                feedback_sections.append(f"Technical Analysis: {technical_feedback}")
            
            # Communication analysis section
            if communication_feedback:
                feedback_sections.append(f"Communication Quality: {communication_feedback}")
            
            # Performance summary
            overall_technical = distilbert_analysis.get("overall_score", 5)
            overall_communication = disfluency_analysis.get("overall_communication_score", {}).get("score", 7)
            
            if overall_technical >= 8 and overall_communication >= 8:
                summary = "Excellent performance across both technical knowledge and communication skills."
            elif overall_technical >= 7 or overall_communication >= 7:
                summary = "Good performance with room for improvement in specific areas."
            else:
                summary = "Focus on strengthening both technical knowledge and communication skills."
            
            feedback_sections.append(f"Overall Assessment: {summary}")
            
            return " ".join(feedback_sections)
            
        except Exception as e:
            logger.error(f"Detailed feedback synthesis failed: {e}")
            return "Comprehensive analysis completed with multi-model evaluation."
    
    def _generate_follow_up_topics(self, distilbert_analysis: Dict, context: Dict) -> List[str]:
        """Generate follow-up study topics"""
        try:
            topics = []
            
            # Domain-specific topics
            domain = distilbert_analysis.get("technical_accuracy", {}).get("domain", "general")
            
            topic_suggestions = {
                "algorithms": ["Dynamic Programming", "Graph Algorithms", "Sorting Techniques", "Time Complexity Analysis"],
                "data_structures": ["Advanced Trees", "Hash Tables", "Heaps and Priority Queues", "Graph Representations"],
                "system_design": ["Scalability Patterns", "Database Design", "Caching Strategies", "Load Balancing"],
                "programming": ["Design Patterns", "SOLID Principles", "Code Optimization", "Testing Strategies"],
                "web_development": ["Modern Frameworks", "API Design", "Performance Optimization", "Security Best Practices"]
            }
            
            topics.extend(topic_suggestions.get(domain, ["Core Computer Science Concepts"])[:3])
            
            # Experience-based topics
            experience = context.get("experience", "mid")
            if experience == "fresher":
                topics.append("Interview Preparation Fundamentals")
            elif experience == "senior":
                topics.append("Leadership and System Architecture")
            
            return topics[:4]
            
        except Exception as e:
            logger.error(f"Follow-up topic generation failed: {e}")
            return ["Technical Interview Preparation", "Communication Skills", "Problem Solving Techniques"]
    
    def _assess_depth_level(self, depth_analysis: Dict) -> str:
        """Assess the depth level of the answer"""
        try:
            depth_score = depth_analysis.get("score", 5)
            
            if depth_score >= 8:
                return "advanced"
            elif depth_score >= 6:
                return "intermediate"
            elif depth_score >= 4:
                return "basic"
            else:
                return "surface"
                
        except Exception:
            return "intermediate"
    
    def _fallback_feedback(self, answer: str) -> Dict:
        """Fallback feedback when synthesis fails"""
        word_count = len(answer.split())
        base_score = min(10, word_count / 15)
        
        return {
            "technical_accuracy": {"score": base_score, "confidence": 0.3},
            "communication_quality": {"score": base_score, "confidence": 0.3},
            "semantic_analysis": {"coherence_score": base_score, "completeness": 0.5},
            "overall_score": base_score,
            "confidence": 0.3,
            "detailed_feedback": "Analysis completed with basic evaluation due to system limitations.",
            "improvement_suggestions": ["Continue practicing technical communication"],
            "strengths": ["Provided a response to the question"],
            "areas_for_improvement": ["Technical depth and communication clarity"],
            "follow_up_topics": ["Interview Preparation", "Technical Skills"],
            "fallback": True
        }