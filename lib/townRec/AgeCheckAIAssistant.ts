import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

export interface AgeOverrideRequest {
  id?: string;
  childName: string;
  childDateOfBirth: Date;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  requestedLeague: string;
  currentAge: number;
  ageRequirement: number;
  reason: string;
  evidence?: string[];
  requestedBy: string;
  requestedByRole: 'TownStaff' | 'RecDirector' | 'Parent';
  status: 'pending' | 'approved' | 'denied' | 'auto_approved';
  directorNotes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  familyId?: string;
  previousOverrides?: string[];
  leagueCapacity?: number;
  waitlistPosition?: number;
}

export interface AgeOverridePolicy {
  leagueId: string;
  leagueName: string;
  minAge: number;
  maxAge: number;
  allowOverrides: boolean;
  overrideCriteria: {
    maxAgeDifference: number;
    requireDirectorApproval: boolean;
    requireEvidence: boolean;
    autoApproveThreshold: number;
  };
  directorApprovalRequired: boolean;
  notes?: string;
}

export interface AgeOverrideAnalytics {
  totalRequests: number;
  approvedCount: number;
  deniedCount: number;
  pendingCount: number;
  averageProcessingTime: number;
  approvalRate: number;
  commonReasons: Record<string, number>;
  leagueBreakdown: Record<string, number>;
}

