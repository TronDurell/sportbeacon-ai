import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/init';

export default function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const ref = doc(db, 'users', userId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      }
    };

    fetchProfile();
  }, [userId]);

  return profile;
} 