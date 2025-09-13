/* SportBeaconAI - SFT Dataset Builder
   Periodically materializes verified corrections into JSONL for future fine-tuning
*/

import { Timestamp } from 'firebase/firestore';
import { ID, FeedbackEvent, FeedbackType, Athlete, StatLine, Highlight } from '../domain/types';
import { athleteMemoryStore } from './memory';

// ============================================================================
// SFT DATASET INTERFACES
// ============================================================================

export interface SFTDatasetEntry {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  metadata: {
    athleteId: ID;
    feedbackType: FeedbackType;
    targetType: string;
    targetId: ID;
    timestamp: Date;
    confidence: number;
    verified: boolean;
  };
}

export interface DatasetExportOptions {
  startDate?: Date;
  endDate?: Date;
  feedbackTypes?: FeedbackType[];
  minConfidence?: number;
  verifiedOnly?: boolean;
  maxEntries?: number;
  outputFormat?: 'jsonl' | 'json' | 'csv';
}

export interface DatasetExportResult {
  success: boolean;
  entries: SFTDatasetEntry[];
  totalEntries: number;
  filteredEntries: number;
  exportPath?: string;
  errors: string[];
}

// ============================================================================
// SFT DATASET BUILDER CLASS
// ============================================================================

export class SFTDatasetBuilder {
  private readonly DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
  private readonly MAX_ENTRIES_PER_EXPORT = 10000;

  // ============================================================================
  // CORE DATASET BUILDING METHODS
  // ============================================================================

