import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function useTrainingLog(userId) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'trainingLogs'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      setLogs(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchLogs();
  }, [userId]);

  const addLog = async (logData) => {
    const ref = collection(db, 'trainingLogs');
    await addDoc(ref, { userId, ...logData });
  };

  return { logs, addLog };
} 