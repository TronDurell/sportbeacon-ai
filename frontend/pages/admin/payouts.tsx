import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import AdminPayoutQueue from '../../components/admin/AdminPayoutQueue';

export default function AdminPayoutsPage() {
  // In a real application, this would come from authentication context
  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-secret-token';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h3" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Payout Management
        </Typography>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Manage creator payout requests, approve or reject payments, and monitor Stripe Connect status.
          </Typography>
        </Paper>
        
        <AdminPayoutQueue adminToken={adminToken} />
      </Box>
    </Box>
  );
} 