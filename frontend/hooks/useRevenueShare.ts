import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import web3Service from '@/services/web3Service';
import { api } from '@/services/api';

export interface RevenueShare {
  shareId: number;
  creator: string;
  shares: string;
  totalReleased: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface RevenueStream {
  streamId: number;
  name: string;
  totalRevenue: string;
  totalDistributed: string;
  creatorCount: number;
  isActive: boolean;
  createdAt: number;
}

export interface CreatorRevenue {
  totalShares: string;
  totalReleased: string;
  pendingAmount: string;
  shareIds: number[];
  streams: {
    streamId: number;
    streamName: string;
    shares: string;
    released: string;
    pending: string;
  }[];
}

export interface RevenueClaim {
  id: string;
  creator: string;
  amount: string;
  streamId: number;
  streamName: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
}

export const useRevenueShare = () => {
  const { address, isConnected } = useWallet();
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([]);
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const [creatorRevenue, setCreatorRevenue] = useState<CreatorRevenue | null>(null);
  const [claims, setClaims] = useState<RevenueClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch creator's revenue shares
  const fetchCreatorRevenue = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      setLoading(true);
      
      // Initialize Web3 service
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Get creator's revenue data from blockchain
      const totalShares = await web3Service.getCreatorTotalShares(address);
      const totalReleased = await web3Service.getCreatorTotalReleased(address);
      const shareIds = await web3Service.getCreatorShares(address);

      // Calculate pending amount (simplified - would need more complex logic in real implementation)
      const pendingAmount = totalShares > totalReleased ? totalShares - totalReleased : '0';

      // Get stream details for each share
      const streams = [];
      for (const shareId of shareIds) {
        try {
          const share = await web3Service.getRevenueShare(shareId);
          if (share.isActive) {
            // Find which stream this share belongs to (simplified)
            const streamId = 1; // Would need mapping in real implementation
            const streamName = "Main Revenue Stream"; // Would get from contract
            const streamReleased = share.totalReleased;
            const streamPending = share.shares > share.totalReleased ? share.shares - share.totalReleased : '0';

            streams.push({
              streamId,
              streamName,
              shares: share.shares,
              released: streamReleased,
              pending: streamPending
            });
          }
        } catch (error) {
          console.error(`Failed to fetch share ${shareId}:`, error);
        }
      }

      setCreatorRevenue({
        totalShares: web3Service.formatEther(totalShares),
        totalReleased: web3Service.formatEther(totalReleased),
        pendingAmount: web3Service.formatEther(pendingAmount),
        shareIds,
        streams
      });

    } catch (error) {
      console.error('Failed to fetch creator revenue:', error);
      setError('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Fetch all revenue streams
  const fetchRevenueStreams = useCallback(async () => {
    try {
      const response = await api.get('/api/dao/revenue/streams');
      setRevenueStreams(response.data.streams || []);
    } catch (error) {
      console.error('Failed to fetch revenue streams:', error);
      setError('Failed to fetch revenue streams');
    }
  }, []);

  // Fetch creator's claims
  const fetchClaims = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      const response = await api.get(`/api/dao/revenue/claims/${address}`);
      setClaims(response.data.claims || []);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
      setError('Failed to fetch claims');
    }
  }, [address, isConnected]);

  // Claim revenue
  const claimRevenue = useCallback(async (streamId: number, amount: string): Promise<boolean> => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);

      // First try blockchain claim
      try {
        const initialized = await web3Service.initialize();
        if (initialized) {
          const tx = await web3Service.claimRevenue(streamId, amount);
          
          // Add claim to local state
          const newClaim: RevenueClaim = {
            id: Date.now().toString(),
            creator: address,
            amount,
            streamId,
            streamName: revenueStreams.find(s => s.streamId === streamId)?.name || 'Unknown Stream',
            status: 'completed',
            timestamp: Date.now(),
            txHash: tx.transactionHash
          };
          
          setClaims(prev => [...prev, newClaim]);
          
          // Refresh revenue data
          setTimeout(() => {
            fetchCreatorRevenue();
          }, 2000);
          
          return true;
        }
      } catch (blockchainError) {
        console.log('Blockchain claim failed, trying API fallback:', blockchainError);
      }

      // Fallback to API claim
      const response = await api.post('/api/dao/revenue/claim', {
        creator: address,
        streamId,
        amount,
        timestamp: Date.now()
      });

      if (response.data.success) {
        // Add claim to local state
        const newClaim: RevenueClaim = {
          id: response.data.claimId,
          creator: address,
          amount,
          streamId,
          streamName: revenueStreams.find(s => s.streamId === streamId)?.name || 'Unknown Stream',
          status: 'pending',
          timestamp: Date.now(),
          txHash: response.data.txHash
        };
        
        setClaims(prev => [...prev, newClaim]);

        // Refresh revenue data
        setTimeout(() => {
          fetchCreatorRevenue();
        }, 2000);

        return true;
      } else {
        setError(response.data.error || 'Failed to claim revenue');
        return false;
      }

    } catch (error) {
      console.error('Failed to claim revenue:', error);
      setError('Failed to claim revenue');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, revenueStreams, fetchCreatorRevenue]);

  // Get claimable amount for a stream
  const getClaimableAmount = useCallback((streamId: number): string => {
    if (!creatorRevenue) return '0';
    
    const stream = creatorRevenue.streams.find(s => s.streamId === streamId);
    return stream ? stream.pending : '0';
  }, [creatorRevenue]);

  // Get total claimable amount across all streams
  const getTotalClaimableAmount = useCallback((): string => {
    if (!creatorRevenue) return '0';
    return creatorRevenue.pendingAmount;
  }, [creatorRevenue]);

  // Check if creator has any claimable revenue
  const hasClaimableRevenue = useCallback((): boolean => {
    if (!creatorRevenue) return false;
    return parseFloat(creatorRevenue.pendingAmount) > 0;
  }, [creatorRevenue]);

  // Get revenue statistics
  const getRevenueStats = useCallback(() => {
    if (!creatorRevenue) return null;

    return {
      totalShares: parseFloat(creatorRevenue.totalShares),
      totalReleased: parseFloat(creatorRevenue.totalReleased),
      pendingAmount: parseFloat(creatorRevenue.pendingAmount),
      totalStreams: creatorRevenue.streams.length,
      activeShares: creatorRevenue.shareIds.length
    };
  }, [creatorRevenue]);

  // Auto-refresh data
  useEffect(() => {
    if (isConnected && address) {
      fetchCreatorRevenue();
      fetchRevenueStreams();
      fetchClaims();
    }
  }, [isConnected, address, fetchCreatorRevenue, fetchRevenueStreams, fetchClaims]);

  // Auto-refresh revenue data every 5 minutes
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchCreatorRevenue();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, address, fetchCreatorRevenue]);

  return {
    // State
    revenueShares,
    revenueStreams,
    creatorRevenue,
    claims,
    loading,
    error,
    
    // Actions
    fetchCreatorRevenue,
    fetchRevenueStreams,
    fetchClaims,
    claimRevenue,
    
    // Computed values
    getClaimableAmount,
    getTotalClaimableAmount,
    hasClaimableRevenue,
    getRevenueStats,
    
    // Utility helpers
    clearError: () => setError(null)
  };
}; 