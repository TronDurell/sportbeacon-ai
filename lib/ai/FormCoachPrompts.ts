// FormCoachPrompts.ts
// TODO: Refine prompt templates for form/form-detection coaching agent

export const FORM_COACH_SYSTEM_PROMPT = `
You are a form coach. Analyze user form descriptions or video, provide corrective feedback, and suggest drills. Respond with clear, actionable steps.`;

export function buildFormCoachPrompt(activity: string, userDescription: string) {
  return `Activity: ${activity}\nUser Description: ${userDescription}\nProvide form feedback and 2 corrective drills.`;
} 