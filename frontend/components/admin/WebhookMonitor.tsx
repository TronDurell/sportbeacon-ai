import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Refresh,
  Visibility,
  Webhook,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';

interface WebhookEvent {
  id: string;
  type: string;
  created: number;
  data: any;
  livemode: boolean;
  api_version: string;
  processed_at: string;
  source?: string;
}

interface ConnectedAccountUpdate {
  account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: any;
  updated_at: string;
}

interface WebhookMonitorProps {
  adminToken: string;
}

export default function WebhookMonitor({ adminToken }: WebhookMonitorProps) {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [accountUpdates, setAccountUpdates] = useState<ConnectedAccountUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventDialog, setEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchWebhookData();
  }, []);

  const fetchWebhookData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchWebhookEvents(),
        fetchAccountUpdates(),
      ]);
    } catch (err) {
      console.error('Failed to fetch webhook data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookEvents = async () => {
    try {
      const response = await fetch('/api/webhooks/events?limit=50', {
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setWebhookEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch webhook events:', err);
    }
  };

  const fetchAccountUpdates = async () => {
    try {
      const response = await fetch('/api/webhooks/connect/accounts?limit=50', {
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccountUpdates(data.updates || []);
      }
    } catch (err) {
      console.error('Failed to fetch account updates:', err);
    }
  };

  const openEventDialog = (event: WebhookEvent) => {
    setSelectedEvent(event);
    setEventDialog(true);
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000) 
      : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventTypeColor = (type: string) => {
    if (type.includes('paid') || type.includes('succeeded')) {
      return 'success';
    } else if (type.includes('failed') || type.includes('error')) {
      return 'error';
    } else if (type.includes('pending') || type.includes('processing')) {
      return 'warning';
    } else {
      return 'info';
    }
  };

  const getEventTypeIcon = (type: string) => {
    if (type.includes('paid') || type.includes('succeeded')) {
      return <CheckCircle color="success" />;
    } else if (type.includes('failed') || type.includes('error')) {
      return <Error color="error" />;
    } else if (type.includes('pending') || type.includes('processing')) {
      return <Warning color="warning" />;
    } else {
      return <Info color="info" />;
    }
  };

  const getEventCategory = (type: string) => {
    if (type.includes('transfer')) {
      return 'Transfer';
    } else if (type.includes('account')) {
      return 'Account';
    } else if (type.includes('payout')) {
      return 'Payout';
    } else if (type.includes('payment')) {
      return 'Payment';
    } else {
      return 'Other';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Webhook Monitor
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchWebhookData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Webhook color="primary" />
                <Box>
                  <Typography variant="h6" color="primary">
                    {webhookEvents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="h6" color="success.main">
                    {webhookEvents.filter(e => e.type.includes('paid') || e.type.includes('succeeded')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Error color="error" />
                <Box>
                  <Typography variant="h6" color="error.main">
                    {webhookEvents.filter(e => e.type.includes('failed') || e.type.includes('error')).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Info color="info" />
                <Box>
                  <Typography variant="h6" color="info.main">
                    {accountUpdates.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Account Updates
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Webhook Events Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Recent Webhook Events
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Processed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhookEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {event.id.slice(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getEventTypeIcon(event.type)}
                      <Chip 
                        label={event.type} 
                        size="small" 
                        color={getEventTypeColor(event.type) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getEventCategory(event.type)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={event.source || 'main'} 
                      size="small" 
                      color={event.source === 'connect' ? 'secondary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(event.created)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(event.processed_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Event Details">
                      <IconButton
                        size="small"
                        onClick={() => openEventDialog(event)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Account Updates Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            Connected Account Updates
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account ID</TableCell>
                <TableCell>Charges Enabled</TableCell>
                <TableCell>Payouts Enabled</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountUpdates.map((update) => (
                <TableRow key={update.account_id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {update.account_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={update.charges_enabled ? "Enabled" : "Disabled"} 
                      size="small" 
                      color={update.charges_enabled ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={update.payouts_enabled ? "Enabled" : "Disabled"} 
                      size="small" 
                      color={update.payouts_enabled ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(update.updated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={update.payouts_enabled ? "Ready" : "Setup Required"} 
                      size="small" 
                      color={update.payouts_enabled ? "success" : "warning"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Event Details Dialog */}
      <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Webhook Event Details
          {selectedEvent && (
            <Typography variant="body2" color="text.secondary">
              {selectedEvent.type}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Event Data"
                value={JSON.stringify(selectedEvent.data, null, 2)}
                multiline
                rows={15}
                InputProps={{
                  readOnly: true,
                }}
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 