import { firestore } from '../../lib/firebase';
import { doc, setDoc, collection, addDoc, updateDoc, getDoc } from 'firebase/firestore';

// Extended Firebase schema for Range Officer feature

export interface ShotDetail {
  score: number;
  modelConfidence: number;
  muzzleDrift: number;
  userCorrected: boolean;
  timestamp: Date;
  feedback?: string;
}

export interface ExtendedRangeSession {
  uid: string;
  drillType: string;
  date: Date;
  scores: number[];
  feedback: string[];
  usedHardware: boolean;
  avgScore: number;
  totalShots: number;
  shotDetails: ShotDetail[];
  sessionDuration: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  equipment?: {
    firearm: string;
    ammunition: string;
    optics?: string;
  };
  coachTip?: string;
  userNotes?: string;
}

export interface CustomDrill {
  id?: string;
  name: string;
  repCount: number;
  scoringFocus: 'accuracy' | 'speed' | 'balance';
  timeLimit?: number;
  targetDistance?: number;
  customFeedback: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'defensive' | 'competition' | 'training' | 'custom';
}

export interface UserRangeStats {
  isShooterVerified: boolean;
  verificationDate?: Date;
  birthDate?: string;
  optInLeaderboard: boolean;
  rangeStats: {
    totalSessions: number;
    avgScore: number;
    bestDrill: string;
    totalShots: number;
    lastSessionDate?: Date;
    bestScore: number;
    improvementRate: number;
    favoriteDrill: string;
    totalPracticeTime: number;
  };
  preferences: {
    voiceFeedback: boolean;
    hapticFeedback: boolean;
    autoSave: boolean;
    shareSessions: boolean;
    leaderboardVisibility: boolean;
  };
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  drillType: string;
  avgScore: number;
  totalShots: number;
  date: Date;
  region: string;
  age: number;
  usedHardware: boolean;
  shotDetails?: ShotDetail[];
}

// Extended session creation with shot details
export const createExtendedRangeSession = async (
  sessionData: Omit<ExtendedRangeSession, 'avgScore' | 'shotDetails'>,
  shotDetails: ShotDetail[]
): Promise<string> => {
  try {
    const avgScore = sessionData.scores.length > 0 
      ? sessionData.scores.reduce((a, b) => a + b, 0) / sessionData.scores.length 
      : 0;

    const session: ExtendedRangeSession = {
      ...sessionData,
      avgScore,
      shotDetails
    };

    const sessionRef = await addDoc(collection(firestore, 'range_sessions'), session);
    
    console.log('Extended range session created:', sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Failed to create extended range session:', error);
    throw error;
  }
};

// Update session with shot details
export const updateSessionWithShotDetails = async (
  sessionId: string, 
  shotDetails: ShotDetail[]
): Promise<boolean> => {
  try {
    const sessionRef = doc(firestore, 'range_sessions', sessionId);
    await updateDoc(sessionRef, {
      shotDetails,
      updatedAt: new Date()
    });
    
    console.log('Shot details added to session');
    return true;
  } catch (error) {
    console.error('Failed to add shot details:', error);
    return false;
  }
};

// Create custom drill
export const createCustomDrill = async (
  uid: string, 
  drillData: Omit<CustomDrill, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const drill: Omit<CustomDrill, 'id'> = {
      ...drillData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const drillsRef = collection(firestore, 'users', uid, 'custom_drills');
    const drillRef = await addDoc(drillsRef, drill);
    
    console.log('Custom drill created:', drillRef.id);
    return drillRef.id;
  } catch (error) {
    console.error('Failed to create custom drill:', error);
    throw error;
  }
};

// Get custom drills for user
export const getCustomDrills = async (uid: string): Promise<CustomDrill[]> => {
  try {
    const drillsRef = collection(firestore, 'users', uid, 'custom_drills');
    const querySnapshot = await getDocs(drillsRef);
    
    const drills: CustomDrill[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      drills.push({
        id: doc.id,
        name: data.name,
        repCount: data.repCount,
        scoringFocus: data.scoringFocus,
        timeLimit: data.timeLimit,
        targetDistance: data.targetDistance,
        customFeedback: data.customFeedback || [],
        isActive: data.isActive !== false,
        difficulty: data.difficulty || 'intermediate',
        category: data.category || 'custom',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return drills;
  } catch (error) {
    console.error('Failed to get custom drills:', error);
    return [];
  }
};

// Update user preferences
export const updateUserPreferences = async (
  uid: string, 
  preferences: Partial<UserRangeStats['preferences']>
): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, {
      'preferences': preferences,
      updatedAt: new Date()
    });
    
    console.log('User preferences updated');
    return true;
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return false;
  }
};

// Get user preferences
export const getUserPreferences = async (uid: string): Promise<UserRangeStats['preferences'] | null> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists) {
      const data = userDoc.data();
      return data.preferences || {
        voiceFeedback: true,
        hapticFeedback: true,
        autoSave: true,
        shareSessions: false,
        leaderboardVisibility: false
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return null;
  }
};

