const STAT_CATEGORIES = {
    OFFENSE: ['points', 'assists', 'field_goals', 'three_pointers'],
    DEFENSE: ['rebounds', 'blocks', 'steals'],
    IMPACT: ['clutch_plays', 'momentum_shifts', 'hot_streaks']
};

const GROWTH_THRESHOLDS = {
    EXCEPTIONAL: 25, // 25% or more improvement
    GOOD: 10,       // 10-24% improvement
    STEADY: 0,      // 0-9% improvement
    DECLINING: -10  // >10% decline
};

class PlayerProgressTracker {
    constructor() {
        this.playerData = new Map(); // player_id -> { highlights, stats, badges, history }
        this.progressCache = new Map(); // Cache progress calculations
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Update player profile with new data
     * @param {Object} param0 Player profile data
     * @returns {Object} Updated progress report
     */
    updatePlayerProfile({ player_id, highlights = [], stats = {}, badges = [] }) {
        if (!this.playerData.has(player_id)) {
            this.playerData.set(player_id, {
                highlights: [],
                statsHistory: [],
                badges: new Set(),
                trends: {
                    offense: [],
                    defense: [],
                    impact: []
                },
                lastUpdated: new Date()
            });
        }

        const profile = this.playerData.get(player_id);
        
        // Update highlights with timestamps
        const timestampedHighlights = highlights.map(h => ({
            ...h,
            timestamp: h.timestamp || new Date().toISOString()
        }));
        profile.highlights.push(...timestampedHighlights);

        // Update stats history
        const timestampedStats = {
            ...stats,
            timestamp: new Date().toISOString()
        };
        profile.statsHistory.push(timestampedStats);

        // Update badges (using Set to prevent duplicates)
        badges.forEach(badge => profile.badges.add(badge));

        // Update category trends
        this._updateTrends(profile, timestampedStats);

        // Clear cached progress report
        this.progressCache.delete(player_id);

        // Trim old data to prevent memory bloat
        this._trimHistoricalData(profile);

        return this.getProgressReport(player_id);
    }

    /**
     * Get comprehensive progress report for player
     * @param {string} player_id Player ID
     * @returns {Object} Progress report
     */
    getProgressReport(player_id) {
        const profile = this.playerData.get(player_id);
        if (!profile) return null;

        // Check cache first
        const cachedReport = this._getCachedReport(player_id);
        if (cachedReport) return cachedReport;

        // Calculate new report
        const report = {
            player_id,
            growth: this._calculateGrowth(profile),
            streaks: this._calculateStreaks(profile.highlights),
            trends: this._analyzeTrends(profile.trends),
            badges: this._analyzeBadgeProgress(profile.badges),
            performance: this._analyzePerformance(profile),
            recommendations: this._generateRecommendations(profile),
            lastUpdated: profile.lastUpdated
        };

        // Cache the report
        this._cacheReport(player_id, report);

        return report;
    }

    /**
     * Calculate statistical growth across categories
     * @private
     */
    _calculateGrowth(profile) {
        const recentStats = profile.statsHistory.slice(-2);
        if (recentStats.length < 2) return { status: "Insufficient data" };

        const [prev, curr] = recentStats;
        const growth = {
            offense: this._calculateCategoryGrowth(prev, curr, STAT_CATEGORIES.OFFENSE),
            defense: this._calculateCategoryGrowth(prev, curr, STAT_CATEGORIES.DEFENSE),
            impact: this._calculateCategoryGrowth(prev, curr, STAT_CATEGORIES.IMPACT)
        };

        return {
            ...growth,
            overall_trend: this._determineGrowthTrend(growth)
        };
    }

    /**
     * Calculate growth for a specific category
     * @private
     */
    _calculateCategoryGrowth(prev, curr, metrics) {
        const changes = {};
        let totalChange = 0;
        let validMetrics = 0;

        metrics.forEach(metric => {
            if (prev[metric] !== undefined && curr[metric] !== undefined) {
                const prevVal = prev[metric] || 0;
                const currVal = curr[metric] || 0;
                const percentChange = prevVal === 0 ? 
                    (currVal > 0 ? 100 : 0) : 
                    ((currVal - prevVal) / prevVal) * 100;
                
                changes[metric] = {
                    value: currVal - prevVal,
                    percentage: Math.round(percentChange * 10) / 10
                };
                
                totalChange += percentChange;
                validMetrics++;
            }
        });

        const averageChange = validMetrics > 0 ? totalChange / validMetrics : 0;

        return {
            metrics: changes,
            average_change: Math.round(averageChange * 10) / 10,
            trend: this._getGrowthLevel(averageChange)
        };
    }

    /**
     * Calculate active streaks from highlights
     * @private
     */
    _calculateStreaks(highlights) {
        const recentHighlights = highlights.slice(-50); // Look at last 50 highlights
        const streaks = {
            current: {},
            best: {}
        };

        // Group highlights by type
        const byType = recentHighlights.reduce((acc, h) => {
            if (!acc[h.highlight_type]) acc[h.highlight_type] = [];
            acc[h.highlight_type].push(h);
            return acc;
        }, {});

        // Calculate streaks for each type
        Object.entries(byType).forEach(([type, typeHighlights]) => {
            const sorted = typeHighlights.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );

            // Current streak
            let currentStreak = 0;
            for (const highlight of sorted) {
                if (this._isWithinStreak(highlight.timestamp)) {
                    currentStreak++;
                } else break;
            }
            streaks.current[type] = currentStreak;

            // Best streak
            let bestStreak = 0;
            let tempStreak = 0;
            let lastTimestamp = null;

            sorted.forEach(highlight => {
                if (!lastTimestamp || this._isConsecutive(lastTimestamp, highlight.timestamp)) {
                    tempStreak++;
                } else {
                    bestStreak = Math.max(bestStreak, tempStreak);
                    tempStreak = 1;
                }
                lastTimestamp = highlight.timestamp;
            });
            bestStreak = Math.max(bestStreak, tempStreak);
            streaks.best[type] = bestStreak;
        });

        return streaks;
    }

