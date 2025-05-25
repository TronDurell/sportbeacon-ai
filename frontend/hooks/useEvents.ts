import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useEvents(userId) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const q = query(collection(db, 'events'), where('participants', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      setEvents(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchEvents();
  }, [userId]);

  const rsvpEvent = async (eventId) => {
    const ref = collection(db, 'events', eventId, 'rsvps');
    await addDoc(ref, { userId });
  };

  return { events, rsvpEvent };
} 