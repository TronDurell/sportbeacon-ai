import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Image,
  Animated,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { getSportRule, getSportIcon, getSportColorScheme, formatSportStat } from '../config/sportRules';
import { playAudioFeedback } from '../services/audio_coaching';

const { width, height } = Dimensions.get('window');

interface TeamMember {
  player_id: string;
  player_name: string;
  player_avatar?: string;
  sport: string;
  rank: number;
  stats: {
    beacon_earned: number;
    drills_completed: number;
    current_streak: number;
    avg_score: number;
    [key: string]: any;
  };
  multipliers: {
    total_multiplier: number;
  };
  achievements: {
    total_achievements: number;
    recent_achievements: string[];
  };
  performance_trend: 'up' | 'down' | 'stable';
  last_active: string;
}

interface TeamData {
  team_id: string;
  team_name: string;
  members: TeamMember[];
  team_stats: {
    total_beacon_earned: number;
    total_drills_completed: number;
    avg_team_score: number;
    team_activity_score: number;
  };
  leaderboards: {
    beacon_earned: TeamMember[];
    drills_completed: TeamMember[];
    engagement_streaks: TeamMember[];
  };
  milestones: any[];
  social_data: any;
}

const TeamCoachPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'beacon' | 'drills' | 'streak' | 'score'>('beacon');
  const [showVoiceFeedback, setShowVoiceFeedback] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Fetch team data
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/api/team/coachboard', {
        params: {
          wallet_address: user?.wallet_address,
          signature: 'mock-signature',
          message: 'mock-message',
          timeframe: 'week',
          sort: sortBy,
        },
      });

      setTeamData(response.data);
      setError(null);
    } catch (err) {
      console.error('Team data fetch error:', err);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, [user, sortBy]);

  // Load initial data
  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Animate fade in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTeamData();
    setRefreshing(false);
  }, [fetchTeamData]);

  // Handle voice feedback
  const handleVoiceFeedback = async () => {
    if (!teamData) return;

    try {
      setVoicePlaying(true);
      setShowVoiceFeedback(true);

      // Generate motivational message based on team performance
      const message = generateMotivationalMessage(teamData);
      
      // Play audio feedback
      await playAudioFeedback(message, 'coach');
      
      // Hide feedback after delay
      setTimeout(() => {
        setShowVoiceFeedback(false);
        setVoicePlaying(false);
      }, 3000);
    } catch (err) {
      console.error('Voice feedback error:', err);
      Alert.alert('Error', 'Unable to play voice feedback');
      setVoicePlaying(false);
    }
  };

  // Generate motivational message
  const generateMotivationalMessage = (data: TeamData): string => {
    const stats = data.team_stats;
    const topPerformer = data.leaderboards.beacon_earned[0];
    
    if (stats.team_activity_score > 80) {
      return `Excellent work team! You've earned ${stats.total_beacon_earned} BEACON this week. ${topPerformer?.player_name} is leading with ${topPerformer?.stats.beacon_earned} BEACON. Keep up this amazing momentum!`;
    } else if (stats.team_activity_score > 60) {
      return `Good progress team! You've completed ${stats.total_drills_completed} drills. Let's push for even better results next week. You've got this!`;
    } else {
      return `Team, we have room to grow. Let's increase our training intensity and work together to improve our performance. Every step forward counts!`;
    }
  };

  // Render team member card
  const renderTeamMember = ({ item, index }: { item: TeamMember; index: number }) => {
    const sportRule = getSportRule(item.sport);
    const sportColors = getSportColorScheme(item.sport);
    const isCurrentUser = item.player_id === user?.wallet_address;

    return (
      <Animated.View
        style={[
          styles.memberCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }
        ]}
      >
        <LinearGradient
          colors={isCurrentUser ? ['#4a90e2', '#357abd'] : ['#ffffff', '#f8f9fa']}
          style={styles.memberCardGradient}
        >
          {/* Rank and Avatar */}
          <View style={styles.memberHeader}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankText}>{item.rank}</Text>
            </View>
            
            <View style={styles.avatarContainer}>
              {item.player_avatar ? (
                <Image source={{ uri: item.player_avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>{item.player_name.charAt(0)}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.memberInfo}>
              <Text style={[styles.memberName, isCurrentUser && styles.currentUserText]}>
                {item.player_name}
                {isCurrentUser && ' (You)'}
              </Text>
              <View style={styles.sportContainer}>
                <Text style={styles.sportIcon}>{sportRule.icon}</Text>
                <Text style={styles.sportName}>{sportRule.displayName}</Text>
              </View>
            </View>
            
            {/* Performance trend indicator */}
            <View style={styles.trendContainer}>
              {item.performance_trend === 'up' && (
                <MaterialIcons name="trending-up" size={20} color="#4caf50" />
              )}
              {item.performance_trend === 'down' && (
                <MaterialIcons name="trending-down" size={20} color="#f44336" />
              )}
              {item.performance_trend === 'stable' && (
                <MaterialIcons name="trending-flat" size={20} color="#ff9800" />
              )}
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.stats.beacon_earned.toLocaleString()}</Text>
              <Text style={styles.statLabel}>BEACON</Text>
              {item.multipliers.total_multiplier > 1 && (
                <View style={styles.multiplierBadge}>
                  <Text style={styles.multiplierText}>{item.multipliers.total_multiplier}x</Text>
                </View>
              )}
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.stats.drills_completed}</Text>
              <Text style={styles.statLabel}>Drills</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.stats.current_streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
              {item.stats.current_streak > 5 && (
                <MaterialIcons name="whatshot" size={16} color="#ff9800" />
              )}
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.stats.avg_score.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>

          {/* Sport-specific stats */}
          <View style={styles.sportStatsContainer}>
            {sportRule.primaryStats.slice(0, 3).map((stat, statIndex) => (
              <View key={stat} style={styles.sportStatItem}>
                <Text style={styles.sportStatLabel}>{stat.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.sportStatValue}>
                  {formatSportStat(stat, item.stats[stat] || 0, item.sport)}
                </Text>
              </View>
            ))}
          </View>

          {/* Achievements */}
          {item.achievements.recent_achievements.length > 0 && (
            <View style={styles.achievementsContainer}>
              <Text style={styles.achievementsLabel}>Recent Achievements:</Text>
              <View style={styles.achievementsList}>
                {item.achievements.recent_achievements.slice(0, 2).map((achievement, index) => (
                  <View key={index} style={styles.achievementBadge}>
                    <MaterialIcons name="emoji-events" size={14} color="#ffd700" />
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    if (!teamData) return null;

    switch (activeTab) {
      case 0: // Leaderboard
        return (
          <FlatList
            data={teamData.leaderboards.beacon_earned}
            renderItem={renderTeamMember}
            keyExtractor={(item) => item.player_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
      
      case 1: // Team Stats
        return (
          <ScrollView 
            style={styles.tabContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.statsOverview}>
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{teamData.team_stats.total_beacon_earned.toLocaleString()}</Text>
                <Text style={styles.overviewLabel}>Total BEACON Earned</Text>
              </View>
              
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{teamData.team_stats.total_drills_completed}</Text>
                <Text style={styles.overviewLabel}>Drills Completed</Text>
              </View>
              
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{teamData.team_stats.avg_team_score.toFixed(1)}</Text>
                <Text style={styles.overviewLabel}>Avg Team Score</Text>
              </View>
              
              <View style={styles.overviewCard}>
                <Text style={styles.overviewValue}>{teamData.team_stats.team_activity_score.toFixed(1)}</Text>
                <Text style={styles.overviewLabel}>Activity Score</Text>
              </View>
            </View>

            {/* Milestones */}
            {teamData.milestones.length > 0 && (
              <View style={styles.milestonesContainer}>
                <Text style={styles.sectionTitle}>Recent Milestones</Text>
                {teamData.milestones.map((milestone, index) => (
                  <View key={index} style={styles.milestoneItem}>
                    <MaterialIcons name="emoji-events" size={20} color="#ffd700" />
                    <Text style={styles.milestoneText}>{milestone.title}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        );
      
      case 2: // Coach Insights
        return (
          <ScrollView 
            style={styles.tabContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Team Performance Insights</Text>
              
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>🏆 Top Performer</Text>
                <Text style={styles.insightText}>
                  {teamData.leaderboards.beacon_earned[0]?.player_name} is leading the team with {teamData.leaderboards.beacon_earned[0]?.stats.beacon_earned} BEACON earned.
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>🔥 Streak Leader</Text>
                <Text style={styles.insightText}>
                  {teamData.leaderboards.engagement_streaks[0]?.player_name} has the longest streak at {teamData.leaderboards.engagement_streaks[0]?.stats.current_streak} days.
                </Text>
              </View>
              
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>📊 Team Activity</Text>
                <Text style={styles.insightText}>
                  The team has completed {teamData.team_stats.total_drills_completed} drills with an average score of {teamData.team_stats.avg_team_score.toFixed(1)}.
                </Text>
              </View>
            </View>
          </ScrollView>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={styles.loadingText}>Loading team data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTeamData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#4a90e2', '#357abd']} style={styles.header}>
        <Text style={styles.headerTitle}>Team Coach Panel</Text>
        <Text style={styles.headerSubtitle}>
          {teamData?.team_name || 'Loading team...'}
        </Text>
        
        {/* Voice feedback button */}
        <TouchableOpacity 
          style={[styles.voiceButton, voicePlaying && styles.voiceButtonActive]}
          onPress={handleVoiceFeedback}
          disabled={voicePlaying}
        >
          <MaterialIcons 
            name={voicePlaying ? "volume-up" : "record-voice-over"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 0 && styles.activeTab]}
          onPress={() => setActiveTab(0)}
        >
          <MaterialIcons name="leaderboard" size={20} color={activeTab === 0 ? "#4a90e2" : "#666"} />
          <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>Leaderboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 1 && styles.activeTab]}
          onPress={() => setActiveTab(1)}
        >
          <MaterialIcons name="analytics" size={20} color={activeTab === 1 ? "#4a90e2" : "#666"} />
          <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>Team Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 2 && styles.activeTab]}
          onPress={() => setActiveTab(2)}
        >
          <MaterialIcons name="psychology" size={20} color={activeTab === 2 ? "#4a90e2" : "#666"} />
          <Text style={[styles.tabText, activeTab === 2 && styles.activeTabText]}>Insights</Text>
        </TouchableOpacity>
      </View>

      {/* Sort options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {['beacon', 'drills', 'streak', 'score'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[styles.sortButton, sortBy === sort && styles.activeSortButton]}
            onPress={() => setSortBy(sort as any)}
          >
            <Text style={[styles.sortButtonText, sortBy === sort && styles.activeSortButtonText]}>
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Voice feedback overlay */}
      {showVoiceFeedback && (
        <Animated.View style={styles.voiceOverlay}>
          <View style={styles.voiceFeedback}>
            <MaterialIcons name="volume-up" size={32} color="#4a90e2" />
            <Text style={styles.voiceFeedbackText}>Playing team feedback...</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#4a90e2',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  memberCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  memberCardGradient: {
    borderRadius: 12,
    padding: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentUserText: {
    color: 'white',
  },
  sportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sportIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  sportName: {
    fontSize: 12,
    color: '#666',
  },
  trendContainer: {
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  multiplierBadge: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  multiplierText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  sportStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sportStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  sportStatLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  sportStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  achievementsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  achievementsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 10,
    color: '#856404',
    marginLeft: 4,
  },
  statsOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  overviewCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  milestonesContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  insightsContainer: {
    gap: 16,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  voiceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceFeedback: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  voiceFeedbackText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
  },
});

export default TeamCoachPanel; 