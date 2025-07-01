import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { analytics } from '../lib/ai/shared/analytics';

interface AgentVoiceSettingsProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

interface VoiceSettings {
  voiceEnabled: boolean;
  avatarType: 'static' | 'lottie' | 'rive';
  avatarReactionIntensity: 'low' | 'medium' | 'high';
  voiceFallback: 'chat' | 'text' | 'none';
  autoStartVoice: boolean;
  voiceQuality: 'standard' | 'hd' | 'ultra';
  avatarResponsiveness: 'slow' | 'normal' | 'fast';
  privacyMode: 'standard' | 'enhanced' | 'minimal';
  audioRetention: boolean;
  callRecording: boolean;
}

export const AgentVoiceSettings: React.FC<AgentVoiceSettingsProps> = ({
  userId,
  visible,
  onClose
}) => {
  const [settings, setSettings] = useState<VoiceSettings>({
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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const settingsRef = doc(firestore, 'users', userId, 'preferences', 'voiceSettings');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings({ ...settings, ...settingsSnap.data() });
      }
      
    } catch (error) {
      console.error('Error loading voice settings:', error);
      Alert.alert('Error', 'Failed to load voice settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      const settingsRef = doc(firestore, 'users', userId, 'preferences', 'voiceSettings');
      await updateDoc(settingsRef, settings);
      
      // Track settings update
      await analytics.track('voice_settings_updated', {
        userId,
        settings,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Success', 'Voice settings saved successfully!');
      onClose();
      
    } catch (error) {
      console.error('Error saving voice settings:', error);
      Alert.alert('Error', 'Failed to save voice settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof VoiceSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const showAvatarTypePicker = () => {
    Alert.alert(
      'Avatar Type',
      'Choose your preferred avatar animation type',
      [
        { 
          text: 'Static', 
          onPress: () => updateSetting('avatarType', 'static'),
          style: settings.avatarType === 'static' ? 'default' : 'default'
        },
        { 
          text: 'Lottie (Lightweight)', 
          onPress: () => updateSetting('avatarType', 'lottie'),
          style: settings.avatarType === 'lottie' ? 'default' : 'default'
        },
        { 
          text: 'Rive (Advanced)', 
          onPress: () => updateSetting('avatarType', 'rive'),
          style: settings.avatarType === 'rive' ? 'default' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showIntensityPicker = () => {
    Alert.alert(
      'Avatar Reaction Intensity',
      'How responsive should the avatar be to your interactions?',
      [
        { 
          text: 'Low', 
          onPress: () => updateSetting('avatarReactionIntensity', 'low'),
          style: settings.avatarReactionIntensity === 'low' ? 'default' : 'default'
        },
        { 
          text: 'Medium', 
          onPress: () => updateSetting('avatarReactionIntensity', 'medium'),
          style: settings.avatarReactionIntensity === 'medium' ? 'default' : 'default'
        },
        { 
          text: 'High', 
          onPress: () => updateSetting('avatarReactionIntensity', 'high'),
          style: settings.avatarReactionIntensity === 'high' ? 'default' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showVoiceQualityPicker = () => {
    Alert.alert(
      'Voice Quality',
      'Select voice call quality (higher quality uses more data)',
      [
        { 
          text: 'Standard', 
          onPress: () => updateSetting('voiceQuality', 'standard'),
          style: settings.voiceQuality === 'standard' ? 'default' : 'default'
        },
        { 
          text: 'HD', 
          onPress: () => updateSetting('voiceQuality', 'hd'),
          style: settings.voiceQuality === 'hd' ? 'default' : 'default'
        },
        { 
          text: 'Ultra HD', 
          onPress: () => updateSetting('voiceQuality', 'ultra'),
          style: settings.voiceQuality === 'ultra' ? 'default' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showResponsivenessPicker = () => {
    Alert.alert(
      'Avatar Responsiveness',
      'How quickly should the avatar react to your interactions?',
      [
        { 
          text: 'Slow', 
          onPress: () => updateSetting('avatarResponsiveness', 'slow'),
          style: settings.avatarResponsiveness === 'slow' ? 'default' : 'default'
        },
        { 
          text: 'Normal', 
          onPress: () => updateSetting('avatarResponsiveness', 'normal'),
          style: settings.avatarResponsiveness === 'normal' ? 'default' : 'default'
        },
        { 
          text: 'Fast', 
          onPress: () => updateSetting('avatarResponsiveness', 'fast'),
          style: settings.avatarResponsiveness === 'fast' ? 'default' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showPrivacyPicker = () => {
    Alert.alert(
      'Privacy Mode',
      'Choose your privacy level for voice interactions',
      [
        { 
          text: 'Standard', 
          onPress: () => updateSetting('privacyMode', 'standard'),
          style: settings.privacyMode === 'standard' ? 'default' : 'default'
        },
        { 
          text: 'Enhanced', 
          onPress: () => updateSetting('privacyMode', 'enhanced'),
          style: settings.privacyMode === 'enhanced' ? 'default' : 'default'
        },
        { 
          text: 'Minimal', 
          onPress: () => updateSetting('privacyMode', 'minimal'),
          style: settings.privacyMode === 'minimal' ? 'default' : 'default'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (!visible) return null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading voice settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice & Avatar Settings</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Voice Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎙️ Voice Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📞</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Voice Calls</Text>
                <Text style={styles.settingDescription}>
                  Enable voice calls with AI assistant
                </Text>
              </View>
            </View>
            <Switch
              value={settings.voiceEnabled}
              onValueChange={(value) => updateSetting('voiceEnabled', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={settings.voiceEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🎯</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Start Voice</Text>
                <Text style={styles.settingDescription}>
                  Automatically start voice mode when available
                </Text>
              </View>
            </View>
            <Switch
              value={settings.autoStartVoice}
              onValueChange={(value) => updateSetting('autoStartVoice', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={settings.autoStartVoice ? '#fff' : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity style={styles.pickerRow} onPress={showVoiceQualityPicker}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔊</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Voice Quality</Text>
                <Text style={styles.settingDescription}>
                  {settings.voiceQuality.toUpperCase()} quality
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Avatar Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Avatar Settings</Text>
          
          <TouchableOpacity style={styles.pickerRow} onPress={showAvatarTypePicker}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🎭</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Avatar Type</Text>
                <Text style={styles.settingDescription}>
                  {settings.avatarType === 'static' ? 'Static Image' :
                   settings.avatarType === 'lottie' ? 'Lottie Animation' : 'Rive Animation'}
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerRow} onPress={showIntensityPicker}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚡</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Reaction Intensity</Text>
                <Text style={styles.settingDescription}>
                  {settings.avatarReactionIntensity.charAt(0).toUpperCase() + 
                   settings.avatarReactionIntensity.slice(1)} responsiveness
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerRow} onPress={showResponsivenessPicker}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚡</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Response Speed</Text>
                <Text style={styles.settingDescription}>
                  {settings.avatarResponsiveness.charAt(0).toUpperCase() + 
                   settings.avatarResponsiveness.slice(1)} response time
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy & Security</Text>
          
          <TouchableOpacity style={styles.pickerRow} onPress={showPrivacyPicker}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🛡️</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Privacy Mode</Text>
                <Text style={styles.settingDescription}>
                  {settings.privacyMode.charAt(0).toUpperCase() + 
                   settings.privacyMode.slice(1)} privacy level
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🎵</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Audio Retention</Text>
                <Text style={styles.settingDescription}>
                  Store voice interactions for improvement
                </Text>
              </View>
            </View>
            <Switch
              value={settings.audioRetention}
              onValueChange={(value) => updateSetting('audioRetention', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={settings.audioRetention ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📹</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Call Recording</Text>
                <Text style={styles.settingDescription}>
                  Record voice calls for quality assurance
                </Text>
              </View>
            </View>
            <Switch
              value={settings.callRecording}
              onValueChange={(value) => updateSetting('callRecording', value)}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={settings.callRecording ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Settings Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Settings Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Voice:</Text> {settings.voiceEnabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Avatar:</Text> {settings.avatarType.toUpperCase()}
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Quality:</Text> {settings.voiceQuality.toUpperCase()}
            </Text>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Privacy:</Text> {settings.privacyMode.charAt(0).toUpperCase() + settings.privacyMode.slice(1)}
            </Text>
          </View>
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
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
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
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  summaryLabel: {
    fontWeight: '600',
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