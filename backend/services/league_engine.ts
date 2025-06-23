import { getSportRule } from '../config/sportRules';
import { openai } from '../services/llm_service';

// Enhanced League Types and Interfaces
export interface LeagueTier {
  id: string;
  name: string;
  level: number; // 1 = highest (Pro), 4 = lowest (Amateur)
  minAge: number;
  maxAge: number;
  maxTeams: number;
  promotionSpots: number;
  relegationSpots: number;
  seasonDuration: number; // days
  autoPromotionEnabled: boolean; // New: Enable automatic promotion
  promotionCriteria: {
    minWins: number;
    minWinPercentage: number;
    minPerformanceScore: number;
    consecutiveSeasons: number; // Seasons in current tier before auto-promotion
  };
  requirements: {
    minDrillsCompleted: number;
    minAvgScore: number;
    minStreakDays: number;
    minFollowers: number;
  };
  rewards: {
    beaconMultiplier: number;
    specialBadges: string[];
    exclusiveFeatures: string[];
  };
}

export interface AgeBracket {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
  sportSpecificRules: Record<string, any>;
  eligibilityCriteria: string[];
}

export interface LeagueSeason {
  id: string;
  leagueId: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants: LeagueParticipant[];
  standings: LeagueStanding[];
  promotions: string[]; // team IDs
  relegations: string[]; // team IDs
  autoPromotions: string[]; // New: Auto-promoted teams
  region: string; // New: Region for stat normalization
  federationId: string; // New: Associated federation
}

export interface LeagueParticipant {
  teamId: string;
  teamName: string;
  captainId: string;
  captainName: string;
  joinDate: Date;
  totalPoints: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  performanceScore: number;
  consecutiveSeasons: number; // New: Seasons in current tier
  regionStats: RegionStats; // New: Region-specific statistics
}

export interface RegionStats {
  region: string;
  adjustedPerformanceScore: number;
  regionalRanking: number;
  strengthOfSchedule: number;
  travelDistance: number; // km
  timeZoneAdjustment: number;
  climateAdjustment: number;
}

export interface LeagueStanding {
  position: number;
  teamId: string;
  teamName: string;
  points: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalDifference: number;
  performanceScore: number;
  promotionChance: number;
  relegationRisk: number;
  autoPromotionEligible: boolean; // New: Auto-promotion eligibility
  regionAdjustedScore: number; // New: Region-normalized score
}

