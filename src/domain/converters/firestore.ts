/* SportBeaconAI - Firestore Converters
   Type-safe Firestore converters for athlete domain entities
*/

import { 
  DocumentData, 
  FirestoreDataConverter, 
  QueryDocumentSnapshot, 
  WithFieldValue,
  Timestamp
} from 'firebase/firestore';
import {
  Athlete,
  Season,
  Game,
  BasketballStatLine,
  FootballStatLine,
  Highlight,
  FeedbackEvent,
  ConsentRecord,
  AdminQueueItem,
  Provenance,
  SourceLink,
  VerificationRecord,
  AthleteSchema,
  SeasonSchema,
  GameSchema,
  BasketballStatLineSchema,
  FootballStatLineSchema,
  HighlightSchema,
  FeedbackEventSchema,
  ConsentRecordSchema,
  AdminQueueItemSchema,
  ProvenanceSchema,
  SourceLinkSchema,
  VerificationRecordSchema
} from '../schemas/athlete';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function convertTimestamps(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  
  if (data instanceof Date) {
    return Timestamp.fromDate(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  
  if (typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertTimestamps(value);
    }
    return converted;
  }
  
  return data;
}

// ============================================================================
// ATHLETE CONVERTER
// ============================================================================

export const athleteConverter: FirestoreDataConverter<Athlete> = {
  toFirestore(athlete: WithFieldValue<Athlete>): DocumentData {
    const data = convertTimestamps(athlete);
    // Validate before saving
    const validated = AthleteSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Athlete {
    const data = snapshot.data();
    // Convert Firestore timestamps to Date objects
    const converted = convertTimestamps(data);
    // Validate and return
    return AthleteSchema.parse(converted);
  }
};

// ============================================================================
// SEASON CONVERTER
// ============================================================================

export const seasonConverter: FirestoreDataConverter<Season> = {
  toFirestore(season: WithFieldValue<Season>): DocumentData {
    const data = convertTimestamps(season);
    const validated = SeasonSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Season {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return SeasonSchema.parse(converted);
  }
};

// ============================================================================
// GAME CONVERTER
// ============================================================================

export const gameConverter: FirestoreDataConverter<Game> = {
  toFirestore(game: WithFieldValue<Game>): DocumentData {
    const data = convertTimestamps(game);
    const validated = GameSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Game {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return GameSchema.parse(converted);
  }
};

// ============================================================================
// BASKETBALL STAT LINE CONVERTER
// ============================================================================

export const basketballStatLineConverter: FirestoreDataConverter<BasketballStatLine> = {
  toFirestore(statLine: WithFieldValue<BasketballStatLine>): DocumentData {
    const data = convertTimestamps(statLine);
    const validated = BasketballStatLineSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): BasketballStatLine {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return BasketballStatLineSchema.parse(converted);
  }
};

// ============================================================================
// FOOTBALL STAT LINE CONVERTER
// ============================================================================

export const footballStatLineConverter: FirestoreDataConverter<FootballStatLine> = {
  toFirestore(statLine: WithFieldValue<FootballStatLine>): DocumentData {
    const data = convertTimestamps(statLine);
    const validated = FootballStatLineSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): FootballStatLine {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return FootballStatLineSchema.parse(converted);
  }
};

// ============================================================================
// HIGHLIGHT CONVERTER
// ============================================================================

export const highlightConverter: FirestoreDataConverter<Highlight> = {
  toFirestore(highlight: WithFieldValue<Highlight>): DocumentData {
    const data = convertTimestamps(highlight);
    const validated = HighlightSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Highlight {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return HighlightSchema.parse(converted);
  }
};

// ============================================================================
// FEEDBACK EVENT CONVERTER
// ============================================================================

export const feedbackEventConverter: FirestoreDataConverter<FeedbackEvent> = {
  toFirestore(feedbackEvent: WithFieldValue<FeedbackEvent>): DocumentData {
    const data = convertTimestamps(feedbackEvent);
    const validated = FeedbackEventSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): FeedbackEvent {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return FeedbackEventSchema.parse(converted);
  }
};

// ============================================================================
// CONSENT RECORD CONVERTER
// ============================================================================

export const consentRecordConverter: FirestoreDataConverter<ConsentRecord> = {
  toFirestore(consentRecord: WithFieldValue<ConsentRecord>): DocumentData {
    const data = convertTimestamps(consentRecord);
    const validated = ConsentRecordSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): ConsentRecord {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return ConsentRecordSchema.parse(converted);
  }
};

// ============================================================================
// ADMIN QUEUE ITEM CONVERTER
// ============================================================================

export const adminQueueItemConverter: FirestoreDataConverter<AdminQueueItem> = {
  toFirestore(queueItem: WithFieldValue<AdminQueueItem>): DocumentData {
    const data = convertTimestamps(queueItem);
    const validated = AdminQueueItemSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): AdminQueueItem {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return AdminQueueItemSchema.parse(converted);
  }
};

// ============================================================================
// PROVENANCE CONVERTER
// ============================================================================

export const provenanceConverter: FirestoreDataConverter<Provenance> = {
  toFirestore(provenance: WithFieldValue<Provenance>): DocumentData {
    const data = convertTimestamps(provenance);
    const validated = ProvenanceSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): Provenance {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return ProvenanceSchema.parse(converted);
  }
};

// ============================================================================
// SOURCE LINK CONVERTER
// ============================================================================

export const sourceLinkConverter: FirestoreDataConverter<SourceLink> = {
  toFirestore(sourceLink: WithFieldValue<SourceLink>): DocumentData {
    const data = convertTimestamps(sourceLink);
    const validated = SourceLinkSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): SourceLink {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return SourceLinkSchema.parse(converted);
  }
};

// ============================================================================
// VERIFICATION RECORD CONVERTER
// ============================================================================

export const verificationRecordConverter: FirestoreDataConverter<VerificationRecord> = {
  toFirestore(verificationRecord: WithFieldValue<VerificationRecord>): DocumentData {
    const data = convertTimestamps(verificationRecord);
    const validated = VerificationRecordSchema.parse(data);
    return validated as DocumentData;
  },

  fromFirestore(snapshot: QueryDocumentSnapshot): VerificationRecord {
    const data = snapshot.data();
    const converted = convertTimestamps(data);
    return VerificationRecordSchema.parse(converted);
  }
};

// ============================================================================
// CONVERTER REGISTRY
// ============================================================================

export const Converters = {
  athlete: athleteConverter,
  season: seasonConverter,
  game: gameConverter,
  basketballStatLine: basketballStatLineConverter,
  footballStatLine: footballStatLineConverter,
  highlight: highlightConverter,
  feedbackEvent: feedbackEventConverter,
  consentRecord: consentRecordConverter,
  adminQueueItem: adminQueueItemConverter,
  provenance: provenanceConverter,
  sourceLink: sourceLinkConverter,
  verificationRecord: verificationRecordConverter
} as const;

// ============================================================================
// UTILITY FUNCTIONS FOR COLLECTIONS
// ============================================================================

export function getConverter<T>(entityType: keyof typeof Converters): FirestoreDataConverter<T> {
  return Converters[entityType] as FirestoreDataConverter<T>;
}

export function createCollectionPath(athleteId: string, collection: string, itemId?: string): string {
  if (itemId) {
    return `athletes/${athleteId}/${collection}/${itemId}`;
  }
  return `athletes/${athleteId}/${collection}`;
}

export function createAdminCollectionPath(queueType: string, itemId?: string): string {
  if (itemId) {
    return `adminQueues/${queueType}/items/${itemId}`;
  }
  return `adminQueues/${queueType}/items`;
}
