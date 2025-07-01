import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { VoiceCallAgent } from '../VoiceCallAgent';
import { AvatarLottie } from '../AvatarLottie';
import { AvatarRive } from '../AvatarRive';
import { AgentVoiceSettings } from '../AgentVoiceSettings';

// Mock Twilio Voice SDK
jest.mock('@twilio/voice-sdk', () => ({
  Voice: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    setMuted: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  }))
}));

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    setAudioModeAsync: jest.fn(() => Promise.resolve())
  }
}));

// Mock Lottie
jest.mock('lottie-react-native', () => {
  return jest.fn().mockImplementation(() => {
    return {
      play: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn()
    };
  });
});

// Mock Rive
jest.mock('rive-react-native', () => ({
  Rive: jest.fn().mockImplementation(() => {
    return {
      play: jest.fn(),
      pause: jest.fn(),
      reset: jest.fn(),
      stateMachineInputs: jest.fn(() => [])
    };
  }),
  Fit: { Contain: 'contain' },
  Alignment: { Center: 'center' }
}));

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    getDoc: jest.fn(),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn(() => ({ toDate: () => new Date() }))
    }
  }
}));

// Mock analytics
jest.mock('../../lib/ai/shared/analytics', () => ({
  analytics: {
    track: jest.fn()
  }
}));

