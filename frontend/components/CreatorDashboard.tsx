import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, Dimensions } from 'react-native';
import { TrendingUpIcon, DollarSignIcon, UsersIcon, StarIcon, TrophyIcon, BarChart3Icon, SettingsIcon, BellIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { analytics } from '../../lib/ai/shared/analytics';
import { tipSystem } from '../../lib/ai/tipSystem';
import { badgeManager } from '../../lib/ai/badgeManager';

export interface CreatorStats {
  uid: string;
  totalTipsReceived: number;
  totalEarnings: number;
  tipCount: number;
  averageTipAmount: number;
  highestTipAmount: number;
  lastTipDate?: Date;
  tippingStreak: number;
  monetizationTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierUpgradedAt?: Date;
  followerCount: number;
  postCount: number;
  engagementRate: number;
  totalXP: number;
  level: number;
  badgesUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  monetizationSource: {
    directTips: number;
    campaignTips: number;
    badgeTips: number;
    leaderboardTips: number;
  };
}

export interface RecentTip {
  id: string;
  tipperId: string;
  tipperName: string;
  tipperAvatar?: string;
  amount: number;
  message?: string;
  createdAt: Date;
  source: 'direct' | 'campaign' | 'badge' | 'leaderboard';
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  xpReward: number;
  monetaryReward?: number;
}

export interface HeatmapEvent {
  elementId: string;
  elementType: 'button' | 'card' | 'chart' | 'badge';
  action: 'click' | 'hover' | 'view';
  timestamp: Date;
  sessionId: string;
  userId: string;
}

export default function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'badges' | 'analytics'>('overview');
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const heatmapRef = useRef<Map<string, HeatmapEvent[]>>(new Map());

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'earnings', label: 'Earnings', icon: '💰' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
    { id: 'analytics', label: 'Analytics', icon: '📈' }
  ];

  useEffect(() => {
    loadCreatorData();
    startHeatmapTracking();
  }, []);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      
      // Load creator stats
      const creatorStats = await loadCreatorStats();
      setStats(creatorStats);

      // Load recent tips
      const tips = await loadRecentTips();
      setRecentTips(tips);

      // Load badges
      const userBadges = await loadUserBadges();
      setBadges(userBadges);

      // Track dashboard view
      await analytics.track('creator_dashboard_viewed', {
        userId: creatorStats.uid,
        tier: creatorStats.monetizationTier,
        totalEarnings: creatorStats.totalEarnings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to load creator data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadCreatorStats = async (): Promise<CreatorStats> => {
    try {
      // This would get the current user's creator stats
      // For now, return mock data
      return {
        uid: 'current-user',
        totalTipsReceived: 1250,
        totalEarnings: 1125,
        tipCount: 45,
        averageTipAmount: 27.78,
        highestTipAmount: 100,
        lastTipDate: new Date(),
        tippingStreak: 7,
        monetizationTier: 'silver',
        tierUpgradedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        followerCount: 234,
        postCount: 67,
        engagementRate: 0.12,
        totalXP: 3450,
        level: 8,
        badgesUnlocked: 12,
        currentStreak: 7,
        longestStreak: 15,
        monetizationSource: {
          directTips: 800,
          campaignTips: 300,
          badgeTips: 100,
          leaderboardTips: 50
        }
      };
    } catch (error) {
      console.error('Failed to load creator stats:', error);
      throw error;
    }
  };

  const loadRecentTips = async (): Promise<RecentTip[]> => {
    try {
      const tipsRef = collection(firestore, 'tips');
      const q = query(
        tipsRef,
        where('creatorId', '==', 'current-user'),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const tips: RecentTip[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const tipperProfile = await getUserProfile(data.tipperId);
        
        tips.push({
          id: doc.id,
          tipperId: data.tipperId,
          tipperName: tipperProfile?.displayName || 'Anonymous',
          tipperAvatar: tipperProfile?.avatar,
          amount: data.amount,
          message: data.message,
          createdAt: data.createdAt.toDate(),
          source: data.metadata?.source || 'direct'
        });
      }

      return tips;
    } catch (error) {
      console.error('Failed to load recent tips:', error);
      return [];
    }
  };

  const loadUserBadges = async (): Promise<Badge[]> => {
    try {
      const badgesRef = collection(firestore, 'users', 'current-user', 'badges');
      const q = query(badgesRef, orderBy('unlockedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const badges: Badge[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        badges.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          icon: data.icon,
          rarity: data.rarity,
          unlockedAt: data.unlockedAt.toDate(),
          xpReward: data.xpReward,
          monetaryReward: data.monetaryReward
        });
      });

      return badges;
    } catch (error) {
      console.error('Failed to load user badges:', error);
      return [];
    }
  };

  const getUserProfile = async (uid: string): Promise<any> => {
    try {
      const userRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  };

  const startHeatmapTracking = () => {
    // Track heatmap events
    const trackHeatmapEvent = (elementId: string, elementType: string, action: string) => {
      const event: HeatmapEvent = {
        elementId,
        elementType: elementType as any,
        action: action as any,
        timestamp: new Date(),
        sessionId,
        userId: 'current-user'
      };

      // Store in memory
      if (!heatmapRef.current.has(elementId)) {
        heatmapRef.current.set(elementId, []);
      }
      heatmapRef.current.get(elementId)!.push(event);

      // Send to analytics
      analytics.track('heatmap_interaction', {
        elementId,
        elementType,
        action,
        sessionId,
        timestamp: new Date().toISOString()
      });
    };

    // Expose tracking function globally for this component
    (window as any).trackHeatmapEvent = trackHeatmapEvent;
  };

  const logHeatmapEvent = (elementId: string, elementType: string, action: string) => {
    if ((window as any).trackHeatmapEvent) {
      (window as any).trackHeatmapEvent(elementId, elementType, action);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return '#e5e4e2';
      case 'gold':
        return '#ffd700';
      case 'silver':
        return '#c0c0c0';
      case 'bronze':
        return '#cd7f32';
      default:
        return '#6b7280';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <CrownIcon color="#e5e4e2" size={24} />;
      case 'gold':
        return <TrophyIcon color="#ffd700" size={24} />;
      case 'silver':
        return <StarIcon color="#c0c0c0" size={24} />;
      case 'bronze':
        return <TrophyIcon color="#cd7f32" size={24} />;
      default:
        return <TrophyIcon color="#6b7280" size={24} />;
    }
  };

  const renderOverviewTab = () => (
    <View className="space-y-6">
      {/* Stats Cards */}
      <View className="grid grid-cols-2 gap-4">
        <Pressable
          onPress={() => logHeatmapEvent('earnings-card', 'card', 'click')}
          className="bg-zinc-900 rounded-2xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <DollarSignIcon color="#10b981" size={20} />
            <Text className="text-zinc-400 text-sm">Total Earnings</Text>
          </View>
          <Text className="text-white text-2xl font-bold">${stats?.totalEarnings.toFixed(0)}</Text>
          <Text className="text-green-400 text-sm">+12.5% this week</Text>
        </Pressable>

        <Pressable
          onPress={() => logHeatmapEvent('tips-card', 'card', 'click')}
          className="bg-zinc-900 rounded-2xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <UsersIcon color="#3b82f6" size={20} />
            <Text className="text-zinc-400 text-sm">Total Tips</Text>
          </View>
          <Text className="text-white text-2xl font-bold">{stats?.tipCount}</Text>
          <Text className="text-blue-400 text-sm">+3 today</Text>
        </Pressable>

        <Pressable
          onPress={() => logHeatmapEvent('streak-card', 'card', 'click')}
          className="bg-zinc-900 rounded-2xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <TrendingUpIcon color="#f59e0b" size={20} />
            <Text className="text-zinc-400 text-sm">Current Streak</Text>
          </View>
          <Text className="text-white text-2xl font-bold">{stats?.tippingStreak}</Text>
          <Text className="text-yellow-400 text-sm">days</Text>
        </Pressable>

        <Pressable
          onPress={() => logHeatmapEvent('badges-card', 'card', 'click')}
          className="bg-zinc-900 rounded-2xl p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <StarIcon color="#8b5cf6" size={20} />
            <Text className="text-zinc-400 text-sm">Badges</Text>
          </View>
          <Text className="text-white text-2xl font-bold">{stats?.badgesUnlocked}</Text>
          <Text className="text-purple-400 text-sm">unlocked</Text>
        </Pressable>
      </View>

      {/* Tier Status */}
      <Pressable
        onPress={() => logHeatmapEvent('tier-status', 'card', 'click')}
        className="bg-zinc-900 rounded-2xl p-4"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-semibold">Monetization Tier</Text>
          {getTierIcon(stats?.monetizationTier || 'bronze')}
        </View>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-bold capitalize">
              {stats?.monetizationTier}
            </Text>
            <Text className="text-zinc-400 text-sm">
              Upgraded {stats?.tierUpgradedAt?.toLocaleDateString()}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-zinc-400 text-sm">Next tier</Text>
            <Text className="text-white font-semibold">
              {stats?.monetizationTier === 'bronze' ? 'Silver' :
               stats?.monetizationTier === 'silver' ? 'Gold' :
               stats?.monetizationTier === 'gold' ? 'Platinum' : 'Max'}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Recent Tips */}
      <View>
        <Text className="text-white text-lg font-semibold mb-3">Recent Tips</Text>
        <View className="space-y-3">
          {recentTips.slice(0, 5).map((tip) => (
            <Pressable
              key={tip.id}
              onPress={() => logHeatmapEvent('recent-tip', 'card', 'click')}
              className="bg-zinc-800 rounded-xl p-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {tip.tipperAvatar ? (
                    <Image 
                      source={{ uri: tip.tipperAvatar }} 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <View className="w-8 h-8 bg-blue-600 rounded-full mr-3 items-center justify-center">
                      <Text className="text-white text-xs font-semibold">
                        {tip.tipperName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text className="text-white font-semibold">{tip.tipperName}</Text>
                    <Text className="text-zinc-400 text-sm">
                      {tip.createdAt.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-green-400 font-bold">${tip.amount}</Text>
                  <Text className="text-zinc-500 text-xs capitalize">{tip.source}</Text>
                </View>
              </View>
              {tip.message && (
                <Text className="text-zinc-300 text-sm mt-2 italic">"{tip.message}"</Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEarningsTab = () => (
    <View className="space-y-6">
      {/* Earnings Breakdown */}
      <View className="bg-zinc-900 rounded-2xl p-4">
        <Text className="text-white text-lg font-semibold mb-4">Earnings Breakdown</Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Direct Tips</Text>
            <Text className="text-white font-semibold">
              ${stats?.monetizationSource.directTips.toFixed(0)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Campaign Tips</Text>
            <Text className="text-white font-semibold">
              ${stats?.monetizationSource.campaignTips.toFixed(0)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Badge Tips</Text>
            <Text className="text-white font-semibold">
              ${stats?.monetizationSource.badgeTips.toFixed(0)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Leaderboard Tips</Text>
            <Text className="text-white font-semibold">
              ${stats?.monetizationSource.leaderboardTips.toFixed(0)}
            </Text>
          </View>
          <View className="border-t border-zinc-700 pt-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-semibold">Total</Text>
              <Text className="text-green-400 font-bold text-lg">
                ${stats?.totalEarnings.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Payout Request */}
      <Pressable
        onPress={() => logHeatmapEvent('payout-request', 'button', 'click')}
        className="bg-green-600 rounded-2xl p-4"
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-semibold">Request Payout</Text>
            <Text className="text-green-200 text-sm">
              Minimum $25 required
            </Text>
          </View>
          <DollarSignIcon color="white" size={24} />
        </View>
      </Pressable>
    </View>
  );

  const renderBadgesTab = () => (
    <View className="space-y-6">
      <View className="grid grid-cols-2 gap-4">
        {badges.map((badge) => (
          <Pressable
            key={badge.id}
            onPress={() => logHeatmapEvent(`badge-${badge.id}`, 'badge', 'click')}
            className="bg-zinc-900 rounded-2xl p-4"
          >
            <View className="items-center">
              <Text className="text-3xl mb-2">{badge.icon}</Text>
              <Text className="text-white font-semibold text-center mb-1">
                {badge.title}
              </Text>
              <Text className="text-zinc-400 text-xs text-center mb-2">
                {badge.description}
              </Text>
              <View className="flex-row items-center space-x-2">
                <Text className="text-yellow-400 text-xs">{badge.rarity}</Text>
                <Text className="text-blue-400 text-xs">+{badge.xpReward} XP</Text>
                {badge.monetaryReward && (
                  <Text className="text-green-400 text-xs">+${badge.monetaryReward}</Text>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View className="space-y-6">
      <View className="bg-zinc-900 rounded-2xl p-4">
        <Text className="text-white text-lg font-semibold mb-4">Performance Metrics</Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Follower Count</Text>
            <Text className="text-white font-semibold">{stats?.followerCount}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Post Count</Text>
            <Text className="text-white font-semibold">{stats?.postCount}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Engagement Rate</Text>
            <Text className="text-white font-semibold">{(stats?.engagementRate || 0) * 100}%</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Average Tip Amount</Text>
            <Text className="text-white font-semibold">${stats?.averageTipAmount.toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-zinc-400">Highest Tip</Text>
            <Text className="text-white font-semibold">${stats?.highestTipAmount}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-zinc-400 mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 py-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Creator Dashboard</Text>
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => logHeatmapEvent('notifications', 'button', 'click')}
            className="bg-zinc-800 rounded-xl p-2"
          >
            <BellIcon color="white" size={20} />
          </Pressable>
          <Pressable
            onPress={() => logHeatmapEvent('settings', 'button', 'click')}
            className="bg-zinc-800 rounded-xl p-2"
          >
            <SettingsIcon color="white" size={20} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-zinc-900 rounded-2xl p-1 mb-6">
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => {
              setActiveTab(tab.id as any);
              logHeatmapEvent(`tab-${tab.id}`, 'button', 'click');
            }}
            className={`flex-1 py-3 px-4 rounded-xl ${
              activeTab === tab.id ? 'bg-zinc-700' : ''
            }`}
          >
            <Text className={`text-center text-sm ${
              activeTab === tab.id ? 'text-white font-semibold' : 'text-zinc-400'
            }`}>
              {tab.icon} {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'earnings' && renderEarningsTab()}
        {activeTab === 'badges' && renderBadgesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </View>
  );
} 