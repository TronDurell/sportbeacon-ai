/**
 * Runtime Environment Validation
 * Checks for required environment variables and halts execution if missing
 */

// Runtime environment variable validation
const requiredEnvVars = [
  'REACT_APP_API_URL',
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
] as const;

export interface EnvironmentConfig {
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  sentry?: {
    dsn: string;
    environment: string;
    release: string;
  };
  stripe?: {
    publishableKey: string;
  };
  sendgrid?: {
    apiKey: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
}

export function validateEnvironment(): EnvironmentConfig {
  const missingVars = requiredEnvVars
    .map(varName => [varName, process.env[varName]])
    .filter(([_key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  const config: EnvironmentConfig = {
    apiUrl: process.env.REACT_APP_API_URL!,
    firebase: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.REACT_APP_FIREBASE_APP_ID!
    }
  };

  // Optional Sentry configuration
  if (process.env.REACT_APP_SENTRY_DSN && process.env.REACT_APP_ENABLE_SENTRY === 'true') {
    config.sentry = {
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.REACT_APP_SENTRY_ENVIRONMENT || 'development',
      release: process.env.REACT_APP_SENTRY_RELEASE || 'v1.0.0'
    };
  }

  // Optional Stripe configuration
  if (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY) {
    config.stripe = {
      publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
    };
  }

  // Optional SendGrid configuration
  if (process.env.REACT_APP_SENDGRID_API_KEY) {
    config.sendgrid = {
      apiKey: process.env.REACT_APP_SENDGRID_API_KEY
    };
  }

  // Optional Twilio configuration
  if (process.env.REACT_APP_TWILIO_ACCOUNT_SID && process.env.REACT_APP_TWILIO_AUTH_TOKEN) {
    config.twilio = {
      accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
      authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.REACT_APP_TWILIO_PHONE_NUMBER || ''
    };
  }

  return config;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    // Return a minimal config for development
    return {
      apiUrl: 'http://localhost:3001/api',
      firebase: {
        apiKey: process.env.API_KEY || 'mock-api-key',
        authDomain: 'mock-auth-domain',
        projectId: 'mock-project-id',
        storageBucket: 'mock-storage-bucket',
        messagingSenderId: 'mock-sender-id',
        appId: 'mock-app-id'
      }
    };
  }
} 