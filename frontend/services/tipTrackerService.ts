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

// Tip Types
// Import consolidated Tip interface
import type { Tip } from '../types';

// Tip Creation Request
export interface TipRequest {
  toUserId: string;
  amount: number; // Amount in cents
  currency: string;
  message?: string;
  isAnonymous: boolean;
  category?: string;
  tags?: string[];
}

// Tip Update
export interface TipUpdate {
  status?: Tip['status'];
  stripeTransferId?: string;
  processedAt?: Timestamp;
  refundedAt?: Timestamp;
  message?: string;
}

// Tip Search Filters
export interface TipSearchFilters {
  fromUserId?: string;
  toUserId?: string;
  status?: Tip['status'][];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  startDate?: Timestamp;
  endDate?: Timestamp;
  category?: string;
  tags?: string[];
  isAnonymous?: boolean;
}

// Tip Analytics
export interface TipAnalytics {
  totalTips: number;
  totalAmount: number;
  averageTip: number;
  tipsByStatus: Record<Tip['status'], number>;
  tipsByCurrency: Record<string, number>;
  tipsByCategory: Record<string, number>;
  tipsByDay: Array<{ date: string; count: number; amount: number }>;
  topTippers: Array<{ userId: string; displayName: string; totalAmount: number; tipCount: number }>;
  topReceivers: Array<{ userId: string; displayName: string; totalAmount: number; tipCount: number }>;
  recentTips: Tip[];
}

// Payout Summary
export interface PayoutSummary {
  userId: string;
  totalEarnings: number;
  totalTips: number;
  pendingAmount: number;
  processedAmount: number;
  failedAmount: number;
  lastPayoutAt?: Timestamp;
  nextPayoutAt?: Timestamp;
  stripeAccountId?: string;
  payoutEnabled: boolean;
}

/**
 * Comprehensive Tip Tracker Service
 * Handles tip tracking with Stripe integration and real-time Firestore sync
 */
export class TipTrackerService {
  private static instance: TipTrackerService;
  private listeners: Map<string, () => void> = new Map();

  private constructor() {}

  static getInstance(): TipTrackerService {
    if (!TipTrackerService.instance) {
      TipTrackerService.instance = new TipTrackerService();
    }
    return TipTrackerService.instance;
  }

  // Create Tip
  async createTip(
    fromUserId: string,
    tipRequest: TipRequest
  ): Promise<string> {
    const tipRef = doc(collection(db, 'tips'));
    
    // Calculate fees (example: 2.9% + 30 cents for Stripe, 5% platform fee)
    const stripeFee = Math.round(tipRequest.amount * 0.029) + 30;
    const platformFee = Math.round(tipRequest.amount * 0.05);
    const creatorAmount = tipRequest.amount - stripeFee - platformFee;

    const tip: Tip = {
      id: tipRef.id,
      tipId: tipRef.id,
      fromUserId,
      toUserId: tipRequest.toUserId,
      amount: tipRequest.amount,
      currency: tipRequest.currency,
      message: tipRequest.message,
      isAnonymous: tipRequest.isAnonymous,
      category: tipRequest.category,
      tags: tipRequest.tags,
      stripePaymentIntentId: '', // Will be set after Stripe payment
      status: 'pending',
      processingFee: stripeFee,
      platformFee: platformFee,
      creatorAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'web'
    };

    await setDoc(tipRef, tip);
    return tipRef.id;
  }

  // Get Tip
  async getTip(tipId: string): Promise<Tip | null> {
    const tipRef = doc(db, 'tips', tipId);
    const tipDoc = await getDoc(tipRef);

    if (tipDoc.exists()) {
      return { id: tipDoc.id, ...tipDoc.data() } as Tip;
    }

    return null;
  }

