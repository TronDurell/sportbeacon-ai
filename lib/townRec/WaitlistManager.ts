import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { 
  WaitlistEntry as WaitlistEntryType,
  LeagueCapacity as LeagueCapacityType,
  WaitlistPolicy as WaitlistPolicyType,
  WaitlistAnalytics as WaitlistAnalyticsType,
  Record<string, unknown>
} from '../../types/interfaces';

export interface WaitlistEntry {
  id?: string;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  league: string;
  ageGroup: string;
  registrationDate: Date;
  waitlistPosition: number;
  priority: 'high' | 'medium' | 'low';
  status: 'waiting' | 'promoted' | 'declined' | 'expired' | 'notified';
  notes?: string;
  familyId?: string;
  siblings?: string[];
  previousParticipant: boolean;
  responseDeadline?: Date;
  notificationSentAt?: Date;
  responseReceivedAt?: Date;
  responseStatus?: 'accepted' | 'declined' | 'no_response';
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueCapacity {
  leagueId: string;
  leagueName: string;
  maxCapacity: number;
  currentRegistrations: number;
  waitlistCount: number;
  promotionThreshold: number;
  autoPromoteEnabled: boolean;
  notificationWindow: number; // hours
  lastPromotionDate?: Date;
}

export interface WaitlistPolicy {
  leagueId: string;
  maxWaitlistSize: number;
  promotionRules: {
    enableAutoPromotion: boolean;
    batchSize: number;
    priorityOrder: ('high' | 'medium' | 'low')[];
    requireManualApproval: boolean;
    notificationTimeout: number; // hours
  };
  priorityCriteria: {
    previousParticipant: number;
    siblingEnrolled: number;
    earlyRegistration: number;
    townResident: number;
  };
}

export interface WaitlistAnalytics {
  totalWaitlistEntries: number;
  promotedCount: number;
  declinedCount: number;
  expiredCount: number;
  averageWaitTime: number;
  promotionRate: number;
  responseRate: number;
  leagueBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

export class WaitlistManager {
  private static instance: WaitlistManager;
  private policies: Map<string, WaitlistPolicy> = new Map();
  private capacities: Map<string, LeagueCapacity> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private promotionQueue: Set<string> = new Set();

  static getInstance(): WaitlistManager {
    if (!WaitlistManager.instance) {
      WaitlistManager.instance = new WaitlistManager();
    }
    return WaitlistManager.instance;
  }

