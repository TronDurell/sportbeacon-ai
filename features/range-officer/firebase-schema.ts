import { firestore } from '../../lib/firebase';
import { doc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';

// Firebase schema updates for Range Officer feature

export interface RangeSession {
  uid: string;
  drillType: string;
  date: Date;
  scores: number[];
  feedback: string[];
  usedHardware: boolean;
  avgScore: number;
  totalShots: number;
  coachTip?: string;
  sessionDuration?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserRangeStats {
  isShooterVerified: boolean;
  verificationDate?: Date;
  birthDate?: string;
  rangeStats: {
    totalSessions: number;
    avgScore: number;
    bestDrill: string;
    totalShots: number;
    lastSessionDate?: Date;
  };
}

export const updateUserSchema = async (uid: string, rangeData: Partial<UserRangeStats>) => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await setDoc(userRef, rangeData, { merge: true });
    
    console.log('User schema updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update user schema:', error);
    return false;
  }
};

export const createRangeSession = async (sessionData: Omit<RangeSession, 'avgScore'>) => {
  try {
    const avgScore = sessionData.scores.length > 0 
      ? sessionData.scores.reduce((a, b) => a + b, 0) / sessionData.scores.length 
      : 0;

    const session: RangeSession = {
      ...sessionData,
      avgScore
    };

    const sessionRef = await addDoc(collection(firestore, 'range_sessions'), session);
    
    console.log('Range session created:', sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Failed to create range session:', error);
    throw error;
  }
};

export const updateSessionWithCoachTip = async (sessionId: string, coachTip: string) => {
  try {
    const sessionRef = doc(firestore, 'range_sessions', sessionId);
    await updateDoc(sessionRef, {
      coachTip,
      updatedAt: new Date()
    });
    
    console.log('Coach tip added to session');
    return true;
  } catch (error) {
    console.error('Failed to add coach tip:', error);
    return false;
  }
};

export const getUserRangeStats = async (uid: string): Promise<UserRangeStats | null> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      return {
        isShooterVerified: data?.isShooterVerified || false,
        verificationDate: data?.verificationDate?.toDate(),
        birthDate: data?.birthDate,
        rangeStats: {
          totalSessions: data?.rangeStats?.totalSessions || 0,
          avgScore: data?.rangeStats?.avgScore || 0,
          bestDrill: data?.rangeStats?.bestDrill || '',
          totalShots: data?.rangeStats?.totalShots || 0,
          lastSessionDate: data?.rangeStats?.lastSessionDate?.toDate()
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user range stats:', error);
    return null;
  }
};

export const getRangeSessions = async (uid: string, limit: number = 50) => {
  try {
    const sessionsRef = collection(firestore, 'range_sessions');
    const q = query(
      sessionsRef,
      where('uid', '==', uid),
      orderBy('date', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: RangeSession[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        uid: data.uid,
        drillType: data.drillType,
        date: data.date.toDate(),
        scores: data.scores || [],
        feedback: data.feedback || [],
        usedHardware: data.usedHardware || false,
        avgScore: data.avgScore || 0,
        totalShots: data.totalShots || 0,
        coachTip: data.coachTip,
        sessionDuration: data.sessionDuration,
        location: data.location
      });
    });
    
    return sessions;
  } catch (error) {
    console.error('Failed to get range sessions:', error);
    return [];
  }
};

// Schema migration function
export const migrateToRangeOfficerSchema = async (uid: string) => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      
      // Add range officer fields if they don't exist
      const updates: Partial<UserRangeStats> = {};
      
      if (data?.isShooterVerified === undefined) {
        updates.isShooterVerified = false;
      }
      
      if (!data?.rangeStats) {
        updates.rangeStats = {
          totalSessions: 0,
          avgScore: 0,
          bestDrill: '',
          totalShots: 0
        };
      }
      
      if (Object.keys(updates).length > 0) {
        await setDoc(userRef, updates, { merge: true });
        console.log('Schema migration completed');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Schema migration failed:', error);
    return false;
  }
}; 