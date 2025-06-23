from typing import List, Dict, Optional, Union
from datetime import datetime
from langchain.llms import OpenAI
from langchain.chains import LLMChain, RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.tools import Tool
from langchain.agents import initialize_agent, AgentType
from .models import (
    CoachQuestion,
    CoachResponse,
    DrillInfo,
    PlayerInsightResponse,
    DrillScheduleRequest,
    DrillRecommendationRequest,
    VideoRecommendation
)
from .drill_recommendation_engine import DrillRecommendationEngine
from .insight_service import PlayerInsightService
from .highlight_generator import HighlightTaggingEngine
import json
import os
import markdown
import emoji
from jinja2 import Template

class CoachAssistant:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.llm = OpenAI(api_key=api_key)
        self.embeddings = OpenAIEmbeddings(api_key=api_key)
        
        # Initialize services
        self.drill_engine = DrillRecommendationEngine()
        self.insight_service = PlayerInsightService()
        self.highlight_engine = HighlightTaggingEngine()
        
        # Initialize memory and knowledge bases
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        self.drill_db = self._load_drill_knowledge()
        self.strategy_db = self._load_strategy_knowledge()
        self.player_stats = {}
        
        # Initialize retrieval QA chains
        self.drill_qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.drill_db.as_retriever(),
            return_source_documents=True
        )
        
        self.strategy_qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.strategy_db.as_retriever(),
            return_source_documents=True
        )
        
        # Initialize tools
        self.tools = self._initialize_tools()
        
        # Initialize agent
        self.agent = initialize_agent(
            tools=self.tools,
            llm=self.llm,
            agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
            memory=self.memory,
            verbose=True
        )

        # Add video recommendation database
        self.video_db = self._load_video_knowledge()
        
        # HTML template for web UI
        self.web_template = Template("""
        <div class="coach-response">
            <div class="response-header">
                <h3>{{ title }}</h3>
                <div class="confidence">Confidence: {{ confidence }}%</div>
            </div>
            
            <div class="response-body">
                {{ content | safe }}
                
                {% if drills %}
                <div class="recommended-drills">
                    <h4>Recommended Drills:</h4>
                    <ul>
                    {% for drill in drills %}
                        <li>
                            <strong>{{ drill.name }}</strong> ({{ drill.duration }} min)
                            <p>{{ drill.description }}</p>
                            {% if drill.videos %}
                            <div class="video-links">
                                <strong>Tutorial Videos:</strong>
                                <ul>
                                {% for video in drill.videos %}
                                    <li><a href="{{ video.url }}" target="_blank">{{ video.title }}</a></li>
                                {% endfor %}
                                </ul>
                            </div>
                            {% endif %}
                        </li>
                    {% endfor %}
                    </ul>
                </div>
                {% endif %}
                
                {% if stats %}
                <div class="player-stats">
                    <h4>Your Stats:</h4>
                    {{ stats | safe }}
                </div>
                {% endif %}
            </div>
            
            {% if follow_up %}
            <div class="follow-up">
                <h4>Suggested Next Steps:</h4>
                <ul>
                {% for step in follow_up %}
                    <li>{{ step }}</li>
                {% endfor %}
                </ul>
            </div>
            {% endif %}
        </div>
        """)

    def _initialize_tools(self) -> List[Tool]:
        """Initialize tools for the agent to use."""
        return [
            Tool(
                name="DrillRecommender",
                func=self._get_drill_recommendations,
                description="Get personalized drill recommendations based on player skills and goals"
            ),
            Tool(
                name="PlayerInsights",
                func=self._get_player_insights,
                description="Get insights about a player's performance and growth areas"
            ),
            Tool(
                name="HighlightAnalysis",
                func=self._get_game_highlights,
                description="Get analysis of game highlights and key moments"
            ),
            Tool(
                name="DrillKnowledge",
                func=self._query_drill_knowledge,
                description="Get information about specific basketball drills and techniques"
            ),
            Tool(
                name="StrategyKnowledge",
                func=self._query_strategy_knowledge,
                description="Get information about basketball strategies and concepts"
            )
        ]

    def _load_drill_knowledge(self) -> FAISS:
        """Load and embed drill database."""
        drill_data = []
        drill_texts = []
        
        # Load drill descriptions from JSON
        with open("data/drills.json", "r") as f:
            drill_data = json.load(f)
            
        # Prepare texts for embedding
        for drill in drill_data:
            text = f"Drill: {drill['name']}\n"
            text += f"Description: {drill['description']}\n"
            text += f"Skills: {', '.join(drill['skills'])}\n"
            text += f"Difficulty: {drill['difficulty']}"
            drill_texts.append(text)
            
        # Create vector store
        return FAISS.from_texts(
            drill_texts,
            self.embeddings,
            metadatas=drill_data
        )

    def _load_strategy_knowledge(self) -> FAISS:
        """Load and embed basketball strategy knowledge."""
        strategy_texts = []
        
        # Load strategy documents from JSON
        with open("data/strategies.json", "r") as f:
            strategies = json.load(f)
            
        # Prepare texts for embedding
        for strategy in strategies:
            text = f"Topic: {strategy['topic']}\n"
            text += f"Description: {strategy['description']}\n"
            text += f"Key Points: {', '.join(strategy['key_points'])}"
            strategy_texts.append(text)
            
        # Create vector store
        return FAISS.from_texts(
            strategy_texts,
            self.embeddings,
            metadatas=strategies
        )

    def _load_video_knowledge(self) -> FAISS:
        """Load and embed video recommendation database."""
        video_data = []
        video_texts = []
        
        # Load video metadata from JSON
        with open("data/video_tutorials.json", "r") as f:
            video_data = json.load(f)
            
        # Prepare texts for embedding
        for video in video_data:
            text = f"Title: {video['title']}\n"
            text += f"Description: {video['description']}\n"
            text += f"Skills: {', '.join(video['skills'])}\n"
            text += f"Drills: {', '.join(video['related_drills'])}"
            video_texts.append(text)
            
        # Create vector store
        return FAISS.from_texts(
            video_texts,
            self.embeddings,
            metadatas=video_data
        )

    def _get_drill_recommendations(self, request_data: Dict) -> List[DrillInfo]:
        """Get drill recommendations using the DrillRecommendationEngine."""
        request = DrillRecommendationRequest(**request_data)
        response = self.drill_engine.get_recommendations(request)
        return response.recommended_drills

    def _get_player_insights(self, player_id: str) -> PlayerInsightResponse:
        """Get player insights using the PlayerInsightService."""
        return self.insight_service.get_player_insights(player_id)

    def _get_game_highlights(self, game_data: Dict) -> Dict:
        """Get game highlights using the HighlightTaggingEngine."""
        return self.highlight_engine.tag_highlights(
            game_data["game_id"],
            game_data["events"]
        ).dict()

    def _query_drill_knowledge(self, query: str) -> Dict:
        """Query the drill knowledge base."""
        return self.drill_qa({"query": query})

    def _query_strategy_knowledge(self, query: str) -> Dict:
        """Query the strategy knowledge base."""
        return self.strategy_qa({"query": query})

    def _get_video_recommendations(
        self,
        drill: DrillInfo,
        max_videos: int = 2
    ) -> List[VideoRecommendation]:
        """Get relevant video tutorials for a drill."""
        # Create search query from drill info
        query = f"Drill: {drill.name} Skills: {' '.join(drill.target_skills)}"
        
        # Search video database
        results = self.video_db.similarity_search_with_score(query, k=max_videos)
        
        videos = []
        for doc, score in results:
            if score < 0.8:  # Relevance threshold
                video = VideoRecommendation(
                    title=doc.metadata["title"],
                    url=doc.metadata["url"],
                    description=doc.metadata["description"],
                    confidence_score=1 - score
                )
                videos.append(video)
                
        return videos

    def format_response_by_channel(
        self,
        response: CoachResponse,
        channel: str = "chat"
    ) -> Union[str, Dict]:
        """Format response based on output channel."""
        if channel == "chat":
            return self._format_chat_response(response)
        elif channel == "email":
            return self._format_email_response(response)
        elif channel == "sms":
            return self._format_sms_response(response)
        elif channel == "web":
            return self._format_web_response(response)
        else:
            return self._format_chat_response(response)

    def _format_chat_response(self, response: CoachResponse) -> str:
        """Format response for chat interface."""
        parts = [response.answer]
        
        if response.drills:
            parts.append("\nRecommended Drills:")
            for drill in response.drills:
                parts.append(f"\n• {drill.name} ({drill.duration} min)")
                parts.append(f"  {drill.description}")
                
                # Add video recommendations
                videos = self._get_video_recommendations(drill)
                if videos:
                    parts.append("  Tutorial Videos:")
                    for video in videos:
                        parts.append(f"  - {video.title}: {video.url}")
        
        return "\n".join(parts)

    def _format_email_response(self, response: CoachResponse) -> str:
        """Format response for email (Markdown)."""
        md = [
            f"# Coach's Response",
            "",
            response.answer,
            ""
        ]
        
        if response.drills:
            md.extend([
                "## Recommended Drills",
                ""
            ])
            
            for drill in response.drills:
                md.extend([
                    f"### {drill.name}",
                    f"Duration: {drill.duration} minutes",
                    f"Description: {drill.description}",
                    f"Skills: {', '.join(drill.target_skills)}",
                    ""
                ])
                
                # Add video recommendations
                videos = self._get_video_recommendations(drill)
                if videos:
                    md.extend([
                        "#### Tutorial Videos:",
                        "Please watch these videos for proper form and technique:",
                        ""
                    ])
                    for video in videos:
                        md.append(f"- [{video.title}]({video.url})")
                    md.append("")
        
        if response.stats:
            md.extend([
                "## Your Stats",
                "",
                "```",
                json.dumps(response.stats, indent=2),
                "```"
            ])
            
        return "\n".join(md)

    def _format_sms_response(self, response: CoachResponse) -> str:
        """Format response for SMS (brief, concise)."""
        parts = [response.answer.split('\n')[0]]  # First paragraph only
        
        if response.drills:
            parts.append("\nTry these drills:")
            for drill in response.drills:
                parts.append(f"• {drill.name} ({drill.duration}min)")
        
        return "\n".join(parts)

    def _format_web_response(self, response: CoachResponse) -> str:
        """Format response for web UI (HTML)."""
        # Prepare drill data with video recommendations
        drills_with_videos = []
        if response.drills:
            for drill in response.drills:
                drill_dict = drill.dict()
                drill_dict["videos"] = self._get_video_recommendations(drill)
                drills_with_videos.append(drill_dict)
        
        # Format stats if available
        stats_html = None
        if response.stats:
            stats_html = "<table>"
            for key, value in response.stats.items():
                stats_html += f"<tr><td>{key}</td><td>{value}</td></tr>"
            stats_html += "</table>"
        
        # Generate follow-up suggestions
        follow_up = [
            "Schedule these drills in your training plan",
            "Track your progress using the app",
            "Watch the tutorial videos before trying new drills"
        ]
        
        # Render template
        return self.web_template.render(
            title="Coach's Advice",
            content=markdown.markdown(response.answer),
            drills=drills_with_videos,
            stats=stats_html,
            confidence=int(response.confidence_score * 100),
            follow_up=follow_up
        )

    def generate_weekly_summary(self, player_id: str, channel: str = "chat") -> str:
        """Generate an enhanced weekly progress summary."""
        insights = self._get_player_insights(player_id)
        
        # Get performance data
        trends = insights.recent_trends
        growth_areas = insights.growth_areas
        completion_data = insights.drill_completion_stats
        
        # Generate base summary
        summary = [
            f"📊 Weekly Progress Report for {insights.player_name}",
            "",
            "🎯 Key Improvements:"
        ]
        
        # Add trend analysis with emojis
        for metric, change in trends.items():
            emoji_icon = "⬆️" if change > 0 else "⬇️" if change < 0 else "➡️"
            summary.append(
                f"{emoji_icon} {metric.replace('_', ' ').title()}: {change:+.1%}"
            )
        
        # Add completion rates
        summary.extend([
            "",
            "💪 Workout Completion:",
            f"✅ Completed: {completion_data['completed']} drills",
            f"❌ Missed: {completion_data['missed']} drills",
            f"📈 Completion Rate: {completion_data['rate']:.0%}"
        ])
        
        # Add focus areas and recommendations
        summary.extend([
            "",
            "🎯 Focus Areas:",
        ])
        for area in growth_areas:
            summary.append(f"• {area}")
            
        # Add follow-up actions
        summary.extend([
            "",
            "📝 Recommended Actions:",
            "1. Schedule make-up sessions for missed drills",
            "2. Focus on consistency in training",
            "3. Review tutorial videos for proper form",
            "",
            "Keep up the great work! 💪"
        ])
        
        # Format based on channel
        if channel == "email":
            return markdown.markdown("\n".join(summary))
        elif channel == "sms":
            # Simplified version for SMS
            brief = [
                f"Weekly Progress - {insights.player_name}",
                f"Completion: {completion_data['rate']:.0%}",
                "Top focus: " + ", ".join(growth_areas[:2]),
                "Keep it up! 💪"
            ]
            return "\n".join(brief)
        elif channel == "web":
            # HTML version with styling
            return self.web_template.render(
                title="Weekly Progress Report",
                content=markdown.markdown("\n".join(summary)),
                stats=insights.dict(),
                follow_up=[
                    "Review your progress in detail",
                    "Update your training goals",
                    "Schedule next week's sessions"
                ]
            )
        else:
            return "\n".join(summary)

    def answer_question(
        self,
        request: CoachQuestion,
        channel: str = "chat"
    ) -> CoachResponse:
        """Process a coaching question and provide a formatted response."""
        try:
            # Get base response using existing logic
            response = super().answer_question(request)
            
            # Add video recommendations if relevant
            if response.drills:
                for drill in response.drills:
                    drill.videos = self._get_video_recommendations(drill)
            
            # Format response for requested channel
            formatted_response = self.format_response_by_channel(response, channel)
            response.formatted_output = formatted_response
            
            return response
            
        except Exception as e:
            # Fallback with error handling
            response = self._query_strategy_knowledge(request.question)
            return CoachResponse(
                answer=response["result"],
                confidence_score=0.7,
                formatted_output=self.format_response_by_channel(
                    CoachResponse(
                        answer=response["result"],
                        confidence_score=0.7
                    ),
                    channel
                )
            )

    def update_player_stats(self, user_id: str, stats: Dict):
        """Update stored player statistics."""
        self.player_stats[user_id] = stats
        
        # Update vector store with new player data
        text = f"Player: {stats['name']}\n"
        text += f"Stats: {json.dumps(stats)}"
        
        self.player_db = FAISS.from_texts(
            [text],
            self.embeddings,
            metadatas=[stats]
        )

    def save_conversation(self, user_id: str, output_path: str):
        """Save conversation history to file."""
        history = self.memory.chat_memory.messages
        
        with open(output_path, "w") as f:
            json.dump(
                {
                    "user_id": user_id,
                    "timestamp": str(datetime.now()),
                    "messages": [
                        {
                            "role": msg.type,
                            "content": msg.content
                        }
                        for msg in history
                    ]
                },
                f,
                indent=2
            ) 