    /**
     * Analyze performance trends
     * @private
     */
    _analyzePerformance(profile) {
        const recentStats = profile.statsHistory.slice(-5); // Last 5 entries
        if (recentStats.length < 2) return { status: "Insufficient data" };

        const performance = {
            strengths: [],
            improvements: [],
            consistency: {}
        };

        // Analyze each category
        Object.entries(STAT_CATEGORIES).forEach(([category, metrics]) => {
            const categoryData = metrics.map(metric => {
                const values = recentStats.map(s => s[metric] || 0);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
                
                return {
                    metric,
                    average: avg,
                    variance,
                    trend: this._calculateTrend(values)
                };
            });

            // Identify strengths (high average, low variance)
            performance.strengths.push(
                ...categoryData
                    .filter(d => d.average > 0 && d.variance < 1)
                    .map(d => d.metric)
            );

            // Identify areas for improvement (high variance or declining trend)
            performance.improvements.push(
                ...categoryData
                    .filter(d => d.variance > 2 || d.trend === 'declining')
                    .map(d => d.metric)
            );

            // Calculate consistency scores
            performance.consistency[category.toLowerCase()] = 
                categoryData.reduce((acc, d) => acc + (1 / (1 + d.variance)), 0) / categoryData.length;
        });

        return performance;
    }

