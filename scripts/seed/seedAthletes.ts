/* SportBeaconAI - Athlete Seed Data Script
   Generates realistic athlete profiles, stats, and highlights for testing
*/

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { 
  Athlete, 
  Season, 
  Game, 
  BasketballStatLine, 
  FootballStatLine, 
  Highlight, 
  SourceLink,
  Sport,
  ID 
} from '../../src/domain/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SEED_CONFIG = {
  athletes: 25,
  statsPerAthlete: 4, // Average stats per athlete
  highlightsPerAthlete: 1.6, // Average highlights per athlete
  sports: ['basketball', 'football'] as Sport[],
  schools: [
    'Lincoln High School',
    'Washington High School',
    'Roosevelt High School',
    'Kennedy High School',
    'Jefferson High School'
  ],
  teams: [
    'Varsity',
    'JV',
    'Freshman',
    'Club'
  ]
};

// ============================================================================
// DATA GENERATORS
// ============================================================================

class AthleteDataGenerator {
  private usedNames = new Set<string>();
  private usedEmails = new Set<string>();

  generateAthlete(seed: number): Athlete {
    const firstName = this.getRandomFirstName(seed);
    const lastName = this.getRandomLastName(seed + 1);
    const fullName = `${firstName} ${lastName}`;
    
    // Ensure unique names
    if (this.usedNames.has(fullName)) {
      return this.generateAthlete(seed + 1000);
    }
    this.usedNames.add(fullName);

    const email = this.generateEmail(firstName, lastName, seed);
    const graduationYear = 2023 + Math.floor(Math.random() * 3); // 2023-2025
    const birthYear = graduationYear - 18;
    const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);

    const sports = this.getRandomSports(seed);
    const primarySport = sports[0];
    const positions = this.generatePositions(sports);

