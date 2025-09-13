import { onStatSubmissionCreated } from '../agents/verificationAgent.js';
import { generateWeeklyReports, generateTeamReport } from '../agents/reportingAgent.js';
export declare const db: FirebaseFirestore.Firestore;
export declare const health: import("firebase-functions/v2/https").HttpsFunction;
export declare const createTeam: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    teamId: string;
    message: string;
}>, unknown>;
export declare const createPlayer: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    playerId: string;
    message: string;
}>, unknown>;
export declare const recordStats: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    statsId: string;
    message: string;
}>, unknown>;
export declare const captureMemoryEvent: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    eventId: string;
    message: string;
}>, unknown>;
export declare const submitFeedback: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    feedbackId: string;
    message: string;
}>, unknown>;
export { onStatSubmissionCreated, generateWeeklyReports, generateTeamReport };
//# sourceMappingURL=index.d.ts.map