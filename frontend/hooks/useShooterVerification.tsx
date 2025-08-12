import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VerificationData {
  userId: string;
  age: number;
  termsAccepted: boolean;
  disclaimerAccepted: boolean;
  isVerified: boolean;
  submittedAt: Date;
}

interface UseShooterVerificationReturn {
  isVerified: boolean;
  isLoading: boolean;
  verification: VerificationData | null;
  submitVerification: (age: number) => Promise<void>;
  acceptTerms: () => void;
  acceptDisclaimer: () => void;
}

export const useShooterVerification = (): UseShooterVerificationReturn => {
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const submitVerification = async (age: number) => {
    setIsLoading(true);
    try {
      // Simulate verification process
      const verificationData: VerificationData = {
        userId: 'user123',
        age,
        termsAccepted: true,
        disclaimerAccepted: true,
        isVerified: age >= 18,
        submittedAt: new Date()
      };

      setVerification(verificationData);
      setIsVerified(verificationData.isVerified);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptTerms = () => {
    if (verification) {
      setVerification({ ...verification, termsAccepted: true });
    }
  };

  const acceptDisclaimer = () => {
    if (verification) {
      setVerification({ ...verification, disclaimerAccepted: true });
    }
  };

  return {
    isVerified,
    isLoading,
    verification,
    submitVerification,
    acceptTerms,
    acceptDisclaimer
  };
}; 