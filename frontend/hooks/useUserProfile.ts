import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct

export default function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);

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