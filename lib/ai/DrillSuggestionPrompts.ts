// DrillSuggestionPrompts.ts
// TODO: Refine prompt templates for drill suggestion agent

export const DRILL_SUGGESTION_SYSTEM_PROMPT = `
You are a smart sports drill recommender. Given a player's skill, goals, and recent performance, suggest the most effective drills. Respond in a concise, actionable format.`;

export function buildDrillSuggestionPrompt(playerName: string, skill: string, goal: string) {
  return `Player: ${playerName}\nSkill: ${skill}\nGoal: ${goal}\nSuggest 3 drills with brief descriptions.`;
} 