import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Payment,
  History,
  Refresh,
  Add,
  Visibility,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingPayouts: number;
  totalPayouts: number;
  growthRate: number;
  currency: string;
}

interface PayoutRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  method: 'stripe' | 'crypto';
  description?: string;
}

interface AccountBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  platform_fees: number;
  currency: string;
}

interface ConnectedAccount {
  account_id: string;
  connected_at: string;
  status: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  business_type: string;
  country: string;
}

interface CreatorDashboardProps {
  userId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CreatorDashboard({ userId }: CreatorDashboardProps) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'crypto'>('stripe');
  const [payoutDescription, setPayoutDescription] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEarnings(),
        fetchPayoutRequests(),
        fetchAccountBalance(),
        fetchConnectedAccount(),
      ]);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await fetch(`/api/earnings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    }
  };

  const fetchPayoutRequests = async () => {
    try {
      const response = await fetch(`/api/payouts/history/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPayoutRequests(data.payouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch payout requests:', err);
    }
  };

  const fetchAccountBalance = async () => {
    try {
      const response = await fetch(`/api/payouts/balance/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAccountBalance(data);
      }
    } catch (err) {
      console.error('Failed to fetch account balance:', err);
    }
  };

  const fetchConnectedAccount = async () => {
    try {
      const response = await fetch(`/api/payouts/account/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConnectedAccount(data);
      }
    } catch (err) {
      console.error('Failed to fetch connected account:', err);
    }
  };

  const handlePayoutRequest = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      setError('Please enter a valid payout amount');
      return;
    }

    if (payoutMethod === 'stripe' && !connectedAccount) {
      setError('Please connect your Stripe account first');
      return;
    }

    setSubmittingPayout(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/payouts/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          amount: parseFloat(payoutAmount),
          currency: 'usd',
          description: payoutDescription || `Payout request for ${userId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Payout request submitted successfully! ID: ${data.payout_id}`);
        setPayoutDialog(false);
        setPayoutAmount('');
        setPayoutDescription('');
        
        // Refresh data
        await fetchDashboardData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit payout request');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingPayout(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'pending':
        return '⏰';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  // Mock data for charts
  const earningsChartData = [
    { month: 'Jan', earnings: 1200 },
    { month: 'Feb', earnings: 1800 },
    { month: 'Mar', earnings: 1500 },
    { month: 'Apr', earnings: 2200 },
    { month: 'May', earnings: 2800 },
    { month: 'Jun', earnings: 3200 },
  ];

  const payoutMethodData = [
    { name: 'Stripe', value: 75 },
    { name: 'Crypto', value: 25 },
  ];

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
          Creator Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Account Status */}
      {connectedAccount && (
        <Card sx={{ mb: 3, bgcolor: connectedAccount.payouts_enabled ? 'success.50' : 'warning.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={connectedAccount.payouts_enabled ? "Ready for Payouts" : "Setup Required"} 
                color={connectedAccount.payouts_enabled ? "success" : "warning"}
              />
              <Typography variant="body2">
                Stripe Account: {connectedAccount.account_id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Country: {connectedAccount.country}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Balance Overview */}
      {accountBalance && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalance color="primary" />
                  <Box>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(accountBalance.available_balance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available for Payout
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
                  <Payment color="warning" />
                  <Box>
                    <Typography variant="h6" color="warning.main">
                      {formatCurrency(accountBalance.pending_balance)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Balance
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
                  <TrendingUp color="success" />
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(accountBalance.total_earned)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Earned
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
                  <TrendingDown color="error" />
                  <Box>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(accountBalance.platform_fees)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Platform Fees
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => setPayoutDialog(true)}
          disabled={!connectedAccount?.payouts_enabled}
          sx={{ mr: 2 }}
        >
          Request Payout
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<History />}
        >
          View History
        </Button>
      </Box>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payout Methods
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payoutMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {payoutMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payout History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Payouts
          </Typography>
          
          {payoutRequests.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No payout requests yet
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell>Processed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutRequests.slice(0, 10).map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {payout.id.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(payout.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={payout.method} 
                          size="small" 
                          color={payout.method === 'stripe' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{getStatusIcon(payout.status)}</span>
                          <Chip 
                            label={payout.status} 
                            size="small" 
                            color={getStatusColor(payout.status) as any}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(payout.requestedAt)}
                      </TableCell>
                      <TableCell>
                        {payout.processedAt ? formatDate(payout.processedAt) : '-'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={payoutDialog} onClose={() => setPayoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Payout Amount"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="0.00"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <span>$</span>,
              }}
            />
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={payoutDescription}
              onChange={(e) => setPayoutDescription(e.target.value)}
              placeholder="e.g., Monthly earnings payout"
              sx={{ mb: 2 }}
            />

            {accountBalance && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Available balance: {formatCurrency(accountBalance.available_balance)}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePayoutRequest}
            disabled={submittingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
          >
            {submittingPayout ? 'Processing...' : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 