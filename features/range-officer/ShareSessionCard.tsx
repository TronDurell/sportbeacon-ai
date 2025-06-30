import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert, Share } from 'react-native';
import { ShareIcon, DownloadIcon, CameraIcon, TargetIcon } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import { firestore } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../frontend/hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

interface RangeSession {
  id: string;
  drillType: string;
  date: Date;
  avgScore: number;
  totalShots: number;
  scores: number[];
  feedback: string[];
  usedHardware: boolean;
  shotDetails?: ShotDetail[];
}

interface ShotDetail {
  score: number;
  modelConfidence: number;
  muzzleDrift: number;
  userCorrected: boolean;
}

interface ShareSessionCardProps {
  session: RangeSession;
  onShare?: () => void;
  onDownload?: () => void;
}

export default function ShareSessionCard({ session, onShare, onDownload }: ShareSessionCardProps) {
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const getDrillDisplayName = (drillType: string): string => {
    const drillNames: { [key: string]: string } = {
      'draw': 'Draw & Fire 1',
      'pair': 'Controlled Pair',
      'circle': '5x5 Precision',
      'reload': 'Reload & Re-engage',
      'precision': 'Precision Drill',
      'speed': 'Speed Drill',
      'custom': 'Custom Drill'
    };
    return drillNames[drillType] || drillType;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 95) return '#10b981'; // emerald
    if (score >= 90) return '#3b82f6'; // blue
    if (score >= 85) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 95) return 'EXCELLENT';
    if (score >= 90) return 'GREAT';
    if (score >= 85) return 'GOOD';
    if (score >= 80) return 'FAIR';
    return 'NEEDS WORK';
  };

  const generateFeedbackSummary = (): string => {
    if (session.feedback.length === 0) return 'No feedback available';
    
    const positiveFeedback = session.feedback.filter(f => 
      f.toLowerCase().includes('good') || 
      f.toLowerCase().includes('excellent') || 
      f.toLowerCase().includes('great')
    );
    
    const improvementFeedback = session.feedback.filter(f => 
      f.toLowerCase().includes('improve') || 
      f.toLowerCase().includes('work on') || 
      f.toLowerCase().includes('focus')
    );
    
    if (positiveFeedback.length > 0 && improvementFeedback.length > 0) {
      return `${positiveFeedback[0]}. ${improvementFeedback[0]}`;
    } else if (positiveFeedback.length > 0) {
      return positiveFeedback[0];
    } else if (improvementFeedback.length > 0) {
      return improvementFeedback[0];
    }
    
    return session.feedback[0] || 'Session completed';
  };

  const captureCard = async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        return uri;
      }
      return null;
    } catch (error) {
      console.error('Failed to capture card:', error);
      return null;
    }
  };

  const downloadCard = async () => {
    try {
      setDownloading(true);
      
      const uri = await captureCard();
      if (!uri) {
        Alert.alert('Error', 'Failed to generate image');
        return;
      }

      // Save to device gallery
      const { MediaLibrary } = await import('expo-media-library');
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('SportBeaconAI', asset, false);

      Alert.alert('Success', 'Card saved to gallery!');
      
      await analytics.track('session_card_downloaded', {
        userId: user?.uid,
        sessionId: session.id,
        drillType: session.drillType,
        avgScore: session.avgScore,
        timestamp: new Date().toISOString()
      });

      onDownload?.();
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'Failed to save card to gallery');
    } finally {
      setDownloading(false);
    }
  };

  const shareToTimeline = async () => {
    try {
      setSharing(true);
      
      const uri = await captureCard();
      if (!uri) {
        Alert.alert('Error', 'Failed to generate image');
        return;
      }

      // Create post data
      const postData = {
        uid: user?.uid,
        type: 'range_session',
        content: `Just completed ${getDrillDisplayName(session.drillType)} with a score of ${Math.round(session.avgScore)}/100! 🎯`,
        media: [uri],
        metadata: {
          sessionId: session.id,
          drillType: session.drillType,
          avgScore: session.avgScore,
          totalShots: session.totalShots,
          usedHardware: session.usedHardware
        },
        createdAt: new Date(),
        likes: 0,
        comments: 0
      };

      // Add to posts collection
      const postsRef = collection(firestore, 'posts');
      await addDoc(postsRef, postData);

      Alert.alert('Success', 'Session shared to timeline!');
      
      await analytics.track('session_shared_to_timeline', {
        userId: user?.uid,
        sessionId: session.id,
        drillType: session.drillType,
        avgScore: session.avgScore,
        timestamp: new Date().toISOString()
      });

      onShare?.();
    } catch (error) {
      console.error('Share failed:', error);
      Alert.alert('Error', 'Failed to share to timeline');
    } finally {
      setSharing(false);
    }
  };

  const shareNative = async () => {
    try {
      const uri = await captureCard();
      if (!uri) {
        Alert.alert('Error', 'Failed to generate image');
        return;
      }

      await Share.share({
        url: uri,
        title: `My ${getDrillDisplayName(session.drillType)} Session`,
        message: `Just completed ${getDrillDisplayName(session.drillType)} with a score of ${Math.round(session.avgScore)}/100!`
      });

      await analytics.track('session_shared_native', {
        userId: user?.uid,
        sessionId: session.id,
        drillType: session.drillType,
        avgScore: session.avgScore,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Native share failed:', error);
      Alert.alert('Error', 'Failed to share');
    }
  };

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-bold">Share Session</Text>
        <View className="flex-row space-x-2">
          <Pressable onPress={shareNative} className="bg-zinc-800 rounded-xl p-2">
            <ShareIcon color="white" size={20} />
          </Pressable>
        </View>
      </View>

      {/* Session Card Preview */}
      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'jpg',
          quality: 0.9,
          width: 350,
          height: 500
        }}
        className="items-center mb-6"
      >
        <View className="bg-gradient-to-b from-zinc-900 to-zinc-800 rounded-3xl p-6 w-[350px] h-[500px]">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="bg-emerald-600 rounded-full p-3 mb-3">
              <TargetIcon color="white" size={32} />
            </View>
            <Text className="text-white text-xl font-bold">SportBeaconAI</Text>
            <Text className="text-zinc-400 text-sm">Range Session</Text>
          </View>

          {/* Drill Info */}
          <View className="bg-zinc-800 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-1">
              {getDrillDisplayName(session.drillType)}
            </Text>
            <Text className="text-zinc-400 text-sm">
              {session.date.toLocaleDateString()} • {session.totalShots} shots
            </Text>
            {session.usedHardware && (
              <View className="bg-blue-600 rounded-full px-2 py-1 self-start mt-2">
                <Text className="text-white text-xs">Hardware Enhanced</Text>
              </View>
            )}
          </View>

          {/* Score Display */}
          <View className="items-center mb-6">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: getScoreColor(session.avgScore) + '20' }}
            >
              <Text 
                className="text-3xl font-bold"
                style={{ color: getScoreColor(session.avgScore) }}
              >
                {Math.round(session.avgScore)}
              </Text>
            </View>
            <Text 
              className="text-lg font-semibold mb-1"
              style={{ color: getScoreColor(session.avgScore) }}
            >
              {getScoreLabel(session.avgScore)}
            </Text>
            <Text className="text-zinc-400 text-sm">Average Score</Text>
          </View>

          {/* Feedback Summary */}
          <View className="bg-zinc-800 rounded-2xl p-4 mb-4">
            <Text className="text-zinc-300 text-sm font-medium mb-2">Session Feedback</Text>
            <Text className="text-zinc-400 text-sm leading-5">
              {generateFeedbackSummary()}
            </Text>
          </View>

          {/* Shot Details */}
          {session.shotDetails && session.shotDetails.length > 0 && (
            <View className="bg-zinc-800 rounded-2xl p-4 mb-4">
              <Text className="text-zinc-300 text-sm font-medium mb-2">Shot Analysis</Text>
              <View className="flex-row justify-between">
                <Text className="text-zinc-400 text-xs">Best Shot: {Math.max(...session.shotDetails.map(s => s.score))}</Text>
                <Text className="text-zinc-400 text-xs">Avg Drift: {(session.shotDetails.reduce((sum, s) => sum + s.muzzleDrift, 0) / session.shotDetails.length).toFixed(1)}°</Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View className="items-center">
            <Text className="text-zinc-500 text-xs">Generated by SportBeaconAI</Text>
            <Text className="text-zinc-500 text-xs">AI-Powered Training</Text>
          </View>
        </View>
      </ViewShot>

      {/* Action Buttons */}
      <View className="space-y-4">
        <Pressable
          onPress={shareToTimeline}
          disabled={sharing}
          className={`flex-row items-center justify-center bg-emerald-600 rounded-xl py-4 ${
            sharing ? 'opacity-50' : ''
          }`}
        >
          <ShareIcon color="white" size={20} />
          <Text className="text-white font-semibold text-lg ml-2">
            {sharing ? 'Sharing...' : 'Share to Timeline'}
          </Text>
        </Pressable>

        <Pressable
          onPress={downloadCard}
          disabled={downloading}
          className={`flex-row items-center justify-center bg-blue-600 rounded-xl py-4 ${
            downloading ? 'opacity-50' : ''
          }`}
        >
          <DownloadIcon color="white" size={20} />
          <Text className="text-white font-semibold text-lg ml-2">
            {downloading ? 'Saving...' : 'Save to Gallery'}
          </Text>
        </Pressable>

        <Pressable
          onPress={shareNative}
          className="flex-row items-center justify-center bg-zinc-700 rounded-xl py-4"
        >
          <ShareIcon color="white" size={20} />
          <Text className="text-white font-semibold text-lg ml-2">
            Share via...
          </Text>
        </Pressable>
      </View>
    </View>
  );
} 