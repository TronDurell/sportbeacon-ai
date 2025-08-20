type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const API_URL = (import.meta as any).env?.VITE_API_URL || '';

if (!API_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_URL is not set. API calls will likely fail.');
}

interface FetchOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string | number | boolean | undefined>;
}

async function http<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, query } = options;
  const url = new URL(path.startsWith('http') ? path : `${API_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Accept': 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const parsed = isJson ? await response.json().catch(() => ({})) : await response.text();

  if (!response.ok) {
    const error: any = new Error(
      (parsed && (parsed.message || parsed.detail)) || `Request failed with ${response.status}`
    );
    error.status = response.status;
    error.payload = parsed;
    throw error;
  }

  return parsed as T;
}

export type AnalyzePlayerPayload = {
  user_id: string;
  question: string;
  include_stats?: boolean;
};

export type TopWinnersParams = {
  time_period_days: number;
  limit: number;
};

export type DrillRecommendationsPayload = {
  player_id: string;
  games: any[];
};

export type CreateTeamsPayload = {
  players: any[];
};

export async function getHealth(): Promise<{ status: string; service: string }>{
  return http('/health');
}

export async function analyzePlayer(payload: AnalyzePlayerPayload) {
  // Backend expects CoachQuestion at /api/coach/ask
  return http('/api/coach/ask?channel=chat', { method: 'POST', body: payload });
}

export async function getTopWinners(params: TopWinnersParams) {
  return http('/api/players/top-winners', { query: params });
}

export async function getDrillRecommendations(payload: DrillRecommendationsPayload) {
  // Backend expects DrillRecommendationRequest at /api/drills/recommend
  return http('/api/drills/recommend', { method: 'POST', body: payload });
}

export async function createTeams(payload: CreateTeamsPayload) {
  return http('/api/matchmaking/create-teams', { method: 'POST', body: payload });
}

export const api = {
  getHealth,
  analyzePlayer,
  getTopWinners,
  getDrillRecommendations,
  createTeams,
};

