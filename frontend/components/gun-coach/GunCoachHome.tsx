import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Target, 
  Video, 
  MapPin, 
  Shield, 
  BookOpen, 
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Info,
  ExternalLink
} from 'lucide-react';
import { AgeGate } from '@/components/auth/AgeGate';
import { FormDetection } from '@/components/FormDetection';
import { RangeOfficerCoach } from '@/components/RangeOfficerCoach';
import { GunRangeMap } from '@/components/GunRangeMap';
import { remoteConfigService } from '@/services/remoteConfig';
import { useAuth } from '@/hooks/useAuth';

interface GunCoachHomeProps {
  className?: string;
}

interface GunCoachSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  sport: string;
  mode: 'live' | 'upload' | 'tutorial';
  status: 'active' | 'paused' | 'completed' | 'error';
  data?: any;
}

export const GunCoachHome: React.FC<GunCoachHomeProps> = ({ className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentSession, setCurrentSession] = useState<GunCoachSession | null>(null);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeGunCoach();
  }, []);

  const initializeGunCoach = async () => {
    try {
      setLoading(true);
      
      // Wait for Remote Config to initialize
      await remoteConfigService.initialize();
      
      // Check if feature is enabled
      const enabled = remoteConfigService.isGunCoachEnabled();
      setIsFeatureEnabled(enabled);
      
      if (!enabled) {
        setError('Gun Range Coach feature is currently disabled');
        return;
      }
      
      // Get configuration
      const gunCoachConfig = remoteConfigService.getGunCoachConfig();
      setConfig(gunCoachConfig);
      
      // Log configuration for audit
      remoteConfigService.logGunCoachConfiguration();
      
      // Validate compliance
      const compliance = remoteConfigService.validateGunCoachCompliance();
      if (!compliance.isCompliant) {
        console.warn('Gun Coach compliance issues:', compliance.issues);
      }
      
    } catch (err) {
      console.error('Failed to initialize Gun Coach:', err);
      setError('Failed to initialize Gun Range Coach feature');
    } finally {
      setLoading(false);
    }
  };

  const startLiveSession = () => {
    const session: GunCoachSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      sport: 'precision_shooting', // Default sport
      mode: 'live',
      status: 'active'
    };
    setCurrentSession(session);
    setActiveTab('form-detection');
  };

  const startUploadSession = () => {
    const session: GunCoachSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      sport: 'precision_shooting', // Default sport
      mode: 'upload',
      status: 'active'
    };
    setCurrentSession(session);
    setActiveTab('form-detection');
  };

  const startTutorialSession = () => {
    const session: GunCoachSession = {
      id: `session_${Date.now()}`,
      startTime: new Date(),
      sport: 'precision_shooting', // Default sport
      mode: 'tutorial',
      status: 'active'
    };
    setCurrentSession(session);
    setActiveTab('safety');
  };

  const endSession = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        endTime: new Date(),
        status: 'completed'
      });
    }
    setCurrentSession(null);
    setActiveTab('overview');
  };

  const pauseSession = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'paused'
      });
    }
  };

  const resumeSession = () => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        status: 'active'
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Initializing Gun Range Coach...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Feature Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isFeatureEnabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            Feature Disabled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              The Gun Range Coach feature is currently disabled.
            </p>
            <p className="text-sm text-gray-500">
              This feature may be temporarily unavailable or under maintenance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AgeGate 
      minAge={config?.minAge || 21}
      featureName="Gun Range Coach"
      legalDisclaimer={config?.legalDisclaimer}
      className={className}
    >
      <div className="space-y-6">
        {/* Session Status */}
        {currentSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Session
                </span>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={currentSession.status === 'active' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {currentSession.status === 'active' && <Play className="w-3 h-3" />}
                    {currentSession.status === 'paused' && <Pause className="w-3 h-3" />}
                    {currentSession.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                    {currentSession.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={endSession}
                  >
                    End Session
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Mode:</span>
                  <div className="font-medium capitalize">{currentSession.mode}</div>
                </div>
                <div>
                  <span className="text-gray-500">Sport:</span>
                  <div className="font-medium capitalize">{currentSession.sport.replace('_', ' ')}</div>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-medium">
                    {Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000 / 60)}m
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="form-detection">Form Analysis</TabsTrigger>
            <TabsTrigger value="safety">Safety & Training</TabsTrigger>
            <TabsTrigger value="ranges">Range Finder</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Gun Range Coach
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Camera className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Live Analysis</h3>
                        <p className="text-sm text-gray-600">Real-time form detection</p>
                      </div>
                    </div>
                    <Button 
                      onClick={startLiveSession}
                      className="w-full"
                      disabled={!!currentSession}
                    >
                      Start Live Session
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Upload className="w-8 h-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Video Upload</h3>
                        <p className="text-sm text-gray-600">Analyze recorded footage</p>
                      </div>
                    </div>
                    <Button 
                      onClick={startUploadSession}
                      className="w-full"
                      disabled={!!currentSession}
                    >
                      Upload Video
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <BookOpen className="w-8 h-8 text-purple-500" />
                      <div>
                        <h3 className="font-semibold">Safety Training</h3>
                        <p className="text-sm text-gray-600">Learn range safety</p>
                      </div>
                    </div>
                    <Button 
                      onClick={startTutorialSession}
                      className="w-full"
                      disabled={!!currentSession}
                    >
                      Start Training
                    </Button>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-6 h-6 text-orange-500" />
                      <div>
                        <h3 className="font-semibold">Find Ranges</h3>
                        <p className="text-sm text-gray-600">Locate nearby shooting ranges</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('ranges')}
                      className="w-full"
                    >
                      Browse Ranges
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-6 h-6 text-red-500" />
                      <div>
                        <h3 className="font-semibold">Safety Resources</h3>
                        <p className="text-sm text-gray-600">Range safety guidelines</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('safety')}
                      className="w-full"
                    >
                      View Safety Guide
                    </Button>
                  </Card>
                </div>

                {/* Compliance Status */}
                <Card className="p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Compliance Status</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Age verification: {config?.minAge}+ required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Educational content only</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>App Store compliant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Strict privacy mode enabled</span>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form-detection">
            <FormDetection 
              mode={currentSession?.mode || 'live'}
              sport={currentSession?.sport || 'precision_shooting'}
              onSessionEnd={endSession}
            />
          </TabsContent>

          <TabsContent value="safety">
            <RangeOfficerCoach />
          </TabsContent>

          <TabsContent value="ranges">
            <GunRangeMap />
          </TabsContent>
        </Tabs>
      </div>
    </AgeGate>
  );
}; 