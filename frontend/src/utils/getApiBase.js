/**
 * API Base URL utility for SportBeaconAI
 * Handles environment-based API URL resolution with fallbacks
 */
export function getApiBase() {
    // Check for environment variable first
    const envApiBase = import.meta.env.VITE_API_BASE;
    if (envApiBase) {
        return envApiBase;
    }
    // Check for legacy environment variable
    const legacyApiBase = import.meta.env.VITE_API_URL;
    if (legacyApiBase) {
        return legacyApiBase;
    }
    // Production fallback to deployed Functions
    if (import.meta.env.PROD) {
        return 'https://us-central1-sportbeacon-ai.cloudfunctions.net';
    }
    // Development fallback to localhost
    if (import.meta.env.DEV) {
        return 'http://localhost:5001/sportbeacon-ai/us-central1';
    }
    // Default fallback
    return '/api';
}
export function getHealthCheckUrl() {
    const baseUrl = getApiBase();
    return `${baseUrl}/health`;
}
export function getApiUrl(endpoint) {
    const baseUrl = getApiBase();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${baseUrl}/${cleanEndpoint}`;
}
