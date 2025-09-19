/**
 * Environment Validation Utilities
 * Ensures all required environment variables are properly loaded and validated
 */
class EnvironmentValidator {
    static instance;
    config = {};
    validationCache = null;
    static getInstance() {
        if (!EnvironmentValidator.instance) {
            EnvironmentValidator.instance = new EnvironmentValidator();
        }
        return EnvironmentValidator.instance;
    }
    /**
     * Validate all environment variables and return configuration
     */
    validateEnvironment() {
        if (this.validationCache) {
            return this.validationCache;
        }
        const errors = [];
        const warnings = [];
        const missing = [];
        // Firebase Configuration (Required)
        const firebaseConfig = this.validateFirebaseConfig();
        if (firebaseConfig.errors.length > 0) {
            errors.push(...firebaseConfig.errors);
            missing.push(...firebaseConfig.missing);
        }
        else {
            this.config.firebase = firebaseConfig.config;
        }
        // AI Services Configuration
        const aiConfig = this.validateAIConfig();
        if (aiConfig.errors.length > 0) {
            errors.push(...aiConfig.errors);
        }
        this.config.ai = aiConfig.config;
        // Payment Configuration
        const paymentConfig = this.validatePaymentConfig();
        if (paymentConfig.errors.length > 0) {
            errors.push(...paymentConfig.errors);
        }
        this.config.payments = paymentConfig.config;
        // Monitoring Configuration
        const monitoringConfig = this.validateMonitoringConfig();
        this.config.monitoring = monitoringConfig.config;
        // Analytics Configuration
        const analyticsConfig = this.validateAnalyticsConfig();
        this.config.analytics = analyticsConfig.config;
        // External Services Configuration
        const servicesConfig = this.validateServicesConfig();
        this.config.services = servicesConfig.config;
        // Feature Flags
        this.config.features = this.validateFeatureFlags();
        // App Configuration
        this.config.app = this.validateAppConfig();
        // Environment-specific validations
        this.validateEnvironmentSpecific(errors, warnings);
        const result = {
            isValid: errors.length === 0,
            errors,
            warnings,
            missing,
            config: this.config
        };
        this.validationCache = result;
        return result;
    }
    validateFirebaseConfig() {
        const errors = [];
        const missing = [];
        const config = {};
        const requiredKeys = [
            "VITE_FIREBASE_API_KEY",
            "VITE_FIREBASE_AUTH_DOMAIN",
            "VITE_FIREBASE_PROJECT_ID",
            "VITE_FIREBASE_STORAGE_BUCKET",
            "VITE_FIREBASE_MESSAGING_SENDER_ID",
            "VITE_FIREBASE_APP_ID"
        ];
        requiredKeys.forEach(key => {
            const value = import.meta.env[key];
            if (!value) {
                missing.push(key);
                errors.push(`Missing required Firebase configuration: ${key}`);
            }
            else {
                config[key.replace("VITE_FIREBASE_", "").toLowerCase()] = value;
            }
        });
        return { errors, missing, config };
    }
    validateAIConfig() {
        const errors = [];
        const config = {};
        // OpenAI API Key (Required)
        const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!openaiKey) {
            errors.push("Missing OpenAI API key - AI features will be disabled");
        }
        else {
            config.openaiApiKey = openaiKey;
        }
        // Optional AI services
        const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
        if (anthropicKey) {
            config.anthropicApiKey = anthropicKey;
        }
        const googleAiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
        if (googleAiKey) {
            config.googleAiApiKey = googleAiKey;
        }
        return { errors, config };
    }
    validatePaymentConfig() {
        const errors = [];
        const config = {};
        // Stripe Configuration
        const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!stripePublishableKey) {
            errors.push("Missing Stripe publishable key - payment features will be disabled");
        }
        else {
            config.stripePublishableKey = stripePublishableKey;
        }
        const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
        if (stripeSecretKey) {
            config.stripeSecretKey = stripeSecretKey;
        }
        return { errors, config };
    }
    validateMonitoringConfig() {
        const config = {};
        const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
        if (sentryDsn) {
            config.sentryDsn = sentryDsn;
        }
        const sentryEnvironment = import.meta.env.VITE_SENTRY_ENVIRONMENT;
        if (sentryEnvironment) {
            config.sentryEnvironment = sentryEnvironment;
        }
        return { config };
    }
    validateAnalyticsConfig() {
        const config = {};
        const googleAnalyticsId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
        if (googleAnalyticsId) {
            config.googleAnalyticsId = googleAnalyticsId;
        }
        const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;
        if (mixpanelToken) {
            config.mixpanelToken = mixpanelToken;
        }
        return { config };
    }
    validateServicesConfig() {
        const config = {};
        const twilioAccountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
        if (twilioAccountSid) {
            config.twilioAccountSid = twilioAccountSid;
        }
        const twilioAuthToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
        if (twilioAuthToken) {
            config.twilioAuthToken = twilioAuthToken;
        }
        const sendgridApiKey = import.meta.env.VITE_SENDGRID_API_KEY;
        if (sendgridApiKey) {
            config.sendgridApiKey = sendgridApiKey;
        }
        return { config };
    }
    validateFeatureFlags() {
        return {
            enableAiCoach: this.parseBoolean(import.meta.env.VITE_ENABLE_AI_COACH, true),
            enableScoutEval: this.parseBoolean(import.meta.env.VITE_ENABLE_SCOUT_EVAL, true),
            enableRangeOfficer: this.parseBoolean(import.meta.env.VITE_ENABLE_RANGE_OFFICER, false),
            enableTownRec: this.parseBoolean(import.meta.env.VITE_ENABLE_TOWN_REC, true),
            enableCommerce: this.parseBoolean(import.meta.env.VITE_ENABLE_COMMERCE, true),
            enableSocialFeed: this.parseBoolean(import.meta.env.VITE_ENABLE_SOCIAL_FEED, true)
        };
    }
    validateAppConfig() {
        const environment = import.meta.env.VITE_APP_ENVIRONMENT || "development";
        const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
        const buildNumber = import.meta.env.VITE_APP_BUILD_NUMBER || "1";
        const debugMode = this.parseBoolean(import.meta.env.VITE_DEBUG_MODE, environment === "development");
        return {
            environment: environment,
            version,
            buildNumber,
            debugMode
        };
    }
    validateEnvironmentSpecific(errors, warnings) {
        const environment = import.meta.env.VITE_APP_ENVIRONMENT || "development";
        // Production-specific validations
        if (environment === "production") {
            if (!import.meta.env.VITE_SENTRY_DSN) {
                warnings.push("Sentry DSN not configured - error monitoring will be disabled in production");
            }
            if (!import.meta.env.VITE_GOOGLE_ANALYTICS_ID) {
                warnings.push("Google Analytics not configured - analytics will be disabled in production");
            }
            if (import.meta.env.VITE_DEBUG_MODE === "true") {
                warnings.push("Debug mode is enabled in production - consider disabling for security");
            }
        }
        // Development-specific validations
        if (environment === "development") {
            if (!import.meta.env.VITE_DEBUG_MODE) {
                warnings.push("Debug mode not explicitly set in development");
            }
        }
    }
    parseBoolean(value, defaultValue) {
        if (!value)
            return defaultValue;
        return value.toLowerCase() === "true";
    }
    /**
     * Get validated configuration
     */
    getConfig() {
        const validation = this.validateEnvironment();
        return validation.config;
    }
    /**
     * Check if a specific feature is enabled
     */
    isFeatureEnabled(feature) {
        const config = this.getConfig();
        return config.features?.[feature] || false;
    }
    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
        const config = this.getConfig();
        return {
            environment: config.app?.environment,
            debugMode: config.app?.debugMode,
            version: config.app?.version
        };
    }
    /**
     * Clear validation cache (useful for testing)
     */
    clearCache() {
        this.validationCache = null;
    }
    /**
     * Log validation results to console
     */
    logValidationResults() {
        const validation = this.validateEnvironment();
        console.group("🔧 Environment Validation Results");
        if (validation.isValid) {
            console.log("✅ Environment validation passed");
        }
        else {
            validation.errors.forEach(error => console.error("❌ Error:", error));
        }
        if (validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.warn("⚠️ Warning:", warning));
        }
        if (validation.missing.length > 0) {
            validation.missing.forEach(missing => console.info("ℹ️ Missing:", missing));
        }
        console.groupEnd();
    }
    /**
     * Validate specific environment variable
     */
    validateVariable(key, required = false) {
        const value = import.meta.env[key];
        if (!value && required) {
            return {
                isValid: false,
                error: `Required environment variable ${key} is missing`
            };
        }
        if (!value) {
            return {
                isValid: false,
                error: `Environment variable ${key} is not set`
            };
        }
        return {
            isValid: true,
            value
        };
    }
    /**
     * Get all environment variables (for debugging)
     */
    getAllEnvironmentVariables() {
        const env = {};
        // Get all VITE_ prefixed environment variables
        Object.keys(import.meta.env).forEach(key => {
            if (key.startsWith("VITE_")) {
                env[key] = import.meta.env[key];
            }
        });
        return env;
    }
}
// Export singleton instance
export const environmentValidator = EnvironmentValidator.getInstance();
// Export convenience functions
export const validateEnvironment = () => environmentValidator.validateEnvironment();
export const getConfig = () => environmentValidator.getConfig();
export const isFeatureEnabled = (feature) => environmentValidator.isFeatureEnabled(feature);
export const getEnvironmentConfig = () => environmentValidator.getEnvironmentConfig();
export const logValidationResults = () => environmentValidator.logValidationResults();
