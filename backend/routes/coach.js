const express = require('express');
const router = express.Router();
const Redis = require('ioredis');
const { CoachAssistantEngine } = require('../coach_assistant_engine');
const { PlayerProgressTracker } = require('../player_progress_tracker');
const { DrillRecommendationEngine } = require('../drill_recommendation_engine');

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

// Initialize engines
const progressTracker = new PlayerProgressTracker();
const drillEngine = new DrillRecommendationEngine(progressTracker);
const coachEngine = new CoachAssistantEngine(progressTracker, drillEngine);

// Constants
const MAX_HISTORY_LENGTH = 10;
const HISTORY_EXPIRATION = 60 * 60 * 24; // 24 hours in seconds

// Helper function to get chat history key
const getChatHistoryKey = (playerId) => `chat_history:${playerId}`;

/**
 * Get chat history for a player
 */
router.get('/history/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const historyKey = getChatHistoryKey(playerId);
        const history = await redis.lrange(historyKey, 0, -1);
        
        res.json({
            success: true,
            history: history.map(item => JSON.parse(item))
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history'
        });
    }
});

/**
 * Submit a question to the coach assistant
 */
router.post('/ask', async (req, res) => {
    try {
        const { playerId, question } = req.body;

        if (!playerId || !question) {
            return res.status(400).json({
                success: false,
                error: 'Player ID and question are required'
            });
        }

        // Generate response from coach engine
        const response = await coachEngine.generate_response(playerId, question);

        // Store interaction in Redis
        const historyKey = getChatHistoryKey(playerId);
        const interaction = {
            timestamp: new Date().toISOString(),
            question,
            response,
            playerId
        };

        await redis.multi()
            .lpush(historyKey, JSON.stringify(interaction))
            .ltrim(historyKey, 0, MAX_HISTORY_LENGTH - 1)
            .expire(historyKey, HISTORY_EXPIRATION)
            .exec();

        // Get weekly focus
        const weeklyFocus = await coachEngine.generate_weekly_focus(playerId);

        res.json({
            success: true,
            response,
            weeklyFocus
        });
    } catch (error) {
        console.error('Error processing coach question:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process question'
        });
    }
});

/**
 * Get contextual insight for a specific stat
 */
router.get('/insight/stat/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { statName, value } = req.query;

        if (!statName || value === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Stat name and value are required'
            });
        }

        // Format question about the stat
        const question = `How can I improve my ${statName}? Current value: ${value}`;
        const response = await coachEngine.generate_response(playerId, question);

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Error getting stat insight:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stat insight'
        });
    }
});

/**
 * Get contextual insight for a badge
 */
router.get('/insight/badge/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const { badgeName } = req.query;

        if (!badgeName) {
            return res.status(400).json({
                success: false,
                error: 'Badge name is required'
            });
        }

        // Format question about the badge
        const question = `What do I need to do to earn the ${badgeName} badge?`;
        const response = await coachEngine.generate_response(playerId, question);

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('Error getting badge insight:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get badge insight'
        });
    }
});

/**
 * Get weekly focus plan
 */
router.get('/weekly-focus/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const weeklyFocus = await coachEngine.generate_weekly_focus(playerId);

        res.json({
            success: true,
            weeklyFocus
        });
    } catch (error) {
        console.error('Error getting weekly focus:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get weekly focus'
        });
    }
});

module.exports = router; 