    return {
      id: `athlete_${seed}`,
      firstName,
      lastName,
      preferredName: Math.random() > 0.7 ? this.generateNickname(firstName) : undefined,
      dateOfBirth,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      email,
      sports,
      primarySport,
      positions,
      graduationYear,
      currentSchool: this.getRandomSchool(seed),
      schoolType: 'high_school',
      height: this.generateHeight(),
      weight: this.generateWeight(),
      isPublic: Math.random() > 0.2, // 80% public
      isClaimed: Math.random() > 0.3, // 70% claimed
      claimedBy: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
      claimedAt: Math.random() > 0.3 ? new Date() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      verificationStatus: Math.random() > 0.4 ? 'verified' : 'pending',
      qualityScore: 0.7 + Math.random() * 0.3, // 0.7-1.0
      tags: this.generateTags(primarySport),
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateSeason(athleteId: ID, sport: Sport, year: number, seed: number): Season {
    const season = this.getRandomSeason(seed);
    
    return {
      id: `season_${athleteId}_${sport}_${year}`,
      athleteId,
      sport,
      year,
      season,
      teamName: this.getRandomTeam(seed),
      teamLevel: this.getRandomTeamLevel(seed),
      league: this.generateLeague(sport, seed),
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      position: this.getRandomPosition(sport, seed),
      gamesPlayed: Math.floor(Math.random() * 20) + 5,
      gamesStarted: Math.floor(Math.random() * 15) + 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      isVerified: Math.random() > 0.3,
      verifiedBy: Math.random() > 0.3 ? `coach_${Math.floor(Math.random() * 50)}` : undefined,
      verifiedAt: Math.random() > 0.3 ? new Date() : undefined,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateGame(athleteId: ID, seasonId: ID, sport: Sport, seed: number): Game {
    const gameDate = this.generateGameDate(seed);
    const opponent = this.generateOpponent(seed);
    
    return {
      id: `game_${athleteId}_${Date.now()}_${seed}`,
      athleteId,
      seasonId,
      sport,
      gameDate,
      opponent,
      isHomeGame: Math.random() > 0.5,
      gameType: this.getRandomGameType(seed),
      level: 'varsity',
      teamScore: Math.floor(Math.random() * 100) + 50,
      opponentScore: Math.floor(Math.random() * 100) + 50,
      gameResult: this.generateGameResult(seed),
      didPlay: Math.random() > 0.1, // 90% played
      didStart: Math.random() > 0.3, // 70% started
      minutesPlayed: Math.floor(Math.random() * 40) + 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      isVerified: Math.random() > 0.2,
      verifiedBy: Math.random() > 0.2 ? `coach_${Math.floor(Math.random() * 50)}` : undefined,
      verifiedAt: Math.random() > 0.2 ? new Date() : undefined,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateBasketballStatLine(athleteId: ID, seasonId: ID, gameId: ID, seed: number): BasketballStatLine {
    return {
      id: `stat_${athleteId}_${Date.now()}_${seed}`,
      athleteId,
      seasonId,
      gameId,
      minutesPlayed: Math.floor(Math.random() * 40) + 10,
      points: Math.floor(Math.random() * 30),
      rebounds: Math.floor(Math.random() * 15),
      assists: Math.floor(Math.random() * 10),
      steals: Math.floor(Math.random() * 5),
      blocks: Math.floor(Math.random() * 5),
      turnovers: Math.floor(Math.random() * 8),
      personalFouls: Math.floor(Math.random() * 6),
      fieldGoalsMade: Math.floor(Math.random() * 12),
      fieldGoalsAttempted: Math.floor(Math.random() * 20) + 5,
      threePointersMade: Math.floor(Math.random() * 6),
      threePointersAttempted: Math.floor(Math.random() * 12),
      freeThrowsMade: Math.floor(Math.random() * 8),
      freeThrowsAttempted: Math.floor(Math.random() * 12),
      fieldGoalPercentage: Math.random() * 0.6 + 0.3, // 30-90%
      threePointPercentage: Math.random() * 0.5 + 0.2, // 20-70%
      freeThrowPercentage: Math.random() * 0.4 + 0.6, // 60-100%
      plusMinus: Math.floor(Math.random() * 40) - 20, // -20 to +20
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      isVerified: Math.random() > 0.3,
      verifiedBy: Math.random() > 0.3 ? `coach_${Math.floor(Math.random() * 50)}` : undefined,
      verifiedAt: Math.random() > 0.3 ? new Date() : undefined,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateFootballStatLine(athleteId: ID, seasonId: ID, gameId: ID, seed: number): FootballStatLine {
    return {
      id: `stat_${athleteId}_${Date.now()}_${seed}`,
      athleteId,
      seasonId,
      gameId,
      passingYards: Math.floor(Math.random() * 300),
      passingAttempts: Math.floor(Math.random() * 30),
      passingCompletions: Math.floor(Math.random() * 25),
      passingTouchdowns: Math.floor(Math.random() * 4),
      interceptions: Math.floor(Math.random() * 3),
      rushingYards: Math.floor(Math.random() * 200),
      rushingAttempts: Math.floor(Math.random() * 20),
      rushingTouchdowns: Math.floor(Math.random() * 3),
      rushingLongest: Math.floor(Math.random() * 50) + 10,
      receivingYards: Math.floor(Math.random() * 150),
      receivingReceptions: Math.floor(Math.random() * 10),
      receivingTouchdowns: Math.floor(Math.random() * 3),
      receivingLongest: Math.floor(Math.random() * 40) + 10,
      tackles: Math.floor(Math.random() * 15),
      tacklesForLoss: Math.floor(Math.random() * 5),
      sacks: Math.floor(Math.random() * 3),
      fumblesForced: Math.floor(Math.random() * 2),
      fumblesRecovered: Math.floor(Math.random() * 2),
      passesDefended: Math.floor(Math.random() * 8),
      kickoffReturns: Math.floor(Math.random() * 5),
      kickoffReturnYards: Math.floor(Math.random() * 100),
      puntReturns: Math.floor(Math.random() * 5),
      puntReturnYards: Math.floor(Math.random() * 80),
      completionPercentage: Math.random() * 0.4 + 0.5, // 50-90%
      yardsPerAttempt: Math.random() * 5 + 5, // 5-10
      yardsPerCompletion: Math.random() * 10 + 10, // 10-20
      passerRating: Math.random() * 60 + 80, // 80-140
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      isVerified: Math.random() > 0.3,
      verifiedBy: Math.random() > 0.3 ? `coach_${Math.floor(Math.random() * 50)}` : undefined,
      verifiedAt: Math.random() > 0.3 ? new Date() : undefined,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  generateHighlight(athleteId: ID, sport: Sport, seed: number): Highlight {
    const highlightTypes = ['play', 'game_highlights', 'season_highlights', 'training', 'interview'];
    const highlightType = highlightTypes[Math.floor(Math.random() * highlightTypes.length)] as any;
    
    const sourceLinks: SourceLink[] = [{
      id: `source_${Date.now()}_${seed}`,
      type: Math.random() > 0.5 ? 'youtube' : 'hudl',
      url: this.generateSourceUrl(seed),
      title: this.generateHighlightTitle(sport, highlightType, seed),
      description: this.generateHighlightDescription(sport, seed),
      thumbnailUrl: this.generateThumbnailUrl(seed),
      embedCode: this.generateEmbedCode(seed),
      duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      addedBy: 'system',
      addedAt: new Date(),
      isVerified: Math.random() > 0.4,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    }];

    return {
      id: `highlight_${athleteId}_${Date.now()}_${seed}`,
      athleteId,
      sport,
      title: this.generateHighlightTitle(sport, highlightType, seed),
      description: this.generateHighlightDescription(sport, seed),
      sourceLinks,
      thumbnailUrl: this.generateThumbnailUrl(seed),
      highlightType,
      tags: this.generateHighlightTags(sport, highlightType),
      isPublic: Math.random() > 0.2,
      isFeatured: Math.random() > 0.8,
      qualityScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      isVerified: Math.random() > 0.4,
      verifiedBy: Math.random() > 0.4 ? `coach_${Math.floor(Math.random() * 50)}` : undefined,
      verifiedAt: Math.random() > 0.4 ? new Date() : undefined,
      metadata: {
        seed: seed,
        generatedAt: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getRandomFirstName(seed: number): string {
    const firstNames = [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
      'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
      'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'
    ];
    return firstNames[seed % firstNames.length];
  }

  private getRandomLastName(seed: number): string {
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
    ];
    return lastNames[seed % lastNames.length];
  }

  private generateNickname(firstName: string): string {
    const nicknames: Record<string, string[]> = {
      'James': ['Jim', 'Jimmy', 'Jamie'],
      'John': ['Johnny', 'Jack'],
      'Robert': ['Bob', 'Bobby', 'Rob'],
      'Michael': ['Mike', 'Mickey'],
      'William': ['Will', 'Billy', 'Bill'],
      'David': ['Dave', 'Davey'],
      'Richard': ['Rick', 'Rich', 'Dick'],
      'Joseph': ['Joe', 'Joey'],
      'Thomas': ['Tom', 'Tommy'],
      'Christopher': ['Chris', 'Topher']
    };
    
    const options = nicknames[firstName] || [firstName];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateEmail(firstName: string, lastName: string, seed: number): string {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = domains[seed % domains.length];
    const number = Math.floor(Math.random() * 100);
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${number}@${domain}`;
  }

  private getRandomSports(seed: number): Sport[] {
    const sportCount = Math.floor(Math.random() * 2) + 1; // 1-2 sports
    const shuffled = SEED_CONFIG.sports.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sportCount);
  }

  private generatePositions(sports: Sport[]): Record<Sport, string[]> {
    const positions: Record<Sport, string[]> = {
      basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Defensive Back'],
      soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
      baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field'],
      softball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field'],
      volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite Hitter', 'Libero', 'Defensive Specialist'],
      track: ['Sprint', 'Distance', 'Field Events'],
      swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley']
    };

    const result: Record<Sport, string[]> = {} as any;
    sports.forEach(sport => {
      const sportPositions = positions[sport] || [];
      const selectedPositions = sportPositions.slice(0, Math.floor(Math.random() * 2) + 1);
      result[sport] = selectedPositions;
    });

    return result;
  }

  private getRandomSchool(seed: number): string {
    return SEED_CONFIG.schools[seed % SEED_CONFIG.schools.length];
  }

  private generateHeight(): number {
    return Math.floor(Math.random() * 24) + 60; // 5'0" to 6'11"
  }

  private generateWeight(): number {
    return Math.floor(Math.random() * 100) + 120; // 120-220 lbs
  }

  private generateTags(sport: Sport): string[] {
    const baseTags = ['varsity', 'high-school'];
    const sportTags = {
      basketball: ['basketball', 'hoops'],
      football: ['football', 'gridiron'],
      soccer: ['soccer', 'futbol'],
      baseball: ['baseball', 'diamond'],
      softball: ['softball', 'fastpitch'],
      volleyball: ['volleyball', 'spike'],
      track: ['track', 'running'],
      swimming: ['swimming', 'aquatics']
    };

    return [...baseTags, ...(sportTags[sport] || [sport])];
  }

  private getRandomSeason(seed: number): 'fall' | 'winter' | 'spring' | 'summer' {
    const seasons = ['fall', 'winter', 'spring', 'summer'];
    return seasons[seed % seasons.length] as any;
  }

  private getRandomTeam(seed: number): string {
    return SEED_CONFIG.teams[seed % SEED_CONFIG.teams.length];
  }

  private getRandomTeamLevel(seed: number): 'varsity' | 'jv' | 'freshman' | 'club' | 'travel' {
    const levels = ['varsity', 'jv', 'freshman', 'club', 'travel'];
    return levels[seed % levels.length] as any;
  }

  private generateLeague(sport: Sport, seed: number): string {
    const leagues = {
      basketball: ['State Championship', 'Regional', 'District'],
      football: ['State Championship', 'Regional', 'District'],
      soccer: ['State Championship', 'Regional', 'District'],
      baseball: ['State Championship', 'Regional', 'District'],
      softball: ['State Championship', 'Regional', 'District'],
      volleyball: ['State Championship', 'Regional', 'District'],
      track: ['State Championship', 'Regional', 'District'],
      swimming: ['State Championship', 'Regional', 'District']
    };

    const sportLeagues = leagues[sport] || ['League'];
    return sportLeagues[seed % sportLeagues.length];
  }

  private getRandomPosition(sport: Sport, seed: number): string {
    const positions = {
      basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Linebacker', 'Defensive Back'],
      soccer: ['Midfielder', 'Forward', 'Defender', 'Goalkeeper'],
      baseball: ['Pitcher', 'Catcher', 'First Base', 'Shortstop', 'Outfield'],
      softball: ['Pitcher', 'Catcher', 'First Base', 'Shortstop', 'Outfield'],
      volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Libero'],
      track: ['Sprint', 'Distance', 'Field Events'],
      swimming: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly']
    };

    const sportPositions = positions[sport] || [sport];
    return sportPositions[seed % sportPositions.length];
  }

  private generateGameDate(seed: number): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * 365); // Within the last year
    const gameDate = new Date(now);
    gameDate.setDate(now.getDate() - daysAgo);
    return gameDate;
  }

  private generateOpponent(seed: number): string {
    const opponents = [
      'Central High School', 'East High School', 'West High School', 'North High School', 'South High School',
      'Riverside High School', 'Oakwood High School', 'Maple High School', 'Pine High School', 'Cedar High School'
    ];
    return opponents[seed % opponents.length];
  }

  private getRandomGameType(seed: number): 'regular' | 'playoff' | 'championship' | 'exhibition' | 'scrimmage' {
    const types = ['regular', 'playoff', 'championship', 'exhibition', 'scrimmage'];
    return types[seed % types.length] as any;
  }

  private generateGameResult(seed: number): 'win' | 'loss' | 'tie' | 'forfeit' | 'cancelled' {
    const results = ['win', 'loss', 'tie'];
    return results[seed % results.length] as any;
  }

  private generateSourceUrl(seed: number): string {
    const isYouTube = Math.random() > 0.5;
    if (isYouTube) {
      return `https://www.youtube.com/watch?v=${this.generateRandomId(seed)}`;
    } else {
      return `https://www.hudl.com/video/${this.generateRandomId(seed)}`;
    }
  }

  private generateHighlightTitle(sport: Sport, type: string, seed: number): string {
    const titles = {
      basketball: [
        'Amazing Three-Pointer',
        'Clutch Free Throws',
        'Great Rebound',
        'Perfect Pass',
        'Defensive Stop'
      ],
      football: [
        'Touchdown Pass',
        'Big Run',
        'Key Tackle',
        'Perfect Catch',
        'Game-Winning Play'
      ]
    };

    const sportTitles = titles[sport] || [`Great ${sport} Play`];
    return sportTitles[seed % sportTitles.length];
  }

  private generateHighlightDescription(sport: Sport, seed: number): string {
    const descriptions = {
      basketball: [
        'Outstanding performance in this game',
        'Key moment that helped secure the victory',
        'Excellent teamwork and execution',
        'Clutch play when it mattered most'
      ],
      football: [
        'Game-changing play that shifted momentum',
        'Outstanding individual effort',
        'Perfect execution of the play',
        'Key contribution to the team victory'
      ]
    };

    const sportDescriptions = descriptions[sport] || [`Great ${sport} highlight`];
    return sportDescriptions[seed % sportDescriptions.length];
  }

  private generateThumbnailUrl(seed: number): string {
    return `https://example.com/thumbnails/thumbnail_${seed}.jpg`;
  }

  private generateEmbedCode(seed: number): string {
    const isYouTube = Math.random() > 0.5;
    if (isYouTube) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.generateRandomId(seed)}" frameborder="0" allowfullscreen></iframe>`;
    } else {
      return `<iframe src="https://www.hudl.com/embed/${this.generateRandomId(seed)}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
    }
  }

  private generateHighlightTags(sport: Sport, type: string): string[] {
    const baseTags = [sport, type];
    const additionalTags = ['highlight', 'sports', 'athlete'];
    return [...baseTags, ...additionalTags];
  }

  private generateRandomId(seed: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < 11; i++) {
      result += chars.charAt((seed + i) % chars.length);
    }
    return result;
  }
}

// ============================================================================
// MAIN SEEDING FUNCTION
// ============================================================================

async function seedAthletes(deleteExisting: boolean = false): Promise<void> {
  console.log('🌱 Starting athlete seeding process...');

  try {
    // Initialize Firebase Admin
    if (!process.env.FIREBASE_CONFIG) {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'sportbeaconai-staging'
      });
    }

    const db = getFirestore();
    const generator = new AthleteDataGenerator();

    // Delete existing seed data if requested
    if (deleteExisting) {
      console.log('🗑️ Deleting existing seed data...');
      await deleteSeedData(db);
    }

    const createdIds: string[] = [];

    // Generate athletes
    console.log(`👥 Creating ${SEED_CONFIG.athletes} athletes...`);
    for (let i = 0; i < SEED_CONFIG.athletes; i++) {
      const athlete = generator.generateAthlete(i);
      await db.collection('athletes').doc(athlete.id).set(athlete);
      createdIds.push(athlete.id);

      // Generate seasons for each sport
      for (const sport of athlete.sports) {
        const year = athlete.graduationYear! - Math.floor(Math.random() * 3); // Last 3 years
        const season = generator.generateSeason(athlete.id, sport, year, i * 10);
        await db.collection(`athletes/${athlete.id}/seasons`).doc(season.id).set(season);

        // Generate games for the season
        const gameCount = Math.floor(Math.random() * 15) + 5; // 5-20 games
        for (let g = 0; g < gameCount; g++) {
          const game = generator.generateGame(athlete.id, season.id, sport, i * 100 + g);
          await db.collection(`athletes/${athlete.id}/games`).doc(game.id).set(game);

          // Generate stat line for some games
          if (Math.random() > 0.3) { // 70% of games have stats
            let statLine;
            if (sport === 'basketball') {
              statLine = generator.generateBasketballStatLine(athlete.id, season.id, game.id, i * 1000 + g);
            } else if (sport === 'football') {
              statLine = generator.generateFootballStatLine(athlete.id, season.id, game.id, i * 1000 + g);
            }

            if (statLine) {
              await db.collection(`athletes/${athlete.id}/statLines`).doc(statLine.id).set(statLine);
            }
          }
        }
      }

      // Generate highlights
      const highlightCount = Math.floor(Math.random() * 3) + 1; // 1-3 highlights
      for (let h = 0; h < highlightCount; h++) {
        const highlight = generator.generateHighlight(athlete.id, athlete.primarySport!, i * 100 + h);
        await db.collection(`athletes/${athlete.id}/highlights`).doc(highlight.id).set(highlight);
      }

      if ((i + 1) % 5 === 0) {
        console.log(`✅ Created ${i + 1}/${SEED_CONFIG.athletes} athletes`);
      }
    }

    // Generate summary statistics
    const totalStats = await getTotalStats(db);
    const totalHighlights = await getTotalHighlights(db);

    console.log('🎉 Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Athletes: ${SEED_CONFIG.athletes}`);
    console.log(`   - Stats: ${totalStats}`);
    console.log(`   - Highlights: ${totalHighlights}`);
    console.log(`   - Created IDs: ${createdIds.join(', ')}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function deleteSeedData(db: FirebaseFirestore.Firestore): Promise<void> {
  const batch = db.batch();
  let deleteCount = 0;

  // Delete athletes with seed tag
  const athletesSnapshot = await db.collection('athletes')
    .where('metadata.seed', '!=', null)
    .get();

  for (const doc of athletesSnapshot.docs) {
    const athleteId = doc.id;
    
    // Delete subcollections
    const subcollections = ['seasons', 'games', 'statLines', 'highlights', 'feedback', 'consents'];
    
    for (const subcollection of subcollections) {
      const subcollectionSnapshot = await db
        .collection(`athletes/${athleteId}/${subcollection}`)
        .get();
      
      for (const subDoc of subcollectionSnapshot.docs) {
        batch.delete(subDoc.ref);
        deleteCount++;
      }
    }

    // Delete athlete document
    batch.delete(doc.ref);
    deleteCount++;
  }

  await batch.commit();
  console.log(`🗑️ Deleted ${deleteCount} seed documents`);
}

async function getTotalStats(db: FirebaseFirestore.Firestore): Promise<number> {
  let total = 0;
  const athletesSnapshot = await db.collection('athletes').get();
  
  for (const athleteDoc of athletesSnapshot.docs) {
    const statsSnapshot = await db
      .collection(`athletes/${athleteDoc.id}/statLines`)
      .get();
    total += statsSnapshot.size;
  }
  
  return total;
}

async function getTotalHighlights(db: FirebaseFirestore.Firestore): Promise<number> {
  let total = 0;
  const athletesSnapshot = await db.collection('athletes').get();
  
  for (const athleteDoc of athletesSnapshot.docs) {
    const highlightsSnapshot = await db
      .collection(`athletes/${athleteDoc.id}/highlights`)
      .get();
    total += highlightsSnapshot.size;
  }
  
  return total;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const deleteExisting = args.includes('--delete');

  try {
    await seedAthletes(deleteExisting);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedAthletes, AthleteDataGenerator };
