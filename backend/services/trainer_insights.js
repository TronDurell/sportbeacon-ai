const PlayerProfile = require('../models/player_profile');
const UserStats = require('../models/user_stats');
const { Configuration, OpenAIApi } = require('openai');

class TrainerInsights {
    constructor(io) {
        this.io = io;
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY
        }));
        this.insightThresholds = {
            fatigue: 0.7,
            performance: {
                drop: -0.15,
                improvement: 0.2
            },
            consistency: 0.8
        };
    }

    async getRosterInsights(trainerId) {
        const roster = await this._getActiveRoster(trainerId);
        const insights = await Promise.all(
            roster.map(player => this._analyzePlayerPerformance(player))
        );

        return {
            roster: insights,
            summary: this._generateRosterSummary(insights)
        };
    }

    async getPlayerInsights(trainerId, playerId) {
        const hasAccess = await this._validateTrainerAccess(trainerId, playerId);
        if (!hasAccess) {
            throw new Error('Unauthorized access to player');
        }

        const player = await PlayerProfile.findOne({ userId: playerId })
            .populate('performance')
            .populate('journal');
        
        return this._analyzePlayerPerformance(player);
    }

    async getDrillRecommendations(trainerId, playerId) {
        const playerInsights = await this.getPlayerInsights(trainerId, playerId);
        
        // Use GPT to generate personalized drill recommendations
        const response = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are an expert sports trainer. Generate specific drill recommendations based on player performance data."
            }, {
                role: "user",
                content: JSON.stringify({
                    performance: playerInsights.performance,
                    focusAreas: playerInsights.focusAreas,
                    recentProgress: playerInsights.trends
                })
            }]
        });

        const recommendations = JSON.parse(response.data.choices[0].message.content);
        return {
            playerId,
            recommendations,
            context: {
                basedOn: playerInsights.focusAreas,
                timestamp: new Date()
            }
        };
    }

    async _getActiveRoster(trainerId) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        }).populate({
            path: 'trainerInfo.roster.playerId',
            match: { 'status': 'ACTIVE' },
            populate: {
                path: 'performance'
            }
        });

        return trainerProfile.trainerInfo.roster.map(entry => entry.playerId);
    }

    async _analyzePlayerPerformance(player) {
        const recentWorkouts = await this._getRecentWorkouts(player.userId);
        const stats = await UserStats.findOne({ userId: player.userId });
        const weeklyFocus = player.performance.weeklyFocus;

        // Calculate performance metrics
        const performance = this._calculatePerformanceMetrics(recentWorkouts);
        const trends = this._analyzeTrends(performance, stats);
        const flags = this._identifyFlags(performance, trends);

        return {
            playerId: player.userId,
            profile: {
                name: player.personalInfo.displayName,
                mainSport: player.personalInfo.sports.find(s => s.isMain),
                level: stats.level
            },
            performance,
            trends,
            flags,
            focusAreas: weeklyFocus.map(focus => ({
                skill: focus.skill,
                progress: focus.progress,
                remaining: (focus.endDate - new Date()) / (1000 * 60 * 60 * 24) // days
            })),
            insights: await this._generateInsights(performance, trends, flags)
        };
    }

    _calculatePerformanceMetrics(workouts) {
        if (!workouts.length) return null;

        return {
            intensity: {
                average: workouts.reduce((sum, w) => sum + w.intensity, 0) / workouts.length,
                trend: this._calculateTrend(workouts.map(w => w.intensity))
            },
            formScore: {
                average: workouts.reduce((sum, w) => sum + w.formScore, 0) / workouts.length,
                consistency: this._calculateConsistency(workouts.map(w => w.formScore))
            },
            volume: {
                total: workouts.reduce((sum, w) => sum + w.duration, 0),
                dailyAverage: workouts.reduce((sum, w) => sum + w.duration, 0) / 7
            },
            completion: {
                rate: workouts.reduce((sum, w) => sum + w.completionRate, 0) / workouts.length,
                trend: this._calculateTrend(workouts.map(w => w.completionRate))
            }
        };
    }

    _analyzeTrends(performance, stats) {
        if (!performance) return null;

        return {
            fatigue: this._calculateFatigueIndex(performance),
            improvement: {
                rate: this._calculateImprovementRate(stats),
                consistency: performance.formScore.consistency
            },
            engagement: {
                streak: stats.currentStreak,
                consistency: performance.completion.rate
            }
        };
    }

    _identifyFlags(performance, trends) {
        const flags = [];

        if (trends.fatigue > this.insightThresholds.fatigue) {
            flags.push({
                type: 'FATIGUE_RISK',
                severity: 'HIGH',
                metric: trends.fatigue,
                message: 'High fatigue risk detected based on recent workout patterns'
            });
        }

        if (performance.formScore.trend < this.insightThresholds.performance.drop) {
            flags.push({
                type: 'PERFORMANCE_DROP',
                severity: 'MEDIUM',
                metric: performance.formScore.trend,
                message: 'Notable decrease in form quality over recent sessions'
            });
        }

        if (performance.intensity.trend > this.insightThresholds.performance.improvement) {
            flags.push({
                type: 'INTENSITY_SPIKE',
                severity: 'LOW',
                metric: performance.intensity.trend,
                message: 'Significant increase in workout intensity'
            });
        }

        return flags;
    }

    async _generateInsights(performance, trends, flags) {
        const response = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are a sports performance analyst. Generate concise, actionable insights based on player performance data."
            }, {
                role: "user",
                content: JSON.stringify({ performance, trends, flags })
            }]
        });

        return JSON.parse(response.data.choices[0].message.content);
    }

    _calculateTrend(values) {
        if (values.length < 2) return 0;
        const changes = [];
        for (let i = 1; i < values.length; i++) {
            changes.push(values[i] - values[i-1]);
        }
        return changes.reduce((sum, change) => sum + change, 0) / changes.length;
    }

    _calculateConsistency(values) {
        if (values.length < 2) return 1;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return 1 - Math.sqrt(variance) / mean; // Normalized consistency score
    }

    _calculateFatigueIndex(performance) {
        return (
            (1 - performance.formScore.consistency) * 0.4 +
            (performance.intensity.average / 5) * 0.3 +
            (1 - performance.completion.rate) * 0.3
        );
    }

    _calculateImprovementRate(stats) {
        const recentXP = stats.workoutHistory
            .slice(-7)
            .reduce((sum, w) => sum + w.xpEarned, 0);
        const previousXP = stats.workoutHistory
            .slice(-14, -7)
            .reduce((sum, w) => sum + w.xpEarned, 0);
        
        return previousXP ? (recentXP - previousXP) / previousXP : 0;
    }

    async _getRecentWorkouts(userId) {
        const player = await PlayerProfile.findOne({ userId });
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return player.workoutHistory.filter(w => w.date >= sevenDaysAgo);
    }

    _generateRosterSummary(insights) {
        const flagged = insights.filter(i => i.flags.length > 0);
        const improving = insights.filter(i => 
            i.trends.improvement.rate > this.insightThresholds.performance.improvement
        );

        return {
            totalActive: insights.length,
            flaggedPlayers: flagged.length,
            improvingPlayers: improving.length,
            topPriority: flagged
                .sort((a, b) => b.flags[0].severity - a.flags[0].severity)
                .slice(0, 3)
                .map(i => ({
                    playerId: i.playerId,
                    name: i.profile.name,
                    flag: i.flags[0]
                }))
        };
    }

    async _validateTrainerAccess(trainerId, playerId) {
        const trainerProfile = await PlayerProfile.findOne({
            userId: trainerId,
            role: 'TRAINER'
        });

        return trainerProfile?.trainerInfo.roster.some(
            player => player.playerId.equals(playerId) && player.status === 'ACTIVE'
        );
    }
}

module.exports = TrainerInsights; 