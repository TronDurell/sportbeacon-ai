/**
 * Daily Waitlist Scan - Runs every day at 8:00 AM
 * Scans all waitlist entries and processes age overrides, sibling pairings, and capacity changes
 */
export declare const waitlistDailyScan: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Weekly Director Digest - Runs every Monday at 9:00 AM
 * Compiles weekly reports for Rec Directors including approvals, denials, and metrics
 */
export declare const weeklyDirectorDigest: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Parent Follow-up Emails - Runs every day at 10:00 AM
 * Sends follow-up emails to parents with pending requests or status updates
 */
export declare const parentFollowUpEmails: import("firebase-functions/v2/scheduler").ScheduleFunction;
/**
 * Monthly Analytics Report - Runs on the 1st of every month at 7:00 AM
 * Generates comprehensive monthly analytics and performance reports
 */
export declare const monthlyAnalyticsReport: import("firebase-functions/v2/scheduler").ScheduleFunction;
//# sourceMappingURL=index.d.ts.map