import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { analytics } from '../lib/ai/shared/analytics';

interface ParentPreferences {
  notificationLevel: 'all' | 'priority-only' | 'disabled';
  language: 'en' | 'es' | 'fr';
  timezone: string;
  communicationMethod: 'text' | 'voice' | 'avatar';
  deiReportOptIn: boolean;
  avatarType: 'static' | 'lottie' | 'rive';
  voiceEnabled: boolean;
  autoSync: boolean;
}

interface ParentPreferencesPanelProps {
  userId: string;
  onClose: () => void;
  onPreferencesChange?: (preferences: ParentPreferences) => void;
}

const firestore = getFirestore();

const timezones = [
  { label: 'Eastern Time (ET)', value: 'America/New_York' },
  { label: 'Central Time (CT)', value: 'America/Chicago' },
  { label: 'Mountain Time (MT)', value: 'America/Denver' },
  { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
  { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
  { label: 'Hawaii Time (HST)', value: 'Pacific/Honolulu' },
  { label: 'Atlantic Time (AT)', value: 'America/Halifax' },
  { label: 'Newfoundland Time (NT)', value: 'America/St_Johns' }
];

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' }
];

export const ParentPreferencesPanel: React.FC<ParentPreferencesPanelProps> = ({
  userId,
  onClose,
  onPreferencesChange
}) => {
  const [preferences, setPreferences] = useState<ParentPreferences>({
    notificationLevel: 'all',
    language: 'en',
    timezone: 'America/New_York',
    communicationMethod: 'text',
    deiReportOptIn: true,
    avatarType: 'lottie',
    voiceEnabled: true,
    autoSync: true
  });

  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      const prefsRef = doc(firestore, 'users', userId, 'preferences', 'aiAgent');
      const prefsSnap = await getDoc(prefsRef);
      
      if (prefsSnap.exists()) {
        const savedPrefs = prefsSnap.data() as ParentPreferences;
        setPreferences(savedPrefs);
      } else {
        // Set default timezone based on device
        const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const defaultTimezone = timezones.find(tz => tz.value === deviceTimezone)?.value || 'America/New_York';
        
        setPreferences(prev => ({
          ...prev,
          timezone: defaultTimezone
        }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setIsLoading(true);
      
      const prefsRef = doc(firestore, 'users', userId, 'preferences', 'aiAgent');
      await updateDoc(prefsRef, preferences);
      
      // Track preference changes
      await analytics.track('parent_preferences_updated', {
        userId,
        preferences,
        timestamp: new Date().toISOString()
      });
      
      setHasChanges(false);
      
      if (onPreferencesChange) {
        onPreferencesChange(preferences);
      }
      
      Alert.alert('Success', 'Preferences saved successfully!');
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof ParentPreferences>(
    key: K,
    value: ParentPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save them before closing?',
        [
          { text: 'Don\'t Save', style: 'destructive', onPress: onClose },
          { text: 'Save', onPress: savePreferences },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      onClose();
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSwitch = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.switchContainer}>
      <View style={styles.switchContent}>
        <Text style={styles.switchLabel}>{label}</Text>
        {description && <Text style={styles.switchDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={value ? '#007AFF' : '#f4f3f4'}
      />
    </View>
  );

  const renderPicker = (
    label: string,
    value: string,
    items: { label: string; value: string }[],
    onValueChange: (value: string) => void
  ) => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {items.map(item => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderRadioGroup = (
    label: string,
    value: string,
    options: { label: string; value: string; description?: string }[],
    onValueChange: (value: string) => void
  ) => (
    <View style={styles.radioGroupContainer}>
      <Text style={styles.radioGroupLabel}>{label}</Text>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.radioOption,
            value === option.value && styles.radioOptionSelected
          ]}
          onPress={() => onValueChange(option.value)}
        >
          <View style={[
            styles.radioButton,
            value === option.value && styles.radioButtonSelected
          ]}>
            {value === option.value && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
          <View style={styles.radioContent}>
            <Text style={[
              styles.radioLabel,
              value === option.value && styles.radioLabelSelected
            ]}>
              {option.label}
            </Text>
            {option.description && (
              <Text style={styles.radioDescription}>{option.description}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant Preferences</Text>
        <TouchableOpacity 
          onPress={savePreferences}
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges || isLoading}
        >
          <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        {renderSection('Notifications', (
          <View>
            {renderRadioGroup(
              'Notification Level',
              preferences.notificationLevel,
              [
                {
                  label: 'All Notifications',
                  value: 'all',
                  description: 'Receive all updates including games, practices, and announcements'
                },
                {
                  label: 'Priority Only',
                  value: 'priority-only',
                  description: 'Only receive important updates like game changes and urgent announcements'
                },
                {
                  label: 'Disabled',
                  value: 'disabled',
                  description: 'No notifications (you can still check the app for updates)'
                }
              ],
              (value) => updatePreference('notificationLevel', value as 'all' | 'priority-only' | 'disabled')
            )}
          </View>
        ))}

        {/* Language & Timezone */}
        {renderSection('Language & Timezone', (
          <View>
            {renderPicker(
              'Language',
              preferences.language,
              languages,
              (value) => updatePreference('language', value as 'en' | 'es' | 'fr')
            )}
            {renderPicker(
              'Timezone',
              preferences.timezone,
              timezones,
              (value) => updatePreference('timezone', value)
            )}
          </View>
        ))}

        {/* Communication Method */}
        {renderSection('Communication Method', (
          <View>
            {renderRadioGroup(
              'Preferred Method',
              preferences.communicationMethod,
              [
                {
                  label: 'Text Chat',
                  value: 'text',
                  description: 'Traditional text-based chat interface'
                },
                {
                  label: 'Voice Commands',
                  value: 'voice',
                  description: 'Use voice commands and receive voice responses'
                },
                {
                  label: 'Avatar Interface',
                  value: 'avatar',
                  description: 'Interactive avatar with animations and expressions'
                }
              ],
              (value) => updatePreference('communicationMethod', value as 'text' | 'voice' | 'avatar')
            )}
          </View>
        ))}

        {/* Avatar Settings */}
        {renderSection('Avatar Settings', (
          <View>
            {renderSwitch(
              'Enable Voice Commands',
              preferences.voiceEnabled,
              (value) => updatePreference('voiceEnabled', value),
              'Allow voice input and voice responses from the AI assistant'
            )}
            {renderPicker(
              'Avatar Type',
              preferences.avatarType,
              [
                { label: 'Static Icon', value: 'static' },
                { label: 'Lottie Animation', value: 'lottie' },
                { label: 'Rive Animation', value: 'rive' }
              ],
              (value) => updatePreference('avatarType', value as 'static' | 'lottie' | 'rive')
            )}
          </View>
        ))}

        {/* Privacy & Data */}
        {renderSection('Privacy & Data', (
          <View>
            {renderSwitch(
              'DEI Report Opt-in',
              preferences.deiReportOptIn,
              (value) => updatePreference('deiReportOptIn', value),
              'Allow anonymous data to be included in diversity, equity, and inclusion reports sent to local government'
            )}
            {renderSwitch(
              'Auto-sync Preferences',
              preferences.autoSync,
              (value) => updatePreference('autoSync', value),
              'Automatically sync preferences across devices and keep them up to date'
            )}
          </View>
        ))}

        {/* Information */}
        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Your preferences help us provide a personalized experience. 
            All data is stored securely and used only to improve your AI assistant experience.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#e1e5e9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  radioGroupContainer: {
    marginBottom: 16,
  },
  radioGroupLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  radioLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
    marginLeft: 8,
  },
}); 