export interface RuleConflict {
  id: string;
  federationId: string;
  sport: string;
  ruleType: string;
  conflictingRules: {
    federation1: { id: string; rule: any };
    federation2: { id: string; rule: any };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'resolved' | 'escalated';
  resolution: string;
  resolvedBy: string;
  resolvedAt: Date;
}

// Enhanced League Configuration
export const LEAGUE_TIERS: Record<string, LeagueTier> = {
  pro: {
    id: 'pro',
    name: 'Professional',
    level: 1,
    minAge: 18,
    maxAge: 99,
    maxTeams: 20,
    promotionSpots: 0,
    relegationSpots: 3,
    seasonDuration: 365,
    autoPromotionEnabled: false, // Pro tier has no promotion
    promotionCriteria: {
      minWins: 0,
      minWinPercentage: 0,
      minPerformanceScore: 0,
      consecutiveSeasons: 0
    },
    requirements: {
      minDrillsCompleted: 1000,
      minAvgScore: 85,
      minStreakDays: 30,
      minFollowers: 1000
    },
    rewards: {
      beaconMultiplier: 3.0,
      specialBadges: ['pro_elite', 'champion', 'legend'],
      exclusiveFeatures: ['advanced_analytics', 'pro_coaching', 'sponsorship_opportunities']
    }
  },
  varsity: {
    id: 'varsity',
    name: 'Varsity',
    level: 2,
    minAge: 14,
    maxAge: 18,
    maxTeams: 50,
    promotionSpots: 2,
    relegationSpots: 5,
    seasonDuration: 180,
    autoPromotionEnabled: true,
    promotionCriteria: {
      minWins: 15,
      minWinPercentage: 0.75,
      minPerformanceScore: 85,
      consecutiveSeasons: 2
    },
    requirements: {
      minDrillsCompleted: 500,
      minAvgScore: 75,
      minStreakDays: 20,
      minFollowers: 500
    },
    rewards: {
      beaconMultiplier: 2.0,
      specialBadges: ['varsity_star', 'team_captain', 'rising_talent'],
      exclusiveFeatures: ['college_scouting', 'advanced_training', 'team_analytics']
    }
  },
  club: {
    id: 'club',
    name: 'Club',
    level: 3,
    minAge: 12,
    maxAge: 16,
    maxTeams: 100,
    promotionSpots: 3,
    relegationSpots: 8,
    seasonDuration: 120,
    autoPromotionEnabled: true,
    promotionCriteria: {
      minWins: 12,
      minWinPercentage: 0.70,
      minPerformanceScore: 80,
      consecutiveSeasons: 2
    },
    requirements: {
      minDrillsCompleted: 250,
      minAvgScore: 65,
      minStreakDays: 15,
      minFollowers: 200
    },
    rewards: {
      beaconMultiplier: 1.5,
      specialBadges: ['club_champion', 'dedicated_player', 'skill_master'],
      exclusiveFeatures: ['skill_tracking', 'team_building', 'competition_access']
    }
  },
  amateur: {
    id: 'amateur',
    name: 'Amateur',
    level: 4,
    minAge: 8,
    maxAge: 14,
    maxTeams: 200,
    promotionSpots: 5,
    relegationSpots: 0,
    seasonDuration: 90,
    autoPromotionEnabled: true,
    promotionCriteria: {
      minWins: 8,
      minWinPercentage: 0.65,
      minPerformanceScore: 75,
      consecutiveSeasons: 1
    },
    requirements: {
      minDrillsCompleted: 100,
      minAvgScore: 50,
      minStreakDays: 10,
      minFollowers: 50
    },
    rewards: {
      beaconMultiplier: 1.0,
      specialBadges: ['beginner_friendly', 'consistent_player', 'team_player'],
      exclusiveFeatures: ['basic_training', 'skill_development', 'community_access']
    }
  }
};

// Region-specific stat normalization factors
export const REGION_NORMALIZATION_FACTORS = {
  'North America': {
    strengthMultiplier: 1.0,
    travelPenalty: 0.0,
    timeZoneAdjustment: 0.0,
    climateAdjustment: 0.0
  },
  'Europe': {
    strengthMultiplier: 1.1,
    travelPenalty: 0.05,
    timeZoneAdjustment: 0.02,
    climateAdjustment: 0.01
  },
  'Asia': {
    strengthMultiplier: 1.05,
    travelPenalty: 0.08,
    timeZoneAdjustment: 0.03,
    climateAdjustment: 0.02
  },
  'South America': {
    strengthMultiplier: 1.15,
    travelPenalty: 0.10,
    timeZoneAdjustment: 0.04,
    climateAdjustment: 0.03
  },
  'Africa': {
    strengthMultiplier: 0.95,
    travelPenalty: 0.12,
    timeZoneAdjustment: 0.05,
    climateAdjustment: 0.04
  },
  'Oceania': {
    strengthMultiplier: 0.90,
    travelPenalty: 0.15,
    timeZoneAdjustment: 0.06,
    climateAdjustment: 0.02
  }
};

export class LeagueEngine {
  private leagues: Map<string, LeagueSeason> = new Map();
  private ruleConflicts: Map<string, RuleConflict> = new Map();

  constructor() {
    this.initializeLeagues();
  }

  private initializeLeagues() {
    // Initialize with some default leagues
    const defaultLeagues = [
      { tierId: 'varsity', name: 'Varsity League Alpha', region: 'North America', federationId: 'uil' },
      { tierId: 'club', name: 'Club League Beta', region: 'Europe', federationId: 'aau' },
      { tierId: 'amateur', name: 'Amateur League Gamma', region: 'Asia', federationId: 'fifa' }
    ];

    defaultLeagues.forEach(league => {
      this.createLeague(league.tierId, league.name, league.region, league.federationId);
    });
  }

