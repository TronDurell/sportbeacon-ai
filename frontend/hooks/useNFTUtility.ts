import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import web3Service from '@/services/web3Service';
import { api } from '@/services/api';

export interface NFTUtility {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'perk' | 'access' | 'reward';
  requiredNFTs: string[]; // NFT contract addresses
  requiredTokenIds?: number[]; // Specific token IDs
  requiredBalance?: number; // Minimum NFT balance required
  requiredTier?: 'basic' | 'premium' | 'elite';
  metadata?: {
    contentUrl?: string;
    perkDetails?: string;
    accessLevel?: string;
    rewardAmount?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserUtilityAccess {
  utilityId: string;
  hasAccess: boolean;
  accessGrantedAt?: string;
  expiresAt?: string;
  usageCount: number;
  maxUsage?: number;
  lastUsedAt?: string;
}

export interface NFTOwnership {
  contractAddress: string;
  tokenIds: number[];
  balance: number;
  tier: 'basic' | 'premium' | 'elite';
  lastUpdated: string;
}

export const useNFTUtility = () => {
  const { address, isConnected } = useWallet();
  const [utilities, setUtilities] = useState<NFTUtility[]>([]);
  const [userAccess, setUserAccess] = useState<UserUtilityAccess[]>([]);
  const [nftOwnership, setNftOwnership] = useState<NFTOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available utilities
  const fetchUtilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/nft/utilities');
      setUtilities(response.data.utilities || []);
    } catch (error) {
      console.error('Failed to fetch utilities:', error);
      setError('Failed to fetch utilities');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's NFT ownership
  const fetchNFTOwnership = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Get user's NFTs from multiple contracts
      const ownershipData: NFTOwnership[] = [];
      
      // Check BEACON NFT ownership
      const beaconNFTs = await web3Service.getUserActiveNFTs(address);
      if (beaconNFTs.length > 0) {
        ownershipData.push({
          contractAddress: web3Service.contracts.beaconNFT?.address || '',
          tokenIds: beaconNFTs.map(nft => nft.tokenId),
          balance: beaconNFTs.length,
          tier: beaconNFTs.some(nft => nft.hasActiveAccess) ? 'premium' : 'basic',
          lastUpdated: new Date().toISOString()
        });
      }

      // Check other NFT contracts (expandable)
      const otherNFTs = await web3Service.getNFTOwnership(address);
      if (otherNFTs.length > 0) {
        ownershipData.push(...otherNFTs.map(nft => ({
          contractAddress: nft.contractAddress,
          tokenIds: nft.tokenIds,
          balance: nft.balance,
          tier: nft.tier || 'basic',
          lastUpdated: new Date().toISOString()
        })));
      }

      setNftOwnership(ownershipData);
    } catch (error) {
      console.error('Failed to fetch NFT ownership:', error);
      setError('Failed to fetch NFT ownership');
    }
  }, [address, isConnected]);

  // Check user access to specific utility
  const checkUtilityAccess = useCallback(async (utilityId: string): Promise<boolean> => {
    if (!address || !isConnected) return false;

    try {
      const response = await api.get(`/api/nft/utilities/${utilityId}/access/${address}`);
      return response.data.hasAccess;
    } catch (error) {
      console.error('Failed to check utility access:', error);
      return false;
    }
  }, [address, isConnected]);

  // Fetch user's utility access
  const fetchUserAccess = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      const response = await api.get(`/api/nft/utilities/access/${address}`);
      setUserAccess(response.data.access || []);
    } catch (error) {
      console.error('Failed to fetch user access:', error);
      setError('Failed to fetch user access');
    }
  }, [address, isConnected]);

  // Unlock utility content
  const unlockUtility = useCallback(async (utilityId: string): Promise<boolean> => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      
      // Verify NFT ownership on-chain first
      const utility = utilities.find(u => u.id === utilityId);
      if (!utility) {
        setError('Utility not found');
        return false;
      }

      // Check if user meets requirements
      const hasRequiredNFTs = utility.requiredNFTs.every(contractAddress => {
        const ownership = nftOwnership.find(o => o.contractAddress.toLowerCase() === contractAddress.toLowerCase());
        if (!ownership) return false;
        
        if (utility.requiredBalance && ownership.balance < utility.requiredBalance) return false;
        if (utility.requiredTier && ownership.tier !== utility.requiredTier) return false;
        if (utility.requiredTokenIds && !utility.requiredTokenIds.some(id => ownership.tokenIds.includes(id))) return false;
        
        return true;
      });

      if (!hasRequiredNFTs) {
        setError('NFT ownership requirements not met');
        return false;
      }

      // Call backend to unlock utility
      const response = await api.post(`/api/nft/utilities/${utilityId}/unlock`, {
        address,
        timestamp: Date.now()
      });

      if (response.data.success) {
        // Refresh user access
        await fetchUserAccess();
        return true;
      } else {
        setError(response.data.error || 'Failed to unlock utility');
        return false;
      }
    } catch (error) {
      console.error('Failed to unlock utility:', error);
      setError('Failed to unlock utility');
      return false;
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, utilities, nftOwnership, fetchUserAccess]);

  // Use utility (track usage)
  const useUtility = useCallback(async (utilityId: string): Promise<boolean> => {
    if (!address || !isConnected) {
      setError('Wallet not connected');
      return false;
    }

    try {
      const response = await api.post(`/api/nft/utilities/${utilityId}/use`, {
        address,
        timestamp: Date.now()
      });

      if (response.data.success) {
        // Refresh user access
        await fetchUserAccess();
        return true;
      } else {
        setError(response.data.error || 'Failed to use utility');
        return false;
      }
    } catch (error) {
      console.error('Failed to use utility:', error);
      setError('Failed to use utility');
      return false;
    }
  }, [address, isConnected, fetchUserAccess]);

  // Get available utilities for user
  const getAvailableUtilities = useCallback(() => {
    if (!address || !isConnected) return [];

    return utilities.filter(utility => {
      if (!utility.isActive) return false;

      // Check if user meets NFT requirements
      const hasRequiredNFTs = utility.requiredNFTs.every(contractAddress => {
        const ownership = nftOwnership.find(o => o.contractAddress.toLowerCase() === contractAddress.toLowerCase());
        if (!ownership) return false;
        
        if (utility.requiredBalance && ownership.balance < utility.requiredBalance) return false;
        if (utility.requiredTier && ownership.tier !== utility.requiredTier) return false;
        if (utility.requiredTokenIds && !utility.requiredTokenIds.some(id => ownership.tokenIds.includes(id))) return false;
        
        return true;
      });

      return hasRequiredNFTs;
    });
  }, [address, isConnected, utilities, nftOwnership]);

  // Get user's unlocked utilities
  const getUnlockedUtilities = useCallback(() => {
    return userAccess.filter(access => access.hasAccess);
  }, [userAccess]);

  // Check if user has access to specific utility
  const hasAccessToUtility = useCallback((utilityId: string): boolean => {
    const access = userAccess.find(a => a.utilityId === utilityId);
    return access?.hasAccess || false;
  }, [userAccess]);

  // Get utility usage stats
  const getUtilityUsageStats = useCallback((utilityId: string) => {
    const access = userAccess.find(a => a.utilityId === utilityId);
    if (!access) return null;

    return {
      usageCount: access.usageCount,
      maxUsage: access.maxUsage,
      lastUsedAt: access.lastUsedAt,
      expiresAt: access.expiresAt,
      isExpired: access.expiresAt ? new Date(access.expiresAt) < new Date() : false
    };
  }, [userAccess]);

  // Auto-refresh data
  useEffect(() => {
    if (isConnected && address) {
      fetchUtilities();
      fetchNFTOwnership();
      fetchUserAccess();
    }
  }, [isConnected, address, fetchUtilities, fetchNFTOwnership, fetchUserAccess]);

  // Auto-refresh NFT ownership every 5 minutes
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchNFTOwnership();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, address, fetchNFTOwnership]);

  return {
    // State
    utilities,
    userAccess,
    nftOwnership,
    loading,
    error,
    
    // Actions
    fetchUtilities,
    fetchNFTOwnership,
    fetchUserAccess,
    unlockUtility,
    useUtility,
    checkUtilityAccess,
    
    // Computed values
    getAvailableUtilities,
    getUnlockedUtilities,
    hasAccessToUtility,
    getUtilityUsageStats,
    
    // Utility helpers
    clearError: () => setError(null)
  };
}; 