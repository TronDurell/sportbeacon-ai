import { z } from 'zod';

export class BadRequest extends Error {
  status = 400;
}

export const validateBody = <T extends z.ZodTypeAny>(schema: T, data: unknown) => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
  }
  return parsed.data as z.infer<T>;
};

export const validateQuery = <T extends z.ZodTypeAny>(schema: T, data: unknown) => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
  }
  return parsed.data as z.infer<T>;
};

export const validateParams = <T extends z.ZodTypeAny>(schema: T, data: unknown) => {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
  }
  return parsed.data as z.infer<T>;
};

// Common validation schemas
export const videoAnalysisSchema = z.object({
  videoUrl: z.string().url(),
  playerId: z.string().min(1),
  analysisType: z.enum(['performance', 'technique', 'tactical']).optional(),
});

export const playerQuerySchema = z.object({
  playerId: z.string().min(1),
  includeStats: z.boolean().optional(),
});

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['player', 'coach', 'parent', 'admin']).optional(),
});

// Team creation schema
export const teamCreateSchema = z.object({
  name: z.string().min(1).max(100),
  leagueId: z.string().min(1),
  coachId: z.string().min(1),
  description: z.string().max(500).optional(),
});

// Player creation schema
export const playerCreateSchema = z.object({
  name: z.string().min(1).max(100),
  teamId: z.string().min(1),
  age: z.number().int().min(5).max(100),
  position: z.string().max(50).optional(),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

// Stats recording schema
export const statsRecordSchema = z.object({
  playerId: z.string().min(1),
  gameId: z.string().min(1),
  stats: z.record(z.any()), // Flexible stats object
  gameDate: z.string().datetime().optional(),
});

// Memory event schema
export const memoryEventSchema = z.object({
  userId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.any()).optional(),
  tenantId: z.string().min(1),
  source: z.string().default('client'),
});

// Feedback submission schema
export const feedbackSchema = z.object({
  userId: z.string().min(1),
  feedbackType: z.enum(['bug', 'feature', 'general', 'performance']),
  content: z.string().min(1).max(2000),
  tenantId: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

// Notification schemas
export const triggerCoachNotificationsSchema = z.object({
  eventType: z.string().min(1),
  coachId: z.string().min(1),
  data: z.record(z.any()).optional(),
});

export const updateUserActivitySchema = z.object({
  activityType: z.string().min(1),
  activityData: z.record(z.any()).optional(),
});

export const getUserNotificationPreferencesSchema = z.object({
  // No required fields for GET request
});

export const updateNotificationPreferencesSchema = z.object({
  preferences: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    weeklyReports: z.boolean().optional(),
    coachUpdates: z.boolean().optional(),
  }),
});

export const sendBulkNotificationsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(1000),
  notificationType: z.string().min(1),
  content: z.string().min(1).max(2000),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const getNotificationHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  type: z.string().optional(),
});

// Voice module schemas
export const generateVoiceTokenSchema = z.object({
  callType: z.string().min(1),
  duration: z.number().int().min(60).max(86400).optional(), // 1 minute to 24 hours
  permissions: z.array(z.string()).optional(),
});

export const revokeVoiceTokenSchema = z.object({
  tokenId: z.string().min(1),
});

export const handleVoiceCallSchema = z.object({
  token: z.string().min(1),
  callType: z.string().min(1),
});

export const callStatusWebhookSchema = z.object({
  callId: z.string().min(1),
  status: z.string().min(1),
  duration: z.number().optional(),
  recordingUrl: z.string().url().optional(),
});

export const getCallHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

export const generateAudioSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.string().optional(),
  format: z.enum(['mp3', 'wav', 'ogg']).optional().default('mp3'),
});

// Team management schemas
export const createTeamSchema = z.object({
  teamData: z.object({
    name: z.string().min(1).max(100),
    leagueId: z.string().min(1),
    ageGroup: z.string().min(1),
    coachId: z.string().optional(),
    description: z.string().max(500).optional(),
  }),
});

export const updateTeamSchema = z.object({
  teamId: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    coachId: z.string().optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
  }),
});

export const getTeamRosterSchema = z.object({
  teamId: z.string().min(1),
});

export const addPlayerToTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1),
  position: z.string().optional(),
});

export const removePlayerFromTeamSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1),
  reason: z.string().optional(),
});

export const getTeamStatisticsSchema = z.object({
  teamId: z.string().min(1),
  timeRange: z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});

