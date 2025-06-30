/**
 * @fileoverview Mobile AI Studio
 * Youth video publishing platform with monetization badge system
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for youth empowerment through creative expression while ensuring safety.
 */

import { VideoStudio } from './videoStudio';
import { MonetizationEngine } from './monetization';
import { BadgeSystem } from './badgeSystem';
import { StudioConfig, VideoProject, MonetizationTier, CreatorBadge } from './types';

export class MobileAIStudio {
  private videoStudio: VideoStudio;
  private monetization: MonetizationEngine;
  private badgeSystem: BadgeSystem;

  constructor() {
    this.videoStudio = new VideoStudio();
    this.monetization = new MonetizationEngine();
    this.badgeSystem = new BadgeSystem();
  }

  async createVideoProject(userId: string, config: any): Promise<VideoProject> {
    return this.videoStudio.createProject(userId, config);
  }

  async addVideoAsset(projectId: string, asset: any): Promise<void> {
    return this.videoStudio.addAsset(projectId, asset);
  }

  async publishVideo(projectId: string): Promise<string> {
    return this.videoStudio.publish(projectId);
  }

  async getMonetizationTiers(userId: string): Promise<MonetizationTier[]> {
    return this.monetization.getTiers(userId);
  }

  async awardBadge(userId: string, badgeType: string): Promise<CreatorBadge> {
    return this.badgeSystem.awardBadge(userId, badgeType);
  }
}

export * from './types';
export * from './videoStudio';
export * from './monetization';
export * from './badgeSystem'; 