from typing import Dict, List, Optional, Any, TypedDict, Literal
import openai
import json
import logging
from datetime import datetime, timedelta
from .response_cache import ResponseCache
from .media_service import MediaService

logger = logging.getLogger(__name__)

class MediaItem(TypedDict):
    type: Literal['video', 'image', 'animation', '3d_model']
    url: str
    caption: str
    thumbnail_url: Optional[str]
    duration: Optional[float]  # For videos
    format: Optional[str]  # File format
    size: Optional[Dict[str, int]]  # Width/height for images/videos
    tags: List[str]

class CoachResponse(TypedDict):
    response: str
    recommendations: List[str]
    suggested_drills: List[Dict[str, Any]]
    media: List[MediaItem]
    tags: List[str]
    context_used: Dict[str, Any]
    metadata: Dict[str, Any]

class LLMService:
    def __init__(
        self,
        config: Dict[str, Any],
        response_cache: ResponseCache,
        media_service: MediaService
    ):
        """Initialize the LLM service with configuration and services."""
        self.config = config
        self.cache = response_cache
        self.media_service = media_service
        self.model = config.get('model', 'gpt-4')
        openai.api_key = config['openai_api_key']
        
        # Response configuration with media support
        self.response_config = {
            'coaching': {
                'temperature': 0.7,
                'system_role': "expert sports coach focusing on motivation and guidance",
                'media_types': ['video', 'animation']
            },
            'technical': {
                'temperature': 0.3,
                'system_role': "technical sports analyst focusing on form and mechanics",
                'media_types': ['video', 'animation', '3d_model']
            },
            'analysis': {
                'temperature': 0.4,
                'system_role': "performance analyst focusing on stats and trends",
                'media_types': ['image']
            },
            'nutrition': {
                'temperature': 0.5,
                'system_role': "nutrition expert focusing on meal planning and diet",
                'media_types': ['image']
            }
        }

    async def generate_coach_response(
        self,
        player_id: str,
        question: str,
        context: Dict[str, Any]
    ) -> CoachResponse:
        """Generate a structured coaching response with multimedia content."""
        try:
            # Input validation
            if not player_id or not question:
                raise ValueError("Player ID and question are required")

            # Determine response type and configuration
            response_type = self._determine_response_type(question)
            config = self.response_config[response_type]

            # Build enhanced system prompt with media instructions
            system_prompt = self._build_enhanced_prompt(
                question,
                context,
                response_type,
                config['system_role'],
                config['media_types']
            )

            # Structure the conversation context
            messages = self._build_conversation_messages(
                system_prompt,
                question,
                context
            )

            # Make API call with structured output instruction
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                temperature=config['temperature'],
                max_tokens=1000,
                top_p=0.9,
                frequency_penalty=0.5,
                presence_penalty=0.5,
                response_format={
                    "type": "json_object",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "response": {"type": "string"},
                            "recommendations": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "suggested_drills": {
                                "type": "array",
                                "items": {"type": "object"}
                            },
                            "media_requests": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string"},
                                        "subject": {"type": "string"},
                                        "description": {"type": "string"},
                                        "tags": {
                                            "type": "array",
                                            "items": {"type": "string"}
                                        }
                                    }
                                }
                            },
                            "tags": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        }
                    }
                }
            )

            # Parse and structure the response
            if response.choices and response.choices[0].message:
                llm_response = json.loads(response.choices[0].message.content)
                
                # Fetch relevant media content
                media_items = await self._fetch_media_content(
                    llm_response.get('media_requests', []),
                    context
                )

                # Create structured coach response
                coach_response = CoachResponse(
                    response=llm_response['response'],
                    recommendations=llm_response.get('recommendations', []),
                    suggested_drills=llm_response.get('suggested_drills', []),
                    media=media_items,
                    tags=llm_response.get('tags', []),
                    context_used=self._get_relevant_context(
                        context,
                        llm_response['tags']
                    ),
                    metadata={
                        'timestamp': datetime.utcnow().isoformat(),
                        'response_type': response_type,
                        'model_used': self.model,
                        'player_id': player_id,
                        'has_media': bool(media_items)
                    }
                )

                # Cache the response
                await self._cache_response(
                    player_id,
                    question,
                    coach_response,
                    context
                )

                return coach_response

            raise Exception("Failed to generate response from LLM")

        except Exception as e:
            logger.error(f"Error generating LLM response: {str(e)}")
            return CoachResponse(
                response="I encountered an error while processing your question. Please try again.",
                recommendations=[],
                suggested_drills=[],
                media=[],
                tags=['error'],
                context_used={},
                metadata={'error': str(e)}
            )

    async def _fetch_media_content(
        self,
        media_requests: List[Dict[str, Any]],
        context: Dict[str, Any]
    ) -> List[MediaItem]:
        """Fetch or generate relevant media content based on LLM suggestions."""
        media_items = []
        
        for request in media_requests:
            try:
                # Search for existing media content
                media = await self.media_service.search_media(
                    media_type=request['type'],
                    subject=request['subject'],
                    tags=request['tags']
                )

                if media:
                    # Use existing media
                    media_items.extend(media)
                else:
                    # Generate new media if supported
                    generated_media = await self.media_service.generate_media(
                        media_type=request['type'],
                        description=request['description'],
                        context=context
                    )
                    if generated_media:
                        media_items.append(generated_media)

            except Exception as e:
                logger.error(f"Error fetching media content: {str(e)}")
                continue

        return media_items

    def _build_enhanced_prompt(
        self,
        question: str,
        context: Dict[str, Any],
        response_type: str,
        system_role: str,
        media_types: List[str]
    ) -> str:
        """Build an enhanced system prompt with media instructions."""
        base_prompt = self._build_coach_prompt(context)
        
        media_instruction = f"""
        When relevant, suggest multimedia content to enhance your response.
        Available media types: {', '.join(media_types)}
        
        For each media suggestion, provide:
        - type: The type of media needed
        - subject: The specific subject or action to show
        - description: Detailed description of what the media should demonstrate
        - tags: Relevant keywords for media search
        
        Example media request:
        {{
            "type": "video",
            "subject": "proper_squat_form",
            "description": "Demonstrate proper squat form with emphasis on knee alignment",
            "tags": ["squat", "form", "technique", "lower_body"]
        }}
        """

        output_instruction = """
        Provide your response in a structured JSON format with the following fields:
        - response: Your main coaching advice and explanation
        - recommendations: A list of specific, actionable recommendations
        - suggested_drills: A list of relevant drills with their details
        - media_requests: A list of suggested media content to enhance the response
        - tags: Keywords relevant to the advice
        """

        return f"{base_prompt}\n\nYou are acting as a {system_role}.\n{media_instruction}\n{output_instruction}"

    def _build_conversation_messages(
        self,
        system_prompt: str,
        question: str,
        context: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Build the conversation messages array with context."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        # Add relevant conversation history
        if context.get('conversation_history'):
            recent_messages = context['conversation_history'][-3:]
            for msg in recent_messages:
                messages.append({
                    "role": "user" if msg['is_user'] else "assistant",
                    "content": msg['content']
                })

        return messages

    async def _cache_response(
        self,
        player_id: str,
        question: str,
        response: CoachResponse,
        context: Dict[str, Any]
    ) -> None:
        """Cache the structured response with metadata."""
        try:
            await self.cache.cache_response(
                player_id=player_id,
                question=question,
                response=response,
                context=context,
                ttl=timedelta(days=7),
                metadata={
                    'tags': response['tags'],
                    'response_type': response['metadata']['response_type'],
                    'timestamp': response['metadata']['timestamp']
                }
            )
        except Exception as e:
            logger.error(f"Error caching response: {str(e)}")

    def _get_relevant_context(
        self,
        context: Dict[str, Any],
        tags: List[str]
    ) -> Dict[str, Any]:
        """Extract relevant context based on response tags."""
        relevant_context = {}
        
        # Map tags to context sections
        tag_context_mapping = {
            'shooting': ['recent_performance', 'shooting_stats'],
            'strength': ['health_status', 'strength_metrics'],
            'endurance': ['cardio_metrics', 'stamina_data'],
            'technique': ['form_analysis', 'technical_metrics'],
            'strategy': ['game_stats', 'tactical_analysis']
        }

        # Collect relevant context sections
        for tag in tags:
            for context_key in tag_context_mapping.get(tag, []):
                if context_key in context:
                    relevant_context[context_key] = context[context_key]

        return relevant_context

    def _determine_response_type(self, question: str) -> str:
        """Determine the type of response needed based on the question."""
        question_lower = question.lower()
        
        if any(word in question_lower for word in ['how to', 'technique', 'form', 'steps']):
            return 'technical'
        elif any(word in question_lower for word in ['analyze', 'review', 'performance', 'stats']):
            return 'analysis'
        elif any(word in question_lower for word in ['plan', 'strategy', 'approach', 'game plan']):
            return 'strategy'
        else:
            return 'coaching'

    def _build_coach_prompt(self, context: Dict[str, Any]) -> str:
        """Build a detailed coaching prompt with player context."""
        prompt_parts = [
            "You are SportBeacon's AI Coach, an expert in sports training, performance analysis, "
            "and personalized coaching. Your responses should be:"
            "\n- Motivational and encouraging"
            "\n- Specific to the player's level and goals"
            "\n- Based on their performance data and history"
            "\n- Include actionable advice and clear next steps"
            "\n\nPlayer Context:"
        ]

        # Add player level and tier
        if context.get('progression'):
            prog = context['progression']
            prompt_parts.append(
                f"\nLevel: {prog.get('level', 'N/A')}"
                f"\nTier: {prog.get('tier', 'Rookie')}"
            )

        # Add recent performance
        if context.get('recent_performance'):
            perf = context['recent_performance']
            prompt_parts.append("\nRecent Performance:")
            for stat, value in perf.items():
                prompt_parts.append(f"- {stat}: {value}")

        # Add active challenges
        if context.get('active_challenges'):
            challenges = context['active_challenges']
            prompt_parts.append("\nActive Challenges:")
            for challenge in challenges[:2]:  # Show top 2 challenges
                prompt_parts.append(f"- {challenge['title']}: {challenge['progress']}% complete")

        # Add focus areas
        if context.get('focus_areas'):
            areas = context['focus_areas']
            prompt_parts.append("\nRecommended Focus Areas:")
            for area in areas:
                prompt_parts.append(f"- {area['area']}: {area['priority']} priority")

        # Add injury/recovery context if available
        if context.get('health_status'):
            health = context['health_status']
            prompt_parts.append(f"\nHealth Status: {health['status']}")
            if health.get('restrictions'):
                prompt_parts.append("Restrictions: " + ", ".join(health['restrictions']))

        prompt_parts.append(
            "\nProvide personalized advice that considers the player's level, "
            "current challenges, and any health restrictions. Include specific drills "
            "or exercises when relevant, and always maintain an encouraging tone."
        )

        return "\n".join(prompt_parts)

    def _format_response(self, raw_response: str, context: Dict[str, Any]) -> str:
        """Format and enhance the LLM response with additional context."""
        # Add challenge progress if relevant
        if context.get('active_challenges'):
            raw_response += "\n\nActive Challenges Progress:"
            for challenge in context['active_challenges']:
                raw_response += f"\n- {challenge['title']}: {challenge['progress']}% complete"

        # Add XP earned if available
        if context.get('recent_xp'):
            raw_response += f"\n\nXP Earned Today: {context['recent_xp']}"

        return raw_response 