export const getTeamScheduleSchema = z.object({
  teamId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateTeamPerformanceSchema = z.object({
  teamId: z.string().min(1),
  performanceData: z.object({
    result: z.enum(['win', 'loss', 'tie']),
    score: z.number().int().min(0),
    opponentScore: z.number().int().min(0),
    gameDate: z.string().datetime(),
    notes: z.string().max(1000).optional(),
  }),
});

// League management schemas
export const createLeagueSchema = z.object({
  leagueData: z.object({
    name: z.string().min(1).max(100),
    sport: z.string().min(1),
    ageGroups: z.array(z.string()).min(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    rules: z.record(z.any()).optional(),
  }),
});

export const updateLeagueSchema = z.object({
  leagueId: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    sport: z.string().min(1).optional(),
    ageGroups: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    rules: z.record(z.any()).optional(),
  }),
});

export const getLeagueOverviewSchema = z.object({
  leagueId: z.string().min(1),
});

export const getLeagueStandingsSchema = z.object({
  leagueId: z.string().min(1),
  divisionId: z.string().optional(),
});

export const getLeagueScheduleSchema = z.object({
  leagueId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const generateLeagueScheduleSchema = z.object({
  leagueId: z.string().min(1),
  scheduleConfig: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    gameDays: z.array(z.string()).optional(),
    defaultVenue: z.string().optional(),
  }).optional(),
});

export const getLeagueStatisticsSchema = z.object({
  leagueId: z.string().min(1),
  timeRange: z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});

// Player management schemas
export const createPlayerProfileSchema = z.object({
  playerData: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    dateOfBirth: z.string().datetime(),
    position: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().min(1),
    }),
  }),
});

export const updatePlayerProfileSchema = z.object({
  playerId: z.string().min(1),
  updates: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    position: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().min(1),
    }).optional(),
  }),
});

export const getPlayerStatisticsSchema = z.object({
  playerId: z.string().min(1),
  timeRange: z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});

export const getPlayerAchievementsSchema = z.object({
  playerId: z.string().min(1),
});

export const awardAchievementSchema = z.object({
  playerId: z.string().min(1),
  achievementId: z.string().min(1),
  achievementData: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    points: z.number().int().min(0).optional(),
  }),
});

export const getPlayerScheduleSchema = z.object({
  playerId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updatePlayerPerformanceSchema = z.object({
  playerId: z.string().min(1),
  performanceData: z.object({
    gameId: z.string().min(1),
    stats: z.record(z.any()),
    notes: z.string().max(1000).optional(),
  }),
});

// Admin functions schemas
export const adminGetLeagueStatsSchema = z.object({
  leagueId: z.string().min(1),
});

export const adminUpdateStaffRoleSchema = z.object({
  staffId: z.string().min(1),
  newRole: z.enum(['RecDirector', 'Coach', 'Assistant', 'Volunteer']),
  reason: z.string().max(500).optional(),
});

export const adminGenerateReportSchema = z.object({
  reportType: z.enum(['league', 'team', 'player', 'financial', 'attendance']),
  filters: z.object({
    leagueId: z.string().optional(),
    teamId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

export const adminUpdateConfigSchema = z.object({
  configKey: z.string().min(1),
  configValue: z.any(),
  reason: z.string().max(500).optional(),
});

export const adminBulkOperationSchema = z.object({
  operation: z.enum(['update', 'delete', 'archive']),
  targetType: z.enum(['players', 'teams', 'leagues', 'staff']),
  targetIds: z.array(z.string().min(1)).min(1),
  operationData: z.record(z.any()).optional(),
});

export const adminGetSystemHealthSchema = z.object({
  includeMetrics: z.boolean().optional().default(true),
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().min(1),
  action: z.enum(['resolve', 'reject', 'escalate']),
  resolutionNotes: z.string().max(1000).optional(),
});

export const verifyStatSchema = z.object({
  statId: z.string().min(1),
  verificationStatus: z.enum(['verified', 'rejected', 'pending']),
  verificationNotes: z.string().max(1000).optional(),
});

// Moderation functions schemas
export const reportPostSchema = z.object({
  locationId: z.string().min(1),
  postId: z.string().min(1),
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'violence', 'hate_speech', 'other']),
  details: z.string().max(1000).optional(),
});

export const reviewReportedPostSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'quarantine', 'remove']),
  moderatorNotes: z.string().max(1000).optional(),
});

export const cleanupExpiredQuarantinesSchema = z.object({
  dryRun: z.boolean().optional().default(false),
});

// Stripe functions schemas
export const createStripeCheckoutSessionSchema = z.object({
  amount: z.number().min(50, "Tip amount must be at least $0.50"),
  currency: z.string().default("usd"),
  creatorId: z.string().min(1),
  tipMessage: z.string().max(500).optional(),
});

export const getCreatorTipStatsSchema = z.object({
  creatorId: z.string().min(1),
  timeRange: z.enum(['week', 'month', 'year', 'all']).optional().default('month'),
});

export const stripeWebhookSchema = z.object({
  // Webhook validation will be handled by Stripe signature verification
});

export const processPayoutSchema = z.object({
  creatorId: z.string().min(1),
  amount: z.number().min(1),
  currency: z.string().default("usd"),
});

export const getPayoutStatusSchema = z.object({
  payoutId: z.string().min(1),
});