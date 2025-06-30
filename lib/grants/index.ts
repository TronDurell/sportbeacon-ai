/**
 * @fileoverview GrantFinderAI System
 * Automates grant discovery, application drafting, and deadline tracking
 * 
 * Executive Leadership Clause: This module maintains founder vision
 * for sustainable funding while ensuring compliance and transparency.
 */

import { GrantFinderAI } from './grantFinder';
import { ApplicationDraftService } from './applicationDraft';
import { DeadlineTracker } from './deadlineTracker';
import { GrantConfig, GrantOpportunity, ApplicationDraft } from './types';

export class GrantSystem {
  private finder: GrantFinderAI;
  private draftService: ApplicationDraftService;
  private deadlineTracker: DeadlineTracker;

  constructor() {
    this.finder = new GrantFinderAI();
    this.draftService = new ApplicationDraftService();
    this.deadlineTracker = new DeadlineTracker();
  }

  async findGrants(criteria: GrantConfig): Promise<GrantOpportunity[]> {
    return this.finder.findGrants(criteria);
  }

  async generateApplicationDraft(grantId: string, organizationData: any): Promise<ApplicationDraft> {
    return this.draftService.generateDraft(grantId, organizationData);
  }

  async trackDeadlines(): Promise<any[]> {
    return this.deadlineTracker.getUpcomingDeadlines();
  }

  async subscribeToGrant(grantId: string, userId: string): Promise<void> {
    await this.deadlineTracker.subscribe(grantId, userId);
  }
}

export * from './types';
export * from './grantFinder';
export * from './applicationDraft';
export * from './deadlineTracker'; 