import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import WalletConnectButton from './WalletConnectButton';
import { useWallet } from '../../hooks/useWallet';

export default function WalletAuthDemo() {
  const { walletAddress, isConnected, signMessage, error } = useWallet();
  const [authResult, setAuthResult] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleConnect = (address: string) => {
    console.log('Wallet connected:', address);
  };

  const handleDisconnect = () => {
    console.log('Wallet disconnected');
    setAuthResult('');
  };

  const authenticateWithBackend = async () => {
    if (!isConnected || !walletAddress) {
      return;
    }

    setIsAuthenticating(true);
    try {
      const message = "Welcome to SportBeacon AI! Please sign this message to authenticate your wallet.";
      const signature = await signMessage(message);
      
      if (signature) {
        const response = await fetch('/web3/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            message: message,
            signature: signature,
          }),
        });

        const result = await response.json();
        setAuthResult(JSON.stringify(result, null, 2));
      }
    } catch (err: any) {
      setAuthResult(`Authentication failed: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Web3 Wallet Integration Demo
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <WalletConnectButton 
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </Box>

      {isConnected && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connected Wallet: {walletAddress}
          </Typography>
          
          <Button
            variant="contained"
            onClick={authenticateWithBackend}
            disabled={isAuthenticating}
            sx={{ mr: 2 }}
          >
            {isAuthenticating ? 'Authenticating...' : 'Authenticate with Backend'}
          </Button>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {authResult && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Authentication Result:
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <pre style={{ margin: 0, fontSize: '12px' }}>
              {authResult}
            </pre>
          </Paper>
        </Box>
      )}

      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Instructions:</strong>
          <br />
          1. Click "Connect Wallet" to connect your MetaMask
          <br />
          2. Once connected, click "Authenticate with Backend" to sign a message
          <br />
          3. The backend will verify your signature and authenticate your wallet
        </Typography>
      </Box>
    </Paper>
  );
} 