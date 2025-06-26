// onboardingSurvey.ts
// Logic for onboarding survey and avatar profile mapping

export interface OnboardingSurveyResult {
  age: number;
  sport: string;
  role: 'athlete' | 'coach' | 'parent' | 'admin';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export function runOnboardingSurvey(): Promise<OnboardingSurveyResult> {
  // In a real app, this would be a UI flow. Here, return a mock result for demo.
  return Promise.resolve({
    age: 14,
    sport: 'basketball',
    role: 'athlete',
    skillLevel: 'beginner',
  });
}

export function mapAvatarPreset(survey: OnboardingSurveyResult): string {
  // Map survey results to avatar preset string
  if (survey.role === 'coach') return 'coach';
  if (survey.role === 'parent') return 'parent';
  if (survey.role === 'admin') return 'admin';
  if (survey.age < 18) return `child-athlete-${survey.sport}`;
  return `athlete-${survey.sport}-${survey.skillLevel}`;
} 