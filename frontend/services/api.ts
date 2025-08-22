declare global {
  interface Window {
    env: {
      NEXT_PUBLIC_API_URL?: string;
    }
  }
}

import { Player, Insight, FeedItem, Message, PlayerProfile, DrillDetail } from '../types';
import { ScoutNote, PlayerEvaluation } from '../types/scout';

export const API_BASE_URL = (typeof import !== 'undefined' && (import.meta as any)?.env?.VITE_API_URL) || window.env?.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new APIError(
            response.status,
            await response.text()
        );
    }

    return response.json();
}

type InteractionType = 'like' | 'comment' | 'share';

interface TrainerAPI {
    getRoster: () => Promise<{ players: Player[] }>;
    getPlayerProfile: (playerId: string) => Promise<Player>;
    getPlayerDetails: (playerId: string) => Promise<Player>;
    updatePlayerLevel: (playerId: string, level: string) => Promise<Player>;

    getDrillHistory: (playerId: string) => Promise<DrillDetail[]>;
    getPlayerDrillHistory: (playerId: string) => Promise<DrillDetail[]>;
    getDrillSuggestions: (playerId: string, prompt: string) => Promise<DrillDetail[]>;
    assignDrill: (playerId: string, drillId: string) => Promise<void>;
    recordDrillCompletion: (playerId: string, drillId: string, performance: number) => Promise<void>;

    getInsights: () => Promise<Insight[]>;
    acknowledgeInsight: (insightId: string) => Promise<void>;

    getFeed: () => Promise<{ items: FeedItem[] }>;
    interactWithPost: (postId: string, type: InteractionType, data?: any) => Promise<void>;

    sendAssistantMessage: (message: string) => Promise<Message>;
    askDrillAssistant: (drillId: string, question: string) => Promise<Message>;
}

export const trainerAPI: TrainerAPI = {
    getRoster: async () => {
        return fetchWithAuth('/api/trainer/roster');
    },

    getPlayerProfile: async (playerId) => {
        return fetchWithAuth(`/api/players/${playerId}/profile`);
    },

    getPlayerDetails: async (playerId) => {
        return fetchWithAuth(`/api/players/${playerId}/details`);
    },

    updatePlayerLevel: async (playerId, level) => {
        return fetchWithAuth(`/api/players/${playerId}/level`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level })
        });
    },

    getDrillHistory: async (playerId) => {
        return fetchWithAuth(`/api/players/${playerId}/drills/history`);
    },

    getPlayerDrillHistory: async (playerId) => {
        return fetchWithAuth(`/api/players/${playerId}/drills/history`);
    },

    getDrillSuggestions: async (playerId, prompt) => {
        return fetchWithAuth(`/api/players/${playerId}/drills/suggestions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
    },

    assignDrill: async (playerId, drillId) => {
        await fetchWithAuth(`/api/players/${playerId}/drills/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drillId })
        });
    },

    recordDrillCompletion: async (playerId, drillId, performance) => {
        await fetchWithAuth(`/api/players/${playerId}/drills/${drillId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ performance })
        });
    },

    getInsights: async () => {
        return fetchWithAuth('/api/trainer/insights');
    },

    acknowledgeInsight: async (insightId) => {
        await fetchWithAuth(`/api/insights/${insightId}/acknowledge`, {
            method: 'POST'
        });
    },

    getFeed: async () => {
        return fetchWithAuth('/api/community/feed');
    },

    interactWithPost: async (postId, type, data) => {
        await fetchWithAuth(`/api/community/posts/${postId}/interact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
        });
    },

    sendAssistantMessage: async (message) => {
        return fetchWithAuth('/api/assistant/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    },

    askDrillAssistant: async (drillId, question) => {
        return fetchWithAuth(`/api/drills/${drillId}/assistant/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
    }
};

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile> {
    return fetchWithAuth(`/api/players/${playerId}`);
}

export async function updatePlayerProfile(playerId: string, updates: Partial<PlayerProfile>): Promise<PlayerProfile> {
    return fetchWithAuth(`/api/players/${playerId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

export async function getDrillDetail(drillId: string): Promise<DrillDetail> {
    return fetchWithAuth(`/api/drills/${drillId}`);
}

export async function getDrillRecommendations(playerId: string): Promise<DrillDetail[]> {
    return fetchWithAuth(`/api/players/${playerId}/recommended-drills`);
}

export async function sendMessageToAI(drillId: string, message: string): Promise<Message> {
    return fetchWithAuth(`/api/drills/${drillId}/ai-chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

export async function getDrillHistory(playerId: string): Promise<DrillDetail[]> {
    return fetchWithAuth(`/api/players/${playerId}/drill-history`);
}

export async function recordDrillCompletion(playerId: string, drillId: string, performance: {
    score?: number;
    duration: number;
    notes?: string;
}): Promise<void> {
    await fetchWithAuth(`/api/players/${playerId}/drill-completions`, {
        method: 'POST',
        body: JSON.stringify({
            drillId,
            ...performance,
            completedAt: new Date().toISOString(),
        }),
    });
}

export const playerAPI = {
    getScoutPlayers: async (scoutId: string, listType: string): Promise<PlayerProfile[]> => {
        const response = await fetch(`${API_BASE_URL}/api/scout/${scoutId}/players?list=${listType}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch players');
        return response.json();
    },

    getScoutNotes: async (scoutId: string): Promise<ScoutNote[]> => {
        const response = await fetch(`${API_BASE_URL}/api/scout/${scoutId}/notes`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok) throw new Error('Failed to fetch notes');
        return response.json();
    },

    addScoutNote: async (note: Omit<ScoutNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScoutNote> => {
        const response = await fetch(`${API_BASE_URL}/api/scout/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(note),
        });
        if (!response.ok) throw new Error('Failed to add note');
        return response.json();
    },

    updatePlayerEvaluation: async (playerId: string, evaluation: PlayerEvaluation): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/api/players/${playerId}/evaluation`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(evaluation),
        });
        if (!response.ok) throw new Error('Failed to update evaluation');
    },
}; 