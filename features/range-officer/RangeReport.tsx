import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { ShareIcon, DownloadIcon, CalendarIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../../frontend/hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

interface RangeSession {
  id: string;
  drillType: string;
  date: Date;
  scores: number[];
  feedback: string[];
  avgScore: number;
  totalShots: number;
  usedHardware: boolean;
}

export default function RangeReport() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadSessions();
  }, [selectedPeriod]);

  const loadSessions = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      
      const startDate = new Date();
      if (selectedPeriod === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (selectedPeriod === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const sessionsRef = collection(firestore, 'range_sessions');
      const q = query(
        sessionsRef,
        where('uid', '==', user.uid),
        where('date', '>=', startDate),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sessionsData: RangeSession[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          drillType: data.drillType,
          date: data.date.toDate(),
          scores: data.scores || [],
          feedback: data.feedback || [],
          avgScore: data.avgScore || 0,
          totalShots: data.totalShots || 0,
          usedHardware: data.usedHardware || false,
        });
      });

      setSessions(sessionsData);

      await analytics.track('range_report_viewed', {
        userId: user.uid,
        period: selectedPeriod,
        sessionCount: sessionsData.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to load sessions:', error);
      Alert.alert('Error', 'Failed to load range sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (sessions.length === 0) return null;

    const totalSessions = sessions.length;
    const totalShots = sessions.reduce((sum, session) => sum + session.totalShots, 0);
    const avgScore = sessions.reduce((sum, session) => sum + session.avgScore, 0) / totalSessions;
    const bestSession = sessions.reduce((best, current) => 
      current.avgScore > best.avgScore ? current : best
    );

    return {
      totalSessions,
      totalShots,
      avgScore: Math.round(avgScore),
      bestDrill: bestSession.drillType,
      bestScore: Math.round(bestSession.avgScore)
    };
  };

  const getChartData = () => {
    const recentSessions = sessions.slice(0, 10).reverse();
    
    return {
      labels: recentSessions.map(s => s.drillType.substring(0, 3).toUpperCase()),
      datasets: [{
        data: recentSessions.map(s => s.avgScore),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2
      }]
    };
  };

  const exportReport = async () => {
    try {
      // This would generate a PDF or image of the report
      Alert.alert('Export', 'Report export feature coming soon!');
      
      await analytics.track('range_report_exported', {
        userId: user?.uid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const shareReport = async () => {
    try {
      // This would share the report via native sharing
      Alert.alert('Share', 'Share feature coming soon!');
      
      await analytics.track('range_report_shared', {
        userId: user?.uid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const stats = getStats();

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Range Report</Text>
        <View className="flex-row space-x-2">
          <Pressable onPress={shareReport} className="bg-zinc-800 rounded-xl p-2">
            <ShareIcon color="white" size={20} />
          </Pressable>
          <Pressable onPress={exportReport} className="bg-zinc-800 rounded-xl p-2">
            <DownloadIcon color="white" size={20} />
          </Pressable>
        </View>
      </View>

      {/* Period Selector */}
      <View className="flex-row bg-zinc-900 rounded-xl p-1 mb-6">
        {['week', 'month', 'year'].map((period) => (
          <Pressable
            key={period}
            onPress={() => setSelectedPeriod(period)}
            className={`flex-1 py-2 px-4 rounded-lg ${
              selectedPeriod === period ? 'bg-blue-600' : 'bg-transparent'
            }`}
          >
            <Text className={`text-center font-medium ${
              selectedPeriod === period ? 'text-white' : 'text-zinc-400'
            }`}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">Loading sessions...</Text>
        </View>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <View className="flex-row flex-wrap justify-between mb-6">
            <View className="bg-zinc-900 rounded-xl p-4 mb-4 flex-1 mr-2">
              <Text className="text-zinc-400 text-sm">Total Sessions</Text>
              <Text className="text-white text-2xl font-bold">{stats.totalSessions}</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4 mb-4 flex-1 ml-2">
              <Text className="text-zinc-400 text-sm">Total Shots</Text>
              <Text className="text-white text-2xl font-bold">{stats.totalShots}</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4 mb-4 flex-1 mr-2">
              <Text className="text-zinc-400 text-sm">Avg Score</Text>
              <Text className="text-white text-2xl font-bold">{stats.avgScore}</Text>
            </View>
            <View className="bg-zinc-900 rounded-xl p-4 mb-4 flex-1 ml-2">
              <Text className="text-zinc-400 text-sm">Best Drill</Text>
              <Text className="text-white text-lg font-bold">{stats.bestDrill}</Text>
            </View>
          </View>

          {/* Chart */}
          {sessions.length > 0 && (
            <View className="bg-zinc-900 rounded-xl p-4 mb-6">
              <Text className="text-white text-lg font-semibold mb-4">Progress Chart</Text>
              <LineChart
                data={getChartData()}
                width={300}
                height={200}
                chartConfig={{
                  backgroundColor: '#18181b',
                  backgroundGradientFrom: '#18181b',
                  backgroundGradientTo: '#18181b',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          {/* Recent Sessions */}
          <Text className="text-white text-lg font-semibold mb-4">Recent Sessions</Text>
          <FlatList
            data={sessions.slice(0, 10)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-zinc-900 rounded-xl p-4 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white font-semibold">{item.drillType}</Text>
                  <Text className="text-zinc-400 text-sm">
                    {item.date.toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-zinc-300">
                    {item.totalShots} shots • Avg: {Math.round(item.avgScore)}
                  </Text>
                  {item.usedHardware && (
                    <View className="bg-blue-600 rounded-full px-2 py-1">
                      <Text className="text-white text-xs">Hardware</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <View className="flex-1 justify-center items-center">
          <CalendarIcon color="#6b7280" size={48} />
          <Text className="text-zinc-400 text-lg mt-4">No sessions found</Text>
          <Text className="text-zinc-500 text-center mt-2">
            Complete your first drill to see your progress
          </Text>
        </View>
      )}
    </View>
  );
} 