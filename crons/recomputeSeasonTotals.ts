/* SportBeaconAI - Season Totals Recomputation Cron
   Periodically recomputes season and career totals based on verified stat lines
*/

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { 
  ID, 
  Season, 
  BasketballStatLine, 
  FootballStatLine, 
  StatLine,
  Sport 
} from '../src/domain/types';

// ============================================================================
// RECOMPUTATION INTERFACES
// ============================================================================

export interface RecomputationStats {
  athletesProcessed: number;
  seasonsUpdated: number;
  statLinesProcessed: number;
  errors: number;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface SeasonTotals {
  // Basketball totals
  basketball?: {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    threePointersMade: number;
    threePointersAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    minutesPlayed: number;
  };
  
  // Football totals
  football?: {
    passingYards: number;
    passingAttempts: number;
    passingCompletions: number;
    passingTouchdowns: number;
    interceptions: number;
    rushingYards: number;
    rushingAttempts: number;
    rushingTouchdowns: number;
    receivingYards: number;
    receivingReceptions: number;
    receivingTouchdowns: number;
    tackles: number;
    sacks: number;
    fumblesForced: number;
    fumblesRecovered: number;
  };
  
  // Common totals
  gamesPlayed: number;
  gamesStarted: number;
}

// ============================================================================
// CRON FUNCTION
// ============================================================================

export const recomputeSeasonTotals = onSchedule(
  {
    schedule: 'every 6 hours', // Run every 6 hours
    timeZone: 'America/New_York',
    memory: '2GiB',
    timeoutSeconds: 540
  },
  async () => {
    const db = getFirestore();
    const stats: RecomputationStats = {
      athletesProcessed: 0,
      seasonsUpdated: 0,
      statLinesProcessed: 0,
      errors: 0,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0
    };

    logger.info('Starting season totals recomputation...');

    try {
      // Get all athletes with seasons
      const athletesSnapshot = await db.collection('athletes').get();
      
      for (const athleteDoc of athletesSnapshot.docs) {
        const athleteId = athleteDoc.id;
        stats.athletesProcessed++;

        try {
          // Get all seasons for this athlete
          const seasonsSnapshot = await db
            .collection(`athletes/${athleteId}/seasons`)
            .get();

          for (const seasonDoc of seasonsSnapshot.docs) {
            const season = seasonDoc.data() as Season;
            
            try {
              // Recompute totals for this season
              const newTotals = await recomputeSeasonTotalsForAthlete(
                db,
                athleteId,
                season.id,
                season.sport
              );

              // Update season document with new totals
              await seasonDoc.ref.update({
                ...newTotals,
                updatedAt: new Date(),
                lastModifiedBy: 'system-recomputation'
              });

              stats.seasonsUpdated++;
            } catch (error) {
              logger.error(`Error recomputing season ${season.id} for athlete ${athleteId}:`, error);
              stats.errors++;
            }
          }
        } catch (error) {
          logger.error(`Error processing athlete ${athleteId}:`, error);
          stats.errors++;
        }
      }

      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      logger.info('Season totals recomputation completed:', stats);

      // Log completion to admin collection
      await db.collection('adminLogs').add({
        type: 'season_totals_recomputation',
        stats,
        timestamp: new Date(),
        success: stats.errors === 0
      });

    } catch (error) {
      logger.error('Season totals recomputation failed:', error);
      
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

      // Log failure to admin collection
      await db.collection('adminLogs').add({
        type: 'season_totals_recomputation',
        stats,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }
);

// ============================================================================
// RECOMPUTATION LOGIC
// ============================================================================

async function recomputeSeasonTotalsForAthlete(
  db: FirebaseFirestore.Firestore,
  athleteId: ID,
  seasonId: ID,
  sport: Sport
): Promise<Partial<SeasonTotals>> {
  
  // Get all verified stat lines for this season
  const statLinesSnapshot = await db
    .collection(`athletes/${athleteId}/statLines`)
    .where('seasonId', '==', seasonId)
    .where('isVerified', '==', true)
    .get();

  const statLines = statLinesSnapshot.docs.map(doc => doc.data());
  
  // Get all games for this season to count games played
  const gamesSnapshot = await db
    .collection(`athletes/${athleteId}/games`)
    .where('seasonId', '==', seasonId)
    .where('didPlay', '==', true)
    .get();

  const gamesPlayed = gamesSnapshot.size;
  const gamesStarted = gamesSnapshot.docs.filter(doc => doc.data().didStart).length;

  // Initialize totals
  const totals: SeasonTotals = {
    gamesPlayed,
    gamesStarted
  };

  // Sport-specific totals
  if (sport === 'basketball') {
    totals.basketball = {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      minutesPlayed: 0
    };

    // Aggregate basketball stats
    for (const statLine of statLines) {
      const basketballStats = statLine as BasketballStatLine;
      if (totals.basketball) {
        totals.basketball.points += basketballStats.points || 0;
        totals.basketball.rebounds += basketballStats.rebounds || 0;
        totals.basketball.assists += basketballStats.assists || 0;
        totals.basketball.steals += basketballStats.steals || 0;
        totals.basketball.blocks += basketballStats.blocks || 0;
        totals.basketball.turnovers += basketballStats.turnovers || 0;
        totals.basketball.fieldGoalsMade += basketballStats.fieldGoalsMade || 0;
        totals.basketball.fieldGoalsAttempted += basketballStats.fieldGoalsAttempted || 0;
        totals.basketball.threePointersMade += basketballStats.threePointersMade || 0;
        totals.basketball.threePointersAttempted += basketballStats.threePointersAttempted || 0;
        totals.basketball.freeThrowsMade += basketballStats.freeThrowsMade || 0;
        totals.basketball.freeThrowsAttempted += basketballStats.freeThrowsAttempted || 0;
        totals.basketball.minutesPlayed += basketballStats.minutesPlayed || 0;
      }
    }
  } else if (sport === 'football') {
    totals.football = {
      passingYards: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      rushingYards: 0,
      rushingAttempts: 0,
      rushingTouchdowns: 0,
      receivingYards: 0,
      receivingReceptions: 0,
      receivingTouchdowns: 0,
      tackles: 0,
      sacks: 0,
      fumblesForced: 0,
      fumblesRecovered: 0
    };

    // Aggregate football stats
    for (const statLine of statLines) {
      const footballStats = statLine as FootballStatLine;
      if (totals.football) {
        totals.football.passingYards += footballStats.passingYards || 0;
        totals.football.passingAttempts += footballStats.passingAttempts || 0;
        totals.football.passingCompletions += footballStats.passingCompletions || 0;
        totals.football.passingTouchdowns += footballStats.passingTouchdowns || 0;
        totals.football.interceptions += footballStats.interceptions || 0;
        totals.football.rushingYards += footballStats.rushingYards || 0;
        totals.football.rushingAttempts += footballStats.rushingAttempts || 0;
        totals.football.rushingTouchdowns += footballStats.rushingTouchdowns || 0;
        totals.football.receivingYards += footballStats.receivingYards || 0;
        totals.football.receivingReceptions += footballStats.receivingReceptions || 0;
        totals.football.receivingTouchdowns += footballStats.receivingTouchdowns || 0;
        totals.football.tackles += footballStats.tackles || 0;
        totals.football.sacks += footballStats.sacks || 0;
        totals.football.fumblesForced += footballStats.fumblesForced || 0;
        totals.football.fumblesRecovered += footballStats.fumblesRecovered || 0;
      }
    }
  }

  return totals;
}

// ============================================================================
// MANUAL RECOMPUTATION FUNCTIONS
// ============================================================================

export async function recomputeAthleteSeason(
  athleteId: ID,
  seasonId: ID
): Promise<SeasonTotals | null> {
  const db = getFirestore();
  
  try {
    // Get season document
    const seasonDoc = await db
      .collection(`athletes/${athleteId}/seasons`)
      .doc(seasonId)
      .get();

    if (!seasonDoc.exists) {
      throw new Error(`Season ${seasonId} not found for athlete ${athleteId}`);
    }

    const season = seasonDoc.data() as Season;
    
    // Recompute totals
    const newTotals = await recomputeSeasonTotalsForAthlete(
      db,
      athleteId,
      seasonId,
      season.sport
    );

    // Update season document
    await seasonDoc.ref.update({
      ...newTotals,
      updatedAt: new Date(),
      lastModifiedBy: 'manual-recomputation'
    });

    return newTotals as SeasonTotals;
  } catch (error) {
    logger.error(`Failed to recompute season ${seasonId} for athlete ${athleteId}:`, error);
    return null;
  }
}

export async function recomputeAllAthleteSeasons(athleteId: ID): Promise<{
  seasonsUpdated: number;
  errors: number;
}> {
  const db = getFirestore();
  let seasonsUpdated = 0;
  let errors = 0;

  try {
    // Get all seasons for athlete
    const seasonsSnapshot = await db
      .collection(`athletes/${athleteId}/seasons`)
      .get();

    for (const seasonDoc of seasonsSnapshot.docs) {
      const season = seasonDoc.data() as Season;
      
      try {
        const newTotals = await recomputeSeasonTotalsForAthlete(
          db,
          athleteId,
          season.id,
          season.sport
        );

        await seasonDoc.ref.update({
          ...newTotals,
          updatedAt: new Date(),
          lastModifiedBy: 'manual-recomputation'
        });

        seasonsUpdated++;
      } catch (error) {
        logger.error(`Error recomputing season ${season.id}:`, error);
        errors++;
      }
    }
  } catch (error) {
    logger.error(`Failed to recompute seasons for athlete ${athleteId}:`, error);
    errors++;
  }

  return { seasonsUpdated, errors };
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export async function validateSeasonTotals(
  athleteId: ID,
  seasonId: ID
): Promise<{
  isValid: boolean;
  discrepancies: string[];
  expectedTotals: SeasonTotals;
  actualTotals: SeasonTotals;
}> {
  const db = getFirestore();
  const discrepancies: string[] = [];
  
  try {
    // Get season document
    const seasonDoc = await db
      .collection(`athletes/${athleteId}/seasons`)
      .doc(seasonId)
      .get();

    if (!seasonDoc.exists) {
      throw new Error(`Season ${seasonId} not found`);
    }

    const season = seasonDoc.data() as Season;
    
    // Recompute expected totals
    const expectedTotals = await recomputeSeasonTotalsForAthlete(
      db,
      athleteId,
      seasonId,
      season.sport
    );

    // Get actual totals from season document
    const actualTotals = {
      gamesPlayed: season.gamesPlayed || 0,
      gamesStarted: season.gamesStarted || 0,
      basketball: season.basketballTotals,
      football: season.footballTotals
    };

    // Compare totals
    if (expectedTotals.gamesPlayed !== actualTotals.gamesPlayed) {
      discrepancies.push(`Games played: expected ${expectedTotals.gamesPlayed}, actual ${actualTotals.gamesPlayed}`);
    }

    if (expectedTotals.gamesStarted !== actualTotals.gamesStarted) {
      discrepancies.push(`Games started: expected ${expectedTotals.gamesStarted}, actual ${actualTotals.gamesStarted}`);
    }

    // Sport-specific validation
    if (season.sport === 'basketball' && expectedTotals.basketball && actualTotals.basketball) {
      const expected = expectedTotals.basketball;
      const actual = actualTotals.basketball;

      if (expected.points !== actual.points) {
        discrepancies.push(`Basketball points: expected ${expected.points}, actual ${actual.points}`);
      }
      // Add more basketball field validations as needed
    }

    if (season.sport === 'football' && expectedTotals.football && actualTotals.football) {
      const expected = expectedTotals.football;
      const actual = actualTotals.football;

      if (expected.passingYards !== actual.passingYards) {
        discrepancies.push(`Football passing yards: expected ${expected.passingYards}, actual ${actual.passingYards}`);
      }
      // Add more football field validations as needed
    }

    return {
      isValid: discrepancies.length === 0,
      discrepancies,
      expectedTotals: expectedTotals as SeasonTotals,
      actualTotals: actualTotals as SeasonTotals
    };
  } catch (error) {
    logger.error(`Failed to validate season totals:`, error);
    return {
      isValid: false,
      discrepancies: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      expectedTotals: {} as SeasonTotals,
      actualTotals: {} as SeasonTotals
    };
  }
}
