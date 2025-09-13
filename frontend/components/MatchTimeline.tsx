import React from 'react';
// import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent } from '@mui/lab';

export default function MatchTimeline({ events }: { events: any[] }) {
  return (
    <div>
      {events.map((event: any, index: number) => (
        <div key={index} style={{ marginBottom: '16px', padding: '8px', border: '1px solid #ccc' }}>
          <div>{event.player} - {event.type}</div>
        </div>
      ))}
    </div>
  );
} 