import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { ThumbsUpIcon, ThumbsDownIcon, MessageSquareIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

interface AIFeedback {
  id: string;
  drillId: string;
  feedbackType: string;
  feedbackMessage: string;
  accuracy: 'accurate' | 'inaccurate' | null;
  timestamp: Date;
  sessionId?: string;
  userNotes?: string;
}

interface FeedbackStats {
  totalFeedback: number;
  accurateCount: number;
  inaccurateCount: number;
  accuracyRate: number;
  mostInaccurateTypes: string[];
}

export default function FeedbackCollector() {
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState<AIFeedback[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<AIFeedback | null>(null);
  const [userNotes, setUserNotes] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadFeedbackHistory();
      loadFeedbackStats();
    }
  }, [user]);

  const loadFeedbackHistory = async () => {
    try {
      setLoading(true);
      const feedbackRef = collection(firestore, 'ai_feedback');
      const q = query(
        feedbackRef,
        where('uid', '==', user!.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const feedback: AIFeedback[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        feedback.push({
          id: doc.id,
          drillId: data.drillId,
          feedbackType: data.feedbackType,
          feedbackMessage: data.feedbackMessage,
          accuracy: data.accuracy || null,
          timestamp: data.timestamp.toDate(),
          sessionId: data.sessionId,
          userNotes: data.userNotes
        });
      });

      setFeedbackHistory(feedback);
    } catch (error) {
      console.error('Failed to load feedback history:', error);
      Alert.alert('Error', 'Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackStats = async () => {
    try {
      const feedbackRef = collection(firestore, 'ai_feedback');
      const q = query(
        feedbackRef,
        where('uid', '==', user!.uid),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );

      const querySnapshot = await getDocs(q);
      const feedback: AIFeedback[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.accuracy) {
          feedback.push({
            id: doc.id,
            drillId: data.drillId,
            feedbackType: data.feedbackType,
            feedbackMessage: data.feedbackMessage,
            accuracy: data.accuracy,
            timestamp: data.timestamp.toDate()
          });
        }
      });

      const stats = calculateFeedbackStats(feedback);
      setFeedbackStats(stats);
    } catch (error) {
      console.error('Failed to load feedback stats:', error);
    }
  };

  const calculateFeedbackStats = (feedback: AIFeedback[]): FeedbackStats => {
    const totalFeedback = feedback.length;
    const accurateCount = feedback.filter(f => f.accuracy === 'accurate').length;
    const inaccurateCount = feedback.filter(f => f.accuracy === 'inaccurate').length;
    const accuracyRate = totalFeedback > 0 ? (accurateCount / totalFeedback) * 100 : 0;

    // Find most inaccurate feedback types
    const typeAccuracy: { [key: string]: { accurate: number; inaccurate: number } } = {};
    
    feedback.forEach(f => {
      if (!typeAccuracy[f.feedbackType]) {
        typeAccuracy[f.feedbackType] = { accurate: 0, inaccurate: 0 };
      }
      
      if (f.accuracy === 'accurate') {
        typeAccuracy[f.feedbackType].accurate++;
      } else if (f.accuracy === 'inaccurate') {
        typeAccuracy[f.feedbackType].inaccurate++;
      }
    });

    const mostInaccurateTypes = Object.entries(typeAccuracy)
      .filter(([_, counts]) => counts.inaccurate > 0)
      .sort(([_, a], [__, b]) => (b.inaccurate / (b.accurate + b.inaccurate)) - (a.inaccurate / (a.accurate + a.inaccurate)))
      .slice(0, 5)
      .map(([type, _]) => type);

    return {
      totalFeedback,
      accurateCount,
      inaccurateCount,
      accuracyRate: Math.round(accuracyRate * 100) / 100,
      mostInaccurateTypes
    };
  };

  const submitFeedbackAccuracy = async (feedbackId: string, accuracy: 'accurate' | 'inaccurate') => {
    try {
      const feedbackRef = doc(firestore, 'ai_feedback', feedbackId);
      await updateDoc(feedbackRef, {
        accuracy,
        userNotes: userNotes.trim() || null,
        updatedAt: new Date()
      });

      // Track analytics
      await analytics.track('ai_feedback_rated', {
        userId: user!.uid,
        feedbackId,
        accuracy,
        feedbackType: selectedFeedback?.feedbackType,
        hasNotes: !!userNotes.trim(),
        timestamp: new Date().toISOString()
      });

      Alert.alert('Success', 'Thank you for your feedback!');
      
      // Refresh data
      loadFeedbackHistory();
      loadFeedbackStats();
      
      // Reset form
      setSelectedFeedback(null);
      setUserNotes('');
      
    } catch (error) {
      console.error('Failed to submit feedback accuracy:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    }
  };

  const getFeedbackTypeIcon = (feedbackType: string) => {
    const icons: { [key: string]: string } = {
      'muzzle_drift': '🎯',
      'trigger_press': '👆',
      'grip': '🤝',
      'stance': '🦵',
      'breathing': '🫁',
      'sight_alignment': '👁️',
      'recoil_control': '💪',
      'timing': '⏱️'
    };
    return icons[feedbackType] || '💬';
  };

  const getAccuracyColor = (accuracy: 'accurate' | 'inaccurate' | null) => {
    switch (accuracy) {
      case 'accurate': return '#10b981';
      case 'inaccurate': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getAccuracyText = (accuracy: 'accurate' | 'inaccurate' | null) => {
    switch (accuracy) {
      case 'accurate': return 'Accurate';
      case 'inaccurate': return 'Inaccurate';
      default: return 'Not Rated';
    }
  };

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">AI Feedback</Text>
        <MessageSquareIcon color="white" size={24} />
      </View>

      {/* Feedback Stats */}
      {feedbackStats && (
        <View className="bg-zinc-900 rounded-2xl p-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Feedback Analytics</Text>
          
          <View className="flex-row justify-between mb-3">
            <View className="items-center">
              <Text className="text-white text-2xl font-bold">{feedbackStats.totalFeedback}</Text>
              <Text className="text-zinc-400 text-sm">Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-emerald-500 text-2xl font-bold">{feedbackStats.accurateCount}</Text>
              <Text className="text-zinc-400 text-sm">Accurate</Text>
            </View>
            <View className="items-center">
              <Text className="text-red-500 text-2xl font-bold">{feedbackStats.inaccurateCount}</Text>
              <Text className="text-zinc-400 text-sm">Inaccurate</Text>
            </View>
            <View className="items-center">
              <Text className="text-blue-500 text-2xl font-bold">{feedbackStats.accuracyRate}%</Text>
              <Text className="text-zinc-400 text-sm">Accuracy</Text>
            </View>
          </View>

          {feedbackStats.mostInaccurateTypes.length > 0 && (
            <View className="mt-3">
              <Text className="text-zinc-300 text-sm mb-2">Areas Needing Improvement:</Text>
              <View className="flex-row flex-wrap">
                {feedbackStats.mostInaccurateTypes.map((type, index) => (
                  <View key={index} className="bg-red-600 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-white text-xs">{type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Feedback History */}
      <ScrollView className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-white text-lg">Loading feedback...</Text>
          </View>
        ) : feedbackHistory.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <MessageSquareIcon color="#6b7280" size={48} />
            <Text className="text-zinc-400 text-lg mt-4">No feedback yet</Text>
            <Text className="text-zinc-500 text-center mt-2">
              Complete some drills to see AI feedback here
            </Text>
          </View>
        ) : (
          feedbackHistory.map((feedback) => (
            <View key={feedback.id} className="bg-zinc-900 rounded-2xl p-4 mb-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <Text className="text-2xl mr-3">{getFeedbackTypeIcon(feedback.feedbackType)}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold capitalize">
                      {feedback.feedbackType.replace('_', ' ')}
                    </Text>
                    <Text className="text-zinc-400 text-sm">
                      {feedback.timestamp.toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View 
                  className="rounded-full px-3 py-1"
                  style={{ backgroundColor: getAccuracyColor(feedback.accuracy) + '20' }}
                >
                  <Text 
                    className="text-xs font-medium"
                    style={{ color: getAccuracyColor(feedback.accuracy) }}
                  >
                    {getAccuracyText(feedback.accuracy)}
                  </Text>
                </View>
              </View>

              <Text className="text-zinc-300 mb-3">{feedback.feedbackMessage}</Text>

              {feedback.userNotes && (
                <View className="bg-zinc-800 rounded-xl p-3 mb-3">
                  <Text className="text-zinc-400 text-sm mb-1">Your Notes:</Text>
                  <Text className="text-zinc-300 text-sm">{feedback.userNotes}</Text>
                </View>
              )}

              {!feedback.accuracy && (
                <View className="flex-row space-x-3">
                  <Pressable
                    onPress={() => setSelectedFeedback(feedback)}
                    className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
                  >
                    <ThumbsUpIcon color="white" size={20} />
                    <Text className="text-white font-semibold ml-2">Accurate</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedFeedback(feedback)}
                    className="flex-1 bg-red-600 rounded-xl py-3 items-center"
                  >
                    <ThumbsDownIcon color="white" size={20} />
                    <Text className="text-white font-semibold ml-2">Inaccurate</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Feedback Modal */}
      {selectedFeedback && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center px-4">
          <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-4">
              Rate AI Feedback
            </Text>
            
            <Text className="text-zinc-300 mb-4">
              "{selectedFeedback.feedbackMessage}"
            </Text>

            <Text className="text-zinc-400 text-sm mb-2">Additional Notes (Optional):</Text>
            <TextInput
              value={userNotes}
              onChangeText={setUserNotes}
              placeholder="Add any additional context..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700 mb-4"
            />

            <View className="flex-row space-x-3">
              <Pressable
                onPress={() => submitFeedbackAccuracy(selectedFeedback.id, 'accurate')}
                className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
              >
                <ThumbsUpIcon color="white" size={20} />
                <Text className="text-white font-semibold ml-2">Accurate</Text>
              </Pressable>
              <Pressable
                onPress={() => submitFeedbackAccuracy(selectedFeedback.id, 'inaccurate')}
                className="flex-1 bg-red-600 rounded-xl py-3 items-center"
              >
                <ThumbsDownIcon color="white" size={20} />
                <Text className="text-white font-semibold ml-2">Inaccurate</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                setSelectedFeedback(null);
                setUserNotes('');
              }}
              className="mt-3 bg-zinc-700 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
} 