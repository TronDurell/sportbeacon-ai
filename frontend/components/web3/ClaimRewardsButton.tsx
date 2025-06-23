import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';
import { RewardInfo } from '@/services/web3Service';

interface ClaimRewardsButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDetails?: boolean;
}

interface ClaimStatus {
  status: 'idle' | 'checking' | 'claiming' | 'success' | 'error';
  message: string;
  txHash?: string;
  amount?: string;
  error?: string;
}

export const ClaimRewardsButton: React.FC<ClaimRewardsButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  showDetails = false
}) => {
  const { address, isConnected } = useWallet();
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>({
    status: 'idle',
    message: 'Check available rewards'
  });
  const [loading, setLoading] = useState(false);
  const [availableRewards, setAvailableRewards] = useState<string>('0');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Fetch reward information on component mount and wallet connection
  useEffect(() => {
    if (isConnected && address) {
      fetchRewardInfo();
    }
  }, [isConnected, address]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchRewardInfo();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  const fetchRewardInfo = async () => {
    if (!address) return;

    try {
      setLoading(true);
      
      // Initialize Web3 service
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Get reward info from blockchain
      const info = await web3Service.getRewardInfo(address);
      setRewardInfo(info);
      
      // Calculate available rewards (simplified - in real implementation this would come from backend)
      const available = parseFloat(web3Service.formatEther(info.rewardsBalance)) * 0.1; // 10% of total rewards pool
      setAvailableRewards(available.toString());
      setLastCheck(new Date());
      
    } catch (error) {
      console.error('Failed to fetch reward info:', error);
      // Fallback to API
      try {
        const response = await api.get(`/api/rewards/balance/${address}`);
        setRewardInfo({
          balance: response.data.balance || '0',
          totalClaimed: response.data.total_claimed || '0',
          lastClaim: response.data.last_claim || 0,
          rewardsBalance: response.data.available_rewards || '0'
        });
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableRewards = async () => {
    if (!address) return;

    try {
      setClaimStatus({
        status: 'checking',
        message: 'Checking available rewards...'
      });

      // Simulate checking available rewards (in real implementation, this would query the backend)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const available = parseFloat(availableRewards);
      if (available > 0) {
        setClaimStatus({
          status: 'idle',
          message: `${available.toFixed(2)} BEACON available to claim`
        });
      } else {
        setClaimStatus({
          status: 'idle',
          message: 'No rewards available to claim'
        });
      }
    } catch (error) {
      setClaimStatus({
        status: 'error',
        message: 'Failed to check rewards',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const claimRewards = async () => {
    if (!address || !rewardInfo) return;

    try {
      setClaimStatus({
        status: 'claiming',
        message: 'Claiming rewards...'
      });

      // First try blockchain claim (if user has permission)
      try {
        const initialized = await web3Service.initialize();
        if (initialized) {
          const tx = await web3Service.claimRewards(availableRewards, 'creator_reward_claim');
          setClaimStatus({
            status: 'success',
            message: 'Rewards claimed successfully!',
            txHash: tx.transactionHash,
            amount: availableRewards
          });
          
          // Refresh reward info after successful claim
          setTimeout(() => {
            fetchRewardInfo();
          }, 2000);
          
          return;
        }
      } catch (blockchainError) {
        console.log('Blockchain claim failed, trying API fallback:', blockchainError);
      }

      // Fallback to API claim
      const response = await api.post('/api/rewards/claim', {
        address: address,
        amount: availableRewards,
        reason: 'creator_reward_claim'
      });

      setClaimStatus({
        status: 'success',
        message: 'Rewards claimed successfully!',
        txHash: response.data.tx_hash,
        amount: availableRewards
      });

      // Refresh reward info after successful claim
      setTimeout(() => {
        fetchRewardInfo();
      }, 2000);

    } catch (error) {
      console.error('Failed to claim rewards:', error);
      setClaimStatus({
        status: 'error',
        message: 'Failed to claim rewards',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getStatusIcon = () => {
    switch (claimStatus.status) {
      case 'checking':
      case 'claiming':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    switch (claimStatus.status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
      case 'claiming':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const isClaimDisabled = () => {
    return !isConnected || 
           loading || 
           claimStatus.status === 'claiming' || 
           claimStatus.status === 'checking' ||
           parseFloat(availableRewards) <= 0;
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return web3Service.getExplorerUrl(txHash);
  };

  if (!isConnected) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet to Claim
      </Button>
    );
  }

  return (
    <div className={className}>
      {/* Main Claim Button */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant={variant}
            size={size}
            onClick={claimRewards}
            disabled={isClaimDisabled()}
            className="flex-1"
          >
            {getStatusIcon()}
            <span className="ml-2">
              {claimStatus.status === 'claiming' ? 'Claiming...' : 'Claim Rewards'}
            </span>
          </Button>
          
          <Button
            variant="outline"
            size={size}
            onClick={checkAvailableRewards}
            disabled={loading || claimStatus.status === 'claiming'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Status Message */}
        <div className={`text-sm ${getStatusColor()}`}>
          {claimStatus.message}
        </div>

        {/* Success/Error Details */}
        {claimStatus.status === 'success' && claimStatus.txHash && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">
                    Claimed {claimStatus.amount} BEACON
                  </p>
                  <p className="text-sm text-green-600">
                    Transaction: {web3Service.formatAddress(claimStatus.txHash)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getBlockExplorerUrl(claimStatus.txHash!), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {claimStatus.status === 'error' && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  {claimStatus.error || 'An error occurred while claiming rewards'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Reward Information */}
      {showDetails && rewardInfo && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Reward Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Available Rewards */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Available to Claim</span>
              </div>
              <Badge variant="default" className="text-lg">
                {parseFloat(availableRewards).toFixed(2)} BEACON
              </Badge>
            </div>

            {/* Reward Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Total Claimed</div>
                <div className="font-medium">
                  {web3Service.formatEther(rewardInfo.totalClaimed)} BEACON
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Current Balance</div>
                <div className="font-medium">
                  {web3Service.formatEther(rewardInfo.balance)} BEACON
                </div>
              </div>
            </div>

            {/* Last Claim Info */}
            {rewardInfo.lastClaim > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  Last claim: {new Date(rewardInfo.lastClaim * 1000).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Last Update */}
            {lastCheck && (
              <div className="text-xs text-gray-500">
                Last updated: {lastCheck.toLocaleTimeString()}
              </div>
            )}

            {/* Reward Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Monthly Progress</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-gray-500">
                Earn more by creating content and engaging with the community
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 