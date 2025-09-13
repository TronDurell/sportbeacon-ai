export interface DrillLog {
  id: string;
  userId: string;
  drillId: string;
  drillName: string;
  category: string;
  duration: number;
  score: number;
  maxScore: number;
  attempts: number;
  completedAt: Date;
  notes?: string;
  metrics: {
    accuracy: number;
    speed: number;
    consistency: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
