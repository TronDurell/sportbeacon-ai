// Civic Agent - Smart Decision Functions for Town Rec Admin Tasks
// Provides AI-assisted recommendations for waitlist overrides, sibling conflicts, and decision summaries

export interface WaitlistActionInput {
  childAge: number;
  requestedAge: number;
  leagueId: string;
  reason: string;
  parentId: string;
  timestamp: Date;
}

export interface SiblingConflictInput {
  childId: string;
  siblingId: string;
  leagueId: string;
  timestamp: Date;
}

export interface DecisionSummaryInput {
  requestId: string;
  recommendation: AIRecommendation;
  childName: string;
  leagueName: string;
  adminId: string;
}

export interface AIRecommendation {
  action: 'approve' | 'reject' | 'waitlist' | 'manual_review';
  confidence: number; // 0-1
  rationale: string;
  factors: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestedConditions?: string[];
}

export interface SiblingConflict {
  id: string;
  childId: string;
  siblingId: string;
  leagueId: string;
  conflictType: 'age_mismatch' | 'skill_level' | 'schedule_conflict' | 'team_capacity';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedResolution: string;
  timestamp: Date;
}

export interface DecisionSummary {
  requestId: string;
  decision: 'approve' | 'reject' | 'waitlist' | 'manual_review';
  summary: string;
  keyFactors: string[];
  confidence: number;
  timestamp: Date;
  adminId: string;
}

// Mock league data for decision making
const mockLeagueData = {
  'league-u8-soccer': {
    minAge: 6,
    maxAge: 8,
    currentPlayers: 18,
    maxPlayers: 20,
    waitlistLength: 5,
    skillLevel: 'beginner'
  },
  'league-u10-basketball': {
    minAge: 8,
    maxAge: 10,
    currentPlayers: 12,
    maxPlayers: 12,
    waitlistLength: 8,
    skillLevel: 'intermediate'
  },
  'league-u12-baseball': {
    minAge: 10,
    maxAge: 12,
    currentPlayers: 15,
    maxPlayers: 18,
    waitlistLength: 3,
    skillLevel: 'mixed'
  }
};

// Mock sibling data
const mockSiblingData = {
  'child-001': ['sibling-001', 'sibling-002'],
  'child-002': ['sibling-001'],
  'child-003': ['sibling-003', 'sibling-004']
};

