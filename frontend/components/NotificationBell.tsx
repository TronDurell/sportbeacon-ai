import React from 'react';
import { IconButton, Badge } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useNotifications from '../hooks/useNotifications';

export default function NotificationBell({ userId }) {
  const notifications = useNotifications(userId);
  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <button className="relative" role="button" aria-label="Notification bell" tabIndex={0}>
      <IconButton color="inherit">
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </button>
  );
} 