  async createLeague(tierId: string, name: string, region: string = 'North America', federationId: string = 'global'): Promise<string> {
    const tier = LEAGUE_TIERS[tierId];
    if (!tier) {
      throw new Error(`Invalid tier: ${tierId}`);
    }

    const leagueId = `league_${tierId}_${Date.now()}`;
    const season: LeagueSeason = {
      id: leagueId,
      leagueId: tierId,
      startDate: new Date(),
      endDate: new Date(Date.now() + tier.seasonDuration * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      participants: [],
      standings: [],
      promotions: [],
      relegations: [],
      autoPromotions: [],
      region,
      federationId
    };

    this.leagues.set(leagueId, season);
    return leagueId;
  }

  async joinLeague(leagueId: string, teamId: string, captainId: string, teamName: string, captainName: string, region: string = 'North America'): Promise<boolean> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return false;
    }

    const tier = LEAGUE_TIERS[league.leagueId];
    if (!tier) {
      return false;
    }

    // Check if league is full
    if (league.participants.length >= tier.maxTeams) {
      return false;
    }

    // Check if team is already in league
    if (league.participants.some(p => p.teamId === teamId)) {
      return false;
    }

    // Create participant with region stats
    const participant: LeagueParticipant = {
      teamId,
      teamName,
      captainId,
      captainName,
      joinDate: new Date(),
      totalPoints: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      performanceScore: 0,
      consecutiveSeasons: 1,
      regionStats: this.calculateRegionStats(region, league.region)
    };

    league.participants.push(participant);
    return true;
  }

  private calculateRegionStats(teamRegion: string, leagueRegion: string): RegionStats {
    const teamFactors = REGION_NORMALIZATION_FACTORS[teamRegion] || REGION_NORMALIZATION_FACTORS['North America'];
    const leagueFactors = REGION_NORMALIZATION_FACTORS[leagueRegion] || REGION_NORMALIZATION_FACTORS['North America'];

    // Calculate travel distance penalty (simplified)
    const travelDistance = this.calculateTravelDistance(teamRegion, leagueRegion);
    const travelPenalty = Math.min(travelDistance * 0.001, 0.1); // Max 10% penalty

    // Calculate time zone adjustment
    const timeZoneDiff = this.calculateTimeZoneDifference(teamRegion, leagueRegion);
    const timeZoneAdjustment = Math.abs(timeZoneDiff) * 0.01; // 1% per hour difference

    // Calculate climate adjustment
    const climateAdjustment = this.calculateClimateAdjustment(teamRegion, leagueRegion);

    return {
      region: teamRegion,
      adjustedPerformanceScore: 0, // Will be calculated during performance updates
      regionalRanking: 0,
      strengthOfSchedule: teamFactors.strengthMultiplier,
      travelDistance,
      timeZoneAdjustment,
      climateAdjustment
    };
  }

  private calculateTravelDistance(region1: string, region2: string): number {
    // Simplified distance calculation - in production, use actual coordinates
    const distances: Record<string, Record<string, number>> = {
      'North America': {
        'Europe': 7000,
        'Asia': 10000,
        'South America': 8000,
        'Africa': 12000,
        'Oceania': 15000
      },
      'Europe': {
        'North America': 7000,
        'Asia': 8000,
        'South America': 10000,
        'Africa': 5000,
        'Oceania': 18000
      }
      // Add more region combinations as needed
    };

    return distances[region1]?.[region2] || distances[region2]?.[region1] || 0;
  }

  private calculateTimeZoneDifference(region1: string, region2: string): number {
    // Simplified time zone calculation
    const timeZones: Record<string, number> = {
      'North America': -5, // EST
      'Europe': 1, // CET
      'Asia': 8, // CST
      'South America': -3, // BRT
      'Africa': 2, // CAT
      'Oceania': 10 // AEST
    };

    return (timeZones[region1] || 0) - (timeZones[region2] || 0);
  }

