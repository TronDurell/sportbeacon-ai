import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { TrophyIcon, StarIcon, TrendingUpIcon, UsersIcon, CrownIcon, MedalIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { analytics } from '../../lib/ai/shared/analytics';
import { calculateCompositeScore } from '../utils/leaderboardScore';

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatar?: string;
  compositeScore: number;
  avgScore: number;
  consistency: number;
  improvementRate: number;
  sessionCount: number;
  rank: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  badges: number;
  totalXP: number;
  level: number;
  streak: number;
  lastActive: Date;
  monetizationStats?: {
    totalEarnings: number;
    tipCount: number;
    averageTipAmount: number;
  };
}

export interface LeaderboardFilter {
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'allTime';
  category: 'overall' | 'accuracy' | 'consistency' | 'improvement' | 'monetization';
  tier: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum';
  region?: string;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<LeaderboardFilter>({
    timeFrame: 'weekly',
    category: 'overall',
    tier: 'all'
  });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);

  const timeFrames = [
    { value: 'daily', label: 'Today', icon: '🌅' },
    { value: 'weekly', label: 'This Week', icon: '📅' },
    { value: 'monthly', label: 'This Month', icon: '📊' },
    { value: 'allTime', label: 'All Time', icon: '🏆' }
  ];

  const categories = [
    { value: 'overall', label: 'Overall', icon: '🎯' },
    { value: 'accuracy', label: 'Accuracy', icon: '🎯' },
    { value: 'consistency', label: 'Consistency', icon: '📈' },
    { value: 'improvement', label: 'Improvement', icon: '🚀' },
    { value: 'monetization', label: 'Earnings', icon: '💰' }
  ];

  const tiers = [
    { value: 'all', label: 'All Tiers', color: '#6b7280' },
    { value: 'bronze', label: 'Bronze', color: '#cd7f32' },
    { value: 'silver', label: 'Silver', color: '#c0c0c0' },
    { value: 'gold', label: 'Gold', color: '#ffd700' },
    { value: 'platinum', label: 'Platinum', color: '#e5e4e2' }
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      const leaderboardData = await fetchLeaderboardData(filter);
      setEntries(leaderboardData);

      // Get user's rank and entry
      const userData = await getUserLeaderboardData();
      if (userData) {
        setUserRank(userData.rank);
        setUserEntry(userData);
      }

      // Track analytics
      await analytics.track('leaderboard_viewed', {
        timeFrame: filter.timeFrame,
        category: filter.category,
        tier: filter.tier,
        entryCount: leaderboardData.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const fetchLeaderboardData = async (filter: LeaderboardFilter): Promise<LeaderboardEntry[]> => {
    try {
      const leaderboardRef = collection(firestore, 'leaderboard_scores');
      let q = query(leaderboardRef);

      // Apply time frame filter
      if (filter.timeFrame !== 'allTime') {
        const cutoffDate = getCutoffDate(filter.timeFrame);
        q = query(q, where('lastUpdated', '>=', cutoffDate));
      }

      // Apply tier filter
      if (filter.tier !== 'all') {
        q = query(q, where('tier', '==', filter.tier));
      }

      // Apply sorting based on category
      const sortField = getSortField(filter.category);
      q = query(q, orderBy(sortField, 'desc'), limit(100));

      const snapshot = await getDocs(q);
      const entries: LeaderboardEntry[] = [];

      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const data = doc.data();
        
        // Get user profile data
        const userProfile = await getUserProfile(data.uid);
        
        entries.push({
          uid: data.uid,
          displayName: userProfile?.displayName || 'Anonymous',
          avatar: userProfile?.avatar,
          compositeScore: data.compositeScore,
          avgScore: data.avgScore,
          consistency: data.consistency,
          improvementRate: data.improvementRate,
          sessionCount: data.sessionCount,
          rank: i + 1,
          tier: data.tier || 'bronze',
          badges: data.badges || 0,
          totalXP: data.totalXP || 0,
          level: data.level || 1,
          streak: data.streak || 0,
          lastActive: data.lastUpdated?.toDate() || new Date(),
          monetizationStats: data.monetizationStats
        });
      }

      return entries;

    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
      return [];
    }
  };

  const getUserLeaderboardData = async (): Promise<LeaderboardEntry | null> => {
    try {
      // This would get the current user's data
      // For now, return null
      return null;
    } catch (error) {
      console.error('Failed to get user leaderboard data:', error);
      return null;
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

  const getCutoffDate = (timeFrame: string): Date => {
    const now = new Date();
    switch (timeFrame) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  };

  const getSortField = (category: string): string => {
    switch (category) {
      case 'accuracy':
        return 'avgScore';
      case 'consistency':
        return 'consistency';
      case 'improvement':
        return 'improvementRate';
      case 'monetization':
        return 'monetizationStats.totalEarnings';
      default:
        return 'compositeScore';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <CrownIcon color="#e5e4e2" size={20} />;
      case 'gold':
        return <MedalIcon color="#ffd700" size={20} />;
      case 'silver':
        return <StarIcon color="#c0c0c0" size={20} />;
      case 'bronze':
        return <TrophyIcon color="#cd7f32" size={20} />;
      default:
        return <TrophyIcon color="#6b7280" size={20} />;
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

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <View key={entry.uid} className={`bg-zinc-900 rounded-2xl p-4 mb-3 ${
      index < 3 ? 'border-2' : 'border border-zinc-700'
    }`} style={{
      borderColor: index < 3 ? getTierColor(['gold', 'silver', 'bronze'][index]) : '#374151'
    }}>
      <View className="flex-row items-center justify-between">
        {/* Rank and Avatar */}
        <View className="flex-row items-center flex-1">
          <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-3">
            <Text className={`font-bold ${
              index < 3 ? 'text-white' : 'text-zinc-400'
            }`}>
              {entry.rank}
            </Text>
          </View>
          
          {entry.avatar ? (
            <Image 
              source={{ uri: entry.avatar }} 
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <View className="w-10 h-10 bg-blue-600 rounded-full mr-3 items-center justify-center">
              <Text className="text-white font-semibold">
                {entry.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View className="flex-1">
            <Text className="text-white font-semibold">{entry.displayName}</Text>
            <View className="flex-row items-center mt-1">
              {getTierIcon(entry.tier)}
              <Text className="text-zinc-400 text-sm ml-1 capitalize">{entry.tier}</Text>
              <Text className="text-zinc-500 text-sm ml-2">Lv.{entry.level}</Text>
            </View>
          </View>
        </View>

        {/* Score and Stats */}
        <View className="items-end">
          <Text className="text-white font-bold text-lg">
            {filter.category === 'monetization' 
              ? `$${entry.monetizationStats?.totalEarnings?.toFixed(0) || 0}`
              : entry.compositeScore.toFixed(1)
            }
          </Text>
          
          <View className="flex-row items-center mt-1">
            <TrendingUpIcon color="#10b981" size={14} />
            <Text className="text-zinc-400 text-sm ml-1">
              {entry.sessionCount} sessions
            </Text>
          </View>
        </View>
      </View>

      {/* Additional Stats */}
      <View className="flex-row justify-between mt-3 pt-3 border-t border-zinc-800">
        <View className="flex-row items-center">
          <StarIcon color="#fbbf24" size={14} />
          <Text className="text-zinc-400 text-sm ml-1">{entry.badges} badges</Text>
        </View>
        
        <View className="flex-row items-center">
          <UsersIcon color="#3b82f6" size={14} />
          <Text className="text-zinc-400 text-sm ml-1">{entry.streak} day streak</Text>
        </View>
        
        <View className="flex-row items-center">
          <Text className="text-zinc-400 text-sm">
            {entry.lastActive.toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filter.tier !== 'all' && entry.tier !== filter.tier) {
        return false;
      }
      return true;
    });
  }, [entries, filter]);

  return (
    <View className="flex-1 bg-black px-4 py-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Leaderboard</Text>
        <Pressable
          onPress={onRefresh}
          className="bg-zinc-800 rounded-xl p-2"
        >
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        </Pressable>
      </View>

      {/* User Rank Card */}
      {userEntry && (
        <View className="bg-blue-900 rounded-2xl p-4 mb-6 border border-blue-600">
          <Text className="text-blue-200 text-sm mb-2">Your Rank</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-700 items-center justify-center mr-3">
                <Text className="text-white font-bold">{userRank}</Text>
              </View>
              <Text className="text-white font-semibold">{userEntry.displayName}</Text>
            </View>
            <Text className="text-white font-bold text-lg">
              {userEntry.compositeScore.toFixed(1)}
            </Text>
          </View>
        </View>
      )}

      {/* Filters */}
      <View className="mb-6">
        {/* Time Frame Filter */}
        <Text className="text-zinc-300 text-sm mb-2">Time Frame</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {timeFrames.map((timeFrame) => (
            <Pressable
              key={timeFrame.value}
              onPress={() => setFilter(prev => ({ ...prev, timeFrame: timeFrame.value as any }))}
              className={`mr-2 px-3 py-2 rounded-lg border ${
                filter.timeFrame === timeFrame.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: filter.timeFrame === timeFrame.value ? '#3b82f6' + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                filter.timeFrame === timeFrame.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {timeFrame.icon} {timeFrame.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <Text className="text-zinc-300 text-sm mb-2">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {categories.map((category) => (
            <Pressable
              key={category.value}
              onPress={() => setFilter(prev => ({ ...prev, category: category.value as any }))}
              className={`mr-2 px-3 py-2 rounded-lg border ${
                filter.category === category.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: filter.category === category.value ? '#10b981' + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                filter.category === category.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {category.icon} {category.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tier Filter */}
        <Text className="text-zinc-300 text-sm mb-2">Tier</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tiers.map((tier) => (
            <Pressable
              key={tier.value}
              onPress={() => setFilter(prev => ({ ...prev, tier: tier.value as any }))}
              className={`mr-2 px-3 py-2 rounded-lg border ${
                filter.tier === tier.value 
                  ? 'border-white' 
                  : 'border-zinc-700'
              }`}
              style={{ backgroundColor: filter.tier === tier.value ? tier.color + '20' : '#27272a' }}
            >
              <Text className={`text-sm ${
                filter.tier === tier.value ? 'text-white' : 'text-zinc-400'
              }`}>
                {tier.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-zinc-400 mt-4">Loading leaderboard...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <TrophyIcon color="#6b7280" size={48} />
          <Text className="text-zinc-400 text-lg mt-4">No entries found</Text>
          <Text className="text-zinc-500 text-center mt-2">
            Try adjusting your filters
          </Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredEntries.map((entry, index) => renderLeaderboardEntry(entry, index))}
        </ScrollView>
      )}
    </View>
  );
} 