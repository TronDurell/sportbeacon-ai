import { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure this path is correct

export default function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!conversationId) return;

    const q = query(collection(db, 'messages'), where('conversationId', '==', conversationId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = async (text, senderId) => {
    await addDoc(collection(db, 'messages'), {
      conversationId,
      text,
      senderId,
      timestamp: new Date(),
    });
  };

  return { messages, sendMessage };
} 