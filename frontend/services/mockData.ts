import { addDays, subDays, subHours } from 'date-fns';

export const mockPlayers = [
  {
    id: 'p1',
    name: 'Michael Jordan',
    avatar: 'https://placekitten.com/100/100',
    sport: 'Basketball',
    level: 'Advanced',
    weeklyProgress: {
      drillsCompleted: 15,
      totalDrills: 20,
      performance: 0.85,
    },
  },
  {
    id: 'p2',
    name: 'Sarah Thompson',
    avatar: 'https://placekitten.com/101/101',
    sport: 'Basketball',
    level: 'Intermediate',
    weeklyProgress: {
      drillsCompleted: 8,
      totalDrills: 15,
      performance: -0.12,
    },
  },
  {
    id: 'p3',
    name: 'David Chen',
    avatar: 'https://placekitten.com/102/102',
    sport: 'Basketball',
    level: 'Beginner',
    weeklyProgress: {
      drillsCompleted: 12,
      totalDrills: 12,
      performance: 0.32,
    },
  },
];

export const mockInsights = [
  {
    id: 'i1',
    type: 'fatigue',
    severity: 'HIGH',
    metric: 0.85,
    message:
      'Sarah Thompson showing signs of fatigue after intense training sessions',
    timestamp: subHours(new Date(), 2).toISOString(),
  },
  {
    id: 'i2',
    type: 'performance_drop',
    severity: 'MEDIUM',
    metric: -0.12,
    message: "David Chen's shooting accuracy has decreased by 12% this week",
    timestamp: subHours(new Date(), 5).toISOString(),
  },
  {
    id: 'i3',
    type: 'improvement',
    severity: 'LOW',
    metric: 0.32,
    message: 'Michael Jordan has improved ball handling skills by 32%',
    timestamp: subDays(new Date(), 1).toISOString(),
  },
];

export const mockFeed = [
  {
    id: 'f1',
    type: 'achievement',
    content: 'Sarah Thompson completed the Advanced Dribbling Series! 🏀',
    timestamp: new Date(),
    author: {
      id: 'p2',
      name: 'Sarah Thompson',
      avatar: 'https://placekitten.com/101/101',
    },
    stats: {
      likes: 12,
      comments: 3,
      shares: 1,
    },
  },
  {
    id: 'f2',
    type: 'drill_completion',
    content:
      'David Chen achieved a new personal best in the Free Throw Challenge! 🎯',
    timestamp: subHours(new Date(), 3),
    author: {
      id: 'p3',
      name: 'David Chen',
      avatar: 'https://placekitten.com/102/102',
    },
    stats: {
      likes: 8,
      comments: 2,
      shares: 0,
    },
  },
  {
    id: 'f3',
    type: 'team_update',
    content:
      'Team practice scheduled for tomorrow at 3 PM. Focus: Zone Defense 🏃‍♂️',
    timestamp: subHours(new Date(), 6),
    author: {
      id: 'coach1',
      name: 'Coach Williams',
      avatar: 'https://placekitten.com/103/103',
    },
    stats: {
      likes: 15,
      comments: 5,
      shares: 2,
    },
  },
];

export const mockAssistantMessages = [
  {
    id: 'm1',
    role: 'trainer',
    content: "How can I improve Sarah's shooting form?",
    timestamp: subMinutes(new Date(), 5),
  },
  {
    id: 'm2',
    role: 'ai',
    content:
      "Based on Sarah's recent performance data, I recommend focusing on these key areas:\n\n1. Elbow alignment during release\n2. Follow-through consistency\n3. Base positioning\n\nWould you like me to create a custom drill sequence targeting these areas?",
    timestamp: subMinutes(new Date(), 4),
  },
];

export const mockQuickReplies = [
  'Create drill sequence',
  'Show shooting stats',
  'Schedule practice',
  'View previous drills',
];
