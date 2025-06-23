const express = require('express');
const router = express.Router();
const BadgeRewardEngine = require('../engines/badge_reward_engine');

// Initialize badge engine
const badgeEngine = new BadgeRewardEngine();

/**
 * POST /api/badges/update
 * Process new highlights and update badges
 */
router.post('/update', async (req, res) => {
    const { player_id, highlights } = req.body;

    if (!player_id || !highlights || !Array.isArray(highlights)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request. Required: player_id and highlights array'
        });
    }

    try {
        const result = badgeEngine.processHighlights(player_id, highlights);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error processing badges:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process badges'
        });
    }
});

/**
 * GET /api/badges/:player_id
 * Get all badges and progress for a player
 */
router.get('/:player_id', (req, res) => {
    const { player_id } = req.params;
    
    try {
        const result = badgeEngine.getPlayerBadges(player_id);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges'
        });
    }
});

/**
 * GET /api/badges/leaderboard/weekly
 * Get weekly MVP leaderboard
 */
router.get('/leaderboard/weekly', (req, res) => {
    try {
        const weeklyStats = badgeEngine.getWeeklyLeaderboard();
        
        res.json({
            success: true,
            data: weeklyStats
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

module.exports = router; 