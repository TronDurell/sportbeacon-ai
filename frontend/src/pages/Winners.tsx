import React, { useState } from 'react';
import { getTopWinners } from '@/services/api';

const Winners: React.FC = () => {
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(5);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await getTopWinners({ time_period_days: days, limit });
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Top Winners</h2>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>
          Days
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </label>
        <label>
          Limit
          <input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Fetch'}</button>
      </form>
      {error && <pre style={{ color: 'red' }}>{error}</pre>}
      <table cellPadding={6} style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>Player</th>
            <th>Win Rate</th>
            <th>Games</th>
            <th>Avg Points</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.player_id}>
              <td>{r.player_name}</td>
              <td>{(r.win_rate * 100).toFixed(1)}%</td>
              <td>{r.games_played}</td>
              <td>{r.avg_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Winners;

