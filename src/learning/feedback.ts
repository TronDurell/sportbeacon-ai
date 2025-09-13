/* SportBeaconAI - Feedback Processing System
   Normalizes and processes feedback events for learning and admin queues
*/

import { Timestamp } from 'firebase/firestore';
import { ID, FeedbackEvent, FeedbackType, AdminQueueItem, QueueType } from '../domain/types';
import { athleteMemoryStore } from './memory';

// ============================================================================
// FEEDBACK PROCESSING INTERFACES
// ============================================================================

export interface FeedbackProcessingResult {
  success: boolean;
  feedbackEvent: FeedbackEvent;
  adminQueueItems: AdminQueueItem[];
  memoryUpdates: MemoryUpdate[];
  errors: string[];
}

export interface MemoryUpdate {
  athleteId: ID;
  field: string;
  oldValue: any;
  newValue: any;
  confidence: number;
  source: string;
}

export interface FeedbackNormalizationRules {
  type: FeedbackType;
  requiredFields: string[];
  validationRules: Array<{
    field: string;
    validator: (value: any) => boolean;
    errorMessage: string;
  }>;
  adminQueueMapping: QueueType;
  memoryUpdateFields: string[];
}

// ============================================================================
// FEEDBACK PROCESSOR CLASS
// ============================================================================

export class FeedbackProcessor {
  private normalizationRules: Map<FeedbackType, FeedbackNormalizationRules>;

  constructor() {
    this.normalizationRules = new Map();
    this.initializeNormalizationRules();
  }

  // ============================================================================
  // CORE PROCESSING METHODS
  // ============================================================================

