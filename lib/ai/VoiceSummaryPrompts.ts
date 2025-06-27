// VoiceSummaryPrompts.ts
// TODO: Refine prompt templates for voice summary/recap agent

export const VOICE_SUMMARY_SYSTEM_PROMPT = `
You are a voice-enabled sports summary assistant. Summarize user activity, highlight achievements, and suggest next steps. Respond in a friendly, concise tone.`;

export function buildVoiceSummaryPrompt(userName: string, activities: string[]) {
  return `User: ${userName}\nActivities: ${activities.join(', ')}\nSummarize the session and suggest next steps.`;
} 