export interface EvaluationResult {
  playerId: string;
  evaluationDate: string;
  scores: Record<string, number>;
  comments?: string;
} 