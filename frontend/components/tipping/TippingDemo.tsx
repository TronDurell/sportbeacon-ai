import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  Divider,
  Alert
} from '@mui/material';
import TipButton from './TipButton';

interface Recipient {
  id: string;
  name: string;
  type: 'coach' | 'player';
  avatar: string;
  team: string;
  stats: {
    totalTips: number;
    totalAmount: number;
  };
}

const mockRecipients: Recipient[] = [
  {
    id: 'coach-1',
    name: 'Coach Sarah Johnson',
    type: 'coach',
    avatar: '👩‍🏫',
    team: 'U16 Girls Basketball',
    stats: { totalTips: 12, totalAmount: 156.50 }
  },
  {
    id: 'coach-2',
    name: 'Coach Mike Rodriguez',
    type: 'coach',
    avatar: '👨‍🏫',
    team: 'U14 Boys Soccer',
    stats: { totalTips: 8, totalAmount: 89.25 }
  },
  {
    id: 'player-1',
    name: 'Emma Thompson',
    type: 'player',
    avatar: '🏀',
    team: 'Point Guard',
    stats: { totalTips: 5, totalAmount: 45.00 }
  },
  {
    id: 'player-2',
    name: 'Alex Chen',
    type: 'player',
    avatar: '⚽',
    team: 'Midfielder',
    stats: { totalTips: 3, totalAmount: 22.75 }
  }
];

export default function TippingDemo() {
  const [recipients, setRecipients] = useState<Recipient[]>(mockRecipients);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTippingStats();
  }, []);

  const fetchTippingStats = async () => {
    try {
      const response = await fetch('/api/tips/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch tipping stats:', err);
    }
  };

  const handleTipSuccess = (recipientId: string, amount: number) => {
    // Update local stats
    setRecipients(prev => prev.map(recipient => {
      if (recipient.id === recipientId) {
        return {
          ...recipient,
          stats: {
            totalTips: recipient.stats.totalTips + 1,
            totalAmount: recipient.stats.totalAmount + amount
          }
        };
      }
      return recipient;
    }));
    
    // Refresh global stats
    fetchTippingStats();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SportBeacon AI Tipping System
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Support coaches and players with tips via credit card or crypto payments
      </Typography>

      {/* Global Stats */}
      {stats && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.50' }}>
          <Typography variant="h6" gutterBottom>
            Platform Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Typography variant="h4" color="primary">
                {stats.totalTips}
              </Typography>
              <Typography variant="body2">Total Tips</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h4" color="primary">
                ${stats.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2">Total Amount</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h4" color="primary">
                {stats.stripeTips.count}
              </Typography>
              <Typography variant="body2">Credit Card Tips</Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="h4" color="primary">
                {stats.cryptoTips.count}
              </Typography>
              <Typography variant="body2">Crypto Tips</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Recipients Grid */}
      <Typography variant="h5" gutterBottom>
        Support Your Coaches & Players
      </Typography>
      
      <Grid container spacing={3}>
        {recipients.map((recipient) => (
          <Grid item xs={12} sm={6} md={3} key={recipient.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, fontSize: '2rem' }}>
                    {recipient.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" noWrap>
                      {recipient.name}
                    </Typography>
                    <Chip 
                      label={recipient.type} 
                      size="small" 
                      color={recipient.type === 'coach' ? 'primary' : 'secondary'}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {recipient.team}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Tips: {recipient.stats.totalTips}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount: ${recipient.stats.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                
                <TipButton
                  recipientId={recipient.id}
                  recipientName={recipient.name}
                  recipientType={recipient.type}
                  variant="contained"
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Payment Methods Info */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Payment Methods
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="Stripe" color="primary" />
              <Typography variant="body2">
                Credit Card payments processed securely via Stripe
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="MetaMask" color="secondary" />
              <Typography variant="body2">
                Crypto payments in ETH or USDC via MetaMask wallet
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
} 