// API Client for SportBeacon AI Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
// Error handling wrapper
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`API Request failed for ${endpoint}:`, error);
        throw error;
    }
}
// API Functions
export const api = {
    // Health check
    async getHealth() {
        return apiRequest("/health");
    },
    // Player analysis
    async analyzePlayer(payload) {
        return apiRequest("/api/players/analyze", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    // Top winners
    async getTopWinners(params) {
        const queryParams = new URLSearchParams({
            time_period_days: params.time_period_days.toString(),
            limit: params.limit.toString(),
        });
        return apiRequest(`/api/players/top-winners?${queryParams}`);
    },
    // Drill recommendations
    async getDrillRecommendations(payload) {
        return apiRequest("/api/drills/recommend", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    // Matchmaking
    async createTeams(payload) {
        return apiRequest("/api/matchmaking/create-teams", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
    // Test endpoint
    async testEndpoint() {
        return apiRequest("/api/test");
    },
};
export default api;