  // Update Tip
  async updateTip(tipId: string, updates: TipUpdate): Promise<void> {
    const tipRef = doc(db, 'tips', tipId);
    
    await updateDoc(tipRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Update Tip with Stripe Payment Intent
  async updateTipWithPaymentIntent(
    tipId: string,
    stripePaymentIntentId: string
  ): Promise<void> {
    const tipRef = doc(db, 'tips', tipId);
    
    await updateDoc(tipRef, {
      stripePaymentIntentId,
      status: 'processing',
      updatedAt: serverTimestamp()
    });
  }

  // Complete Tip
  async completeTip(
    tipId: string,
    stripeTransferId: string,
    stripeAccountId: string
  ): Promise<void> {
    const tipRef = doc(db, 'tips', tipId);
    
    await updateDoc(tipRef, {
      status: 'completed',
      stripeTransferId,
      stripeAccountId,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Refund Tip
  async refundTip(tipId: string): Promise<void> {
    const tipRef = doc(db, 'tips', tipId);
    
    await updateDoc(tipRef, {
      status: 'refunded',
      refundedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Get Tips by User
  async getTipsByUser(
    userId: string,
    type: 'sent' | 'received',
    limitCount: number = 20
  ): Promise<Tip[]> {
    const field = type === 'sent' ? 'fromUserId' : 'toUserId';
    const q = query(
      collection(db, 'tips'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const tips: Tip[] = [];

    querySnapshot.forEach((doc) => {
      tips.push({ id: doc.id, ...doc.data() } as Tip);
    });

    return tips;
  }

  // Search Tips
  async searchTips(
    filters: TipSearchFilters,
    limitCount: number = 20
  ): Promise<Tip[]> {
    let q = query(
      collection(db, 'tips'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (filters.fromUserId) {
      q = query(q, where('fromUserId', '==', filters.fromUserId));
    }

    if (filters.toUserId) {
      q = query(q, where('toUserId', '==', filters.toUserId));
    }

    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }

    if (filters.currency) {
      q = query(q, where('currency', '==', filters.currency));
    }

    if (filters.isAnonymous !== undefined) {
      q = query(q, where('isAnonymous', '==', filters.isAnonymous));
    }

    const querySnapshot = await getDocs(q);
    const tips: Tip[] = [];

    querySnapshot.forEach((doc) => {
      const tip = { id: doc.id, ...doc.data() } as Tip;
      
      // Apply additional filters that can't be done in Firestore
      if (filters.minAmount && tip.amount < filters.minAmount) {
        return;
      }

      if (filters.maxAmount && tip.amount > filters.maxAmount) {
        return;
      }

      if (filters.startDate && new Date(tip.createdAt) < filters.startDate.toDate()) {
        return;
      }

      if (filters.endDate && new Date(tip.createdAt) > filters.endDate.toDate()) {
        return;
      }

      if (filters.category && tip.category !== filters.category) {
        return;
      }

      if (filters.tags && filters.tags.length > 0) {
        if (!tip.tags || !filters.tags.some(tag => tip.tags!.includes(tag))) {
          return;
        }
      }

      tips.push(tip);
    });

    return tips;
  }

  // Get Tip Analytics
  async getTipAnalytics(
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): Promise<TipAnalytics> {
    let q = query(collection(db, 'tips'));

    if (userId) {
      q = query(q, where('toUserId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('createdAt', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('createdAt', '<=', endDate));
    }

    const querySnapshot = await getDocs(q);
    const tips = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);

    // Calculate analytics
    const totalTips = tips.length;
    const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const averageTip = totalTips > 0 ? totalAmount / totalTips : 0;

    const tipsByStatus: Record<Tip['status'], number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      cancelled: 0
    };

    const tipsByCurrency: Record<string, number> = {};
    const tipsByCategory: Record<string, number> = {};
    const tipsByDay: Record<string, { count: number; amount: number }> = {};

    const tipperStats: Record<string, { amount: number; count: number; displayName: string }> = {};
    const receiverStats: Record<string, { amount: number; count: number; displayName: string }> = {};

    tips.forEach(tip => {
      // Count by status
      tipsByStatus[tip.status]++;

      // Count by currency
      tipsByCurrency[tip.currency] = (tipsByCurrency[tip.currency] || 0) + 1;

      // Count by category
      if (tip.category) {
        tipsByCategory[tip.category] = (tipsByCategory[tip.category] || 0) + 1;
      }

      // Count by day
      const dateKey = new Date(tip.createdAt).toISOString().split('T')[0];
      if (!tipsByDay[dateKey]) {
        tipsByDay[dateKey] = { count: 0, amount: 0 };
      }
      tipsByDay[dateKey].count++;
      tipsByDay[dateKey].amount += tip.amount;

      // Track tipper stats
      if (!tipperStats[tip.fromUserId]) {
        tipperStats[tip.fromUserId] = { amount: 0, count: 0, displayName: tip.fromUserProfile?.displayName || 'Anonymous' };
      }
      tipperStats[tip.fromUserId].amount += tip.amount;
      tipperStats[tip.fromUserId].count++;

      // Track receiver stats
      if (!receiverStats[tip.toUserId]) {
        receiverStats[tip.toUserId] = { amount: 0, count: 0, displayName: tip.toUserProfile?.displayName || 'Unknown' };
      }
      receiverStats[tip.toUserId].amount += tip.amount;
      receiverStats[tip.toUserId].count++;
    });

    // Convert tipsByDay to array format
    const tipsByDayArray = Object.entries(tipsByDay)
      .map(([date, stats]) => ({ date, count: stats.count, amount: stats.amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get top tippers and receivers
    const topTippers = Object.entries(tipperStats)
      .map(([userId, stats]) => ({ userId, displayName: stats.displayName, totalAmount: stats.amount, tipCount: stats.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const topReceivers = Object.entries(receiverStats)
      .map(([userId, stats]) => ({ userId, displayName: stats.displayName, totalAmount: stats.amount, tipCount: stats.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Get recent tips
    const recentTips = tips
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalTips,
      totalAmount,
      averageTip,
      tipsByStatus,
      tipsByCurrency,
      tipsByCategory,
      tipsByDay: tipsByDayArray,
      topTippers,
      topReceivers,
      recentTips
    };
  }

  // Get Payout Summary
  async getPayoutSummary(userId: string): Promise<PayoutSummary> {
    const completedTipsQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', userId),
      where('status', '==', 'completed')
    );

    const pendingTipsQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', userId),
      where('status', 'in', ['pending', 'processing'])
    );

    const [completedSnapshot, pendingSnapshot] = await Promise.all([
      getDocs(completedTipsQuery),
      getDocs(pendingTipsQuery)
    ]);

    const completedTips = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);
    const pendingTips = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);

    const totalEarnings = completedTips.reduce((sum, tip) => sum + tip.creatorAmount, 0);
    const totalTips = completedTips.length;
    const pendingAmount = pendingTips.reduce((sum, tip) => sum + tip.creatorAmount, 0);

    // Get last payout date
    const lastPayoutQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', userId),
      where('status', '==', 'completed'),
      where('processedAt', '!=', null),
      orderBy('processedAt', 'desc'),
      limit(1)
    );

    const lastPayoutSnapshot = await getDocs(lastPayoutQuery);
    const lastPayoutAt = lastPayoutSnapshot.empty ? undefined : lastPayoutSnapshot.docs[0].data().processedAt;

    return {
      userId,
      totalEarnings,
      totalTips,
      pendingAmount,
      processedAmount: totalEarnings,
      failedAmount: 0, // Would need to track failed payouts separately
      lastPayoutAt,
      nextPayoutAt: undefined, // Would be calculated based on payout schedule
      stripeAccountId: undefined, // Would be fetched from user profile
      payoutEnabled: true // Would be fetched from user profile
    };
  }

  // Real-time Tip Listener
  subscribeToTip(
    tipId: string,
    callback: (tip: Tip | null) => void
  ): () => void {
    const tipRef = doc(db, 'tips', tipId);
    
    const unsubscribe = onSnapshot(tipRef, (doc) => {
      if (doc.exists()) {
        const tip = { id: doc.id, ...doc.data() } as Tip;
        callback(tip);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to tip:', error);
      callback(null);
    });

    this.listeners.set(tipId, unsubscribe);
    return unsubscribe;
  }

  // Real-time User Tips Listener
  subscribeToUserTips(
    userId: string,
    type: 'sent' | 'received',
    callback: (tips: Tip[]) => void,
    limitCount: number = 20
  ): () => void {
    const field = type === 'sent' ? 'fromUserId' : 'toUserId';
    const q = query(
      collection(db, 'tips'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tips: Tip[] = [];
      
      querySnapshot.forEach((doc) => {
        tips.push({ id: doc.id, ...doc.data() } as Tip);
      });

      callback(tips);
    }, (error) => {
      console.error('Error listening to user tips:', error);
      callback([]);
    });

    const listenerId = `user_tips_${userId}_${type}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Tip Analytics Listener
  subscribeToTipAnalytics(
    callback: (analytics: TipAnalytics) => void,
    userId?: string,
    startDate?: Timestamp,
    endDate?: Timestamp
  ): () => void {
    let q = query(collection(db, 'tips'));

    if (userId) {
      q = query(q, where('toUserId', '==', userId));
    }

    if (startDate) {
      q = query(q, where('createdAt', '>=', startDate));
    }

    if (endDate) {
      q = query(q, where('createdAt', '<=', endDate));
    }

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const tips = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);
      const analytics = await this.calculateAnalytics(tips);
      callback(analytics);
    }, (error) => {
      console.error('Error listening to tip analytics:', error);
      callback({
        totalTips: 0,
        totalAmount: 0,
        averageTip: 0,
        tipsByStatus: { pending: 0, processing: 0, completed: 0, failed: 0, refunded: 0, cancelled: 0 },
        tipsByCurrency: {},
        tipsByCategory: {},
        tipsByDay: [],
        topTippers: [],
        topReceivers: [],
        recentTips: []
      });
    });

    const listenerId = `analytics_${userId || 'all'}`;
    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Real-time Payout Summary Listener
  subscribeToPayoutSummary(
    userId: string,
    callback: (summary: PayoutSummary) => void
  ): () => void {
    const completedTipsQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', userId),
      where('status', '==', 'completed')
    );

    const pendingTipsQuery = query(
      collection(db, 'tips'),
      where('toUserId', '==', userId),
      where('status', 'in', ['pending', 'processing'])
    );

    const unsubscribeCompleted = onSnapshot(completedTipsQuery, async (completedSnapshot) => {
      const pendingSnapshot = await getDocs(pendingTipsQuery);
      
      const completedTips = completedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);
      const pendingTips = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Tip);

      const totalEarnings = completedTips.reduce((sum, tip) => sum + tip.creatorAmount, 0);
      const totalTips = completedTips.length;
      const pendingAmount = pendingTips.reduce((sum, tip) => sum + tip.creatorAmount, 0);

      const summary: PayoutSummary = {
        userId,
        totalEarnings,
        totalTips,
        pendingAmount,
        processedAmount: totalEarnings,
        failedAmount: 0,
        payoutEnabled: true
      };

      callback(summary);
    }, (error) => {
      console.error('Error listening to payout summary:', error);
      callback({
        userId,
        totalEarnings: 0,
        totalTips: 0,
        pendingAmount: 0,
        processedAmount: 0,
        failedAmount: 0,
        payoutEnabled: false
      });
    });

    const listenerId = `payout_summary_${userId}`;
    this.listeners.set(listenerId, unsubscribeCompleted);
    return unsubscribeCompleted;
  }

  // Calculate Analytics Helper
  private async calculateAnalytics(tips: Tip[]): Promise<TipAnalytics> {
    const totalTips = tips.length;
    const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
    const averageTip = totalTips > 0 ? totalAmount / totalTips : 0;

    const tipsByStatus: Record<Tip['status'], number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      refunded: 0,
      cancelled: 0
    };

    const tipsByCurrency: Record<string, number> = {};
    const tipsByCategory: Record<string, number> = {};
    const tipsByDay: Record<string, { count: number; amount: number }> = {};

    const tipperStats: Record<string, { amount: number; count: number; displayName: string }> = {};
    const receiverStats: Record<string, { amount: number; count: number; displayName: string }> = {};

    tips.forEach(tip => {
      tipsByStatus[tip.status]++;
      tipsByCurrency[tip.currency] = (tipsByCurrency[tip.currency] || 0) + 1;

      if (tip.category) {
        tipsByCategory[tip.category] = (tipsByCategory[tip.category] || 0) + 1;
      }

      const dateKey = new Date(tip.createdAt).toISOString().split('T')[0];
      if (!tipsByDay[dateKey]) {
        tipsByDay[dateKey] = { count: 0, amount: 0 };
      }
      tipsByDay[dateKey].count++;
      tipsByDay[dateKey].amount += tip.amount;

      if (!tipperStats[tip.fromUserId]) {
        tipperStats[tip.fromUserId] = { amount: 0, count: 0, displayName: tip.fromUserProfile?.displayName || 'Anonymous' };
      }
      tipperStats[tip.fromUserId].amount += tip.amount;
      tipperStats[tip.fromUserId].count++;

      if (!receiverStats[tip.toUserId]) {
        receiverStats[tip.toUserId] = { amount: 0, count: 0, displayName: tip.toUserProfile?.displayName || 'Unknown' };
      }
      receiverStats[tip.toUserId].amount += tip.amount;
      receiverStats[tip.toUserId].count++;
    });

    const tipsByDayArray = Object.entries(tipsByDay)
      .map(([date, stats]) => ({ date, count: stats.count, amount: stats.amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topTippers = Object.entries(tipperStats)
      .map(([userId, stats]) => ({ userId, displayName: stats.displayName, totalAmount: stats.amount, tipCount: stats.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const topReceivers = Object.entries(receiverStats)
      .map(([userId, stats]) => ({ userId, displayName: stats.displayName, totalAmount: stats.amount, tipCount: stats.count }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    const recentTips = tips
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalTips,
      totalAmount,
      averageTip,
      tipsByStatus,
      tipsByCurrency,
      tipsByCategory,
      tipsByDay: tipsByDayArray,
      topTippers,
      topReceivers,
      recentTips
    };
  }

  // Batch Operations
  async batchUpdateTips(updates: Array<{ tipId: string; updates: TipUpdate }>): Promise<void> {
    const batch = writeBatch(db);

    updates.forEach(({ tipId, updates }) => {
      const tipRef = doc(db, 'tips', tipId);
      batch.update(tipRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
  }

  // Transaction Operations
  async updateTipWithTransaction(
    tipId: string,
    updates: TipUpdate
  ): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const tipRef = doc(db, 'tips', tipId);
      const tipDoc = await transaction.get(tipRef);

      if (!tipDoc.exists()) {
        throw new Error('Tip not found');
      }

      transaction.update(tipRef, {
        ...updates,
        updatedAt: serverTimestamp()
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

export default TipTrackerService; 