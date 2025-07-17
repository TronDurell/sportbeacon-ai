import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Star, 
  Zap, 
  Target, 
  Calendar,
  Download,
  Share,
  Settings,
  CreditCard,
  Wallet,
  Gift,
  Trophy,
  Flame,
  Crown,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  ThumbsUp,
  Award,
  Badge,
  Star as StarIcon,
  Crown as CrownIcon,
  Zap as ZapIcon
} from 'lucide-react';

interface CreatorStats {
  totalEarnings: number;
  monthlyEarnings: number;
  totalTips: number;
  totalFollowers: number;
  totalLikes: number;
  totalViews: number;
  badgeLevel: number;
  likeStreak: number;
  completionRate: number;
  averageRating: number;
}

interface EarningsData {
  date: string;
  amount: number;
  source: 'tips' | 'subscriptions' | 'sponsorships' | 'merchandise';
}

interface TipData {
  id: string;
  amount: number;
  message: string;
  fromUser: string;
  timestamp: Date;
  isAnonymous: boolean;
}

interface PayoutData {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'stripe' | 'paypal' | 'bank';
  date: Date;
  reference: string;
}

interface StripeAccount {
  id: string;
  isConnected: boolean;
  isVerified: boolean;
  balance: number;
  pendingBalance: number;
  currency: string;
  payoutSchedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  minimumPayout: number;
}

interface BadgeLevel {
  level: number;
  name: string;
  description: string;
  requirements: string[];
  benefits: string[];
  progress: number;
  nextLevel: number;
}

interface LikeStreak {
  currentStreak: number;
  longestStreak: number;
  startDate: Date;
  lastActivity: Date;
  milestones: number[];
  rewards: string[];
}

const CreatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'earnings' | 'tips' | 'payout-setup'>('earnings');
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [tipsData, setTipsData] = useState<TipData[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData[]>([]);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null);
  const [badgeLevel, setBadgeLevel] = useState<BadgeLevel | null>(null);
  const [likeStreak, setLikeStreak] = useState<LikeStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data for development
  useEffect(() => {
    const loadMockData = async () => {
      setIsLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCreatorStats({
        totalEarnings: 15420.50,
        monthlyEarnings: 3240.75,
        totalTips: 8920.25,
        totalFollowers: 15420,
        totalLikes: 89250,
        totalViews: 1250000,
        badgeLevel: 8,
        likeStreak: 45,
        completionRate: 94.5,
        averageRating: 4.8
      });

      setEarningsData([
        { date: '2024-01-01', amount: 120.50, source: 'tips' },
        { date: '2024-01-02', amount: 85.25, source: 'subscriptions' },
        { date: '2024-01-03', amount: 200.00, source: 'sponsorships' },
        { date: '2024-01-04', amount: 45.75, source: 'tips' },
        { date: '2024-01-05', amount: 150.00, source: 'merchandise' },
        { date: '2024-01-06', amount: 95.30, source: 'tips' },
        { date: '2024-01-07', amount: 180.45, source: 'subscriptions' }
      ]);

      setTipsData([
        {
          id: '1',
          amount: 25.00,
          message: 'Amazing content! Keep it up!',
          fromUser: 'soccer_fan_123',
          timestamp: new Date('2024-01-15T10:30:00'),
          isAnonymous: false
        },
        {
          id: '2',
          amount: 50.00,
          message: 'Your drills helped my team so much!',
          fromUser: 'coach_mike',
          timestamp: new Date('2024-01-14T15:45:00'),
          isAnonymous: false
        },
        {
          id: '3',
          amount: 15.00,
          message: '',
          fromUser: 'Anonymous',
          timestamp: new Date('2024-01-13T09:20:00'),
          isAnonymous: true
        },
        {
          id: '4',
          amount: 100.00,
          message: 'Best coach on the platform!',
          fromUser: 'parent_sarah',
          timestamp: new Date('2024-01-12T18:15:00'),
          isAnonymous: false
        }
      ]);

      setPayoutData([
        {
          id: 'payout-1',
          amount: 2500.00,
          status: 'completed',
          method: 'stripe',
          date: new Date('2024-01-10'),
          reference: 'STRIPE_PAYOUT_001'
        },
        {
          id: 'payout-2',
          amount: 1800.50,
          status: 'processing',
          method: 'stripe',
          date: new Date('2024-01-15'),
          reference: 'STRIPE_PAYOUT_002'
        },
        {
          id: 'payout-3',
          amount: 3200.75,
          status: 'pending',
          method: 'stripe',
          date: new Date('2024-01-20'),
          reference: 'STRIPE_PAYOUT_003'
        }
      ]);

      setStripeAccount({
        id: 'acct_stripe123',
        isConnected: true,
        isVerified: true,
        balance: 15420.50,
        pendingBalance: 3240.75,
        currency: 'USD',
        payoutSchedule: 'weekly',
        minimumPayout: 50.00
      });

      setBadgeLevel({
        level: 8,
        name: 'Elite Coach',
        description: 'Consistently delivering exceptional coaching content',
        requirements: [
          'Maintain 4.5+ rating for 3 months',
          'Complete 100+ sessions',
          'Earn $10,000+ in total',
          'Have 10,000+ followers'
        ],
        benefits: [
          'Priority support',
          'Advanced analytics',
          'Exclusive features',
          'Higher payout rates'
        ],
        progress: 85,
        nextLevel: 9
      });

      setLikeStreak({
        currentStreak: 45,
        longestStreak: 67,
        startDate: new Date('2023-12-01'),
        lastActivity: new Date('2024-01-15'),
        milestones: [7, 30, 60, 90, 180, 365],
        rewards: [
          'Badge boost',
          'Featured placement',
          'Bonus earnings',
          'Exclusive content access'
        ]
      });

      setIsLoading(false);
    };

    loadMockData();
  }, []);

  const tabs = [
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'tips', label: 'Tips', icon: Gift },
    { id: 'payout-setup', label: 'Payout Setup', icon: CreditCard }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBadgeIcon = (level: number) => {
    if (level >= 10) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (level >= 7) return <StarIcon className="w-6 h-6 text-purple-500" />;
    if (level >= 4) return <ZapIcon className="w-6 h-6 text-blue-500" />;
    return <Badge className="w-6 h-6 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your earnings, tips, and payouts</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {getBadgeIcon(creatorStats?.badgeLevel || 0)}
              <span className="text-sm font-medium">
                Level {creatorStats?.badgeLevel} Creator
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">
                {likeStreak?.currentStreak} Day Streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(creatorStats?.totalEarnings || 0)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12.5% this month
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tips</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(creatorStats?.totalTips || 0)}
              </p>
            </div>
            <Gift className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <Users className="w-4 h-4 mr-1" />
            {creatorStats?.totalFollowers?.toLocaleString()} followers
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">
                {creatorStats?.totalLikes?.toLocaleString()}
              </p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600">
            <Eye className="w-4 h-4 mr-1" />
            {creatorStats?.totalViews?.toLocaleString()} views
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {creatorStats?.averageRating}/5.0
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-4 flex items-center text-sm text-yellow-600">
            <Target className="w-4 h-4 mr-1" />
            {creatorStats?.completionRate}% completion
          </div>
        </motion.div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'earnings' && (
                <div className="space-y-6">
                  {/* Time Range Selector */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Earnings Overview</h2>
                    <div className="flex items-center gap-2">
                      {['7d', '30d', '90d', '1y'].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range as any)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            timeRange === range
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Earnings Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Earnings Trend</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm text-gray-600">Tips</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-sm text-gray-600">Subscriptions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <span className="text-sm text-gray-600">Sponsorships</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                      {earningsData.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-blue-500 rounded-t" style={{ height: `${(data.amount / 200) * 100}%` }}></div>
                          <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Earnings Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings by Source</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Tips</span>
                          <span className="font-medium">{formatCurrency(creatorStats?.totalTips || 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Subscriptions</span>
                          <span className="font-medium">{formatCurrency(5000)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sponsorships</span>
                          <span className="font-medium">{formatCurrency(3000)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Merchandise</span>
                          <span className="font-medium">{formatCurrency(2500)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Payouts</h3>
                      <div className="space-y-3">
                        {payoutData.slice(0, 3).map((payout) => (
                          <div key={payout.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(payout.amount)}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(payout.date)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tips' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Tips</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tipsData.map((tip) => (
                      <motion.div
                        key={tip.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(tip.amount)}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                {formatDate(tip.timestamp)}
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {tip.isAnonymous ? 'Anonymous' : tip.fromUser}
                            </p>
                            {tip.message && (
                              <p className="text-sm text-gray-600 italic">"{tip.message}"</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <Heart className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tips Analytics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <Gift className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(creatorStats?.totalTips || 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Tips Received</p>
                    </div>
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {tipsData.length}
                      </p>
                      <p className="text-sm text-gray-600">Total Tippers</p>
                    </div>
                    <div className="bg-white rounded-lg border p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency((creatorStats?.totalTips || 0) / tipsData.length)}
                      </p>
                      <p className="text-sm text-gray-600">Average Tip</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payout-setup' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Payout Setup</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>

                  {/* Stripe Account Status */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Stripe Account</h3>
                      <div className="flex items-center gap-2">
                        {stripeAccount?.isConnected ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Not Connected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {stripeAccount?.isConnected ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Account Balance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Available Balance</span>
                              <span className="font-medium">{formatCurrency(stripeAccount.balance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Pending Balance</span>
                              <span className="font-medium">{formatCurrency(stripeAccount.pendingBalance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Currency</span>
                              <span className="font-medium">{stripeAccount.currency}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Payout Settings</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Schedule</span>
                              <span className="font-medium capitalize">{stripeAccount.payoutSchedule}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Minimum Payout</span>
                              <span className="font-medium">{formatCurrency(stripeAccount.minimumPayout)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Verification</span>
                              <span className="font-medium">
                                {stripeAccount.isVerified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Stripe Account</h4>
                        <p className="text-gray-600 mb-4">
                          Connect your Stripe account to start receiving payouts
                        </p>
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Connect Stripe
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payout History */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payout History</h3>
                    <div className="space-y-3">
                      {payoutData.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                            <p className="text-sm text-gray-500">{formatDate(payout.date)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                              {payout.status}
                            </span>
                            <span className="text-xs text-gray-500">{payout.reference}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Badge Level & Streak Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Badge Level</h3>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          {getBadgeIcon(badgeLevel?.level || 0)}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{badgeLevel?.name}</h4>
                        <p className="text-sm text-gray-600 mb-4">{badgeLevel?.description}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${badgeLevel?.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {badgeLevel?.progress}% to Level {badgeLevel?.nextLevel}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Like Streak</h3>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Flame className="w-8 h-8 text-orange-500" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-1">
                          {likeStreak?.currentStreak} Days
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">Current Streak</p>
                        <div className="text-left space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Longest Streak:</span> {likeStreak?.longestStreak} days
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Started:</span> {likeStreak?.startDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard; 