  /**
   * Initialize the waitlist manager
   */
  async initialize(): Promise<void> {
    try {
      // Load waitlist policies
      const policiesSnapshot = await getDocs(collection(db, 'waitlistPolicies'));
      policiesSnapshot.forEach((doc) => {
        const policy = doc.data() as WaitlistPolicy;
        this.policies.set(policy.leagueId, policy);
      });

      // Load league capacities
      const capacitiesSnapshot = await getDocs(collection(db, 'leagueCapacities'));
      capacitiesSnapshot.forEach((doc) => {
        const capacity = doc.data() as LeagueCapacity;
        this.capacities.set(capacity.leagueId, capacity);
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Add entry to waitlist
   */
  async addToWaitlist(entry: Omit<WaitlistEntry, 'id' | 'waitlistPosition' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const policy = this.policies.get(entry.league);
      if (!policy) {
        throw new Error(`No policy found for league: ${entry.league}`);
      }

      // Check if waitlist is full
      const currentWaitlistCount = await this.getWaitlistCount(entry.league);
      if (currentWaitlistCount >= policy.maxWaitlistSize) {
        throw new Error('Waitlist is full for this league');
      }

      // Calculate priority score
      const priorityScore = this.calculatePriorityScore(entry, policy);

      // Determine priority level
      const priority = this.determinePriorityLevel(priorityScore);

      // Get next position
      const nextPosition = currentWaitlistCount + 1;

      const waitlistEntry: WaitlistEntry = {
        ...entry,
        waitlistPosition: nextPosition,
        priority,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'waitlists'), {
        ...waitlistEntry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update league capacity
      await this.updateLeagueCapacity(entry.league, 'waitlist', 1);

      // Check if auto-promotion is possible
      await this.checkAutoPromotion(entry.league);

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate priority score for waitlist entry
   */
  private calculatePriorityScore(entry: WaitlistEntry, policy: WaitlistPolicy): number {
    let score = 0;

    if (entry.previousParticipant) {
      score += policy.priorityCriteria.previousParticipant;
    }

    if (entry.siblings && entry.siblings.length > 0) {
      score += policy.priorityCriteria.siblingEnrolled;
    }

    // Early registration bonus (within first 24 hours)
    const registrationTime = entry.registrationDate.getTime();
    const now = Date.now();
    const hoursSinceRegistration = (now - registrationTime) / (1000 * 60 * 60);
    if (hoursSinceRegistration <= 24) {
      score += policy.priorityCriteria.earlyRegistration;
    }

    // TODO: Add town resident check
    // score += policy.priorityCriteria.townResident;

    return score;
  }

  /**
   * Determine priority level based on score
   */
  private determinePriorityLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 8) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }

  /**
   * Get current waitlist count for a league
   */
  private async getWaitlistCount(leagueId: string): Promise<number> {
    const q = query(
      collection(db, 'waitlists'),
      where('league', '==', leagueId),
      where('status', 'in', ['waiting', 'notified'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Check if auto-promotion is possible
   */
  private async checkAutoPromotion(leagueId: string): Promise<void> {
    const policy = this.policies.get(leagueId);
    const capacity = this.capacities.get(leagueId);

    if (!policy || !capacity || !policy.promotionRules.enableAutoPromotion) {
      return;
    }

    const availableSpots = capacity.maxCapacity - capacity.currentRegistrations;
    
    if (availableSpots > 0) {
      await this.promoteFromWaitlist(leagueId, Math.min(availableSpots, policy.promotionRules.batchSize));
    }
  }

  /**
   * Promote entries from waitlist
   */
  async promoteFromWaitlist(leagueId: string, count: number = 1): Promise<WaitlistEntry[]> {
    try {
      if (this.promotionQueue.has(leagueId)) {
        return [];
      }

      this.promotionQueue.add(leagueId);

      const policy = this.policies.get(leagueId);
      if (!policy) {
        throw new Error(`No policy found for league: ${leagueId}`);
      }

      // Get waitlist entries ordered by priority and position
      const q = query(
        collection(db, 'waitlists'),
        where('league', '==', leagueId),
        where('status', '==', 'waiting'),
        orderBy('priority', 'desc'),
        orderBy('waitlistPosition', 'asc'),
        limit(count)
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistEntry[];

      if (entries.length === 0) {
        return [];
      }

      const batch = writeBatch(db);
      const promotedEntries: WaitlistEntry[] = [];

      for (const entry of entries) {
        if (policy.promotionRules.requireManualApproval) {
          // Mark as notified and set response deadline
          const responseDeadline = new Date();
          responseDeadline.setHours(responseDeadline.getHours() + policy.promotionRules.notificationTimeout);

          batch.update(doc(db, 'waitlists', entry.id!), {
            status: 'notified',
            responseDeadline: responseDeadline,
            notificationSentAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // Send notification
          await this.sendPromotionNotification(entry);
        } else {
          // Auto-promote
          batch.update(doc(db, 'waitlists', entry.id!), {
            status: 'promoted',
            updatedAt: serverTimestamp()
          });

          // Add to registrations
          const registrationRef = doc(collection(db, 'registrations'));
          batch.set(registrationRef, {
            childName: entry.childName,
            parentName: entry.parentName,
            parentEmail: entry.parentEmail,
            league: entry.league,
            registrationDate: serverTimestamp(),
            waitlistPromoted: true,
            originalWaitlistId: entry.id,
            status: 'active'
          });

          promotedEntries.push(entry);
        }
      }

      // Update league capacity
      batch.update(doc(db, 'leagueCapacities', leagueId), {
        currentRegistrations: increment(promotedEntries.length),
        waitlistCount: increment(-entries.length),
        lastPromotionDate: serverTimestamp()
      });

      await batch.commit();

      // Reorder remaining waitlist
      await this.reorderWaitlist(leagueId);

      return promotedEntries;
    } catch (error) {
      throw error;
    } finally {
      this.promotionQueue.delete(leagueId);
    }
  }

  /**
   * Handle promotion response from parent
   */
  async handlePromotionResponse(entryId: string, response: 'accepted' | 'declined'): Promise<void> {
    try {
      const entryRef = doc(db, 'waitlists', entryId);
      const entrySnap = await getDoc(entryRef);
      
      if (!entrySnap.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const entry = entrySnap.data() as WaitlistEntry;
      const batch = writeBatch(db);

      if (response === 'accepted') {
        // Add to registrations
        const registrationRef = doc(collection(db, 'registrations'));
        batch.set(registrationRef, {
          childName: entry.childName,
          parentName: entry.parentName,
          parentEmail: entry.parentEmail,
          league: entry.league,
          registrationDate: serverTimestamp(),
          waitlistPromoted: true,
          originalWaitlistId: entryId,
          status: 'active'
        });

        // Update waitlist entry
        batch.update(entryRef, {
          status: 'promoted',
          responseStatus: 'accepted',
          responseReceivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update league capacity
        batch.update(doc(db, 'leagueCapacities', entry.league), {
          currentRegistrations: increment(1),
          waitlistCount: increment(-1)
        });
      } else {
        // Mark as declined
        batch.update(entryRef, {
          status: 'declined',
          responseStatus: 'declined',
          responseReceivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update league capacity
        batch.update(doc(db, 'leagueCapacities', entry.league), {
          waitlistCount: increment(-1)
        });
      }

      await batch.commit();

      // Reorder waitlist
      await this.reorderWaitlist(entry.league);

      // Check for more promotions
      await this.checkAutoPromotion(entry.league);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reorder waitlist after promotions/declines
   */
  private async reorderWaitlist(leagueId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'waitlists'),
        where('league', '==', leagueId),
        where('status', 'in', ['waiting', 'notified']),
        orderBy('priority', 'desc'),
        orderBy('waitlistPosition', 'asc')
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc, index) => {
        batch.update(doc.ref, {
          waitlistPosition: index + 1,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove entry from waitlist
   */
  async removeFromWaitlist(entryId: string): Promise<void> {
    try {
      const entryRef = doc(db, 'waitlists', entryId);
      const entrySnap = await getDoc(entryRef);
      
      if (!entrySnap.exists()) {
        throw new Error('Waitlist entry not found');
      }

      const entry = entrySnap.data() as WaitlistEntry;

      await deleteDoc(entryRef);

      // Update league capacity
      await this.updateLeagueCapacity(entry.league, 'waitlist', -1);

      // Reorder waitlist
      await this.reorderWaitlist(entry.league);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get waitlist entries for a league
   */
  async getWaitlistEntries(leagueId: string): Promise<WaitlistEntry[]> {
    try {
      const q = query(
        collection(db, 'waitlists'),
        where('league', '==', leagueId),
        orderBy('waitlistPosition', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistEntry[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get waitlist analytics
   */
  async getWaitlistAnalytics(): Promise<WaitlistAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, 'waitlists'));
      const entries = snapshot.docs.map(doc => doc.data() as WaitlistEntry);

      const totalWaitlistEntries = entries.length;
      const promotedCount = entries.filter(e => e.status === 'promoted').length;
      const declinedCount = entries.filter(e => e.status === 'declined').length;
      const expiredCount = entries.filter(e => e.status === 'expired').length;

      const promotionRate = totalWaitlistEntries > 0 ? (promotedCount / totalWaitlistEntries) * 100 : 0;

      // Calculate average wait time
      const promotedEntries = entries.filter(e => e.status === 'promoted' && e.responseReceivedAt);
      const totalWaitTime = promotedEntries.reduce((sum, e) => {
        return sum + (e.responseReceivedAt!.getTime() - e.createdAt.getTime());
      }, 0);
      const averageWaitTime = promotedEntries.length > 0 ? totalWaitTime / promotedEntries.length : 0;

      // Calculate response rate
      const notifiedEntries = entries.filter(e => e.status === 'notified');
      const respondedEntries = notifiedEntries.filter(e => e.responseStatus);
      const responseRate = notifiedEntries.length > 0 ? (respondedEntries.length / notifiedEntries.length) * 100 : 0;

      // League breakdown
      const leagueBreakdown: Record<string, number> = {};
      entries.forEach(e => {
        leagueBreakdown[e.league] = (leagueBreakdown[e.league] || 0) + 1;
      });

      // Priority breakdown
      const priorityBreakdown: Record<string, number> = {};
      entries.forEach(e => {
        priorityBreakdown[e.priority] = (priorityBreakdown[e.priority] || 0) + 1;
      });

      return {
        totalWaitlistEntries,
        promotedCount,
        declinedCount,
        expiredCount,
        averageWaitTime,
        promotionRate,
        responseRate,
        leagueBreakdown,
        priorityBreakdown
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listen to waitlist changes in real-time
   */
  subscribeToWaitlist(leagueId: string, callback: (entries: WaitlistEntry[]) => void): () => void {
    const q = query(
      collection(db, 'waitlists'),
      where('league', '==', leagueId),
      orderBy('waitlistPosition', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WaitlistEntry[];
      
      callback(entries);
    });

    this.listeners.set(`waitlist_${leagueId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Update league capacity
   */
  private async updateLeagueCapacity(leagueId: string, field: 'waitlist' | 'registrations', change: number): Promise<void> {
    try {
      const capacityRef = doc(db, 'leagueCapacities', leagueId);
      const updateData: Record<string, unknown> = {};
      
      if (field === 'waitlist') {
        updateData.waitlistCount = increment(change);
      } else {
        updateData.currentRegistrations = increment(change);
      }

      await updateDoc(capacityRef, updateData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send promotion notification
   */
  private async sendPromotionNotification(entry: WaitlistEntry): Promise<void> {
    try {
      // TODO: Implement email/SMS notifications
      const notificationData = {
        type: 'waitlist_promotion',
        recipient: entry.parentEmail,
        subject: 'Spot Available - Action Required',
        template: 'waitlist-promotion',
        data: {
          childName: entry.childName,
          league: entry.league,
          responseDeadline: entry.responseDeadline,
          waitlistPosition: entry.waitlistPosition
        }
      };

      // Add to notifications collection
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
    } catch (error) {
      }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'waitlists'),
        where('status', '==', 'notified'),
        where('responseDeadline', '<', now)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export const waitlistManager = WaitlistManager.getInstance(); 