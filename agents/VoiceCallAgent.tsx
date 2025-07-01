import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Voice } from '@twilio/voice-sdk';
import { Audio } from 'expo-av';
import { doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { analytics } from '../lib/ai/shared/analytics';

interface VoiceCallAgentProps {
  userId: string;
  agentId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: string) => void;
}

interface CallState {
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  callSid?: string;
  error?: string;
}

export const VoiceCallAgent: React.FC<VoiceCallAgentProps> = ({
  userId,
  agentId,
  onCallStart,
  onCallEnd,
  onError
}) => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isConnecting: false,
    isDisconnected: true
  });
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  
  const voiceRef = useRef<Voice | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    initializeVoice();
    return () => {
      cleanupVoice();
    };
  }, []);

  useEffect(() => {
    if (callState.isConnected && !callTimerRef.current) {
      startCallTimer();
    } else if (!callState.isConnected && callTimerRef.current) {
      stopCallTimer();
    }
  }, [callState.isConnected]);

  const initializeVoice = async () => {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Set up audio mode for voice calls
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      // Initialize Twilio Voice
      voiceRef.current = new Voice();
      
      // Set up event listeners
      voiceRef.current.on('ready', handleVoiceReady);
      voiceRef.current.on('error', handleVoiceError);
      voiceRef.current.on('connect', handleCallConnect);
      voiceRef.current.on('disconnect', handleCallDisconnect);
      voiceRef.current.on('cancel', handleCallCancel);
      voiceRef.current.on('reject', handleCallReject);

      console.log('✅ Voice agent initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing voice agent:', error);
      onError?.(error.message);
    }
  };

  const cleanupVoice = () => {
    if (voiceRef.current) {
      voiceRef.current.destroy();
      voiceRef.current = null;
    }
    stopCallTimer();
  };

  const handleVoiceReady = () => {
    console.log('🎙️ Voice agent ready');
  };

  const handleVoiceError = (error: any) => {
    console.error('❌ Voice error:', error);
    setCallState(prev => ({
      ...prev,
      isConnecting: false,
      isConnected: false,
      isDisconnected: true,
      error: error.message
    }));
    onError?.(error.message);
  };

  const handleCallConnect = (call: any) => {
    console.log('📞 Call connected:', call.parameters.CallSid);
    setCallState({
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      callSid: call.parameters.CallSid
    });
    callStartTimeRef.current = new Date();
    setShowCallModal(true);
    onCallStart?.();

    // Track call start
    analytics.track('voice_call_started', {
      userId,
      agentId,
      callSid: call.parameters.CallSid,
      timestamp: new Date().toISOString()
    });
  };

  const handleCallDisconnect = (call: any) => {
    console.log('📞 Call disconnected:', call.parameters.CallSid);
    setCallState({
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      callSid: call.parameters.CallSid
    });
    setShowCallModal(false);
    onCallEnd?.();

    // Log call to Firestore
    logCallToFirestore('disconnected');

    // Track call end
    analytics.track('voice_call_ended', {
      userId,
      agentId,
      callSid: call.parameters.CallSid,
      duration: callDuration,
      timestamp: new Date().toISOString()
    });
  };

  const handleCallCancel = (call: any) => {
    console.log('📞 Call cancelled:', call.parameters.CallSid);
    setCallState({
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      callSid: call.parameters.CallSid
    });
    setShowCallModal(false);
    onCallEnd?.();

    logCallToFirestore('cancelled');
  };

  const handleCallReject = (call: any) => {
    console.log('📞 Call rejected:', call.parameters.CallSid);
    setCallState({
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
      callSid: call.parameters.CallSid
    });
    setShowCallModal(false);
    onCallEnd?.();

    logCallToFirestore('rejected');
  };

  const startCall = async () => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));

      // Get Twilio access token
      const token = await getTwilioToken();

      // Connect to voice agent
      if (voiceRef.current) {
        await voiceRef.current.connect({
          accessToken: token,
          params: {
            userId,
            agentId,
            callType: 'parent_assistant'
          }
        });
      }

    } catch (error) {
      console.error('❌ Error starting call:', error);
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message
      }));
      onError?.(error.message);
    }
  };

  const endCall = async () => {
    try {
      if (voiceRef.current && callState.isConnected) {
        await voiceRef.current.disconnect();
      }
    } catch (error) {
      console.error('❌ Error ending call:', error);
    }
  };

  const toggleMute = async () => {
    try {
      if (voiceRef.current && callState.isConnected) {
        if (isMuted) {
          await voiceRef.current.setMuted(false);
          setIsMuted(false);
        } else {
          await voiceRef.current.setMuted(true);
          setIsMuted(true);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling mute:', error);
    }
  };

  const toggleSpeaker = async () => {
    try {
      if (isSpeakerOn) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: true
        });
        setIsSpeakerOn(false);
      } else {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false
        });
        setIsSpeakerOn(true);
      }
    } catch (error) {
      console.error('❌ Error toggling speaker:', error);
    }
  };

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTwilioToken = async (): Promise<string> => {
    try {
      // This would call your Cloud Function to generate a token
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          agentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Twilio token');
      }

      const data = await response.json();
      return data.token;

    } catch (error) {
      console.error('❌ Error getting Twilio token:', error);
      throw new Error('Unable to establish secure connection');
    }
  };

  const logCallToFirestore = async (status: string) => {
    try {
      await addDoc(collection(firestore, 'voice_calls'), {
        userId,
        agentId,
        callSid: callState.callSid,
        status,
        duration: callDuration,
        startTime: callStartTimeRef.current ? Timestamp.fromDate(callStartTimeRef.current) : null,
        endTime: Timestamp.now(),
        isMuted,
        isSpeakerOn,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ Error logging call to Firestore:', error);
    }
  };

  const handleCallButtonPress = () => {
    if (callState.isConnected) {
      Alert.alert(
        'End Call',
        'Are you sure you want to end the call?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Call', style: 'destructive', onPress: endCall }
        ]
      );
    } else if (callState.isConnecting) {
      Alert.alert(
        'Connecting...',
        'Please wait while we connect you to the AI assistant.',
        [{ text: 'OK' }]
      );
    } else {
      startCall();
    }
  };

  return (
    <>
      {/* Call Button */}
      <TouchableOpacity
        style={[
          styles.callButton,
          callState.isConnected && styles.callButtonActive,
          callState.isConnecting && styles.callButtonConnecting
        ]}
        onPress={handleCallButtonPress}
        disabled={callState.isConnecting}
      >
        {callState.isConnecting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <MaterialIcons
            name={callState.isConnected ? 'call-end' : 'call'}
            size={24}
            color="white"
          />
        )}
        <Text style={styles.callButtonText}>
          {callState.isConnected ? 'End Call' : 
           callState.isConnecting ? 'Connecting...' : 'Call AI Assistant'}
        </Text>
      </TouchableOpacity>

      {/* Call Modal */}
      <Modal
        visible={showCallModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.callModal}>
          <View style={styles.callHeader}>
            <Text style={styles.callTitle}>Town Rec AI Assistant</Text>
            <Text style={styles.callSubtitle}>
              {callState.isConnected ? 'Connected' : 'Connecting...'}
            </Text>
            {callState.isConnected && (
              <Text style={styles.callDuration}>
                {formatCallDuration(callDuration)}
              </Text>
            )}
          </View>

          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <MaterialIcons
                name={isMuted ? 'mic-off' : 'mic'}
                size={24}
                color={isMuted ? '#fff' : '#333'}
              />
              <Text style={[styles.controlButtonText, isMuted && styles.controlButtonTextActive]}>
                {isMuted ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}
            >
              <MaterialIcons
                name={isSpeakerOn ? 'volume-up' : 'volume-down'}
                size={24}
                color={isSpeakerOn ? '#fff' : '#333'}
              />
              <Text style={[styles.controlButtonText, isSpeakerOn && styles.controlButtonTextActive]}>
                {isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
            >
              <MaterialIcons name="call-end" size={24} color="white" />
              <Text style={[styles.controlButtonText, styles.endCallButtonText]}>
                End Call
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.callInfo}>
            <Text style={styles.callInfoText}>
              You're now connected to your AI assistant. You can ask questions about:
            </Text>
            <Text style={styles.callInfoBullet}>• Game schedules and updates</Text>
            <Text style={styles.callInfoBullet}>• Practice times and locations</Text>
            <Text style={styles.callInfoBullet}>• Your child's progress and highlights</Text>
            <Text style={styles.callInfoBullet}>• Coach messages and team announcements</Text>
            <Text style={styles.callInfoBullet}>• Weather alerts for outdoor events</Text>
          </View>
        </View>
      </Modal>

      {/* Error Display */}
      {callState.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {callState.error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setCallState(prev => ({ ...prev, error: undefined }));
              startCall();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 10,
  },
  callButtonActive: {
    backgroundColor: '#FF4444',
  },
  callButtonConnecting: {
    backgroundColor: '#FF9500',
  },
  callButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  callModal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  callHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
  },
  callTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  callSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  callDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 30,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
  },
  controlButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  controlButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  controlButtonTextActive: {
    color: '#fff',
  },
  endCallButton: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  endCallButtonText: {
    color: '#fff',
  },
  callInfo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  callInfoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    lineHeight: 22,
  },
  callInfoBullet: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 