  private calculateClimateAdjustment(region1: string, region2: string): number {
    // Simplified climate adjustment
    const climates: Record<string, string> = {
      'North America': 'temperate',
      'Europe': 'temperate',
      'Asia': 'mixed',
      'South America': 'tropical',
      'Africa': 'tropical',
      'Oceania': 'temperate'
    };

    const climate1 = climates[region1] || 'temperate';
    const climate2 = climates[region2] || 'temperate';

    if (climate1 === climate2) return 0;
    if ((climate1 === 'tropical' && climate2 === 'temperate') || 
        (climate1 === 'temperate' && climate2 === 'tropical')) {
      return 0.05; // 5% adjustment for major climate differences
    }
    return 0.02; // 2% adjustment for minor differences
  }

  async checkEligibility(playerId: string, tier: LeagueTier): Promise<boolean> {
    // Enhanced eligibility check with region considerations
    // In production, fetch actual player data
    return true;
  }

  async updateStandings(leagueId: string): Promise<void> {
    const league = this.leagues.get(leagueId);
    if (!league) return;

    const tier = LEAGUE_TIERS[league.leagueId];
    if (!tier) return;

    // Calculate standings with region normalization
    const standings: LeagueStanding[] = league.participants.map(participant => {
      const regionAdjustedScore = this.calculateRegionAdjustedScore(participant, league.region);
      const autoPromotionEligible = this.checkAutoPromotionEligibility(participant, tier);

      return {
        position: 0, // Will be set after sorting
        teamId: participant.teamId,
        teamName: participant.teamName,
        points: participant.totalPoints,
        matchesPlayed: participant.matchesPlayed,
        wins: participant.wins,
        losses: participant.losses,
        ties: participant.ties,
        goalDifference: 0, // Calculate based on sport
        performanceScore: participant.performanceScore,
        promotionChance: 0, // Will be calculated
        relegationRisk: 0, // Will be calculated
        autoPromotionEligible,
        regionAdjustedScore
      };
    });

    // Sort by region-adjusted score
    standings.sort((a, b) => b.regionAdjustedScore - a.regionAdjustedScore);

    // Set positions and calculate promotion/relegation chances
    standings.forEach((standing, index) => {
      standing.position = index + 1;
      standing.promotionChance = this.calculatePromotionChance(standing, tier, standings.length);
      standing.relegationRisk = this.calculateRelegationRisk(standing, tier, standings.length);
    });

    league.standings = standings;
  }

  private calculateRegionAdjustedScore(participant: LeagueParticipant, leagueRegion: string): number {
    const baseScore = participant.performanceScore;
    const regionStats = participant.regionStats;

    // Apply region normalization factors
    let adjustedScore = baseScore * regionStats.strengthOfSchedule;
    
    // Apply travel penalty
    adjustedScore *= (1 - regionStats.travelDistance * 0.0001);
    
    // Apply time zone adjustment
    adjustedScore *= (1 - regionStats.timeZoneAdjustment);
    
    // Apply climate adjustment
    adjustedScore *= (1 - regionStats.climateAdjustment);

    return Math.max(0, adjustedScore);
  }

  private checkAutoPromotionEligibility(participant: LeagueParticipant, tier: LeagueTier): boolean {
    if (!tier.autoPromotionEnabled) return false;

    const criteria = tier.promotionCriteria;
    const winPercentage = participant.matchesPlayed > 0 ? participant.wins / participant.matchesPlayed : 0;

    return (
      participant.wins >= criteria.minWins &&
      winPercentage >= criteria.minWinPercentage &&
      participant.performanceScore >= criteria.minPerformanceScore &&
      participant.consecutiveSeasons >= criteria.consecutiveSeasons
    );
  }

  private calculatePromotionChance(standing: LeagueStanding, tier: LeagueTier, totalTeams: number): number {
    if (standing.position <= tier.promotionSpots) return 1.0;
    if (standing.position <= tier.promotionSpots + 2) return 0.5;
    return 0.0;
  }

  private calculateRelegationRisk(standing: LeagueStanding, tier: LeagueTier, totalTeams: number): number {
    if (tier.relegationSpots === 0) return 0.0;
    if (standing.position > totalTeams - tier.relegationSpots) return 1.0;
    if (standing.position > totalTeams - tier.relegationSpots - 2) return 0.5;
    return 0.0;
  }

