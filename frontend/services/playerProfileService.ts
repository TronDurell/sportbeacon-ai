import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Timestamp } from 'firebase/firestore';
import type { PlayerProfile } from '../types';

// Player Profile Update Types
export interface PlayerProfileUpdate {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: Timestamp | string;
  phoneNumber?: string;
  sports?: Partial<PlayerProfile['sports']>;
  social?: Partial<PlayerProfile['social']>;
  financial?: Partial<PlayerProfile['financial']>;
  preferences?: Partial<PlayerProfile['preferences']>;
}

// Player Search Filters
export interface PlayerSearchFilters {
  sports?: string[];
  positions?: string[];
  experience?: ('beginner' | 'intermediate' | 'advanced' | 'professional')[];
  location?: string;
  isVerified?: boolean;
  isPublic?: boolean;
  minWinRate?: number;
  maxWinRate?: number;
  minFollowers?: number;
  maxFollowers?: number;
  allowTips?: boolean;
  payoutEnabled?: boolean;
}

// Player Analytics
export interface PlayerAnalytics {
  totalPlayers: number;
  activePlayers: number;
  verifiedPlayers: number;
  playersBySport: Record<string, number>;
  playersByExperience: Record<'beginner' | 'intermediate' | 'advanced' | 'professional', number>;
  averageWinRate: number;
  totalEarnings: number;
  averageEarnings: number;
  topEarners: PlayerProfile[];
  trendingPlayers: PlayerProfile[];
}

/**
 * Comprehensive Player Profile Service
 * Handles player profile management with real-time Firestore integration
 */
