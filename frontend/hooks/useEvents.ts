import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/init';

export default function useEvents(userId: string) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const q = query(collection(db, 'events'), where('participants', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      setEvents(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchEvents();
  }, [userId]);

  const rsvpEvent = async (eventId: string) => {
    const ref = collection(db, 'events', eventId, 'rsvps');
    await addDoc(ref, { userId });
  };

  return { events, rsvpEvent };
} 