  async processFeedback(feedbackData: Partial<FeedbackEvent>): Promise<FeedbackProcessingResult> {
    const result: FeedbackProcessingResult = {
      success: false,
      feedbackEvent: {} as FeedbackEvent,
      adminQueueItems: [],
      memoryUpdates: [],
      errors: []
    };

    try {
      // Normalize feedback data
      const normalizedFeedback = await this.normalizeFeedback(feedbackData);
      result.feedbackEvent = normalizedFeedback;

      // Generate admin queue items
      result.adminQueueItems = await this.generateAdminQueueItems(normalizedFeedback);

      // Update athlete memory
      result.memoryUpdates = await this.updateAthleteMemory(normalizedFeedback);

      // Create admin queue items in Firestore (TODO: implement)
      // await this.createAdminQueueItems(result.adminQueueItems);

      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async normalizeFeedback(feedbackData: Partial<FeedbackEvent>): Promise<FeedbackEvent> {
    const type = feedbackData.type;
    if (!type) {
      throw new Error('Feedback type is required');
    }

    const rules = this.normalizationRules.get(type);
    if (!rules) {
      throw new Error(`Unknown feedback type: ${type}`);
    }

    // Validate required fields
    for (const field of rules.requiredFields) {
      if (!feedbackData[field as keyof FeedbackEvent]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Apply validation rules
    for (const rule of rules.validationRules) {
      const value = feedbackData[rule.field as keyof FeedbackEvent];
      if (!rule.validator(value)) {
        throw new Error(rule.errorMessage);
      }
    }

    // Create normalized feedback event
    const now = new Date();
    const feedbackEvent: FeedbackEvent = {
      id: feedbackData.id || this.generateId(),
      athleteId: feedbackData.athleteId!,
      type: feedbackData.type!,
      submittedBy: feedbackData.submittedBy!,
      submittedAt: feedbackData.submittedAt || Timestamp.fromDate(now),
      targetType: feedbackData.targetType!,
      targetId: feedbackData.targetId!,
      description: feedbackData.description!,
      priority: feedbackData.priority || this.determinePriority(feedbackData.type!),
      status: feedbackData.status || 'pending',
      resolvedBy: feedbackData.resolvedBy,
      resolvedAt: feedbackData.resolvedAt,
      resolution: feedbackData.resolution,
      metadata: feedbackData.metadata || {}
    };

    return feedbackEvent;
  }

  async generateAdminQueueItems(feedbackEvent: FeedbackEvent): Promise<AdminQueueItem[]> {
    const rules = this.normalizationRules.get(feedbackEvent.type);
    if (!rules) {
      return [];
    }

    const queueType = rules.adminQueueMapping;
    const queueItem: AdminQueueItem = {
      id: this.generateId(),
      queueType,
      priority: feedbackEvent.priority,
      status: 'pending',
      targetType: feedbackEvent.targetType,
      targetId: feedbackEvent.targetId,
      athleteId: feedbackEvent.athleteId,
      title: this.generateQueueTitle(feedbackEvent),
      description: feedbackEvent.description,
      submittedBy: feedbackEvent.submittedBy,
      submittedAt: feedbackEvent.submittedAt,
      tags: this.generateQueueTags(feedbackEvent),
      metadata: {
        feedbackEventId: feedbackEvent.id,
        originalFeedback: feedbackEvent
      }
    };

    return [queueItem];
  }

  async updateAthleteMemory(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const rules = this.normalizationRules.get(feedbackEvent.type);

    if (!rules || !rules.memoryUpdateFields.length) {
      return updates;
    }

    try {
      const athleteId = feedbackEvent.athleteId;

      // Process different feedback types
      switch (feedbackEvent.type) {
        case 'CORRECTION':
          updates.push(...await this.processCorrectionFeedback(feedbackEvent));
          break;
        
        case 'MERGE':
          updates.push(...await this.processMergeFeedback(feedbackEvent));
          break;
        
        case 'DUPLICATE':
          updates.push(...await this.processDuplicateFeedback(feedbackEvent));
          break;
        
        case 'DISPUTE':
          updates.push(...await this.processDisputeFeedback(feedbackEvent));
          break;
        
        case 'SUGGESTION':
          updates.push(...await this.processSuggestionFeedback(feedbackEvent));
          break;
        
        case 'APPROVAL':
          updates.push(...await this.processApprovalFeedback(feedbackEvent));
          break;
      }

      // Record feedback in athlete memory
      await athleteMemoryStore.recordFeedbackProvided(
        athleteId,
        feedbackEvent.type,
        this.determineFeedbackResponse(feedbackEvent)
      );

    } catch (error) {
      console.error('Failed to update athlete memory:', error);
    }

    return updates;
  }

  // ============================================================================
  // FEEDBACK TYPE PROCESSORS
  // ============================================================================

  private async processCorrectionFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    if (metadata.correctedField && metadata.correctedValue) {
      // Update athlete preferences based on correction
      const field = metadata.correctedField as string;
      const newValue = metadata.correctedValue;

      if (field.startsWith('preferences.')) {
        const prefField = field.replace('preferences.', '');
        await athleteMemoryStore.updatePreferences(athleteId, {
          [prefField]: newValue
        }, 'correction-feedback');

        updates.push({
          athleteId,
          field: `preferences.${prefField}`,
          oldValue: metadata.oldValue,
          newValue,
          confidence: 0.9,
          source: 'correction-feedback'
        });
      }
    }

    return updates;
  }

  private async processMergeFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    if (metadata.mergeTarget && metadata.mergeData) {
      // Update athlete history with merged data
      const mergeData = metadata.mergeData;
      
      if (mergeData.schools) {
        await athleteMemoryStore.updateHistory(athleteId, {
          schoolsAttended: mergeData.schools
        }, 'merge-feedback');
      }

      if (mergeData.teams) {
        await athleteMemoryStore.updateHistory(athleteId, {
          teamsPlayed: mergeData.teams
        }, 'merge-feedback');
      }

      updates.push({
        athleteId,
        field: 'history.merged',
        oldValue: null,
        newValue: mergeData,
        confidence: 0.8,
        source: 'merge-feedback'
      });
    }

    return updates;
  }

  private async processDuplicateFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    // Record duplicate detection pattern
    await athleteMemoryStore.updatePatterns(athleteId, {
      improvementAreas: ['duplicate-detection']
    }, 'duplicate-feedback');

    updates.push({
      athleteId,
      field: 'patterns.duplicate-detection',
      oldValue: false,
      newValue: true,
      confidence: 0.7,
      source: 'duplicate-feedback'
    });

    return updates;
  }

  private async processDisputeFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    // Update dispute rate pattern
    const currentMemory = await athleteMemoryStore.getAthleteMemory(athleteId);
    if (currentMemory) {
      const newDisputeRate = Math.min(
        currentMemory.patterns.disputeRate + 0.1,
        1.0
      );

      await athleteMemoryStore.updatePatterns(athleteId, {
        disputeRate: newDisputeRate
      }, 'dispute-feedback');

      updates.push({
        athleteId,
        field: 'patterns.disputeRate',
        oldValue: currentMemory.patterns.disputeRate,
        newValue: newDisputeRate,
        confidence: 0.8,
        source: 'dispute-feedback'
      });
    }

    return updates;
  }

  private async processSuggestionFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    if (metadata.suggestion && metadata.suggestionType) {
      // Record suggestion for future learning
      const suggestionType = metadata.suggestionType as string;
      
      await athleteMemoryStore.updatePatterns(athleteId, {
        preferredLearningMethods: [suggestionType]
      }, 'suggestion-feedback');

      updates.push({
        athleteId,
        field: 'patterns.suggestions',
        oldValue: null,
        newValue: metadata.suggestion,
        confidence: 0.6,
        source: 'suggestion-feedback'
      });
    }

