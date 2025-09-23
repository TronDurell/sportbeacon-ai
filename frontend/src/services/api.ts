// API Client for SportBeacon AI Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/sportbeacon-ai/us-central1";

// Types for API requests and responses
export interface HealthResponse {
  status: string;
  service: string;
  timestamp?: string;
}

export interface PlayerAnalysisRequest {
  user_id: string;
  question: string;
  include_stats?: boolean;
}

export interface PlayerAnalysisResponse {
  player_name: string;
  normalized_stats: Record<string, number>;
  top_skills: string[];
  growth_areas: string[];
  recent_trends: Record<string, number>;
}

export interface TopWinnersRequest {
  time_period_days: number;
  limit: number;
}

export interface TopWinnersResponse {
  winners: Array<{
    id: string;
    name: string;
    win_rate: number;
    games_played: number;
    avg_points: number;
    avg_assists: number;
    avg_rebounds: number;
    top_skills?: string[];
    insights?: string[];
  }>;
  total_found: number;
}

export interface DrillRecommendationRequest {
  user_id: string;
  top_skills: string[];
  growth_areas: string[];
  skill_levels: Record<string, number>;
  min_difficulty: number;
  max_difficulty: number;
  max_recommendations: number;
}

export interface DrillRecommendationResponse {
  player_id: string;
  recommended_drills: Array<{
    id: string;
    name: string;
    description: string;
    difficulty: number;
    duration: number;
    equipment_needed: string[];
    target_skills: string[];
  }>;
  training_notes: string[];
}

export interface MatchmakingRequest {
  players: Array<{
    player_id: number;
    player_name: string;
    game_date: string;
    points: number;
    assists: number;
    rebounds: number;
    steals: number;
    blocks: number;
    field_goal_percentage: number;
    three_point_percentage: number;
    result: "win" | "loss";
  }>;
  team_size: 3 | 5;
  consider_positions: boolean;
}

export interface MatchmakingResponse {
  team_a: Array<{
    id: string;
    name: string;
    position: string;
    skill_scores: Record<string, number>;
    overall_rating: number;
  }>;
  team_b: Array<{
    id: string;
    name: string;
    position: string;
    skill_scores: Record<string, number>;
    overall_rating: number;
  }>;
  suggested_game_time: string;
  skill_gap: number;
  is_balanced: boolean;
  balance_score: number;
}

// Error handling wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
}

// API Functions
export const api = {
  // Health check
  async getHealth(): Promise<HealthResponse> {
    return apiRequest<HealthResponse>("/health");
  },

  // Player analysis
  async analyzePlayer(payload: PlayerAnalysisRequest): Promise<PlayerAnalysisResponse> {
    return apiRequest<PlayerAnalysisResponse>("/api/players/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Top winners
  async getTopWinners(params: TopWinnersRequest): Promise<TopWinnersResponse> {
    const queryParams = new URLSearchParams({
      time_period_days: params.time_period_days.toString(),
      limit: params.limit.toString(),
    });
    return apiRequest<TopWinnersResponse>(`/api/players/top-winners?${queryParams}`);
  },

  // Drill recommendations
  async getDrillRecommendations(payload: DrillRecommendationRequest): Promise<DrillRecommendationResponse> {
    return apiRequest<DrillRecommendationResponse>("/api/drills/recommend", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Matchmaking
  async createTeams(payload: MatchmakingRequest): Promise<MatchmakingResponse> {
    return apiRequest<MatchmakingResponse>("/api/matchmaking/create-teams", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Test endpoint
  async testEndpoint(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/api/test");
  },
};

export default api; 