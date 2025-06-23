import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent } from '@mui/lab';
import { Typography } from '@mui/material';
import { usePlayerTimeline } from '@/hooks/usePlayerTimeline';
import { usePlayerEventStats } from '@/hooks/usePlayerEventStats';

export default function PlayerTimeline({ playerId }: { playerId: string }) {
  const { data: events, loading, error } = usePlayerTimeline(playerId);
  const { stats, loading: statsLoading, error: statsError } = usePlayerEventStats(playerId);

  if (loading || statsLoading) return <Typography>Loading timeline...</Typography>;
  if (error || statsError) return <Typography color="error">Failed to load timeline</Typography>;

  return (
    <Timeline>
      {events.map((event, idx) => (
        <TimelineItem key={idx}>
          <TimelineSeparator>
            <TimelineDot color="primary" />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2">{event.date}</Typography>
            <Typography variant="h6">{event.type}</Typography>
            <Typography>{event.description}</Typography>
            <Typography variant="body2">Scoring Summary: {stats.find(stat => stat.eventId === event.id)?.summary || 'N/A'}</Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
} 