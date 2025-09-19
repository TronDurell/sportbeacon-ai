import axios from 'axios';
/**
 * Secure HTTP client wrapper with security-focused defaults
 * Replaces raw axios usage with hardened configuration
 */
export const http = axios.create({
    timeout: 10000,
    maxBodyLength: 2_000_000,
    maxContentLength: 2_000_000,
    transitional: {
        clarifyTimeoutError: true
    },
    // Security headers
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    // Validate status codes
    validateStatus: (status) => status >= 200 && status < 300
});
// Request interceptor for adding auth tokens
http.interceptors.request.use((config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// Response interceptor for error handling
http.interceptors.response.use((response) => response, (error) => {
    // Log security-relevant errors
    if (error.response?.status === 401) {
        console.warn('Authentication required');
        // Could trigger auth flow here
    }
    if (error.response?.status === 403) {
        console.warn('Access forbidden');
    }
    return Promise.reject(error);
});
// Export individual methods for convenience
export const { get, post, put, patch, delete: del } = http;
export default http;