    /**
     * Generate personalized recommendations
     * @private
     */
    _generateRecommendations(profile) {
        const performance = this._analyzePerformance(profile);
        const recommendations = [];

        // Focus areas based on performance
        if (performance.improvements.length > 0) {
            recommendations.push({
                type: 'improvement',
                areas: performance.improvements,
                message: `Focus on improving consistency in: ${performance.improvements.join(', ')}`
            });
        }

        // Streak-based recommendations
        const streaks = this._calculateStreaks(profile.highlights);
        Object.entries(streaks.current).forEach(([type, count]) => {
            if (count > 0) {
                recommendations.push({
                    type: 'streak',
                    highlight_type: type,
                    message: `You're on a ${count}-game streak for ${type}! Keep it going!`
                });
            }
        });

        // Badge progression recommendations
        const badgeProgress = this._analyzeBadgeProgress(profile.badges);
        const nearCompletion = badgeProgress.filter(b => b.progress >= 75 && !b.achieved);
        if (nearCompletion.length > 0) {
            recommendations.push({
                type: 'badge',
                badges: nearCompletion.map(b => b.name),
                message: `You're close to earning ${nearCompletion.length} new badges!`
            });
        }

        return recommendations;
    }

    /**
     * Update category trends
     * @private
     */
    _updateTrends(profile, stats) {
        Object.entries(STAT_CATEGORIES).forEach(([category, metrics]) => {
            const categoryScore = metrics.reduce((sum, metric) => 
                sum + (stats[metric] || 0), 0
            );
            
            profile.trends[category.toLowerCase()].push({
                score: categoryScore,
                timestamp: stats.timestamp
            });
        });
    }

    /**
     * Analyze badge progress
     * @private
     */
    _analyzeBadgeProgress(badges) {
        return Array.from(badges).map(badge => ({
            name: badge,
            achieved: true,
            progress: 100,
            earnedAt: new Date().toISOString()
        }));
    }

    /**
     * Helper method to determine growth trend
     * @private
     */
    _getGrowthLevel(percentChange) {
        if (percentChange >= GROWTH_THRESHOLDS.EXCEPTIONAL) return 'exceptional';
        if (percentChange >= GROWTH_THRESHOLDS.GOOD) return 'good';
        if (percentChange >= GROWTH_THRESHOLDS.STEADY) return 'steady';
        if (percentChange >= GROWTH_THRESHOLDS.DECLINING) return 'declining';
        return 'needs_improvement';
    }

    /**
     * Check if highlight timestamp is within streak window
     * @private
     */
    _isWithinStreak(timestamp) {
        const highlightDate = new Date(timestamp);
        const streakWindow = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7 days
        return highlightDate >= streakWindow;
    }

    /**
     * Check if two timestamps are consecutive for streak purposes
     * @private
     */
    _isConsecutive(timestamp1, timestamp2) {
        const date1 = new Date(timestamp1);
        const date2 = new Date(timestamp2);
        const diffDays = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
        return diffDays <= 2; // Consider consecutive if within 2 days
    }

    /**
     * Calculate trend from array of values
     * @private
     */
    _calculateTrend(values) {
        if (values.length < 2) return 'neutral';
        const start = values[0];
        const end = values[values.length - 1];
        const percentChange = ((end - start) / start) * 100;
        return this._getGrowthLevel(percentChange);
    }

    /**
     * Cache management methods
     * @private
     */
    _getCachedReport(playerId) {
        const cached = this.progressCache.get(playerId);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.progressCache.delete(playerId);
            return null;
        }
        return cached.report;
    }

    _cacheReport(playerId, report) {
        this.progressCache.set(playerId, {
            timestamp: Date.now(),
            report
        });
    }

    /**
     * Trim old data to prevent memory bloat
     * @private
     */
    _trimHistoricalData(profile) {
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        
        // Trim highlights
        profile.highlights = profile.highlights.filter(h => 
            new Date(h.timestamp) >= thirtyDaysAgo
        );

        // Trim stats history (keep last 30 entries)
        if (profile.statsHistory.length > 30) {
            profile.statsHistory = profile.statsHistory.slice(-30);
        }

        // Trim trends
        Object.keys(profile.trends).forEach(category => {
            profile.trends[category] = profile.trends[category].filter(t => 
                new Date(t.timestamp) >= thirtyDaysAgo
            );
        });
    }
}

module.exports = PlayerProgressTracker; 