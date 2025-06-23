import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { useWallet } from '../../hooks/useWallet';

interface PayoutSettings {
  method: 'stripe' | 'crypto';
  stripeAccountId?: string;
  walletAddress?: string;
  isConnected: boolean;
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

interface PayoutSettingsProps {
  userId: string;
}

export default function PayoutSettings({ userId }: PayoutSettingsProps) {
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [settings, setSettings] = useState<PayoutSettings>({
    method: 'stripe',
    isConnected: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [stripeConnectDialog, setStripeConnectDialog] = useState(false);
  const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    fetchPayoutSettings();
    fetchAccountBalance();
  }, []);

  useEffect(() => {
    if (isConnected && walletAddress) {
      setSettings(prev => ({
        ...prev,
        walletAddress,
        isConnected: true,
      }));
    }
  }, [isConnected, walletAddress]);

  const fetchPayoutSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payouts/settings/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // If Stripe is connected, fetch account details
        if (data.stripeAccountId) {
          await fetchConnectedAccount();
        }
      } else {
        // If no settings found, use defaults
        setSettings({
          method: 'stripe',
          isConnected: isConnected,
          walletAddress: walletAddress,
        });
      }
    } catch (err) {
      console.error('Failed to fetch payout settings:', err);
    } finally {
      setLoading(false);
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

  const handleMethodChange = (method: 'stripe' | 'crypto') => {
    setSettings(prev => ({ ...prev, method }));
    setError('');
    setSuccess('');
  };

  const handleStripeConnect = async () => {
    try {
      setConnectingStripe(true);
      setError('');
      
      // Create Stripe Connect OAuth link
      const response = await fetch('/api/payouts/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          return_url: `${window.location.origin}/earnings`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe Connect link');
      }

      const { oauth_url } = await response.json();
      
      // Redirect to Stripe OAuth
      window.location.href = oauth_url;
      
    } catch (err: any) {
      setError('Failed to connect Stripe account: ' + err.message);
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleWalletConnect = async () => {
    if (!isConnected) {
      await connectWallet();
    }
  };

  const handleSaveSettings = async () => {
    if (settings.method === 'crypto' && !settings.walletAddress) {
      setError('Please connect your wallet or enter a wallet address');
      return;
    }

    if (settings.method === 'stripe' && !settings.stripeAccountId) {
      setError('Please connect your Stripe account first');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/payouts/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Payout settings saved successfully!');
      } else {
        throw new Error('Failed to save payout settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const validateWalletAddress = (address: string) => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      <Typography variant="h4" gutterBottom>
        Payout Settings
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configure how you want to receive your earnings
      </Typography>

      {/* Account Balance Card */}
      {accountBalance && (
        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              💰 Available Balance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="h5" color="primary">
                  {formatCurrency(accountBalance.available_balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available for Payout
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h5" color="warning.main">
                  {formatCurrency(accountBalance.pending_balance)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Balance
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h5" color="success.main">
                  {formatCurrency(accountBalance.total_earned)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Earned
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="h5" color="error.main">
                  {formatCurrency(accountBalance.platform_fees)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Platform Fees
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormLabel component="legend">
          <Typography variant="h6" gutterBottom>
            Payout Method
          </Typography>
        </FormLabel>
        
        <RadioGroup
          value={settings.method}
          onChange={(e) => handleMethodChange(e.target.value as 'stripe' | 'crypto')}
          sx={{ mb: 3 }}
        >
          <FormControlLabel
            value="stripe"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>💳</span>
                <Typography>Bank Transfer (Stripe)</Typography>
                <Chip label="Recommended" size="small" color="primary" />
              </Box>
            }
          />
          <FormControlLabel
            value="crypto"
            control={<Radio />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>🪙</span>
                <Typography>Crypto Wallet</Typography>
                <Chip label="ETH/USDC" size="small" color="secondary" />
              </Box>
            }
          />
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        {/* Stripe Configuration */}
        {settings.method === 'stripe' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Stripe Connect Setup
            </Typography>
            
            {connectedAccount ? (
              <Card sx={{ mb: 2, bgcolor: 'success.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Chip label="Connected" color="success" />
                    <Typography variant="body2">
                      Account ID: {connectedAccount.account_id}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Connected: {new Date(connectedAccount.connected_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Country: {connectedAccount.country} | Business Type: {connectedAccount.business_type}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip 
                      label={connectedAccount.charges_enabled ? "Charges Enabled" : "Charges Disabled"} 
                      color={connectedAccount.charges_enabled ? "success" : "warning"}
                      size="small"
                    />
                    <Chip 
                      label={connectedAccount.payouts_enabled ? "Payouts Enabled" : "Payouts Disabled"} 
                      color={connectedAccount.payouts_enabled ? "success" : "warning"}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Connect your bank account to receive payouts via Stripe Connect
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleStripeConnect}
                  disabled={connectingStripe}
                  startIcon={connectingStripe ? <CircularProgress size={16} /> : <span>💳</span>}
                >
                  {connectingStripe ? 'Connecting...' : 'Connect Bank Account'}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Crypto Configuration */}
        {settings.method === 'crypto' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Crypto Wallet Setup
            </Typography>
            
            {isConnected && walletAddress ? (
              <Card sx={{ mb: 2, bgcolor: 'success.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label="Connected" color="success" />
                    <Typography variant="body2" fontFamily="monospace">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Your wallet is connected and ready for crypto payouts
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Connect your MetaMask wallet or enter a wallet address
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleWalletConnect}
                    startIcon={<span>🦊</span>}
                  >
                    Connect MetaMask
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Or enter a wallet address manually:
                </Typography>
                <TextField
                  fullWidth
                  label="Wallet Address"
                  value={settings.walletAddress || ''}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    walletAddress: e.target.value 
                  }))}
                  placeholder="0x..."
                  helperText="Enter a valid Ethereum wallet address"
                  error={settings.walletAddress ? !validateWalletAddress(settings.walletAddress) : false}
                />
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button variant="outlined" size="large">
          Test Payout
        </Button>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      {/* Information Cards */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Payout Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💳 Bank Transfer
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 2-3 business days processing time
                  • No additional fees
                  • Automatic tax reporting
                  • Minimum payout: $10
                  • Secure Stripe Connect integration
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🪙 Crypto Payout
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Instant processing
                  • Network fees may apply
                  • Paid in ETH or USDC
                  • Minimum payout: $5
                  • Direct to your wallet
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 