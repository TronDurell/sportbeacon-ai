import React from 'react';
import { Timeline, TimelineItem, TimelineSeparator, TimelineDot, TimelineContent } from '@mui/lab';

export default function MatchTimeline({ events }) {
  return (
    <Timeline>
      {events.map((event, index) => (
        <TimelineItem key={index}>
          <TimelineSeparator>
            <TimelineDot color="secondary" />
          </TimelineSeparator>
          <TimelineContent>{event.player} - {event.type}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
} 