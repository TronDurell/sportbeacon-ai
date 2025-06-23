import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
import RewardCoachStreak from './RewardCoachStreak';
import { fetchCoachingRecommendations, playAudioFeedback } from '../services/aiAssistant';

interface PlayerCoachPanelNativeProps {
  playerId: string;
  sport: string;
  walletAddress: string;
  signature: string;
  message: string;
  navigation: any;
}

const PlayerCoachPanelNative: React.FC<PlayerCoachPanelNativeProps> = ({ playerId, sport, walletAddress, signature, message, navigation }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchCoachingRecommendations({ playerId, sport, walletAddress, signature, message })
      .then(setData)
      .catch((e) => setError(e.message || 'Error fetching recommendations'))
      .finally(() => setLoading(false));
  }, [playerId, sport, walletAddress, signature, message]);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;
  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;
  if (!data) return null;

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>AI Coaching Insights</Text>
      <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Top Weaknesses</Text>
      {data.skill_plans?.map((plan: any) => (
        <Text key={plan.skill}>{plan.skill}: {plan.current_score} → {plan.target_score} (Est. {plan.estimated_time} days)</Text>
      ))}
      <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Drill Suggestions</Text>
      {data.training_plan?.drill_recommendations?.map((drill: any, i: number) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Text>{drill.name} ({drill.difficulty})</Text>
          <Text>{drill.description}</Text>
          <Button title="Audio Feedback" onPress={() => playAudioFeedback(drill)} />
        </View>
      ))}
      <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Recent Errors & Suggestions</Text>
      {data.past_errors?.map((err: any, i: number) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <Text>{err.error_type} ({err.frequency}): {err.primary_suggestion}</Text>
          <Button title="Audio" onPress={() => playAudioFeedback(err)} />
        </View>
      ))}
      <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Highlight Replays</Text>
      {data.highlight_recommendations?.map((rec: any, i: number) => (
        <Text key={i}>{rec.type === 'improvement' ? '🔻' : '⭐'} {rec.description}</Text>
      ))}
      <RewardCoachStreak rewardProgression={data.reward_progression} streak={data.engagement_streak} />
      <Text style={{ marginTop: 12, fontWeight: 'bold' }}>Badge Progression</Text>
      <Text>Current Streak: {data.engagement_streak} days</Text>
      <Text>Reward: {data.reward_progression?.total_reward} BEACON</Text>
    </ScrollView>
  );
};

export default PlayerCoachPanelNative; 