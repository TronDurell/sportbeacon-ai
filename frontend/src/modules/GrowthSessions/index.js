// GrowthSessions Module - Sports Business Intelligence Layer
// Renamed from ScrollLiberation for clarity and sports industry relevance
export { usePlaymakerIntentEngine } from "./PlaymakerIntentEngine";
export { useDrillScrollSessionManager } from "./DrillScrollSessionManager";
export { useScoutRoleCurationHub } from "./ScoutRoleCurationHub";
export { CoachNudgeSystem, useCoachNudgeGenerator } from "./CoachNudgeSystem";
export { SessionLiberationAnalytics, useSessionLiberationAnalytics } from "./SessionLiberationAnalytics";
// Module configuration
export const GROWTH_SESSIONS_CONFIG = {
    moduleName: "GrowthSessions",
    version: "2.0.0",
    description: "AI-powered sports growth session management and liberation analytics",
    features: [
        "Playmaker Intent Engine",
        "Drill Scroll Session Manager",
        "Scout Role Curation Hub",
        "Coach Nudge System",
        "Session Liberation Analytics"
    ]
};
