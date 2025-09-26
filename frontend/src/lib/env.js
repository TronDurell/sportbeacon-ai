/**
 * Environment variable utilities for SEL feed configuration
 */
/**
 * Parse a number from environment variable with fallback
 */
export function numberFromEnv(key, defaultValue) {
    const value = import.meta.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    const parsed = Number(value);
    if (isNaN(parsed)) {
        console.warn(`Invalid number for ${key}: ${value}, using default: ${defaultValue}`);
        return defaultValue;
    }
    return parsed;
}
/**
 * Parse a boolean from environment variable with fallback
 */
export function booleanFromEnv(key, defaultValue) {
    const value = import.meta.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    return value.toLowerCase() === 'true';
}
/**
 * Parse a string from environment variable with fallback
 */
export function stringFromEnv(key, defaultValue) {
    const value = import.meta.env[key];
    return value || defaultValue;
}
/**
 * SEL Feed Configuration from environment variables
 */
export const SEL_CONFIG = {
    // Weight for SEL (resilience) scoring (0-1)
    selWeight: numberFromEnv('VITE_SEL_WEIGHT', 0.35),
    // Weight for engagement scoring (0-1) 
    engagementWeight: numberFromEnv('VITE_ENGAGEMENT_WEIGHT', 0.55),
    // Half-life for recency decay in hours
    recencyHalfLifeHours: numberFromEnv('VITE_RECENCY_HALF_LIFE_HOURS', 24),
    // Feature flag for SEL blend
    selBlendEnabled: booleanFromEnv('VITE_SEL_BLEND_ENABLED', true),
    // A/B testing variant
    abVariant: stringFromEnv('VITE_AB_VARIANT', 'C'),
    // Analytics endpoint
    analyticsEndpoint: stringFromEnv('VITE_ANALYTICS_ENDPOINT', '/api/analytics'),
    // Debug mode
    debug: booleanFromEnv('VITE_DEBUG', false)
};
/**
 * Calculate recency weight using exponential decay
 */
export function calculateRecencyWeight(hoursSincePost, halfLifeHours = SEL_CONFIG.recencyHalfLifeHours) {
    return Math.exp(-hoursSincePost / halfLifeHours);
}
/**
 * Get final blended score using environment-configured weights
 */
export function calculateBlendedScore(selScore, engagementScore, hoursSincePost) {
    const recencyWeight = calculateRecencyWeight(hoursSincePost);
    const sel = selScore * SEL_CONFIG.selWeight;
    const engagement = engagementScore * SEL_CONFIG.engagementWeight;
    const recency = recencyWeight * 0.10; // Fixed 10% for recency
    const finalScore = sel + engagement + recency;
    return {
        finalScore,
        breakdown: {
            sel,
            engagement,
            recency
        }
    };
}
/**
 * Log configuration for debugging
 */
export function logSELConfig() {
    if (SEL_CONFIG.debug) {
        console.log('SEL Feed Configuration:', {
            selWeight: SEL_CONFIG.selWeight,
            engagementWeight: SEL_CONFIG.engagementWeight,
            recencyHalfLifeHours: SEL_CONFIG.recencyHalfLifeHours,
            selBlendEnabled: SEL_CONFIG.selBlendEnabled,
            abVariant: SEL_CONFIG.abVariant
        });
    }
}
