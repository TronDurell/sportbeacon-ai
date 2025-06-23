const express = require('express');
const router = express.Router();
const PlayerProgressTracker = require('../engines/player_progress_tracker');

// Initialize progress tracker
const progressTracker = new PlayerProgressTracker();

/**
 * POST /api/progress/update
 * Update player progress with new data
 */
router.post('/update', async (req, res) => {
    const { player_id, highlights, stats, badges } = req.body;

    if (!player_id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required field: player_id'
        });
    }

    try {
        const report = progressTracker.updatePlayerProfile({
            player_id,
            highlights,
            stats,
            badges
        });

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update progress'
        });
    }
});

/**
 * GET /api/progress/:player_id
 * Get player's progress report
 */
router.get('/:player_id', (req, res) => {
    const { player_id } = req.params;
    const { category } = req.query;

    try {
        const report = progressTracker.getProgressReport(player_id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Player not found'
            });
        }

        // Filter by category if specified
        if (category) {
            const filteredReport = {
                player_id: report.player_id,
                lastUpdated: report.lastUpdated
            };

            switch (category) {
                case 'growth':
                    filteredReport.growth = report.growth;
                    break;
                case 'streaks':
                    filteredReport.streaks = report.streaks;
                    break;
                case 'badges':
                    filteredReport.badges = report.badges;
                    break;
                case 'performance':
                    filteredReport.performance = report.performance;
                    break;
                case 'recommendations':
                    filteredReport.recommendations = report.recommendations;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid category'
                    });
            }

            return res.json({
                success: true,
                data: filteredReport
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress'
        });
    }
});

/**
 * GET /api/progress/:player_id/trends
 * Get player's performance trends
 */
router.get('/:player_id/trends', (req, res) => {
    const { player_id } = req.params;
    const { timeframe = '7d' } = req.query; // Default to 7 days

    try {
        const report = progressTracker.getProgressReport(player_id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Player not found'
            });
        }

        // Extract trends data
        const trends = {
            offense: report.trends?.offense || [],
            defense: report.trends?.defense || [],
            impact: report.trends?.impact || []
        };

        // Filter based on timeframe
        const cutoffDate = new Date();
        switch (timeframe) {
            case '24h':
                cutoffDate.setHours(cutoffDate.getHours() - 24);
                break;
            case '7d':
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                break;
            case '30d':
                cutoffDate.setDate(cutoffDate.getDate() - 30);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid timeframe'
                });
        }

        // Filter trends by timeframe
        Object.keys(trends).forEach(category => {
            trends[category] = trends[category].filter(t => 
                new Date(t.timestamp) >= cutoffDate
            );
        });

        res.json({
            success: true,
            data: {
                player_id,
                timeframe,
                trends,
                analysis: {
                    improvement_areas: report.performance?.improvements || [],
                    strengths: report.performance?.strengths || [],
                    recommendations: report.recommendations || []
                }
            }
        });
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trends'
        });
    }
});

/**
 * GET /api/progress/:player_id/compare
 * Compare player's progress with previous period
 */
router.get('/:player_id/compare', (req, res) => {
    const { player_id } = req.params;
    const { period = '7d' } = req.query;

    try {
        const report = progressTracker.getProgressReport(player_id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Player not found'
            });
        }

        // Extract relevant comparison data
        const comparison = {
            current_period: {
                highlights: report.streaks?.current || {},
                performance: report.performance || {},
                growth: report.growth || {}
            },
            previous_period: {
                highlights: report.streaks?.previous || {},
                performance: report.performance?.previous || {},
                growth: report.growth?.previous || {}
            },
            trends: report.trends || {},
            recommendations: report.recommendations || []
        };

        res.json({
            success: true,
            data: {
                player_id,
                period,
                comparison
            }
        });
    } catch (error) {
        console.error('Error comparing progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare progress'
        });
    }
});

module.exports = router; 