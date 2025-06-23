import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayerProfile, DrillDetail } from '../types';
import { DrillCard } from './DrillCard';
import { XPProgressBar } from './XPProgressBar';
import { BadgeSystem } from './BadgeSystem';
import { playerAPI } from '../services/api';
import { levelSystem } from '../services/levelSystem';
import { badgeService } from '../services/badgeService';

const { width, height } = Dimensions.get('window');

interface PlayerDashboardProps {
  playerId: string;
  navigation: any;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ 
  playerId, 
  navigation 
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [newBadgeOpen, setNewBadgeOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; rewards?: any }>();
  const [newBadge, setNewBadge] = useState<any>();
  const queryClient = useQueryClient();
  const fadeAnim = new Animated.Value(0);

  // Queries
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['player', playerId, 'profile'],
    queryFn: () => playerAPI.getProfile(playerId)
  });

  const { data: assignedDrills, isLoading: drillsLoading } = useQuery({
    queryKey: ['player', playerId, 'assigned-drills'],
    queryFn: () => playerAPI.getAssignedDrills(playerId)
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['player', playerId, 'insights'],
    queryFn: () => playerAPI.getInsights(playerId)
  });

  useEffect(() => {
    if (profile) {
      checkLevelAndBadges();
    }
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [profile]);

  const checkLevelAndBadges = async () => {
    if (!profile) return;

    // Check for level up
    const levelUpResult = await levelSystem.checkLevelUp(profile);
    if (levelUpResult.leveledUp) {
      setLevelUpData({
        level: levelUpResult.newLevel!,
        rewards: levelUpResult.rewards
      });
      setLevelUpOpen(true);
      triggerConfetti();
    }

    // Check for new badges
    const badges = await badgeService.checkBadgeProgress(profile);
    const newlyEarnedBadge = badges.find(b => 
      b.earned && !profile.badges?.some(pb => pb.id === b.id && pb.earned)
    );

    if (newlyEarnedBadge) {
      setNewBadge(newlyEarnedBadge);
      setNewBadgeOpen(true);
      await badgeService.playUnlockSound(newlyEarnedBadge);
    }
  };

  const triggerConfetti = () => {
    // Native confetti animation
    Alert.alert('🎉 Level Up!', `Congratulations! You've reached level ${levelUpData?.level}!`);
  };

  if (profileLoading || drillsLoading || insightsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const renderProfileCard = () => (
    <LinearGradient
      colors={['#4A90E2', '#357ABD']}
      style={styles.profileCard}
    >
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile?.avatar }}
          style={styles.avatar}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.playerName}>{profile?.name}</Text>
          <Text style={styles.playerLevel}>Level {profile?.level}</Text>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
        >
          <Icon name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <XPProgressBar
        current={profile?.xp.current || 0}
        next={profile?.xp.nextLevel || 100}
      />

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Icon name="check-circle" size={20} color="#FFF" />
          <Text style={styles.statValue}>{profile?.stats.completedDrills}</Text>
          <Text style={styles.statLabel}>Drills</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="trending-up" size={20} color="#FFF" />
          <Text style={styles.statValue}>{profile?.stats.averagePerformance}%</Text>
          <Text style={styles.statLabel}>Performance</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="star" size={20} color="#FFF" />
          <Text style={styles.statValue}>{profile?.stats.totalPoints}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderDrillsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assigned Drills</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Drills')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {assignedDrills?.slice(0, 3).map((drill: DrillDetail) => (
          <DrillCard
            key={drill.id}
            drill={drill}
            onPress={() => navigation.navigate('DrillDetail', { drillId: drill.id })}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderInsightsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Insights</Text>
      {insights?.map((insight: any, index: number) => (
        <View key={index} style={styles.insightCard}>
          <Icon name="lightbulb" size={20} color="#4A90E2" />
          <Text style={styles.insightText}>{insight.message}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderProfileCard()}
        {renderDrillsSection()}
        {renderInsightsSection()}
        <BadgeSystem badges={profile?.badges || []} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  playerLevel: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  menuButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#E3F2FD',
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
}); 