  async processPromotionRelegation(leagueId: string): Promise<{ promotions: string[], relegations: string[], autoPromotions: string[] }> {
    const league = this.leagues.get(leagueId);
    if (!league) {
      return { promotions: [], relegations: [], autoPromotions: [] };
    }

    const tier = LEAGUE_TIERS[league.leagueId];
    if (!tier) {
      return { promotions: [], relegations: [], autoPromotions: [] };
    }

    await this.updateStandings(leagueId);
    const standings = league.standings;

    // Process regular promotions
    const promotions = standings
      .slice(0, tier.promotionSpots)
      .map(s => s.teamId);

    // Process auto-promotions
    const autoPromotions = standings
      .filter(s => s.autoPromotionEligible && !promotions.includes(s.teamId))
      .slice(0, Math.max(0, tier.promotionSpots - promotions.length))
      .map(s => s.teamId);

    // Process relegations
    const relegations = standings
      .slice(-tier.relegationSpots)
      .map(s => s.teamId);

    // Update league
    league.promotions = promotions;
    league.relegations = relegations;
    league.autoPromotions = autoPromotions;

    return { promotions, relegations, autoPromotions };
  }

  async recordMatchResult(leagueId: string, team1Id: string, team2Id: string, team1Score: number, team2Score: number): Promise<void> {
    const league = this.leagues.get(leagueId);
    if (!league) return;

    const team1 = league.participants.find(p => p.teamId === team1Id);
    const team2 = league.participants.find(p => p.teamId === team2Id);

    if (!team1 || !team2) return;

    // Update match statistics
    team1.matchesPlayed++;
    team2.matchesPlayed++;

    if (team1Score > team2Score) {
      team1.wins++;
      team2.losses++;
      team1.totalPoints += 3;
    } else if (team1Score < team2Score) {
      team2.wins++;
      team1.losses++;
      team2.totalPoints += 3;
    } else {
      team1.ties++;
      team2.ties++;
      team1.totalPoints += 1;
      team2.totalPoints += 1;
    }

    // Calculate performance scores with region adjustments
    const team1Performance = this.calculatePerformanceScore(team1Score, team2Score, team1Score > team2Score);
    const team2Performance = this.calculatePerformanceScore(team2Score, team1Score, team2Score > team1Score);

    // Apply region adjustments
    team1.performanceScore = this.applyRegionAdjustments(team1Performance, team1.regionStats);
    team2.performanceScore = this.applyRegionAdjustments(team2Performance, team2.regionStats);

    // Update standings
    await this.updateStandings(leagueId);
  }

  private calculatePerformanceScore(teamScore: number, opponentScore: number, isWinner: boolean): number {
    const baseScore = isWinner ? 100 : 50;
    const scoreDifference = Math.abs(teamScore - opponentScore);
    const bonusPoints = scoreDifference * 5;
    return Math.min(100, baseScore + bonusPoints);
  }

  private applyRegionAdjustments(baseScore: number, regionStats: RegionStats): number {
    let adjustedScore = baseScore;

    // Apply travel penalty
    adjustedScore *= (1 - regionStats.travelDistance * 0.0001);

    // Apply time zone adjustment
    adjustedScore *= (1 - regionStats.timeZoneAdjustment);

    // Apply climate adjustment
    adjustedScore *= (1 - regionStats.climateAdjustment);

    return Math.max(0, Math.min(100, adjustedScore));
  }

