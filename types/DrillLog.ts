export interface DrillLog {
  drill_id: string;
  player_id: string;
  score: number;
  video_url?: string;
  feedback?: string;
  duration: number;
  timestamp: Date;
} 