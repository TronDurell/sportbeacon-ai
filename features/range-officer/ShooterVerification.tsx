import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { ShieldIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react-native';
import { firestore } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../frontend/hooks/useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

export default function ShooterVerification() {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsVerified(userData.isShooterVerified || false);
      } else {
        setIsVerified(false);
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyAge = (birthDateStr: string): boolean => {
    const birth = new Date(birthDateStr);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1 >= 21;
    }
    
    return age >= 21;
  };

  const handleVerification = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!birthDate) {
      Alert.alert('Error', 'Please enter your birth date');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'You must agree to the terms and conditions');
      return;
    }

    const isAgeValid = verifyAge(birthDate);
    
    if (!isAgeValid) {
      Alert.alert(
        'Age Verification Failed',
        'You must be 21 years or older to access the Range Officer feature.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      
      await analytics.track('shooter_verification_failed', {
        userId: user.uid,
        reason: 'underage',
        providedAge: new Date().getFullYear() - new Date(birthDate).getFullYear(),
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    try {
      setLoading(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        isShooterVerified: true,
        verificationDate: new Date(),
        birthDate: birthDate,
        rangeStats: {
          totalSessions: 0,
          avgScore: 0,
          bestDrill: ''
        }
      }, { merge: true });

      setIsVerified(true);
      setShowVerificationForm(false);

      Alert.alert(
        'Verification Successful',
        'You now have access to the Range Officer feature.',
        [
          { text: 'OK', style: 'default' }
        ]
      );

      await analytics.track('shooter_verification_success', {
        userId: user.uid,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Verification failed:', error);
      Alert.alert('Error', 'Failed to complete verification. Please try again.');
      
      await analytics.track('shooter_verification_error', {
        userId: user.uid,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const showTermsAndConditions = () => {
    Alert.alert(
      'Terms and Conditions',
      `RANGE OFFICER TERMS AND CONDITIONS

1. AGE REQUIREMENT: You must be 21 years or older to use this feature.

2. SAFETY FIRST: This feature is for training purposes only. Always follow proper firearm safety rules.

3. LEGAL COMPLIANCE: Ensure you comply with all local, state, and federal laws regarding firearm training.

4. NO LIABILITY: SportBeaconAI is not responsible for any injuries or damages resulting from firearm use.

5. PRIVACY: Your training data will be stored securely and used only for improving your training experience.

6. ACCURACY: While we strive for accuracy, the AI analysis should not replace professional instruction.

By using this feature, you acknowledge that you have read and agree to these terms.`,
      [
        { text: 'I Understand', style: 'default' }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Loading verification status...</Text>
      </View>
    );
  }

  if (isVerified) {
    return (
      <View className="flex-1 bg-black px-4 py-6">
        <View className="flex-1 justify-center items-center">
          <CheckCircleIcon color="#10b981" size={64} />
          <Text className="text-white text-2xl font-bold mt-4 mb-2">
            Verification Complete
          </Text>
          <Text className="text-zinc-400 text-center text-lg">
            You have access to the Range Officer feature
          </Text>
          
          <Pressable
            onPress={() => navigation.navigate('DrillLab')}
            className="mt-8 bg-emerald-600 rounded-xl px-8 py-4"
          >
            <Text className="text-white font-semibold text-lg">
              Start Training
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-row items-center mb-6">
        <ShieldIcon color="white" size={24} />
        <Text className="text-white text-2xl font-bold ml-2">Shooter Verification</Text>
      </View>

      {!showVerificationForm ? (
        <View className="flex-1 justify-center">
          <View className="bg-zinc-900 rounded-2xl p-6 mb-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Age Verification Required
            </Text>
            <Text className="text-zinc-400 text-base leading-6 mb-6">
              The Range Officer feature is available only to users 21 years of age or older. 
              This verification is required to ensure compliance with firearm training regulations.
            </Text>
            
            <View className="bg-blue-900/20 border border-blue-500 rounded-xl p-4 mb-6">
              <Text className="text-blue-400 text-sm font-medium mb-2">
                Important Safety Notice
              </Text>
              <Text className="text-blue-300 text-sm">
                This feature is for training purposes only. Always follow proper firearm safety rules 
                and comply with all applicable laws and regulations.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowVerificationForm(true)}
              className="bg-emerald-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">
                Verify Age
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <View className="bg-zinc-900 rounded-2xl p-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Enter Your Information
            </Text>

            <View className="mb-4">
              <Text className="text-zinc-300 text-sm mb-2">Date of Birth</Text>
              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6b7280"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
                keyboardType="numeric"
              />
            </View>

            <Pressable
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              className="flex-row items-center mb-6"
            >
              <View className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                agreeToTerms ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-600'
              }`}>
                {agreeToTerms && <CheckCircleIcon color="white" size={16} />}
              </View>
              <Text className="text-zinc-300 flex-1">
                I agree to the{' '}
                <Text 
                  onPress={showTermsAndConditions}
                  className="text-emerald-400 underline"
                >
                  Terms and Conditions
                </Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={handleVerification}
              disabled={loading}
              className={`rounded-xl py-4 items-center ${
                loading ? 'bg-zinc-700' : 'bg-emerald-600'
              }`}
            >
              <Text className="text-white font-semibold text-lg">
                {loading ? 'Verifying...' : 'Complete Verification'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
} 