  async resolveRuleConflict(conflict: RuleConflict): Promise<string> {
    try {
      const prompt = `
        Resolve this sports federation rule conflict:
        
        Sport: ${conflict.sport}
        Rule Type: ${conflict.ruleType}
        Federation 1 (${conflict.conflictingRules.federation1.id}): ${JSON.stringify(conflict.conflictingRules.federation1.rule)}
        Federation 2 (${conflict.conflictingRules.federation2.id}): ${JSON.stringify(conflict.conflictingRules.federation2.rule)}
        
        Provide a resolution that:
        1. Prioritizes safety and fairness
        2. Maintains competitive integrity
        3. Is practical to implement
        4. Respects both federations' traditions
        
        Resolution:
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.3
      });

      const resolution = response.choices[0].message.content || 'No resolution provided';
      
      // Update conflict status
      conflict.status = 'resolved';
      conflict.resolution = resolution;
      conflict.resolvedBy = 'ai_system';
      conflict.resolvedAt = new Date();

      return resolution;
    } catch (error) {
      console.error('Error resolving rule conflict:', error);
      return 'Manual resolution required';
    }
  }

  async getLeagueInfo(leagueId: string): Promise<LeagueSeason | null> {
    return this.leagues.get(leagueId) || null;
  }

  async getLeagueStandings(leagueId: string): Promise<LeagueStanding[]> {
    const league = this.leagues.get(leagueId);
    return league ? league.standings : [];
  }

  async getAvailableLeagues(tierId?: string): Promise<LeagueSeason[]> {
    const leagues = Array.from(this.leagues.values());
    if (tierId) {
      return leagues.filter(l => l.leagueId === tierId);
    }
    return leagues;
  }

  async getTierInfo(tierId: string): Promise<LeagueTier | null> {
    return LEAGUE_TIERS[tierId] || null;
  }

  async getAgeBracketInfo(bracketId: string): Promise<AgeBracket | null> {
    return AGE_BRACKETS[bracketId] || null;
  }

  async checkAgeEligibility(playerAge: number, bracketId: string): Promise<boolean> {
    const bracket = AGE_BRACKETS[bracketId];
    if (!bracket) return false;
    return playerAge >= bracket.minAge && playerAge <= bracket.maxAge;
  }

  async getFallbackLeagueRules(sport: string, ageGroup: string): Promise<any> {
    // Enhanced fallback with sport-to-sport rule harmonization
    const baseRules = getSportRule(sport);
    const ageBracket = AGE_BRACKETS[ageGroup];
    
    if (!baseRules || !ageBracket) {
      return this.getDefaultRules(sport);
    }

    // Harmonize rules across similar sports
    const harmonizedRules = this.harmonizeSportRules(sport, baseRules, ageBracket);
    return harmonizedRules;
  }

  private harmonizeSportRules(sport: string, baseRules: any, ageBracket: AgeBracket): any {
    const harmonized = { ...baseRules };

    // Apply age-specific modifications
    if (ageBracket.sportSpecificRules[sport]) {
      Object.assign(harmonized, ageBracket.sportSpecificRules[sport]);
    }

    // Harmonize with similar sports
    const similarSports = this.getSimilarSports(sport);
    for (const similarSport of similarSports) {
      const similarRules = getSportRule(similarSport);
      if (similarRules) {
        harmonized = this.mergeCompatibleRules(harmonized, similarRules);
      }
    }

    return harmonized;
  }

  private getSimilarSports(sport: string): string[] {
    const sportGroups = {
      'basketball': ['basketball', 'netball'],
      'soccer': ['soccer', 'futsal', 'indoor_soccer'],
      'baseball': ['baseball', 'softball'],
      'volleyball': ['volleyball', 'beach_volleyball'],
      'tennis': ['tennis', 'table_tennis', 'badminton']
    };

    return sportGroups[sport] || [sport];
  }

  private mergeCompatibleRules(baseRules: any, similarRules: any): any {
    // Merge compatible rules while preserving base sport specificity
    const merged = { ...baseRules };

    // Merge scoring systems if compatible
    if (similarRules.scoring && !merged.scoring) {
      merged.scoring = similarRules.scoring;
    }

    // Merge timing rules if compatible
    if (similarRules.timing && !merged.timing) {
      merged.timing = similarRules.timing;
    }

    // Merge equipment rules if compatible
    if (similarRules.equipment && !merged.equipment) {
      merged.equipment = { ...merged.equipment, ...similarRules.equipment };
    }

    return merged;
  }

  private getDefaultRules(sport: string): any {
    return {
      sport,
      primaryStats: ['score', 'time'],
      secondaryStats: ['accuracy', 'efficiency'],
      rules: {
        gameDuration: 60,
        scoring: 'points',
        equipment: 'standard'
      }
    };
  }
}

// Export singleton instance
export const leagueEngine = new LeagueEngine(); 