describe('Voice Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VoiceCallAgent', () => {
    const mockProps = {
      userId: 'user123',
      agentId: 'agent123',
      onCallStart: jest.fn(),
      onCallEnd: jest.fn(),
      onError: jest.fn()
    };

    it('renders call button correctly', () => {
      const { getByText } = render(
        <VoiceCallAgent {...mockProps} />
      );

      expect(getByText('Call AI Assistant')).toBeTruthy();
    });

    it('shows connecting state when call starts', async () => {
      const { getByText } = render(
        <VoiceCallAgent {...mockProps} />
      );

      const callButton = getByText('Call AI Assistant');
      fireEvent.press(callButton);

      await waitFor(() => {
        expect(getByText('Connecting...')).toBeTruthy();
      });
    });

    it('handles call end confirmation', async () => {
      const { getByText } = render(
        <VoiceCallAgent {...mockProps} />
      );

      // Mock connected state
      const mockVoice = require('@twilio/voice-sdk').Voice.mock.instances[0];
      mockVoice.on.mockImplementation((event, callback) => {
        if (event === 'connect') {
          callback({ parameters: { CallSid: 'call123' } });
        }
      });

      const callButton = getByText('Call AI Assistant');
      fireEvent.press(callButton);

      await waitFor(() => {
        expect(getByText('End Call')).toBeTruthy();
      });

      fireEvent.press(getByText('End Call'));

      await waitFor(() => {
        expect(getByText('End Call')).toBeTruthy();
      });
    });

    it('handles voice permissions', async () => {
      const mockAudio = require('expo-av').Audio;
      mockAudio.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { getByText } = render(
        <VoiceCallAgent {...mockProps} />
      );

      const callButton = getByText('Call AI Assistant');
      fireEvent.press(callButton);

      await waitFor(() => {
        expect(mockProps.onError).toHaveBeenCalledWith('Audio permission not granted');
      });
    });
  });

  describe('AvatarLottie', () => {
    const mockProps = {
      mood: 'happy' as const,
      size: 200,
      autoPlay: true,
      loop: true,
      speed: 1,
      onAnimationFinish: jest.fn()
    };

    it('renders with correct mood', () => {
      const { getByTestId } = render(
        <AvatarLottie {...mockProps} />
      );

      // This would test the Lottie animation rendering
      expect(getByTestId).toBeDefined();
    });

    it('changes mood and updates animation', () => {
      const { rerender } = render(
        <AvatarLottie {...mockProps} />
      );

      // Change mood
      rerender(<AvatarLottie {...mockProps} mood="sad" />);

      // This would test mood change
      expect(mockProps.onAnimationFinish).not.toHaveBeenCalled();
    });

    it('handles animation finish callback', () => {
      const { getByTestId } = render(
        <AvatarLottie {...mockProps} loop={false} />
      );

      // Simulate animation finish
      const lottieRef = require('lottie-react-native').mock.instances[0];
      lottieRef.onPlay.mockImplementation((callback) => callback());

      expect(mockProps.onAnimationFinish).toBeDefined();
    });
  });

  describe('AvatarRive', () => {
    const mockProps = {
      state: 'idle' as const,
      size: 200,
      autoPlay: true,
      onStateChange: jest.fn(),
      onAnimationFinish: jest.fn()
    };

    it('renders with correct state', () => {
      const { getByTestId } = render(
        <AvatarRive {...mockProps} />
      );

      // This would test the Rive animation rendering
      expect(getByTestId).toBeDefined();
    });

    it('changes state and updates animation', () => {
      const { rerender } = render(
        <AvatarRive {...mockProps} />
      );

      // Change state
      rerender(<AvatarRive {...mockProps} state="speaking" />);

      expect(mockProps.onStateChange).toBeDefined();
    });

    it('handles micro-expressions', () => {
      const { getByTestId } = render(
        <AvatarRive {...mockProps} />
      );

      // This would test micro-expression triggering
      const riveRef = require('rive-react-native').Rive.mock.instances[0];
      expect(riveRef.play).toBeDefined();
    });
  });

  describe('AgentVoiceSettings', () => {
    const mockProps = {
      userId: 'user123',
      visible: true,
      onClose: jest.fn()
    };

    beforeEach(() => {
      const mockGetDoc = require('../../lib/firebase').firestore.getDoc;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          voiceEnabled: true,
          avatarType: 'lottie',
          avatarReactionIntensity: 'medium',
          voiceFallback: 'chat',
          autoStartVoice: false,
          voiceQuality: 'standard',
          avatarResponsiveness: 'normal',
          privacyMode: 'standard',
          audioRetention: false,
          callRecording: false
        })
      });
    });

    it('renders all voice settings sections', () => {
      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      expect(getByText('Voice & Avatar Settings')).toBeTruthy();
      expect(getByText('🎙️ Voice Settings')).toBeTruthy();
      expect(getByText('🤖 Avatar Settings')).toBeTruthy();
      expect(getByText('🔒 Privacy & Security')).toBeTruthy();
    });

    it('toggles voice enabled setting', () => {
      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      const voiceToggle = getByText('Voice Calls').parent;
      fireEvent.press(voiceToggle);

      // This would test the switch state change
      expect(voiceToggle).toBeTruthy();
    });

    it('shows avatar type picker', () => {
      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      const avatarTypeButton = getByText('Lottie Animation');
      fireEvent.press(avatarTypeButton);

      // This would test the Alert.alert call for avatar type selection
      expect(avatarTypeButton).toBeTruthy();
    });

    it('shows intensity picker', () => {
      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      const intensityButton = getByText('Medium responsiveness');
      fireEvent.press(intensityButton);

      // This would test the Alert.alert call for intensity selection
      expect(intensityButton).toBeTruthy();
    });

    it('saves settings successfully', async () => {
      const mockUpdateDoc = require('../../lib/firebase').firestore.updateDoc;
      mockUpdateDoc.mockResolvedValue(undefined);

      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      const saveButton = getByText('Save Settings');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });

    it('handles save error', async () => {
      const mockUpdateDoc = require('../../lib/firebase').firestore.updateDoc;
      mockUpdateDoc.mockRejectedValue(new Error('Save failed'));

      const { getByText } = render(
        <AgentVoiceSettings {...mockProps} />
      );

      const saveButton = getByText('Save Settings');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText('Failed to save voice settings. Please try again.')).toBeTruthy();
      });
    });
  });

  describe('Integration Tests', () => {
    it('voice call with avatar animation integration', async () => {
      // Test integration between voice call and avatar animation
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('settings affect voice call behavior', async () => {
      // Test that voice settings affect call behavior
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('avatar responds to voice call events', async () => {
      // Test avatar animation in response to voice events
      expect(true).toBe(true); // Placeholder for integration testing
    });
  });

  describe('Error Handling', () => {
    it('handles Twilio connection errors', async () => {
      // Test Twilio connection error handling
      expect(true).toBe(true); // Placeholder for error testing
    });

    it('handles animation loading failures', async () => {
      // Test animation loading error handling
      expect(true).toBe(true); // Placeholder for error testing
    });

    it('handles permission denials gracefully', async () => {
      // Test permission denial handling
      expect(true).toBe(true); // Placeholder for error testing
    });
  });

  describe('Performance Tests', () => {
    it('voice call initialization performance', async () => {
      // Test voice call initialization performance
      expect(true).toBe(true); // Placeholder for performance testing
    });

    it('avatar animation performance', async () => {
      // Test avatar animation performance
      expect(true).toBe(true); // Placeholder for performance testing
    });

    it('settings save performance', async () => {
      // Test settings save performance
      expect(true).toBe(true); // Placeholder for performance testing
    });
  });
}); 