/**
 * Feature Flags for SportBeaconAI
 * Controls the rollout of agentic features
 */
/**
 * Get feature flags from environment variables or localStorage
 */
export function getFeatureFlags() {
    // Check environment variables first
    const envFlags = {
        AGENTS_ENABLED: process.env.REACT_APP_AGENTS_ENABLED === 'true',
        MCP_ENABLED: process.env.REACT_APP_MCP_ENABLED === 'true',
        ASSISTANT_ENABLED: process.env.REACT_APP_ASSISTANT_ENABLED === 'true',
        VOICE_ASSISTANT_ENABLED: process.env.REACT_APP_VOICE_ASSISTANT_ENABLED === 'true',
        BACKGROUND_AGENTS_ENABLED: process.env.REACT_APP_BACKGROUND_AGENTS_ENABLED === 'true',
        AGENT_ANALYTICS_ENABLED: process.env.REACT_APP_AGENT_ANALYTICS_ENABLED === 'true'
    };
    // Check localStorage for overrides
    const localStorageFlags = {
        AGENTS_ENABLED: localStorage.getItem('feature_agents_enabled') === 'true',
        MCP_ENABLED: localStorage.getItem('feature_mcp_enabled') === 'true',
        ASSISTANT_ENABLED: localStorage.getItem('feature_assistant_enabled') === 'true',
        VOICE_ASSISTANT_ENABLED: localStorage.getItem('feature_voice_assistant_enabled') === 'true',
        BACKGROUND_AGENTS_ENABLED: localStorage.getItem('feature_background_agents_enabled') === 'true',
        AGENT_ANALYTICS_ENABLED: localStorage.getItem('feature_agent_analytics_enabled') === 'true'
    };
    // Merge flags (localStorage overrides env vars)
    return {
        AGENTS_ENABLED: localStorageFlags.AGENTS_ENABLED || envFlags.AGENTS_ENABLED,
        MCP_ENABLED: localStorageFlags.MCP_ENABLED || envFlags.MCP_ENABLED,
        ASSISTANT_ENABLED: localStorageFlags.ASSISTANT_ENABLED || envFlags.ASSISTANT_ENABLED,
        VOICE_ASSISTANT_ENABLED: localStorageFlags.VOICE_ASSISTANT_ENABLED || envFlags.VOICE_ASSISTANT_ENABLED,
        BACKGROUND_AGENTS_ENABLED: localStorageFlags.BACKGROUND_AGENTS_ENABLED || envFlags.BACKGROUND_AGENTS_ENABLED,
        AGENT_ANALYTICS_ENABLED: localStorageFlags.AGENT_ANALYTICS_ENABLED || envFlags.AGENT_ANALYTICS_ENABLED
    };
}
/**
 * Set a feature flag in localStorage
 */
export function setFeatureFlag(flag, value) {
    localStorage.setItem(`feature_${flag.toLowerCase()}`, value.toString());
}
/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(flag) {
    const flags = getFeatureFlags();
    return flags[flag];
}
/**
 * Get feature flag status for debugging
 */
export function getFeatureFlagStatus() {
    const envFlags = {
        AGENTS_ENABLED: process.env.REACT_APP_AGENTS_ENABLED === 'true',
        MCP_ENABLED: process.env.REACT_APP_MCP_ENABLED === 'true',
        ASSISTANT_ENABLED: process.env.REACT_APP_ASSISTANT_ENABLED === 'true',
        VOICE_ASSISTANT_ENABLED: process.env.REACT_APP_VOICE_ASSISTANT_ENABLED === 'true',
        BACKGROUND_AGENTS_ENABLED: process.env.REACT_APP_BACKGROUND_AGENTS_ENABLED === 'true',
        AGENT_ANALYTICS_ENABLED: process.env.REACT_APP_AGENT_ANALYTICS_ENABLED === 'true'
    };
    const localStorageFlags = {
        AGENTS_ENABLED: localStorage.getItem('feature_agents_enabled') === 'true',
        MCP_ENABLED: localStorage.getItem('feature_mcp_enabled') === 'true',
        ASSISTANT_ENABLED: localStorage.getItem('feature_assistant_enabled') === 'true',
        VOICE_ASSISTANT_ENABLED: localStorage.getItem('feature_voice_assistant_enabled') === 'true',
        BACKGROUND_AGENTS_ENABLED: localStorage.getItem('feature_background_agents_enabled') === 'true',
        AGENT_ANALYTICS_ENABLED: localStorage.getItem('feature_agent_analytics_enabled') === 'true'
    };
    const result = {};
    Object.keys(envFlags).forEach(flag => {
        const key = flag;
        if (localStorageFlags[key]) {
            result[flag] = { enabled: true, source: 'localStorage' };
        }
        else if (envFlags[key]) {
            result[flag] = { enabled: true, source: 'env' };
        }
        else {
            result[flag] = { enabled: false, source: 'default' };
        }
    });
    return result;
}
// Default feature flags for development
export const DEFAULT_FEATURE_FLAGS = {
    AGENTS_ENABLED: true,
    MCP_ENABLED: true,
    ASSISTANT_ENABLED: true,
    VOICE_ASSISTANT_ENABLED: false,
    BACKGROUND_AGENTS_ENABLED: true,
    AGENT_ANALYTICS_ENABLED: true
};
