import React, { useState, useEffect } from 'react';
import { Button, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { ethers } from 'ethers';

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        onConnect?.(address);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setWalletAddress(accounts[0]);
            onConnect?.(accounts[0]);
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    onDisconnect?.();
  };

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled() && window.ethereum.selectedAddress) {
        setWalletAddress(window.ethereum.selectedAddress);
        setIsConnected(true);
        onConnect?.(window.ethereum.selectedAddress);
      }
    };
    checkConnection();
  }, [onConnect]);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={20} />
        <Typography>Connecting...</Typography>
      </Box>
    );
  }

  if (isConnected && walletAddress) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="success.main">
          Connected: {formatAddress(walletAddress)}
        </Typography>
        <Button variant="outlined" size="small" onClick={disconnectWallet}>
          Disconnect
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        onClick={connectWallet}
        disabled={!isMetaMaskInstalled()}
      >
        Connect Wallet
      </Button>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      {!isMetaMaskInstalled() && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          MetaMask not detected. Please install MetaMask extension.
        </Alert>
      )}
    </Box>
  );
} 