import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useNotifications(userId: string) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAlerts(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  return { alerts };
} 