/* SportBeaconAI - Per-Athlete Memory Store
   Persistent memory system for athlete preferences and history
*/

import { Timestamp } from 'firebase/firestore';
import { memoryClient, type MemoryClient } from '@sportbeacon/memory-sdk';
import { ID, Athlete, Sport } from '../domain/types';

// ============================================================================
// ATHLETE MEMORY INTERFACES
// ============================================================================

export interface AthleteMemory {
  athleteId: ID;
  preferences: AthletePreferences;
  history: AthleteHistory;
  patterns: AthletePatterns;
  lastUpdated: Date;
  version: number;
}

export interface AthletePreferences {
  // Name and Display Preferences
  preferredName: string;
  preferredNameFormat: 'first_last' | 'first_last_initial' | 'nickname_last' | 'full_name';
  jerseyNumberPreference: number | null;
  
  // Sport and Position Preferences
  preferredSports: Sport[];
  preferredPositions: Record<Sport, string[]>;
  
  // School and Academic Preferences
  preferredSchoolFormat: 'full_name' | 'abbreviation' | 'city_state';
  graduationYearPreference: number | null;
  
  // Data Entry Preferences
  preferredStatEntryMethod: 'csv' | 'manual' | 'connector';
  preferredHighlightSource: 'hudl' | 'youtube' | 'vimeo';
  
  // Privacy Preferences
  publicProfileLevel: 'full' | 'stats_only' | 'minimal' | 'private';
  allowCoachAccess: boolean;
  allowParentAccess: boolean;
  
  // Notification Preferences
  emailNotifications: boolean;
  highlightNotifications: boolean;
  verificationNotifications: boolean;
}

export interface AthleteHistory {
  // Activity History
  totalStatsEntered: number;
  totalHighlightsAdded: number;
  totalFeedbackProvided: number;
  
  // School History
  schoolsAttended: Array<{
    school: string;
    startYear: number;
    endYear: number;
    sport: Sport;
  }>;
  
  // Team History
  teamsPlayed: Array<{
    teamName: string;
    season: string;
    year: number;
    sport: Sport;
    position: string;
  }>;
  
  // Achievement History
  notableAchievements: Array<{
    achievement: string;
    date: Date;
    sport: Sport;
    verified: boolean;
  }>;
  
  // Data Sources Used
  dataSourcesUsed: Array<{
    source: string;
    firstUsed: Date;
    lastUsed: Date;
    usageCount: number;
  }>;
}

export interface AthletePatterns {
  // Usage Patterns
  mostActiveHours: number[]; // 0-23
  mostActiveDays: string[]; // 'monday', 'tuesday', etc.
  
  // Content Patterns
  mostFrequentStats: string[];
  mostFrequentHighlights: string[];
  preferredHighlightLength: 'short' | 'medium' | 'long';
  
  // Quality Patterns
  averageVerificationTime: number; // in hours
  verificationSuccessRate: number; // 0-1
  disputeRate: number; // 0-1
  
  // Learning Patterns
  preferredLearningMethods: string[];
  responseToCorrections: 'accept' | 'question' | 'dispute';
  improvementAreas: string[];
}

// ============================================================================
// MEMORY STORE CLASS
// ============================================================================

