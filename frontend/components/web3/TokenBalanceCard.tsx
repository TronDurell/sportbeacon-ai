import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Award,
  RefreshCw,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';
import { RewardInfo } from '@/services/web3Service';

interface TokenBalance {
  address: string;
  balance: string;
  balance_formatted: string;
}

interface RewardHistory {
  id: string;
  amount: string;
  reason: string;
  tx_hash: string;
  block_number: number;
  status: string;
  timestamp: string;
}

interface TokenBalanceCardProps {
  className?: string;
}

export const TokenBalanceCard: React.FC<TokenBalanceCardProps> = ({ className }) => {
  const { address, isConnected } = useWallet();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [rewardHistory, setRewardHistory] = useState<RewardHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchBalance = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Initialize Web3 service if not already done
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Get real-time balance from blockchain
      const tokenBalance = await web3Service.getTokenBalance(address);
      const rewardData = await web3Service.getRewardInfo(address);
      
      setBalance({
        address,
        balance: tokenBalance,
        balance_formatted: web3Service.formatEther(tokenBalance)
      });
      
      setRewardInfo(rewardData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch balance');
      
      // Fallback to API if blockchain call fails
      try {
        const response = await api.get(`/api/rewards/balance/${address}`);
        setBalance(response.data);
        setLastUpdate(new Date());
      } catch (apiError) {
        console.error('API fallback also failed:', apiError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardHistory = async () => {
    if (!address) return;
    
    try {
      const response = await api.get('/api/rewards/history');
      // Filter rewards for current user
      const userRewards = response.data.rewards.filter(
        (reward: RewardHistory) => reward.address === address
      );
      setRewardHistory(userRewards.slice(0, 10)); // Show last 10 rewards
    } catch (error) {
      console.error('Failed to fetch reward history:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchBalance(), fetchRewardHistory()]);
    setRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchBalance();
      fetchRewardHistory();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Initial fetch on mount and wallet connection
  useEffect(() => {
    if (isConnected && address) {
      fetchBalance();
      fetchRewardHistory();
    }
  }, [isConnected, address]);

  const claimRewards = async () => {
    if (!address || !rewardInfo) return;
    
    try {
      setLoading(true);
      // This would typically be handled by the backend
      // For demo purposes, we'll show a success message
      alert('Reward claim request submitted. This will be processed by the backend.');
    } catch (error) {
      console.error('Failed to claim rewards:', error);
      setError('Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toFixed(2);
  };

  const getReasonIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'milestone_achieved':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'engagement_bonus':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'content_creation':
        return <Award className="w-4 h-4 text-blue-500" />;
      default:
        return <Award className="w-4 h-4 text-gray-500" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    return reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return web3Service.getExplorerUrl(txHash);
  };

  if (!isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            BEACON Token Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Connect your wallet to view your BEACON token balance</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            BEACON Token Balance
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Balance Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Balance</span>
            <Badge variant="secondary">
              {loading ? 'Loading...' : balance ? `${formatBalance(balance.balance_formatted)} BEACON` : '0 BEACON'}
            </Badge>
          </div>
          
          {balance && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {formatBalance(balance.balance_formatted)} BEACON
              </div>
              <div className="text-sm text-gray-600">
                Address: {web3Service.formatAddress(address)}
              </div>
              {lastUpdate && (
                <div className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reward Info */}
        {rewardInfo && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Reward Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">Total Claimed</div>
                <div className="font-medium">{formatBalance(web3Service.formatEther(rewardInfo.totalClaimed))} BEACON</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">Last Claim</div>
                <div className="font-medium">
                  {rewardInfo.lastClaim > 0 
                    ? new Date(rewardInfo.lastClaim * 1000).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Earning Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Monthly Progress</span>
            <span className="font-medium">75%</span>
          </div>
          <Progress value={75} className="h-2" />
          <p className="text-xs text-gray-500">
            Earn more by creating content and engaging with the community
          </p>
        </div>

        {/* Recent Rewards */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Recent Rewards</h3>
          {rewardHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Award className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No rewards yet</p>
              <p className="text-xs">Start creating content to earn BEACON tokens</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {rewardHistory.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getReasonIcon(reward.reason)}
                    <div>
                      <p className="text-sm font-medium">
                        {getReasonLabel(reward.reason)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(reward.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-600">
                      +{formatBalance(reward.amount)} BEACON
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getBlockExplorerUrl(reward.tx_hash), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.open('/creator-dashboard', '_blank')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={claimRewards}
            disabled={loading || !rewardInfo}
          >
            <Award className="w-4 h-4 mr-2" />
            Claim Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 