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
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { analytics } from '../../lib/ai/shared/analytics';

interface ExceptionRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
  leagueInfo: {
    id: string;
    name: string;
    genderCategory: 'male' | 'female' | 'coed';
    town: string;
  };
  userProfile: {
    genderIdentity: string;
    genderAtBirth: string;
    preferredName: string;
  };
  userId: string;
}

export const ExceptionRequestModal: React.FC<ExceptionRequestModalProps> = ({
  visible,
  onClose,
  onSuccess,
  leagueInfo,
  userProfile,
  userId
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for your exception request');
      return;
    }

    try {
      setLoading(true);

      const exceptionRequest = {
        leagueId: leagueInfo.id,
        userId,
        birthSex: userProfile.genderAtBirth,
        genderIdentity: userProfile.genderIdentity,
        timestamp: Timestamp.now(),
        status: 'pending',
        reason: reason.trim(),
        leagueName: leagueInfo.name,
        leagueTown: leagueInfo.town,
        userPreferredName: userProfile.preferredName
      };

      const docRef = await addDoc(collection(firestore, 'exception_requests'), exceptionRequest);

      // Track analytics
      await analytics.track('exception_request_submitted', {
        requestId: docRef.id,
        leagueId: leagueInfo.id,
        leagueName: leagueInfo.name,
        userId,
        genderIdentity: userProfile.genderIdentity,
        genderAtBirth: userProfile.genderAtBirth,
        timestamp: new Date().toISOString()
      });

      // Notify admins
      await notifyAdmins(docRef.id, exceptionRequest);

      Alert.alert(
        'Request Submitted',
        'Your exception request has been submitted for admin review. You will be notified once a decision is made.',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(docRef.id);
              resetForm();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting exception request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? You can submit a request later.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => {
          resetForm();
          onClose();
        }}
      ]
    );
  };

  const resetForm = () => {
    setReason('');
    setLoading(false);
  };

  const getGenderCategoryDisplay = (category: string) => {
    switch (category) {
      case 'male': return 'Men Only';
      case 'female': return 'Women Only';
      case 'coed': return 'Co-Ed';
      default: return category;
    }
  };

  const getMismatchDescription = () => {
    const { genderCategory } = leagueInfo;
    const { genderIdentity, genderAtBirth } = userProfile;

    if (genderCategory === 'male') {
      return `This league is designated for men only. You identify as ${genderIdentity} and were assigned ${genderAtBirth} at birth.`;
    } else if (genderCategory === 'female') {
      return `This league is designated for women only. You identify as ${genderIdentity} and were assigned ${genderAtBirth} at birth.`;
    } else {
      return `This league has specific gender requirements. You identify as ${genderIdentity} and were assigned ${genderAtBirth} at birth.`;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exception Request</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* League Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>League Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>League Name</Text>
              <Text style={styles.infoValue}>{leagueInfo.name}</Text>
              
              <Text style={styles.infoLabel}>Town</Text>
              <Text style={styles.infoValue}>{leagueInfo.town}</Text>
              
              <Text style={styles.infoLabel}>Gender Category</Text>
              <Text style={styles.infoValue}>{getGenderCategoryDisplay(leagueInfo.genderCategory)}</Text>
            </View>
          </View>

          {/* Mismatch Explanation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why This Request?</Text>
            <View style={styles.explanationCard}>
              <MaterialIcons name="info" size={20} color="#007AFF" style={styles.infoIcon} />
              <Text style={styles.explanationText}>
                {getMismatchDescription()}
              </Text>
            </View>
            <Text style={styles.explanationSubtext}>
              You can submit an exception request for admin review. This helps ensure fair play while respecting individual identity.
            </Text>
          </View>

          {/* User Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Preferred Name</Text>
              <Text style={styles.infoValue}>{userProfile.preferredName}</Text>
              
              <Text style={styles.infoLabel}>Gender Identity</Text>
              <Text style={styles.infoValue}>{userProfile.genderIdentity}</Text>
              
              <Text style={styles.infoLabel}>Assigned at Birth</Text>
              <Text style={styles.infoValue}>{userProfile.genderAtBirth}</Text>
            </View>
          </View>

          {/* Request Reason */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Reason</Text>
            <Text style={styles.label}>
              Please explain why you would like to join this league *
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Explain your request for admin review..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {reason.length}/500 characters
            </Text>
          </View>

          {/* Process Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Happens Next?</Text>
            <View style={styles.processCard}>
              <View style={styles.processStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Request Submitted</Text>
                  <Text style={styles.stepDescription}>
                    Your request will be reviewed by league administrators
                  </Text>
                </View>
              </View>
              
              <View style={styles.processStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Admin Review</Text>
                  <Text style={styles.stepDescription}>
                    Admins will consider league policies and fair play
                  </Text>
                </View>
              </View>
              
              <View style={styles.processStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Decision</Text>
                  <Text style={styles.stepDescription}>
                    You'll be notified of the decision via email and in-app
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Fair Play</Text>
            <View style={styles.privacyCard}>
              <MaterialIcons name="security" size={20} color="#28a745" style={styles.privacyIcon} />
              <Text style={styles.privacyText}>
                Your request and personal information will be kept confidential and only shared with league administrators for review purposes.
              </Text>
            </View>
            <Text style={styles.privacySubtext}>
              This process helps maintain fair play while respecting individual identity and privacy rights.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const notifyAdmins = async (requestId: string, requestData: any) => {
  try {
    // This would integrate with your notification system
    console.log(`🔔 Admin notification: New exception request ${requestId}`, requestData);
    
    // Track analytics
    await analytics.track('admin_notification_sent', {
      type: 'new_exception_request',
      requestId,
      leagueId: requestData.leagueId,
      userId: requestData.userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
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
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  explanationCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  explanationText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
  explanationSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  processCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  privacyIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  privacySubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
}); 