export interface ScoutNote {
  id: string;
  scoutId: string;
  playerId: string;
  content: string;
  tags: string[];
  visibility: 'private' | 'team' | 'organization';
  createdAt: string;
  updatedAt: string;
}

export interface PlayerEvaluation {
  technicalSkills: {
    ballControl: number;
    passing: number;
    shooting: number;
    dribbling: number;
    firstTouch: number;
  };
  tacticalAwareness: {
    positioning: number;
    gameReading: number;
    decisionMaking: number;
    teamwork: number;
    offBallMovement: number;
  };
  physicalAttributes: {
    speed: number;
    strength: number;
    stamina: number;
    agility: number;
    balance: number;
  };
  mentalStrength: {
    leadership: number;
    composure: number;
    concentration: number;
    workRate: number;
    determination: number;
  };
  overallPotential: number;
  notes: string;
  lastUpdated: string;
  evaluatorId: string;
}
