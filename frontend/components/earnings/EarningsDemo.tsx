import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import CreatorDashboard from './CreatorDashboard';
import PayoutSettings from './PayoutSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`earnings-tabpanel-${index}`}
      aria-labelledby={`earnings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EarningsDemo() {
  const [tabValue, setTabValue] = useState(0);
  const [userId] = useState('creator-123'); // Mock user ID

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        Creator Earnings & Payouts
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Complete earnings management system for coaches and players
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="earnings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>📊</span>
                <Typography>Dashboard</Typography>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>⚙️</span>
                <Typography>Payout Settings</Typography>
              </Box>
            }
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CreatorDashboard />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <PayoutSettings userId={userId} />
        </TabPanel>
      </Paper>

      {/* Feature Overview */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="h5" gutterBottom>
          🚀 Creator Monetization Features
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3, mt: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              💰 Earnings Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Real-time earnings dashboard
              • Weekly, monthly, and all-time stats
              • Payment method breakdown (Stripe vs Crypto)
              • Recent tips with sender details
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              💳 Payout Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Request payouts anytime
              • Bank transfer via Stripe Connect
              • Crypto payouts to wallet
              • Payout history tracking
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              ⚙️ Flexible Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Choose preferred payout method
              • Connect bank account securely
              • Set up crypto wallet address
              • Automatic validation and verification
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              📈 Analytics & Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Visual earnings charts
              • Payment method trends
              • Tip frequency analysis
              • Performance metrics
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setTabValue(0)}
          startIcon={<span>📊</span>}
        >
          View Dashboard
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={() => setTabValue(1)}
          startIcon={<span>⚙️</span>}
        >
          Configure Payouts
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<span>📋</span>}
        >
          View Documentation
        </Button>
      </Box>
    </Box>
  );
} 