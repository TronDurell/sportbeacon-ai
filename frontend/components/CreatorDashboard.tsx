import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Award,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Image,
  DollarSign,
  Users,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Trophy,
  Zap,
  Calendar,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import web3Service from '@/services/web3Service';
import { TokenBalanceCard } from './web3/TokenBalanceCard';
import { ClaimRewardsButton } from './web3/ClaimRewardsButton';
import { TokenStreamingSetup } from './web3/TokenStreamingSetup';
import { DAOVotePanel } from './web3/DAOVotePanel';
import { NFTMarketplace } from './NFTMarketplace';
import { NFTOwnership, MarketplaceListing, RewardInfo } from '@/services/web3Service';

interface CreatorStats {
  totalNFTs: number;
  totalSales: number;
  totalRevenue: string;
  activeListings: number;
  followers: number;
  engagement: number;
}

interface PayoutStatus {
  id: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  txHash?: string;
}

interface EarningsData {
  date: string;
  earnings: number;
  claims: number;
  streaming: number;
  tips: number;
}

interface ClaimHistory {
  id: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
  reason: string;
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  earnings: string;
  sales: number;
  followers: number;
  verified: boolean;
}

interface StreamingAnalytics {
  totalStreamed: string;
  activeStreams: number;
  completedStreams: number;
  averageStreamDuration: number;
  totalPayouts: number;
}

