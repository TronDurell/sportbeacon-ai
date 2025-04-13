const socketIO = require('socket.io');
const { Readable } = require('stream');
const { Configuration, OpenAIApi } = require('openai');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const mediaService = require('./services/media_service');
const RewardsHandler = require('./websocket/rewards_handler');
const { validateFileUpload, validateFileDelete } = require('./validators/file');
const profile = require('./services/player_profile');
const { PlayerProgressTracker, DrillRecord, DrillStatus } = require('./services/player_progress_tracker');
const venuesRouter = require('./routes/venues');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const WebSocketServer = require('./websocket');

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const transcribeService = new AWS.TranscribeService();
const s3 = new AWS.S3();

// Configure OpenAI for Whisper API fallback
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

class AudioBuffer {
    constructor(sampleRate = 16000, channels = 1) {
        this.buffer = Buffer.alloc(0);
        this.sampleRate = sampleRate;
        this.channels = channels;
        this.minChunkSize = sampleRate * 2; // 1 second of 16-bit audio
    }

    append(chunk) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
    }

    clear() {
        this.buffer = Buffer.alloc(0);
    }

    hasMinimumData() {
        return this.buffer.length >= this.minChunkSize;
    }

    getBuffer() {
        return this.buffer;
    }
}

class SpeechRecognitionSession {
    constructor(socket, playerId) {
        this.socket = socket;
        this.playerId = playerId;
        this.audioBuffer = new AudioBuffer();
        this.isProcessing = false;
        this.language = 'en-US';
        this.lastProcessTime = Date.now();
        this.throttleInterval = 1000; // Minimum time between recognition requests
    }

    async processAudio() {
        if (this.isProcessing || !this.audioBuffer.hasMinimumData() || 
            Date.now() - this.lastProcessTime < this.throttleInterval) {
            return;
        }

        this.isProcessing = true;
        const audioData = this.audioBuffer.getBuffer();
        this.audioBuffer.clear();

        try {
            // Try AWS Transcribe Streaming first
            const result = await this.transcribeAudio(audioData);
            this.socket.emit('recognition_result', {
                text: result.text,
                isFinal: result.isFinal,
                timestamp: Date.now(),
                language: this.language
            });
        } catch (error) {
            console.error('AWS Transcribe error, falling back to Whisper:', error);
            try {
                // Fallback to OpenAI Whisper
                const result = await this.whisperFallback(audioData);
                this.socket.emit('recognition_result', {
                    text: result.text,
                    isFinal: true,
                    timestamp: Date.now(),
                    language: this.language
                });
            } catch (whisperError) {
                console.error('Whisper fallback error:', whisperError);
                this.socket.emit('recognition_error', {
                    error: 'Speech recognition failed',
                    timestamp: Date.now()
                });
            }
        } finally {
            this.isProcessing = false;
            this.lastProcessTime = Date.now();
        }
    }

    async transcribeAudio(audioData) {
        const params = {
            LanguageCode: this.language,
            MediaEncoding: 'pcm',
            MediaSampleRateHertz: this.audioBuffer.sampleRate,
            AudioStream: new Readable({
                read() {
                    this.push(audioData);
                    this.push(null);
                }
            })
        };

        return new Promise((resolve, reject) => {
            const request = transcribeService.startStreamTranscription(params);
            let transcription = '';

            request.on('data', data => {
                if (data.Results && data.Results[0] && data.Results[0].Alternatives) {
                    transcription = data.Results[0].Alternatives[0].Transcript;
                }
            });

            request.on('error', error => reject(error));
            request.on('end', () => resolve({
                text: transcription,
                isFinal: true
            }));
        });
    }

    async whisperFallback(audioData) {
        // Save audio to temporary file
        const tempFile = path.join(os.tmpdir(), `${this.playerId}_${Date.now()}.wav`);
        await fs.promises.writeFile(tempFile, audioData);

        try {
            const response = await openai.createTranscription(
                fs.createReadStream(tempFile),
                "whisper-1",
                this.language
            );

            return {
                text: response.data.text,
                isFinal: true
            };
        } finally {
            // Cleanup temp file
            await fs.promises.unlink(tempFile);
        }
    }

