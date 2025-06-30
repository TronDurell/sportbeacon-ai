import { CivicInitiative, ImpactMetrics, InitiativeStatus } from './types';
import { analytics } from '../ai/shared/analytics';

export class ImpactTracker {
  private initiatives: Map<string, CivicInitiative> = new Map();
  private impactData: Map<string, ImpactMetrics[]> = new Map(); // initiativeId -> impact history

  async track(initiativeId: string, data: any): Promise<void> {
    try {
      const initiative = this.initiatives.get(initiativeId);
      if (!initiative) {
        throw new Error(`Initiative not found: ${initiativeId}`);
      }

      // Update impact metrics
      const impactMetrics: ImpactMetrics = {
        participants: data.participants || 0,
        reach: data.reach || 0,
        satisfaction: data.satisfaction || 0,
        outcomes: data.outcomes || {},
        costEffectiveness: data.costEffectiveness || 0,
        sustainability: data.sustainability || 0
      };

      if (!this.impactData.has(initiativeId)) {
        this.impactData.set(initiativeId, []);
      }

      this.impactData.get(initiativeId)!.push(impactMetrics);

      // Update initiative status if needed
      await this.updateInitiativeStatus(initiativeId, impactMetrics);

      await analytics.track('initiative_impact_tracked', {
        initiativeId,
        participants: impactMetrics.participants,
        reach: impactMetrics.reach,
        satisfaction: impactMetrics.satisfaction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('initiative_impact_tracking_failed', {
        initiativeId,
        error: error.message
      });
      throw error;
    }
  }

  async getInitiativeImpact(initiativeId: string): Promise<ImpactMetrics[]> {
    const impactHistory = this.impactData.get(initiativeId) || [];
    
    await analytics.track('initiative_impact_accessed', {
      initiativeId,
      dataPoints: impactHistory.length,
      timestamp: new Date().toISOString()
    });

    return impactHistory;
  }

  async createInitiative(initiative: Omit<CivicInitiative, 'id'>): Promise<string> {
    try {
      const initiativeId = this.generateInitiativeId();
      
      const newInitiative: CivicInitiative = {
        ...initiative,
        id: initiativeId,
        status: 'planning',
        impact: {
          participants: 0,
          reach: 0,
          satisfaction: 0,
          outcomes: {},
          costEffectiveness: 0,
          sustainability: 0
        }
      };

      this.initiatives.set(initiativeId, newInitiative);

      await analytics.track('initiative_created', {
        initiativeId,
        name: newInitiative.name,
        category: newInitiative.category,
        budget: newInitiative.budget,
        timestamp: new Date().toISOString()
      });

      return initiativeId;
    } catch (error) {
      await analytics.track('initiative_creation_failed', {
        error: error.message
      });
      throw error;
    }
  }

  async updateInitiativeStatus(initiativeId: string, impactMetrics: ImpactMetrics): Promise<void> {
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) {
      throw new Error(`Initiative not found: ${initiativeId}`);
    }

    // Update initiative impact
    initiative.impact = impactMetrics;

    // Determine status based on timeline and impact
    const now = new Date();
    const isCompleted = now > initiative.timeline.end;
    const hasSignificantImpact = impactMetrics.participants > 100 && impactMetrics.satisfaction > 3.5;

    if (isCompleted) {
      initiative.status = hasSignificantImpact ? 'evaluated' : 'completed';
    } else if (now >= initiative.timeline.start) {
      initiative.status = 'active';
    }

    await analytics.track('initiative_status_updated', {
      initiativeId,
      newStatus: initiative.status,
      timestamp: new Date().toISOString()
    });
  }

  async getInitiative(initiativeId: string): Promise<CivicInitiative | null> {
    const initiative = this.initiatives.get(initiativeId);
    
    if (initiative) {
      await analytics.track('initiative_accessed', {
        initiativeId,
        status: initiative.status,
        timestamp: new Date().toISOString()
      });
    }

    return initiative || null;
  }

  async getActiveInitiatives(): Promise<CivicInitiative[]> {
    const activeInitiatives = Array.from(this.initiatives.values())
      .filter(initiative => initiative.status === 'active')
      .sort((a, b) => b.timeline.start.getTime() - a.timeline.start.getTime());

    await analytics.track('active_initiatives_accessed', {
      count: activeInitiatives.length,
      timestamp: new Date().toISOString()
    });

    return activeInitiatives;
  }

  async getInitiativeAnalytics(): Promise<any> {
    const initiatives = Array.from(this.initiatives.values());
    
    const analytics = {
      totalInitiatives: initiatives.length,
      byStatus: {} as Record<InitiativeStatus, number>,
      byCategory: {} as Record<string, number>,
      totalBudget: 0,
      averageImpact: {
        participants: 0,
        satisfaction: 0,
        costEffectiveness: 0
      },
      topPerformers: [] as CivicInitiative[]
    };

    // Count by status and category
    for (const initiative of initiatives) {
      analytics.byStatus[initiative.status] = (analytics.byStatus[initiative.status] || 0) + 1;
      analytics.byCategory[initiative.category] = (analytics.byCategory[initiative.category] || 0) + 1;
      analytics.totalBudget += initiative.budget;
    }

    // Calculate average impact
    const completedInitiatives = initiatives.filter(i => i.status === 'completed' || i.status === 'evaluated');
    if (completedInitiatives.length > 0) {
      analytics.averageImpact.participants = completedInitiatives.reduce((sum, i) => sum + i.impact.participants, 0) / completedInitiatives.length;
      analytics.averageImpact.satisfaction = completedInitiatives.reduce((sum, i) => sum + i.impact.satisfaction, 0) / completedInitiatives.length;
      analytics.averageImpact.costEffectiveness = completedInitiatives.reduce((sum, i) => sum + i.impact.costEffectiveness, 0) / completedInitiatives.length;
    }

    // Top performers (by satisfaction and participants)
    analytics.topPerformers = completedInitiatives
      .sort((a, b) => {
        const aScore = a.impact.satisfaction * a.impact.participants;
        const bScore = b.impact.satisfaction * b.impact.participants;
        return bScore - aScore;
      })
      .slice(0, 5);

    return analytics;
  }

  async generateImpactReport(initiativeId: string): Promise<any> {
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) {
      throw new Error(`Initiative not found: ${initiativeId}`);
    }

    const impactHistory = this.impactData.get(initiativeId) || [];
    
    const report = {
      initiativeId,
      name: initiative.name,
      category: initiative.category,
      status: initiative.status,
      timeline: initiative.timeline,
      budget: initiative.budget,
      currentImpact: initiative.impact,
      impactHistory,
      trends: this.analyzeTrends(impactHistory),
      recommendations: this.generateRecommendations(initiative, impactHistory)
    };

    await analytics.track('impact_report_generated', {
      initiativeId,
      reportGenerated: true,
      timestamp: new Date().toISOString()
    });

    return report;
  }

