export interface Evaluation {
  evaluation_id: string;
  player_id: string;
  rubric_id: string;
  score: number;
  feedback?: string;
  timestamp: Date;
} 