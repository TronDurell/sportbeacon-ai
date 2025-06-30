import { CityMetrics, CivicConfig } from './types';
import { analytics } from '../ai/shared/analytics';

export class CivicScorecard {
  private cityMetrics: Map<string, CityMetrics> = new Map();
  private config: CivicConfig;

  constructor(config?: CivicConfig) {
    this.config = config || {
      metricsEnabled: true,
      realTimeTracking: true,
      publicReporting: true,
      stakeholderNotifications: true
    };
    this.initializeCityMetrics();
  }

  async getMetrics(cityId: string): Promise<CityMetrics> {
    try {
      const metrics = this.cityMetrics.get(cityId);
      
      if (!metrics) {
        throw new Error(`Metrics not found for city: ${cityId}`);
      }

      // Update metrics if real-time tracking is enabled
      if (this.config.realTimeTracking) {
        await this.updateMetrics(cityId);
      }

      await analytics.track('city_metrics_accessed', {
        cityId,
        metricsEnabled: this.config.metricsEnabled,
        timestamp: new Date().toISOString()
      });

      return metrics;
    } catch (error) {
      await analytics.track('city_metrics_access_failed', {
        cityId,
        error: error.message
      });
      throw error;
    }
  }

  async updateMetrics(cityId: string): Promise<void> {
    try {
      const metrics = this.cityMetrics.get(cityId);
      if (!metrics) {
        throw new Error(`City not found: ${cityId}`);
      }

      // Update various metrics
      await this.updateSportsParticipation(cityId);
      await this.updateFacilities(cityId);
      await this.updatePrograms(cityId);
      await this.updateEconomicMetrics(cityId);
      await this.updateHealthMetrics(cityId);
      await this.updateSocialMetrics(cityId);
      await this.updateEnvironmentalMetrics(cityId);
      await this.updateTechnologyMetrics(cityId);

      // Recalculate overall score
      const updatedMetrics = this.cityMetrics.get(cityId)!;
      updatedMetrics.overallScore = this.calculateOverallScore(updatedMetrics);
      updatedMetrics.lastUpdated = new Date();

      await analytics.track('city_metrics_updated', {
        cityId,
        overallScore: updatedMetrics.overallScore,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await analytics.track('city_metrics_update_failed', {
        cityId,
        error: error.message
      });
      throw error;
    }
  }

  private async updateSportsParticipation(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate real-time updates
    metrics.sportsParticipation.youth += Math.random() * 2 - 1;
    metrics.sportsParticipation.adult += Math.random() * 2 - 1;
    metrics.sportsParticipation.senior += Math.random() * 2 - 1;

    // Ensure values stay within reasonable bounds
    metrics.sportsParticipation.youth = Math.max(0, Math.min(100, metrics.sportsParticipation.youth));
    metrics.sportsParticipation.adult = Math.max(0, Math.min(100, metrics.sportsParticipation.adult));
    metrics.sportsParticipation.senior = Math.max(0, Math.min(100, metrics.sportsParticipation.senior));
  }

  private async updateFacilities(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate facility improvements
    metrics.facilities.utilization += Math.random() * 5 - 2.5;
    metrics.facilities.utilization = Math.max(0, Math.min(100, metrics.facilities.utilization));
  }

  private async updatePrograms(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate program improvements
    metrics.programs.satisfaction += Math.random() * 0.5 - 0.25;
    metrics.programs.satisfaction = Math.max(1, Math.min(5, metrics.programs.satisfaction));
  }

  private async updateEconomicMetrics(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate economic growth
    const growthRate = 0.02 + Math.random() * 0.06; // 2-8% growth
    metrics.economic.sportsRevenue *= (1 + growthRate);
    metrics.economic.jobsCreated += Math.floor(Math.random() * 10);
  }

  private async updateHealthMetrics(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate health improvements
    metrics.health.obesityRate -= Math.random() * 0.5;
    metrics.health.obesityRate = Math.max(0, metrics.health.obesityRate);
    
    metrics.health.physicalActivity += Math.random() * 2 - 1;
    metrics.health.physicalActivity = Math.max(0, Math.min(100, metrics.health.physicalActivity));
  }

  private async updateSocialMetrics(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate social improvements
    metrics.social.communityEngagement += Math.random() * 3 - 1.5;
    metrics.social.communityEngagement = Math.max(0, Math.min(100, metrics.social.communityEngagement));
    
    metrics.social.crimeReduction += Math.random() * 2 - 1;
    metrics.social.crimeReduction = Math.max(0, Math.min(100, metrics.social.crimeReduction));
  }

  private async updateEnvironmentalMetrics(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate environmental improvements
    metrics.environmental.carbonFootprint -= Math.random() * 2;
    metrics.environmental.carbonFootprint = Math.max(0, metrics.environmental.carbonFootprint);
    
    metrics.environmental.sustainabilityScore += Math.random() * 0.5 - 0.25;
    metrics.environmental.sustainabilityScore = Math.max(0, Math.min(10, metrics.environmental.sustainabilityScore));
  }

  private async updateTechnologyMetrics(cityId: string): Promise<void> {
    const metrics = this.cityMetrics.get(cityId)!;
    
    // Simulate technology adoption
    metrics.technology.digitalAdoption += Math.random() * 3 - 1.5;
    metrics.technology.digitalAdoption = Math.max(0, Math.min(100, metrics.technology.digitalAdoption));
    
    metrics.technology.innovationIndex += Math.random() * 0.5 - 0.25;
    metrics.technology.innovationIndex = Math.max(0, Math.min(10, metrics.technology.innovationIndex));
  }

  private calculateOverallScore(metrics: CityMetrics): number {
    const weights = {
      sportsParticipation: 0.15,
      facilities: 0.12,
      programs: 0.12,
      economic: 0.12,
      health: 0.15,
      social: 0.12,
      environmental: 0.10,
      technology: 0.12
    };

    const scores = {
      sportsParticipation: (metrics.sportsParticipation.youth + metrics.sportsParticipation.adult + metrics.sportsParticipation.senior) / 3,
      facilities: metrics.facilities.utilization,
      programs: (metrics.programs.satisfaction / 5) * 100,
      economic: Math.min((metrics.economic.sportsRevenue / 1000000) * 10, 100), // Normalize to 100
      health: (100 - metrics.health.obesityRate) * 0.5 + metrics.health.physicalActivity * 0.5,
      social: (metrics.social.communityEngagement + metrics.social.crimeReduction) / 2,
      environmental: (metrics.environmental.sustainabilityScore / 10) * 100,
      technology: (metrics.technology.digitalAdoption + (metrics.technology.innovationIndex / 10) * 100) / 2
    };

    let overallScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      overallScore += scores[category as keyof typeof scores] * weight;
    }

    return Math.round(overallScore);
  }

  private initializeCityMetrics(): void {
    // Mock city data
    const cities = [
      {
        id: 'cary-nc',
        name: 'Cary, NC',
        population: 180000
      },
      {
        id: 'raleigh-nc',
        name: 'Raleigh, NC',
        population: 480000
      },
      {
        id: 'durham-nc',
        name: 'Durham, NC',
        population: 280000
      }
    ];

    for (const city of cities) {
      const metrics: CityMetrics = {
        cityId: city.id,
        name: city.name,
        population: city.population,
        sportsParticipation: {
          youth: 65 + Math.random() * 20,
          adult: 45 + Math.random() * 20,
          senior: 25 + Math.random() * 15
        },
        facilities: {
          total: Math.floor(50 + Math.random() * 100),
          accessible: Math.floor(40 + Math.random() * 80),
          maintained: Math.floor(45 + Math.random() * 90),
          utilization: 60 + Math.random() * 30
        },
        programs: {
          active: Math.floor(20 + Math.random() * 50),
          participants: Math.floor(1000 + Math.random() * 5000),
          satisfaction: 3.5 + Math.random() * 1.5
        },
        economic: {
          sportsRevenue: 5000000 + Math.random() * 10000000,
          jobsCreated: Math.floor(100 + Math.random() * 500),
          tourismImpact: 2000000 + Math.random() * 5000000
        },
        health: {
          obesityRate: 20 + Math.random() * 15,
          physicalActivity: 60 + Math.random() * 30,
          mentalHealth: 7 + Math.random() * 2
        },
        social: {
          communityEngagement: 70 + Math.random() * 25,
          crimeReduction: 15 + Math.random() * 20,
          socialCohesion: 7.5 + Math.random() * 2
        },
        environmental: {
          greenSpaces: 500 + Math.random() * 1000,
          carbonFootprint: 10 + Math.random() * 20,
          sustainabilityScore: 6 + Math.random() * 3
        },
        technology: {
          digitalAdoption: 75 + Math.random() * 20,
          smartInfrastructure: 6 + Math.random() * 3,
          innovationIndex: 6.5 + Math.random() * 2.5
        },
        overallScore: 0,
        lastUpdated: new Date()
      };

      metrics.overallScore = this.calculateOverallScore(metrics);
      this.cityMetrics.set(city.id, metrics);
    }
  }

  async getCityRankings(): Promise<CityMetrics[]> {
    const cities = Array.from(this.cityMetrics.values())
      .sort((a, b) => b.overallScore - a.overallScore);

    await analytics.track('city_rankings_accessed', {
      citiesCount: cities.length,
      timestamp: new Date().toISOString()
    });

    return cities;
  }

  async getMetricTrends(cityId: string, metric: string, timeframe: string): Promise<any> {
    // Mock trend data
    const trends = {
      sportsParticipation: [65, 67, 69, 71, 73, 75],
      facilities: [60, 62, 65, 68, 70, 72],
      programs: [3.5, 3.6, 3.8, 4.0, 4.1, 4.2],
      economic: [5, 5.2, 5.5, 5.8, 6.0, 6.3],
      health: [70, 71, 72, 73, 74, 75],
      social: [70, 71, 72, 73, 74, 75],
      environmental: [6, 6.2, 6.5, 6.8, 7.0, 7.2],
      technology: [75, 76, 77, 78, 79, 80]
    };

    await analytics.track('metric_trends_accessed', {
      cityId,
      metric,
      timeframe,
      timestamp: new Date().toISOString()
    });

    return {
      cityId,
      metric,
      timeframe,
      values: trends[metric as keyof typeof trends] || [],
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    };
  }
} 