export class PlayerProfileService {
  private static instance: PlayerProfileService;
  private listeners: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): PlayerProfileService {
    if (!PlayerProfileService.instance) {
      PlayerProfileService.instance = new PlayerProfileService();
    }
    return PlayerProfileService.instance;
  }

  // Create Player Profile
  async createPlayerProfile(
    userId: string,
    profileData: Omit<PlayerProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastActive' | 'status'>
  ): Promise<string> {
    const profileRef = doc(collection(db, 'playerProfiles'));
    const now = new Date().toISOString();
    const profile: PlayerProfile = {
      ...profileData,
      id: profileRef.id,
      userId,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(profileRef, profile);
    return profileRef.id;
  }

  // Get Player Profile
  async getPlayerProfile(profileId: string): Promise<PlayerProfile | null> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    const profileDoc = await getDoc(profileRef);

    if (profileDoc.exists()) {
      return { id: profileDoc.id, ...profileDoc.data() } as PlayerProfile;
    }

    return null;
  }

  // Get Player Profile by User ID
  async getPlayerProfileByUserId(userId: string): Promise<PlayerProfile | null> {
    const q = query(
      collection(db, 'playerProfiles'),
      where('userId', '==', userId),
      where('status', '!=', 'deleted'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as PlayerProfile;
    }

    return null;
  }

  // Update Player Profile
  async updatePlayerProfile(
    profileId: string,
    updates: PlayerProfileUpdate
  ): Promise<void> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
  }

  // Update Player Profile Performance
  async updatePlayerPerformance(
    profileId: string,
    performance: Partial<PlayerProfile['performance']>
  ): Promise<void> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    // Calculate win rate if games are updated
    let winRate = undefined;
    if (performance?.totalGames !== undefined && performance?.wins !== undefined) {
      winRate = performance.wins / performance.totalGames;
    }

    await updateDoc(profileRef, {
      'performance': {
        ...performance,
        ...(winRate !== undefined && { winRate })
      },
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
  }

  // Update Player Social Stats
  async updatePlayerSocial(
    profileId: string,
    social: Partial<PlayerProfile['social']>
  ): Promise<void> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    await updateDoc(profileRef, {
      'social': social,
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
  }

  // Update Player Financial Info
  async updatePlayerFinancial(
    profileId: string,
    financial: Partial<PlayerProfile['financial']>
  ): Promise<void> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    await updateDoc(profileRef, {
      'financial': financial,
      updatedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
  }

  // Delete Player Profile
  async deletePlayerProfile(profileId: string): Promise<void> {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    // Soft delete - mark as deleted instead of actually deleting
    await updateDoc(profileRef, {
      status: 'deleted',
      updatedAt: serverTimestamp()
    });
  }

  // Search Players
  async searchPlayersByText(searchTerm: string): Promise<PlayerProfile[]> {
    // Simple text search - in a real app, you'd use Algolia or similar
    const allProfiles = await this.getTrendingPlayers(100);
    return allProfiles.filter(profile => 
      profile.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async searchPlayers(
    filters: PlayerSearchFilters,
    limitCount: number = 20
  ): Promise<PlayerProfile[]> {
    let q = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active'),
      orderBy('lastActive', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (filters.sports && filters.sports.length > 0) {
      q = query(q, where('sports.primary', 'in', filters.sports));
    }

    if (filters.isVerified !== undefined) {
      q = query(q, where('social.isVerified', '==', filters.isVerified));
    }

    if (filters.isPublic !== undefined) {
      q = query(q, where('social.isPublic', '==', filters.isPublic));
    }

    if (filters.allowTips !== undefined) {
      q = query(q, where('social.allowTips', '==', filters.allowTips));
    }

    if (filters.payoutEnabled !== undefined) {
      q = query(q, where('financial.payoutEnabled', '==', filters.payoutEnabled));
    }

    const querySnapshot = await getDocs(q);
    const players: PlayerProfile[] = [];

    querySnapshot.forEach((doc) => {
      const player = { id: doc.id, ...doc.data() } as PlayerProfile;
      
      // Apply additional filters that can't be done in Firestore
      if (filters.positions && filters.positions.length > 0) {
        if (!player.sports?.positions || !filters.positions.some(pos => player.sports.positions.includes(pos))) {
          return;
        }
      }

      if (filters.experience && filters.experience.length > 0) {
        if (!player.sports?.experience || !filters.experience.includes(player.sports.experience)) {
          return;
        }
      }

      if (filters.minWinRate && player.performance?.winRate && player.performance.winRate < filters.minWinRate) {
        return;
      }

      if (filters.maxWinRate && player.performance?.winRate && player.performance.winRate > filters.maxWinRate) {
        return;
      }

      if (filters.minFollowers && player.social?.followers && player.social.followers < filters.minFollowers) {
        return;
      }

      if (filters.maxFollowers && player.social?.followers && player.social.followers > filters.maxFollowers) {
        return;
      }

      players.push(player);
    });

    return players;
  }

  // Get Trending Players
  async getTrendingPlayers(limitCount: number = 10): Promise<PlayerProfile[]> {
    const q = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active'),
      where('social.isPublic', '==', true),
      orderBy('social.followers', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const players: PlayerProfile[] = [];

    querySnapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() } as PlayerProfile);
    });

    return players;
  }

  // Get Top Earners
  async getTopEarners(limitCount: number = 10): Promise<PlayerProfile[]> {
    const q = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active'),
      where('financial.payoutEnabled', '==', true),
      orderBy('financial.totalEarnings', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const players: PlayerProfile[] = [];

    querySnapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() } as PlayerProfile);
    });

    return players;
  }

  // Get Player Analytics
  async getPlayerAnalytics(): Promise<PlayerAnalytics> {
    const activePlayersQuery = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active')
    );

    const verifiedPlayersQuery = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active'),
      where('social.isVerified', '==', true)
    );

    const [activeSnapshot, verifiedSnapshot] = await Promise.all([
      getDocs(activePlayersQuery),
      getDocs(verifiedPlayersQuery)
    ]);

    const activePlayers = activeSnapshot.docs.map(doc => 
      ({ id: doc.id, ...doc.data() }) as PlayerProfile
    );

    // Calculate analytics
    const playersBySport: Record<string, number> = {};
    const playersByExperience: Record<'beginner' | 'intermediate' | 'advanced' | 'professional', number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0
    };

    let totalWinRate = 0;
    let totalEarnings = 0;
    let validWinRates = 0;

    activePlayers.forEach(player => {
      // Count by sport
      if (player.sports?.primary) {
        const sport = player.sports.primary;
        playersBySport[sport] = (playersBySport[sport] || 0) + 1;
      }

      // Count by experience
      if (player.sports?.experience) {
        playersByExperience[player.sports.experience]++;
      }

      // Calculate win rate
      if (player.performance?.totalGames && player.performance.totalGames > 0) {
        totalWinRate += player.performance.winRate || 0;
        validWinRates++;
      }

      // Calculate earnings
      totalEarnings += player.financial.totalEarnings;
    });

    const averageWinRate = validWinRates > 0 ? totalWinRate / validWinRates : 0;
    const averageEarnings = activePlayers.length > 0 ? totalEarnings / activePlayers.length : 0;

    // Get top earners and trending players
    const [topEarners, trendingPlayers] = await Promise.all([
      this.getTopEarners(5),
      this.getTrendingPlayers(5)
    ]);

    return {
      totalPlayers: activePlayers.length,
      activePlayers: activePlayers.length,
      verifiedPlayers: verifiedSnapshot.size,
      playersBySport,
      playersByExperience,
      averageWinRate,
      totalEarnings,
      averageEarnings,
      topEarners,
      trendingPlayers
    };
  }

  // Real-time Player Profile Listener
  subscribeToPlayerProfile(
    profileId: string,
    callback: (profile: PlayerProfile | null) => void
  ): () => void {
    const profileRef = doc(db, 'playerProfiles', profileId);
    
    const unsubscribe = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        const profile = { id: doc.id, ...doc.data() } as PlayerProfile;
        callback(profile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to player profile:', error);
      callback(null);
    });

    this.listeners.set(profileId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Player Search Listener
  subscribeToPlayerSearch(
    filters: PlayerSearchFilters,
    callback: (players: PlayerProfile[]) => void,
    limitCount: number = 20
  ): () => void {
    let q = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active'),
      orderBy('lastActive', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (filters.sports && filters.sports.length > 0) {
      q = query(q, where('sports.primary', 'in', filters.sports));
    }

    if (filters.isVerified !== undefined) {
      q = query(q, where('social.isVerified', '==', filters.isVerified));
    }

    if (filters.isPublic !== undefined) {
      q = query(q, where('social.isPublic', '==', filters.isPublic));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const players: PlayerProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const player = { id: doc.id, ...doc.data() } as PlayerProfile;
        
        // Apply additional filters
        if (filters.positions && filters.positions.length > 0) {
          if (!filters.positions.some(pos => player.sports.positions.includes(pos))) {
            return;
          }
        }

        if (filters.experience && filters.experience.length > 0) {
          if (!filters.experience.includes(player.sports.experience)) {
            return;
          }
        }

        if (filters.minWinRate && player.performance.winRate < filters.minWinRate) {
          return;
        }

        if (filters.maxWinRate && player.performance.winRate > filters.maxWinRate) {
          return;
        }

        players.push(player);
      });

      callback(players);
    }, (error) => {
      console.error('Error listening to player search:', error);
      callback([]);
    });

    const listenerId = `search_${JSON.stringify(filters)}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Analytics Listener
  subscribeToPlayerAnalytics(
    callback: (analytics: PlayerAnalytics) => void
  ): () => void {
    const activePlayersQuery = query(
      collection(db, 'playerProfiles'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(activePlayersQuery, async (querySnapshot) => {
      const activePlayers = querySnapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as PlayerProfile
      );

      const analytics = await this.calculateAnalytics(activePlayers);
      callback(analytics);
    }, (error) => {
      console.error('Error listening to player analytics:', error);
      callback({
        totalPlayers: 0,
        activePlayers: 0,
        verifiedPlayers: 0,
        playersBySport: {},
        playersByExperience: { beginner: 0, intermediate: 0, advanced: 0, professional: 0 },
        averageWinRate: 0,
        totalEarnings: 0,
        averageEarnings: 0,
        topEarners: [],
        trendingPlayers: []
      });
    });

    const listenerId = 'analytics';
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Calculate Analytics Helper
  private async calculateAnalytics(activePlayers: PlayerProfile[]): Promise<PlayerAnalytics> {
    const playersBySport: Record<string, number> = {};
    const playersByExperience: Record<'beginner' | 'intermediate' | 'advanced' | 'professional', number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      professional: 0
    };

    let totalWinRate = 0;
    let totalEarnings = 0;
    let validWinRates = 0;
    let verifiedCount = 0;

    activePlayers.forEach(player => {
      // Count by sport
      const sport = player.sports.primary;
      playersBySport[sport] = (playersBySport[sport] || 0) + 1;

      // Count by experience
      playersByExperience[player.sports.experience]++;

      // Count verified players
      if (player.social.isVerified) {
        verifiedCount++;
      }

      // Calculate win rate
      if (player.performance.totalGames > 0) {
        totalWinRate += player.performance.winRate;
        validWinRates++;
      }

      // Calculate earnings
      totalEarnings += player.financial.totalEarnings;
    });

    const averageWinRate = validWinRates > 0 ? totalWinRate / validWinRates : 0;
    const averageEarnings = activePlayers.length > 0 ? totalEarnings / activePlayers.length : 0;

    // Get top earners and trending players
    const [topEarners, trendingPlayers] = await Promise.all([
      this.getTopEarners(5),
      this.getTrendingPlayers(5)
    ]);

    return {
      totalPlayers: activePlayers.length,
      activePlayers: activePlayers.length,
      verifiedPlayers: verifiedCount,
      playersBySport,
      playersByExperience,
      averageWinRate,
      totalEarnings,
      averageEarnings,
      topEarners,
      trendingPlayers
    };
  }

  // Batch Operations
  async batchUpdateProfiles(updates: Array<{ profileId: string; updates: PlayerProfileUpdate }>): Promise<void> {
    const batch = writeBatch(db);

    updates.forEach(({ profileId, updates }) => {
      const profileRef = doc(db, 'playerProfiles', profileId);
      batch.update(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
    });

    await batch.commit();
  }

  // Transaction Operations
  async updateProfileWithTransaction(
    profileId: string,
    updates: PlayerProfileUpdate
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const profileRef = doc(db, 'playerProfiles', profileId);
      const profileDoc = await transaction.get(profileRef);

      if (!profileDoc.exists()) {
        throw new Error('Player profile not found');
      }

      transaction.update(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });
    });
  }

  // Cleanup Listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // Get Listener Count (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export default PlayerProfileService; 