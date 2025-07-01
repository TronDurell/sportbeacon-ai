import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { analytics } from '../lib/ai/shared/analytics';

interface ParentPreferencesPanelProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

interface ParentPreferences {
  alerts: {
    gameTimeChanges: boolean;
    injuryNotifications: boolean;
    highlightClips: boolean;
    newPhotos: boolean;
    coachMessages: boolean;
    practiceReminders: boolean;
    weatherAlerts: boolean;
    teamAnnouncements: boolean;
  };
  avatarChat: boolean;
  voiceMode: boolean;
  language: 'en' | 'es' | 'fr';
  timezone: string;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  privacyLevel: 'standard' | 'enhanced' | 'minimal';
}

export const ParentPreferencesPanel: React.FC<ParentPreferencesPanelProps> = ({
  userId,
  visible,
  onClose
}) => {
  const [preferences, setPreferences] = useState<ParentPreferences>({
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      const prefsRef = doc(firestore, 'users', userId, 'preferences', 'agentToggles');
      const prefsSnap = await getDoc(prefsRef);
      
      if (prefsSnap.exists()) {
        setPreferences({ ...preferences, ...prefsSnap.data() });
      }
      
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const prefsRef = doc(firestore, 'users', userId, 'preferences', 'agentToggles');
      await updateDoc(prefsRef, preferences);
      
      // Track analytics
      await analytics.track('parent_preferences_updated', {
        userId,
        preferences,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Success', 'Preferences saved successfully!');
      onClose();
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateAlertPreference = (key: keyof ParentPreferences['alerts'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        [key]: value
      }
    }));
  };

  const updateGeneralPreference = (key: keyof Omit<ParentPreferences, 'alerts'>, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!visible) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant Preferences</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Alert Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Notifications</Text>
          <Text style={styles.sectionDescription}>
            Choose what updates you'd like to receive from your AI assistant
          </Text>
          
          {Object.entries({
            gameTimeChanges: { label: 'Game Time Changes', icon: '📅' },
            injuryNotifications: { label: 'Injury Reports', icon: '🏥' },
            highlightClips: { label: 'Highlight Videos', icon: '🏆' },
            newPhotos: { label: 'New Photos', icon: '📸' },
            coachMessages: { label: 'Coach Messages', icon: '💬' },
            practiceReminders: { label: 'Practice Reminders', icon: '🏃' },
            weatherAlerts: { label: 'Weather Alerts', icon: '🌤️' },
            teamAnnouncements: { label: 'Team Announcements', icon: '📢' }
          }).map(([key, config]) => (
            <View key={key} style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceIcon}>{config.icon}</Text>
                <View style={styles.preferenceText}>
                  <Text style={styles.preferenceLabel}>{config.label}</Text>
                  <Text style={styles.preferenceDescription}>
                    {getPreferenceDescription(key as keyof ParentPreferences['alerts'])}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.alerts[key as keyof ParentPreferences['alerts']]}
                onValueChange={(value) => updateAlertPreference(key as keyof ParentPreferences['alerts'], value)}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor={preferences.alerts[key as keyof ParentPreferences['alerts']] ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Communication Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Communication Style</Text>
          <Text style={styles.sectionDescription}>
            How would you like to interact with your AI assistant?
          </Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceIcon}>🤖</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Avatar Chat</Text>
                <Text style={styles.preferenceDescription}>
                  Use animated avatar for more engaging conversations
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.avatarChat}
              onValueChange={(value) => updateGeneralPreference('avatarChat', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={preferences.avatarChat ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceIcon}>🎙️</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Voice Mode</Text>
                <Text style={styles.preferenceDescription}>
                  Enable voice responses and commands
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.voiceMode}
              onValueChange={(value) => updateGeneralPreference('voiceMode', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={preferences.voiceMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Language & Timezone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Language & Time</Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceIcon}>🗣️</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Language</Text>
                <Text style={styles.preferenceDescription}>
                  Choose your preferred language
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Select Language',
                  'Choose your preferred language',
                  [
                    { text: 'English', onPress: () => updateGeneralPreference('language', 'en') },
                    { text: 'Español', onPress: () => updateGeneralPreference('language', 'es') },
                    { text: 'Français', onPress: () => updateGeneralPreference('language', 'fr') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.pickerText}>
                {preferences.language === 'en' ? 'English' : 
                 preferences.language === 'es' ? 'Español' : 'Français'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceIcon}>🕐</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Notification Frequency</Text>
                <Text style={styles.preferenceDescription}>
                  How often to receive updates
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Notification Frequency',
                  'Choose how often to receive updates',
                  [
                    { text: 'Immediate', onPress: () => updateGeneralPreference('notificationFrequency', 'immediate') },
                    { text: 'Hourly', onPress: () => updateGeneralPreference('notificationFrequency', 'hourly') },
                    { text: 'Daily', onPress: () => updateGeneralPreference('notificationFrequency', 'daily') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.pickerText}>
                {preferences.notificationFrequency === 'immediate' ? 'Immediate' :
                 preferences.notificationFrequency === 'hourly' ? 'Hourly' : 'Daily'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy & Security</Text>
          <Text style={styles.sectionDescription}>
            Control how your information is shared and used
          </Text>
          
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceIcon}>🛡️</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceLabel}>Privacy Level</Text>
                <Text style={styles.preferenceDescription}>
                  {getPrivacyDescription(preferences.privacyLevel)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                Alert.alert(
                  'Privacy Level',
                  'Choose your privacy preference',
                  [
                    { 
                      text: 'Standard', 
                      onPress: () => updateGeneralPreference('privacyLevel', 'standard'),
                      style: preferences.privacyLevel === 'standard' ? 'default' : 'default'
                    },
                    { 
                      text: 'Enhanced', 
                      onPress: () => updateGeneralPreference('privacyLevel', 'enhanced'),
                      style: preferences.privacyLevel === 'enhanced' ? 'default' : 'default'
                    },
                    { 
                      text: 'Minimal', 
                      onPress: () => updateGeneralPreference('privacyLevel', 'minimal'),
                      style: preferences.privacyLevel === 'minimal' ? 'default' : 'default'
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.pickerText}>
                {preferences.privacyLevel === 'standard' ? 'Standard' :
                 preferences.privacyLevel === 'enhanced' ? 'Enhanced' : 'Minimal'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="notifications-off" size={24} color="#666" />
            <Text style={styles.actionButtonText}>Pause All Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="refresh" size={24} color="#666" />
            <Text style={styles.actionButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="help" size={24} color="#666" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const getPreferenceDescription = (key: keyof ParentPreferences['alerts']): string => {
  const descriptions = {
    gameTimeChanges: 'Get notified when game times change',
    injuryNotifications: 'Receive alerts about injuries or health concerns',
    highlightClips: 'See your child\'s best moments and achievements',
    newPhotos: 'Get notified when new photos are uploaded',
    coachMessages: 'Receive important messages from coaches',
    practiceReminders: 'Get reminded about upcoming practices',
    weatherAlerts: 'Stay informed about weather that may affect games',
    teamAnnouncements: 'Receive team updates and announcements'
  };
  return descriptions[key];
};

const getPrivacyDescription = (level: string): string => {
  const descriptions = {
    standard: 'Standard privacy with basic data sharing',
    enhanced: 'Enhanced privacy with minimal data sharing',
    minimal: 'Minimal privacy with full feature access'
  };
  return descriptions[level as keyof typeof descriptions];
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  preferenceIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minWidth: 120,
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 