class CivicAgent {
  /**
   * Recommend action for waitlist override request
   */
  async recommendWaitlistAction(input: WaitlistActionInput): Promise<AIRecommendation> {
    const league = mockLeagueData[input.leagueId as keyof typeof mockLeagueData];
    if (!league) {
      return this.createRecommendation('manual_review', 0.3, 'League not found in system', ['unknown_league'], 'high');
    }

    const ageDifference = input.requestedAge - input.childAge;
    const availableSlots = league.maxPlayers - league.currentPlayers;
    const waitlistPosition = league.waitlistLength;

    // TODO: Integrate ML model here
    // const mlRecommendation = await this.callMLModel(input);

    let action: 'approve' | 'reject' | 'waitlist' | 'manual_review';
    let confidence = 0.5;
    let rationale = '';
    let factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    let suggestedConditions: string[] = [];

    // Decision logic based on age difference
    if (ageDifference <= 0) {
      // Child is already old enough
      action = 'approve';
      confidence = 0.9;
      rationale = 'Child meets age requirements for requested league';
      factors = ['age_requirement_met'];
      riskLevel = 'low';
    } else if (ageDifference === 1) {
      // One year under - evaluate based on availability
      if (availableSlots > 0) {
        action = 'approve';
        confidence = 0.8;
        rationale = 'One year under age limit with available slots';
        factors = ['age_difference_minimal', 'slots_available'];
        suggestedConditions = ['Parent must sign age waiver', 'Monitor performance closely'];
      } else {
        action = 'waitlist';
        confidence = 0.7;
        rationale = 'One year under age limit but no available slots';
        factors = ['age_difference_minimal', 'no_slots_available'];
      }
    } else if (ageDifference === 2) {
      // Two years under - higher scrutiny
      if (availableSlots > 2 && waitlistPosition <= 2) {
        action = 'approve';
        confidence = 0.6;
        rationale = 'Two years under age limit but high waitlist priority and available slots';
        factors = ['age_difference_moderate', 'high_priority', 'slots_available'];
        riskLevel = 'medium';
        suggestedConditions = ['Requires director approval', 'Parent must sign age waiver', 'Performance evaluation required'];
      } else {
        action = 'manual_review';
        confidence = 0.4;
        rationale = 'Two years under age limit requires manual review';
        factors = ['age_difference_moderate', 'requires_review'];
        riskLevel = 'high';
      }
    } else {
      // More than 2 years under - reject
      action = 'reject';
      confidence = 0.9;
      rationale = 'Age difference too significant for league requirements';
      factors = ['age_difference_significant', 'safety_concerns'];
      riskLevel = 'high';
    }

    // Adjust based on reason quality
    if (input.reason.toLowerCase().includes('advanced') || input.reason.toLowerCase().includes('experience')) {
      confidence += 0.1;
      factors.push('strong_justification');
    }

    // Adjust based on waitlist length
    if (waitlistPosition <= 3) {
      confidence += 0.1;
      factors.push('high_waitlist_priority');
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return this.createRecommendation(action, confidence, rationale, factors, riskLevel, suggestedConditions);
  }

  /**
   * Check for sibling conflicts in team placement
   */
  async checkSiblingConflicts(input: SiblingConflictInput): Promise<SiblingConflict | null> {
    // TODO: Integrate ML model here
    // const mlConflictAnalysis = await this.callMLModel(input);

    // Mock conflict detection logic
    const conflicts: SiblingConflict[] = [];

    // Check age mismatch
    const childAge = this.getMockAge(input.childId);
    const siblingAge = this.getMockAge(input.siblingId);
    const ageDifference = Math.abs(childAge - siblingAge);

    if (ageDifference > 2) {
      conflicts.push({
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        childId: input.childId,
        siblingId: input.siblingId,
        leagueId: input.leagueId,
        conflictType: 'age_mismatch',
        severity: ageDifference > 3 ? 'high' : 'medium',
        description: `Age difference of ${ageDifference} years may cause developmental mismatch`,
        suggestedResolution: 'Consider separate leagues or age-appropriate grouping',
        timestamp: input.timestamp
      });
    }

    // Check skill level mismatch
    const childSkill = this.getMockSkillLevel(input.childId);
    const siblingSkill = this.getMockSkillLevel(input.siblingId);
    
    if (childSkill !== siblingSkill) {
      conflicts.push({
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        childId: input.childId,
        siblingId: input.siblingId,
        leagueId: input.leagueId,
        conflictType: 'skill_level',
        severity: 'medium',
        description: `Skill level mismatch: ${childSkill} vs ${siblingSkill}`,
        suggestedResolution: 'Consider skill-based placement or separate teams',
        timestamp: input.timestamp
      });
    }

    // Check team capacity
    const league = mockLeagueData[input.leagueId as keyof typeof mockLeagueData];
    if (league && league.currentPlayers >= league.maxPlayers) {
      conflicts.push({
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        childId: input.childId,
        siblingId: input.siblingId,
        leagueId: input.leagueId,
        conflictType: 'team_capacity',
        severity: 'high',
        description: 'Team at maximum capacity - cannot accommodate both siblings',
        suggestedResolution: 'Place on waitlist or consider alternative league',
        timestamp: input.timestamp
      });
    }

    // Return highest severity conflict
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high');
    const mediumSeverityConflicts = conflicts.filter(c => c.severity === 'medium');
    
    if (highSeverityConflicts.length > 0) {
      return highSeverityConflicts[0];
    } else if (mediumSeverityConflicts.length > 0) {
      return mediumSeverityConflicts[0];
    }

    return null;
  }

  /**
   * Generate decision summary in plain English
   */
  async generateDecisionSummary(input: DecisionSummaryInput): Promise<DecisionSummary> {
    const { recommendation, childName, leagueName } = input;

    // Create plain English summary
    let summary = '';
    let keyFactors: string[] = [];

    switch (recommendation.action) {
      case 'approve':
        summary = `✅ **APPROVED**: ${childName} (age ${this.getMockAge(input.requestId)}) can join ${leagueName}. `;
        summary += `AI confidence: ${(recommendation.confidence * 100).toFixed(0)}%. `;
        if (recommendation.suggestedConditions && recommendation.suggestedConditions.length > 0) {
          summary += `Conditions: ${recommendation.suggestedConditions.join(', ')}. `;
        }
        summary += `Reason: ${recommendation.rationale}`;
        keyFactors = recommendation.factors;
        break;

      case 'reject':
        summary = `❌ **REJECTED**: ${childName} cannot join ${leagueName}. `;
        summary += `AI confidence: ${(recommendation.confidence * 100).toFixed(0)}%. `;
        summary += `Reason: ${recommendation.rationale}`;
        keyFactors = recommendation.factors;
        break;

      case 'waitlist':
        summary = `⏳ **WAITLISTED**: ${childName} has been added to the waitlist for ${leagueName}. `;
        summary += `AI confidence: ${(recommendation.confidence * 100).toFixed(0)}%. `;
        summary += `Reason: ${recommendation.rationale}`;
        keyFactors = recommendation.factors;
        break;

      case 'manual_review':
        summary = `🔍 **MANUAL REVIEW REQUIRED**: ${childName}'s request for ${leagueName} needs director review. `;
        summary += `AI confidence: ${(recommendation.confidence * 100).toFixed(0)}%. `;
        summary += `Reason: ${recommendation.rationale}`;
        keyFactors = recommendation.factors;
        break;
    }

    return {
      requestId: input.requestId,
      decision: recommendation.action,
      summary,
      keyFactors,
      confidence: recommendation.confidence,
      timestamp: new Date(),
      adminId: input.adminId
    };
  }

  /**
   * Create recommendation object
   */
  private createRecommendation(
    action: 'approve' | 'reject' | 'waitlist' | 'manual_review',
    confidence: number,
    rationale: string,
    factors: string[],
    riskLevel: 'low' | 'medium' | 'high',
    suggestedConditions?: string[]
  ): AIRecommendation {
    return {
      action,
      confidence,
      rationale,
      factors,
      riskLevel,
      suggestedConditions
    };
  }

  /**
   * Mock helper functions for demo data
   */
  private getMockAge(childId: string): number {
    const ages: Record<string, number> = {
      'child-001': 7,
      'child-002': 8,
      'child-003': 9,
      'sibling-001': 6,
      'sibling-002': 10,
      'sibling-003': 8,
      'sibling-004': 11
    };
    return ages[childId] || 8;
  }

  private getMockSkillLevel(childId: string): string {
    const skills: Record<string, string> = {
      'child-001': 'beginner',
      'child-002': 'intermediate',
      'child-003': 'advanced',
      'sibling-001': 'beginner',
      'sibling-002': 'intermediate',
      'sibling-003': 'beginner',
      'sibling-004': 'advanced'
    };
    return skills[childId] || 'beginner';
  }

  /**
   * Placeholder for future ML model integration
   */
  private async callMLModel(input: any): Promise<any> {
    // TODO: Integrate ML model here
    // This would call an actual ML service for more sophisticated decision making
    return null;
  }
}

// Export singleton instance
export const civicAgent = new CivicAgent();

// Export types for external use
export type {
  WaitlistActionInput,
  SiblingConflictInput,
  DecisionSummaryInput,
  AIRecommendation,
  SiblingConflict,
  DecisionSummary
}; 