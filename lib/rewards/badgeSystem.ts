export interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: (user: any) => boolean;
}

export function assignBadges(user: any, badges: Badge[]): string[] {
  return badges.filter(badge => badge.criteria(user)).map(b => b.id);
}

export function calculateLikeStreak(likes: { date: string }[]): number {
  // likes: array of {date: YYYY-MM-DD}
  if (!likes.length) return 0;
  likes.sort((a, b) => a.date.localeCompare(b.date));
  let streak = 1;
  for (let i = likes.length - 2; i >= 0; i--) {
    const prev = new Date(likes[i].date);
    const next = new Date(likes[i + 1].date);
    const diff = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getMultiplier(streak: number): number {
  if (streak >= 10) return 2;
  if (streak >= 5) return 1.5;
  return 1;
} 