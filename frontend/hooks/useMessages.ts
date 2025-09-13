import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/init';

export default function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = async (text: string, senderId: string) => {
    await addDoc(collection(db, 'messages'), {
      conversationId,
      text,
      senderId,
      timestamp: new Date(),
    });
  };

  return { messages, sendMessage };
} 