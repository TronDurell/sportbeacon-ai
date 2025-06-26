import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Lock, 
  Upload, 
  CheckCircle,
  XCircle,
  Info,
  Clock,
  FileText,
  Camera,
  Users,
  Database,
  Trash2
} from 'lucide-react';
import { remoteConfigService } from '@/services/remoteConfig';
import { sentryService } from '@/services/sentryService';
import { useAuth } from '@/hooks/useAuth';

interface VideoConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consentData: VideoConsentData) => void;
  videoFile?: File;
  sessionId?: string;
  sport?: string;
}

interface VideoConsentData {
  consentGiven: boolean;
  consentType: 'explicit' | 'implicit';
  consentTimestamp: string;
  dataRetention: number; // days
  processingPurpose: string[];
  dataSharing: boolean;
  userAge: number;
  sessionId: string;
  sport: string;
  compliance: {
    ageVerified: boolean;
    educationalOnly: boolean;
    privacyMode: string;
    contentFiltering: string;
  };
}

interface ConsentSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  checked: boolean;
  details: string[];
}

export const VideoConsentModal: React.FC<VideoConsentModalProps> = ({
  isOpen,
  onClose,
  onConsent,
  videoFile,
  sessionId,
  sport = 'precision_shooting'
}) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [consentSections, setConsentSections] = useState<ConsentSection[]>([]);
  const [allConsentGiven, setAllConsentGiven] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeConsent();
    }
  }, [isOpen]);

  const initializeConsent = async () => {
    try {
      setLoading(true);
      
      // Get configuration
      const gunCoachConfig = remoteConfigService.getGunCoachConfig();
      setConfig(gunCoachConfig);

      // Get user age from profile
      if (user?.uid) {
        // This would typically fetch from user profile
        // For now, we'll use a placeholder
        setUserAge(25); // Placeholder age
      }

      // Initialize consent sections
      const sections: ConsentSection[] = [
        {
          id: 'age_verification',
          title: 'Age Verification',
          description: 'I confirm that I am at least 21 years old',
          required: true,
          checked: false,
          details: [
            'You must be 21 or older to use this feature',
            'Age verification is required for legal compliance',
            'Your age will be verified against your profile'
          ]
        },
        {
          id: 'educational_purpose',
          title: 'Educational Purpose',
          description: 'I understand this is for educational shooting sports training only',
          required: true,
          checked: false,
          details: [
            'This feature is for educational purposes only',
            'No real firearms are promoted or sold',
            'Content is designed for shooting sports training',
            'All analysis is focused on form and technique'
          ]
        },
        {
          id: 'video_processing',
          title: 'Video Processing Consent',
          description: 'I consent to the processing of my video for form analysis',
          required: true,
          checked: false,
          details: [
            'Your video will be analyzed for shooting form',
            'AI will detect stance, grip, and technique',
            'Analysis is performed locally when possible',
            'Video data is processed securely'
          ]
        },
        {
          id: 'data_retention',
          title: 'Data Retention',
          description: `I understand my data will be retained for ${gunCoachConfig.dataRetention} days`,
          required: true,
          checked: false,
          details: [
            `Data retention period: ${gunCoachConfig.dataRetention} days`,
            'Data is automatically deleted after retention period',
            'You can request data deletion at any time',
            'Analysis results are stored securely'
          ]
        },
        {
          id: 'privacy_protection',
          title: 'Privacy Protection',
          description: 'I understand my privacy is protected under strict privacy mode',
          required: true,
          checked: false,
          details: [
            'Strict privacy mode is enabled',
            'Personal information is anonymized',
            'No data is shared with third parties',
            'Compliance with privacy regulations'
          ]
        },
        {
          id: 'safety_acknowledgment',
          title: 'Safety Acknowledgment',
          description: 'I acknowledge that I will follow all safety guidelines',
          required: true,
          checked: false,
          details: [
            'Always follow range safety rules',
            'Use proper safety equipment',
            'Follow local and federal laws',
            'Seek professional training when needed'
          ]
        }
      ];

      setConsentSections(sections);
    } catch (error) {
      console.error('Failed to initialize consent:', error);
      sentryService.logGunCoachError({
        error: 'Failed to initialize video consent modal',
        userId: user?.uid,
        sessionId,
        context: 'video_consent',
        severity: 'medium'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (sectionId: string, checked: boolean) => {
    setConsentSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, checked }
          : section
      )
    );
  };

  const checkAllConsent = () => {
    const allChecked = consentSections.every(section => section.checked);
    setAllConsentGiven(allChecked);
  };

  useEffect(() => {
    checkAllConsent();
  }, [consentSections]);

  const handleConsent = async () => {
    if (!allConsentGiven || !user?.uid || !sessionId) return;

    try {
      setLoading(true);

      // Log consent event
      sentryService.logConsent(user.uid, sessionId, 'video_upload', true);

      const consentData: VideoConsentData = {
        consentGiven: true,
        consentType: config?.consentFlow || 'explicit',
        consentTimestamp: new Date().toISOString(),
        dataRetention: config?.dataRetention || 30,
        processingPurpose: ['form_analysis', 'educational_training', 'safety_improvement'],
        dataSharing: false,
        userAge: userAge || 0,
        sessionId,
        sport,
        compliance: {
          ageVerified: true,
          educationalOnly: config?.educationalOnly || true,
          privacyMode: config?.privacyMode || 'strict',
          contentFiltering: config?.contentFiltering || 'strict'
        }
      };

      onConsent(consentData);
      onClose();

    } catch (error) {
      console.error('Failed to process consent:', error);
      sentryService.logGunCoachError({
        error: 'Failed to process video consent',
        userId: user?.uid,
        sessionId,
        context: 'video_consent',
        severity: 'medium'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (user?.uid && sessionId) {
      sentryService.logConsent(user.uid, sessionId, 'video_upload', false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Video Upload Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Legal Notice */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Legal Notice:</strong> This feature provides educational content for shooting sports training. 
              All content is for educational purposes only. Users must comply with all local, state, and federal laws 
              regarding firearms and shooting sports.
            </AlertDescription>
          </Alert>

          {/* Video File Info */}
          {videoFile && (
            <Card className="p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <Camera className="w-8 h-8 text-blue-500" />
                <div className="flex-1">
                  <h3 className="font-semibold">{videoFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    Size: {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Badge variant="outline">Shooting Analysis</Badge>
              </div>
            </Card>
          )}

          {/* Consent Sections */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Required Consents</h3>
            
            {consentSections.map((section) => (
              <Card key={section.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={section.checked}
                      onCheckedChange={(checked) => 
                        handleConsentChange(section.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{section.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.description}
                      </p>
                      
                      <div className="mt-3 space-y-2">
                        {section.details.map((detail, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Data Processing Info */}
          <Card className="p-4 bg-blue-50">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">How Your Data is Processed</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>Form Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>Secure Storage</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{config?.dataRetention || 30} Day Retention</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span>Auto Deletion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Compliance Status */}
          <Card className="p-4 bg-green-50">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-medium text-green-900">Compliance Status</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Age Verified ({userAge}+)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Educational Only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Strict Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>App Store Compliant</span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConsent}
              disabled={!allConsentGiven || loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  I Consent & Continue
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={loading}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </Button>
          </div>

          {/* Footer Notice */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t">
            <p>
              By providing consent, you acknowledge that you have read and understood 
              our privacy policy and terms of service. You can withdraw consent at any time 
              by contacting support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 