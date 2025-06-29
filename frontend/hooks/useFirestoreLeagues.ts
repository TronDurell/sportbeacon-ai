import { useEffect, useState, useCallback } from 'react';
import { League } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestoreLeagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = () => {
      try {
        unsubscribe = onSnapshot(
          collection(db, 'leagues'), 
          (snapshot: QuerySnapshot<DocumentData>) => {
            const leaguesData = snapshot.docs.map(d => ({ 
              id: d.id, 
              ...d.data() 
            } as League));
            setLeagues(leaguesData);
            setLoading(false);
            setError(null);
          }, 
          (err) => {
            console.error('Firestore leagues listener error:', err);
            setError(err.message);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Failed to setup leagues listener:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup function to prevent memory leaks
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [db]);

  const createLeague = useCallback(async (data: Omit<League, 'id'>) => {
    try {
      await addDoc(collection(db, 'leagues'), data);
    } catch (err) {
      console.error('Failed to create league:', err);
      throw err;
    }
  }, [db]);

  const updateLeague = useCallback(async (id: string, data: Partial<League>) => {
    try {
      await updateDoc(doc(db, 'leagues', id), data);
    } catch (err) {
      console.error('Failed to update league:', err);
      throw err;
    }
  }, [db]);

  const deleteLeague = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leagues', id));
    } catch (err) {
      console.error('Failed to delete league:', err);
      throw err;
    }
  }, [db]);

  return { 
    leagues, 
    loading, 
    error, 
    createLeague, 
    updateLeague, 
    deleteLeague 
  };
} 