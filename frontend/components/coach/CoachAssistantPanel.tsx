import React, { useState, useEffect, useRef } from 'react';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { app } from '../../lib/firebase';
import { Button } from 'shadcn/ui/button';

interface CoachMessage {
  id?: string;
  message: string;
  isUser: boolean;
  timestamp?: any;
  relatedStats?: string[];
  suggestedDrills?: string[];
}

function formatTime(ts: any) {
  if (!ts) return '';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CoachAssistantPanel: React.FC<{ userId?: string }> = ({ userId = 'demo' }) => {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore(app);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'coachChats'), snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as CoachMessage)));
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    await addDoc(collection(db, 'coachChats'), {
      message: input,
      isUser: true,
      timestamp: serverTimestamp(),
    });
    try {
      const res = await fetch('/api/coach/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId }),
      });
      const data = await res.json();
      await addDoc(collection(db, 'coachChats'), {
        message: data.text,
        isUser: false,
        timestamp: serverTimestamp(),
        suggestedDrills: data.actions?.filter((a: any) => a.label.toLowerCase().includes('drill')).map((a: any) => a.label),
      });
    } catch (e) {
      await addDoc(collection(db, 'coachChats'), {
        message: 'AI error: ' + (e as Error).message,
        isUser: false,
        timestamp: serverTimestamp(),
      });
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-md mx-auto border rounded-xl bg-white dark:bg-gray-900 shadow-lg" role="region" aria-label="Coach Assistant Chat">
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2" tabIndex={0} aria-live="polite">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}> 
            <div className={`rounded-xl px-4 py-2 max-w-xs break-words ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}
              tabIndex={0} aria-label={msg.isUser ? 'You' : 'Coach AI'}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">{msg.isUser ? 'You' : 'Coach AI'}</span>
                <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div>{msg.message}</div>
              {msg.suggestedDrills && (
                <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                  Suggested Drills: {msg.suggestedDrills.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2 max-w-xs bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-pulse" aria-live="polite">
              <span className="text-xs font-semibold uppercase tracking-wide">Coach AI</span>
              <div className="mt-1">Typing...</div>
            </div>
          </div>
        )}
      </div>
      {error && <div className="text-red-600 text-center p-2" role="alert">{error}</div>}
      <form className="flex gap-2 p-2 border-t bg-white dark:bg-gray-900 sticky bottom-0" onSubmit={e => { e.preventDefault(); sendMessage(); }} aria-label="Send message">
        <input
          ref={inputRef}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 p-2 focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask the Coach Assistant..."
          aria-label="Chat input"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { sendMessage(); } }}
        />
        <Button type="submit" disabled={!input.trim() || loading} aria-label="Send message">{loading ? '...' : 'Send'}</Button>
      </form>
    </div>
  );
};

export default CoachAssistantPanel; 