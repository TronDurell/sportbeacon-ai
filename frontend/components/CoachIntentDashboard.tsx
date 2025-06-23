import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert } from '@mui/material';

export default function CoachIntentDashboard() {
  const [intents, setIntents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIntents = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/review-intents');
        if (!res.ok) throw new Error('Failed to fetch intents');
        const data = await res.json();
        setIntents(data);
      } catch (err) {
        setError('Could not load coach intents.');
      } finally {
        setLoading(false);
      }
    };
    fetchIntents();
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Coach Intent Dashboard</Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Coach ID</TableCell>
                <TableCell>Team ID</TableCell>
                <TableCell>Current Division</TableCell>
                <TableCell>Wants to Return</TableCell>
                <TableCell>Wants to Move Up</TableCell>
                <TableCell>Next Division</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {intents.map((intent, idx) => (
                <TableRow key={idx}>
                  <TableCell>{intent.coach_id}</TableCell>
                  <TableCell>{intent.team_id}</TableCell>
                  <TableCell>{intent.current_division}</TableCell>
                  <TableCell>{intent.wants_to_return ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{intent.wants_to_move_up ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{intent.next_division || '-'}</TableCell>
                  <TableCell>{intent.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
} 