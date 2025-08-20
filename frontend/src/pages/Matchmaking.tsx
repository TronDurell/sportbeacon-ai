import React, { useState } from 'react';
import { createTeams } from '@/services/api';

const sample = {
  team_size: 3,
  consider_positions: true,
  players: [
    {
      player_id: 1,
      player_name: 'John Smith',
      game_date: '2024-04-05T21:00:00',
      points: 31,
      assists: 8,
      rebounds: 4,
      steals: 2,
      blocks: 0,
      field_goal_percentage: 58.0,
      three_point_percentage: 42.0,
      result: 'win'
    },
    {
      player_id: 2,
      player_name: 'Mike Johnson',
      game_date: '2024-04-05T21:00:00',
      points: 25,
      assists: 4,
      rebounds: 8,
      steals: 1,
      blocks: 2,
      field_goal_percentage: 52.0,
      three_point_percentage: 35.0,
      result: 'win'
    },
    {
      player_id: 3,
      player_name: 'Bill Williams',
      game_date: '2024-04-05T21:00:00',
      points: 18,
      assists: 3,
      rebounds: 12,
      steals: 0,
      blocks: 4,
      field_goal_percentage: 65.0,
      three_point_percentage: 0.0,
      result: 'win'
    }
  ]
};

const Matchmaking: React.FC = () => {
  const [json, setJson] = useState(JSON.stringify(sample, null, 2));
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = JSON.parse(json);
      const res = await createTeams(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Matchmaking</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <textarea rows={12} value={json} onChange={(e) => setJson(e.target.value)} style={{ width: '100%', fontFamily: 'monospace' }} />
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Create Teams'}</button>
      </form>
      {error && <pre style={{ color: 'red' }}>{error}</pre>}
      {result && (
        <div>
          <h3>Teams</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Matchmaking;

