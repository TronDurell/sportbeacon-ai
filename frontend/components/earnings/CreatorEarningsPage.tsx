import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Coins, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import { TokenBalanceCard } from '@/components/web3/TokenBalanceCard';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface EarningsData {
  fiat: {
    total: number;
    pending: number;
    paid: number;
    this_month: number;
    last_month: number;
  };
  tokens: {
    total: number;
    pending: number;
    earned: number;
    this_month: number;
    last_month: number;
  };
  history: {
    date: string;
    fiat: number;
    tokens: number;
    source: string;
  }[];
}

interface PayoutHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  tx_hash?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CreatorEarningsPage: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const fetchEarnings = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      // Mock data for demo - replace with real API calls
      const mockEarnings: EarningsData = {
        fiat: {
          total: 2450.75,
          pending: 125.50,
          paid: 2325.25,
          this_month: 450.25,
          last_month: 380.50
        },
        tokens: {
          total: 12500,
          pending: 500,
          earned: 12000,
          this_month: 2500,
          last_month: 1800
        },
        history: [
          { date: '2024-01-01', fiat: 45.25, tokens: 250, source: 'tips' },
          { date: '2024-01-02', fiat: 32.50, tokens: 180, source: 'content' },
          { date: '2024-01-03', fiat: 67.80, tokens: 320, source: 'subscription' },
          { date: '2024-01-04', fiat: 28.90, tokens: 150, source: 'tips' },
          { date: '2024-01-05', fiat: 89.45, tokens: 420, source: 'content' },
          { date: '2024-01-06', fiat: 56.30, tokens: 280, source: 'subscription' },
          { date: '2024-01-07', fiat: 73.20, tokens: 350, source: 'tips' }
        ]
      };
      
      setEarnings(mockEarnings);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutHistory = async () => {
    if (!address) return;
    
    try {
      // Mock payout history
      const mockPayouts: PayoutHistory[] = [
        {
          id: '1',
          amount: 450.25,
          currency: 'USD',
          status: 'completed',
          date: '2024-01-15',
          tx_hash: '0x123...abc'
        },
        {
          id: '2',
          amount: 380.50,
          currency: 'USD',
          status: 'completed',
          date: '2024-01-01',
          tx_hash: '0x456...def'
        },
        {
          id: '3',
          amount: 125.50,
          currency: 'USD',
          status: 'pending',
          date: '2024-01-20'
        }
      ];
      
      setPayoutHistory(mockPayouts);
    } catch (error) {
      console.error('Failed to fetch payout history:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchEarnings(), fetchPayoutHistory()]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchEarnings();
      fetchPayoutHistory();
    }
  }, [isConnected, address]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTokens = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'tips':
        return '#0088FE';
      case 'content':
        return '#00C49F';
      case 'subscription':
        return '#FFBB28';
      default:
        return '#8884D8';
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your earnings dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading earnings data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Earnings</h1>
          <p className="text-gray-600">Track your fiat and token earnings</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Fiat Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fiat Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.fiat.total || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(earnings?.fiat.this_month || 0)} this month
            </p>
          </CardContent>
        </Card>

        {/* Total Token Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BEACON Tokens</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(earnings?.tokens.total || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatTokens(earnings?.tokens.this_month || 0)} this month
            </p>
          </CardContent>
        </Card>

        {/* Pending Payouts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings?.fiat.pending || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>

        {/* Growth Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+18.3%</div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="tokens">Token Rewards</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Earnings Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earnings?.history || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="fiat" stroke="#8884d8" name="Fiat" />
                    <Line type="monotone" dataKey="tokens" stroke="#82ca9d" name="Tokens" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Tips', value: 45 },
                        { name: 'Content', value: 35 },
                        { name: 'Subscriptions', value: 20 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {earnings?.history.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { month: 'Last Month', fiat: earnings?.fiat.last_month || 0, tokens: earnings?.tokens.last_month || 0 },
                    { month: 'This Month', fiat: earnings?.fiat.this_month || 0, tokens: earnings?.tokens.this_month || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fiat" fill="#8884d8" name="Fiat" />
                    <Bar dataKey="tokens" fill="#82ca9d" name="Tokens" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Content Engagement</span>
                  <Badge variant="outline">+24%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Follower Growth</span>
                  <Badge variant="outline">+12%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revenue per Post</span>
                  <Badge variant="outline">+8%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Token Rewards</span>
                  <Badge variant="outline">+15%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payout History</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{formatCurrency(payout.amount)}</p>
                        <p className="text-sm text-gray-500">{payout.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                      {payout.tx_hash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://mumbai.polygonscan.com/tx/${payout.tx_hash}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Token Rewards Tab */}
        <TabsContent value="tokens" className="space-y-6">
          {/* Token Balance Card */}
          <TokenBalanceCard className="mb-6" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Balance */}
            <Card>
              <CardHeader>
                <CardTitle>BEACON Token Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-blue-600">
                    {formatTokens(earnings?.tokens.total || 0)}
                  </div>
                  <p className="text-gray-600">Total BEACON Tokens</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Earned</p>
                      <p className="font-medium">{formatTokens(earnings?.tokens.earned || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pending</p>
                      <p className="font-medium">{formatTokens(earnings?.tokens.pending || 0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Token Rewards Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Token Rewards Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={earnings?.history || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="tokens" stroke="#82ca9d" name="Tokens" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 