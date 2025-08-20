import React, { useState } from 'react';
import { getDrillRecommendations } from '@/services/api';

const sample = {
  user_id: 'user123',
  skill_levels: { shooting: 0.6, passing: 0.7, defense: 0.5 },
  growth_areas: ['defense', 'rebounding'],
  top_skills: ['shooting'],
  max_recommendations: 5,
};

const Drills: React.FC = () => {
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
      const res = await getDrillRecommendations(payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Drill Recommendations</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <textarea rows={12} value={json} onChange={(e) => setJson(e.target.value)} style={{ width: '100%', fontFamily: 'monospace' }} />
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Recommend'}</button>
      </form>
      {error && <pre style={{ color: 'red' }}>{error}</pre>}
      {result && (
        <div>
          <h3>Results</h3>
          <ul>
            {(result.recommended_drills || []).map((d: any) => (
              <li key={d.id}>
                <strong>{d.name}</strong> - {d.description} [equipment: {(d.equipment_needed || []).join(', ')}]
              </li>
            ))}
          </ul>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Drills;

