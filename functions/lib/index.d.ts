/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import { ApiResponse, LoginRequest } from "./types";
export declare const authLogin: import("firebase-functions/v2/https").CallableFunction<LoginRequest, Promise<ApiResponse<unknown>>, unknown>;
export declare const authLogout: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
export declare const authSession: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        uid: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const authRefresh: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const authRegister: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        uid: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const analyticsEvents: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
export declare const analyticsMetrics: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const analyticsSync: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>, unknown>;
export declare const coachAssistant: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const coachFeedback: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const aiPlayerAnalysis: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const aiPoseAnalysis: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const stripeCheckout: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const pdfReports: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const uploadPdf: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        fileName: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const voiceToken: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        tokenType: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const audioGenerate: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        text: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getPlayer: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getPlayerAiAnalysis: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getPlayerVideoClips: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getPlayerDrillHistory: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getEvents: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getEvent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        eventId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getVenues: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const contentAnalyze: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const contentReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const assistantTranscribe: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const assistantAnalyzePerformance: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const assistantSuggestDrills: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const submitLeague: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getWaitlist: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const processAgeOverride: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const processSiblingPairing: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const getAuditLogs: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const shareEmail: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        recipientEmail: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const reportsShare: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        reportId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const videoInit: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        fileName: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const videoComplete: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        videoId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const videoAnalyze: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        videoId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const tipsCreate: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        title: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const playerAssessment: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {
        playerId: string;
    };
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const emailsSendParentUpdate: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    message: string;
    data: {};
    error?: undefined;
} | {
    success: boolean;
    message: string;
    error: unknown;
    data?: undefined;
}>, unknown>;
export declare const onWaitlistCreated: import("firebase-functions/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    entryId: string;
}>>;
export { waitlistDailyScan, weeklyDirectorDigest, parentFollowUpEmails, monthlyAnalyticsReport, } from "./scheduled";
export { onWaitlistEntryCreated, onAgeOverrideCreated, onSiblingPairingCreated, onRegistrationUpdated, onTownStaffSessionCreated, onNotificationCreated, onAuditLogCreated, onSiblingRequestCreated, } from "./triggers";
export { adminGetLeagueStats, adminUpdateStaffRole, adminGenerateReport, adminUpdateConfig, adminBulkOperation, adminSystemHealth, } from "./admin";
export { generateVoiceToken, revokeVoiceToken, handleVoiceCall, callStatusWebhook, getCallHistory, generateAudio, } from "./voice";
export { triggerCoachNotifications, updateUserActivity, getUserNotificationPreferences, updateNotificationPreferences, sendBulkNotifications, getNotificationHistory, } from "./notifications";
export { createPlayerProfile, updatePlayerProfile, getPlayerStatistics, getPlayerAchievements, awardAchievement, getPlayerSchedule, updatePlayerPerformance, } from "./player";
export { createTeam, updateTeam, getTeamRoster, addPlayerToTeam, removePlayerFromTeam, getTeamStatistics, getTeamSchedule, updateTeamPerformance, } from "./team";
export { createLeague, updateLeague, getLeagueOverview, getLeagueStandings, getLeagueSchedule, generateLeagueSchedule, getLeagueStatistics, } from "./league";
export declare const api: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=index.d.ts.map