import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { analytics } from '../../lib/ai/shared/analytics';

interface LeagueCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (leagueId: string) => void;
  adminId: string;
}

interface LeaguePolicy {
  genderPolicy: 'Open' | 'Birth-Sex Only' | 'Admin Review';
  contactLevel: 'Low' | 'Medium' | 'High';
  identityBlur: boolean;
  autoApprovalEnabled: boolean;
  requireExceptionRequests: boolean;
}

export const LeagueCreationModal: React.FC<LeagueCreationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  adminId
}) => {
  const [leagueName, setLeagueName] = useState('');
  const [town, setTown] = useState('');
  const [description, setDescription] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [genderCategory, setGenderCategory] = useState<'male' | 'female' | 'coed'>('coed');
  
  // Policy settings
  const [policy, setPolicy] = useState<LeaguePolicy>({
    genderPolicy: 'Admin Review',
    contactLevel: 'Medium',
    identityBlur: false,
    autoApprovalEnabled: false,
    requireExceptionRequests: true
  });

  const [loading, setLoading] = useState(false);

  const handleCreateLeague = async () => {
    if (!leagueName.trim() || !town.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const leagueData = {
        name: leagueName.trim(),
        town: town.trim(),
        description: description.trim(),
        maxPlayers: parseInt(maxPlayers) || 20,
        ageRange: ageRange.trim(),
        genderCategory,
        policy,
        createdBy: adminId,
        createdAt: Timestamp.now(),
        status: 'active',
        memberCount: 0,
        settings: {
          allowJoinRequests: true,
          requireApproval: policy.genderPolicy === 'Admin Review',
          contactLevel: policy.contactLevel,
          identityBlur: policy.identityBlur
        }
      };

      const leagueRef = await addDoc(collection(firestore, 'leagues'), leagueData);

      // Track analytics
      await analytics.track('league_created', {
        leagueId: leagueRef.id,
        leagueName: leagueData.name,
        town: leagueData.town,
        genderCategory: leagueData.genderCategory,
        policy: leagueData.policy,
        adminId,
        timestamp: new Date().toISOString()
      });

      // Log admin action
      await addDoc(collection(firestore, 'admin_actions'), {
        adminId,
        action: 'league_created',
        leagueId: leagueRef.id,
        leagueName: leagueData.name,
        policy: leagueData.policy,
        timestamp: Timestamp.now()
      });

      Alert.alert('Success', 'League created successfully!', [
        { text: 'OK', onPress: () => {
          onSuccess(leagueRef.id);
          resetForm();
        }}
      ]);

    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Error', 'Failed to create league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLeagueName('');
    setTown('');
    setDescription('');
    setMaxPlayers('');
    setAgeRange('');
    setGenderCategory('coed');
    setPolicy({
      genderPolicy: 'Admin Review',
      contactLevel: 'Medium',
      identityBlur: false,
      autoApprovalEnabled: false,
      requireExceptionRequests: true
    });
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create New League</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic League Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>League Information</Text>
            
            <Text style={styles.label}>League Name *</Text>
            <TextInput
              style={styles.input}
              value={leagueName}
              onChangeText={setLeagueName}
              placeholder="Enter league name"
              maxLength={50}
            />

            <Text style={styles.label}>Town/City *</Text>
            <TextInput
              style={styles.input}
              value={town}
              onChangeText={setTown}
              placeholder="Enter town or city"
              maxLength={30}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the league..."
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Max Players</Text>
                <TextInput
                  style={styles.input}
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  placeholder="20"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Age Range</Text>
                <TextInput
                  style={styles.input}
                  value={ageRange}
                  onChangeText={setAgeRange}
                  placeholder="18+"
                />
              </View>
            </View>
          </View>

          {/* Gender Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender Category</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'coed', label: 'Co-Ed', icon: '👥' },
                { value: 'male', label: 'Men Only', icon: '👨' },
                { value: 'female', label: 'Women Only', icon: '👩' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    genderCategory === option.value && styles.radioOptionSelected
                  ]}
                  onPress={() => setGenderCategory(option.value as any)}
                >
                  <Text style={styles.radioIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.radioLabel,
                    genderCategory === option.value && styles.radioLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Inclusion Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inclusion Policy</Text>
            
            <Text style={styles.label}>Gender Policy</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Gender Policy',
                    'Select gender policy for this league',
                    [
                      { text: 'Open', onPress: () => setPolicy({...policy, genderPolicy: 'Open'}) },
                      { text: 'Birth-Sex Only', onPress: () => setPolicy({...policy, genderPolicy: 'Birth-Sex Only'}) },
                      { text: 'Admin Review', onPress: () => setPolicy({...policy, genderPolicy: 'Admin Review'}) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.pickerText}>{policy.genderPolicy}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Contact Level</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Contact Level',
                    'Select contact level for safety automation',
                    [
                      { text: 'Low', onPress: () => setPolicy({...policy, contactLevel: 'Low'}) },
                      { text: 'Medium', onPress: () => setPolicy({...policy, contactLevel: 'Medium'}) },
                      { text: 'High', onPress: () => setPolicy({...policy, contactLevel: 'High'}) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Text style={styles.pickerText}>{policy.contactLevel}</Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Identity Blur</Text>
                <Text style={styles.switchDescription}>
                  Hide gender identity in public rosters
                </Text>
              </View>
              <Switch
                value={policy.identityBlur}
                onValueChange={(value) => setPolicy({...policy, identityBlur: value})}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor={policy.identityBlur ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Auto-Approval</Text>
                <Text style={styles.switchDescription}>
                  Automatically approve eligible players
                </Text>
              </View>
              <Switch
                value={policy.autoApprovalEnabled}
                onValueChange={(value) => setPolicy({...policy, autoApprovalEnabled: value})}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor={policy.autoApprovalEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Exception Requests</Text>
                <Text style={styles.switchDescription}>
                  Allow players to request exceptions
                </Text>
              </View>
              <Switch
                value={policy.requireExceptionRequests}
                onValueChange={(value) => setPolicy({...policy, requireExceptionRequests: value})}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor={policy.requireExceptionRequests ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Policy Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Policy Summary</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Gender Policy:</Text> {policy.genderPolicy}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Contact Level:</Text> {policy.contactLevel}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Identity Blur:</Text> {policy.identityBlur ? 'Enabled' : 'Disabled'}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Auto-Approval:</Text> {policy.autoApprovalEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateLeague}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create League'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  radioOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  radioIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#666',
  },
  radioLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    flex: 1,
    marginRight: 15,
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  createButton: {
    backgroundColor: '#007AFF',
  },
  createButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 