import crypto from 'crypto';

interface EnvironmentConfig {
  // Firebase Frontend
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
  NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;

  // Firebase Backend
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_STORAGE_BUCKET: string;
  FIREBASE_MESSAGING_SENDER_ID: string;
  FIREBASE_APP_ID: string;

  // Security
  JWT_SECRET: string;
  ADMIN_TOKEN: string;

  // External Services
  STRIPE_SECRET_KEY: string;
  OPENAI_API_KEY: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // Optional Services
  SLACK_BOT_TOKEN?: string;
  SLACK_SIGNING_SECRET?: string;
  GITHUB_TOKEN?: string;
  WEATHER_API_KEY?: string;
}

class EnvironmentValidator {
  private config: EnvironmentConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.config = this.loadConfig();
    this.validate();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Firebase Frontend
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,

      // Firebase Backend
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || '',
      FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || '',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
      FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '',

      // Security
      JWT_SECRET: process.env.JWT_SECRET || '',
      ADMIN_TOKEN: process.env.ADMIN_TOKEN || '',

      // External Services
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',

      // Optional Services
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      WEATHER_API_KEY: process.env.WEATHER_API_KEY,
    };
  }

  private validate(): void {
    const requiredKeys = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
      'JWT_SECRET',
      'ADMIN_TOKEN',
    ];

    const missingKeys = requiredKeys.filter(key => {
      const value = this.config[key as keyof EnvironmentConfig];
      return !value || value === 'your_' + key.toLowerCase().replace(/_/g, '_') || value.includes('your_');
    });

    if (missingKeys.length > 0) {
      const errorMessage = `Missing or invalid environment variables: ${missingKeys.join(', ')}. Please check your environment configuration.`;
      
      if (this.isProduction) {
        throw new Error(errorMessage);
      } else {
        }
    }

    // Validate Firebase project ID format
    if (this.config.NEXT_PUBLIC_FIREBASE_PROJECT_ID && 
        !this.config.NEXT_PUBLIC_FIREBASE_PROJECT_ID.match(/^[a-z0-9-]+$/)) {
      throw new Error('Invalid Firebase project ID format');
    }

    // Validate JWT secret strength
    if (this.config.JWT_SECRET && this.config.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isConfigValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }

  public static generateSecureSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public static generateJWTSecret(): string {
    return this.generateSecureSecret(64);
  }

  public static generateAdminToken(): string {
    return this.generateSecureSecret(32);
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator();
export const envConfig = envValidator.getConfig();

// Export helper functions
export const { generateSecureSecret, generateJWTSecret, generateAdminToken } = EnvironmentValidator;

// Type exports
export type { EnvironmentConfig }; 