import { useState, useEffect, useCallback } from "react";
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { 
  Location, 
  LocationPost, 
  FollowLocation, 
  HomeFeedItem,
  LocationFilters,
  PostFilters
} from "../types";

// ============================================================================
// LOCATION HOOKS
// ============================================================================

/**
 * Hook to get location data by ID
 * @param locationId Location ID
 * @returns Location data, loading state, and error
 */
export function useLocation(locationId: string) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const locationRef = doc(db, "locations", locationId);
    const unsubscribe = onSnapshot(
      locationRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setLocation({
            id: doc.id,
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
              lastPostAt: data.stats?.lastPostAt?.toDate()?.toISOString() || new Date().toISOString()
            },
            createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
          });
        } else {
          setLocation(null);
          setError("Location not found");
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [locationId]);

  return { location, loading, error };
}

/**
 * Hook to get location posts with pagination
 * @param locationId Location ID
 * @param filters Post filters
 * @param pageSize Number of posts per page
 * @returns Posts, loading state, error, and pagination functions
 */
export function useLocationPosts(
  locationId: string, 
  filters: PostFilters = {}, 
  pageSize: number = 20
) {
  const [posts, setPosts] = useState<LocationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const loadPosts = useCallback(async (isInitial = false) => {
    if (!locationId) return;

    try {
      setLoading(true);
      setError(null);

      let q = query(
        collection(db, "locations", locationId, "threads"),
        orderBy("pinned", "desc"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      // Apply filters
      if (filters.type) {
        q = query(q, where("type", "==", filters.type));
      }
      if (filters.visibility) {
        q = query(q, where("visibility", "==", filters.visibility));
      }
      if (filters.pinned !== undefined) {
        q = query(q, where("pinned", "==", filters.pinned));
      }
      if (filters.dateFrom) {
        q = query(q, where("createdAt", ">=", Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        q = query(q, where("createdAt", "<=", Timestamp.fromDate(filters.dateTo)));
      }

      // Start after last document for pagination
      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        locationId,
        userId: doc.data().authorId,
        authorId: doc.data().authorId,
        content: doc.data().text || '',
        type: doc.data().type,
        text: doc.data().text,
        media: doc.data().media || [],
        poll: doc.data().poll,
        run: doc.data().run,
        pinned: doc.data().pinned || false,
        visibility: doc.data().visibility,
        likeCount: doc.data().likeCount || 0,
        replyCount: doc.data().replyCount || 0,
        reportCount: doc.data().reportCount || 0,
        deviceGeo: doc.data().deviceGeo,
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || new Date().toISOString()
      }));

      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setLoading(false);
    }
  }, [locationId, filters, pageSize, lastDoc]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  }, [loading, hasMore, loadPosts]);

  const refresh = useCallback(() => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    loadPosts(true);
  }, [loadPosts]);

  useEffect(() => {
    loadPosts(true);
  }, [locationId, filters.type, filters.visibility, filters.pinned]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}

/**
 * Hook to check if user is following a location
 * @param locationId Location ID
 * @param userId User ID
 * @returns Following state, loading state, and error
 */
