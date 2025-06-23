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
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Refresh,
  TrendingUp,
  Payment,
  Schedule,
  Error,
} from '@mui/icons-material';

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'approved' | 'paid' | 'failed' | 'rejected';
  requested_at: string;
  description?: string;
  stripe_transfer_id?: string;
  approved_by?: string;
  approved_at?: string;
  failure_reason?: string;
}

interface AdminStats {
  total_payouts: number;
  pending_payouts: number;
  approved_payouts: number;
  paid_payouts: number;
  failed_payouts: number;
  rejected_payouts: number;
  total_amount_pending: number;
  total_amount_paid: number;
  recent_audit_actions: number;
}

interface AdminPayoutQueueProps {
  adminToken: string;
}

export default function AdminPayoutQueue({ adminToken }: AdminPayoutQueueProps) {
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>([]);
  const [allPayouts, setAllPayouts] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPendingPayouts(),
        fetchAllPayouts(),
        fetchStats(),
      ]);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayouts = async () => {
    try {
      const response = await fetch('/api/admin/payouts/pending', {
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending payouts:', err);
    }
  };

  const fetchAllPayouts = async () => {
    try {
      const response = await fetch('/api/admin/payouts/all', {
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch all payouts:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'X-Admin-Token': adminToken,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayout) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/payouts/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({
          payout_id: selectedPayout.id,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Payout approved successfully! Transfer ID: ${data.stripe_transfer_id}`);
        setApproveDialog(false);
        setSelectedPayout(null);
        setAdminNotes('');
        
        // Refresh data
        await fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve payout');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayout || !rejectReason) return;

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/payouts/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({
          payout_id: selectedPayout.id,
          reason: rejectReason,
          admin_notes: adminNotes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Payout rejected successfully');
        setRejectDialog(false);
        setSelectedPayout(null);
        setRejectReason('');
        setAdminNotes('');
        
        // Refresh data
        await fetchAdminData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reject payout');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openApproveDialog = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setAdminNotes('');
    setApproveDialog(true);
  };

  const openRejectDialog = (payout: PayoutRequest) => {
    setSelectedPayout(payout);
    setRejectReason('');
    setAdminNotes('');
    setRejectDialog(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'approved':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle color="success" />;
      case 'approved':
        return <TrendingUp color="info" />;
      case 'pending':
        return <Schedule color="warning" />;
      case 'failed':
      case 'rejected':
        return <Error color="error" />;
      default:
        return null;
    }
  };

  const filteredPayouts = statusFilter === 'all' 
    ? allPayouts 
    : allPayouts.filter(p => p.status === statusFilter);

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
          Admin Payout Queue
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchAdminData}
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

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Badge badgeContent={stats.pending_payouts} color="warning">
                    <Schedule color="warning" />
                  </Badge>
                  <Box>
                    <Typography variant="h6" color="warning.main">
                      {stats.pending_payouts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Approval
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
                  <Payment color="primary" />
                  <Box>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(stats.total_amount_pending)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Amount
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
                      {stats.paid_payouts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
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
                  <TrendingUp color="info" />
                  <Box>
                    <Typography variant="h6" color="info.main">
                      {formatCurrency(stats.total_amount_paid)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Controls */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Payouts</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Payouts Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {payout.id.slice(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payout.user_id}
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
                      {getStatusIcon(payout.status)}
                      <Chip 
                        label={payout.status} 
                        size="small" 
                        color={getStatusColor(payout.status) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(payout.requested_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {payout.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {payout.status === 'pending' && (
                        <>
                          <Tooltip title="Approve Payout">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openApproveDialog(payout)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Payout">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openRejectDialog(payout)}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Payout</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Approve payout of {formatCurrency(selectedPayout.amount)} to {selectedPayout.user_id}?
              </Typography>
              
              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Approve Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Payout</DialogTitle>
        <DialogContent>
          {selectedPayout && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Reject payout of {formatCurrency(selectedPayout.amount)} to {selectedPayout.user_id}?
              </Typography>
              
              <TextField
                fullWidth
                label="Reason for Rejection *"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any additional notes..."
                multiline
                rows={3}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={processing || !rejectReason}
          >
            {processing ? 'Processing...' : 'Reject Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 