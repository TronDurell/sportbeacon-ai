export class PlayerAIService {
    static ANALYSIS_ENDPOINT = '/api/ai/player-analysis';
    static ROLES = [
        'Advanced Playmaker',
        'Box-to-Box Midfielder',
        'Target Forward',
        'Sweeper Keeper',
        'Wing Back',
        'Ball-Playing Defender',
        'Deep-Lying Playmaker',
        'Inside Forward',
        'Defensive Midfielder',
        'Complete Forward',
    ];
    // Mock implementation - replace with actual API calls
    static async generateAnalysis(player, drillHistory, insights) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Calculate trends from drill history
        const recentMetrics = this.calculateRecentMetrics(drillHistory);
        // Generate role recommendations based on stats and trends
        const roleRecommendations = this.generateRoleRecommendations(player.stats, recentMetrics);
        // Calculate overall confidence score
        const confidenceScore = this.calculateConfidenceScore(player.stats, recentMetrics, insights);
        return {
            summary: this.generateSummary(player, recentMetrics, roleRecommendations),
            strengths: this.identifyStrengths(player.stats, recentMetrics),
            roleRecommendations,
            progressTrend: {
                startDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
                endDate: new Date().toISOString(),
                metrics: recentMetrics,
            },
            confidenceScore,
            insights: this.filterSignificantInsights(insights),
        };
    }
    static calculateRecentMetrics(drillHistory) {
        const metrics = [];
        // Group metrics by type
        const metricGroups = new Map();
        drillHistory.forEach(session => {
            Object.entries(session.metrics).forEach(([metric, value]) => {
                if (!metricGroups.has(metric)) {
                    metricGroups.set(metric, []);
                }
                metricGroups.get(metric)?.push(value);
            });
        });
        // Calculate trends for each metric
        metricGroups.forEach((values, name) => {
            const trend = this.calculateTrend(values);
            const changePercent = this.calculateChangePercent(values);
            metrics.push({
                name: name,
                values,
                trend,
                changePercent,
            });
        });
        return metrics;
    }
    static generateRoleRecommendations(currentStats, recentMetrics) {
        const recommendations = [];
        // Simple role matching based on stats
        // In a real implementation, this would use ML models
        this.ROLES.forEach(role => {
            const fitScore = Math.random() * 0.4 + 0.6; // Mock score between 0.6 and 1.0
            const confidence = Math.random() * 0.3 + 0.7; // Mock confidence between 0.7 and 1.0
            if (fitScore > 0.7) {
                recommendations.push({
                    role,
                    confidence,
                    reasoning: `Strong statistical match based on recent performance metrics`,
                    fitScore,
                });
            }
        });
        return recommendations.sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);
    }
    static calculateConfidenceScore(stats, recentMetrics, insights) {
        // Mock confidence calculation
        // In a real implementation, this would use more sophisticated analysis
        const baseScore = 7.5;
        const trendBonus = recentMetrics.filter(m => m.trend === 'up').length * 0.2;
        const insightBonus = insights.filter(i => i.significance > 0.7).length * 0.1;
        return Math.min(10, baseScore + trendBonus + insightBonus);
    }
    static generateSummary(player, recentMetrics, roleRecommendations) {
        const improvements = recentMetrics
            .filter(m => m.trend === 'up' && m.changePercent > 10)
            .map(m => m.name)
            .join(', ');
        const topRole = roleRecommendations[0];
        return `${player.firstName} ${player.lastName} shows strong potential as a ${topRole.role} with consistent improvement in ${improvements}. Recent performance data indicates a clear upward trajectory in key metrics, suggesting readiness for higher-level competition.`;
    }
    static identifyStrengths(stats, recentMetrics) {
        return Object.entries(stats)
            .filter(([_, value]) => value > 75)
            .map(([key, value]) => ({
            attribute: key,
            description: `Exceptional ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            confidence: value / 100,
        }))
            .slice(0, 5);
    }
    static filterSignificantInsights(insights) {
        return insights
            .filter(insight => insight.significance > 0.5)
            .sort((a, b) => b.significance - a.significance)
            .slice(0, 10);
    }
    static calculateTrend(values) {
        if (values.length < 2)
            return 'stable';
        const change = values[values.length - 1] - values[0];
        if (Math.abs(change) < values[0] * 0.05)
            return 'stable';
        return change > 0 ? 'up' : 'down';
    }
    static calculateChangePercent(values) {
        if (values.length < 2)
            return 0;
        const initial = values[0];
        const final = values[values.length - 1];
        return ((final - initial) / initial) * 100;
    }
}