  async buildDataset(options: DatasetExportOptions = {}): Promise<DatasetExportResult> {
    const result: DatasetExportResult = {
      success: false,
      entries: [],
      totalEntries: 0,
      filteredEntries: 0,
      errors: []
    };

    try {
      // Get verified feedback events
      const feedbackEvents = await this.getVerifiedFeedbackEvents(options);
      result.totalEntries = feedbackEvents.length;

      // Filter events based on criteria
      const filteredEvents = this.filterFeedbackEvents(feedbackEvents, options);
      result.filteredEntries = filteredEvents.length;

      // Convert to SFT format
      const sftEntries = await this.convertToSFTFormat(filteredEvents);
      result.entries = sftEntries;

      // Export to file if requested
      if (options.outputFormat) {
        result.exportPath = await this.exportDataset(sftEntries, options);
      }

      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  async getVerifiedFeedbackEvents(options: DatasetExportOptions): Promise<FeedbackEvent[]> {
    // TODO: Implement actual Firestore query
    // This is a placeholder implementation
    const mockEvents: FeedbackEvent[] = [
      {
        id: 'feedback_1',
        athleteId: 'athlete_1',
        type: 'CORRECTION',
        submittedBy: 'coach_1',
        submittedAt: Timestamp.fromDate(new Date()),
        targetType: 'statLine',
        targetId: 'stat_1',
        description: 'Points should be 25, not 20',
        priority: 'medium',
        status: 'resolved',
        resolvedBy: 'admin_1',
        resolvedAt: Timestamp.fromDate(new Date()),
        resolution: 'Corrected points from 20 to 25',
        metadata: {
          correctedField: 'points',
          correctedValue: 25,
          oldValue: 20,
          sport: 'basketball'
        }
      },
      {
        id: 'feedback_2',
        athleteId: 'athlete_2',
        type: 'MERGE',
        submittedBy: 'parent_1',
        submittedAt: Timestamp.fromDate(new Date()),
        targetType: 'athlete',
        targetId: 'athlete_2',
        description: 'Merge duplicate athlete profiles',
        priority: 'high',
        status: 'resolved',
        resolvedBy: 'admin_1',
        resolvedAt: Timestamp.fromDate(new Date()),
        resolution: 'Merged profiles successfully',
        metadata: {
          mergeTarget: 'athlete_duplicate',
          mergeData: {
            schools: ['Lincoln High School'],
            teams: ['Varsity Basketball']
          }
        }
      }
    ];

    return mockEvents.filter(event => {
      if (options.startDate && event.submittedAt.toDate() < options.startDate) {
        return false;
      }
      if (options.endDate && event.submittedAt.toDate() > options.endDate) {
        return false;
      }
      if (options.feedbackTypes && !options.feedbackTypes.includes(event.type)) {
        return false;
      }
      if (options.verifiedOnly && event.status !== 'resolved') {
        return false;
      }
      return true;
    });
  }

  private filterFeedbackEvents(
    events: FeedbackEvent[],
    options: DatasetExportOptions
  ): FeedbackEvent[] {
    return events.filter(event => {
      // Filter by confidence if available
      if (options.minConfidence && event.metadata?.confidence) {
        if (event.metadata.confidence < options.minConfidence) {
          return false;
        }
      }

      // Filter by max entries
      if (options.maxEntries && events.indexOf(event) >= options.maxEntries) {
        return false;
      }

      return true;
    });
  }

  async convertToSFTFormat(feedbackEvents: FeedbackEvent[]): Promise<SFTDatasetEntry[]> {
    const sftEntries: SFTDatasetEntry[] = [];

    for (const event of feedbackEvents) {
      try {
        const sftEntry = await this.convertFeedbackEventToSFT(event);
        if (sftEntry) {
          sftEntries.push(sftEntry);
        }
      } catch (error) {
        console.error(`Failed to convert feedback event ${event.id}:`, error);
      }
    }

    return sftEntries;
  }

  private async convertFeedbackEventToSFT(event: FeedbackEvent): Promise<SFTDatasetEntry | null> {
    const athleteId = event.athleteId;
    const athleteMemory = await athleteMemoryStore.getAthleteMemory(athleteId);

    // Get context about the athlete
    const athleteContext = this.buildAthleteContext(athleteMemory);
    
    // Build the conversation based on feedback type
    const messages = this.buildConversationMessages(event, athleteContext);

    return {
      messages,
      metadata: {
        athleteId,
        feedbackType: event.type,
        targetType: event.targetType,
        targetId: event.targetId,
        timestamp: event.submittedAt.toDate(),
        confidence: this.calculateConfidence(event),
        verified: event.status === 'resolved'
      }
    };
  }

  private buildAthleteContext(athleteMemory: any): string {
    if (!athleteMemory) {
      return 'Athlete profile not found';
    }

    const context = [];
    
    if (athleteMemory.preferences.preferredName) {
      context.push(`Preferred name: ${athleteMemory.preferences.preferredName}`);
    }
    
    if (athleteMemory.preferences.preferredSports.length > 0) {
      context.push(`Sports: ${athleteMemory.preferences.preferredSports.join(', ')}`);
    }
    
    if (athleteMemory.history.schoolsAttended.length > 0) {
      const schools = athleteMemory.history.schoolsAttended.map((s: any) => s.school);
      context.push(`Schools: ${schools.join(', ')}`);
    }

    return context.join('; ');
  }

  private buildConversationMessages(event: FeedbackEvent, athleteContext: string): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // System message
    messages.push({
      role: 'system',
      content: `You are an AI assistant helping with athlete data management. You have access to athlete profiles and can help with corrections, merges, and data validation. Athlete context: ${athleteContext}`
    });

    // User message (the feedback)
    const userMessage = this.buildUserMessage(event);
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Assistant response (the resolution)
    if (event.resolution) {
      messages.push({
        role: 'assistant',
        content: event.resolution
      });
    }

    return messages;
  }

  private buildUserMessage(event: FeedbackEvent): string {
    switch (event.type) {
      case 'CORRECTION':
        return `Please correct the ${event.targetType} data. ${event.description}. The corrected value should be: ${event.metadata?.correctedValue}`;
      
      case 'MERGE':
        return `Please merge the duplicate ${event.targetType} entries. ${event.description}. Merge target: ${event.metadata?.mergeTarget}`;
      
      case 'DUPLICATE':
        return `I found a duplicate ${event.targetType} entry. ${event.description}. Duplicate ID: ${event.metadata?.duplicateId}`;
      
      case 'DISPUTE':
        return `I dispute the accuracy of this ${event.targetType} data. ${event.description}`;
      
      case 'SUGGESTION':
        return `I have a suggestion for improving the ${event.targetType} data. ${event.description}. Suggestion: ${event.metadata?.suggestion}`;
      
      case 'APPROVAL':
        return `I approve of this ${event.targetType} data. ${event.description || 'Data looks correct.'}`;
      
      default:
        return event.description;
    }
  }

  private calculateConfidence(event: FeedbackEvent): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for resolved events
    if (event.status === 'resolved') {
      confidence += 0.3;
    }

    // Higher confidence for admin resolutions
    if (event.resolvedBy?.startsWith('admin_')) {
      confidence += 0.2;
    }

    // Higher confidence for detailed descriptions
    if (event.description.length > 50) {
      confidence += 0.1;
    }

    // Higher confidence for events with metadata
    if (event.metadata && Object.keys(event.metadata).length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  async exportDataset(
    entries: SFTDatasetEntry[],
    options: DatasetExportOptions
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sft_dataset_${timestamp}`;

    switch (options.outputFormat) {
      case 'jsonl':
        return this.exportToJSONL(entries, filename);
      
      case 'json':
        return this.exportToJSON(entries, filename);
      
      case 'csv':
        return this.exportToCSV(entries, filename);
      
      default:
        return this.exportToJSONL(entries, filename);
    }
  }

  private async exportToJSONL(entries: SFTDatasetEntry[], filename: string): Promise<string> {
    const jsonlContent = entries
      .map(entry => JSON.stringify(entry))
      .join('\n');
    
    // TODO: Implement actual file writing
    const filepath = `/exports/${filename}.jsonl`;
    console.log(`Would export JSONL to: ${filepath}`);
    console.log(`Content preview: ${jsonlContent.substring(0, 200)}...`);
    
    return filepath;
  }

  private async exportToJSON(entries: SFTDatasetEntry[], filename: string): Promise<string> {
    const jsonContent = JSON.stringify({
      dataset: entries,
      metadata: {
        exportDate: new Date().toISOString(),
        totalEntries: entries.length,
        format: 'sft',
        version: '1.0'
      }
    }, null, 2);
    
    // TODO: Implement actual file writing
    const filepath = `/exports/${filename}.json`;
    console.log(`Would export JSON to: ${filepath}`);
    
    return filepath;
  }

  private async exportToCSV(entries: SFTDatasetEntry[], filename: string): Promise<string> {
    const csvHeaders = [
      'athlete_id',
      'feedback_type',
      'target_type',
      'target_id',
      'timestamp',
      'confidence',
      'verified',
      'system_message',
      'user_message',
      'assistant_message'
    ];

    const csvRows = entries.map(entry => {
      const systemMsg = entry.messages.find(m => m.role === 'system')?.content || '';
      const userMsg = entry.messages.find(m => m.role === 'user')?.content || '';
      const assistantMsg = entry.messages.find(m => m.role === 'assistant')?.content || '';

      return [
        entry.metadata.athleteId,
        entry.metadata.feedbackType,
        entry.metadata.targetType,
        entry.metadata.targetId,
        entry.metadata.timestamp.toISOString(),
        entry.metadata.confidence,
        entry.metadata.verified,
        systemMsg.replace(/"/g, '""'),
        userMsg.replace(/"/g, '""'),
        assistantMsg.replace(/"/g, '""')
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    
    // TODO: Implement actual file writing
    const filepath = `/exports/${filename}.csv`;
    console.log(`Would export CSV to: ${filepath}`);
    
    return filepath;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getDatasetStats(options: DatasetExportOptions = {}): Promise<{
    totalEntries: number;
    byType: Record<FeedbackType, number>;
    byStatus: Record<string, number>;
    avgConfidence: number;
    verifiedPercentage: number;
  }> {
    const events = await this.getVerifiedFeedbackEvents(options);
    
    const stats = {
      totalEntries: events.length,
      byType: {} as Record<FeedbackType, number>,
      byStatus: {} as Record<string, number>,
      avgConfidence: 0,
      verifiedPercentage: 0
    };

    let totalConfidence = 0;
    let verifiedCount = 0;

    for (const event of events) {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      
      // Count by status
      stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
      
      // Calculate confidence
      const confidence = this.calculateConfidence(event);
      totalConfidence += confidence;
      
      // Count verified
      if (event.status === 'resolved') {
        verifiedCount++;
      }
    }

    stats.avgConfidence = events.length > 0 ? totalConfidence / events.length : 0;
    stats.verifiedPercentage = events.length > 0 ? (verifiedCount / events.length) * 100 : 0;

    return stats;
  }

  async validateDataset(entries: SFTDatasetEntry[]): Promise<{
    valid: number;
    invalid: number;
    errors: string[];
  }> {
    let valid = 0;
    let invalid = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        // Validate entry structure
        if (!entry.messages || !Array.isArray(entry.messages)) {
          errors.push('Invalid messages array');
          invalid++;
          continue;
        }

        if (!entry.metadata) {
          errors.push('Missing metadata');
          invalid++;
          continue;
        }

        // Validate messages
        for (const message of entry.messages) {
          if (!['system', 'user', 'assistant'].includes(message.role)) {
            errors.push('Invalid message role');
            invalid++;
            continue;
          }
          
          if (!message.content || typeof message.content !== 'string') {
            errors.push('Invalid message content');
            invalid++;
            continue;
          }
        }

        valid++;
      } catch (error) {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        invalid++;
      }
    }

    return { valid, invalid, errors };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const sftDatasetBuilder = new SFTDatasetBuilder();