export function useIsFollowingLocation(locationId: string, userId?: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followData, setFollowData] = useState<FollowLocation | null>(null);

  useEffect(() => {
    if (!locationId || !userId) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const followId = `${userId}_${locationId}`;
    const followRef = doc(db, "follows_locations", followId);
    
    const unsubscribe = onSnapshot(
      followRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setIsFollowing(true);
          setFollowData({
            id: doc.id,
            locationId: data.locationId,
            userId: data.userId,
            notifications: data.notifications,
            createdAt: data.createdAt?.toDate() || new Date()
          });
        } else {
          setIsFollowing(false);
          setFollowData(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [locationId, userId]);

  return { isFollowing, loading, error, followData };
}

/**
 * Hook to get user's followed locations
 * @param userId User ID
 * @returns Followed locations, loading state, and error
 */
export function useFollowedLocations(userId?: string) {
  const [followedLocations, setFollowedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFollowedLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "follows_locations"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const locationIds = snapshot.docs.map(doc => doc.data().locationId);
          
          if (locationIds.length === 0) {
            setFollowedLocations([]);
            setLoading(false);
            return;
          }

          // Fetch location data for each followed location
          const locationPromises = locationIds.map(async (locationId) => {
            const locationDoc = await getDoc(doc(db, "locations", locationId));
            if (locationDoc.exists()) {
              const data = locationDoc.data();
              return {
                id: locationDoc.id,
                name: data.name,
                slug: data.slug,
                sport: data.sport,
                geo: data.geo,
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
                  lastPostAt: data.stats?.lastPostAt?.toDate()
                },
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
              };
            }
            return null;
          });

          const locations = (await Promise.all(locationPromises)).filter(Boolean) as Location[];
          setFollowedLocations(locations);
          setLoading(false);

        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load followed locations");
          setLoading(false);
        }
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { followedLocations, loading, error };
}

/**
 * Hook to get user's home location feed
 * @param userId User ID
 * @param pageSize Number of feed items per page
 * @returns Feed items, loading state, error, and pagination functions
 */
export function useHomeLocationFeed(userId?: string, pageSize: number = 20) {
  const [feedItems, setFeedItems] = useState<HomeFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const loadFeed = useCallback(async (isInitial = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      let q = query(
        collection(db, "users", userId, "home_location_feed"),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      const newFeedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        type: doc.data().type || 'post',
        data: doc.data().postRef || {},
        source: doc.data().source,
        postRef: doc.data().postRef,
        rank: doc.data().rank,
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      }));

      if (isInitial) {
        setFeedItems(newFeedItems);
      } else {
        setFeedItems(prev => [...prev, ...newFeedItems]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === pageSize);
      setLoading(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
      setLoading(false);
    }
  }, [userId, pageSize, lastDoc]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadFeed(false);
    }
  }, [loading, hasMore, loadFeed]);

  const refresh = useCallback(() => {
    setFeedItems([]);
    setLastDoc(null);
    setHasMore(true);
    loadFeed(true);
  }, [loadFeed]);

  useEffect(() => {
    loadFeed(true);
  }, [userId]);

  return {
    feedItems,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
}

// ============================================================================
// LOCATION ACTIONS
// ============================================================================

/**
 * Follow a location
 * @param locationId Location ID
 * @param userId User ID
 * @param notifications Notification preference
 * @returns Success status and error message
 */
export async function followLocation(
  locationId: string, 
  userId: string, 
  notifications: "all" | "digest" | "mute" = "all"
): Promise<{ success: boolean; error?: string }> {
  try {
    const followId = `${userId}_${locationId}`;
    const followRef = doc(db, "follows_locations", followId);
    
    await setDoc(followRef, {
      locationId,
      userId,
      notifications,
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to follow location" 
    };
  }
}

/**
 * Unfollow a location
 * @param locationId Location ID
 * @param userId User ID
 * @returns Success status and error message
 */
export async function unfollowLocation(
  locationId: string, 
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const followId = `${userId}_${locationId}`;
    const followRef = doc(db, "follows_locations", followId);
    
    await deleteDoc(followRef);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to unfollow location" 
    };
  }
}

/**
 * Update notification preferences for a followed location
 * @param locationId Location ID
 * @param userId User ID
 * @param notifications New notification preference
 * @returns Success status and error message
 */
export async function updateLocationNotifications(
  locationId: string, 
  userId: string, 
  notifications: "all" | "digest" | "mute"
): Promise<{ success: boolean; error?: string }> {
  try {
    const followId = `${userId}_${locationId}`;
    const followRef = doc(db, "follows_locations", followId);
    
    await updateDoc(followRef, {
      notifications,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update notifications" 
    };
  }
}

/**
 * Create a new location post
 * @param locationId Location ID
 * @param postData Post data
 * @returns Success status, post ID, and error message
 */
export async function createLocationPost(
  locationId: string, 
  postData: Omit<LocationPost, "id" | "locationId" | "createdAt" | "updatedAt">
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const postRef = await addDoc(
      collection(db, "locations", locationId, "threads"),
      {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    return { success: true, postId: postRef.id };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create post" 
    };
  }
}

/**
 * Update a location post
 * @param locationId Location ID
 * @param postId Post ID
 * @param updates Post updates
 * @returns Success status and error message
 */
export async function updateLocationPost(
  locationId: string, 
  postId: string, 
  updates: Partial<LocationPost>
): Promise<{ success: boolean; error?: string }> {
  try {
    const postRef = doc(db, "locations", locationId, "threads", postId);
    
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update post" 
    };
  }
}

/**
 * Delete a location post
 * @param locationId Location ID
 * @param postId Post ID
 * @returns Success status and error message
 */
export async function deleteLocationPost(
  locationId: string, 
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const postRef = doc(db, "locations", locationId, "threads", postId);
    
    await deleteDoc(postRef);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete post" 
    };
  }
}
