import {onCall} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import {
  ApiContext,
  ApiRequest,
  Team,
  League,
  User
} from "../types";
import { ValidationMiddleware, Schemas } from "../utils/validation";
import { z } from "zod";

const db = getFirestore();

const validateRecDirector = async (context: ApiContext) => {
  // TODO: Implement proper validation
  return {auth: context.auth, user: context.user};
};

export const adminGetLeagueStats = onCall(async (data, context) => {
  try {
    await validateRecDirector(context as any);

    // Validate input using Zod schema
    const leagueStatsSchema = z.object({
      leagueId: z.string().uuid("Invalid league ID format")
    });
    
    const validation = ValidationMiddleware.validateResponse(leagueStatsSchema, data);
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

    const {leagueId} = validation.data || {};

    if (!leagueId) {
      return {success: false, message: "League ID is required"};
    }

    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await leagueRef.get();

    if (!leagueDoc.exists) {
      return {success: false, message: "League not found"};
    }

    const teamsRef = leagueRef.collection("teams");
    const teamsSnapshot = await teamsRef.get();

    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];

    const stats = {
      totalTeams: teams.length,
      totalPlayers: teams.reduce((sum: number, team: Team) => sum + (team.players?.length || 0), 0),
      averageTeamSize: teams.length > 0 ? teams.reduce((sum: number, team: Team) => sum + (team.players?.length || 0), 0) / teams.length : 0,
    };

    const result = {success: true, data: stats};
    
    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      result
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (error) {
    logger.error("Error getting league stats", error);
    return {success: false, message: "Failed to get league stats"};
  }
});

export const adminUpdateStaffRole = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context as any);

    // Validate input using Zod schema
    const staffRoleUpdateSchema = z.object({
      staffId: z.string().uuid("Invalid staff ID format"),
      newRole: z.enum(["admin", "director", "coach", "staff"], {
        errorMap: () => ({ message: "Invalid role. Must be admin, director, coach, or staff" })
      }),
      permissions: z.array(z.string()).min(1, "At least one permission is required")
    });
    
    const validation = ValidationMiddleware.validateResponse(staffRoleUpdateSchema, data);
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

    const {staffId, newRole, permissions} = validation.data || {};

    if (!staffId) {
      return {success: false, message: "Staff ID is required"};
    }

    const staffRef = db.collection("townStaff").doc(staffId);
    await staffRef.update({
      role: newRole,
      permissions,
      updatedAt: new Date(),
      updatedBy: (auth as any).uid,
    });

    const result = {success: true, message: "Staff role updated successfully"};
    
    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      result
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (error) {
    logger.error("Error updating staff role", error);
    return {success: false, message: "Failed to update staff role"};
  }
});

export const adminGenerateReport = onCall(async (data, context) => {
  try {
    await validateRecDirector(context as any);

    // Validate input using Zod schema
    const reportGenerationSchema = z.object({
      reportType: z.enum(["league", "team", "player", "financial", "attendance"], {
        errorMap: () => ({ message: "Invalid report type. Must be league, team, player, financial, or attendance" })
      }),
      dateRange: z.object({
        start: z.string().datetime("Invalid start date format"),
        end: z.string().datetime("Invalid end date format")
      }).refine(data => new Date(data.start) < new Date(data.end), {
        message: "Start date must be before end date"
      })
    });
    
    const validation = ValidationMiddleware.validateResponse(reportGenerationSchema, data);
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

    const {reportType, dateRange} = validation.data || {};

    if (!dateRange?.start || !dateRange?.end) {
      return {success: false, message: "Date range is required"};
    }

    // TODO: Implement report generation logic
    const report = {
      type: reportType,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      },
      generatedAt: new Date(),
      data: {} as Record<string, unknown>,
    };

    const result = {success: true, data: report};
    
    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      result
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (error) {
    logger.error("Error generating report", error);
    return {success: false, message: "Failed to generate report"};
  }
});

export const adminUpdateConfig = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context as any);

    const {configKey, configValue} = (data as any);

    const configRef = db.collection("adminConfig").doc(configKey);
    await configRef.set({
      value: configValue,
      updatedAt: new Date(),
      updatedBy: (auth as any).uid,
    });

    return {success: true, message: "Config updated successfully"};
  } catch (error) {
    logger.error("Error updating config", error);
    return {success: false, message: "Failed to update config"};
  }
});

export const adminBulkOperation = onCall(async (data, context) => {
  try {
    const {auth} = await validateRecDirector(context as any);

    const {operation, registrationIds, parameters} = (data as any);

    const batch = db.batch();

    switch (operation) {
    case "approve":
      registrationIds.forEach((id: string) => {
        const ref = db.collection("registrations").doc(id);
        batch.update(ref, {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: (auth as any).uid,
          ...parameters
        });
      });
      break;

    case "reject":
      registrationIds.forEach((id: string) => {
        const ref = db.collection("registrations").doc(id);
        batch.update(ref, {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: (auth as any).uid,
          ...parameters
        });
      });
      break;

    case "waitlist":
      registrationIds.forEach((id: string) => {
        const ref = db.collection("registrations").doc(id);
        batch.update(ref, {
          status: "waitlisted",
          waitlistedAt: new Date(),
          waitlistedBy: (auth as any).uid,
          ...parameters
        });
      });
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
    }

    await batch.commit();

    return {success: true, message: `Bulk operation '${operation}' completed successfully`};
  } catch (error) {
    logger.error("Error performing bulk operation", error);
    return {success: false, message: "Failed to perform bulk operation"};
  }
});

export const adminGetSystemHealth = onCall(async (data, context) => {
  try {
    await validateRecDirector(context as any);

    // TODO: Implement system health checks
    const health = {
      database: "healthy",
      storage: "healthy",
      functions: "healthy",
      lastChecked: new Date(),
    };

    return {success: true, data: health};
  } catch (error) {
    logger.error("Error getting system health", error);
    return {success: false, message: "Failed to get system health"};
  }
});
