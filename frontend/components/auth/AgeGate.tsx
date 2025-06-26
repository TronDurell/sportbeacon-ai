import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AgeGateProps {
  minAge: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  featureName?: string;
  legalDisclaimer?: string;
}

interface AgeVerificationResult {
  isVerified: boolean;
  userAge?: number;
  verificationMethod: 'profile' | 'manual' | 'none';
  verifiedAt?: Date;
}

export const AgeGate: React.FC<AgeGateProps> = ({
  minAge,
  children,
  fallback,
  className,
  featureName = 'this feature',
  legalDisclaimer
}) => {
  const { user } = useAuth();
  const [ageVerification, setAgeVerification] = useState<AgeVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [manualAge, setManualAge] = useState<number | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Default legal disclaimer for gun-related features
  const defaultLegalDisclaimer = legalDisclaimer || 
    "This feature provides educational content for shooting sports training. All content is for educational purposes only. Users must comply with all local, state, and federal laws regarding firearms and shooting sports. SportBeaconAI does not promote or sell firearms.";

  useEffect(() => {
    if (user) {
      verifyUserAge();
    } else {
      setLoading(false);
    }
  }, [user]);

  const verifyUserAge = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        setAgeVerification({ isVerified: false, verificationMethod: 'none' });
        return;
      }

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let userAge: number | undefined;

        // Check for age field
        if (userData.age) {
          userAge = userData.age;
        }
        // Check for date of birth
        else if (userData.dateOfBirth) {
          const dob = new Date(userData.dateOfBirth);
          userAge = new Date().getFullYear() - dob.getFullYear();
        }

        if (userAge !== undefined) {
          const isVerified = userAge >= minAge;
          setAgeVerification({
            isVerified,
            userAge,
            verificationMethod: 'profile',
            verifiedAt: new Date()
          });
        } else {
          setAgeVerification({ isVerified: false, verificationMethod: 'none' });
        }
      } else {
        setAgeVerification({ isVerified: false, verificationMethod: 'none' });
      }
    } catch (error) {
      console.error('Error verifying user age:', error);
      setAgeVerification({ isVerified: false, verificationMethod: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = () => {
    if (manualAge && manualAge >= minAge && consentGiven) {
      setAgeVerification({
        isVerified: true,
        userAge: manualAge,
        verificationMethod: 'manual',
        verifiedAt: new Date()
      });
      setShowManualVerification(false);
    }
  };

  const handleManualAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = parseInt(e.target.value);
    setManualAge(isNaN(age) ? null : age);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Verifying age...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              You must be signed in to access {featureName}
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Age verification passed
  if (ageVerification?.isVerified) {
    return (
      <div className={className}>
        {/* Legal disclaimer banner */}
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 text-sm">
            <strong>Legal Notice:</strong> {defaultLegalDisclaimer}
          </AlertDescription>
        </Alert>
        
        {/* Age verification badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Age Verified ({ageVerification.userAge}+)
          </Badge>
          <span className="text-xs text-gray-500">
            Verified via {ageVerification.verificationMethod === 'profile' ? 'profile' : 'manual verification'}
          </span>
        </div>

        {children}
      </div>
    );
  }

  // Manual verification form
  if (showManualVerification) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Age Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must be at least {minAge} years old to access {featureName}.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Your Age
              </label>
              <input
                type="number"
                min="13"
                max="120"
                value={manualAge || ''}
                onChange={handleManualAgeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your age"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I confirm that I am at least {minAge} years old and I understand the legal requirements for accessing {featureName}.
                </span>
              </label>
            </div>

            <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
              <strong>Legal Disclaimer:</strong> {defaultLegalDisclaimer}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleManualVerification}
              disabled={!manualAge || manualAge < minAge || !consentGiven}
              className="flex-1"
            >
              Verify Age
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowManualVerification(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Age verification failed
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          Age Restriction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be at least {minAge} years old to access {featureName}.
          </AlertDescription>
        </Alert>

        <div className="text-center py-4">
          <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <p className="text-gray-600 mb-4">
            {ageVerification?.userAge 
              ? `You are ${ageVerification.userAge} years old. This feature requires users to be ${minAge} or older.`
              : 'Age verification is required to access this feature.'
            }
          </p>
        </div>

        <div className="space-y-3">
          {ageVerification?.verificationMethod === 'none' && (
            <Button 
              onClick={() => setShowManualVerification(true)}
              className="w-full"
            >
              Verify My Age
            </Button>
          )}

          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
            <strong>Legal Notice:</strong> {defaultLegalDisclaimer}
          </div>

          {fallback && (
            <div className="pt-4 border-t">
              {fallback}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 