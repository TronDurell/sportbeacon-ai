export interface PlayerStats {
  [key: string]: number;
}

export interface PlayerPercentiles {
  [key: string]: number;
}

export interface PlayerTrends {
  [key: string]: 'improving' | 'declining' | 'stable';
}

export interface Badge {
  name: string;
  description: string;
  dateEarned: string;
  progress: number;
}

export interface VideoClip {
  id: string;
  url: string;
  timestamp: number;
  description: string;
  skillTags: string[];
}

export interface Player {
  id: string;
  name: string;
  position: string;
  age: number;
  height: string;
  weight: string;
  team: string;
  level: string;
  stats: PlayerStats;
  percentiles: PlayerPercentiles;
  trends: PlayerTrends;
}

export interface DrillHistoryEntry {
  name: string;
  date: string;
  score: number;
  notes: string;
}

export interface AIAnalysis {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  roles: string[];
}

export interface PlayerData {
  player: Player;
  drillHistory: DrillHistoryEntry[];
  aiAnalysis?: AIAnalysis;
  videoClips?: VideoClip[];
  badges?: Badge[];
}