export class AthleteMemoryStore {
  private memoryClient: MemoryClient;
  private cache: Map<ID, AthleteMemory> = new Map();
  private cacheExpiry: Map<ID, Date> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.memoryClient = memoryClient();
  }

  // ============================================================================
  // CORE MEMORY OPERATIONS
  // ============================================================================

  async getAthleteMemory(athleteId: ID): Promise<AthleteMemory | null> {
    // Check cache first
    const cached = this.getCachedMemory(athleteId);
    if (cached) {
      return cached;
    }

    try {
      // Try to get from memory SDK
      const memories = await this.memoryClient.recall({
        scope: 'user',
        ownerId: athleteId,
        kind: 'preference',
        tag: 'athlete-memory',
        limit: 1
      });

      if (memories.length > 0) {
        const memoryData = memories[0].data as any;
        const athleteMemory = this.parseMemoryData(memoryData);
        this.setCachedMemory(athleteId, athleteMemory);
        return athleteMemory;
      }

      // Return default memory if none exists
      const defaultMemory = this.createDefaultMemory(athleteId);
      this.setCachedMemory(athleteId, defaultMemory);
      return defaultMemory;
    } catch (error) {
      console.error('Failed to get athlete memory:', error);
      return this.createDefaultMemory(athleteId);
    }
  }

  async updateAthleteMemory(
    athleteId: ID, 
    updates: Partial<AthleteMemory>,
    source: string = 'system'
  ): Promise<void> {
    try {
      const currentMemory = await this.getAthleteMemory(athleteId);
      if (!currentMemory) {
        throw new Error('Failed to get current athlete memory');
      }

      // Merge updates
      const updatedMemory: AthleteMemory = {
        ...currentMemory,
        ...updates,
        athleteId,
        lastUpdated: new Date(),
        version: currentMemory.version + 1
      };

      // Save to memory SDK
      await this.memoryClient.remember({
        tenantId: 'sportbeacon', // TODO: Make this configurable
        scope: 'user',
        ownerId: athleteId,
        kind: 'preference',
        text: `Athlete memory updated: ${JSON.stringify(updates)}`,
        tags: ['athlete-memory', 'preferences', source],
        score: 0.9,
        confidence: 0.8,
        source: 'ui',
        data: updatedMemory
      });

      // Update cache
      this.setCachedMemory(athleteId, updatedMemory);
    } catch (error) {
      console.error('Failed to update athlete memory:', error);
      throw error;
    }
  }

  async updatePreferences(
    athleteId: ID,
    preferences: Partial<AthletePreferences>,
    source: string = 'user'
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      throw new Error('Failed to get current athlete memory');
    }

    await this.updateAthleteMemory(athleteId, {
      preferences: { ...currentMemory.preferences, ...preferences }
    }, source);
  }

  async updateHistory(
    athleteId: ID,
    historyUpdates: Partial<AthleteHistory>,
    source: string = 'system'
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      throw new Error('Failed to get current athlete memory');
    }

    await this.updateAthleteMemory(athleteId, {
      history: { ...currentMemory.history, ...historyUpdates }
    }, source);
  }

  async updatePatterns(
    athleteId: ID,
    patternUpdates: Partial<AthletePatterns>,
    source: string = 'system'
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      throw new Error('Failed to get current athlete memory');
    }

    await this.updateAthleteMemory(athleteId, {
      patterns: { ...currentMemory.patterns, ...patternUpdates }
    }, source);
  }

  // ============================================================================
  // SPECIALIZED MEMORY OPERATIONS
  // ============================================================================

  async recordStatEntry(
    athleteId: ID,
    statType: string,
    method: 'csv' | 'manual' | 'connector',
    success: boolean
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      return;
    }

    const updates: Partial<AthleteHistory> = {
      totalStatsEntered: currentMemory.history.totalStatsEntered + 1,
      dataSourcesUsed: this.updateDataSourceUsage(
        currentMemory.history.dataSourcesUsed,
        method,
        success
      )
    };

    await this.updateHistory(athleteId, updates, 'stat-entry');
  }

  async recordHighlightAdded(
    athleteId: ID,
    source: 'hudl' | 'youtube' | 'vimeo',
    success: boolean
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      return;
    }

    const updates: Partial<AthleteHistory> = {
      totalHighlightsAdded: currentMemory.history.totalHighlightsAdded + 1,
      dataSourcesUsed: this.updateDataSourceUsage(
        currentMemory.history.dataSourcesUsed,
        source,
        success
      )
    };

    await this.updateHistory(athleteId, updates, 'highlight-added');
  }

  async recordFeedbackProvided(
    athleteId: ID,
    feedbackType: string,
    response: 'accept' | 'question' | 'dispute'
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      return;
    }

    const updates: Partial<AthleteHistory & AthletePatterns> = {
      history: {
        totalFeedbackProvided: currentMemory.history.totalFeedbackProvided + 1
      },
      patterns: {
        responseToCorrections: response
      }
    };

    await this.updateAthleteMemory(athleteId, updates, 'feedback-provided');
  }

  async recordSchoolChange(
    athleteId: ID,
    school: string,
    startYear: number,
    sport: Sport
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      return;
    }

    const newSchoolEntry = {
      school,
      startYear,
      endYear: new Date().getFullYear(),
      sport
    };

    const updates: Partial<AthleteHistory> = {
      schoolsAttended: [...currentMemory.history.schoolsAttended, newSchoolEntry]
    };

    await this.updateHistory(athleteId, updates, 'school-change');
  }

  async recordTeamChange(
    athleteId: ID,
    teamName: string,
    season: string,
    year: number,
    sport: Sport,
    position: string
  ): Promise<void> {
    const currentMemory = await this.getAthleteMemory(athleteId);
    if (!currentMemory) {
      return;
    }

    const newTeamEntry = {
      teamName,
      season,
      year,
      sport,
      position
    };

    const updates: Partial<AthleteHistory> = {
      teamsPlayed: [...currentMemory.history.teamsPlayed, newTeamEntry]
    };

    await this.updateHistory(athleteId, updates, 'team-change');
  }

  // ============================================================================
  // MEMORY QUERY OPERATIONS
  // ============================================================================

  async getPreferredNameFormat(athleteId: ID): Promise<string> {
    const memory = await this.getAthleteMemory(athleteId);
    return memory?.preferences.preferredNameFormat || 'first_last';
  }

  async getPreferredSports(athleteId: ID): Promise<Sport[]> {
    const memory = await this.getAthleteMemory(athleteId);
    return memory?.preferences.preferredSports || [];
  }

  async getPreferredPositions(athleteId: ID, sport: Sport): Promise<string[]> {
    const memory = await this.getAthleteMemory(athleteId);
    return memory?.preferences.preferredPositions[sport] || [];
  }

  async getPreferredDataSource(athleteId: ID): Promise<string> {
    const memory = await this.getAthleteMemory(athleteId);
    return memory?.preferences.preferredStatEntryMethod || 'manual';
  }

  async getMostUsedDataSources(athleteId: ID): Promise<Array<{ source: string; usageCount: number }>> {
    const memory = await this.getAthleteMemory(athleteId);
    if (!memory) {
      return [];
    }

    return memory.history.dataSourcesUsed
      .sort((a, b) => b.usageCount - a.usageCount)
      .map(source => ({
        source: source.source,
        usageCount: source.usageCount
      }));
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private getCachedMemory(athleteId: ID): AthleteMemory | null {
    const expiry = this.cacheExpiry.get(athleteId);
    if (expiry && expiry > new Date()) {
      return this.cache.get(athleteId) || null;
    }
    
    // Remove expired cache entry
    this.cache.delete(athleteId);
    this.cacheExpiry.delete(athleteId);
    return null;
  }

  private setCachedMemory(athleteId: ID, memory: AthleteMemory): void {
    this.cache.set(athleteId, memory);
    this.cacheExpiry.set(athleteId, new Date(Date.now() + this.CACHE_TTL));
  }

  private parseMemoryData(data: any): AthleteMemory {
    return {
      athleteId: data.athleteId,
      preferences: data.preferences || this.getDefaultPreferences(),
      history: data.history || this.getDefaultHistory(),
      patterns: data.patterns || this.getDefaultPatterns(),
      lastUpdated: new Date(data.lastUpdated || Date.now()),
      version: data.version || 1
    };
  }

  private createDefaultMemory(athleteId: ID): AthleteMemory {
    return {
      athleteId,
      preferences: this.getDefaultPreferences(),
      history: this.getDefaultHistory(),
      patterns: this.getDefaultPatterns(),
      lastUpdated: new Date(),
      version: 1
    };
  }

  private getDefaultPreferences(): AthletePreferences {
    return {
      preferredName: '',
      preferredNameFormat: 'first_last',
      jerseyNumberPreference: null,
      preferredSports: [],
      preferredPositions: {},
      preferredSchoolFormat: 'full_name',
      graduationYearPreference: null,
      preferredStatEntryMethod: 'manual',
      preferredHighlightSource: 'hudl',
      publicProfileLevel: 'full',
      allowCoachAccess: true,
      allowParentAccess: true,
      emailNotifications: true,
      highlightNotifications: true,
      verificationNotifications: true
    };
  }

  private getDefaultHistory(): AthleteHistory {
    return {
      totalStatsEntered: 0,
      totalHighlightsAdded: 0,
      totalFeedbackProvided: 0,
      schoolsAttended: [],
      teamsPlayed: [],
      notableAchievements: [],
      dataSourcesUsed: []
    };
  }

  private getDefaultPatterns(): AthletePatterns {
    return {
      mostActiveHours: [],
      mostActiveDays: [],
      mostFrequentStats: [],
      mostFrequentHighlights: [],
      preferredHighlightLength: 'medium',
      averageVerificationTime: 24,
      verificationSuccessRate: 0,
      disputeRate: 0,
      preferredLearningMethods: [],
      responseToCorrections: 'accept',
      improvementAreas: []
    };
  }

  private updateDataSourceUsage(
    currentSources: AthleteHistory['dataSourcesUsed'],
    source: string,
    success: boolean
  ): AthleteHistory['dataSourcesUsed'] {
    const existingSource = currentSources.find(s => s.source === source);
    const now = new Date();

    if (existingSource) {
      return currentSources.map(s => 
        s.source === source 
          ? {
              ...s,
              lastUsed: now,
              usageCount: s.usageCount + 1
            }
          : s
      );
    } else {
      return [
        ...currentSources,
        {
          source,
          firstUsed: now,
          lastUsed: now,
          usageCount: 1
        }
      ];
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const athleteMemoryStore = new AthleteMemoryStore();
