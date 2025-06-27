import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'shadcn/ui/button';

interface ChatMessage {
  id?: string;
  text: string;
  isUser: boolean;
  timestamp?: number;
}

function formatTime(ts?: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const TownRecChat: React.FC<{ userId?: string }> = ({ userId = 'demo' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setMessages(msgs => [...msgs, { text: input, isUser: true, timestamp: Date.now() }]);
    try {
      const res = await fetch('/api/coach/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, userId }),
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { text: data.text, isUser: false, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { text: 'AI error: ' + (e as Error).message, isUser: false, timestamp: Date.now() }]);
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-md mx-auto border rounded-xl bg-white dark:bg-gray-900 shadow-lg" role="region" aria-label="TownRec Agent Chat">
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2" tabIndex={0} aria-live="polite">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}> 
            <div className={`rounded-xl px-4 py-2 max-w-xs break-words ${msg.isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}
              tabIndex={0} aria-label={msg.isUser ? 'You' : 'TownRec Agent'}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">{msg.isUser ? 'You' : 'TownRec Agent'}</span>
                <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
              </div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-2 max-w-xs bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 animate-pulse" aria-live="polite">
              <span className="text-xs font-semibold uppercase tracking-wide">TownRec Agent</span>
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
          placeholder="Ask the TownRec Agent..."
          aria-label="Chat input"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { sendMessage(); } }}
        />
        <Button type="submit" disabled={!input.trim() || loading} aria-label="Send message">{loading ? '...' : 'Send'}</Button>
      </form>
    </div>
  );
};

export default TownRecChat; 