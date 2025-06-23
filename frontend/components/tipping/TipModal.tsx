import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { useWallet } from '../../hooks/useWallet';

interface TipModalProps {
  open: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientType: 'coach' | 'player';
  presetAmount?: number | null;
}

type PaymentMethod = 'stripe' | 'crypto';
type CryptoToken = 'ETH' | 'USDC';

const presetAmounts = [1, 3, 5, 10, 25, 50];

export default function TipModal({
  open,
  onClose,
  recipientId,
  recipientName,
  recipientType,
  presetAmount,
}: TipModalProps) {
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [amount, setAmount] = useState<number>(presetAmount || 5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [cryptoToken, setCryptoToken] = useState<CryptoToken>('ETH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setAmount(presetAmount || 5);
      setCustomAmount('');
      setPaymentMethod('stripe');
      setError('');
      setSuccess('');
    }
  }, [open, presetAmount]);

  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'crypto' && !isConnected) {
      connectWallet();
    }
  };

  const processStripePayment = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/tips/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          recipientId,
          recipientName,
          recipientType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();
      
      // In a real implementation, you would use Stripe's confirmCardPayment here
      // For now, we'll simulate the payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Record the tip
      await recordTip('stripe');
      
      setSuccess(`Successfully tipped $${amount} to ${recipientName}!`);
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCryptoPayment = async () => {
    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setError('');
    
    try {
      // In a real implementation, you would:
      // 1. Get the current ETH/USDC price
      // 2. Calculate the crypto amount
      // 3. Send the transaction
      
      // For now, we'll simulate the payment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Record the tip
      await recordTip('crypto');
      
      setSuccess(`Successfully tipped ${amount} ${cryptoToken} to ${recipientName}!`);
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Crypto payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const recordTip = async (method: string) => {
    try {
      await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          recipientName,
          recipientType,
          amount,
          paymentMethod: method,
          cryptoToken: method === 'crypto' ? cryptoToken : undefined,
          senderWallet: method === 'crypto' ? walletAddress : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to record tip:', err);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'stripe') {
      processStripePayment();
    } else {
      processCryptoPayment();
    }
  };

  const getCryptoAmount = () => {
    // In a real implementation, you would fetch current prices
    const ethPrice = 2000; // Mock ETH price
    const usdcPrice = 1; // USDC is stable
    
    if (cryptoToken === 'ETH') {
      return (amount / ethPrice).toFixed(4);
    } else {
      return amount.toFixed(2);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Tip {recipientName}
        <Typography variant="body2" color="text.secondary">
          {recipientType === 'coach' ? 'Coach' : 'Player'}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <FormLabel component="legend">Tip Amount</FormLabel>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {presetAmounts.map((preset) => (
              <Chip
                key={preset}
                label={`$${preset}`}
                onClick={() => handleAmountChange(preset)}
                color={amount === preset ? 'primary' : 'default'}
                variant={amount === preset ? 'filled' : 'outlined'}
                clickable
              />
            ))}
          </Box>
          
          <TextField
            label="Custom Amount ($)"
            type="number"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            sx={{ mt: 2, width: '100%' }}
            inputProps={{ min: 0.01, step: 0.01 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <FormLabel component="legend">Payment Method</FormLabel>
          <RadioGroup
            value={paymentMethod}
            onChange={(e) => handlePaymentMethodChange(e.target.value as PaymentMethod)}
          >
            <FormControlLabel
              value="stripe"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Credit Card</Typography>
                  <Chip label="Stripe" size="small" color="primary" />
                </Box>
              }
            />
            <FormControlLabel
              value="crypto"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>Crypto</Typography>
                  <Chip label="MetaMask" size="small" color="secondary" />
                </Box>
              }
            />
          </RadioGroup>
        </Box>

        {paymentMethod === 'crypto' && (
          <Box sx={{ mb: 3 }}>
            <FormLabel component="legend">Crypto Token</FormLabel>
            <RadioGroup
              value={cryptoToken}
              onChange={(e) => setCryptoToken(e.target.value as CryptoToken)}
              row
            >
              <FormControlLabel value="ETH" control={<Radio />} label="ETH" />
              <FormControlLabel value="USDC" control={<Radio />} label="USDC" />
            </RadioGroup>
            
            {isConnected ? (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </Typography>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={connectWallet}
                sx={{ mt: 1 }}
              >
                Connect Wallet
              </Button>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You'll pay: {getCryptoAmount()} {cryptoToken}
            </Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isProcessing || amount <= 0 || (paymentMethod === 'crypto' && !isConnected)}
        >
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              Processing...
            </Box>
          ) : (
            `Tip $${amount}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 