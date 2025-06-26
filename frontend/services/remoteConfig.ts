import { getRemoteConfig, getValue, fetchAndActivate, RemoteConfig } from 'firebase/remote-config';
import { app } from '@/lib/firebase';

// Initialize Remote Config
const remoteConfig = getRemoteConfig(app);

// Set minimum fetch interval for development (0 for production)
remoteConfig.settings.minimumFetchIntervalMillis = 0;

// Default values for feature flags
remoteConfig.defaultConfig = {
  'isGunCoachEnabled': 'false',
  'gunCoachMinAge': '21',
  'gunCoachConsentRequired': 'true',
  'gunCoachVideoProcessing': 'true',
  'gunCoachPoseDetection': 'true',
  'gunCoachRangeMapping': 'true',
  'gunCoachSafetyContent': 'true',
  'gunCoachEducationalOnly': 'true',
  'gunCoachLegalDisclaimer': 'This feature provides educational content for shooting sports training. All content is for educational purposes only. Users must comply with all local, state, and federal laws regarding firearms and shooting sports. SportBeaconAI does not promote or sell firearms.',
  'gunCoachAppStoreCompliant': 'true',
  'gunCoachContentRating': '17+',
  'gunCoachRequiresVerification': 'true',
  'gunCoachLoggingEnabled': 'true',
  'gunCoachAnalyticsEnabled': 'true',
  'gunCoachPrivacyMode': 'strict',
  'gunCoachDataRetention': '30', // days
  'gunCoachConsentFlow': 'explicit',
  'gunCoachAgeVerification': 'required',
  'gunCoachContentFiltering': 'strict',
  'gunCoachSafetyChecks': 'enabled'
};

export interface GunCoachConfig {
  isEnabled: boolean;
  minAge: number;
  consentRequired: boolean;
  videoProcessing: boolean;
  poseDetection: boolean;
  rangeMapping: boolean;
  safetyContent: boolean;
  educationalOnly: boolean;
  legalDisclaimer: string;
  appStoreCompliant: boolean;
  contentRating: string;
  requiresVerification: boolean;
  loggingEnabled: boolean;
  analyticsEnabled: boolean;
  privacyMode: 'strict' | 'standard' | 'relaxed';
  dataRetention: number;
  consentFlow: 'explicit' | 'implicit' | 'none';
  ageVerification: 'required' | 'optional' | 'none';
  contentFiltering: 'strict' | 'moderate' | 'minimal';
  safetyChecks: 'enabled' | 'disabled';
}

class RemoteConfigService {
  private config: RemoteConfig;
  private isInitialized = false;