// Calculate session analytics
export const calculateSessionAnalytics = (shotDetails: ShotDetail[]) => {
  if (shotDetails.length === 0) return null;

  const scores = shotDetails.map(s => s.score);
  const confidences = shotDetails.map(s => s.modelConfidence);
  const drifts = shotDetails.map(s => s.muzzleDrift);

  return {
    avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    bestScore: Math.max(...scores),
    worstScore: Math.min(...scores),
    avgConfidence: confidences.reduce((a, b) => a + b, 0) / confidences.length,
    avgDrift: drifts.reduce((a, b) => a + b, 0) / drifts.length,
    consistency: 1 - (Math.std(scores) / Math.mean(scores)),
    improvement: scores[scores.length - 1] - scores[0],
    totalShots: shotDetails.length
  };
};

// Update user stats with new session
export const updateUserStatsWithSession = async (
  uid: string, 
  session: ExtendedRangeSession
): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists) return false;
    
    const data = userDoc.data();
    const currentStats = data.rangeStats || {
      totalSessions: 0,
      avgScore: 0,
      bestDrill: '',
      totalShots: 0,
      bestScore: 0,
      improvementRate: 0,
      favoriteDrill: '',
      totalPracticeTime: 0
    };

    const newStats = {
      totalSessions: currentStats.totalSessions + 1,
      totalShots: currentStats.totalShots + session.totalShots,
      lastSessionDate: session.date,
      totalPracticeTime: currentStats.totalPracticeTime + session.sessionDuration,
      avgScore: (currentStats.avgScore * currentStats.totalSessions + session.avgScore) / (currentStats.totalSessions + 1),
      bestScore: Math.max(currentStats.bestScore, session.avgScore),
      bestDrill: session.avgScore > currentStats.avgScore ? session.drillType : currentStats.bestDrill,
      improvementRate: calculateImprovementRate(currentStats, session),
      favoriteDrill: calculateFavoriteDrill(currentStats, session)
    };

    await updateDoc(userRef, {
      rangeStats: newStats,
      updatedAt: new Date()
    });

    return true;
  } catch (error) {
    console.error('Failed to update user stats:', error);
    return false;
  }
};

// Helper functions
const calculateImprovementRate = (currentStats: any, session: ExtendedRangeSession): number => {
  const recentSessions = 5; // Consider last 5 sessions
  // This would need to be calculated from actual session history
  return 0; // Placeholder
};

const calculateFavoriteDrill = (currentStats: any, session: ExtendedRangeSession): string => {
  // This would need to be calculated from actual session history
  return session.drillType; // Placeholder
};

// Schema migration function for existing sessions
export const migrateSessionsToExtendedSchema = async (): Promise<boolean> => {
  try {
    const sessionsRef = collection(firestore, 'range_sessions');
    const querySnapshot = await getDocs(sessionsRef);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Add missing fields if they don't exist
      const updates: any = {};
      
      if (!data.shotDetails) {
        updates.shotDetails = [];
      }
      
      if (!data.sessionDuration) {
        updates.sessionDuration = 0;
      }
      
      if (!data.updatedAt) {
        updates.updatedAt = new Date();
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc.ref, updates);
      }
    }
    
    console.log('Schema migration completed');
    return true;
  } catch (error) {
    console.error('Schema migration failed:', error);
    return false;
  }
}; 