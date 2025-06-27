import { useEffect, useState } from 'react';
import { Payment } from '../../lib/models/townRecTypes';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

export function useFirestorePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'payments'), snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
      setLoading(false);
    }, err => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const createPayment = async (data: Omit<Payment, 'id'>) => {
    await addDoc(collection(db, 'payments'), data);
  };
  const updatePayment = async (id: string, data: Partial<Payment>) => {
    await updateDoc(doc(db, 'payments', id), data);
  };
  const deletePayment = async (id: string) => {
    await deleteDoc(doc(db, 'payments', id));
  };

  return { payments, loading, error, createPayment, updatePayment, deletePayment };
} 