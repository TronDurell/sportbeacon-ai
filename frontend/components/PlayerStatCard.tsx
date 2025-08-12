import { Card, CardContent, Typography } from '@mui/material';

export function PlayerStatCard({ player }: { player: any }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{player.name}</Typography>
        <Typography variant="body2">Win Rate: {player.winRate}%</Typography>
        <Typography variant="body2">Trend: {player.trend}</Typography>
      </CardContent>
    </Card>
  );
} 