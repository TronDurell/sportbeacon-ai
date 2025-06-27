import { Card, CardContent, Typography } from '@mui/material';

export function PlayerStatCard({ player }: { player: any }) {
  return (
    <div className="w-full" role="region" aria-label="Player stat card" tabIndex={0}>
      <Card>
        <CardContent>
          <Typography variant="h6">{player.name}</Typography>
          <Typography variant="body2">Win Rate: {player.winRate}%</Typography>
          <Typography variant="body2">Trend: {player.trend}</Typography>
        </CardContent>
      </Card>
    </div>
  );
} 