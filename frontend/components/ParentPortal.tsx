import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, TextField, List, ListItem, ListItemText } from '@mui/material';
import InlineTooltip from './InlineTooltip';
import ConflictRationaleBanner from './ConflictRationaleBanner';

interface ParentPortalProps {
  user: { role: string; name: string };
}

const mockNotifications = [
  { id: 1, message: 'Practice rescheduled to 5pm tomorrow.' },
  { id: 2, message: 'Game location updated: Field 3.' },
];

const mockCoaches = [
  { id: 1, name: 'Coach Smith', email: 'coach.smith@example.com' },
  { id: 2, name: 'Coach Lee', email: 'coach.lee@example.com' },
];

const ParentPortal: React.FC<ParentPortalProps> = ({ user }) => {
  const [showConflictBanner, setShowConflictBanner] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleSubmitted, setRescheduleSubmitted] = useState(false);

  if (user.role !== 'parent') {
    return (
      <Alert severity="error">
        Access denied. <InlineTooltip title="Parents only." />
      </Alert>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Typography variant="h4" mb={2}>
        Parent Portal <InlineTooltip title="Parents only." />
      </Typography>

      {/* Notification Center */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Center
            <InlineTooltip title="Get updates about your child's team." />
          </Typography>
          <List>
            {mockNotifications.map(n => (
              <ListItem key={n.id}>
                <ListItemText primary={n.message} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Reschedule Request */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Request Reschedule
            <InlineTooltip title="Submit a request if you have a conflict." />
          </Typography>
          {showConflictBanner && (
            <ConflictRationaleBanner message="This time slot is already booked." onClose={() => setShowConflictBanner(false)} />
          )}
          <TextField
            label="Reason for reschedule"
            value={rescheduleReason}
            onChange={e => setRescheduleReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setRescheduleSubmitted(true);
              setShowConflictBanner(true); // Simulate a conflict for demo
            }}
            disabled={rescheduleSubmitted}
          >
            Submit Request
          </Button>
          {rescheduleSubmitted && !showConflictBanner && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Reschedule request submitted!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Coach Contact List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coach Contact List <InlineTooltip title="Contact your child's coach." />
          </Typography>
          <List>
            {mockCoaches.map(coach => (
              <ListItem key={coach.id}>
                <ListItemText primary={coach.name} secondary={coach.email} />
                <Button
                  variant="outlined"
                  size="small"
                  href={`mailto:${coach.email}`}
                >
                  Email
                </Button>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentPortal; 