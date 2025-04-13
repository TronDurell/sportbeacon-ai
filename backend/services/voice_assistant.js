const { Configuration, OpenAIApi } = require('openai');
const PlayerProfile = require('../models/player_profile');
const UserStats = require('../models/user_stats');

class VoiceAssistant {
    constructor(io) {
        this.io = io;
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        }));
        this.commandHandlers = this._initializeCommandHandlers();
    }

    _initializeCommandHandlers() {
        return {
            'show_weekly_focus': this.handleWeeklyFocusRequest.bind(this),
            'show_monthly_progress': this.handleMonthlyProgressRequest.bind(this),
            'add_journal_note': this.handleJournalNote.bind(this),
            'show_achievements': this.handleAchievementsRequest.bind(this),
            'show_drill_details': this.handleDrillDetailsRequest.bind(this),
            'show_venue_history': this.handleVenueHistoryRequest.bind(this)
        };
    }

    async processVoiceCommand(userId, audioData, options = {}) {
        try {
            // Convert audio to text using Whisper
            const transcription = await this.openai.createTranscription(
                audioData,
                "whisper-1",
                options.language || 'en'
            );

            const command = transcription.data.text;

            // Analyze command intent using GPT
            const intent = await this._analyzeIntent(command);

            // Execute command based on intent
            const response = await this._executeCommand(userId, intent, command);

            // Convert response to speech if not in whisper mode
            const profile = await PlayerProfile.findOne({ userId });
            if (!profile.preferences.aiAssistant.whisperMode) {
                // Implement text-to-speech here
                // For now, just return text
                return {
                    text: response,
                    audio: null
                };
            }

            return {
                text: response,
                audio: null
            };
        } catch (error) {
            console.error('Error processing voice command:', error);
            throw error;
        }
    }

    async _analyzeIntent(command) {
        const response = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `You are a sports training assistant. Analyze the user's command and return a JSON object with:
                - command: The main command type (show_weekly_focus, show_monthly_progress, add_journal_note, etc.)
                - parameters: Any relevant parameters extracted from the command
                - context: Additional context that might be helpful`
            }, {
                role: "user",
                content: command
            }]
        });

        return JSON.parse(response.data.choices[0].message.content);
    }

    async _executeCommand(userId, intent, originalCommand) {
        const handler = this.commandHandlers[intent.command];
        if (!handler) {
            return this._generateGenericResponse(originalCommand);
        }

        return handler(userId, intent.parameters);
    }

    async handleWeeklyFocusRequest(userId) {
        const profile = await PlayerProfile.findOne({ userId });
        const currentFocus = profile.performance.weeklyFocus.filter(f => 
            f.endDate > new Date()
        );

        if (!currentFocus.length) {
            return "You don't have any active focus areas this week. Would you like me to suggest some based on your recent performance?";
        }

        const focusText = currentFocus.map(f => 
            `${f.skill}: ${f.target} (${f.progress}% complete)`
        ).join('\n');

        return `Here's your weekly focus:\n${focusText}`;
    }

    async handleMonthlyProgressRequest(userId) {
        const stats = await UserStats.findOne({ userId });
        const profile = await PlayerProfile.findOne({ userId });

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyWorkouts = profile.workoutHistory.filter(w => 
            w.date >= startOfMonth
        );

        const xpGained = monthlyWorkouts.reduce((sum, w) => sum + w.xpEarned, 0);
        const averageFormScore = this._calculateAverageFormScore(monthlyWorkouts);

        return `This month you've completed ${monthlyWorkouts.length} workouts, earned ${xpGained} XP, and maintained an average form score of ${averageFormScore}. Your current streak is ${stats.currentStreak} days.`;
    }

    async handleJournalNote(userId, parameters) {
        const profile = await PlayerProfile.findOne({ userId });
        
        await profile.addJournalEntry({
            type: 'NOTE',
            content: parameters.note,
            mood: parameters.mood,
            tags: parameters.tags || [],
            visibility: 'PRIVATE'
        });

        return "I've added your note to your training journal. Would you like me to set a reminder to follow up on this?";
    }

    async handleAchievementsRequest(userId) {
        const stats = await UserStats.findOne({ userId });
        const recentAchievements = stats.badges
            .sort((a, b) => b.earnedAt - a.earnedAt)
            .slice(0, 3);

        if (!recentAchievements.length) {
            return "You haven't earned any achievements yet. Let's work on getting your first one!";
        }

        const achievementText = recentAchievements.map(a =>
            `${a.name}: ${a.description}`
        ).join('\n');

        return `Here are your recent achievements:\n${achievementText}`;
    }

    async handleDrillDetailsRequest(userId, parameters) {
        // Implementation would depend on your drill database structure
        return "I'll show you detailed information about that drill, including proper form tips and common mistakes to avoid.";
    }

    async handleVenueHistoryRequest(userId) {
        const profile = await PlayerProfile.findOne({ userId });
        const recentVenues = profile.venues
            .sort((a, b) => b.lastVisit - a.lastVisit)
            .slice(0, 3);

        if (!recentVenues.length) {
            return "You haven't checked in at any venues yet. Would you like me to help you find nearby training facilities?";
        }

        const venueText = recentVenues.map(v =>
            `${v.name}: visited ${v.visitCount} times, last visit ${v.lastVisit.toLocaleDateString()}`
        ).join('\n');

        return `Here are your recent training venues:\n${venueText}`;
    }

    async _generateGenericResponse(command) {
        const response = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are a helpful sports training assistant. Provide a natural, encouraging response when you can't directly fulfill a request."
            }, {
                role: "user",
                content: command
            }]
        });

        return response.data.choices[0].message.content;
    }

    _calculateAverageFormScore(workouts) {
        if (!workouts.length) return 0;
        const sum = workouts.reduce((acc, w) => acc + (w.formScore || 0), 0);
        return Math.round((sum / workouts.length) * 100) / 100;
    }
}

module.exports = VoiceAssistant; 