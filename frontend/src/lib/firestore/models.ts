import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryConstraint,
  DocumentData,
  Timestamp,
  DocumentReference,
  CollectionReference
} from "firebase/firestore";
import { db } from "../firebase";
import type { 
  Location, 
  LocationPost, 
  FollowLocation, 
  HomeFeedItem,
  LocationFilters,
  PostFilters
} from "../../types";

// ============================================================================
// FIRESTORE CONVERTERS
// ============================================================================

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
const fromTimestamp = (timestamp: Timestamp | null | undefined): string | undefined => {
  return timestamp ? timestamp.toDate().toISOString() : undefined;
};

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
const toTimestamp = (date: Date | string | null | undefined): Timestamp | null => {
  if (!date) return null;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(dateObj);
};

/**
 * Location converter for Firestore
 */
export const locationConverter = {
  toFirestore: (location: Location): DocumentData => ({
    name: location.name,
    slug: location.slug,
    sport: location.sport,
    geo: location.geo,
    address: location.address,
    city: location.city,
    state: location.state,
    country: location.country,
    hours: location.hours,
    amenities: location.amenities,
    status: location.status,
    moderators: location.moderators,
    visibility: location.visibility,
    stats: {
      followers: location.stats.followers,
      posts: location.stats.posts,
      lastPostAt: toTimestamp(location.stats.lastPostAt)
    },
    createdAt: toTimestamp(location.createdAt),
    updatedAt: toTimestamp(location.updatedAt)
  }),
  
  fromFirestore: (snapshot: any, options: any): Location => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name,
      slug: data.slug,
      sport: data.sport,
      geo: data.geo,
      coordinates: data.coordinates || { lat: 0, lng: 0 },
      type: data.type || 'sports_facility',
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      hours: data.hours,
      amenities: data.amenities || [],
      status: data.status,
      moderators: data.moderators || [],
      visibility: data.visibility,
      stats: {
        followers: data.stats?.followers || 0,
        posts: data.stats?.posts || 0,
        lastPostAt: fromTimestamp(data.stats?.lastPostAt) || new Date().toISOString()
      },
      createdAt: fromTimestamp(data.createdAt) || new Date().toISOString(),
      updatedAt: fromTimestamp(data.updatedAt) || new Date().toISOString()
    };
  }
};

/**
 * LocationPost converter for Firestore
 */
export const locationPostConverter = {
  toFirestore: (post: LocationPost): DocumentData => ({
    locationId: post.locationId,
    authorId: post.authorId,
    type: post.type,
    text: post.text,
    media: post.media,
    poll: post.poll ? {
      ...post.poll,
      closesAt: toTimestamp(post.poll.closesAt)
    } : undefined,
    run: post.run ? {
      ...post.run,
      startsAt: toTimestamp(post.run.startsAt),
      endsAt: toTimestamp(post.run.endsAt)
    } : undefined,
    pinned: post.pinned || false,
    visibility: post.visibility,
    likeCount: post.likeCount || 0,
    replyCount: post.replyCount || 0,
    reportCount: post.reportCount || 0,
    deviceGeo: post.deviceGeo,
    createdAt: toTimestamp(post.createdAt),
    updatedAt: toTimestamp(post.updatedAt)
  }),
  
  fromFirestore: (snapshot: any, options: any): LocationPost => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      locationId: data.locationId,
      userId: data.authorId,
      authorId: data.authorId,
      content: data.text || '',
      type: data.type,
      text: data.text,
      media: data.media || [],
      poll: data.poll ? {
        ...data.poll,
        closesAt: fromTimestamp(data.poll.closesAt)
      } : undefined,
      run: data.run ? {
        ...data.run,
        startsAt: fromTimestamp(data.run.startsAt),
        endsAt: fromTimestamp(data.run.endsAt)
      } : undefined,
      pinned: data.pinned || false,
      visibility: data.visibility,
      likeCount: data.likeCount || 0,
      replyCount: data.replyCount || 0,
      reportCount: data.reportCount || 0,
      deviceGeo: data.deviceGeo,
      createdAt: fromTimestamp(data.createdAt) || new Date().toISOString(),
      updatedAt: fromTimestamp(data.updatedAt) || new Date().toISOString()
    };
  }
};

/**
 * FollowLocation converter for Firestore
 */
export const followLocationConverter = {
  toFirestore: (follow: FollowLocation): DocumentData => ({
    locationId: follow.locationId,
    userId: follow.userId,
    notifications: follow.notifications,
    createdAt: toTimestamp(follow.createdAt)
  }),
  
  fromFirestore: (snapshot: any, options: any): FollowLocation => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      locationId: data.locationId,
      userId: data.userId,
      notifications: data.notifications,
      createdAt: fromTimestamp(data.createdAt) || new Date().toISOString()
    };
  }
};

