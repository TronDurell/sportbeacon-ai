import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import { useNotifications } from '../hooks/useNotifications';

export default function AlertList({ userId }) {
  const { alerts } = useNotifications(userId);

  return (
    <List>
      {alerts.map((alert) => (
        <ListItem key={alert.id}>
          <ListItemText primary={alert.message} />
        </ListItem>
      ))}
    </List>
  );
} 