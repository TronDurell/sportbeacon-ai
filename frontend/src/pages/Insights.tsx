import React, { useState } from 'react';
import { analyzePlayer } from '@/services/api';

const Insights: React.FC = () => {
  const [userId, setUserId] = useState('user123');
  const [question, setQuestion] = useState('How did I perform last week?');
  const [includeStats, setIncludeStats] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzePlayer({ user_id: userId, question, include_stats: includeStats });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Insights</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 600 }}>
        <label>
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </label>
        <label>
          Question
          <input value={question} onChange={(e) => setQuestion(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={includeStats} onChange={(e) => setIncludeStats(e.target.checked)} /> Include Stats
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Ask'}</button>
      </form>
      {error && <pre style={{ color: 'red' }}>{error}</pre>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default Insights;

