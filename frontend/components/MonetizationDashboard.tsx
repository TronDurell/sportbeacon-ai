import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Payment,
  Receipt,
  Star,
  Favorite,
  Visibility,
  Download,
  Add,
  Remove,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useMonetization } from '../hooks/useMonetization';
import type {
  EarningsSummary,
  PayoutInfo,
  TransactionAnalytics,
  RevenueSources,
  PayoutSettings
} from '../types/monetization';
import type { TipTransactionDocument } from '../firebase/types';

interface MonetizationDashboardProps {
  userId?: string;
  onPayoutRequest?: (amount: number, method: string) => void;
}

export const MonetizationDashboard: React.FC<MonetizationDashboardProps> = ({
  userId,
  onPayoutRequest
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  // Use the monetization hook for real backend integration
  const {
    earnings,
    payouts,
    analytics,
    revenueSources,
    settings,
    loading: isLoading,
    error,
    requestPayout,
    updatePayoutSettings,
    formatEarnings,
    calculateGrowth,
    pendingEarnings,
    canRequestPayout,
    earningsGrowth,
    clearError
  } = useMonetization(targetUserId);

  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_account');
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [payoutLoading, setPayoutLoading] = useState(false);

  const handlePayoutRequest = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      // Use a local error state or alert instead of setError
      alert('Please enter a valid amount');
      return;
    }

    if (amount > (earnings?.pendingEarnings || 0)) {
      alert('Amount exceeds available balance');
      return;
    }

    setPayoutLoading(true);
    try {
      // Mock API call - replace with actual Stripe integration
      await requestPayout(amount);
      setShowPayoutDialog(false);
      setPayoutAmount('');
      onPayoutRequest?.(amount, payoutMethod);
    } catch (error) {
      alert('Failed to request payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const mockRequestPayout = async (amount: number, method: string) => {
    // Mock API call - replace with actual Stripe integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Requesting payout:', amount, method);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'pending': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'processing': return <CircularProgress size={16} />;
      case 'pending': return <Info />;
      case 'failed': return <Warning />;
      default: return <Info />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !earnings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Monetization Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<Payment />}
          onClick={() => setShowPayoutDialog(true)}
          disabled={!earnings || earnings.pendingEarnings <= 0}
        >
          Request Payout
        </Button>
      </Box>

      {earnings && (
        <Grid container spacing={3}>
          {/* Earnings Overview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Earnings Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {formatCurrency(earnings.totalEarnings)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Earnings
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {formatCurrency(earnings.monthlyEarnings)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This Month
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {formatCurrency(earnings.pendingEarnings)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Payout
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {earnings.totalTips}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Tips
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Progress Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Progress Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tips Received</Typography>
                  <Typography variant="body2">{earnings.totalTips}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((earnings.totalTips / 2000) * 100, 100)} 
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Average Tip</Typography>
                  <Typography variant="body2">{formatCurrency(earnings.averageTip)}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((earnings.averageTip / 1000) * 100, 100)} 
                />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Weekly Earnings</Typography>
                  <Typography variant="body2">{formatCurrency(earnings.weeklyEarnings)}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onClose={() => setShowPayoutDialog(false)}>
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Available Balance: {earnings ? formatCurrency(earnings.pendingEarnings) : '$0.00'}
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            label="Payout Amount"
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="Enter amount to withdraw"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Payout Method</InputLabel>
            <Select
              value={payoutMethod}
              label="Payout Method"
              onChange={(e) => setPayoutMethod(e.target.value)}
            >
              <MenuItem value="stripe">Stripe (Bank Transfer)</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="bank">Direct Bank Transfer</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePayoutRequest}
            variant="contained"
            disabled={isLoading || !payoutAmount}
          >
            {isLoading ? 'Processing...' : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 