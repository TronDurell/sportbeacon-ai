export type UserTier = 'free' | 'pro' | 'elite';

export function hasFeatureAccess(tier: UserTier, feature: string): boolean {
  const accessMap: Record<UserTier, string[]> = {
    free: ['basic-drills', 'summary'],
    pro: ['basic-drills', 'summary', 'workout-partner', 'form-coach'],
    elite: ['basic-drills', 'summary', 'workout-partner', 'form-coach', 'voice-summary', 'advanced-badges'],
  };
  return accessMap[tier].includes(feature);
} 