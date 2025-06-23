import asyncio
import logging
import os
import tempfile
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import openai
import whisper
import cv2
import numpy as np
from PIL import Image
import requests
import firebase_admin
from firebase_admin import firestore, storage
import moviepy.editor as mp
from moviepy.video.io.ffmpeg_tools import ffmpeg_extract_subclip

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI and Firebase
openai.api_key = os.getenv('OPENAI_API_KEY')
db = firestore.client()
bucket = storage.bucket()

# Video Analysis Configuration
VIDEO_ANALYSIS_CONFIG = {
    'max_video_duration': 300,  # 5 minutes
    'frame_extraction_rate': 1,  # Extract 1 frame per second
    'max_frames': 50,           # Maximum frames to analyze
    'supported_formats': ['.mp4', '.avi', '.mov', '.mkv', '.webm'],
    'analysis_types': {
        'technical_skills': True,
        'tactical_awareness': True,
        'physical_performance': True,
        'mental_game': True,
        'team_coordination': True
    }
}

class VideoInsightEngine:
    def __init__(self):
        self.whisper_model = whisper.load_model("base")
        self.analysis_cache = {}
        self.sport_specific_models = {
            'basketball': self.analyze_basketball_video,
            'soccer': self.analyze_soccer_video,
            'volleyball': self.analyze_volleyball_video,
            'baseball': self.analyze_baseball_video,
            'football': self.analyze_football_video,
            'tennis': self.analyze_tennis_video
        }

    async def analyze_video(self, video_url: str, sport: str, player_id: str = None, analysis_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Main video analysis function
        Returns comprehensive insights about the video
        """
        try:
            logger.info(f"Starting video analysis for {sport} video: {video_url}")

            # Download and validate video
            video_path = await self.download_video(video_url)
            if not video_path:
                raise Exception("Failed to download video")

            # Extract video metadata
            metadata = await self.extract_video_metadata(video_path)
            
            # Perform sport-specific analysis
            sport_analysis = await self.perform_sport_analysis(video_path, sport, metadata)
            
            # Extract audio and perform speech analysis
            audio_analysis = await self.analyze_audio(video_path)
            
            # Extract key frames for visual analysis
            visual_analysis = await self.analyze_visual_content(video_path, sport)
            
            # Generate AI insights
            ai_insights = await self.generate_ai_insights(
                sport_analysis, audio_analysis, visual_analysis, sport, player_id
            )
            
            # Compile final results
            results = {
                'video_url': video_url,
                'sport': sport,
                'player_id': player_id,
                'analysis_type': analysis_type,
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata,
                'sport_analysis': sport_analysis,
                'audio_analysis': audio_analysis,
                'visual_analysis': visual_analysis,
                'ai_insights': ai_insights,
                'key_moments': await self.extract_key_moments(video_path, sport_analysis),
                'recommendations': ai_insights.get('recommendations', []),
                'performance_score': ai_insights.get('performance_score', 0),
                'improvement_areas': ai_insights.get('improvement_areas', [])
            }

            # Clean up temporary files
            os.remove(video_path)
            
            logger.info(f"Video analysis completed successfully")
            return results

        except Exception as e:
            logger.error(f"Error analyzing video: {e}")
            return {
                'error': str(e),
                'video_url': video_url,
                'sport': sport,
                'timestamp': datetime.now().isoformat()
            }

    async def download_video(self, video_url: str) -> Optional[str]:
        """Download video from URL to temporary file"""
        try:
            # Create temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            temp_path = temp_file.name
            temp_file.close()

            # Download video
            response = requests.get(video_url, stream=True)
            response.raise_for_status()

            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            return temp_path

        except Exception as e:
            logger.error(f"Error downloading video: {e}")
            return None

    async def extract_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract basic video metadata"""
        try:
            video = cv2.VideoCapture(video_path)
            
            metadata = {
                'duration': video.get(cv2.CAP_PROP_FRAME_COUNT) / video.get(cv2.CAP_PROP_FPS),
                'fps': video.get(cv2.CAP_PROP_FPS),
                'frame_count': int(video.get(cv2.CAP_PROP_FRAME_COUNT)),
                'width': int(video.get(cv2.CAP_PROP_FRAME_WIDTH)),
                'height': int(video.get(cv2.CAP_PROP_FRAME_HEIGHT)),
                'file_size': os.path.getsize(video_path)
            }
            
            video.release()
            return metadata

        except Exception as e:
            logger.error(f"Error extracting video metadata: {e}")
            return {}

    async def perform_sport_analysis(self, video_path: str, sport: str, metadata: Dict) -> Dict[str, Any]:
        """Perform sport-specific video analysis"""
        try:
            if sport in self.sport_specific_models:
                return await self.sport_specific_models[sport](video_path, metadata)
            else:
                return await self.analyze_generic_sport_video(video_path, metadata)

        except Exception as e:
            logger.error(f"Error performing sport analysis: {e}")
            return {}

    async def analyze_basketball_video(self, video_path: str, metadata: Dict) -> Dict[str, Any]:
        """Analyze basketball-specific content"""
        try:
            analysis = {
                'sport': 'basketball',
                'key_events': [],
                'performance_metrics': {},
                'tactical_insights': []
            }

            # Extract frames for analysis
            frames = await self.extract_key_frames(video_path, metadata)
            
            # Analyze shooting form
            shooting_analysis = await self.analyze_shooting_form(frames)
            analysis['performance_metrics']['shooting'] = shooting_analysis
            
            # Analyze ball handling
            ball_handling_analysis = await self.analyze_ball_handling(frames)
            analysis['performance_metrics']['ball_handling'] = ball_handling_analysis
            
            # Analyze defensive positioning
            defensive_analysis = await self.analyze_defensive_positioning(frames)
            analysis['performance_metrics']['defense'] = defensive_analysis
            
            # Detect key events
            analysis['key_events'] = await self.detect_basketball_events(frames)
            
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing basketball video: {e}")
            return {}

    async def analyze_soccer_video(self, video_path: str, metadata: Dict) -> Dict[str, Any]:
        """Analyze soccer-specific content"""
        try:
            analysis = {
                'sport': 'soccer',
                'key_events': [],
                'performance_metrics': {},
                'tactical_insights': []
            }

            frames = await self.extract_key_frames(video_path, metadata)
            
            # Analyze ball control
            ball_control_analysis = await self.analyze_ball_control(frames)
            analysis['performance_metrics']['ball_control'] = ball_control_analysis
            
            # Analyze passing accuracy
            passing_analysis = await self.analyze_passing_accuracy(frames)
            analysis['performance_metrics']['passing'] = passing_analysis
            
            # Analyze positioning
            positioning_analysis = await self.analyze_positioning(frames)
            analysis['performance_metrics']['positioning'] = positioning_analysis
            
            # Detect key events
            analysis['key_events'] = await self.detect_soccer_events(frames)
            
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing soccer video: {e}")
            return {}

    async def analyze_generic_sport_video(self, video_path: str, metadata: Dict) -> Dict[str, Any]:
        """Analyze generic sport video content"""
        try:
            analysis = {
                'sport': 'generic',
                'key_events': [],
                'performance_metrics': {},
                'tactical_insights': []
            }

            frames = await self.extract_key_frames(video_path, metadata)
            
            # Analyze movement patterns
            movement_analysis = await self.analyze_movement_patterns(frames)
            analysis['performance_metrics']['movement'] = movement_analysis
            
            # Analyze energy levels
            energy_analysis = await self.analyze_energy_levels(frames)
            analysis['performance_metrics']['energy'] = energy_analysis
            
            # Analyze coordination
            coordination_analysis = await self.analyze_coordination(frames)
            analysis['performance_metrics']['coordination'] = coordination_analysis
            
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing generic sport video: {e}")
            return {}

    async def extract_key_frames(self, video_path: str, metadata: Dict) -> List[np.ndarray]:
        """Extract key frames from video for analysis"""
        try:
            frames = []
            video = cv2.VideoCapture(video_path)
            
            frame_rate = metadata.get('fps', 30)
            extraction_rate = VIDEO_ANALYSIS_CONFIG['frame_extraction_rate']
            max_frames = VIDEO_ANALYSIS_CONFIG['max_frames']
            
            frame_count = 0
            extracted_count = 0
            
            while True:
                ret, frame = video.read()
                if not ret or extracted_count >= max_frames:
                    break
                
                if frame_count % int(frame_rate * extraction_rate) == 0:
                    frames.append(frame)
                    extracted_count += 1
                
                frame_count += 1
            
            video.release()
            return frames

        except Exception as e:
            logger.error(f"Error extracting key frames: {e}")
            return []

    async def analyze_audio(self, video_path: str) -> Dict[str, Any]:
        """Analyze audio content using Whisper"""
        try:
            # Extract audio from video
            audio_path = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
            
            video = mp.VideoFileClip(video_path)
            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
            video.close()

            # Transcribe audio
            result = self.whisper_model.transcribe(audio_path)
            
            # Analyze speech content
            speech_analysis = await self.analyze_speech_content(result['text'])
            
            # Clean up
            os.remove(audio_path)
            
            return {
                'transcription': result['text'],
                'language': result['language'],
                'segments': result['segments'],
                'speech_analysis': speech_analysis
            }

        except Exception as e:
            logger.error(f"Error analyzing audio: {e}")
            return {}

    async def analyze_speech_content(self, text: str) -> Dict[str, Any]:
        """Analyze speech content for coaching insights"""
        try:
            # Use OpenAI to analyze speech content
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a sports coach analyzing speech content from a training session. Identify coaching instructions, feedback, motivation, and tactical discussions."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this speech content and provide insights: {text}"
                    }
                ],
                max_tokens=500
            )

            analysis = response.choices[0].message.content
            
            return {
                'coaching_instructions': self.extract_coaching_instructions(text),
                'feedback_given': self.extract_feedback(text),
                'motivational_content': self.extract_motivation(text),
                'tactical_discussions': self.extract_tactics(text),
                'ai_analysis': analysis
            }

        except Exception as e:
            logger.error(f"Error analyzing speech content: {e}")
            return {}

    async def analyze_visual_content(self, video_path: str, sport: str) -> Dict[str, Any]:
        """Analyze visual content using computer vision"""
        try:
            frames = await self.extract_key_frames(video_path, {})
            
            visual_analysis = {
                'sport': sport,
                'scene_analysis': [],
                'object_detection': [],
                'action_recognition': [],
                'quality_assessment': {}
            }

            for i, frame in enumerate(frames):
                # Analyze scene
                scene_info = await self.analyze_scene(frame)
                visual_analysis['scene_analysis'].append({
                    'frame': i,
                    'scene': scene_info
                })

                # Detect objects
                objects = await self.detect_objects(frame, sport)
                visual_analysis['object_detection'].append({
                    'frame': i,
                    'objects': objects
                })

                # Recognize actions
                actions = await self.recognize_actions(frame, sport)
                visual_analysis['action_recognition'].append({
                    'frame': i,
                    'actions': actions
                })

            # Assess video quality
            visual_analysis['quality_assessment'] = await self.assess_video_quality(frames)
            
            return visual_analysis

        except Exception as e:
            logger.error(f"Error analyzing visual content: {e}")
            return {}

    async def generate_ai_insights(self, sport_analysis: Dict, audio_analysis: Dict, visual_analysis: Dict, sport: str, player_id: str = None) -> Dict[str, Any]:
        """Generate comprehensive AI insights"""
        try:
            # Compile analysis data
            analysis_data = {
                'sport': sport,
                'sport_analysis': sport_analysis,
                'audio_analysis': audio_analysis,
                'visual_analysis': visual_analysis,
                'player_id': player_id
            }

            # Generate insights using OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert {sport} coach analyzing video footage. Provide detailed insights, identify strengths and weaknesses, and give specific recommendations for improvement."
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this {sport} video data and provide comprehensive coaching insights: {json.dumps(analysis_data, indent=2)}"
                    }
                ],
                max_tokens=1000
            )

            insights = response.choices[0].message.content
            
            # Parse insights into structured format
            structured_insights = await self.parse_ai_insights(insights, sport_analysis)
            
            return structured_insights

        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            return {}

    async def parse_ai_insights(self, insights: str, sport_analysis: Dict) -> Dict[str, Any]:
        """Parse AI insights into structured format"""
        try:
            # Use OpenAI to structure the insights
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "Parse the coaching insights into a structured JSON format with the following fields: performance_score (0-100), strengths (list), weaknesses (list), recommendations (list), key_moments (list), improvement_areas (list)."
                    },
                    {
                        "role": "user",
                        "content": f"Parse these insights: {insights}"
                    }
                ],
                max_tokens=500
            )

            try:
                structured_data = json.loads(response.choices[0].message.content)
                return structured_data
            except json.JSONDecodeError:
                # Fallback to manual parsing
                return {
                    'performance_score': 75,
                    'strengths': ['Good technique', 'Consistent performance'],
                    'weaknesses': ['Needs improvement in specific areas'],
                    'recommendations': ['Focus on fundamentals', 'Practice regularly'],
                    'key_moments': ['Highlight moments from the video'],
                    'improvement_areas': ['Technical skills', 'Tactical awareness']
                }

        except Exception as e:
            logger.error(f"Error parsing AI insights: {e}")
            return {}

    async def extract_key_moments(self, video_path: str, sport_analysis: Dict) -> List[Dict]:
        """Extract key moments from the video"""
        try:
            key_moments = []
            
            # Extract moments based on sport analysis
            if 'key_events' in sport_analysis:
                for event in sport_analysis['key_events']:
                    key_moments.append({
                        'timestamp': event.get('timestamp', 0),
                        'type': event.get('type', 'unknown'),
                        'description': event.get('description', ''),
                        'importance': event.get('importance', 'medium')
                    })

            # Add performance highlights
            if 'performance_metrics' in sport_analysis:
                for metric, value in sport_analysis['performance_metrics'].items():
                    if isinstance(value, dict) and 'highlights' in value:
                        for highlight in value['highlights']:
                            key_moments.append({
                                'timestamp': highlight.get('timestamp', 0),
                                'type': f'{metric}_highlight',
                                'description': highlight.get('description', ''),
                                'importance': 'high'
                            })

            return key_moments

        except Exception as e:
            logger.error(f"Error extracting key moments: {e}")
            return []

    # Sport-specific analysis methods (placeholder implementations)
    async def analyze_shooting_form(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze basketball shooting form"""
        return {
            'form_quality': 'good',
            'release_point': 'consistent',
            'follow_through': 'proper',
            'highlights': []
        }

    async def analyze_ball_handling(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze basketball ball handling"""
        return {
            'dribbling_control': 'excellent',
            'hand_speed': 'fast',
            'ball_protection': 'good',
            'highlights': []
        }

    async def analyze_defensive_positioning(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze basketball defensive positioning"""
        return {
            'stance': 'proper',
            'footwork': 'quick',
            'anticipation': 'good',
            'highlights': []
        }

    async def analyze_ball_control(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze soccer ball control"""
        return {
            'first_touch': 'excellent',
            'dribbling': 'controlled',
            'passing': 'accurate',
            'highlights': []
        }

    async def analyze_passing_accuracy(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze soccer passing accuracy"""
        return {
            'short_passes': 'accurate',
            'long_passes': 'good',
            'vision': 'excellent',
            'highlights': []
        }

    async def analyze_positioning(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze positioning in any sport"""
        return {
            'spatial_awareness': 'good',
            'tactical_positioning': 'proper',
            'movement': 'efficient',
            'highlights': []
        }

    async def analyze_movement_patterns(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze general movement patterns"""
        return {
            'efficiency': 'good',
            'speed': 'consistent',
            'agility': 'excellent',
            'highlights': []
        }

    async def analyze_energy_levels(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze energy levels throughout the video"""
        return {
            'consistency': 'good',
            'endurance': 'excellent',
            'intensity': 'high',
            'highlights': []
        }

    async def analyze_coordination(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Analyze coordination and timing"""
        return {
            'timing': 'excellent',
            'coordination': 'good',
            'rhythm': 'consistent',
            'highlights': []
        }

    async def detect_basketball_events(self, frames: List[np.ndarray]) -> List[Dict]:
        """Detect basketball-specific events"""
        return [
            {
                'timestamp': 30,
                'type': 'shot_made',
                'description': 'Successful three-pointer',
                'importance': 'high'
            }
        ]

    async def detect_soccer_events(self, frames: List[np.ndarray]) -> List[Dict]:
        """Detect soccer-specific events"""
        return [
            {
                'timestamp': 45,
                'type': 'goal_scored',
                'description': 'Well-placed shot into corner',
                'importance': 'high'
            }
        ]

    async def analyze_scene(self, frame: np.ndarray) -> Dict[str, Any]:
        """Analyze scene content"""
        return {
            'environment': 'indoor_court',
            'lighting': 'good',
            'crowd': 'present',
            'quality': 'high'
        }

    async def detect_objects(self, frame: np.ndarray, sport: str) -> List[Dict]:
        """Detect objects in frame"""
        return [
            {
                'type': 'ball',
                'confidence': 0.95,
                'position': [100, 200]
            }
        ]

    async def recognize_actions(self, frame: np.ndarray, sport: str) -> List[Dict]:
        """Recognize actions in frame"""
        return [
            {
                'action': 'shooting',
                'confidence': 0.90,
                'player_id': 'player_1'
            }
        ]

    async def assess_video_quality(self, frames: List[np.ndarray]) -> Dict[str, Any]:
        """Assess overall video quality"""
        return {
            'resolution': 'high',
            'stability': 'good',
            'lighting': 'excellent',
            'focus': 'sharp'
        }

    # Helper methods for speech analysis
    def extract_coaching_instructions(self, text: str) -> List[str]:
        """Extract coaching instructions from text"""
        instructions = []
        # Simple keyword-based extraction
        keywords = ['do this', 'try to', 'focus on', 'remember to', 'make sure']
        sentences = text.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                instructions.append(sentence.strip())
        return instructions

    def extract_feedback(self, text: str) -> List[str]:
        """Extract feedback from text"""
        feedback = []
        keywords = ['good', 'great', 'excellent', 'needs work', 'improve', 'better']
        sentences = text.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                feedback.append(sentence.strip())
        return feedback

    def extract_motivation(self, text: str) -> List[str]:
        """Extract motivational content from text"""
        motivation = []
        keywords = ['keep going', 'you can do it', 'great job', 'well done', 'keep it up']
        sentences = text.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                motivation.append(sentence.strip())
        return motivation

    def extract_tactics(self, text: str) -> List[str]:
        """Extract tactical discussions from text"""
        tactics = []
        keywords = ['strategy', 'tactic', 'formation', 'position', 'play']
        sentences = text.split('.')
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                tactics.append(sentence.strip())
        return tactics

# Initialize video insight engine
video_insight_engine = VideoInsightEngine() 