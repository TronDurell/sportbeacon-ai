import { useGameInsights } from '@/hooks/useGameInsights';

export default function CoachDashboard() {
  const { insights, loading, error } = useGameInsights('someGameId');

  if (loading) return <div>Loading game insights...</div>;
  if (error) return <div>Error loading game insights: {error}</div>;

  return (
    <div>
      <h2>Recent Matches</h2>
      <div className="summary-grid">
        {insights.map((insight, index) => (
          <div key={index} className="match-summary">
            <h3>Match {index + 1}</h3>
            <p>Score: {insight.score}</p>
            <p>Assists: {insight.assists}</p>
            <p>Result: {insight.result}</p>
            <p>Standout Players: {insight.standoutPlayers.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 