  constructor() {
    this.config = remoteConfig;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await fetchAndActivate(this.config);
      this.isInitialized = true;
      console.log('Remote Config initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Remote Config:', error);
      // Continue with default values
      this.isInitialized = true;
    }
  }

  private getStringValue(key: string): string {
    try {
      return getValue(this.config, key).asString();
    } catch (error) {
      console.error(`Error getting Remote Config value for ${key}:`, error);
      return this.config.defaultConfig[key] || '';
    }
  }

  private getBooleanValue(key: string): boolean {
    try {
      return getValue(this.config, key).asBoolean();
    } catch (error) {
      console.error(`Error getting Remote Config boolean value for ${key}:`, error);
      return this.config.defaultConfig[key] === 'true';
    }
  }

  private getNumberValue(key: string): number {
    try {
      return getValue(this.config, key).asNumber();
    } catch (error) {
      console.error(`Error getting Remote Config number value for ${key}:`, error);
      return parseInt(this.config.defaultConfig[key] || '0', 10);
    }
  }

  // Gun Coach specific configuration
  getGunCoachConfig(): GunCoachConfig {
    return {
      isEnabled: this.getBooleanValue('isGunCoachEnabled'),
      minAge: this.getNumberValue('gunCoachMinAge'),
      consentRequired: this.getBooleanValue('gunCoachConsentRequired'),
      videoProcessing: this.getBooleanValue('gunCoachVideoProcessing'),
      poseDetection: this.getBooleanValue('gunCoachPoseDetection'),
      rangeMapping: this.getBooleanValue('gunCoachRangeMapping'),
      safetyContent: this.getBooleanValue('gunCoachSafetyContent'),
      educationalOnly: this.getBooleanValue('gunCoachEducationalOnly'),
      legalDisclaimer: this.getStringValue('gunCoachLegalDisclaimer'),
      appStoreCompliant: this.getBooleanValue('gunCoachAppStoreCompliant'),
      contentRating: this.getStringValue('gunCoachContentRating'),
      requiresVerification: this.getBooleanValue('gunCoachRequiresVerification'),
      loggingEnabled: this.getBooleanValue('gunCoachLoggingEnabled'),
      analyticsEnabled: this.getBooleanValue('gunCoachAnalyticsEnabled'),
      privacyMode: this.getStringValue('gunCoachPrivacyMode') as GunCoachConfig['privacyMode'],
      dataRetention: this.getNumberValue('gunCoachDataRetention'),
      consentFlow: this.getStringValue('gunCoachConsentFlow') as GunCoachConfig['consentFlow'],
      ageVerification: this.getStringValue('gunCoachAgeVerification') as GunCoachConfig['ageVerification'],
      contentFiltering: this.getStringValue('gunCoachContentFiltering') as GunCoachConfig['contentFiltering'],
      safetyChecks: this.getStringValue('gunCoachSafetyChecks') as GunCoachConfig['safetyChecks']
    };
  }

  // Check if Gun Coach feature is enabled
  isGunCoachEnabled(): boolean {
    return this.getBooleanValue('isGunCoachEnabled');
  }

  // Get minimum age for Gun Coach
  getGunCoachMinAge(): number {
    return this.getNumberValue('gunCoachMinAge');
  }

  // Check if consent is required
  isGunCoachConsentRequired(): boolean {
    return this.getBooleanValue('gunCoachConsentRequired');
  }

  // Check if video processing is enabled
  isGunCoachVideoProcessingEnabled(): boolean {
    return this.getBooleanValue('gunCoachVideoProcessing');
  }

  // Check if pose detection is enabled
  isGunCoachPoseDetectionEnabled(): boolean {
    return this.getBooleanValue('gunCoachPoseDetection');
  }

  // Check if range mapping is enabled
  isGunCoachRangeMappingEnabled(): boolean {
    return this.getBooleanValue('gunCoachRangeMapping');
  }

  // Check if safety content is enabled
  isGunCoachSafetyContentEnabled(): boolean {
    return this.getBooleanValue('gunCoachSafetyContent');
  }

  // Check if educational only mode is enabled
  isGunCoachEducationalOnly(): boolean {
    return this.getBooleanValue('gunCoachEducationalOnly');
  }

  // Get legal disclaimer
  getGunCoachLegalDisclaimer(): string {
    return this.getStringValue('gunCoachLegalDisclaimer');
  }

  // Check if app store compliant
  isGunCoachAppStoreCompliant(): boolean {
    return this.getBooleanValue('gunCoachAppStoreCompliant');
  }

  // Get content rating
  getGunCoachContentRating(): string {
    return this.getStringValue('gunCoachContentRating');
  }

  // Check if verification is required
  isGunCoachVerificationRequired(): boolean {
    return this.getBooleanValue('gunCoachRequiresVerification');
  }

  // Check if logging is enabled
  isGunCoachLoggingEnabled(): boolean {
    return this.getBooleanValue('gunCoachLoggingEnabled');
  }

  // Check if analytics is enabled
  isGunCoachAnalyticsEnabled(): boolean {
    return this.getBooleanValue('gunCoachAnalyticsEnabled');
  }

  // Get privacy mode
  getGunCoachPrivacyMode(): 'strict' | 'standard' | 'relaxed' {
    return this.getStringValue('gunCoachPrivacyMode') as 'strict' | 'standard' | 'relaxed';
  }

  // Get data retention period
  getGunCoachDataRetention(): number {
    return this.getNumberValue('gunCoachDataRetention');
  }

  // Get consent flow type
  getGunCoachConsentFlow(): 'explicit' | 'implicit' | 'none' {
    return this.getStringValue('gunCoachConsentFlow') as 'explicit' | 'implicit' | 'none';
  }

  // Get age verification requirement
  getGunCoachAgeVerification(): 'required' | 'optional' | 'none' {
    return this.getStringValue('gunCoachAgeVerification') as 'required' | 'optional' | 'none';
  }

  // Get content filtering level
  getGunCoachContentFiltering(): 'strict' | 'moderate' | 'minimal' {
    return this.getStringValue('gunCoachContentFiltering') as 'strict' | 'moderate' | 'minimal';
  }

  // Get safety checks status
  getGunCoachSafetyChecks(): 'enabled' | 'disabled' {
    return this.getStringValue('gunCoachSafetyChecks') as 'enabled' | 'disabled';
  }

  // Validate Gun Coach configuration for compliance
  validateGunCoachCompliance(): {
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  } {
    const config = this.getGunCoachConfig();
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check critical compliance requirements
    if (!config.isEnabled) {
      issues.push('Gun Coach feature is disabled');
    }

    if (config.minAge < 21) {
      issues.push('Minimum age must be 21 or higher for Gun Coach feature');
    }

    if (!config.consentRequired) {
      issues.push('Consent is required for Gun Coach feature');
    }

    if (!config.educationalOnly) {
      issues.push('Gun Coach must be educational only');
    }

    if (!config.appStoreCompliant) {
      issues.push('Gun Coach must be App Store compliant');
    }

    if (!config.requiresVerification) {
      issues.push('Age verification is required for Gun Coach feature');
    }

    if (config.privacyMode !== 'strict') {
      warnings.push('Consider using strict privacy mode for Gun Coach feature');
    }

    if (config.contentFiltering !== 'strict') {
      warnings.push('Consider using strict content filtering for Gun Coach feature');
    }

    if (config.dataRetention > 30) {
      warnings.push('Consider shorter data retention for Gun Coach feature');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings
    };
  }

  // Log configuration for audit purposes
  logGunCoachConfiguration(): void {
    if (!this.isGunCoachLoggingEnabled()) return;

    const config = this.getGunCoachConfig();
    const compliance = this.validateGunCoachCompliance();

    console.log('Gun Coach Configuration:', {
      config,
      compliance,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });

    // Send to analytics if enabled
    if (this.isGunCoachAnalyticsEnabled()) {
      // This would typically send to your analytics service
      // For now, we'll just log it
      console.log('Gun Coach Analytics Event:', {
        event: 'gun_coach_config_loaded',
        config: config,
        compliance: compliance
      });
    }
  }
}

// Create singleton instance
export const remoteConfigService = new RemoteConfigService();

// Initialize on module load
remoteConfigService.initialize().catch(console.error);

export default remoteConfigService; 