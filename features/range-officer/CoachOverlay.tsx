import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { MicIcon, Volume2Icon, VolumeXIcon } from 'lucide-react-native';
import * as Speech from 'expo-speech';

interface CoachOverlayProps {
  score: number;
  feedback: string;
  isVisible: boolean;
  onDismiss?: () => void;
}

const feedbackMessages = {
  excellent: [
    'Perfect form!',
    'Excellent control',
    'Great shot!',
    'Outstanding stability'
  ],
  good: [
    'Good form',
    'Minor adjustment needed',
    'Keep it up',
    'Solid technique'
  ],
  needsWork: [
    'Focus on breathing',
    'Check your grip',
    'Slow down',
    'Review fundamentals'
  ],
  poor: [
    'Review basics',
    'Practice dry fire',
    'Work on stance',
    'Seek instruction'
  ]
};

export default function CoachOverlay({ 
  score, 
  feedback, 
  isVisible, 
  onDismiss 
}: CoachOverlayProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentFeedback, setCurrentFeedback] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible) {
      showOverlay();
      if (voiceEnabled) {
        speakFeedback();
      }
    } else {
      hideOverlay();
    }
  }, [isVisible, score, feedback]);

  const showOverlay = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideOverlay = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const speakFeedback = () => {
    const message = getFeedbackMessage(score);
    Speech.speak(message, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const getFeedbackMessage = (score: number): string => {
    if (score >= 90) {
      return feedbackMessages.excellent[Math.floor(Math.random() * feedbackMessages.excellent.length)];
    } else if (score >= 80) {
      return feedbackMessages.good[Math.floor(Math.random() * feedbackMessages.good.length)];
    } else if (score >= 70) {
      return feedbackMessages.needsWork[Math.floor(Math.random() * feedbackMessages.needsWork.length)];
    } else {
      return feedbackMessages.poor[Math.floor(Math.random() * feedbackMessages.poor.length)];
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#10b981'; // emerald
    if (score >= 80) return '#3b82f6'; // blue
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 80) return 'GOOD';
    if (score >= 70) return 'NEEDS WORK';
    return 'POOR';
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="absolute inset-0 bg-black/50 justify-center items-center z-50"
    >
      <View className="bg-zinc-900 rounded-3xl p-6 mx-4 max-w-sm w-full">
        <View className="items-center mb-4">
          <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: getScoreColor(score) + '20' }}
          >
            <Text 
              className="text-3xl font-bold"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </Text>
          </View>
          
          <Text 
            className="text-lg font-semibold mb-1"
            style={{ color: getScoreColor(score) }}
          >
            {getScoreLabel(score)}
          </Text>
          
          <Text className="text-zinc-300 text-center text-sm">
            {feedback}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Pressable
            onPress={() => setVoiceEnabled(!voiceEnabled)}
            className="flex-row items-center bg-zinc-800 rounded-xl px-4 py-2"
          >
            {voiceEnabled ? (
              <Volume2Icon color="white" size={20} />
            ) : (
              <VolumeXIcon color="white" size={20} />
            )}
            <Text className="text-white ml-2 text-sm">
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </Text>
          </Pressable>

          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              className="bg-zinc-700 rounded-xl px-4 py-2"
            >
              <Text className="text-white text-sm">Dismiss</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
} 