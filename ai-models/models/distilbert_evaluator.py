"""
DistilBERT-based Interview Answer Evaluator
Provides semantic analysis and technical accuracy assessment
"""

import asyncio
import logging
from typing import Dict, List, Optional
import numpy as np
from transformers import (
    DistilBertTokenizer, 
    DistilBertForSequenceClassification,
    pipeline
)
from sentence_transformers import SentenceTransformer
import torch

logger = logging.getLogger(__name__)

class DistilBERTEvaluator:
    """
    Advanced interview answer evaluator using DistilBERT
    """
    
    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.sentence_transformer = None
        self.technical_keywords = self._load_technical_keywords()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def load_model(self):
        """Load DistilBERT models asynchronously"""
        try:
            logger.info("Loading DistilBERT tokenizer and model...")
            
            # Load base DistilBERT for classification
            self.tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
            self.model = DistilBertForSequenceClassification.from_pretrained(
                'distilbert-base-uncased',
                num_labels=5  # For 5-point scoring
            )
            
            # Load sentence transformer for semantic similarity
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Move to appropriate device
            self.model.to(self.device)
            
            logger.info(f"✅ DistilBERT models loaded on {self.device}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load DistilBERT models: {e}")
            raise
    
    def _load_technical_keywords(self) -> Dict[str, List[str]]:
        """Load technical keywords for different domains"""
        return {
            "algorithms": [
                "algorithm", "complexity", "big o", "time complexity", "space complexity",
                "sorting", "searching", "recursion", "dynamic programming", "greedy",
                "divide and conquer", "backtracking", "graph", "tree", "hash"
            ],
            "data_structures": [
                "array", "linked list", "stack", "queue", "heap", "tree", "graph",
                "hash table", "binary tree", "balanced tree", "trie", "segment tree"
            ],
            "system_design": [
                "scalability", "load balancing", "caching", "database", "microservices",
                "api", "rest", "distributed", "consistency", "availability", "partition"
            ],
            "programming": [
                "object oriented", "inheritance", "polymorphism", "encapsulation",
                "design patterns", "solid principles", "clean code", "refactoring"
            ],
            "web_development": [
                "html", "css", "javascript", "react", "angular", "vue", "node.js",
                "express", "mongodb", "sql", "nosql", "rest api", "graphql"
            ]
        }
    
    async def evaluate(self, question: str, answer: str, context: Dict) -> Dict:
        """
        Comprehensive evaluation of interview answer
        """
        try:
            # Run evaluations in parallel
            tasks = [
                self._evaluate_technical_accuracy(question, answer, context),
                self._evaluate_completeness(question, answer),
                self._evaluate_coherence(answer),
                self._evaluate_depth(question, answer, context)
            ]
            
            technical_accuracy, completeness, coherence, depth = await asyncio.gather(*tasks)
            
            # Calculate overall technical score
            overall_score = (
                technical_accuracy["score"] * 0.3 +
                completeness["score"] * 0.25 +
                coherence["score"] * 0.25 +
                depth["score"] * 0.2
            )
            
            return {
                "technical_accuracy": technical_accuracy,
                "completeness": completeness,
                "coherence": coherence,
                "depth": depth,
                "overall_score": round(overall_score, 2),
                "confidence": min(
                    technical_accuracy["confidence"],
                    completeness["confidence"],
                    coherence["confidence"]
                )
            }
            
        except Exception as e:
            logger.error(f"❌ DistilBERT evaluation failed: {e}")
            return self._fallback_evaluation(answer)
    
    async def _evaluate_technical_accuracy(self, question: str, answer: str, context: Dict) -> Dict:
        """Evaluate technical accuracy using keyword matching and semantic analysis"""
        try:
            # Identify relevant technical domain
            domain = self._identify_domain(question, context)
            relevant_keywords = self.technical_keywords.get(domain, [])
            
            # Count technical keywords in answer
            answer_lower = answer.lower()
            found_keywords = [kw for kw in relevant_keywords if kw in answer_lower]
            keyword_coverage = len(found_keywords) / max(len(relevant_keywords), 1)
            
            # Semantic similarity analysis
            if self.sentence_transformer:
                # Create ideal answer patterns for the domain
                ideal_patterns = self._get_ideal_patterns(domain)
                similarities = []
                
                for pattern in ideal_patterns:
                    embeddings = self.sentence_transformer.encode([answer, pattern])
                    similarity = np.dot(embeddings[0], embeddings[1]) / (
                        np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
                    )
                    similarities.append(similarity)
                
                semantic_score = max(similarities) if similarities else 0.5
            else:
                semantic_score = 0.5
            
            # Combine scores
            accuracy_score = (keyword_coverage * 0.4 + semantic_score * 0.6) * 10
            
            return {
                "score": min(10, max(0, accuracy_score)),
                "confidence": 0.8 if len(found_keywords) > 0 else 0.6,
                "found_keywords": found_keywords,
                "keyword_coverage": keyword_coverage,
                "semantic_similarity": semantic_score,
                "domain": domain
            }
            
        except Exception as e:
            logger.error(f"Technical accuracy evaluation failed: {e}")
            return {"score": 5.0, "confidence": 0.3, "error": str(e)}
    
    async def _evaluate_completeness(self, question: str, answer: str) -> Dict:
        """Evaluate answer completeness"""
        try:
            # Basic completeness metrics
            word_count = len(answer.split())
            sentence_count = len([s for s in answer.split('.') if s.strip()])
            
            # Question type analysis
            question_type = self._analyze_question_type(question)
            expected_length = self._get_expected_length(question_type)
            
            # Length-based completeness
            length_score = min(10, (word_count / expected_length) * 10)
            
            # Structure analysis (basic)
            has_examples = any(word in answer.lower() for word in ['example', 'for instance', 'such as'])
            has_explanation = any(word in answer.lower() for word in ['because', 'since', 'due to', 'reason'])
            
            structure_bonus = 0
            if has_examples:
                structure_bonus += 1
            if has_explanation:
                structure_bonus += 1
            
            completeness_score = min(10, length_score + structure_bonus)
            
            return {
                "score": completeness_score,
                "confidence": 0.7,
                "word_count": word_count,
                "sentence_count": sentence_count,
                "has_examples": has_examples,
                "has_explanation": has_explanation,
                "question_type": question_type
            }
            
        except Exception as e:
            logger.error(f"Completeness evaluation failed: {e}")
            return {"score": 5.0, "confidence": 0.3, "error": str(e)}
    
    async def _evaluate_coherence(self, answer: str) -> Dict:
        """Evaluate answer coherence and logical flow"""
        try:
            sentences = [s.strip() for s in answer.split('.') if s.strip()]
            
            if len(sentences) < 2:
                return {"score": 6.0, "confidence": 0.5, "sentence_count": len(sentences)}
            
            # Sentence transition analysis
            transition_words = [
                'however', 'therefore', 'moreover', 'furthermore', 'additionally',
                'consequently', 'meanwhile', 'similarly', 'in contrast', 'for example'
            ]
            
            transition_count = sum(1 for sentence in sentences 
                                 for word in transition_words 
                                 if word in sentence.lower())
            
            # Coherence scoring
            coherence_score = 7.0  # Base score
            
            # Bonus for transitions
            if transition_count > 0:
                coherence_score += min(2, transition_count * 0.5)
            
            # Penalty for very short or very long sentences
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            if 10 <= avg_sentence_length <= 25:
                coherence_score += 0.5
            
            return {
                "score": min(10, coherence_score),
                "confidence": 0.6,
                "sentence_count": len(sentences),
                "transition_count": transition_count,
                "avg_sentence_length": avg_sentence_length
            }
            
        except Exception as e:
            logger.error(f"Coherence evaluation failed: {e}")
            return {"score": 5.0, "confidence": 0.3, "error": str(e)}
    
    async def _evaluate_depth(self, question: str, answer: str, context: Dict) -> Dict:
        """Evaluate depth of understanding"""
        try:
            # Depth indicators
            depth_indicators = [
                'trade-off', 'advantage', 'disadvantage', 'complexity', 'optimization',
                'edge case', 'alternative', 'comparison', 'implementation', 'performance'
            ]
            
            answer_lower = answer.lower()
            depth_keywords = [word for word in depth_indicators if word in answer_lower]
            
            # Experience level adjustment
            experience = context.get('experience', 'mid')
            experience_multiplier = {'fresher': 0.8, 'junior': 0.9, 'mid': 1.0, 'senior': 1.2}.get(experience, 1.0)
            
            # Base depth score
            depth_score = len(depth_keywords) * 1.5 + 5
            depth_score *= experience_multiplier
            
            return {
                "score": min(10, depth_score),
                "confidence": 0.7,
                "depth_keywords": depth_keywords,
                "experience_level": experience,
                "experience_multiplier": experience_multiplier
            }
            
        except Exception as e:
            logger.error(f"Depth evaluation failed: {e}")
            return {"score": 5.0, "confidence": 0.3, "error": str(e)}
    
    def _identify_domain(self, question: str, context: Dict) -> str:
        """Identify the technical domain of the question"""
        question_lower = question.lower()
        
        # Check context first
        if 'topic' in context:
            return context['topic'].lower()
        
        # Keyword-based domain detection
        for domain, keywords in self.technical_keywords.items():
            if any(keyword in question_lower for keyword in keywords):
                return domain
        
        return "general"
    
    def _get_ideal_patterns(self, domain: str) -> List[str]:
        """Get ideal answer patterns for semantic comparison"""
        patterns = {
            "algorithms": [
                "The algorithm works by iterating through the data structure and applying the operation",
                "Time complexity is O(n) and space complexity is O(1) for this approach",
                "We can optimize this using dynamic programming or memoization"
            ],
            "data_structures": [
                "This data structure provides efficient insertion and deletion operations",
                "The trade-off between time and space complexity depends on the use case",
                "Array access is O(1) while linked list insertion is more flexible"
            ],
            "system_design": [
                "We need to consider scalability, reliability, and performance requirements",
                "Load balancing and caching are essential for handling high traffic",
                "Database sharding and replication ensure data consistency and availability"
            ]
        }
        
        return patterns.get(domain, ["This is a comprehensive technical answer with examples and explanations"])
    
    def _analyze_question_type(self, question: str) -> str:
        """Analyze the type of question being asked"""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['explain', 'describe', 'what is']):
            return "explanation"
        elif any(word in question_lower for word in ['how', 'implement', 'code']):
            return "implementation"
        elif any(word in question_lower for word in ['design', 'architecture', 'system']):
            return "design"
        elif any(word in question_lower for word in ['difference', 'compare', 'vs']):
            return "comparison"
        else:
            return "general"
    
    def _get_expected_length(self, question_type: str) -> int:
        """Get expected answer length based on question type"""
        lengths = {
            "explanation": 80,
            "implementation": 120,
            "design": 150,
            "comparison": 100,
            "general": 80
        }
        return lengths.get(question_type, 80)
    
    def _fallback_evaluation(self, answer: str) -> Dict:
        """Fallback evaluation when models fail"""
        word_count = len(answer.split())
        base_score = min(10, word_count / 10)
        
        return {
            "technical_accuracy": {"score": base_score, "confidence": 0.3},
            "completeness": {"score": base_score, "confidence": 0.3},
            "coherence": {"score": base_score, "confidence": 0.3},
            "depth": {"score": base_score, "confidence": 0.3},
            "overall_score": base_score,
            "confidence": 0.3,
            "fallback": True
        }
    
    async def get_status(self) -> Dict:
        """Get model status"""
        return {
            "loaded": self.model is not None,
            "device": self.device,
            "ready": self.tokenizer is not None and self.model is not None
        }