export class AgeCheckAIAssistant {
  private static instance: AgeCheckAIAssistant;
  private policies: Map<string, AgeOverridePolicy> = new Map();
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): AgeCheckAIAssistant {
    if (!AgeCheckAIAssistant.instance) {
      AgeCheckAIAssistant.instance = new AgeCheckAIAssistant();
    }
    return AgeCheckAIAssistant.instance;
  }

  /**
   * Initialize the AI assistant with league policies
   */
  async initialize(): Promise<void> {
    try {
      // Load age override policies from Firestore
      const policiesSnapshot = await getDocs(collection(db, 'ageOverridePolicies'));
      policiesSnapshot.forEach((doc) => {
        const policy = doc.data() as AgeOverridePolicy;
        this.policies.set(policy.leagueId, policy);
      });

      // SECURITY FIX: Removed console.log from production code
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit an age override request
   */
  async submitAgeOverrideRequest(request: Omit<AgeOverrideRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const policy = this.policies.get(request.requestedLeague);
      if (!policy) {
        throw new Error(`No policy found for league: ${request.requestedLeague}`);
      }

      // Validate request against policy
      const validation = this.validateOverrideRequest(request, policy);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check if auto-approval is possible
      const autoApproval = this.checkAutoApproval(request, policy);
      
      const overrideRequest: AgeOverrideRequest = {
        ...request,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: autoApproval ? 'auto_approved' : 'pending'
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'ageOverrides'), {
        ...overrideRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // If auto-approved, process immediately
      if (autoApproval) {
        await this.processAutoApproval(docRef.id, request);
      }

      // Send notifications
      await this.sendNotifications(overrideRequest, autoApproval);

      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate an override request against policy
   */
  private validateOverrideRequest(request: AgeOverrideRequest, policy: AgeOverridePolicy): { isValid: boolean; error?: string } {
    const ageDifference = Math.abs(request.currentAge - policy.maxAge);

    if (!policy.allowOverrides) {
      return { isValid: false, error: 'Age overrides not allowed for this league' };
    }

    if (ageDifference > policy.overrideCriteria.maxAgeDifference) {
      return { isValid: false, error: `Age difference exceeds maximum allowed (${policy.overrideCriteria.maxAgeDifference} years)` };
    }

    if (policy.overrideCriteria.requireEvidence && (!request.evidence || request.evidence.length === 0)) {
      return { isValid: false, error: 'Evidence is required for this override request' };
    }

    return { isValid: true };
  }

  /**
   * Check if request qualifies for auto-approval
   */
  private checkAutoApproval(request: AgeOverrideRequest, policy: AgeOverridePolicy): boolean {
    if (policy.directorApprovalRequired) {
      return false;
    }

    const ageDifference = Math.abs(request.currentAge - policy.maxAge);
    return ageDifference <= policy.overrideCriteria.autoApproveThreshold;
  }

  /**
   * Process auto-approval
   */
  private async processAutoApproval(requestId: string, request: AgeOverrideRequest): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update override request
      const overrideRef = doc(db, 'ageOverrides', requestId);
      batch.update(overrideRef, {
        status: 'auto_approved',
        approvedBy: 'system',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Add to user's rec history
      const historyRef = doc(db, 'users', request.requestedBy, 'recHistory', requestId);
      batch.set(historyRef, {
        type: 'age_override_approved',
        description: `Age override auto-approved for ${request.childName}`,
        timestamp: serverTimestamp(),
        details: request
      });

      await batch.commit();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve or deny an override request (Director only)
   */
  async processOverrideRequest(
    requestId: string, 
    action: 'approve' | 'deny', 
    directorId: string, 
    notes?: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'ageOverrides', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Override request not found');
      }

      const request = requestSnap.data() as AgeOverrideRequest;
      const batch = writeBatch(db);

      // Update override request
      batch.update(requestRef, {
        status: action === 'approve' ? 'approved' : 'denied',
        approvedBy: directorId,
        approvedAt: serverTimestamp(),
        directorNotes: notes,
        updatedAt: serverTimestamp()
      });

      // Add to user's rec history
      const historyRef = doc(db, 'users', request.requestedBy, 'recHistory', requestId);
      batch.set(historyRef, {
        type: `age_override_${action}d`,
        description: `Age override ${action}d for ${request.childName}`,
        timestamp: serverTimestamp(),
        details: { ...request, directorNotes: notes }
      });

      // If approved, check if we need to update waitlist/registration
      if (action === 'approve') {
        await this.handleApprovedOverride(request);
      }

      await batch.commit();

      // Send notifications
      await this.sendNotifications(request, action === 'approve');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle approved override (update registration/waitlist)
   */
  private async handleApprovedOverride(request: AgeOverrideRequest): Promise<void> {
    try {
      // Check if child is on waitlist
      const waitlistQuery = query(
        collection(db, 'waitlists'),
        where('childName', '==', request.childName),
        where('league', '==', request.requestedLeague)
      );
      
      const waitlistSnap = await getDocs(waitlistQuery);
      
      if (!waitlistSnap.empty) {
        // Remove from waitlist and add to registration
        const batch = writeBatch(db);
        
        waitlistSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Add to registrations
        const registrationRef = doc(collection(db, 'registrations'));
        batch.set(registrationRef, {
          childName: request.childName,
          parentName: request.parentName,
          parentEmail: request.parentEmail,
          league: request.requestedLeague,
          registrationDate: serverTimestamp(),
          ageOverride: request.id,
          status: 'active'
        });

        await batch.commit();
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending override requests
   */
  async getPendingOverrides(): Promise<AgeOverrideRequest[]> {
    try {
      const q = query(
        collection(db, 'ageOverrides'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AgeOverrideRequest[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get override requests by user
   */
  async getOverridesByUser(userId: string): Promise<AgeOverrideRequest[]> {
    try {
      const q = query(
        collection(db, 'ageOverrides'),
        where('requestedBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AgeOverrideRequest[];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get override analytics
   */
  async getOverrideAnalytics(): Promise<AgeOverrideAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, 'ageOverrides'));
      const overrides = snapshot.docs.map(doc => doc.data() as AgeOverrideRequest);

      const totalRequests = overrides.length;
      const approvedCount = overrides.filter(o => o.status === 'approved' || o.status === 'auto_approved').length;
      const deniedCount = overrides.filter(o => o.status === 'denied').length;
      const pendingCount = overrides.filter(o => o.status === 'pending').length;

      const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;

      // Calculate average processing time
      const processedOverrides = overrides.filter(o => o.status !== 'pending' && o.approvedAt);
      const totalProcessingTime = processedOverrides.reduce((sum, o) => {
        return sum + (o.approvedAt!.getTime() - o.createdAt.getTime());
      }, 0);
      const averageProcessingTime = processedOverrides.length > 0 ? totalProcessingTime / processedOverrides.length : 0;

      // Common reasons
      const commonReasons: Record<string, number> = {};
      overrides.forEach(o => {
        const reason = o.reason.toLowerCase();
        commonReasons[reason] = (commonReasons[reason] || 0) + 1;
      });

      // League breakdown
      const leagueBreakdown: Record<string, number> = {};
      overrides.forEach(o => {
        leagueBreakdown[o.requestedLeague] = (leagueBreakdown[o.requestedLeague] || 0) + 1;
      });

      return {
        totalRequests,
        approvedCount,
        deniedCount,
        pendingCount,
        averageProcessingTime,
        approvalRate,
        commonReasons,
        leagueBreakdown
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Listen to override requests in real-time
   */
  subscribeToOverrides(callback: (overrides: AgeOverrideRequest[]) => void): () => void {
    const q = query(
      collection(db, 'ageOverrides'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const overrides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AgeOverrideRequest[];
      
      callback(overrides);
    });

    this.listeners.set('overrides', unsubscribe);
    return unsubscribe;
  }

  /**
   * Send notifications for override requests
   */
  private async sendNotifications(request: AgeOverrideRequest, approved: boolean): Promise<void> {
    try {
      // TODO: Implement email/SMS notifications
      // This would integrate with the email templates and notification system
      
      const notificationData = {
        type: 'age_override',
        recipient: request.parentEmail,
        subject: approved ? 'Age Override Approved' : 'Age Override Request Received',
        template: approved ? 'age-override-approved' : 'age-override-received',
        data: {
          childName: request.childName,
          league: request.requestedLeague,
          reason: request.reason,
          directorNotes: request.directorNotes
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
   * Clean up listeners
   */
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  /**
   * Get policy for a specific league
   */
  getPolicy(leagueId: string): AgeOverridePolicy | undefined {
    return this.policies.get(leagueId);
  }

  /**
   * Update policy
   */
  async updatePolicy(policy: AgeOverridePolicy): Promise<void> {
    try {
      const policyRef = doc(db, 'ageOverridePolicies', policy.leagueId);
      await updateDoc(policyRef, {
        ...policy,
        updatedAt: serverTimestamp()
      });
      
      this.policies.set(policy.leagueId, policy);
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const ageCheckAIAssistant = AgeCheckAIAssistant.getInstance(); 