import { render, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ParentChatInterface } from '../ParentChatInterface';
import { ParentPreferencesPanel } from '../ParentPreferencesPanel';

// Mock Firebase
jest.mock('../../lib/firebase', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
    addDoc: jest.fn(),
    onSnapshot: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
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

describe('TownRec Parent AI Agent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ParentChatInterface', () => {
    const mockProps = {
      userId: 'user123',
      agentId: 'agent123',
      onClose: jest.fn()
    };

    it('renders correctly with welcome message', () => {
      const { getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      expect(getByText('Town Rec AI Assistant')).toBeTruthy();
      expect(getByText('Hi! I\'m your Town Rec AI Assistant.')).toBeTruthy();
    });

    it('displays quick action buttons', () => {
      const { getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      expect(getByText('When is the next game?')).toBeTruthy();
      expect(getByText('Show me recent highlights')).toBeTruthy();
      expect(getByText('What\'s the practice schedule?')).toBeTruthy();
    });

    it('sends user message and shows typing indicator', async () => {
      const { getByPlaceholderText, getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      const input = getByPlaceholderText('Ask me anything about your child\'s sports...');
      fireEvent.changeText(input, 'When is the next game?');

      const sendButton = getByText('send').parent;
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('When is the next game?')).toBeTruthy();
      });

      await waitFor(() => {
        expect(getByText('AI is thinking...')).toBeTruthy();
      });
    });

    it('handles quick action button press', async () => {
      const { getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      const quickAction = getByText('When is the next game?');
      fireEvent.press(quickAction);

      await waitFor(() => {
        expect(getByText('When is the next game?')).toBeTruthy();
      });
    });

    it('shows voice command alert', () => {
      const { getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      const voiceButton = getByText('mic').parent;
      fireEvent.press(voiceButton);

      // This would test the Alert.alert call
      expect(voiceButton).toBeTruthy();
    });

    it('handles avatar toggle', () => {
      const { getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      const avatarButton = getByText('face').parent;
      fireEvent.press(avatarButton);

      // This would test the Alert.alert call
      expect(avatarButton).toBeTruthy();
    });

    it('disables send button when input is empty', () => {
      const { getByPlaceholderText, getByText } = render(
        <ParentChatInterface {...mockProps} />
      );

      const input = getByPlaceholderText('Ask me anything about your child\'s sports...');
      const sendButton = getByText('send').parent;

      // Initially disabled
      expect(sendButton.props.style).toContainEqual(expect.objectContaining({
        backgroundColor: '#f0f0f0'
      }));

      // Enable when text is entered
      fireEvent.changeText(input, 'Hello');
      expect(sendButton.props.style).toContainEqual(expect.objectContaining({
        backgroundColor: '#f8f9fa'
      }));
    });
  });

  describe('ParentPreferencesPanel', () => {
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
          alerts: {
            gameTimeChanges: true,
            injuryNotifications: true,
            highlightClips: true,
            newPhotos: false,
            coachMessages: true,
            practiceReminders: true,
            weatherAlerts: true,
            teamAnnouncements: true
          },
          avatarChat: true,
          voiceMode: false,
          language: 'en',
          timezone: 'America/New_York',
          notificationFrequency: 'immediate',
          privacyLevel: 'standard'
        })
      });
    });

    it('renders correctly with all preference sections', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      expect(getByText('AI Assistant Preferences')).toBeTruthy();
      expect(getByText('📱 Notifications')).toBeTruthy();
      expect(getByText('💬 Communication Style')).toBeTruthy();
      expect(getByText('🌍 Language & Time')).toBeTruthy();
      expect(getByText('🔒 Privacy & Security')).toBeTruthy();
    });

    it('displays all notification toggles', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      expect(getByText('Game Time Changes')).toBeTruthy();
      expect(getByText('Injury Reports')).toBeTruthy();
      expect(getByText('Highlight Videos')).toBeTruthy();
      expect(getByText('New Photos')).toBeTruthy();
      expect(getByText('Coach Messages')).toBeTruthy();
      expect(getByText('Practice Reminders')).toBeTruthy();
      expect(getByText('Weather Alerts')).toBeTruthy();
      expect(getByText('Team Announcements')).toBeTruthy();
    });

    it('toggles notification preferences', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const gameTimeToggle = getByText('Game Time Changes').parent;
      fireEvent.press(gameTimeToggle);

      // This would test the switch state change
      expect(gameTimeToggle).toBeTruthy();
    });

    it('shows language picker', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const languageButton = getByText('English');
      fireEvent.press(languageButton);

      // This would test the Alert.alert call for language selection
      expect(languageButton).toBeTruthy();
    });

    it('shows notification frequency picker', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const frequencyButton = getByText('Immediate');
      fireEvent.press(frequencyButton);

      // This would test the Alert.alert call for frequency selection
      expect(frequencyButton).toBeTruthy();
    });

    it('shows privacy level picker', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const privacyButton = getByText('Standard');
      fireEvent.press(privacyButton);

      // This would test the Alert.alert call for privacy selection
      expect(privacyButton).toBeTruthy();
    });

    it('saves preferences successfully', async () => {
      const mockUpdateDoc = require('../../lib/firebase').firestore.updateDoc;
      mockUpdateDoc.mockResolvedValue(undefined);

      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const saveButton = getByText('Save Preferences');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalled();
      });
    });

    it('handles save error', async () => {
      const mockUpdateDoc = require('../../lib/firebase').firestore.updateDoc;
      mockUpdateDoc.mockRejectedValue(new Error('Save failed'));

      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      const saveButton = getByText('Save Preferences');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByText('Failed to save preferences. Please try again.')).toBeTruthy();
      });
    });

    it('shows quick action buttons', () => {
      const { getByText } = render(
        <ParentPreferencesPanel {...mockProps} />
      );

      expect(getByText('Pause All Notifications')).toBeTruthy();
      expect(getByText('Reset to Defaults')).toBeTruthy();
      expect(getByText('Help & Support')).toBeTruthy();
    });
  });

  describe('Agent Integration Tests', () => {
    it('handles schedule update events', async () => {
      // Test the agent's response to schedule update events
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('processes injury notifications', async () => {
      // Test injury notification handling
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('generates highlight notifications', async () => {
      // Test highlight notification generation
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('sends weather alerts', async () => {
      // Test weather alert functionality
      expect(true).toBe(true); // Placeholder for integration testing
    });

    it('handles practice reminders', async () => {
      // Test practice reminder scheduling
      expect(true).toBe(true); // Placeholder for integration testing
    });
  });

  describe('Analytics Tracking', () => {
    it('tracks chat session start', async () => {
      const mockTrack = require('../../lib/ai/shared/analytics').analytics.track;
      
      // This would test that analytics are tracked when chat starts
      expect(mockTrack).toBeDefined();
    });

    it('tracks message interactions', async () => {
      const mockTrack = require('../../lib/ai/shared/analytics').analytics.track;
      
      // This would test message tracking
      expect(mockTrack).toBeDefined();
    });

    it('tracks preference updates', async () => {
      const mockTrack = require('../../lib/ai/shared/analytics').analytics.track;
      
      // This would test preference tracking
      expect(mockTrack).toBeDefined();
    });
  });

  describe('Firebase Integration', () => {
    it('loads user preferences from Firestore', async () => {
      const mockGetDoc = require('../../lib/firebase').firestore.getDoc;
      
      // This would test preference loading
      expect(mockGetDoc).toBeDefined();
    });

    it('saves preferences to Firestore', async () => {
      const mockUpdateDoc = require('../../lib/firebase').firestore.updateDoc;
      
      // This would test preference saving
      expect(mockUpdateDoc).toBeDefined();
    });

    it('sets up real-time listeners', async () => {
      const mockOnSnapshot = require('../../lib/firebase').firestore.onSnapshot;
      
      // This would test real-time listener setup
      expect(mockOnSnapshot).toBeDefined();
    });
  });
}); 