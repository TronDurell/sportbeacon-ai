declare global {
  interface Window {
    env: {
      NEXT_PUBLIC_API_URL?: string;
    };
  }
}

import {
  Player,
  Insight,
  FeedItem,
  Message,
  PlayerProfile,
  DrillDetail,
} from '../types';
import { ScoutNote, PlayerEvaluation } from '../types/scout';
import { DRILL_SUGGESTION_SYSTEM_PROMPT, buildDrillSuggestionPrompt } from '@/lib/ai/DrillSuggestionPrompts';

const API_BASE_URL =
  window.env?.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
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
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    throw new APIError(response.status, await response.text());
  }

  return response.json();
}

type InteractionType = 'like' | 'comment' | 'share';

interface TrainerAPI {
  // Roster management
  getRoster: () => Promise<{ players: Player[] }>;
  getPlayerProfile: (playerId: string) => Promise<Player>;
  getPlayerDetails: (playerId: string) => Promise<Player>;
  updatePlayerLevel: (playerId: string, level: string) => Promise<Player>;

  // Drill management
  getDrillHistory: (playerId: string) => Promise<DrillDetail[]>;
  getPlayerDrillHistory: (playerId: string) => Promise<DrillDetail[]>;
  getDrillSuggestions: (
    playerId: string,
    prompt: string
  ) => Promise<DrillDetail[]>;
  assignDrill: (playerId: string, drillId: string) => Promise<void>;
  recordDrillCompletion: (
    playerId: string,
    drillId: string,
    performance: number
  ) => Promise<void>;

  // Insights
  getInsights: () => Promise<Insight[]>;
  acknowledgeInsight: (insightId: string) => Promise<void>;

  // Community
  getFeed: () => Promise<{ items: FeedItem[] }>;
  interactWithPost: (
    postId: string,
    type: InteractionType,
    data?: any
  ) => Promise<void>;

  // AI Assistant
  sendAssistantMessage: (message: string) => Promise<Message>;
  askDrillAssistant: (drillId: string, question: string) => Promise<Message>;
}

export const trainerAPI: TrainerAPI = {
  getRoster: async () => {
    const response = await fetch('/api/trainer/roster');
    if (!response.ok) throw new Error('Failed to fetch roster');
    return response.json();
  },

  getPlayerProfile: async playerId => {
    const response = await fetch(`/api/players/${playerId}/profile`);
    if (!response.ok) throw new Error('Failed to fetch player profile');
    return response.json();
  },

  getPlayerDetails: async playerId => {
    const response = await fetch(`/api/players/${playerId}/details`);
    if (!response.ok) throw new Error('Failed to fetch player details');
    return response.json();
  },

  updatePlayerLevel: async (playerId, level) => {
    const response = await fetch(`/api/players/${playerId}/level`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level }),
    });
    if (!response.ok) throw new Error('Failed to update player level');
    return response.json();
  },

  getDrillHistory: async playerId => {
    const response = await fetch(`/api/players/${playerId}/drills/history`);
    if (!response.ok) throw new Error('Failed to fetch drill history');
    return response.json();
  },

  getPlayerDrillHistory: async playerId => {
    const response = await fetch(`/api/players/${playerId}/drills/history`);
    if (!response.ok) throw new Error('Failed to fetch drill history');
    return response.json();
  },

  getDrillSuggestions: async (playerId, prompt) => {
    const response = await fetch(
      `/api/players/${playerId}/drills/suggestions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      }
    );
    if (!response.ok) throw new Error('Failed to get drill suggestions');
    return response.json();
  },

  assignDrill: async (playerId, drillId) => {
    const response = await fetch(`/api/players/${playerId}/drills/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drillId }),
    });
    if (!response.ok) throw new Error('Failed to assign drill');
  },

  recordDrillCompletion: async (playerId, drillId, performance) => {
    const response = await fetch(
      `/api/players/${playerId}/drills/${drillId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performance }),
      }
    );
    if (!response.ok) throw new Error('Failed to record drill completion');
  },

  getInsights: async () => {
    const response = await fetch('/api/trainer/insights');
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  },

  acknowledgeInsight: async insightId => {
    const response = await fetch(`/api/insights/${insightId}/acknowledge`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to acknowledge insight');
  },

  getFeed: async () => {
    const response = await fetch('/api/community/feed');
    if (!response.ok) throw new Error('Failed to fetch feed');
    return response.json();
  },

  interactWithPost: async (postId, type, data) => {
    const response = await fetch(`/api/community/posts/${postId}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    });
    if (!response.ok) throw new Error('Failed to interact with post');
  },

  sendAssistantMessage: async message => {
    const response = await fetch('/api/assistant/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('Failed to send message to assistant');
    return response.json();
  },

  askDrillAssistant: async (drillId, question) => {
    const response = await fetch(`/api/drills/${drillId}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error('Failed to get assistant response');
    return response.json();
  },
};

export async function getPlayerProfile(
  playerId: string
): Promise<PlayerProfile> {
  return fetchWithAuth(`/players/${playerId}`);
}

export async function updatePlayerProfile(
  playerId: string,
  updates: Partial<PlayerProfile>
): Promise<PlayerProfile> {
  return fetchWithAuth(`/players/${playerId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function getDrillDetail(drillId: string): Promise<DrillDetail> {
  return fetchWithAuth(`/drills/${drillId}`);
}

export async function getDrillRecommendations(
  playerId: string
): Promise<DrillDetail[]> {
  return fetchWithAuth(`/players/${playerId}/recommended-drills`);
}

export async function sendMessageToAI(
  drillId: string,
  message: string
): Promise<Message> {
  return fetchWithAuth(`/drills/${drillId}/ai-chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getDrillHistory(
  playerId: string
): Promise<DrillDetail[]> {
  return fetchWithAuth(`/players/${playerId}/drill-history`);
}

export async function recordDrillCompletion(
  playerId: string,
  drillId: string,
  performance: {
    score?: number;
    duration: number;
    notes?: string;
  }
): Promise<void> {
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
  getScoutPlayers: async (
    scoutId: string,
    listType: string
  ): Promise<PlayerProfile[]> => {
    const response = await fetch(
      `/api/scout/${scoutId}/players?list=${listType}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch players');
    return response.json();
  },

  getScoutNotes: async (scoutId: string): Promise<ScoutNote[]> => {
    const response = await fetch(`/api/scout/${scoutId}/notes`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch notes');
    return response.json();
  },

  addScoutNote: async (
    note: Omit<ScoutNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScoutNote> => {
    const response = await fetch('/api/scout/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(note),
    });
    if (!response.ok) throw new Error('Failed to add note');
    return response.json();
  },

  updatePlayerEvaluation: async (
    playerId: string,
    evaluation: PlayerEvaluation
  ): Promise<void> => {
    const response = await fetch(`/api/players/${playerId}/evaluation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(evaluation),
    });
    if (!response.ok) throw new Error('Failed to update evaluation');
  },
};
