import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level?: number;
  stats?: any;
  [key: string]: any;
}

export default function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const fetchProfile = async () => {
      try {
        const ref = doc(db, 'users', userId);
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) {
          setProfile({ id: snapshot.id, ...snapshot.data() } as UserProfile);
        } else {
          setProfile(null);
          setError('Profile not found');
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
} 