/**
 * HomeFeedItem converter for Firestore
 */
export const homeFeedItemConverter = {
  toFirestore: (item: HomeFeedItem): DocumentData => ({
    source: item.source,
    postRef: item.postRef,
    rank: item.rank,
    createdAt: toTimestamp(item.createdAt)
  }),
  
  fromFirestore: (snapshot: any, options: any): HomeFeedItem => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      type: data.type || 'post',
      data: data.postRef || {},
      source: data.source,
      postRef: data.postRef,
      rank: data.rank,
      createdAt: fromTimestamp(data.createdAt) || new Date().toISOString()
    };
  }
};

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

/**
 * Get collection reference for locations
 */
export const getLocationsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, "locations");
};

/**
 * Get collection reference for location threads
 */
export const getLocationThreadsCollection = (locationId: string): CollectionReference<DocumentData> => {
  return collection(db, "locations", locationId, "threads");
};

/**
 * Get collection reference for follows
 */
export const getFollowsCollection = (): CollectionReference<DocumentData> => {
  return collection(db, "follows_locations");
};

/**
 * Get collection reference for user's home location feed
 */
export const getUserHomeLocationFeedCollection = (userId: string): CollectionReference<DocumentData> => {
  return collection(db, "users", userId, "home_location_feed");
};

// ============================================================================
// QUERY BUILDERS
// ============================================================================

/**
 * Build query for locations with filters
 */
export const buildLocationsQuery = (filters: LocationFilters = {}): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];
  
  if (filters.sport) {
    constraints.push(where("sport", "==", filters.sport));
  }
  
  if (filters.status) {
    constraints.push(where("status", "==", filters.status));
  }
  
  if (filters.hasAmenities && filters.hasAmenities.length > 0) {
    // Note: This requires array-contains-any index
    constraints.push(where("amenities", "array-contains-any", filters.hasAmenities));
  }
  
  // Add default ordering
  constraints.push(orderBy("stats.followers", "desc"));
  
  return constraints;
};

/**
 * Build query for location posts with filters
 */
export const buildLocationPostsQuery = (
  locationId: string, 
  filters: PostFilters = {},
  pageSize: number = 20
): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [
    where("locationId", "==", locationId)
  ];
  
  if (filters.type) {
    constraints.push(where("type", "==", filters.type));
  }
  
  if (filters.visibility) {
    constraints.push(where("visibility", "==", filters.visibility));
  }
  
  if (filters.pinned !== undefined) {
    constraints.push(where("pinned", "==", filters.pinned));
  }
  
  if (filters.dateFrom) {
    constraints.push(where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom)));
  }
  
  if (filters.dateTo) {
    constraints.push(where("createdAt", "<=", Timestamp.fromDate(filters.dateTo)));
  }
  
  // Add default ordering (pinned first, then by creation date)
  constraints.push(orderBy("pinned", "desc"));
  constraints.push(orderBy("createdAt", "desc"));
  
  // Add limit
  constraints.push(limit(pageSize));
  
  return constraints;
};

/**
 * Build query for user's followed locations
 */
export const buildFollowedLocationsQuery = (userId: string): QueryConstraint[] => {
  return [
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  ];
};

/**
 * Build query for user's home location feed
 */
export const buildHomeLocationFeedQuery = (userId: string, pageSize: number = 20): QueryConstraint[] => {
  return [
    orderBy("createdAt", "desc"),
    limit(pageSize)
  ];
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get document reference for a location
 */
export const getLocationRef = (locationId: string): DocumentReference<DocumentData> => {
  return doc(db, "locations", locationId);
};

/**
 * Get document reference for a location post
 */
export const getLocationPostRef = (locationId: string, postId: string): DocumentReference<DocumentData> => {
  return doc(db, "locations", locationId, "threads", postId);
};

/**
 * Get document reference for a follow relationship
 */
export const getFollowLocationRef = (followId: string): DocumentReference<DocumentData> => {
  return doc(db, "follows_locations", followId);
};

/**
 * Get document reference for a home feed item
 */
export const getHomeFeedItemRef = (userId: string, itemId: string): DocumentReference<DocumentData> => {
  return doc(db, "users", userId, "home_location_feed", itemId);
};

/**
 * Create a unique follow document ID
 */
export const createFollowDocumentId = (userId: string, locationId: string): string => {
  return `${userId}_${locationId}`;
};

/**
 * Create a unique home feed item ID
 */
export const createHomeFeedItemId = (postId: string, userId: string): string => {
  return `${postId}_${userId}`;
};
