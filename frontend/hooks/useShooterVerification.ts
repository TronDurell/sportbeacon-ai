import { useState, useEffect, useContext, createContext } from 'react';
import { firestore } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { analytics } from '../../lib/ai/shared/analytics';

export interface ShooterVerification {
  isShooterVerified: boolean;
  verificationDate?: Date;
  birthDate?: string;
  age?: number;
  termsAccepted: boolean;
  disclaimerAccepted: boolean;
  lastChecked: Date;
  verificationMethod: 'manual' | 'document' | 'third_party';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
}

export interface AgeGateProps {
  onVerificationComplete: (verified: boolean) => void;
  onTermsAccepted: () => void;
  onDisclaimerAccepted: () => void;
}

interface ShooterVerificationContextType {
  isVerified: boolean;
  isLoading: boolean;
  verification: ShooterVerification | null;
  checkVerification: () => Promise<boolean>;
  submitVerification: (birthDate: string) => Promise<boolean>;
  acceptTerms: () => Promise<void>;
  acceptDisclaimer: () => Promise<void>;
  resetVerification: () => Promise<void>;
}

const ShooterVerificationContext = createContext<ShooterVerificationContextType | null>(null);

export function ShooterVerificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verification, setVerification] = useState<ShooterVerification | null>(null);

  useEffect(() => {
    if (user?.uid) {
      checkVerification();
    } else {
      setIsLoading(false);
      setIsVerified(false);
    }
  }, [user]);

  const checkVerification = async (): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setIsLoading(true);
      
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const shooterVerification = userData.shooterVerification;
        
        if (shooterVerification) {
          const verificationData: ShooterVerification = {
            isShooterVerified: shooterVerification.isShooterVerified || false,
            verificationDate: shooterVerification.verificationDate?.toDate(),
            birthDate: shooterVerification.birthDate,
            age: shooterVerification.age,
            termsAccepted: shooterVerification.termsAccepted || false,
            disclaimerAccepted: shooterVerification.disclaimerAccepted || false,
            lastChecked: new Date(),
            verificationMethod: shooterVerification.verificationMethod || 'manual',
            status: shooterVerification.status || 'pending'
          };

          setVerification(verificationData);
          setIsVerified(verificationData.isShooterVerified && 
                       verificationData.termsAccepted && 
                       verificationData.disclaimerAccepted);

          // Track verification check
          await analytics.track('shooter_verification_checked', {
            userId: user.uid,
            isVerified: verificationData.isShooterVerified,
            status: verificationData.status,
            timestamp: new Date().toISOString()
          });

          return verificationData.isShooterVerified;
        }
      }

      // No verification data found
      const defaultVerification: ShooterVerification = {
        isShooterVerified: false,
        termsAccepted: false,
        disclaimerAccepted: false,
        lastChecked: new Date(),
        verificationMethod: 'manual',
        status: 'pending'
      };

      setVerification(defaultVerification);
      setIsVerified(false);
      return false;

    } catch (error) {
      console.error('Failed to check shooter verification:', error);
      setIsVerified(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const submitVerification = async (birthDate: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setIsLoading(true);

      // Calculate age
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
      }

      // Check if user is 21 or older
      const isAgeVerified = age >= 21;

      const verificationData: ShooterVerification = {
        isShooterVerified: isAgeVerified,
        verificationDate: isAgeVerified ? new Date() : undefined,
        birthDate,
        age,
        termsAccepted: verification?.termsAccepted || false,
        disclaimerAccepted: verification?.disclaimerAccepted || false,
        lastChecked: new Date(),
        verificationMethod: 'manual',
        status: isAgeVerified ? 'verified' : 'rejected'
      };

      // Update Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        shooterVerification: verificationData,
        updatedAt: new Date()
      });

      setVerification(verificationData);
      setIsVerified(isAgeVerified && verificationData.termsAccepted && verificationData.disclaimerAccepted);

      // Track verification submission
      await analytics.track('shooter_verification_submitted', {
        userId: user.uid,
        age,
        isAgeVerified,
        timestamp: new Date().toISOString()
      });

      return isAgeVerified;

    } catch (error) {
      console.error('Failed to submit verification:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTerms = async (): Promise<void> => {
    if (!user?.uid || !verification) return;

    try {
      const updatedVerification = {
        ...verification,
        termsAccepted: true,
        lastChecked: new Date()
      };

      // Update Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        'shooterVerification.termsAccepted': true,
        'shooterVerification.lastChecked': new Date(),
        updatedAt: new Date()
      });

      setVerification(updatedVerification);
      setIsVerified(updatedVerification.isShooterVerified && 
                   updatedVerification.termsAccepted && 
                   updatedVerification.disclaimerAccepted);

      // Track terms acceptance
      await analytics.track('terms_accepted', {
        userId: user.uid,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to accept terms:', error);
    }
  };

  const acceptDisclaimer = async (): Promise<void> => {
    if (!user?.uid || !verification) return;

    try {
      const updatedVerification = {
        ...verification,
        disclaimerAccepted: true,
        lastChecked: new Date()
      };

      // Update Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        'shooterVerification.disclaimerAccepted': true,
        'shooterVerification.lastChecked': new Date(),
        updatedAt: new Date()
      });

      setVerification(updatedVerification);
      setIsVerified(updatedVerification.isShooterVerified && 
                   updatedVerification.termsAccepted && 
                   updatedVerification.disclaimerAccepted);

      // Track disclaimer acceptance
      await analytics.track('disclaimer_accepted', {
        userId: user.uid,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to accept disclaimer:', error);
    }
  };

  const resetVerification = async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);

      const defaultVerification: ShooterVerification = {
        isShooterVerified: false,
        termsAccepted: false,
        disclaimerAccepted: false,
        lastChecked: new Date(),
        verificationMethod: 'manual',
        status: 'pending'
      };

      // Update Firestore
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        shooterVerification: defaultVerification,
        updatedAt: new Date()
      });

      setVerification(defaultVerification);
      setIsVerified(false);

      // Track verification reset
      await analytics.track('shooter_verification_reset', {
        userId: user.uid,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to reset verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: ShooterVerificationContextType = {
    isVerified,
    isLoading,
    verification,
    checkVerification,
    submitVerification,
    acceptTerms,
    acceptDisclaimer,
    resetVerification
  };

  return (
    <ShooterVerificationContext.Provider value={contextValue}>
      {children}
    </ShooterVerificationContext.Provider>
  );
}

export function useShooterVerification(): ShooterVerificationContextType {
  const context = useContext(ShooterVerificationContext);
  if (!context) {
    throw new Error('useShooterVerification must be used within a ShooterVerificationProvider');
  }
  return context;
}

// Age Gate Component
export function AgeGate({ onVerificationComplete, onTermsAccepted, onDisclaimerAccepted }: AgeGateProps) {
  const { isVerified, isLoading, verification, submitVerification, acceptTerms, acceptDisclaimer } = useShooterVerification();
  const [birthDate, setBirthDate] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState('');

  const handleSubmitVerification = async () => {
    if (!birthDate) {
      setError('Please enter your birth date');
      return;
    }

    setError('');
    const verified = await submitVerification(birthDate);
    
    if (verified) {
      onVerificationComplete(true);
    } else {
      setError('You must be 21 or older to access this feature');
    }
  };

  const handleAcceptTerms = async () => {
    await acceptTerms();
    setShowTerms(false);
    onTermsAccepted();
  };

  const handleAcceptDisclaimer = async () => {
    await acceptDisclaimer();
    setShowDisclaimer(false);
    onDisclaimerAccepted();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white text-lg">Verifying age...</Text>
      </View>
    );
  }

  if (isVerified) {
    return null; // User is verified, no gate needed
  }

  return (
    <View className="flex-1 bg-black px-4 py-6">
      <View className="flex-1 justify-center items-center">
        <View className="bg-zinc-900 rounded-3xl p-8 max-w-sm w-full">
          <View className="items-center mb-6">
            <ShieldIcon color="#ef4444" size={48} />
            <Text className="text-white text-2xl font-bold mt-4">Age Verification Required</Text>
            <Text className="text-zinc-400 text-center mt-2">
              This feature is only available to users 21 years and older
            </Text>
          </View>

          {!verification?.isShooterVerified ? (
            <View className="space-y-4">
              <Text className="text-zinc-300 text-sm">Enter your birth date:</Text>
              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#6b7280"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white border border-zinc-700"
              />
              
              {error ? (
                <Text className="text-red-500 text-sm">{error}</Text>
              ) : null}

              <Pressable
                onPress={handleSubmitVerification}
                className="bg-red-600 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-semibold text-lg">Verify Age</Text>
              </Pressable>
            </View>
          ) : (
            <View className="space-y-4">
              <Text className="text-emerald-500 text-center font-semibold">
                ✅ Age verified successfully!
              </Text>
              
              {!verification.termsAccepted && (
                <Pressable
                  onPress={() => setShowTerms(true)}
                  className="bg-blue-600 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-semibold">Accept Terms & Conditions</Text>
                </Pressable>
              )}

              {verification.termsAccepted && !verification.disclaimerAccepted && (
                <Pressable
                  onPress={() => setShowDisclaimer(true)}
                  className="bg-orange-600 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-semibold">Accept Safety Disclaimer</Text>
                </Pressable>
              )}

              {verification.termsAccepted && verification.disclaimerAccepted && (
                <Pressable
                  onPress={() => onVerificationComplete(true)}
                  className="bg-emerald-600 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-semibold text-lg">Access Feature</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Terms Modal */}
      {showTerms && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center px-4">
          <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-4">Terms & Conditions</Text>
            <ScrollView className="max-h-64 mb-4">
              <Text className="text-zinc-300 text-sm leading-5">
                By using this feature, you acknowledge that you are 21 years or older and understand the risks associated with firearm training. You agree to follow all safety protocols and local laws. This feature is for educational purposes only and does not constitute professional instruction.
              </Text>
            </ScrollView>
            <View className="flex-row space-x-3">
              <Pressable
                onPress={handleAcceptTerms}
                className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Accept</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTerms(false)}
                className="flex-1 bg-zinc-700 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center px-4">
          <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-4">Safety Disclaimer</Text>
            <ScrollView className="max-h-64 mb-4">
              <Text className="text-zinc-300 text-sm leading-5">
                ⚠️ WARNING: This feature involves simulated firearm training. Always follow proper safety procedures. Never point any device at people or animals. This is not a substitute for professional instruction. Use at your own risk and in accordance with local laws.
              </Text>
            </ScrollView>
            <View className="flex-row space-x-3">
              <Pressable
                onPress={handleAcceptDisclaimer}
                className="flex-1 bg-orange-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">I Understand</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDisclaimer(false)}
                className="flex-1 bg-zinc-700 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Higher-order component for protecting 21+ features
export function withShooterVerification<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    const { isVerified, isLoading } = useShooterVerification();

    if (isLoading) {
      return (
        <View className="flex-1 bg-black justify-center items-center">
          <Text className="text-white text-lg">Loading...</Text>
        </View>
      );
    }

    if (!isVerified) {
      return <AgeGate 
        onVerificationComplete={() => {}} 
        onTermsAccepted={() => {}} 
        onDisclaimerAccepted={() => {}} 
      />;
    }

    return <Component {...props} />;
  };
} 