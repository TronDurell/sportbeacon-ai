import { useState, useEffect } from 'react';

interface Post {
  author: {
    role: 'coach' | 'trainer' | 'athlete';
    isVerified: boolean;
  };
  type: 'workout' | 'recipe' | 'text';
  locationName?: string;
}

interface AIResponse {
  score: number;
  error?: string;
}

export const calculatePriorityScore = (post: Post, response: AIResponse): number => {
  let score = response.score;

  // Verified boost
  if (post.author.isVerified) {
    score += 10;
  }

  // Role boost
  switch (post.author.role) {
    case 'coach':
      score += 5;
      break;
    case 'trainer':
      score += 3;
      break;
    case 'athlete':
      score += 1;
      break;
  }

  // Post type boost
  switch (post.type) {
    case 'workout':
      score += 5;
      break;
    case 'recipe':
      score += 3;
      break;
    case 'text':
      score += 1;
      break;
  }

  // Location relevance
  if (post.locationName) {
    score += 2;
  }

  // Handle errors
  if (response.error) {
    score = Math.max(score, 50); // Fallback to a default score
  }

  return score;
};

export const useAIInsights = () => {
  const [insights, setInsights] = useState<AIResponse[]>([]);

  useEffect(() => {
    // Mock fetching insights
    const fetchInsights = async () => {
      // Simulate API call
      const response: AIResponse = await new Promise((resolve) =>
        setTimeout(() => resolve({ score: 70 }), 1000)
      );
      setInsights([response]);
    };

    fetchInsights();
  }, []);

  return insights;
};

export function analyzeDrillTrends(drillLogs: any[]) {
  // Analyze drill logs to determine focus areas
  // Example logic: if a player consistently underperforms in stamina drills, suggest more stamina training
  const focusRecommendations = drillLogs.map(log => {
    if (log.type === 'stamina' && log.performance < 50) {
      return 'Needs more stamina drills';
    }
    return 'Balanced performance';
  });
  return focusRecommendations;
}

export function summarizePlayerGrowth(playerData: any) {
  // Logic to auto-summarize player growth
  // Example: "Player has improved speed by 8 points over the last 2 weeks."
  return `Player has improved ${playerData.metric} by ${playerData.increase} points over the last ${playerData.timeFrame}.`;
} 