from typing import Dict, Optional
import json
import hashlib
from datetime import datetime, timedelta
import redis
import logging

logger = logging.getLogger(__name__)

class ResponseCache:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_ttl = 60 * 60 * 24  # 24 hours
        self.cache_prefix = "llm_response:"
        self.context_window = 3  # Number of previous messages to include in cache key

    def get_cached_response(
        self,
        player_id: str,
        question: str,
        context: Optional[Dict] = None
    ) -> Optional[str]:
        """Get cached response for a question with context."""
        cache_key = self._generate_cache_key(player_id, question, context)
        cached_data = self.redis.get(cache_key)

        if cached_data:
            try:
                cached_response = json.loads(cached_data)
                # Check if the cache entry is still valid based on context
                if self._validate_cache_entry(cached_response, context):
                    logger.info(f"Cache hit for player {player_id}")
                    return cached_response['response']
            except json.JSONDecodeError:
                logger.error("Failed to decode cached response")
                self.redis.delete(cache_key)

        return None

    def cache_response(
        self,
        player_id: str,
        question: str,
        response: str,
        context: Optional[Dict] = None,
        ttl: Optional[int] = None
    ) -> None:
        """Cache a response with its context."""
        cache_key = self._generate_cache_key(player_id, question, context)
        
        cache_data = {
            'response': response,
            'timestamp': datetime.utcnow().isoformat(),
            'context': context or {},
            'question': question,
            'player_id': player_id
        }

        try:
            self.redis.setex(
                cache_key,
                ttl or self.default_ttl,
                json.dumps(cache_data)
            )
            logger.info(f"Cached response for player {player_id}")
        except Exception as e:
            logger.error(f"Failed to cache response: {str(e)}")

    def invalidate_cache(self, player_id: str) -> None:
        """Invalidate all cached responses for a player."""
        pattern = f"{self.cache_prefix}{player_id}:*"
        keys = self.redis.keys(pattern)
        if keys:
            self.redis.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache entries for player {player_id}")

    def _generate_cache_key(
        self,
        player_id: str,
        question: str,
        context: Optional[Dict]
    ) -> str:
        """Generate a cache key based on player ID, question, and context."""
        # Normalize the question (lowercase, remove extra whitespace)
        normalized_question = " ".join(question.lower().split())

        # Create a context hash if context exists
        context_hash = ""
        if context:
            # Sort context keys for consistent hashing
            context_str = json.dumps(context, sort_keys=True)
            context_hash = hashlib.md5(context_str.encode()).hexdigest()[:8]

        # Combine components to create the key
        key_components = [
            self.cache_prefix,
            player_id,
            hashlib.md5(normalized_question.encode()).hexdigest()[:16]
        ]
        if context_hash:
            key_components.append(context_hash)

        return ":".join(key_components)

    def _validate_cache_entry(
        self,
        cached_data: Dict,
        current_context: Optional[Dict]
    ) -> bool:
        """Validate if a cached entry is still relevant given the current context."""
        if not current_context:
            return True

        cached_context = cached_data.get('context', {})
        
        # Check critical context fields that would invalidate the cache
        critical_fields = ['skill_level', 'recent_performance', 'workout_type']
        
        for field in critical_fields:
            if field in current_context and field in cached_context:
                if current_context[field] != cached_context[field]:
                    return False

        # Check timestamp for freshness
        try:
            cached_time = datetime.fromisoformat(cached_data['timestamp'])
            if datetime.utcnow() - cached_time > timedelta(days=1):
                return False
        except (KeyError, ValueError):
            return False

        return True

    def get_similar_questions(
        self,
        player_id: str,
        question: str,
        max_results: int = 5
    ) -> list:
        """Get similar previously asked questions."""
        pattern = f"{self.cache_prefix}{player_id}:*"
        similar_questions = []

        for key in self.redis.scan_iter(pattern):
            try:
                cached_data = json.loads(self.redis.get(key))
                cached_question = cached_data.get('question', '')
                
                # Calculate similarity score (simple word overlap for now)
                similarity = self._calculate_similarity(question, cached_question)
                
                if similarity > 0.5:  # Threshold for similarity
                    similar_questions.append({
                        'question': cached_question,
                        'similarity': similarity,
                        'timestamp': cached_data.get('timestamp')
                    })
            except json.JSONDecodeError:
                continue

        # Sort by similarity and return top results
        similar_questions.sort(key=lambda x: x['similarity'], reverse=True)
        return similar_questions[:max_results]

    def _calculate_similarity(self, question1: str, question2: str) -> float:
        """Calculate similarity between two questions."""
        # Convert to sets of words
        words1 = set(question1.lower().split())
        words2 = set(question2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0

    def get_popular_questions(
        self,
        player_id: str,
        time_window: timedelta = timedelta(days=7),
        max_results: int = 5
    ) -> list:
        """Get most frequently asked questions within a time window."""
        pattern = f"{self.cache_prefix}{player_id}:*"
        question_counts = {}
        cutoff_time = datetime.utcnow() - time_window

        for key in self.redis.scan_iter(pattern):
            try:
                cached_data = json.loads(self.redis.get(key))
                timestamp = datetime.fromisoformat(cached_data['timestamp'])
                
                if timestamp > cutoff_time:
                    question = cached_data['question']
                    question_counts[question] = question_counts.get(question, 0) + 1
            except (json.JSONDecodeError, KeyError, ValueError):
                continue

        # Sort by frequency and return top results
        popular_questions = [
            {'question': q, 'count': c}
            for q, c in sorted(
                question_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )
        ]
        
        return popular_questions[:max_results] 