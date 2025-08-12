import React from 'react';
import { IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useNotifications from '../hooks/useNotifications';

export default function NotificationBell({ userId }) {
  const notifications = useNotifications(userId);
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <IconButton color="inherit">
      <Badge badgeContent={unreadCount} color="secondary">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
} 