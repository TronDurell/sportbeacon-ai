import { collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserEligibilityRequest {
  userId: string;
  leagueId: string;
  userGender: string;
  userAge: number;
  birthSex?: string;
  skillLevel?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
  requiresReview?: boolean;
  conflictType?: string;
  suggestedAction?: string;
}

export interface ExceptionRequest {
  userId: string;
  leagueId: string;
  reason: string;
  supportingDocuments?: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface League {
  id: string;
  name: string;
  genderPolicy: 'open' | 'boys-only' | 'girls-only' | 'birth-sex-only' | 'admin-review';
  ageGroup: string;
  sport: string;
  skillLevel?: string;
}

export class TownRecIntegrityModule {
  private leagues: Map<string, League> = new Map();

  constructor() {
    this.loadLeagues();
  }

  private async loadLeagues(): Promise<void> {
    try {
      const leaguesRef = collection(db, 'leagues');
      const snapshot = await getDocs(leaguesRef);
      
      snapshot.forEach(doc => {
        const league = doc.data() as League;
        this.leagues.set(doc.id, { ...league, id: doc.id });
      });
    } catch (error) {
      console.error('Failed to load leagues:', error);
    }
  }

  async validateUserEligibility(request: UserEligibilityRequest): Promise<EligibilityResult> {
    const league = this.leagues.get(request.leagueId);
    
    if (!league) {
      return {
        eligible: false,
        reason: 'League not found',
        conflictType: 'league-not-found'
      };
    }

    // Check gender policy
    const genderResult = this.validateGenderPolicy(league, request);
    if (!genderResult.eligible) {
      return genderResult;
    }

    // Check age group
    const ageResult = this.validateAgeGroup(league, request);
    if (!ageResult.eligible) {
      return ageResult;
    }

    // Check skill level
    if (league.skillLevel && request.skillLevel) {
      const skillResult = this.validateSkillLevel(league, request);
      if (!skillResult.eligible) {
        return skillResult;
      }
    }

    return {
      eligible: true,
      reason: 'User meets all eligibility requirements'
    };
  }

  private validateGenderPolicy(league: League, request: UserEligibilityRequest): EligibilityResult {
    switch (league.genderPolicy) {
      case 'open':
        return { eligible: true, reason: 'Open policy allows all users' };
      
      case 'boys-only':
        if (request.userGender === 'male' || request.userGender === 'boy') {
          return { eligible: true, reason: 'User meets boys-only policy' };
        }
        return {
          eligible: false,
          reason: 'League restricted to males only',
          conflictType: 'gender-policy-mismatch',
          suggestedAction: 'submit-exception-request'
        };
      
      case 'girls-only':
        if (request.userGender === 'female' || request.userGender === 'girl') {
          return { eligible: true, reason: 'User meets girls-only policy' };
        }
        return {
          eligible: false,
          reason: 'League restricted to females only',
          conflictType: 'gender-policy-mismatch',
          suggestedAction: 'submit-exception-request'
        };
      
      case 'birth-sex-only':
        if (request.birthSex === 'male' && (request.userGender === 'male' || request.userGender === 'boy')) {
          return { eligible: true, reason: 'User meets birth-sex policy' };
        }
        return {
          eligible: false,
          reason: 'League restricted to birth-assigned males only',
          conflictType: 'gender-policy-mismatch',
          suggestedAction: 'submit-exception-request'
        };
      
      case 'admin-review':
        if (request.userGender === 'non-binary' || request.userGender === 'other') {
          return {
            eligible: false,
            reason: 'Requires admin review for gender policy compliance',
            requiresReview: true,
            conflictType: 'gender-policy-review',
            suggestedAction: 'submit-exception-request'
          };
        }
        return { eligible: true, reason: 'User meets admin review policy' };
      
      default:
        return { eligible: true, reason: 'No gender restrictions' };
    }
  }

  private validateAgeGroup(league: League, request: UserEligibilityRequest): EligibilityResult {
    const ageRange = league.ageGroup.split('-').map(Number);
    const minAge = ageRange[0];
    const maxAge = ageRange[1] || ageRange[0];

    if (request.userAge >= minAge && request.userAge <= maxAge) {
      return { eligible: true, reason: 'User meets age requirements' };
    }

    return {
      eligible: false,
      reason: `User age ${request.userAge} outside league age range ${league.ageGroup}`,
      conflictType: 'age-group-mismatch',
      suggestedAction: 'find-alternative-league'
    };
  }

  private validateSkillLevel(league: League, request: UserEligibilityRequest): EligibilityResult {
    if (league.skillLevel === request.skillLevel) {
      return { eligible: true, reason: 'User meets skill level requirements' };
    }

    return {
      eligible: false,
      reason: `User skill level ${request.skillLevel} does not match league requirement ${league.skillLevel}`,
      conflictType: 'skill-level-mismatch',
      suggestedAction: 'recommend-training-program'
    };
  }

  async submitExceptionRequest(request: ExceptionRequest): Promise<string> {
    try {
      const exceptionRef = collection(db, 'exception_requests');
      const docRef = await addDoc(exceptionRef, {
        ...request,
        status: 'pending',
        timestamp: Timestamp.now(),
        createdAt: new Date().toISOString()
      });

      // Create audit log entry
      await this.createAuditLog({
        action: 'exception_request_submitted',
        userId: request.userId,
        leagueId: request.leagueId,
        details: request.reason,
        timestamp: Timestamp.now()
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to submit exception request:', error);
      throw new Error('Failed to submit exception request');
    }
  }

  private async createAuditLog(auditEntry: any): Promise<void> {
    try {
      const auditRef = collection(db, 'audit_logs');
      await addDoc(auditRef, auditEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getExceptionRequests(leagueId?: string): Promise<any[]> {
    try {
      const requestsRef = collection(db, 'exception_requests');
      let q = query(requestsRef);
      
      if (leagueId) {
        q = query(requestsRef, where('leagueId', '==', leagueId));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Failed to get exception requests:', error);
      return [];
    }
  }

  async updateExceptionRequest(requestId: string, status: 'approved' | 'denied' | 'pending', adminNotes?: string): Promise<void> {
    try {
      const requestRef = doc(db, 'exception_requests', requestId);
      await updateDoc(requestRef, {
        status,
        adminNotes,
        updatedAt: new Date().toISOString(),
        reviewedAt: Timestamp.now()
      });

      // Create audit log entry
      await this.createAuditLog({
        action: 'exception_request_updated',
        requestId,
        status,
        adminNotes,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Failed to update exception request:', error);
      throw new Error('Failed to update exception request');
    }
  }
} 