    setLanguage(languageCode) {
        this.language = languageCode;
    }
}

// Initialize Socket.IO server
const initializeWebSocket = (server) => {
    const io = socketIO(server, {
        maxHttpBufferSize: 1e8, // 100MB max payload
        cors: {
            origin: process.env.CLIENT_ORIGIN || "*",
            methods: ["GET", "POST"]
        }
    });

    // Initialize rewards handler
    const rewardsHandler = new RewardsHandler(io);

    const sessions = new Map();

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('init', (data) => {
            const { player_id, language } = data;
            if (!player_id) {
                socket.emit('error', { message: 'Player ID required' });
                socket.disconnect();
                return;
            }

            const session = new SpeechRecognitionSession(socket, player_id);
            if (language) {
                session.setLanguage(language);
            }
            sessions.set(socket.id, session);

            // Create session log directory if needed
            const logDir = path.join(__dirname, 'logs', 'voice', player_id);
            fs.mkdirSync(logDir, { recursive: true });
        });

        socket.on('audio', (data) => {
            const session = sessions.get(socket.id);
            if (!session) {
                socket.emit('error', { message: 'Session not initialized' });
                return;
            }

            // Handle incoming audio data
            session.audioBuffer.append(Buffer.from(data));
            session.processAudio().catch(error => {
                console.error('Error processing audio:', error);
                socket.emit('error', { message: 'Audio processing error' });
            });
        });

        socket.on('set_language', (data) => {
            const session = sessions.get(socket.id);
            if (session && data.language) {
                session.setLanguage(data.language);
            }
        });

        socket.on('disconnect', () => {
            const session = sessions.get(socket.id);
            if (session) {
                sessions.delete(socket.id);
            }
            console.log('Client disconnected');
        });

        socket.on("badgeEarned", (data) => {
            // Convert badge data to Unreal format
            const badgeData = {
                BadgeID: data.badge.id,
                Name: data.badge.name,
                Description: data.badge.description,
                Icon: await LoadTexture(data.badge.icon),
                EarnedDate: data.badge.earnedAt
            };
            
            // Call Unreal function to display badge
            TimelineFeedWidget.AddBadgeEntry(badgeData);
        });
    });

    return io;
};

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Add routes
app.use('/api/player-locations', require('./routes/player-locations'));

// Start server
server.listen(3000);

module.exports = { initializeWebSocket };

// Upload media
const uploadedMedia = await mediaService.uploadMedia(file, 'drills');

// Get media URL
const mediaUrl = mediaService.getCdnUrl('drills/jump_shot.mp4');

// List media by type
const drillVideos = await mediaService.listMediaByType('drills');

// Delete media
await mediaService.deleteMedia('drills/jump_shot.mp4');

// View progress summary
const summary = await profile.getProgressSummary();
// Update weekly focus
await profile.updateWeeklyFocus([{
    skill: "Jump Shot",
    target: "Increase accuracy by 10%",
    startDate: new Date(),
    endDate: nextWeek
}]);

def _get_video_recommendations(self, drill: DrillInfo, max_videos: int = 2):
    query = f"Drill: {drill.name} Skills: {' '.join(drill.target_skills)}"
    results = self.video_db.similarity_search_with_score(query, k=max_videos)
    # Returns relevant videos with confidence scores 

def format_response_by_channel(self, response: CoachResponse, channel: str = "chat"):
    if channel == "chat":
        return self._format_chat_response(response)
    elif channel == "email":
        return self._format_email_response(response)
    # ... other channels 

def generate_weekly_summary(self, player_id: str, channel: str = "chat"):
    # Generates rich summaries with:
    # - Emoji-enhanced progress indicators
    # - Completion statistics
    # - Follow-up recommendations 

// Initialize the tracker
const tracker = new PlayerProgressTracker();

// Record a completed drill
tracker.record_drill_completion(
    user_id="user123",
    drill_record=new DrillRecord(
        drill_id="drill1",
        drill_name="Dribbling Figure 8",
        timestamp=new Date(),
        status=DrillStatus.COMPLETED,
        duration=15,
        difficulty="intermediate",
        target_skills=["ball_handling", "coordination"],
        performance_rating=0.8
    )
);

