"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetSystemHealth = exports.adminBulkOperation = exports.adminUpdateConfig = exports.adminGenerateReport = exports.adminUpdateStaffRole = exports.adminGetLeagueStats = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const logger = __importStar(require("firebase-functions/logger"));
const validation_1 = require("../utils/validation");
const zod_1 = require("zod");
const db = (0, firestore_1.getFirestore)();
const validateRecDirector = async (context) => {
    // TODO: Implement proper validation
    return { auth: context.auth, user: context.user };
};
exports.adminGetLeagueStats = (0, https_1.onCall)(async (data, context) => {
    try {
        await validateRecDirector(context);
        // Validate input using Zod schema
        const leagueStatsSchema = zod_1.z.object({
            leagueId: zod_1.z.string().uuid("Invalid league ID format")
        });
        const validation = validation_1.ValidationMiddleware.validateResponse(leagueStatsSchema, data);
        if (!validation.success) {
            return {
                success: false,
                message: "Invalid league ID",
                data: null,
                errors: validation.errors?.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            };
        }
        const { leagueId } = validation.data || {};
        const leagueRef = db.collection("leagues").doc(leagueId);
        const leagueDoc = await leagueRef.get();
        if (!leagueDoc.exists) {
            return { success: false, message: "League not found" };
        }
        const teamsRef = leagueRef.collection("teams");
        const teamsSnapshot = await teamsRef.get();
        const teams = teamsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const stats = {
            totalTeams: teams.length,
            totalPlayers: teams.reduce((sum, team) => sum + (team.players?.length || 0), 0),
            averageTeamSize: teams.length > 0 ? teams.reduce((sum, team) => sum + (team.players?.length || 0), 0) / teams.length : 0,
        };
        const result = { success: true, data: stats };
        // Validate response before sending
        const responseValidation = validation_1.ValidationMiddleware.validateResponse(validation_1.Schemas.ApiResponse, result);
        return responseValidation.success ? responseValidation.data : {
            success: false,
            message: "Response validation failed",
            data: null
        };
    }
    catch (error) {
        logger.error("Error getting league stats", error);
        return { success: false, message: "Failed to get league stats" };
    }
});
exports.adminUpdateStaffRole = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        // Validate input using Zod schema
        const staffRoleUpdateSchema = zod_1.z.object({
            staffId: zod_1.z.string().uuid("Invalid staff ID format"),
            newRole: zod_1.z.enum(["admin", "director", "coach", "staff"], {
                errorMap: () => ({ message: "Invalid role. Must be admin, director, coach, or staff" })
            }),
            permissions: zod_1.z.array(zod_1.z.string()).min(1, "At least one permission is required")
        });
        const validation = validation_1.ValidationMiddleware.validateResponse(staffRoleUpdateSchema, data);
        if (!validation.success) {
            return {
                success: false,
                message: "Invalid staff role update data",
                data: null,
                errors: validation.errors?.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            };
        }
        const { staffId, newRole, permissions } = validation.data || {};
        const staffRef = db.collection("townStaff").doc(staffId);
        await staffRef.update({
            role: newRole,
            permissions,
            updatedAt: new Date(),
            updatedBy: auth.uid,
        });
        const result = { success: true, message: "Staff role updated successfully" };
        // Validate response before sending
        const responseValidation = validation_1.ValidationMiddleware.validateResponse(validation_1.Schemas.ApiResponse, result);
        return responseValidation.success ? responseValidation.data : {
            success: false,
            message: "Response validation failed",
            data: null
        };
    }
    catch (error) {
        logger.error("Error updating staff role", error);
        return { success: false, message: "Failed to update staff role" };
    }
});
exports.adminGenerateReport = (0, https_1.onCall)(async (data, context) => {
    try {
        await validateRecDirector(context);
        // Validate input using Zod schema
        const reportGenerationSchema = zod_1.z.object({
            reportType: zod_1.z.enum(["league", "team", "player", "financial", "attendance"], {
                errorMap: () => ({ message: "Invalid report type. Must be league, team, player, financial, or attendance" })
            }),
            dateRange: zod_1.z.object({
                start: zod_1.z.string().datetime("Invalid start date format"),
                end: zod_1.z.string().datetime("Invalid end date format")
            }).refine(data => new Date(data.start) < new Date(data.end), {
                message: "Start date must be before end date"
            })
        });
        const validation = validation_1.ValidationMiddleware.validateResponse(reportGenerationSchema, data);
        if (!validation.success) {
            return {
                success: false,
                message: "Invalid report generation data",
                data: null,
                errors: validation.errors?.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            };
        }
        const { reportType, dateRange } = validation.data || {};
        // TODO: Implement report generation logic
        const report = {
            type: reportType,
            dateRange: {
                start: new Date(dateRange.start),
                end: new Date(dateRange.end)
            },
            generatedAt: new Date(),
            data: {},
        };
        const result = { success: true, data: report };
        // Validate response before sending
        const responseValidation = validation_1.ValidationMiddleware.validateResponse(validation_1.Schemas.ApiResponse, result);
        return responseValidation.success ? responseValidation.data : {
            success: false,
            message: "Response validation failed",
            data: null
        };
    }
    catch (error) {
        logger.error("Error generating report", error);
        return { success: false, message: "Failed to generate report" };
    }
});
exports.adminUpdateConfig = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        const { configKey, configValue } = data;
        const configRef = db.collection("adminConfig").doc(configKey);
        await configRef.set({
            value: configValue,
            updatedAt: new Date(),
            updatedBy: auth.uid,
        });
        return { success: true, message: "Config updated successfully" };
    }
    catch (error) {
        logger.error("Error updating config", error);
        return { success: false, message: "Failed to update config" };
    }
});
exports.adminBulkOperation = (0, https_1.onCall)(async (data, context) => {
    try {
        const { auth } = await validateRecDirector(context);
        const { operation, registrationIds, parameters } = data;
        const batch = db.batch();
        switch (operation) {
            case "approve":
                registrationIds.forEach(id => {
                    const ref = db.collection("registrations").doc(id);
                    batch.update(ref, {
                        status: "approved",
                        approvedAt: new Date(),
                        approvedBy: auth.uid,
                        ...parameters
                    });
                });
                break;
            case "reject":
                registrationIds.forEach(id => {
                    const ref = db.collection("registrations").doc(id);
                    batch.update(ref, {
                        status: "rejected",
                        rejectedAt: new Date(),
                        rejectedBy: auth.uid,
                        ...parameters
                    });
                });
                break;
            case "waitlist":
                registrationIds.forEach(id => {
                    const ref = db.collection("registrations").doc(id);
                    batch.update(ref, {
                        status: "waitlisted",
                        waitlistedAt: new Date(),
                        waitlistedBy: auth.uid,
                        ...parameters
                    });
                });
                break;
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
        await batch.commit();
        return { success: true, message: `Bulk operation '${operation}' completed successfully` };
    }
    catch (error) {
        logger.error("Error performing bulk operation", error);
        return { success: false, message: "Failed to perform bulk operation" };
    }
});
exports.adminGetSystemHealth = (0, https_1.onCall)(async (data, context) => {
    try {
        await validateRecDirector(context);
        // TODO: Implement system health checks
        const health = {
            database: "healthy",
            storage: "healthy",
            functions: "healthy",
            lastChecked: new Date(),
        };
        return { success: true, data: health };
    }
    catch (error) {
        logger.error("Error getting system health", error);
        return { success: false, message: "Failed to get system health" };
    }
});
