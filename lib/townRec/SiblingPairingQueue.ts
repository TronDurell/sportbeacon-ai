import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  SiblingRequest,
  ChildInfo,
  Record<string, unknown>
} from '../../types/interfaces';

export interface SiblingPairing {
  id?: string;
  familyId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  children: Array<{
    id: string;
    name: string;
    dateOfBirth: Date;
    age: number;
    league: string;
    team?: string;
    registrationId: string;
    registrationDate: Date;
  }>;
  status: 'pending' | 'paired' | 'conflict' | 'manual_review' | 'resolved';
  requestedLeague?: string;
  requestedTeam?: string;
  notes?: string;
  conflicts?: Array<{
    childId: string;
    childName: string;
    issue: string;
    resolution?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface SiblingPairingPolicy {
  leagueId: string;
  leagueName: string;
  enableSiblingPairing: boolean;
  maxAgeDifference: number;
  allowCrossLeaguePairing: boolean;
  requireSameTeam: boolean;
  autoAssignTeam: boolean;
  manualReviewThreshold: number; // number of conflicts before manual review
  priority: 'high' | 'medium' | 'low';
}

export interface SiblingPairingAnalytics {
  totalPairings: number;
  successfulPairings: number;
  conflicts: number;
  manualReviews: number;
  averageProcessingTime: number;
  successRate: number;
  leagueBreakdown: Record<string, number>;
  commonConflicts: Record<string, number>;
}

export class SiblingPairingQueue {
  private static instance: SiblingPairingQueue;
  private policies: Map<string, SiblingPairingPolicy> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private processingQueue: Set<string> = new Set();

  static getInstance(): SiblingPairingQueue {
    if (!SiblingPairingQueue.instance) {
      SiblingPairingQueue.instance = new SiblingPairingQueue();
    }
    return SiblingPairingQueue.instance;
  }

  /**
   * Initialize the sibling pairing queue
   */
  async initialize(): Promise<void> {
    try {
      // Load sibling pairing policies
      const policiesSnapshot = await getDocs(collection(db, 'siblingPairingPolicies'));
      policiesSnapshot.forEach((doc) => {
        const policy = doc.data() as SiblingPairingPolicy;
        this.policies.set(policy.leagueId, policy);
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Process new registration for sibling pairing
   */
  async processRegistration(registrationData: {
    childId: string;
    childName: string;
    dateOfBirth: Date;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    league: string;
    registrationId: string;
    registrationDate: Date;
  }): Promise<void> {
    try {
      // Check if this child has siblings already registered
      const existingSiblings = await this.findExistingSiblings(registrationData.parentEmail);
      
      if (existingSiblings.length > 0) {
        // Add to existing family pairing
        await this.addToExistingFamily(registrationData, existingSiblings);
      } else {
        // Create new family pairing
        await this.createNewFamilyPairing(registrationData);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find existing siblings for a parent
   */
  private async findExistingSiblings(parentEmail: string): Promise<SiblingPairing[]> {
    try {
      const q = query(
        collection(db, 'siblingPairings'),
        where('parentEmail', '==', parentEmail),
        where('status', 'in', ['pending', 'paired', 'manual_review'])
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SiblingPairing[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Add new child to existing family pairing
   */
  private async addToExistingFamily(
    registrationData: SiblingRequest,
    existingPairings: SiblingPairing[]
  ): Promise<void> {
    try {
      const pairing = existingPairings[0]; // Use the first existing pairing
      const policy = this.policies.get(registrationData.requestedTeams[0]);

      const newChild = {
        id: registrationData.children[0].firstName + '_' + registrationData.children[0].lastName,
        name: `${registrationData.children[0].firstName} ${registrationData.children[0].lastName}`,
        dateOfBirth: registrationData.children[0].dateOfBirth,
        age: this.calculateAge(registrationData.children[0].dateOfBirth),
        league: registrationData.requestedTeams[0],
        registrationId: registrationData.id,
        registrationDate: registrationData.createdAt
      };

      // Add new child to existing pairing
      const updatedChildren = [...pairing.children, newChild];
      
      // Check for conflicts
      const conflicts = this.checkSiblingConflicts(updatedChildren, policy);
      
      const newStatus = conflicts.length > 0 ? 'conflict' : 'pending';
      
      // Update pairing
      const pairingRef = doc(db, 'siblingPairings', pairing.id!);
      await updateDoc(pairingRef, {
        children: updatedChildren,
        status: newStatus,
        conflicts: conflicts.length > 0 ? conflicts : null,
        updatedAt: serverTimestamp()
      });

      // Process pairing if no conflicts
      if (conflicts.length === 0) {
        await this.processPairing(pairing.id!);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new family pairing
   */
  private async createNewFamilyPairing(registrationData: SiblingRequest): Promise<void> {
    try {
      const familyId = `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newChild = {
        id: registrationData.children[0].firstName + '_' + registrationData.children[0].lastName,
        name: `${registrationData.children[0].firstName} ${registrationData.children[0].lastName}`,
        dateOfBirth: registrationData.children[0].dateOfBirth,
        age: this.calculateAge(registrationData.children[0].dateOfBirth),
        league: registrationData.requestedTeams[0],
        registrationId: registrationData.id,
        registrationDate: registrationData.createdAt
      };

      const pairing: SiblingPairing = {
        familyId,
        parentName: `${registrationData.parentId}`, // This should be actual parent name
        parentEmail: `${registrationData.parentId}@example.com`, // This should be actual email
        parentPhone: '', // This should be actual phone
        children: [newChild],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add to Firestore
      await addDoc(collection(db, 'siblingPairings'), {
        ...pairing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check for conflicts between siblings
   */
  private checkSiblingConflicts(
    children: SiblingPairing['children'],
    policy?: SiblingPairingPolicy
  ): SiblingPairing['conflicts'] {
    const conflicts: SiblingPairing['conflicts'] = [];

    if (children.length < 2) return conflicts;

    // Check age differences
    const ages = children.map(child => child.age);
    const maxAge = Math.max(...ages);
    const minAge = Math.min(...ages);
    const ageDifference = maxAge - minAge;

    if (policy && ageDifference > policy.maxAgeDifference) {
      children.forEach(child => {
        if (child.age === maxAge || child.age === minAge) {
          conflicts.push({
            childId: child.id,
            childName: child.name,
            issue: `Age difference (${ageDifference} years) exceeds maximum allowed (${policy.maxAgeDifference} years)`
          });
        }
      });
    }

    // Check league compatibility
    const leagues = [...new Set(children.map(child => child.league))];
    if (leagues.length > 1 && policy && !policy.allowCrossLeaguePairing) {
      children.forEach(child => {
        conflicts.push({
          childId: child.id,
          childName: child.name,
          issue: `Cross-league pairing not allowed. Child registered for ${child.league}`
        });
      });
    }

    // Check team assignment conflicts
    const teams = children.map(child => child.team).filter(Boolean);
    if (teams.length > 0 && policy && policy.requireSameTeam) {
      const uniqueTeams = [...new Set(teams)];
      if (uniqueTeams.length > 1) {
        children.forEach(child => {
          if (child.team) {
            conflicts.push({
              childId: child.id,
              childName: child.name,
              issue: `Team assignment conflict. Child assigned to ${child.team}`
            });
          }
        });
      }
    }

    return conflicts;
  }

  /**
   * Process sibling pairing
   */
  async processPairing(pairingId: string): Promise<void> {
    try {
      if (this.processingQueue.has(pairingId)) {
        return;
      }

      this.processingQueue.add(pairingId);

      const pairingRef = doc(db, 'siblingPairings', pairingId);
      const pairingSnap = await getDoc(pairingRef);
      
      if (!pairingSnap.exists()) {
        throw new Error('Sibling pairing not found');
      }

      const pairing = pairingSnap.data() as SiblingPairing;
      const policy = this.policies.get(pairing.children[0].league);

      if (!policy || !policy.enableSiblingPairing) {
        await updateDoc(pairingRef, {
          status: 'resolved',
          notes: 'Sibling pairing disabled for this league',
          updatedAt: serverTimestamp()
        });
        return;
      }

      // Check for conflicts
      const conflicts = this.checkSiblingConflicts(pairing.children, policy);
      
      if (conflicts.length > 0) {
        const newStatus = conflicts.length >= policy.manualReviewThreshold ? 'manual_review' : 'conflict';
        
        await updateDoc(pairingRef, {
          status: newStatus,
          conflicts,
          updatedAt: serverTimestamp()
        });

        if (newStatus === 'manual_review') {
          await this.sendManualReviewNotification(pairing);
        }
      } else {
        // Auto-assign team if enabled
        if (policy.autoAssignTeam) {
          await this.assignTeamToSiblings(pairing, policy);
        }

        await updateDoc(pairingRef, {
          status: 'paired',
          updatedAt: serverTimestamp()
        });

        await this.sendPairingConfirmation(pairing);
      }
    } catch (error) {
      throw error;
    } finally {
      this.processingQueue.delete(pairingId);
    }
  }

  /**
   * Assign team to siblings
   */
  private async assignTeamToSiblings(pairing: SiblingPairing, policy: SiblingPairingPolicy): Promise<void> {
    try {
      // Find available team in the league
      const teamQuery = query(
        collection(db, 'teams'),
        where('league', '==', pairing.children[0].league),
        where('currentSize', '<', 'maxSize')
      );

      const teamSnapshot = await getDocs(teamQuery);
      const availableTeams = teamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (availableTeams.length === 0) {
        throw new Error('No available teams in league');
      }

      // Select team with most capacity
      const selectedTeam = availableTeams.reduce((prev, current) => 
        (current.maxSize - current.currentSize) > (prev.maxSize - prev.currentSize) ? current : prev
      );

      // Update all children with team assignment
      const batch = writeBatch(db);
      
      pairing.children.forEach(child => {
        const childRef = doc(db, 'registrations', child.registrationId);
        batch.update(childRef, {
          team: selectedTeam.id,
          teamName: selectedTeam.name,
          updatedAt: serverTimestamp()
        });
      });

      // Update team capacity
      const teamRef = doc(db, 'teams', selectedTeam.id);
      batch.update(teamRef, {
        currentSize: increment(pairing.children.length),
        updatedAt: serverTimestamp()
      });

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resolve pairing conflicts manually
   */
  async resolvePairingConflicts(
    pairingId: string,
    resolution: {
      action: 'approve' | 'deny' | 'modify';
      notes: string;
      resolvedBy: string;
      teamAssignment?: string;
    }
  ): Promise<void> {
    try {
      const pairingRef = doc(db, 'siblingPairings', pairingId);
      const pairingSnap = await getDoc(pairingRef);
      
      if (!pairingSnap.exists()) {
        throw new Error('Sibling pairing not found');
      }

      const pairing = pairingSnap.data() as SiblingPairing;

      if (resolution.action === 'approve') {
        // Override conflicts and approve
        await updateDoc(pairingRef, {
          status: 'paired',
          notes: resolution.notes,
          resolvedBy: resolution.resolvedBy,
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (resolution.teamAssignment) {
          await this.assignSpecificTeam(pairing, resolution.teamAssignment);
        }

        await this.sendPairingConfirmation(pairing);
      } else if (resolution.action === 'deny') {
        // Mark as resolved but denied
        await updateDoc(pairingRef, {
          status: 'resolved',
          notes: resolution.notes,
          resolvedBy: resolution.resolvedBy,
          resolvedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (resolution.action === 'modify') {
        // TODO: Implement modification logic
        // This would involve updating registrations or team assignments
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign specific team to siblings
   */
  private async assignSpecificTeam(pairing: SiblingPairing, teamId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      pairing.children.forEach(child => {
        const childRef = doc(db, 'registrations', child.registrationId);
        batch.update(childRef, {
          team: teamId,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sibling pairings for a league
   */
  async getSiblingPairings(leagueId?: string): Promise<SiblingPairing[]> {
    try {
      let q = query(
        collection(db, 'siblingPairings'),
        orderBy('createdAt', 'desc')
      );

      if (leagueId) {
        q = query(
          collection(db, 'siblingPairings'),
          where('children', 'array-contains', { league: leagueId }),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SiblingPairing[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get sibling pairing analytics
   */
  async getSiblingPairingAnalytics(): Promise<SiblingPairingAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, 'siblingPairings'));
      const pairings = snapshot.docs.map(doc => doc.data() as SiblingPairing);

      const totalPairings = pairings.length;
      const successfulPairings = pairings.filter(p => p.status === 'paired').length;
      const conflicts = pairings.filter(p => p.status === 'conflict').length;
      const manualReviews = pairings.filter(p => p.status === 'manual_review').length;

      const successRate = totalPairings > 0 ? (successfulPairings / totalPairings) * 100 : 0;

      // Calculate average processing time
      const resolvedPairings = pairings.filter(p => p.status === 'resolved' && p.resolvedAt);
      const totalProcessingTime = resolvedPairings.reduce((sum, p) => {
        return sum + (p.resolvedAt!.getTime() - p.createdAt.getTime());
      }, 0);
      const averageProcessingTime = resolvedPairings.length > 0 ? totalProcessingTime / resolvedPairings.length : 0;

      // League breakdown
      const leagueBreakdown: Record<string, number> = {};
      pairings.forEach(p => {
        p.children.forEach(child => {
          leagueBreakdown[child.league] = (leagueBreakdown[child.league] || 0) + 1;
        });
      });

      // Common conflicts
      const commonConflicts: Record<string, number> = {};
      pairings.forEach(p => {
        p.conflicts?.forEach(conflict => {
          const issue = conflict.issue.split(' - ')[0]; // Get main issue type
          commonConflicts[issue] = (commonConflicts[issue] || 0) + 1;
        });
      });

      return {
        totalPairings,
        successfulPairings,
        conflicts,
        manualReviews,
        averageProcessingTime,
        successRate,
        leagueBreakdown,
        commonConflicts
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listen to sibling pairing changes
   */
  subscribeToSiblingPairings(callback: (pairings: SiblingPairing[]) => void): () => void {
    const q = query(
      collection(db, 'siblingPairings'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pairings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SiblingPairing[];
      
      callback(pairings);
    });

    this.listeners.set('siblingPairings', unsubscribe);
    return unsubscribe;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Send manual review notification
   */
  private async sendManualReviewNotification(pairing: SiblingPairing): Promise<void> {
    try {
      const notificationData = {
        type: 'sibling_pairing_review',
        recipient: 'rec.director@cary.gov', // TODO: Get from config
        subject: 'Sibling Pairing Requires Manual Review',
        template: 'sibling-pairing-review',
        data: {
          familyId: pairing.familyId,
          parentName: pairing.parentName,
          children: pairing.children,
          conflicts: pairing.conflicts
        }
      };

      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
    } catch (error) {
      }
  }

  /**
   * Send pairing confirmation
   */
  private async sendPairingConfirmation(pairing: SiblingPairing): Promise<void> {
    try {
      const notificationData = {
        type: 'sibling_pairing_confirmed',
        recipient: pairing.parentEmail,
        subject: 'Sibling Pairing Confirmed',
        template: 'sibling-pairing-confirmed',
        data: {
          children: pairing.children,
          team: pairing.children[0].team
        }
      };

      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
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
export const siblingPairingQueue = SiblingPairingQueue.getInstance(); 