// Get weekly stats
const stats = tracker.get_weekly_stats("user123");
console.log(stats["motivational_message"]);  // Shows achievement or encouragement

// Get streak information
const streak_info = tracker.get_streak_status("user123");
console.log(streak_info["motivational_message"]);  // Shows streak-based message

// Get complete weekly summary
const summary = tracker.get_weekly_summary_ui("user123");
console.log(summary.motivational_message);  // Shows comprehensive progress message 

// Example API usage:
fetch('/api/venues?sport=basketball&indoor=true')
  .then(response => response.json())
  .then(data => {
    // Update map markers with venue data
  }); 

const socket = io('http://localhost:3000');

// Subscribe to updates
socket.emit('subscribe', { type: 'playerUpdates' });
socket.emit('subscribe', { type: 'eventUpdates' });

// Handle updates
socket.on('playerUpdates', (data) => {
    // Update player marker
});

socket.on('eventUpdates', (data) => {
    // Update event marker
}); 

// Generate highlights
POST /api/highlights/generate
{
  "game_id": "game123",
  "actions": [
    {
      "player_id": "p1",
      "team_id": "team1",
      "game_time": "01:45",
      "quarter": 4,
      "points": 3,
      "score_diff": 2
    }
    // ... more actions
  ]
}

// Get player highlights
GET /api/highlights/p1?type=ClutchPlay&sort=impact

// Get game highlights
GET /api/highlights/game/game123?sort=confidence 

// Badge definitions with metadata
const BADGE_DEFINITIONS = {
    FIRST_CLUTCH: {
        id: "first_clutch_play",
        name: "First Clutch Play",
        description: "Earned your first clutch play highlight",
        icon: "🎯",
        requirement: 1
    },
    // ... other badges
};

// Process new highlights
processHighlights(playerId, highlights) {
    // Updates badge progress
    // Returns current status
}

// Get player badge status
getPlayerBadges(playerId) {
    // Returns earned badges and progress
} 

// GET /api/badges/player123
{
    "success": true,
    "data": {
        "earned": [
            {
                "id": "first_clutch_play",
                "name": "First Clutch Play",
                "description": "Earned your first clutch play highlight",
                "icon": "🎯",
                "earned_at": "2024-03-20T15:30:00Z"
            }
        ],
        "progress": {
            "Hot Streak Master": {
                "current": 3,
                "required": 5,
                "percentage": 60,
                "icon": "🔥"
            }
        },
        "stats": {
            "total_highlights": 15,
            "weekly_highlights": 7
        }
    }
}

// POST /api/badges/update
// Request:
{
    "player_id": "player123",
    "highlights": [
        {
            "highlight_type": "ClutchPlay",
            "timestamp": "2024-03-20T15:30:00Z"
            // ... other highlight data
        }
    ]
} 

// Track different stat categories
const STAT_CATEGORIES = {
    OFFENSE: ['points', 'assists', 'field_goals', 'three_pointers'],
    DEFENSE: ['rebounds', 'blocks', 'steals'],
    IMPACT: ['clutch_plays', 'momentum_shifts', 'hot_streaks']
};

// Growth thresholds for performance analysis
const GROWTH_THRESHOLDS = {
    EXCEPTIONAL: 25,
    GOOD: 10,
    STEADY: 0,
    DECLINING: -10
}; 

// GET /api/progress/player123
{
    "success": true,
    "data": {
        "player_id": "player123",
        "growth": {
            "offense": {
                "metrics": {
                    "points": { "value": 5, "percentage": 25 }
                },
                "average_change": 25,
                "trend": "exceptional"
            }
        },
        "streaks": {
            "current": {
                "ClutchPlay": 3,
                "HotStreak": 2
            },
            "best": {
                "ClutchPlay": 5
            }
        },
        "performance": {
            "strengths": ["three_pointers", "clutch_plays"],
            "improvements": ["free_throws"],
            "consistency": {
                "offense": 0.85,
                "defense": 0.75
            }
        },
        "recommendations": [
            {
                "type": "improvement",
                "areas": ["free_throws"],
                "message": "Focus on improving consistency in free throws"
            }
        ]
    }
}

