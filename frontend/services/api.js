const API_BASE_URL = window.env?.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
class APIError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'APIError';
    }
}
// Export fetchWithAuth function
export async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
    if (!response.ok) {
        throw new APIError(response.status, `API request failed: ${response.statusText}`);
    }
    return response.json();
}
export const trainerAPI = {
    getRoster: async () => {
        const response = await fetch('/api/trainer/roster');
        if (!response.ok)
            throw new Error('Failed to fetch roster');
        return response.json();
    },
    getPlayerProfile: async (playerId) => {
        const response = await fetch(`/api/players/${playerId}/profile`);
        if (!response.ok)
            throw new Error('Failed to fetch player profile');
        return response.json();
    },
    getPlayerDetails: async (playerId) => {
        const response = await fetch(`/api/players/${playerId}/details`);
        if (!response.ok)
            throw new Error('Failed to fetch player details');
        return response.json();
    },
    updatePlayerLevel: async (playerId, level) => {
        const response = await fetch(`/api/players/${playerId}/level`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level })
        });
        if (!response.ok)
            throw new Error('Failed to update player level');
        return response.json();
    },
    getDrillHistory: async (playerId) => {
        const response = await fetch(`/api/players/${playerId}/drills/history`);
        if (!response.ok)
            throw new Error('Failed to fetch drill history');
        return response.json();
    },
    getPlayerDrillHistory: async (playerId) => {
        const response = await fetch(`/api/players/${playerId}/drills/history`);
        if (!response.ok)
            throw new Error('Failed to fetch drill history');
        return response.json();
    },
    getDrillSuggestions: async (playerId, prompt) => {
        const response = await fetch(`/api/players/${playerId}/drills/suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!response.ok)
            throw new Error('Failed to get drill suggestions');
        return response.json();
    },
    assignDrill: async (playerId, drillId) => {
        const response = await fetch(`/api/players/${playerId}/drills/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drillId })
        });
        if (!response.ok)
            throw new Error('Failed to assign drill');
    },
    recordDrillCompletion: async (playerId, drillId, performance) => {
        const response = await fetch(`/api/players/${playerId}/drills/${drillId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ performance })
        });
        if (!response.ok)
            throw new Error('Failed to record drill completion');
    },
    getInsights: async () => {
        const response = await fetch('/api/trainer/insights');
        if (!response.ok)
            throw new Error('Failed to fetch insights');
        return response.json();
    },
    acknowledgeInsight: async (insightId) => {
        const response = await fetch(`/api/insights/${insightId}/acknowledge`, {
            method: 'POST'
        });
        if (!response.ok)
            throw new Error('Failed to acknowledge insight');
    },
    getFeed: async () => {
        const response = await fetch('/api/community/feed');
        if (!response.ok)
            throw new Error('Failed to fetch feed');
        return response.json();
    },
    interactWithPost: async (postId, type, data) => {
        const response = await fetch(`/api/community/posts/${postId}/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
        });
        if (!response.ok)
            throw new Error('Failed to interact with post');
    },
    sendAssistantMessage: async (message) => {
        const response = await fetch('/api/assistant/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok)
            throw new Error('Failed to send message to assistant');
        return response.json();
    },
    askDrillAssistant: async (drillId, question) => {
        const response = await fetch(`/api/drills/${drillId}/assistant/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        if (!response.ok)
            throw new Error('Failed to get assistant response');
        return response.json();
    }
};
export async function getPlayerProfile(playerId) {
    return fetchWithAuth(`/players/${playerId}`);
}
export async function updatePlayerProfile(playerId, updates) {
    return fetchWithAuth(`/players/${playerId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}
export async function getDrillDetail(drillId) {
    return fetchWithAuth(`/drills/${drillId}`);
}
export async function getDrillRecommendations(playerId) {
    return fetchWithAuth(`/players/${playerId}/recommended-drills`);
}
export async function sendMessageToAI(drillId, message) {
    return fetchWithAuth(`/drills/${drillId}/ai-chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}
export async function getDrillHistory(playerId) {
    return fetchWithAuth(`/players/${playerId}/drill-history`);
}
export async function recordDrillCompletion(playerId, drillId, performance) {
    await fetchWithAuth(`/players/${playerId}/drill-completions`, {
        method: 'POST',
        body: JSON.stringify({
            drillId,
            ...performance,
            completedAt: new Date().toISOString(),
        }),
    });
}
export const playerAPI = {
    getProfile: async (playerId) => {
        return getPlayerProfile(playerId);
    },
    getAssignedDrills: async (playerId) => {
        return getDrillHistory(playerId);
    },
    getInsights: async (playerId) => {
        // Mock insights for now
        return [];
    },
    getScoutPlayers: async (scoutId, listType) => {
        const response = await fetch(`/api/scout/${scoutId}/players?list=${listType}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok)
            throw new Error('Failed to fetch players');
        return response.json();
    },
    getScoutNotes: async (scoutId) => {
        const response = await fetch(`/api/scout/${scoutId}/notes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok)
            throw new Error('Failed to fetch notes');
        return response.json();
    },
    addScoutNote: async (note) => {
        const response = await fetch('/api/scout/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(note),
        });
        if (!response.ok)
            throw new Error('Failed to add note');
        return response.json();
    },
    updatePlayerEvaluation: async (playerId, evaluation) => {
        const response = await fetch(`/api/players/${playerId}/evaluation`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(evaluation),
        });
        if (!response.ok)
            throw new Error('Failed to update evaluation');
    },
    getPlayerBadges: async (playerId) => {
        const response = await fetch(`/api/players/${playerId}/badges`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok)
            throw new Error('Failed to fetch player badges');
        return response.json();
    },
};