  private analyzeTrends(impactHistory: ImpactMetrics[]): any {
    if (impactHistory.length < 2) {
      return { message: 'Insufficient data for trend analysis' };
    }

    const trends = {
      participants: this.calculateTrend(impactHistory.map(h => h.participants)),
      satisfaction: this.calculateTrend(impactHistory.map(h => h.satisfaction)),
      reach: this.calculateTrend(impactHistory.map(h => h.reach)),
      costEffectiveness: this.calculateTrend(impactHistory.map(h => h.costEffectiveness))
    };

    return trends;
  }

  private calculateTrend(values: number[]): any {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope,
      intercept,
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      prediction: intercept + slope * n
    };
  }

  private generateRecommendations(initiative: CivicInitiative, impactHistory: ImpactMetrics[]): string[] {
    const recommendations = [];

    if (initiative.impact.satisfaction < 3.5) {
      recommendations.push('Focus on improving participant satisfaction through better program design');
    }

    if (initiative.impact.participants < 50) {
      recommendations.push('Increase outreach and marketing efforts to boost participation');
    }

    if (initiative.impact.costEffectiveness < 0.7) {
      recommendations.push('Optimize resource allocation to improve cost-effectiveness');
    }

    if (initiative.impact.sustainability < 0.6) {
      recommendations.push('Develop long-term sustainability strategies for continued impact');
    }

    return recommendations;
  }

  private generateInitiativeId(): string {
    return `initiative-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
} 