import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  Crown,
  Star,
  Users,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle,
  ShoppingCart
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';

interface NFTSubscription {
  token_id: number;
  name: string;
  description: string;
  tier: 'basic' | 'premium' | 'vip' | 'elite';
  expires_at: string;
  benefits: string[];
  status: 'active' | 'expired' | 'pending';
  metadata?: {
    image_uri?: string;
    color: string;
  };
  tx_hash?: string; // Transaction hash for block explorer
  purchase_date?: string;
}

interface SubscriptionStats {
  total_subscriptions: number;
  active_subscriptions: number;
  expiring_soon: number;
  total_value: number;
  last_update?: string;
}

const NFT_TIERS = {
  basic: {
    name: 'Basic Access',
    color: 'bg-blue-500',
    icon: <Shield className="w-4 h-4" />,
    benefits: ['Basic content access', 'Community features', 'Standard support']
  },
  premium: {
    name: 'Premium Access',
    color: 'bg-purple-500',
    icon: <Star className="w-4 h-4" />,
    benefits: ['Premium content', 'Priority support', 'Exclusive events', 'Early access']
  },
  vip: {
    name: 'VIP Access',
    color: 'bg-yellow-500',
    icon: <Crown className="w-4 h-4" />,
    benefits: ['VIP content', 'Direct creator access', 'Custom features', 'Premium events']
  },
  elite: {
    name: 'Elite Access',
    color: 'bg-red-500',
    icon: <Zap className="w-4 h-4" />,
    benefits: ['All content access', 'Creator mentorship', 'Exclusive NFTs', 'VIP events']
  }
};

export const NFTSubscriptionTracker: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [subscriptions, setSubscriptions] = useState<NFTSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSubscriptions = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      
      // Try to get NFT ownership from blockchain first
      try {
        const initialized = await web3Service.initialize();
        if (initialized) {
          const nftOwnership = await web3Service.getNFTOwnership(address);
          // Merge blockchain data with API data
          const response = await api.get(`/api/nft/subscriptions/${address}`);
          const apiSubscriptions = response.data.subscriptions || [];
          
          // Enhance with blockchain data
          const enhancedSubscriptions = apiSubscriptions.map((sub: NFTSubscription) => ({
            ...sub,
            tx_hash: nftOwnership.find(nft => nft.tokenId === sub.token_id)?.txHash,
            purchase_date: nftOwnership.find(nft => nft.tokenId === sub.token_id)?.purchaseDate
          }));
          
          setSubscriptions(enhancedSubscriptions);
          setStats({
            ...response.data.stats,
            last_update: new Date().toISOString()
          });
          setLastUpdate(new Date());
        }
      } catch (blockchainError) {
        console.log('Blockchain fetch failed, using API only:', blockchainError);
        // Fallback to API only
        const response = await api.get(`/api/nft/subscriptions/${address}`);
        setSubscriptions(response.data.subscriptions || []);
        setStats({
          ...response.data.stats,
          last_update: new Date().toISOString()
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchSubscriptions();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, address]);

  // Initial fetch on mount and wallet connection
  useEffect(() => {
    if (isConnected && address) {
      fetchSubscriptions();
    }
  }, [isConnected, address]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBlockExplorerUrl = (txHash: string) => {
    return web3Service.getExplorerUrl(txHash);
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            NFT Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Connect your wallet to view your NFT subscriptions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NFT Subscriptions</h2>
          <p className="text-gray-600">Track your NFT access passes and subscription benefits</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_subscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_subscriptions} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expiring_soon} expiring soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_value}</div>
              <p className="text-xs text-muted-foreground">
                subscription value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Access Level</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.length > 0 ? 
                  subscriptions.map(s => NFT_TIERS[s.tier]?.name).join(', ') : 
                  'None'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                current tier
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading subscriptions...</span>
          </CardContent>
        </Card>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscriptions</h3>
            <p className="text-gray-600 mb-4">You don't have any active NFT subscriptions yet</p>
            <Button onClick={() => window.open('/nft-marketplace', '_blank')}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Browse NFTs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const daysUntilExpiry = getDaysUntilExpiry(subscription.expires_at);
            const tier = NFT_TIERS[subscription.tier];
            
            return (
              <Card key={subscription.token_id} className="overflow-hidden">
                <div className={`h-2 ${tier.color}`}></div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${tier.color} rounded-lg flex items-center justify-center text-white`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{subscription.name}</h3>
                        <p className="text-sm text-gray-600">{subscription.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Expires: {formatDate(subscription.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(subscription.status)}
                        <span className="text-sm font-medium">{tier.name}</span>
                      </div>
                      {daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                        <p className="text-xs text-orange-600 mt-1">
                          {daysUntilExpiry} days left
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar for Expiry */}
                  {subscription.status === 'active' && daysUntilExpiry > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Subscription Status</span>
                        <span>{daysUntilExpiry} days remaining</span>
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, (daysUntilExpiry / 365) * 100))} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {subscription.status === 'active' && daysUntilExpiry <= 30 && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Renew
                      </Button>
                    )}
                    {subscription.tx_hash && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(getBlockExplorerUrl(subscription.tx_hash!), '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        TX
                      </Button>
                    )}
                  </div>

                  {/* Transaction Info */}
                  {subscription.tx_hash && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Transaction: {web3Service.formatAddress(subscription.tx_hash)}</span>
                        {subscription.purchase_date && (
                          <span>Purchased: {formatDate(subscription.purchase_date)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/nft-marketplace', '_blank')}>
              <ShoppingCart className="w-6 h-6 mb-2" />
              <span>Browse NFTs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/my-nfts', '_blank')}>
              <Shield className="w-6 h-6 mb-2" />
              <span>My NFTs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => window.open('/subscription-history', '_blank')}>
              <Calendar className="w-6 h-6 mb-2" />
              <span>History</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="text-center text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}; 