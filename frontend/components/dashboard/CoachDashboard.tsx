import { useGameInsights } from '@/hooks/useGameInsights';
import { analyzeDrillTrends } from '@/hooks/useAIInsights';
import { Typography } from '@mui/material';

export default function CoachDashboard() {
  const { insights, loading, error } = useGameInsights('someGameId');
  const drillLogs = []; // This should be replaced with actual drill logs data
  const aiFocus = analyzeDrillTrends(drillLogs);

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
      <Typography variant="h6">AI Focus Suggestion: {aiFocus}</Typography>
    </div>
  );
} 