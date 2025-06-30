/**
 * @fileoverview Decentralized Chapter Deployment System
 * Enables autonomous community chapters with onboarding automation
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for community-driven expansion while ensuring quality standards.
 */

import { ChapterConfig, ChapterMetrics, OnboardingFlow } from './types';
import { ChapterDeployer } from './deployer';
import { OnboardingGenerator } from './onboarding';
import { ChapterAnalytics } from './analytics';

export class ChapterManager {
  private deployer: ChapterDeployer;
  private onboarding: OnboardingGenerator;
  private analytics: ChapterAnalytics;

  constructor() {
    this.deployer = new ChapterDeployer();
    this.onboarding = new OnboardingGenerator();
    this.analytics = new ChapterAnalytics();
  }

  async createChapter(config: ChapterConfig): Promise<string> {
    const chapterId = await this.deployer.deploy(config);
    await this.onboarding.generateScripts(chapterId, config);
    await this.analytics.trackCreation(chapterId, config);
    return chapterId;
  }

  async getChapterMetrics(chapterId: string): Promise<ChapterMetrics> {
    return this.analytics.getMetrics(chapterId);
  }

  async generateOnboardingScript(chapterId: string): Promise<string> {
    return this.onboarding.generateScripts(chapterId);
  }
}

export * from './types';
export * from './deployer';
export * from './onboarding';
export * from './analytics'; 