    return updates;
  }

  private async processApprovalFeedback(feedbackEvent: FeedbackEvent): Promise<MemoryUpdate[]> {
    const updates: MemoryUpdate[] = [];
    const { athleteId, metadata } = feedbackEvent;

    // Update verification success rate
    const currentMemory = await athleteMemoryStore.getAthleteMemory(athleteId);
    if (currentMemory) {
      const newSuccessRate = Math.min(
        currentMemory.patterns.verificationSuccessRate + 0.1,
        1.0
      );

      await athleteMemoryStore.updatePatterns(athleteId, {
        verificationSuccessRate: newSuccessRate
      }, 'approval-feedback');

      updates.push({
        athleteId,
        field: 'patterns.verificationSuccessRate',
        oldValue: currentMemory.patterns.verificationSuccessRate,
        newValue: newSuccessRate,
        confidence: 0.9,
        source: 'approval-feedback'
      });
    }

    return updates;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private initializeNormalizationRules(): void {
    // CORRECTION feedback rules
    this.normalizationRules.set('CORRECTION', {
      type: 'CORRECTION',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId', 'description'],
      validationRules: [
        {
          field: 'description',
          validator: (value) => typeof value === 'string' && value.length > 10,
          errorMessage: 'Description must be at least 10 characters'
        }
      ],
      adminQueueMapping: 'verification',
      memoryUpdateFields: ['preferences', 'history']
    });

    // MERGE feedback rules
    this.normalizationRules.set('MERGE', {
      type: 'MERGE',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId', 'description'],
      validationRules: [
        {
          field: 'metadata.mergeTarget',
          validator: (value) => typeof value === 'string' && value.length > 0,
          errorMessage: 'Merge target is required'
        }
      ],
      adminQueueMapping: 'merge',
      memoryUpdateFields: ['history']
    });

    // DUPLICATE feedback rules
    this.normalizationRules.set('DUPLICATE', {
      type: 'DUPLICATE',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId', 'description'],
      validationRules: [
        {
          field: 'metadata.duplicateId',
          validator: (value) => typeof value === 'string' && value.length > 0,
          errorMessage: 'Duplicate ID is required'
        }
      ],
      adminQueueMapping: 'duplicate',
      memoryUpdateFields: ['patterns']
    });

    // DISPUTE feedback rules
    this.normalizationRules.set('DISPUTE', {
      type: 'DISPUTE',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId', 'description'],
      validationRules: [
        {
          field: 'description',
          validator: (value) => typeof value === 'string' && value.length > 20,
          errorMessage: 'Dispute description must be at least 20 characters'
        }
      ],
      adminQueueMapping: 'dispute',
      memoryUpdateFields: ['patterns']
    });

    // SUGGESTION feedback rules
    this.normalizationRules.set('SUGGESTION', {
      type: 'SUGGESTION',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId', 'description'],
      validationRules: [
        {
          field: 'metadata.suggestion',
          validator: (value) => typeof value === 'string' && value.length > 0,
          errorMessage: 'Suggestion content is required'
        }
      ],
      adminQueueMapping: 'verification',
      memoryUpdateFields: ['patterns']
    });

    // APPROVAL feedback rules
    this.normalizationRules.set('APPROVAL', {
      type: 'APPROVAL',
      requiredFields: ['athleteId', 'submittedBy', 'targetType', 'targetId'],
      validationRules: [
        {
          field: 'metadata.approvedItem',
          validator: (value) => typeof value === 'string' && value.length > 0,
          errorMessage: 'Approved item is required'
        }
      ],
      adminQueueMapping: 'verification',
      memoryUpdateFields: ['patterns']
    });
  }

  private determinePriority(type: FeedbackType): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'DISPUTE':
      case 'DUPLICATE':
        return 'high';
      case 'CORRECTION':
      case 'MERGE':
        return 'medium';
      case 'SUGGESTION':
      case 'APPROVAL':
        return 'low';
      default:
        return 'medium';
    }
  }

  private generateQueueTitle(feedbackEvent: FeedbackEvent): string {
    switch (feedbackEvent.type) {
      case 'CORRECTION':
        return `Correction Request: ${feedbackEvent.targetType}`;
      case 'MERGE':
        return `Merge Request: ${feedbackEvent.targetType}`;
      case 'DUPLICATE':
        return `Duplicate Detection: ${feedbackEvent.targetType}`;
      case 'DISPUTE':
        return `Dispute: ${feedbackEvent.targetType}`;
      case 'SUGGESTION':
        return `Suggestion: ${feedbackEvent.targetType}`;
      case 'APPROVAL':
        return `Approval: ${feedbackEvent.targetType}`;
      default:
        return `Feedback: ${feedbackEvent.type}`;
    }
  }

  private generateQueueTags(feedbackEvent: FeedbackEvent): string[] {
    const tags = [feedbackEvent.type.toLowerCase(), feedbackEvent.targetType.toLowerCase()];
    
    if (feedbackEvent.priority) {
      tags.push(feedbackEvent.priority);
    }

    if (feedbackEvent.metadata?.sport) {
      tags.push(feedbackEvent.metadata.sport);
    }

    return tags;
  }

  private determineFeedbackResponse(feedbackEvent: FeedbackEvent): 'accept' | 'question' | 'dispute' {
    switch (feedbackEvent.type) {
      case 'APPROVAL':
      case 'SUGGESTION':
        return 'accept';
      case 'DISPUTE':
        return 'dispute';
      case 'CORRECTION':
      case 'MERGE':
      case 'DUPLICATE':
        return 'question';
      default:
        return 'question';
    }
  }

  private generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const feedbackProcessor = new FeedbackProcessor();
