const BADGE_DEFINITIONS = {
    FIRST_CLUTCH: {
        id: "first_clutch_play",
        name: "First Clutch Play",
        description: "Earned your first clutch play highlight",
        icon: "🎯",
        requirement: 1
    },
    HOT_STREAK_MASTER: {
        id: "hot_streak_master",
        name: "Hot Streak Master",
        description: "Achieved 5 or more hot streaks",
        icon: "🔥",
        requirement: 5
    },
    DEFENSIVE_WALL: {
        id: "defensive_wall",
        name: "Defensive Wall",
        description: "Recorded 10 or more defensive impact plays",
        icon: "🛡️",
        requirement: 10
    },
    WEEKLY_MVP: {
        id: "weekly_mvp",
        name: "Weekly MVP",
        description: "Most highlights in a 7-day span",
        icon: "👑",
        requirement: 7
    }
};

class BadgeRewardEngine {
    constructor() {
        this.playerBadges = new Map(); // player_id -> badges
        this.highlightHistory = new Map(); // player_id -> highlights
        this.weeklyStats = new Map(); // track weekly highlight counts
    }

    /**
     * Process new highlights and update badges
     * @param {string} playerId 
     * @param {Array} highlights 
     * @returns {Object} Updated badge status
     */
    processHighlights(playerId, highlights) {
        // Initialize player data if needed
        if (!this.playerBadges.has(playerId)) {
            this.playerBadges.set(playerId, {
                earned: new Set(),
                progress: new Map(),
                lastUpdate: null
            });
        }

        // Update highlight history
        if (!this.highlightHistory.has(playerId)) {
            this.highlightHistory.set(playerId, []);
        }
        this.highlightHistory.get(playerId).push(...highlights);

        // Process each highlight for badges
        highlights.forEach(highlight => {
            this._processHighlight(playerId, highlight);
        });

        // Update weekly stats
        this._updateWeeklyStats(playerId);

        // Calculate current progress
        return this._getPlayerBadgeStatus(playerId);
    }

    /**
     * Get player's current badge status
     * @param {string} playerId 
     * @returns {Object} Badge status and progress
     */
    getPlayerBadges(playerId) {
        if (!this.playerBadges.has(playerId)) {
            return {
                earned: [],
                progress: {},
                stats: {
                    total_highlights: 0,
                    weekly_highlights: 0
                }
            };
        }

        return this._getPlayerBadgeStatus(playerId);
    }

    /**
     * Process a single highlight for badge updates
     * @private
     */
    _processHighlight(playerId, highlight) {
        const playerData = this.playerBadges.get(playerId);
        const playerHighlights = this.highlightHistory.get(playerId);

        // Check First Clutch Play
        if (highlight.highlight_type === "ClutchPlay" && 
            !playerData.earned.has(BADGE_DEFINITIONS.FIRST_CLUTCH.id)) {
            playerData.earned.add(BADGE_DEFINITIONS.FIRST_CLUTCH.id);
        }

        // Update Hot Streak progress
        if (highlight.highlight_type === "HotStreak") {
            const hotStreakCount = playerHighlights.filter(h => 
                h.highlight_type === "HotStreak"
            ).length;

            if (hotStreakCount >= BADGE_DEFINITIONS.HOT_STREAK_MASTER.requirement) {
                playerData.earned.add(BADGE_DEFINITIONS.HOT_STREAK_MASTER.id);
            } else {
                playerData.progress.set(BADGE_DEFINITIONS.HOT_STREAK_MASTER.id, {
                    current: hotStreakCount,
                    required: BADGE_DEFINITIONS.HOT_STREAK_MASTER.requirement
                });
            }
        }

        // Update Defensive Wall progress
        if (highlight.highlight_type === "ImpactPlay") {
            const defenseCount = playerHighlights.filter(h => 
                h.highlight_type === "ImpactPlay"
            ).length;

            if (defenseCount >= BADGE_DEFINITIONS.DEFENSIVE_WALL.requirement) {
                playerData.earned.add(BADGE_DEFINITIONS.DEFENSIVE_WALL.id);
            } else {
                playerData.progress.set(BADGE_DEFINITIONS.DEFENSIVE_WALL.id, {
                    current: defenseCount,
                    required: BADGE_DEFINITIONS.DEFENSIVE_WALL.requirement
                });
            }
        }

        playerData.lastUpdate = new Date();
    }

    /**
     * Update weekly statistics for MVP badge
     * @private
     */
    _updateWeeklyStats(playerId) {
        const playerHighlights = this.highlightHistory.get(playerId);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Count highlights in the last 7 days
        const weeklyCount = playerHighlights.filter(highlight => 
            new Date(highlight.timestamp) > oneWeekAgo
        ).length;

        this.weeklyStats.set(playerId, weeklyCount);

        // Check if this player has the most highlights this week
        let isMVP = true;
        for (const [otherId, count] of this.weeklyStats) {
            if (otherId !== playerId && count > weeklyCount) {
                isMVP = false;
                break;
            }
        }

        const playerData = this.playerBadges.get(playerId);
        if (isMVP && weeklyCount >= BADGE_DEFINITIONS.WEEKLY_MVP.requirement) {
            playerData.earned.add(BADGE_DEFINITIONS.WEEKLY_MVP.id);
        } else {
            playerData.progress.set(BADGE_DEFINITIONS.WEEKLY_MVP.id, {
                current: weeklyCount,
                required: BADGE_DEFINITIONS.WEEKLY_MVP.requirement
            });
        }
    }

    /**
     * Format player's badge status for API response
     * @private
     */
    _getPlayerBadgeStatus(playerId) {
        const playerData = this.playerBadges.get(playerId);
        const playerHighlights = this.highlightHistory.get(playerId);

        const earned = Array.from(playerData.earned).map(badgeId => {
            const badge = Object.values(BADGE_DEFINITIONS).find(b => b.id === badgeId);
            return {
                id: badge.id,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                earned_at: playerData.lastUpdate
            };
        });

        const progress = {};
        for (const [badgeId, progressData] of playerData.progress) {
            const badge = Object.values(BADGE_DEFINITIONS).find(b => b.id === badgeId);
            progress[badge.name] = {
                current: progressData.current,
                required: progressData.required,
                percentage: Math.round((progressData.current / progressData.required) * 100),
                icon: badge.icon
            };
        }

        return {
            earned,
            progress,
            stats: {
                total_highlights: playerHighlights.length,
                weekly_highlights: this.weeklyStats.get(playerId) || 0
            }
        };
    }
}

module.exports = BadgeRewardEngine; 