"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGenerateReportSchema = exports.adminUpdateStaffRoleSchema = exports.adminGetLeagueStatsSchema = exports.updatePlayerPerformanceSchema = exports.getPlayerScheduleSchema = exports.awardAchievementSchema = exports.getPlayerAchievementsSchema = exports.getPlayerStatisticsSchema = exports.updatePlayerProfileSchema = exports.createPlayerProfileSchema = exports.getLeagueStatisticsSchema = exports.generateLeagueScheduleSchema = exports.getLeagueScheduleSchema = exports.getLeagueStandingsSchema = exports.getLeagueOverviewSchema = exports.updateLeagueSchema = exports.createLeagueSchema = exports.updateTeamPerformanceSchema = exports.getTeamScheduleSchema = exports.getTeamStatisticsSchema = exports.removePlayerFromTeamSchema = exports.addPlayerToTeamSchema = exports.getTeamRosterSchema = exports.updateTeamSchema = exports.createTeamSchema = exports.generateAudioSchema = exports.getCallHistorySchema = exports.callStatusWebhookSchema = exports.handleVoiceCallSchema = exports.revokeVoiceTokenSchema = exports.generateVoiceTokenSchema = exports.getNotificationHistorySchema = exports.sendBulkNotificationsSchema = exports.updateNotificationPreferencesSchema = exports.getUserNotificationPreferencesSchema = exports.updateUserActivitySchema = exports.triggerCoachNotificationsSchema = exports.feedbackSchema = exports.memoryEventSchema = exports.statsRecordSchema = exports.playerCreateSchema = exports.teamCreateSchema = exports.authRegisterSchema = exports.authLoginSchema = exports.playerQuerySchema = exports.videoAnalysisSchema = exports.validateParams = exports.validateQuery = exports.validateBody = exports.BadRequest = void 0;
exports.getPayoutStatusSchema = exports.processPayoutSchema = exports.stripeWebhookSchema = exports.getCreatorTipStatsSchema = exports.createStripeCheckoutSessionSchema = exports.cleanupExpiredQuarantinesSchema = exports.reviewReportedPostSchema = exports.reportPostSchema = exports.verifyStatSchema = exports.resolveDisputeSchema = exports.adminGetSystemHealthSchema = exports.adminBulkOperationSchema = exports.adminUpdateConfigSchema = void 0;
const zod_1 = require("zod");
class BadRequest extends Error {
    status = 400;
}
exports.BadRequest = BadRequest;
const validateBody = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
    }
    return parsed.data;
};
exports.validateBody = validateBody;
const validateQuery = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
    }
    return parsed.data;
};
exports.validateQuery = validateQuery;
const validateParams = (schema, data) => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new BadRequest(parsed.error.flatten().formErrors.join('; '));
    }
    return parsed.data;
};
exports.validateParams = validateParams;
// Common validation schemas
exports.videoAnalysisSchema = zod_1.z.object({
    videoUrl: zod_1.z.string().url(),
    playerId: zod_1.z.string().min(1),
    analysisType: zod_1.z.enum(['performance', 'technique', 'tactical']).optional(),
});
exports.playerQuerySchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    includeStats: zod_1.z.boolean().optional(),
});
exports.authLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.authRegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['player', 'coach', 'parent', 'admin']).optional(),
});
// Team creation schema
exports.teamCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    leagueId: zod_1.z.string().min(1),
    coachId: zod_1.z.string().min(1),
    description: zod_1.z.string().max(500).optional(),
});
// Player creation schema
exports.playerCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    teamId: zod_1.z.string().min(1),
    age: zod_1.z.number().int().min(5).max(100),
    position: zod_1.z.string().max(50).optional(),
    jerseyNumber: zod_1.z.number().int().min(1).max(99).optional(),
});
// Stats recording schema
exports.statsRecordSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    gameId: zod_1.z.string().min(1),
    stats: zod_1.z.record(zod_1.z.any()),
    gameDate: zod_1.z.string().datetime().optional(),
});
// Memory event schema
exports.memoryEventSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    eventType: zod_1.z.string().min(1),
    payload: zod_1.z.record(zod_1.z.any()).optional(),
    tenantId: zod_1.z.string().min(1),
    source: zod_1.z.string().default('client'),
});
// Feedback submission schema
exports.feedbackSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    feedbackType: zod_1.z.enum(['bug', 'feature', 'general', 'performance']),
    content: zod_1.z.string().min(1).max(2000),
    tenantId: zod_1.z.string().min(1),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
});
// Notification schemas
exports.triggerCoachNotificationsSchema = zod_1.z.object({
    eventType: zod_1.z.string().min(1),
    coachId: zod_1.z.string().min(1),
    data: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.updateUserActivitySchema = zod_1.z.object({
    activityType: zod_1.z.string().min(1),
    activityData: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.getUserNotificationPreferencesSchema = zod_1.z.object({
// No required fields for GET request
});
exports.updateNotificationPreferencesSchema = zod_1.z.object({
    preferences: zod_1.z.object({
        email: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        sms: zod_1.z.boolean().optional(),
        weeklyReports: zod_1.z.boolean().optional(),
        coachUpdates: zod_1.z.boolean().optional(),
    }),
});
exports.sendBulkNotificationsSchema = zod_1.z.object({
    userIds: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(1000),
    notificationType: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1).max(2000),
    priority: zod_1.z.enum(['low', 'medium', 'high']).optional(),
});
exports.getNotificationHistorySchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).optional().default(50),
    offset: zod_1.z.number().int().min(0).optional().default(0),
    type: zod_1.z.string().optional(),
});
// Voice module schemas
exports.generateVoiceTokenSchema = zod_1.z.object({
    callType: zod_1.z.string().min(1),
    duration: zod_1.z.number().int().min(60).max(86400).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.revokeVoiceTokenSchema = zod_1.z.object({
    tokenId: zod_1.z.string().min(1),
});
exports.handleVoiceCallSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    callType: zod_1.z.string().min(1),
});
exports.callStatusWebhookSchema = zod_1.z.object({
    callId: zod_1.z.string().min(1),
    status: zod_1.z.string().min(1),
    duration: zod_1.z.number().optional(),
    recordingUrl: zod_1.z.string().url().optional(),
});
exports.getCallHistorySchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).optional().default(50),
    offset: zod_1.z.number().int().min(0).optional().default(0),
});
exports.generateAudioSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(5000),
    voice: zod_1.z.string().optional(),
    format: zod_1.z.enum(['mp3', 'wav', 'ogg']).optional().default('mp3'),
});
// Team management schemas
exports.createTeamSchema = zod_1.z.object({
    teamData: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        leagueId: zod_1.z.string().min(1),
        ageGroup: zod_1.z.string().min(1),
        coachId: zod_1.z.string().optional(),
        description: zod_1.z.string().max(500).optional(),
    }),
});
exports.updateTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    updates: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        coachId: zod_1.z.string().optional(),
        description: zod_1.z.string().max(500).optional(),
        status: zod_1.z.enum(['active', 'inactive', 'archived']).optional(),
    }),
});
exports.getTeamRosterSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
});
exports.addPlayerToTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    playerId: zod_1.z.string().min(1),
    position: zod_1.z.string().optional(),
});
exports.removePlayerFromTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    playerId: zod_1.z.string().min(1),
    reason: zod_1.z.string().optional(),
});
exports.getTeamStatisticsSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    timeRange: zod_1.z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});
exports.getTeamScheduleSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.updateTeamPerformanceSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    performanceData: zod_1.z.object({
        result: zod_1.z.enum(['win', 'loss', 'tie']),
        score: zod_1.z.number().int().min(0),
        opponentScore: zod_1.z.number().int().min(0),
        gameDate: zod_1.z.string().datetime(),
        notes: zod_1.z.string().max(1000).optional(),
    }),
});
// League management schemas
exports.createLeagueSchema = zod_1.z.object({
    leagueData: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100),
        sport: zod_1.z.string().min(1),
        ageGroups: zod_1.z.array(zod_1.z.string()).min(1),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        rules: zod_1.z.record(zod_1.z.any()).optional(),
    }),
});
exports.updateLeagueSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    updates: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        sport: zod_1.z.string().min(1).optional(),
        ageGroups: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.enum(['active', 'inactive', 'archived']).optional(),
        rules: zod_1.z.record(zod_1.z.any()).optional(),
    }),
});
exports.getLeagueOverviewSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
});
exports.getLeagueStandingsSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    divisionId: zod_1.z.string().optional(),
});
exports.getLeagueScheduleSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.generateLeagueScheduleSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    scheduleConfig: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        gameDays: zod_1.z.array(zod_1.z.string()).optional(),
        defaultVenue: zod_1.z.string().optional(),
    }).optional(),
});
exports.getLeagueStatisticsSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
    timeRange: zod_1.z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});
