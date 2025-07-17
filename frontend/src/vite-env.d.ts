/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_ANTHROPIC_API_KEY?: string
  readonly VITE_GOOGLE_AI_API_KEY?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_SECRET_KEY?: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  readonly VITE_GOOGLE_ANALYTICS_ID?: string
  readonly VITE_MIXPANEL_TOKEN?: string
  readonly VITE_TWILIO_ACCOUNT_SID?: string
  readonly VITE_TWILIO_AUTH_TOKEN?: string
  readonly VITE_SENDGRID_API_KEY?: string
  readonly VITE_ENABLE_AI_COACH: string
  readonly VITE_ENABLE_SCOUT_EVAL: string
  readonly VITE_ENABLE_RANGE_OFFICER: string
  readonly VITE_ENABLE_TOWN_REC: string
  readonly VITE_ENABLE_COMMERCE: string
  readonly VITE_ENABLE_SOCIAL_FEED: string
  readonly VITE_APP_ENVIRONMENT: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_BUILD_NUMBER: string
  readonly VITE_DEBUG_MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 