export const CreatorDashboard: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [nftOwnerships, setNftOwnerships] = useState<NFTOwnership[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [payouts, setPayouts] = useState<PayoutStatus[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [streamingAnalytics, setStreamingAnalytics] = useState<StreamingAnalytics | null>(null);

  const fetchCreatorData = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Initialize Web3 service
      const initialized = await web3Service.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Web3 connection');
      }

      // Fetch all data in parallel
      const [
        nfts,
        listings,
        rewards,
        payoutData,
        earningsResponse,
        claimsResponse,
        leaderboardResponse,
        streamingResponse
      ] = await Promise.all([
        web3Service.getUserActiveNFTs(address),
        web3Service.getCreatorListings(address),
        web3Service.getRewardInfo(address),
        api.get('/api/admin/payouts').catch(() => ({ data: { payouts: [] } })),
        api.get('/api/creator/earnings').catch(() => ({ data: { earnings: [] } })),
        api.get('/api/creator/claims').catch(() => ({ data: { claims: [] } })),
        api.get('/api/creator/leaderboard').catch(() => ({ data: { leaderboard: [] } })),
        api.get('/api/creator/streaming-analytics').catch(() => ({ data: { analytics: null } }))
      ]);

      setNftOwnerships(nfts);
      setMarketplaceListings(listings);
      setRewardInfo(rewards);
      setPayouts(payoutData.data.payouts || []);
      setEarningsData(earningsResponse.data.earnings || []);
      setClaimHistory(claimsResponse.data.claims || []);
      setLeaderboard(leaderboardResponse.data.leaderboard || []);
      setStreamingAnalytics(streamingResponse.data.analytics || null);

      // Calculate stats
      const totalRevenue = listings.reduce((sum, listing) => {
        return sum + (parseFloat(web3Service.formatEther(listing.price)) * listing.sold);
      }, 0);

      setStats({
        totalNFTs: nfts.length,
        totalSales: listings.reduce((sum, listing) => sum + listing.sold, 0),
        totalRevenue: totalRevenue.toFixed(2),
        activeListings: listings.filter(l => l.active).length,
        followers: 1250, // Mock data
        engagement: 87 // Mock data
      });

    } catch (error) {
      console.error('Failed to fetch creator data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCreatorData();
    setRefreshing(false);
  };

  const handleNFTMint = async () => {
    // This would integrate with the NFT minting process
    alert('NFT minting feature will be integrated with the marketplace');
  };

  const handleListingUpdate = async (listingId: number, updates: any) => {
    try {
      // This would update the marketplace listing
      alert('Listing update feature will be integrated');
    } catch (error) {
      console.error('Failed to update listing:', error);
    }
  };

  const handleListingDelete = async (listingId: number) => {
    try {
      // This would cancel the marketplace listing
      alert('Listing deletion feature will be integrated');
    } catch (error) {
      console.error('Failed to delete listing:', error);
    }
  };

  const exportData = async (type: 'earnings' | 'claims' | 'sales') => {
    try {
      const response = await api.get(`/api/creator/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchCreatorData();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Connect your wallet to access your creator dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600">Manage your NFTs, earnings, and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleNFTMint}>
            <Plus className="w-4 h-4 mr-2" />
            Mint NFT
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Token Balance Card */}
      <TokenBalanceCard />

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading creator data...</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total NFTs</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalNFTs || 0}</p>
                      </div>
                      <Image className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalSales || 0}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">${stats?.totalRevenue || '0'}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Listings</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.activeListings || 0}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketplaceListings.slice(0, 5).map((listing) => (
                      <div key={listing.listingId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Image className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">NFT #{listing.tokenId}</p>
                            <p className="text-sm text-gray-600">
                              {listing.sold} sold • {web3Service.formatEther(listing.price)} ETH each
                            </p>
                          </div>
                        </div>
                        <Badge variant={listing.active ? "default" : "secondary"}>
                          {listing.active ? "Active" : "Sold Out"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My NFTs</CardTitle>
            </CardHeader>
            <CardContent>
              {nftOwnerships.length === 0 ? (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No NFTs Found</h3>
                  <p className="text-gray-600 mb-4">You haven't minted any NFTs yet</p>
                  <Button onClick={handleNFTMint}>
                    <Plus className="w-4 h-4 mr-2" />
                    Mint Your First NFT
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nftOwnerships.map((nft) => (
                    <Card key={nft.tokenId} className="overflow-hidden">
                      <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Image className="w-16 h-16 text-white" />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">NFT #{nft.tokenId}</h3>
                          <Badge variant={nft.hasActiveAccess ? "default" : "secondary"}>
                            {nft.hasActiveAccess ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Balance: {nft.balance}
                          {nft.expiry && nft.expiry > 0 && (
                            <span className="block text-xs">
                              Expires: {new Date(nft.expiry * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            List
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Listings</CardTitle>
                <Button onClick={() => setActiveTab('nfts')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Listing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {marketplaceListings.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings</h3>
                  <p className="text-gray-600 mb-4">You haven't created any marketplace listings yet</p>
                  <Button onClick={() => setActiveTab('nfts')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {marketplaceListings.map((listing) => (
                    <div key={listing.listingId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Image className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">NFT #{listing.tokenId}</h3>
                          <p className="text-sm text-gray-600">
                            {listing.sold}/{listing.quantity} sold • {web3Service.formatEther(listing.price)} ETH each
                          </p>
                          <p className="text-xs text-gray-500">
                            Created {new Date(listing.createdAt * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={listing.active ? "default" : "secondary"}>
                          {listing.active ? "Active" : "Sold Out"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleListingUpdate(listing.listingId, {})}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleListingDelete(listing.listingId)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Claim Rewards Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Claim Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimRewardsButton showDetails={true} />
              </CardContent>
            </Card>

            {/* Token Streaming Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Token Streaming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TokenStreamingSetup />
              </CardContent>
            </Card>
          </div>

          {/* Reward History */}
          <Card>
            <CardHeader>
              <CardTitle>Reward History</CardTitle>
            </CardHeader>
            <CardContent>
              {rewardInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-600">Total Earned</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {web3Service.formatEther(rewardInfo.rewardsBalance)} BEACON
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-600">Total Claimed</div>
                      <div className="text-2xl font-bold text-green-900">
                        {web3Service.formatEther(rewardInfo.totalClaimed)} BEACON
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-purple-600">Available to Claim</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {(parseFloat(web3Service.formatEther(rewardInfo.rewardsBalance)) * 0.1).toFixed(2)} BEACON
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Last claim: {rewardInfo.lastClaim > 0 
                      ? new Date(rewardInfo.lastClaim * 1000).toLocaleDateString()
                      : 'Never claimed'
                    }
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4" />
                  <p>No reward data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Followers</span>
                      <span className="text-sm text-gray-600">{stats?.followers || 0}</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Engagement Rate</span>
                      <span className="text-sm text-gray-600">{stats?.engagement || 0}%</span>
                    </div>
                    <Progress value={stats?.engagement || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Revenue</span>
                    <span className="text-lg font-bold text-green-600">${stats?.totalRevenue || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-sm text-gray-600">$1,250</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Month</span>
                    <span className="text-sm text-gray-600">$980</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payouts</h3>
                  <p className="text-gray-600">You haven't requested any payouts yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">${payout.amount}</p>
                        <p className="text-sm text-gray-600">
                          Requested {new Date(payout.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            payout.status === 'approved' ? 'default' : 
                            payout.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </Badge>
                        {payout.txHash && (
                          <Button variant="outline" size="sm" onClick={() => window.open(web3Service.getExplorerUrl(payout.txHash!), '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 