/**
 * Background Reporting Agent
 * Generates weekly performance reports for teams automatically
 */
/**
 * Scheduled function: Generate weekly reports every Sunday at 6 PM
 */
export declare const generateWeeklyReports: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Manual trigger: Generate report for specific team
 */
export declare const generateTeamReport: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
    reportId: string;
    message: string;
}>, unknown>;
//# sourceMappingURL=reportingAgent.d.ts.map