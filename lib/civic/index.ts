/**
 * @fileoverview CivicScorecard System
 * Smart city performance metrics and civic impact tracking
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for civic impact measurement while ensuring transparency and accountability.
 */

import { CivicScorecard } from './civicScorecard';
import { ImpactTracker } from './impactTracker';
import { CityAnalytics } from './cityAnalytics';
import { CivicConfig, CityMetrics, ImpactReport, CivicInitiative } from './types';

export class CivicSystem {
  private scorecard: CivicScorecard;
  private impactTracker: ImpactTracker;
  private cityAnalytics: CityAnalytics;

  constructor() {
    this.scorecard = new CivicScorecard();
    this.impactTracker = new ImpactTracker();
    this.cityAnalytics = new CityAnalytics();
  }

  async getCityMetrics(cityId: string): Promise<CityMetrics> {
    return this.scorecard.getMetrics(cityId);
  }

  async trackImpact(initiativeId: string, data: any): Promise<void> {
    await this.impactTracker.track(initiativeId, data);
  }

  async generateReport(cityId: string, timeframe: string): Promise<ImpactReport> {
    return this.cityAnalytics.generateReport(cityId, timeframe);
  }

  async launchInitiative(initiative: CivicInitiative): Promise<string> {
    // Create initiative in impact tracker first to get the ID
    const initiativeId = await this.impactTracker.createInitiative(initiative);
    
    // Then launch in city analytics with the same ID
    await this.cityAnalytics.launchInitiative({ ...initiative, id: initiativeId });
    
    return initiativeId;
  }
}

export * from './types';
export * from './civicScorecard';
export * from './impactTracker';
export * from './cityAnalytics'; 