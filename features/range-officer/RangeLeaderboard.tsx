import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { TrophyIcon, FilterIcon, MapPinIcon, UsersIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { analytics } from '../../lib/ai/shared/analytics';

interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  drillType: string;
  avgScore: number;
  totalShots: number;
  date: Date;
  region: string;
  age: number;
  usedHardware: boolean;
}

interface UserProfile {
  uid: string;
  displayName: string;
  region: string;
  age: number;
  optInLeaderboard: boolean;
}

const drillTypes = [
  'draw', 'pair', 'circle', 'reload', 'precision', 'speed', 'custom'
];

const regions = [
  'North America', 'Europe', 'Asia', 'Australia', 'South America', 'Africa'
];

const ageGroups = [
  { label: 'All Ages', min: 21, max: 100 },
  { label: '21-30', min: 21, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41-50', min: 41, max: 50 },
  { label: '51+', min: 51, max: 100 }
];

export default function RangeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrillType, setSelectedDrillType] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedDrillType, selectedRegion, selectedAgeGroup, timeframe]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Get start date based on timeframe
      const startDate = new Date();
      if (timeframe === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeframe === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Build query
      let q = query(
        collection(firestore, 'range_sessions'),
        orderBy('avgScore', 'desc'),
        limit(100)
      );

      // Add filters
      const filters = [];
      if (selectedDrillType !== 'all') {
        filters.push(where('drillType', '==', selectedDrillType));
      }
      if (timeframe !== 'all') {
        filters.push(where('date', '>=', startDate));
      }

      // Apply filters
      filters.forEach(filter => {
        q = query(q, filter);
      });

      const querySnapshot = await getDocs(q);
      const sessions: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          userId: data.uid,
          drillType: data.drillType,
          avgScore: data.avgScore || 0,
          totalShots: data.totalShots || 0,
          date: data.date.toDate(),
          usedHardware: data.usedHardware || false
        });
      });

      // Get user profiles for opt-in users
      const userIds = [...new Set(sessions.map(s => s.userId))];
      const userProfiles = await getUserProfiles(userIds);
      
      // Filter and map leaderboard entries
      const leaderboardEntries: LeaderboardEntry[] = sessions
        .map(session => {
          const userProfile = userProfiles.find(u => u.uid === session.userId);
          if (!userProfile || !userProfile.optInLeaderboard) return null;

          // Apply region filter
          if (selectedRegion !== 'all' && userProfile.region !== selectedRegion) {
            return null;
          }

          // Apply age filter
          const ageGroup = ageGroups[selectedAgeGroup];
          if (selectedAgeGroup > 0 && (userProfile.age < ageGroup.min || userProfile.age > ageGroup.max)) {
            return null;
          }

          return {
            ...session,
            userName: userProfile.displayName || 'Anonymous',
            region: userProfile.region || 'Unknown',
            age: userProfile.age || 0
          };
        })
        .filter(entry => entry !== null)
        .sort((a, b) => b!.avgScore - a!.avgScore)
        .slice(0, 50);

      setLeaderboard(leaderboardEntries);

      await analytics.track('leaderboard_viewed', {
        drillType: selectedDrillType,
        region: selectedRegion,
        ageGroup: selectedAgeGroup,
        timeframe,
        resultsCount: leaderboardEntries.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
    const profiles: UserProfile[] = [];
    
    for (const userId of userIds) {
      try {
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          profiles.push({
            uid: userId,
            displayName: data.displayName || 'Anonymous',
            region: data.region || 'Unknown',
            age: data.age || 0,
            optInLeaderboard: data.optInLeaderboard || false
          });
        }
      } catch (error) {
        console.error(`Failed to get profile for user ${userId}:`, error);
      }
    }
    
    return profiles;
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${position + 1}`;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 95) return '#10b981'; // emerald
    if (score >= 90) return '#3b82f6'; // blue
    if (score >= 85) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const filteredLeaderboard = leaderboard.filter(entry =>
    entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.drillType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <TrophyIcon color="#fbbf24" size={24} />
          <Text className="text-white text-2xl font-bold ml-2">Leaderboard</Text>
        </View>
        <FilterIcon color="white" size={20} />
      </View>

      {/* Search */}
      <View className="mb-4">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or drill type..."
          placeholderTextColor="#6b7280"
          className="bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-700"
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {/* Drill Type Filter */}
        <View className="mr-4">
          <Text className="text-zinc-400 text-sm mb-2">Drill Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', ...drillTypes].map((drillType) => (
              <Pressable
                key={drillType}
                onPress={() => setSelectedDrillType(drillType)}
                className={`mr-2 px-3 py-2 rounded-lg ${
                  selectedDrillType === drillType ? 'bg-blue-600' : 'bg-zinc-800'
                }`}
              >
                <Text className={`text-sm ${
                  selectedDrillType === drillType ? 'text-white' : 'text-zinc-400'
                }`}>
                  {drillType === 'all' ? 'All' : drillType.charAt(0).toUpperCase() + drillType.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Region and Age Filters */}
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-zinc-400 text-sm mb-2">Region</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', ...regions].map((region) => (
              <Pressable
                key={region}
                onPress={() => setSelectedRegion(region)}
                className={`mr-2 px-3 py-2 rounded-lg ${
                  selectedRegion === region ? 'bg-blue-600' : 'bg-zinc-800'
                }`}
              >
                <Text className={`text-sm ${
                  selectedRegion === region ? 'text-white' : 'text-zinc-400'
                }`}>
                  {region === 'all' ? 'All' : region}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Timeframe Filter */}
      <View className="mb-6">
        <Text className="text-zinc-400 text-sm mb-2">Timeframe</Text>
        <View className="flex-row bg-zinc-900 rounded-xl p-1">
          {['week', 'month', 'year', 'all'].map((period) => (
            <Pressable
              key={period}
              onPress={() => setTimeframe(period as any)}
              className={`flex-1 py-2 px-4 rounded-lg ${
                timeframe === period ? 'bg-blue-600' : 'bg-transparent'
              }`}
            >
              <Text className={`text-center font-medium ${
                timeframe === period ? 'text-white' : 'text-zinc-400'
              }`}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">Loading leaderboard...</Text>
        </View>
      ) : filteredLeaderboard.length === 0 ? (
        <View className="flex-1 justify-center items-center py-12">
          <TrophyIcon color="#6b7280" size={48} />
          <Text className="text-zinc-400 text-lg mt-4">No scores found</Text>
          <Text className="text-zinc-500 text-center mt-2">
            Try adjusting your filters or check back later
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeaderboard}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View className="bg-zinc-900 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-3">{getMedalIcon(index)}</Text>
                  <View>
                    <Text className="text-white font-semibold">{item.userName}</Text>
                    <Text className="text-zinc-400 text-sm">{item.drillType}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text 
                    className="text-2xl font-bold"
                    style={{ color: getScoreColor(item.avgScore) }}
                  >
                    {Math.round(item.avgScore)}
                  </Text>
                  <Text className="text-zinc-400 text-sm">/100</Text>
                </View>
              </View>
              
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <MapPinIcon color="#6b7280" size={16} />
                  <Text className="text-zinc-400 text-sm ml-1">{item.region}</Text>
                </View>
                <View className="flex-row items-center">
                  <UsersIcon color="#6b7280" size={16} />
                  <Text className="text-zinc-400 text-sm ml-1">{item.age} years</Text>
                </View>
                <Text className="text-zinc-500 text-xs">
                  {item.totalShots} shots
                </Text>
                {item.usedHardware && (
                  <View className="bg-blue-600 rounded-full px-2 py-1">
                    <Text className="text-white text-xs">Hardware</Text>
                  </View>
                )}
              </View>
              
              <Text className="text-zinc-500 text-xs mt-2">
                {item.date.toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
} 