// GET /api/progress/player123/trends?timeframe=7d
{
    "success": true,
    "data": {
        "player_id": "player123",
        "timeframe": "7d",
        "trends": {
            "offense": [...],
            "defense": [...],
            "impact": [...]
        },
        "analysis": {
            "improvement_areas": [...],
            "strengths": [...],
            "recommendations": [...]
        }
    }
} 

// Display a badge with animations
void UBadgeRewardWidget::DisplayEarnedBadge(const FBadgeData& BadgeData)
{
    SetBadgeIcon(BadgeData.Icon);
    SetBadgeName(BadgeData.Name);
    SetBadgeDescription(BadgeData.Description);
    SetEarnedDate(BadgeData.EarnedDate);
    PlayAnimationSequence();
}

void UBadgeRewardWidget::PlayAnimationSequence()
{
    // Chain animations: FadeIn -> Pulse -> Sparkle
    if (FadeInAnimation)
    {
        PlayAnimation(FadeInAnimation);
        FadeInAnimation->OnAnimationFinished_Add(
            FSimpleDelegate::CreateLambda([this]()
            {
                if (PulseAnimation) PlayAnimation(PulseAnimation);
            })
        );
    }
} 

void UTimelineFeedWidget::AddBadgeEntry(const FBadgeData& BadgeData)
{
    FFeedEntry Entry;
    Entry.Title = BadgeData.Name;
    Entry.Subtitle = BadgeData.Description;
    Entry.Icon = BadgeData.Icon;
    Entry.EntryType = TEXT("badge");
    Entry.BadgeData = BadgeData;
    AddFeedEntry(Entry);
} 

// Create badge widget blueprint
UCLASS(Blueprintable)
class UBP_BadgeReward : public UBadgeRewardWidget
{
    // Add custom animations and styling
}

// Create timeline feed blueprint
UCLASS(Blueprintable)
class UBP_TimelineFeed : public UTimelineFeedWidget
{
    // Set default classes and styling
} 

// Display a new badge
FBadgeData BadgeData;
BadgeData.BadgeID = "first_clutch_play";
BadgeData.Name = "First Clutch Play";
BadgeData.Description = "Earned your first clutch play highlight";
BadgeData.Icon = ClutchPlayIcon;
BadgeData.EarnedDate = "2024-03-20";
BadgeData.BadgeColor = FLinearColor(1.0f, 0.8f, 0.0f, 1.0f);

TimelineFeedWidget->AddBadgeEntry(BadgeData); 

// Generate a workout
response = coach.generate_response(
    player_id="123",
    question="I need a 30-minute HIIT workout for weight loss"
)

// Get meal plan
response = coach.generate_response(
    player_id="123",
    question="Give me a high-protein meal plan"
)

// Find workout location
response = coach.generate_response(
    player_id="123",
    question="Where can I do calisthenics with pull-up bars nearby?"
) 

response = await coach_assistant.generate_llm_response(
    player_id="123",
    question="How can I improve my free throw accuracy?",
    context={
        'recent_performance': {'free_throw_pct': 65},
        'health_status': {'status': 'active'},
        'focus_areas': [{'area': 'shooting', 'priority': 'high'}]
    }
)

# Response will be structured like:
{
    "response": "Here's how to improve your jump shot...",
    "recommendations": [
        "Focus on elbow alignment",
        "Practice follow-through"
    ],
    "media": [
        {
            "type": "video",
            "url": "https://cdn.sportbeacon.ai/videos/jump_shot_form.mp4",
            "caption": "Perfect jump shot demonstration",
            "thumbnail_url": "https://cdn.../thumbnail.jpg",
            "duration": 15.5,
            "format": "mp4",
            "size": {"width": 1920, "height": 1080},
            "tags": ["basketball", "shooting", "technique"]
        }
    ],
    "tags": ["shooting", "form", "basketball"],
    "metadata": {
        "timestamp": "2024-03-14T12:00:00Z",
        "response_type": "technical",
        "has_media": true
    }
} 