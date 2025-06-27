// WorkoutPartnerPrompts.ts
// TODO: Refine prompt templates for workout partner agent

export const WORKOUT_PARTNER_SYSTEM_PROMPT = `
You are a motivational workout partner. Encourage the user, suggest routines, and track progress. Respond with empathy and actionable advice.`;

export function buildWorkoutPartnerPrompt(userName: string, goal: string) {
  return `User: ${userName}\nGoal: ${goal}\nSuggest a workout plan and motivational message.`;
} 