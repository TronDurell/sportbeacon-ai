import * as Sentry from '@sentry/nextjs';
import { remoteConfigService } from './remoteConfig';

interface GunCoachEvent {
  event: string;
  userId?: string;
  sessionId?: string;
  sport?: string;
  mode?: 'live' | 'upload' | 'tutorial';
  compliance?: {
    ageVerified: boolean;
    consentGiven: boolean;
    featureEnabled: boolean;
  };
  metadata?: Record<string, any>;
  timestamp: string;
}

interface GunCoachError {
  error: string;
  userId?: string;
  sessionId?: string;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance?: {
    ageVerified: boolean;
    consentGiven: boolean;
    featureEnabled: boolean;
  };
  metadata?: Record<string, any>;
  timestamp: string;
}

class SentryService {
  private isInitialized = false;
  private gunCoachEnabled = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Sentry with Gun Coach specific configuration
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 1.0,
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', 'sportbeacon.ai'],
          }),
        ],
        beforeSend: (event, hint) => {
          // Filter out sensitive information for Gun Coach events
          if (event.tags?.feature === 'gun_coach') {
            return this.sanitizeGunCoachEvent(event, hint);
          }
          return event;
        },
      });

      // Check if Gun Coach logging is enabled
      await remoteConfigService.initialize();
      this.gunCoachEnabled = remoteConfigService.isGunCoachLoggingEnabled();

      this.isInitialized = true;
      console.log('Sentry service initialized for Gun Coach');
    } catch (error) {
      console.error('Failed to initialize Sentry service:', error);
      this.isInitialized = true; // Continue without Sentry
    }
  }

  private sanitizeGunCoachEvent(event: any, hint: any): any {
    // Remove sensitive information from Gun Coach events
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    if (event.contexts?.device) {
      delete event.contexts.device.locale;
    }

    // Add compliance metadata
    event.tags = {
      ...event.tags,
      feature: 'gun_coach',
      compliance: 'enabled',
      educational_only: 'true'
    };

    return event;
  }

  // Log Gun Coach events
  logGunCoachEvent(eventData: Omit<GunCoachEvent, 'timestamp'>): void {
    if (!this.isInitialized || !this.gunCoachEnabled) return;

    const event: GunCoachEvent = {
      ...eventData,
      timestamp: new Date().toISOString()
    };

    Sentry.addBreadcrumb({
      category: 'gun_coach',
      message: event.event,
      level: 'info',
      data: {
        userId: event.userId,
        sessionId: event.sessionId,
        sport: event.sport,
        mode: event.mode,
        compliance: event.compliance
      }
    });

    Sentry.captureMessage(`Gun Coach: ${event.event}`, {
      level: 'info',
      tags: {
        feature: 'gun_coach',
        event_type: event.event,
        sport: event.sport,
        mode: event.mode
      },
      extra: {
        compliance: event.compliance,
        metadata: event.metadata
      }
    });
  }

  // Log Gun Coach errors
  logGunCoachError(errorData: Omit<GunCoachError, 'timestamp'>): void {
    if (!this.isInitialized || !this.gunCoachEnabled) return;

    const error: GunCoachError = {
      ...errorData,
      timestamp: new Date().toISOString()
    };

    Sentry.captureException(new Error(error.error), {
      level: this.mapSeverityToLevel(error.severity),
      tags: {
        feature: 'gun_coach',
        error_type: 'gun_coach_error',
        context: error.context,
        severity: error.severity
      },
      extra: {
        userId: error.userId,
        sessionId: error.sessionId,
        compliance: error.compliance,
        metadata: error.metadata
      }
    });
  }

  private mapSeverityToLevel(severity: string): Sentry.SeverityLevel {
    switch (severity) {
      case 'critical':
        return 'fatal';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'error';
    }
  }

  // Log age verification events
  logAgeVerification(userId: string, age: number, verified: boolean, method: string): void {
    this.logGunCoachEvent({
      event: 'age_verification',
      userId,
      compliance: {
        ageVerified: verified,
        consentGiven: false,
        featureEnabled: true
      },
      metadata: {
        age,
        verificationMethod: method,
        minRequiredAge: 21
      }
    });
  }

  // Log consent events
  logConsent(userId: string, sessionId: string, consentType: string, granted: boolean): void {
    this.logGunCoachEvent({
      event: 'consent_given',
      userId,
      sessionId,
      compliance: {
        ageVerified: true,
        consentGiven: granted,
        featureEnabled: true
      },
      metadata: {
        consentType,
        granted
      }
    });
  }

  // Log session events
  logSessionEvent(userId: string, sessionId: string, event: string, sport: string, mode: string): void {
    this.logGunCoachEvent({
      event: `session_${event}`,
      userId,
      sessionId,
      sport,
      mode: mode as 'live' | 'upload' | 'tutorial',
      compliance: {
        ageVerified: true,
        consentGiven: true,
        featureEnabled: true
      }
    });
  }

  // Log pose detection events
  logPoseDetection(userId: string, sessionId: string, success: boolean, error?: string): void {
    if (success) {
      this.logGunCoachEvent({
        event: 'pose_detection_success',
        userId,
        sessionId,
        metadata: {
          detectionType: 'shooting_form'
        }
      });
    } else {
      this.logGunCoachError({
        error: error || 'Pose detection failed',
        userId,
        sessionId,
        context: 'pose_detection',
        severity: 'medium',
        compliance: {
          ageVerified: true,
          consentGiven: true,
          featureEnabled: true
        }
      });
    }
  }

  // Log video upload events
  logVideoUpload(userId: string, sessionId: string, success: boolean, fileSize?: number, error?: string): void {
    if (success) {
      this.logGunCoachEvent({
        event: 'video_upload_success',
        userId,
        sessionId,
        metadata: {
          fileSize,
          uploadType: 'shooting_analysis'
        }
      });
    } else {
      this.logGunCoachError({
        error: error || 'Video upload failed',
        userId,
        sessionId,
        context: 'video_upload',
        severity: 'medium',
        compliance: {
          ageVerified: true,
          consentGiven: true,
          featureEnabled: true
        }
      });
    }
  }

  // Log compliance violations
  logComplianceViolation(userId: string, violation: string, details: any): void {
    this.logGunCoachError({
      error: `Compliance violation: ${violation}`,
      userId,
      context: 'compliance',
      severity: 'high',
      compliance: {
        ageVerified: false,
        consentGiven: false,
        featureEnabled: false
      },
      metadata: {
        violation,
        details
      }
    });
  }

  // Log feature access attempts
  logFeatureAccess(userId: string, granted: boolean, reason?: string): void {
    this.logGunCoachEvent({
      event: 'feature_access',
      userId,
      compliance: {
        ageVerified: granted,
        consentGiven: granted,
        featureEnabled: granted
      },
      metadata: {
        granted,
        reason
      }
    });
  }

  // Log configuration changes
  logConfigChange(configKey: string, oldValue: any, newValue: any): void {
    this.logGunCoachEvent({
      event: 'config_change',
      metadata: {
        configKey,
        oldValue,
        newValue,
        changeType: 'remote_config'
      }
    });
  }

  // Set user context for Gun Coach sessions
  setGunCoachUserContext(userId: string, age: number, verified: boolean): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: userId,
      age: age,
      verified: verified
    });

    Sentry.setTag('gun_coach_user', 'true');
    Sentry.setTag('age_verified', verified.toString());
    Sentry.setTag('user_age', age.toString());
  }

  // Set session context for Gun Coach
  setGunCoachSessionContext(sessionId: string, sport: string, mode: string): void {
    if (!this.isInitialized) return;

    Sentry.setContext('gun_coach_session', {
      sessionId,
      sport,
      mode,
      startTime: new Date().toISOString()
    });

    Sentry.setTag('session_id', sessionId);
    Sentry.setTag('sport', sport);
    Sentry.setTag('mode', mode);
  }

  // Clear Gun Coach context
  clearGunCoachContext(): void {
    if (!this.isInitialized) return;

    Sentry.setUser(null);
    Sentry.setContext('gun_coach_session', null);
    Sentry.setTag('gun_coach_user', null);
    Sentry.setTag('session_id', null);
  }
}

// Create singleton instance
export const sentryService = new SentryService();

// Initialize on module load
sentryService.initialize().catch(console.error);

export default sentryService; 