// Player management schemas
exports.createPlayerProfileSchema = zod_1.z.object({
    playerData: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(50),
        lastName: zod_1.z.string().min(1).max(50),
        dateOfBirth: zod_1.z.string().datetime(),
        position: zod_1.z.string().optional(),
        emergencyContact: zod_1.z.object({
            name: zod_1.z.string().min(1),
            phone: zod_1.z.string().min(1),
            relationship: zod_1.z.string().min(1),
        }),
    }),
});
exports.updatePlayerProfileSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    updates: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(50).optional(),
        lastName: zod_1.z.string().min(1).max(50).optional(),
        position: zod_1.z.string().optional(),
        emergencyContact: zod_1.z.object({
            name: zod_1.z.string().min(1),
            phone: zod_1.z.string().min(1),
            relationship: zod_1.z.string().min(1),
        }).optional(),
    }),
});
exports.getPlayerStatisticsSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    timeRange: zod_1.z.enum(['week', 'month', 'season', 'all']).optional().default('season'),
});
exports.getPlayerAchievementsSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
});
exports.awardAchievementSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    achievementId: zod_1.z.string().min(1),
    achievementData: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().min(1),
        category: zod_1.z.string().min(1),
        points: zod_1.z.number().int().min(0).optional(),
    }),
});
exports.getPlayerScheduleSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.updatePlayerPerformanceSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1),
    performanceData: zod_1.z.object({
        gameId: zod_1.z.string().min(1),
        stats: zod_1.z.record(zod_1.z.any()),
        notes: zod_1.z.string().max(1000).optional(),
    }),
});
// Admin functions schemas
exports.adminGetLeagueStatsSchema = zod_1.z.object({
    leagueId: zod_1.z.string().min(1),
});
exports.adminUpdateStaffRoleSchema = zod_1.z.object({
    staffId: zod_1.z.string().min(1),
    newRole: zod_1.z.enum(['RecDirector', 'Coach', 'Assistant', 'Volunteer']),
    reason: zod_1.z.string().max(500).optional(),
});
exports.adminGenerateReportSchema = zod_1.z.object({
    reportType: zod_1.z.enum(['league', 'team', 'player', 'financial', 'attendance']),
    filters: zod_1.z.object({
        leagueId: zod_1.z.string().optional(),
        teamId: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }).optional(),
});
exports.adminUpdateConfigSchema = zod_1.z.object({
    configKey: zod_1.z.string().min(1),
    configValue: zod_1.z.any(),
    reason: zod_1.z.string().max(500).optional(),
});
exports.adminBulkOperationSchema = zod_1.z.object({
    operation: zod_1.z.enum(['update', 'delete', 'archive']),
    targetType: zod_1.z.enum(['players', 'teams', 'leagues', 'staff']),
    targetIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
    operationData: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.adminGetSystemHealthSchema = zod_1.z.object({
    includeMetrics: zod_1.z.boolean().optional().default(true),
});
exports.resolveDisputeSchema = zod_1.z.object({
    disputeId: zod_1.z.string().min(1),
    action: zod_1.z.enum(['resolve', 'reject', 'escalate']),
    resolutionNotes: zod_1.z.string().max(1000).optional(),
});
exports.verifyStatSchema = zod_1.z.object({
    statId: zod_1.z.string().min(1),
    verificationStatus: zod_1.z.enum(['verified', 'rejected', 'pending']),
    verificationNotes: zod_1.z.string().max(1000).optional(),
});
// Moderation functions schemas
exports.reportPostSchema = zod_1.z.object({
    locationId: zod_1.z.string().min(1),
    postId: zod_1.z.string().min(1),
    reason: zod_1.z.enum(['spam', 'inappropriate', 'harassment', 'violence', 'hate_speech', 'other']),
    details: zod_1.z.string().max(1000).optional(),
});
exports.reviewReportedPostSchema = zod_1.z.object({
    reportId: zod_1.z.string().min(1),
    action: zod_1.z.enum(['approve', 'reject', 'quarantine', 'remove']),
    moderatorNotes: zod_1.z.string().max(1000).optional(),
});
exports.cleanupExpiredQuarantinesSchema = zod_1.z.object({
    dryRun: zod_1.z.boolean().optional().default(false),
});
// Stripe functions schemas
exports.createStripeCheckoutSessionSchema = zod_1.z.object({
    amount: zod_1.z.number().min(50, "Tip amount must be at least $0.50"),
    currency: zod_1.z.string().default("usd"),
    creatorId: zod_1.z.string().min(1),
    tipMessage: zod_1.z.string().max(500).optional(),
});
exports.getCreatorTipStatsSchema = zod_1.z.object({
    creatorId: zod_1.z.string().min(1),
    timeRange: zod_1.z.enum(['week', 'month', 'year', 'all']).optional().default('month'),
});
exports.stripeWebhookSchema = zod_1.z.object({
// Webhook validation will be handled by Stripe signature verification
});
exports.processPayoutSchema = zod_1.z.object({
    creatorId: zod_1.z.string().min(1),
    amount: zod_1.z.number().min(1),
    currency: zod_1.z.string().default("usd"),
});
exports.getPayoutStatusSchema = zod_1.z.object({
    payoutId: zod_1.z.string().min(1),
});
