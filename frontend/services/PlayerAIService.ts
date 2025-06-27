import { ScoutPlayer, PlayerStats } from '../types/player';

export interface PlayerInsight {
  timestamp: string;
  type: 'performance' | 'improvement' | 'achievement';
  metric: keyof PlayerStats;
  value: number;
  trend: 'up' | 'down' | 'stable';
  significance: number; // 0-1 scale
}

export interface AIAnalysis {
  summary: string;
  strengths: Array<{
    attribute: string;
    description: string;
    confidence: number;
  }>;
  roleRecommendations: Array<{
    role: string;
    confidence: number;
    reasoning: string;
    fitScore: number;
  }>;
  progressTrend: {
    startDate: string;
    endDate: string;
    metrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: 'up' | 'down' | 'stable';
      changePercent: number;
    }>;
  };
  confidenceScore: number;
  insights: PlayerInsight[];
}

export class PlayerAIService {
  private static readonly ANALYSIS_ENDPOINT = '/api/ai/player-analysis';
  private static readonly ROLES = [
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
  static async generateAnalysis(
    player: ScoutPlayer,
    drillHistory: Array<{
      date: string;
      performance: number;
      metrics: Partial<PlayerStats>;
    }>,
    insights: PlayerInsight[]
  ): Promise<AIAnalysis> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculate trends from drill history
    const recentMetrics = this.calculateRecentMetrics(drillHistory);

    // Generate role recommendations based on stats and trends
    const roleRecommendations = this.generateRoleRecommendations(
      player.stats,
      recentMetrics
    );

    // Calculate overall confidence score
    const confidenceScore = this.calculateConfidenceScore(
      player.stats,
      recentMetrics,
      insights
    );

    return {
      summary: this.generateSummary(player, recentMetrics, roleRecommendations),
      strengths: this.identifyStrengths(player.stats, recentMetrics),
      roleRecommendations,
      progressTrend: {
        startDate: new Date(
          Date.now() - 28 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate: new Date().toISOString(),
        metrics: recentMetrics,
      },
      confidenceScore,
      insights: this.filterSignificantInsights(insights),
    };
  }

  private static calculateRecentMetrics(
    drillHistory: Array<{
      date: string;
      performance: number;
      metrics: Partial<PlayerStats>;
    }>
  ) {
    const metrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: 'up' | 'down' | 'stable';
      changePercent: number;
    }> = [];

    // Group metrics by type
    const metricGroups = new Map<keyof PlayerStats, number[]>();

    drillHistory.forEach(session => {
      Object.entries(session.metrics).forEach(([metric, value]) => {
        if (!metricGroups.has(metric as keyof PlayerStats)) {
          metricGroups.set(metric as keyof PlayerStats, []);
        }
        metricGroups.get(metric as keyof PlayerStats)?.push(value);
      });
    });

    // Calculate trends for each metric
    metricGroups.forEach((values, name) => {
      const trend = this.calculateTrend(values);
      const changePercent = this.calculateChangePercent(values);

      metrics.push({
        name: name as keyof PlayerStats,
        values,
        trend,
        changePercent,
      });
    });

    return metrics;
  }

  private static generateRoleRecommendations(
    currentStats: PlayerStats,
    recentMetrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: 'up' | 'down' | 'stable';
      changePercent: number;
    }>
  ) {
    const recommendations: Array<{
      role: string;
      confidence: number;
      reasoning: string;
      fitScore: number;
    }> = [];

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

  private static calculateConfidenceScore(
    stats: PlayerStats,
    recentMetrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: string;
      changePercent: number;
    }>,
    insights: PlayerInsight[]
  ): number {
    // Mock confidence calculation
    // In a real implementation, this would use more sophisticated analysis
    const baseScore = 7.5;
    const trendBonus = recentMetrics.filter(m => m.trend === 'up').length * 0.2;
    const insightBonus =
      insights.filter(i => i.significance > 0.7).length * 0.1;

    return Math.min(10, baseScore + trendBonus + insightBonus);
  }

  private static generateSummary(
    player: ScoutPlayer,
    recentMetrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: string;
      changePercent: number;
    }>,
    roleRecommendations: Array<{
      role: string;
      confidence: number;
      reasoning: string;
      fitScore: number;
    }>
  ): string {
    const improvements = recentMetrics
      .filter(m => m.trend === 'up' && m.changePercent > 10)
      .map(m => m.name)
      .join(', ');

    const topRole = roleRecommendations[0];

    return `${player.firstName} ${player.lastName} shows strong potential as a ${
      topRole.role
    } with consistent improvement in ${improvements}. Recent performance data indicates a clear upward trajectory in key metrics, suggesting readiness for higher-level competition.`;
  }

  private static identifyStrengths(
    stats: PlayerStats,
    recentMetrics: Array<{
      name: keyof PlayerStats;
      values: number[];
      trend: string;
      changePercent: number;
    }>
  ) {
    return Object.entries(stats)
      .filter(([_, value]) => value > 75)
      .map(([key, value]) => ({
        attribute: key,
        description: `Exceptional ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        confidence: value / 100,
      }))
      .slice(0, 5);
  }

  private static filterSignificantInsights(insights: PlayerInsight[]) {
    return insights
      .filter(insight => insight.significance > 0.5)
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 10);
  }

  private static calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const change = values[values.length - 1] - values[0];
    if (Math.abs(change) < values[0] * 0.05) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private static calculateChangePercent(values: number[]): number {
    if (values.length < 2) return 0;

    const initial = values[0];
    const final = values[values.length - 1];
    return ((final - initial) / initial) * 100;
  }
}
