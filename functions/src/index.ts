/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express from "express";
import cors from "cors";
import {
  AuthContext,
  ValidatedContext,
  ApiResponse,
  LoginRequest,
  isAuthContext,
  isTownStaffData,
  CallableContextV2,
} from "./types";
import { ValidationMiddleware, Schemas } from "./utils/validation";

// Initialize Firebase Admin
initializeApp();

// Export Firestore instance for use in other modules
export const db = getFirestore();

const app = express();
const corsHandler = cors({origin: true});

// Middleware
app.use(express.json());
app.use(corsHandler);

// Helper function to validate user authentication
const validateAuth = async (context: CallableContextV2): Promise<AuthContext> => {
  if (!context || !isAuthContext(context)) {
    throw new Error("Unauthorized: User not authenticated");
  }
  return context.auth;
};

// Helper function to validate Town Staff role
const validateTownStaff = async (context: CallableContextV2): Promise<ValidatedContext> => {
  const auth = await validateAuth(context);
  const db = getFirestore();
  const staffDoc = await db.collection("townStaff").doc(auth.uid).get();

  if (!staffDoc.exists) {
    throw new Error("Unauthorized: User is not Town Staff");
  }

  const staffData = staffDoc.data();
  if (!isTownStaffData(staffData) || !staffData.isActive) {
    throw new Error("Unauthorized: User is not active Town Staff");
  }

  return {auth, staffData};
};

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

export const authLogin = onCall<LoginRequest, ApiResponse>((data, context) => {
  try {
    // Validate input using Zod schema
    const loginSchema = Schemas.CreateUser.pick({
      email: true,
      password: true
    });
    
    const validation = ValidationMiddleware.validateResponse(loginSchema, data);
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid login data",
        data: null,
        errors: validation.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    
    const { email, password } = validation.data || {};
    
    // TODO: Add rate limiting for login attempts
    // TODO: Add CAPTCHA for multiple failed attempts
    // TODO: Implement proper Firebase Auth integration
    
    // TODO: Implement proper authentication
    const authResult: ApiResponse = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          uid: "user123",
          email,
          role: "parent"
        },
        token: process.env.JWT_SECRET || "mock-jwt-token"
      }
    };

    // Validate response before sending
    const responseValidation = ValidationMiddleware.validateResponse(
      Schemas.ApiResponse,
      authResult
    );
    
    return responseValidation.success ? responseValidation.data : {
      success: false,
      message: "Response validation failed",
      data: null
    };
  } catch (error) {
    logger.error("Login error", error);
    const errorResult: ApiResponse = {
      success: false,
      message: "Login failed",
      data: null
    };
    return errorResult;
  }
});

export const authLogout = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    logger.info("Logout attempt");
    return {success: true, message: "Logout successful"};
  } catch (err) {
    logger.error("Logout error", err);
    return {success: false, message: "Logout failed", error: err};
  }
});

export const authSession = onCall(async (_data, context) => {
  try {
    const auth = await validateAuth(context);
    return {success: true, message: "Session valid", data: {uid: auth.uid}};
  } catch (err) {
    logger.error("Session error", err);
    return {success: false, message: "Session invalid", error: err};
  }
});

export const authRefresh = onCall(async (_data, _context) => {
  try {
    return {success: true, message: "Token refreshed", data: {}};
  } catch (err) {
    logger.error("Token refresh error", err);
    return {success: false, message: "Token refresh failed", error: err};
  }
});

export const authRegister = onCall(async (data, context) => {
  try {
    // Validate input using Zod schema
    const validation = ValidationMiddleware.validateResponse(Schemas.CreateUser, data);
    if (!validation.success) {
      return {
        success: false,
        message: "Invalid registration data",
        data: null,
        errors: validation.errors?.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
    }
    
    const userData = validation.data;
    
    // TODO: Add rate limiting for registration attempts
    // TODO: Add email verification
    // TODO: Add phone verification if provided
    // TODO: Implement proper Firebase Auth user creation
    // TODO: Add CAPTCHA for registration
    
    const result = {success: true, message: "Registration successful", data: {uid: "new-user-123"}};
    
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
  } catch (err) {
    logger.error("Registration error", err);
    return {success: false, message: "Registration failed", error: err};
  }
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

export const analyticsEvents = onCall(async (data, context) => {
  try {
    const auth = await validateAuth(context);
    logger.info("Analytics event", {data, uid: auth.uid});
    return {success: true, message: "Event tracked"};
  } catch (err) {
    logger.error("Analytics error", err);
    return {success: false, message: "Analytics failed", error: err};
  }
});

export const analyticsMetrics = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Metrics retrieved", data: {}};
  } catch (err) {
    logger.error("Metrics error", err);
    return {success: false, message: "Metrics failed", error: err};
  }
});

export const analyticsSync = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Analytics synced"};
  } catch (err) {
    logger.error("Analytics sync error", err);
    return {success: false, message: "Analytics sync failed", error: err};
  }
});

// ============================================================================
// COACH ROUTES
// ============================================================================

export const coachAssistant = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Coach assistant response", data: {}};
  } catch (err) {
    logger.error("Coach assistant error", err);
    return {success: false, message: "Coach assistant failed", error: err};
  }
});

export const coachFeedback = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Feedback processed", data: {}};
  } catch (err) {
    logger.error("Coach feedback error", err);
    return {success: false, message: "Feedback failed", error: err};
  }
});

// ============================================================================
// AI ROUTES
// ============================================================================

export const aiPlayerAnalysis = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Player analysis completed", data: {}};
  } catch (err) {
    logger.error("AI player analysis error", err);
    return {success: false, message: "Player analysis failed", error: err};
  }
});

export const aiPoseAnalysis = onCall(async (_data, context) => {
  try {
    await validateAuth(context);
    return {success: true, message: "Pose analysis completed", data: {}};
  } catch (err) {
    logger.error("Pose analysis error", err);
    return {success: false, message: "Pose analysis failed", error: err};
  }
});

// ============================================================================
// STRIPE PAYMENT ROUTES
// ============================================================================

export const stripeCheckout = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      amount, 
      currency, 
      description, 
      successUrl, 
      cancelUrl,
      metadata 
    } = data as {
      amount?: number;
      currency?: string;
      description?: string;
      successUrl?: string;
      cancelUrl?: string;
      metadata?: Record<string, string>;
    };
    
    // Validate required fields
    if (!amount || typeof amount !== 'number') {
      throw new Error('Amount is required and must be a number');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    
    if (amount > 1000000) { // $10,000 limit
      throw new Error('Amount exceeds maximum allowed');
    }
    
    if (!currency || typeof currency !== 'string') {
      throw new Error('Currency is required and must be a string');
    }
    
    const validCurrencies = ['usd', 'eur', 'gbp', 'cad', 'aud'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      throw new Error(`Currency must be one of: ${validCurrencies.join(', ')}`);
    }
    
    if (!description || typeof description !== 'string') {
      throw new Error('Description is required and must be a string');
    }
    
    if (description.length < 1 || description.length > 255) {
      throw new Error('Description must be between 1 and 255 characters');
    }
    
    // Validate URLs if provided
    if (successUrl !== undefined) {
      if (typeof successUrl !== 'string') {
        throw new Error('Success URL must be a string');
      }
      
      try {
        new URL(successUrl);
      } catch {
        throw new Error('Success URL must be a valid URL');
      }
    }
    
    if (cancelUrl !== undefined) {
      if (typeof cancelUrl !== 'string') {
        throw new Error('Cancel URL must be a string');
      }
      
      try {
        new URL(cancelUrl);
      } catch {
        throw new Error('Cancel URL must be a valid URL');
      }
    }
    
    // Validate metadata if provided
    if (metadata !== undefined) {
      if (typeof metadata !== 'object' || metadata === null) {
        throw new Error('Metadata must be an object');
      }
      
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof key !== 'string' || key.length > 40) {
          throw new Error('Metadata keys must be strings no longer than 40 characters');
        }
        
        if (typeof value !== 'string' || value.length > 500) {
          throw new Error('Metadata values must be strings no longer than 500 characters');
        }
      }
    }
    
    // TODO: Add rate limiting for checkout requests
    // TODO: Add validation that user has permission to make this purchase
    // TODO: Add fraud detection checks
    
    return {success: true, message: "Checkout session created", data: {}};
  } catch (err) {
    logger.error("Stripe checkout error", err);
    return {success: false, message: "Checkout failed", error: err};
  }
});

// ============================================================================
// PDF ROUTES
// ============================================================================

export const pdfReports = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      playerId, 
      reportType, 
      dateRange, 
      includeCharts, 
      includeRecommendations 
    } = data as {
      playerId?: string;
      reportType?: string;
      dateRange?: { start: string; end: string };
      includeCharts?: boolean;
      includeRecommendations?: boolean;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate report type if provided
    if (reportType !== undefined) {
      if (typeof reportType !== 'string') {
        throw new Error('Report type must be a string');
      }
      
      const validReportTypes = ['performance', 'progress', 'skills', 'comprehensive'];
      if (!validReportTypes.includes(reportType)) {
        throw new Error(`Report type must be one of: ${validReportTypes.join(', ')}`);
      }
    }
    
    // Validate date range if provided
    if (dateRange !== undefined) {
      if (typeof dateRange !== 'object' || dateRange === null) {
        throw new Error('Date range must be an object');
      }
      
      if (dateRange.start !== undefined) {
        if (typeof dateRange.start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateRange.start)) {
          throw new Error('Start date must be in YYYY-MM-DD format');
        }
      }
      
      if (dateRange.end !== undefined) {
        if (typeof dateRange.end !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateRange.end)) {
          throw new Error('End date must be in YYYY-MM-DD format');
        }
      }
    }
    
    // Validate boolean fields
    if (includeCharts !== undefined && typeof includeCharts !== 'boolean') {
      throw new Error('includeCharts must be a boolean');
    }
    
    if (includeRecommendations !== undefined && typeof includeRecommendations !== 'boolean') {
      throw new Error('includeRecommendations must be a boolean');
    }
    
    // TODO: Add user permission check to ensure user can access this player's reports
    // TODO: Add rate limiting for PDF report generation
    
    return {success: true, message: "PDF reports retrieved", data: {playerId}};
  } catch (err) {
    logger.error("PDF reports error", err);
    return {success: false, message: "PDF reports failed", error: err};
  }
});

export const uploadPdf = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      fileName, 
      fileSize, 
      fileType, 
      playerId, 
      reportType 
    } = data as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      playerId?: string;
      reportType?: string;
    };
    
    // Validate required fields
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('File name is required and must be a string');
    }
    
    if (fileName.length < 1 || fileName.length > 255) {
      throw new Error('File name must be between 1 and 255 characters');
    }
    
    // Validate file name format (no path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('Invalid file name format');
    }
    
    if (!fileSize || typeof fileSize !== 'number') {
      throw new Error('File size is required and must be a number');
    }
    
    // Validate file size (max 10MB)
    if (fileSize <= 0 || fileSize > 10 * 1024 * 1024) {
      throw new Error('File size must be between 1 byte and 10MB');
    }
    
    if (!fileType || typeof fileType !== 'string') {
      throw new Error('File type is required and must be a string');
    }
    
    // Validate file type
    if (fileType !== 'application/pdf') {
      throw new Error('File type must be application/pdf');
    }
    
    // Validate player ID if provided
    if (playerId !== undefined) {
      if (typeof playerId !== 'string') {
        throw new Error('Player ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        throw new Error('Invalid player ID format');
      }
    }
    
    // Validate report type if provided
    if (reportType !== undefined) {
      if (typeof reportType !== 'string') {
        throw new Error('Report type must be a string');
      }
      
      const validReportTypes = ['performance', 'progress', 'skills', 'comprehensive', 'medical'];
      if (!validReportTypes.includes(reportType)) {
        throw new Error(`Report type must be one of: ${validReportTypes.join(', ')}`);
      }
    }
    
    // TODO: Add user permission check to ensure user can upload for this player
    // TODO: Add rate limiting for PDF uploads
    // TODO: Add virus scanning for uploaded files
    
    return {success: true, message: "PDF uploaded", data: {fileName}};
  } catch (err) {
    logger.error("PDF upload error", err);
    return {success: false, message: "PDF upload failed", error: err};
  }
});

// ============================================================================
// VOICE ROUTES
// ============================================================================

export const voiceToken = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      tokenType, 
      duration, 
      permissions, 
      targetUserId 
    } = data as {
      tokenType?: string;
      duration?: number;
      permissions?: string[];
      targetUserId?: string;
    };
    
    // Validate required fields
    if (!tokenType || typeof tokenType !== 'string') {
      throw new Error('Token type is required and must be a string');
    }
    
    const validTokenTypes = ['call', 'recording', 'transcription', 'analysis'];
    if (!validTokenTypes.includes(tokenType)) {
      throw new Error(`Token type must be one of: ${validTokenTypes.join(', ')}`);
    }
    
    // Validate duration if provided
    if (duration !== undefined) {
      if (typeof duration !== 'number') {
        throw new Error('Duration must be a number');
      }
      
      // Duration in seconds, max 24 hours
      if (duration < 1 || duration > 86400) {
        throw new Error('Duration must be between 1 second and 24 hours');
      }
    }
    
    // Validate permissions if provided
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }
      
      const validPermissions = ['read', 'write', 'delete', 'share', 'admin'];
      for (const permission of permissions) {
        if (typeof permission !== 'string' || !validPermissions.includes(permission)) {
          throw new Error(`Invalid permission: ${permission}. Must be one of: ${validPermissions.join(', ')}`);
        }
      }
    }
    
    // Validate target user ID if provided
    if (targetUserId !== undefined) {
      if (typeof targetUserId !== 'string') {
        throw new Error('Target user ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(targetUserId)) {
        throw new Error('Invalid target user ID format');
      }
    }
    
    // TODO: Add user permission check to ensure user can generate tokens
    // TODO: Add rate limiting for token generation
    // TODO: Add token expiration validation
    
    return {success: true, message: "Voice token generated", data: {tokenType}};
  } catch (err) {
    logger.error("Voice token error", err);
    return {success: false, message: "Voice token failed", error: err};
  }
});

export const audioGenerate = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      text, 
      voice, 
      language, 
      speed, 
      pitch, 
      format 
    } = data as {
      text?: string;
      voice?: string;
      language?: string;
      speed?: number;
      pitch?: number;
      format?: string;
    };
    
    // Validate required fields
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }
    
    if (text.length < 1 || text.length > 5000) {
      throw new Error('Text must be between 1 and 5,000 characters');
    }
    
    // Validate voice if provided
    if (voice !== undefined) {
      if (typeof voice !== 'string') {
        throw new Error('Voice must be a string');
      }
      
      const validVoices = ['male', 'female', 'child', 'coach', 'announcer'];
      if (!validVoices.includes(voice)) {
        throw new Error(`Voice must be one of: ${validVoices.join(', ')}`);
      }
    }
    
    // Validate language if provided
    if (language !== undefined) {
      if (typeof language !== 'string') {
        throw new Error('Language must be a string');
      }
      
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt'];
      if (!validLanguages.includes(language)) {
        throw new Error(`Language must be one of: ${validLanguages.join(', ')}`);
      }
    }
    
    // Validate speed if provided
    if (speed !== undefined) {
      if (typeof speed !== 'number') {
        throw new Error('Speed must be a number');
      }
      
      if (speed < 0.5 || speed > 2.0) {
        throw new Error('Speed must be between 0.5 and 2.0');
      }
    }
    
    // Validate pitch if provided
    if (pitch !== undefined) {
      if (typeof pitch !== 'number') {
        throw new Error('Pitch must be a number');
      }
      
      if (pitch < -20 || pitch > 20) {
        throw new Error('Pitch must be between -20 and 20');
      }
    }
    
    // Validate format if provided
    if (format !== undefined) {
      if (typeof format !== 'string') {
        throw new Error('Format must be a string');
      }
      
      const validFormats = ['mp3', 'wav', 'm4a', 'ogg'];
      if (!validFormats.includes(format)) {
        throw new Error(`Format must be one of: ${validFormats.join(', ')}`);
      }
    }
    
    // TODO: Add content filtering for inappropriate text
    // TODO: Add rate limiting for audio generation
    // TODO: Add user permission check for audio generation
    
    return {success: true, message: "Audio generated", data: {text: text.substring(0, 100)}};
  } catch (err) {
    logger.error("Audio generation error", err);
    return {success: false, message: "Audio generation failed", error: err};
  }
});

// ============================================================================
// PLAYER ROUTES
// ============================================================================

export const getPlayer = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { playerId } = data as { playerId?: string };
    
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    return {success: true, message: "Player data retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Get player error", err);
    return {success: false, message: "Get player failed", error: err};
  }
});

export const getPlayerAiAnalysis = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { playerId } = data as { playerId?: string };
    
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    return {success: true, message: "Player AI analysis retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Player AI analysis error", err);
    return {success: false, message: "Player AI analysis failed", error: err};
  }
});

export const getPlayerVideoClips = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { playerId, includeVideos, includeAnalytics, limit, offset } = data as {
      playerId?: string;
      includeVideos?: boolean;
      includeAnalytics?: boolean;
      limit?: number;
      offset?: number;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate optional fields
    if (includeVideos !== undefined && typeof includeVideos !== 'boolean') {
      throw new Error('includeVideos must be a boolean');
    }
    
    if (includeAnalytics !== undefined && typeof includeAnalytics !== 'boolean') {
      throw new Error('includeAnalytics must be a boolean');
    }
    
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add user permission check to ensure user can access this player's data
    // TODO: Add rate limiting for video clip requests
    
    return {success: true, message: "Player video clips retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Player video clips error", err);
    return {success: false, message: "Player video clips failed", error: err};
  }
});

export const getPlayerDrillHistory = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { playerId, startDate, endDate, drillType, limit, offset } = data as {
      playerId?: string;
      startDate?: string;
      endDate?: string;
      drillType?: string;
      limit?: number;
      offset?: number;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate date formats if provided
    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('startDate must be in YYYY-MM-DD format');
      }
    }
    
    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('endDate must be in YYYY-MM-DD format');
      }
    }
    
    // Validate date range if both dates provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }
    
    // Validate drill type if provided
    if (drillType !== undefined) {
      if (typeof drillType !== 'string' || drillType.length < 1 || drillType.length > 50) {
        throw new Error('drillType must be a string between 1 and 50 characters');
      }
    }
    
    // Validate pagination parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add user permission check to ensure user can access this player's data
    // TODO: Add rate limiting for drill history requests
    
    return {success: true, message: "Player drill history retrieved", data: {playerId}};
  } catch (err) {
    logger.error("Player drill history error", err);
    return {success: false, message: "Player drill history failed", error: err};
  }
});

// ============================================================================
// EVENT ROUTES
// ============================================================================

export const getEvents = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      sport, 
      ageGroup, 
      startDate, 
      endDate, 
      venueId, 
      status, 
      limit, 
      offset 
    } = data as {
      sport?: string;
      ageGroup?: string;
      startDate?: string;
      endDate?: string;
      venueId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    };
    
    // Validate sport if provided
    if (sport !== undefined) {
      if (typeof sport !== 'string') {
        throw new Error('Sport must be a string');
      }
      
      const validSports = ['soccer', 'basketball', 'baseball', 'football', 'volleyball', 'tennis', 'swimming'];
      if (!validSports.includes(sport)) {
        throw new Error(`Sport must be one of: ${validSports.join(', ')}`);
      }
    }
    
    // Validate age group if provided
    if (ageGroup !== undefined) {
      if (typeof ageGroup !== 'string') {
        throw new Error('Age group must be a string');
      }
      
      const validAgeGroups = ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18'];
      if (!validAgeGroups.includes(ageGroup)) {
        throw new Error(`Age group must be one of: ${validAgeGroups.join(', ')}`);
      }
    }
    
    // Validate date formats if provided
    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('startDate must be in YYYY-MM-DD format');
      }
    }
    
    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('endDate must be in YYYY-MM-DD format');
      }
    }
    
    // Validate date range if both dates provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }
    
    // Validate venue ID if provided
    if (venueId !== undefined) {
      if (typeof venueId !== 'string') {
        throw new Error('Venue ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(venueId)) {
        throw new Error('Invalid venue ID format');
      }
    }
    
    // Validate status if provided
    if (status !== undefined) {
      if (typeof status !== 'string') {
        throw new Error('Status must be a string');
      }
      
      const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    // Validate pagination parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add rate limiting for event requests
    // TODO: Add user permission filtering based on user role
    
    return {success: true, message: "Events retrieved", data: {}};
  } catch (err) {
    logger.error("Get events error", err);
    return {success: false, message: "Get events failed", error: err};
  }
});

export const getEvent = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { eventId, includeDetails, includeParticipants } = data as {
      eventId?: string;
      includeDetails?: boolean;
      includeParticipants?: boolean;
    };
    
    // Validate required fields
    if (!eventId || typeof eventId !== 'string') {
      throw new Error('Event ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      throw new Error('Invalid event ID format');
    }
    
    // Validate optional fields
    if (includeDetails !== undefined && typeof includeDetails !== 'boolean') {
      throw new Error('includeDetails must be a boolean');
    }
    
    if (includeParticipants !== undefined && typeof includeParticipants !== 'boolean') {
      throw new Error('includeParticipants must be a boolean');
    }
    
    // TODO: Add user permission check to ensure user can access this event
    // TODO: Add rate limiting for event requests
    
    return {success: true, message: "Event retrieved", data: {eventId}};
  } catch (err) {
    logger.error("Get event error", err);
    return {success: false, message: "Get event failed", error: err};
  }
});

export const getVenues = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      sport, 
      location, 
      radius, 
      amenities, 
      limit, 
      offset 
    } = data as {
      sport?: string;
      location?: { lat: number; lng: number };
      radius?: number;
      amenities?: string[];
      limit?: number;
      offset?: number;
    };
    
    // Validate sport if provided
    if (sport !== undefined) {
      if (typeof sport !== 'string') {
        throw new Error('Sport must be a string');
      }
      
      const validSports = ['soccer', 'basketball', 'baseball', 'football', 'volleyball', 'tennis', 'swimming'];
      if (!validSports.includes(sport)) {
        throw new Error(`Sport must be one of: ${validSports.join(', ')}`);
      }
    }
    
    // Validate location if provided
    if (location !== undefined) {
      if (typeof location !== 'object' || location === null) {
        throw new Error('Location must be an object');
      }
      
      if (typeof location.lat !== 'number' || location.lat < -90 || location.lat > 90) {
        throw new Error('Latitude must be a number between -90 and 90');
      }
      
      if (typeof location.lng !== 'number' || location.lng < -180 || location.lng > 180) {
        throw new Error('Longitude must be a number between -180 and 180');
      }
    }
    
    // Validate radius if provided
    if (radius !== undefined) {
      if (typeof radius !== 'number' || radius < 0 || radius > 100) {
        throw new Error('Radius must be a number between 0 and 100 kilometers');
      }
    }
    
    // Validate amenities if provided
    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        throw new Error('Amenities must be an array');
      }
      
      const validAmenities = ['parking', 'restrooms', 'lighting', 'water', 'shade', 'equipment'];
      for (const amenity of amenities) {
        if (typeof amenity !== 'string' || !validAmenities.includes(amenity)) {
          throw new Error(`Amenity must be one of: ${validAmenities.join(', ')}`);
        }
      }
    }
    
    // Validate pagination parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add rate limiting for venue requests
    // TODO: Add user permission filtering based on user role
    
    return {success: true, message: "Venues retrieved", data: {}};
  } catch (err) {
    logger.error("Get venues error", err);
    return {success: false, message: "Get venues failed", error: err};
  }
});

// ============================================================================
// CONTENT ROUTES
// ============================================================================

export const contentAnalyze = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      content, 
      contentType, 
      analysisType, 
      language, 
      includeSentiment, 
      includeKeywords 
    } = data as {
      content?: string;
      contentType?: string;
      analysisType?: string;
      language?: string;
      includeSentiment?: boolean;
      includeKeywords?: boolean;
    };
    
    // Validate required fields
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }
    
    if (content.length < 1 || content.length > 10000) {
      throw new Error('Content must be between 1 and 10,000 characters');
    }
    
    // Validate content type if provided
    if (contentType !== undefined) {
      if (typeof contentType !== 'string') {
        throw new Error('Content type must be a string');
      }
      
      const validContentTypes = ['text', 'comment', 'review', 'feedback', 'description'];
      if (!validContentTypes.includes(contentType)) {
        throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
      }
    }
    
    // Validate analysis type if provided
    if (analysisType !== undefined) {
      if (typeof analysisType !== 'string') {
        throw new Error('Analysis type must be a string');
      }
      
      const validAnalysisTypes = ['sentiment', 'keywords', 'topics', 'language', 'toxicity'];
      if (!validAnalysisTypes.includes(analysisType)) {
        throw new Error(`Analysis type must be one of: ${validAnalysisTypes.join(', ')}`);
      }
    }
    
    // Validate language if provided
    if (language !== undefined) {
      if (typeof language !== 'string') {
        throw new Error('Language must be a string');
      }
      
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'auto'];
      if (!validLanguages.includes(language)) {
        throw new Error(`Language must be one of: ${validLanguages.join(', ')}`);
      }
    }
    
    // Validate boolean flags
    if (includeSentiment !== undefined && typeof includeSentiment !== 'boolean') {
      throw new Error('includeSentiment must be a boolean');
    }
    
    if (includeKeywords !== undefined && typeof includeKeywords !== 'boolean') {
      throw new Error('includeKeywords must be a boolean');
    }
    
    // TODO: Add content filtering for inappropriate content
    // TODO: Add rate limiting for content analysis requests
    // TODO: Add user permission checks for content analysis
    
    return {success: true, message: "Content analyzed", data: {}};
  } catch (err) {
    logger.error("Content analysis error", err);
    return {success: false, message: "Content analysis failed", error: err};
  }
});

export const contentReport = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      contentId, 
      contentType, 
      reason, 
      description, 
      evidence 
    } = data as {
      contentId?: string;
      contentType?: string;
      reason?: string;
      description?: string;
      evidence?: string[];
    };
    
    // Validate required fields
    if (!contentId || typeof contentId !== 'string') {
      throw new Error('Content ID is required and must be a string');
    }
    
    // Validate UUID format for content ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId)) {
      throw new Error('Invalid content ID format');
    }
    
    if (!contentType || typeof contentType !== 'string') {
      throw new Error('Content type is required and must be a string');
    }
    
    const validContentTypes = ['comment', 'review', 'post', 'video', 'image', 'user'];
    if (!validContentTypes.includes(contentType)) {
      throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
    }
    
    if (!reason || typeof reason !== 'string') {
      throw new Error('Reason is required and must be a string');
    }
    
    const validReasons = ['inappropriate', 'spam', 'harassment', 'violence', 'copyright', 'other'];
    if (!validReasons.includes(reason)) {
      throw new Error(`Reason must be one of: ${validReasons.join(', ')}`);
    }
    
    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new Error('Description must be a string');
      }
      
      if (description.length < 1 || description.length > 1000) {
        throw new Error('Description must be between 1 and 1,000 characters');
      }
    }
    
    // Validate evidence if provided
    if (evidence !== undefined) {
      if (!Array.isArray(evidence)) {
        throw new Error('Evidence must be an array');
      }
      
      for (const item of evidence) {
        if (typeof item !== 'string' || item.length < 1 || item.length > 500) {
          throw new Error('Evidence items must be strings between 1 and 500 characters');
        }
      }
      
      if (evidence.length > 10) {
        throw new Error('Evidence cannot contain more than 10 items');
      }
    }
    
    // TODO: Add rate limiting for content reports
    // TODO: Add duplicate report detection
    // TODO: Add user permission checks for reporting
    
    return {success: true, message: "Content reported", data: {}};
  } catch (err) {
    logger.error("Content report error", err);
    return {success: false, message: "Content report failed", error: err};
  }
});

// ============================================================================
// ASSISTANT ROUTES
// ============================================================================

export const assistantTranscribe = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      audioUrl, 
      audioFormat, 
      language, 
      speakerCount, 
      includeTimestamps, 
      includeConfidence 
    } = data as {
      audioUrl?: string;
      audioFormat?: string;
      language?: string;
      speakerCount?: number;
      includeTimestamps?: boolean;
      includeConfidence?: boolean;
    };
    
    // Validate required fields
    if (!audioUrl || typeof audioUrl !== 'string') {
      throw new Error('Audio URL is required and must be a string');
    }
    
    // Validate URL format
    try {
      new URL(audioUrl);
    } catch {
      throw new Error('Audio URL must be a valid URL');
    }
    
    // Validate audio format if provided
    if (audioFormat !== undefined) {
      if (typeof audioFormat !== 'string') {
        throw new Error('Audio format must be a string');
      }
      
      const validFormats = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
      if (!validFormats.includes(audioFormat.toLowerCase())) {
        throw new Error(`Audio format must be one of: ${validFormats.join(', ')}`);
      }
    }
    
    // Validate language if provided
    if (language !== undefined) {
      if (typeof language !== 'string') {
        throw new Error('Language must be a string');
      }
      
      const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'auto'];
      if (!validLanguages.includes(language)) {
        throw new Error(`Language must be one of: ${validLanguages.join(', ')}`);
      }
    }
    
    // Validate speaker count if provided
    if (speakerCount !== undefined) {
      if (typeof speakerCount !== 'number' || speakerCount < 1 || speakerCount > 10) {
        throw new Error('Speaker count must be a number between 1 and 10');
      }
    }
    
    // Validate boolean flags
    if (includeTimestamps !== undefined && typeof includeTimestamps !== 'boolean') {
      throw new Error('includeTimestamps must be a boolean');
    }
    
    if (includeConfidence !== undefined && typeof includeConfidence !== 'boolean') {
      throw new Error('includeConfidence must be a boolean');
    }
    
    // TODO: Add file size validation (max 100MB)
    // TODO: Add rate limiting for transcription requests
    // TODO: Add user permission checks for audio processing
    
    return {success: true, message: "Audio transcribed", data: {}};
  } catch (err) {
    logger.error("Transcription error", err);
    return {success: false, message: "Transcription failed", error: err};
  }
});

export const assistantAnalyzePerformance = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      playerId, 
      performanceData, 
      analysisType, 
      timeRange, 
      includeMetrics, 
      includeRecommendations 
    } = data as {
      playerId?: string;
      performanceData?: Record<string, any>;
      analysisType?: string;
      timeRange?: { start: string; end: string };
      includeMetrics?: boolean;
      includeRecommendations?: boolean;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate performance data if provided
    if (performanceData !== undefined) {
      if (typeof performanceData !== 'object' || performanceData === null) {
        throw new Error('Performance data must be an object');
      }
      
      // Validate specific performance metrics
      for (const [key, value] of Object.entries(performanceData)) {
        if (typeof key !== 'string' || key.length > 50) {
          throw new Error('Performance data keys must be strings no longer than 50 characters');
        }
        
        if (typeof value !== 'number' && typeof value !== 'string' && typeof value !== 'boolean') {
          throw new Error('Performance data values must be numbers, strings, or booleans');
        }
      }
    }
    
    // Validate analysis type if provided
    if (analysisType !== undefined) {
      if (typeof analysisType !== 'string') {
        throw new Error('Analysis type must be a string');
      }
      
      const validAnalysisTypes = ['overall', 'technical', 'physical', 'tactical', 'mental'];
      if (!validAnalysisTypes.includes(analysisType)) {
        throw new Error(`Analysis type must be one of: ${validAnalysisTypes.join(', ')}`);
      }
    }
    
    // Validate time range if provided
    if (timeRange !== undefined) {
      if (typeof timeRange !== 'object' || timeRange === null) {
        throw new Error('Time range must be an object');
      }
      
      if (typeof timeRange.start !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(timeRange.start)) {
        throw new Error('Time range start must be in YYYY-MM-DD format');
      }
      
      if (typeof timeRange.end !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(timeRange.end)) {
        throw new Error('Time range end must be in YYYY-MM-DD format');
      }
      
      if (new Date(timeRange.start) > new Date(timeRange.end)) {
        throw new Error('Time range start must be before or equal to end');
      }
    }
    
    // Validate boolean flags
    if (includeMetrics !== undefined && typeof includeMetrics !== 'boolean') {
      throw new Error('includeMetrics must be a boolean');
    }
    
    if (includeRecommendations !== undefined && typeof includeRecommendations !== 'boolean') {
      throw new Error('includeRecommendations must be a boolean');
    }
    
    // TODO: Add user permission check to ensure user can access this player's data
    // TODO: Add rate limiting for performance analysis requests
    // TODO: Add data validation for performance metrics
    
    return {success: true, message: "Performance analyzed", data: {}};
  } catch (err) {
    logger.error("Performance analysis error", err);
    return {success: false, message: "Performance analysis failed", error: err};
  }
});

export const assistantSuggestDrills = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      playerId, 
      skillLevel, 
      focusAreas, 
      duration, 
      equipment, 
      maxDrills, 
      includeVideo 
    } = data as {
      playerId?: string;
      skillLevel?: string;
      focusAreas?: string[];
      duration?: number;
      equipment?: string[];
      maxDrills?: number;
      includeVideo?: boolean;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    // Validate skill level if provided
    if (skillLevel !== undefined) {
      if (typeof skillLevel !== 'string') {
        throw new Error('Skill level must be a string');
      }
      
      const validSkillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validSkillLevels.includes(skillLevel)) {
        throw new Error(`Skill level must be one of: ${validSkillLevels.join(', ')}`);
      }
    }
    
    // Validate focus areas if provided
    if (focusAreas !== undefined) {
      if (!Array.isArray(focusAreas)) {
        throw new Error('Focus areas must be an array');
      }
      
      const validFocusAreas = ['passing', 'shooting', 'dribbling', 'defense', 'fitness', 'tactics'];
      for (const area of focusAreas) {
        if (typeof area !== 'string' || !validFocusAreas.includes(area)) {
          throw new Error(`Focus area must be one of: ${validFocusAreas.join(', ')}`);
        }
      }
      
      if (focusAreas.length > 5) {
        throw new Error('Focus areas cannot contain more than 5 items');
      }
    }
    
    // Validate duration if provided
    if (duration !== undefined) {
      if (typeof duration !== 'number' || duration < 5 || duration > 120) {
        throw new Error('Duration must be a number between 5 and 120 minutes');
      }
    }
    
    // Validate equipment if provided
    if (equipment !== undefined) {
      if (!Array.isArray(equipment)) {
        throw new Error('Equipment must be an array');
      }
      
      const validEquipment = ['ball', 'cones', 'goals', 'resistance-bands', 'ladder', 'none'];
      for (const item of equipment) {
        if (typeof item !== 'string' || !validEquipment.includes(item)) {
          throw new Error(`Equipment must be one of: ${validEquipment.join(', ')}`);
        }
      }
    }
    
    // Validate max drills if provided
    if (maxDrills !== undefined) {
      if (typeof maxDrills !== 'number' || maxDrills < 1 || maxDrills > 20) {
        throw new Error('Max drills must be a number between 1 and 20');
      }
    }
    
    // Validate boolean flags
    if (includeVideo !== undefined && typeof includeVideo !== 'boolean') {
      throw new Error('includeVideo must be a boolean');
    }
    
    // TODO: Add user permission check to ensure user can access this player's data
    // TODO: Add rate limiting for drill suggestion requests
    // TODO: Add validation that player exists and has performance data
    
    return {success: true, message: "Drills suggested", data: {}};
  } catch (err) {
    logger.error("Drill suggestions error", err);
    return {success: false, message: "Drill suggestions failed", error: err};
  }
});

// ============================================================================
// TOWN REC SPECIFIC ROUTES
// ============================================================================

export const submitLeague = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      name, 
      sport, 
      ageGroup, 
      maxTeams, 
      maxPlayersPerTeam, 
      startDate, 
      endDate,
      venueId,
      description 
    } = data as {
      name?: string;
      sport?: string;
      ageGroup?: string;
      maxTeams?: number;
      maxPlayersPerTeam?: number;
      startDate?: string;
      endDate?: string;
      venueId?: string;
      description?: string;
    };
    
    // Validate required fields
    if (!name || typeof name !== 'string') {
      throw new Error('League name is required and must be a string');
    }
    
    if (name.length < 1 || name.length > 100) {
      throw new Error('League name must be between 1 and 100 characters');
    }
    
    if (!sport || typeof sport !== 'string') {
      throw new Error('Sport is required and must be a string');
    }
    
    const validSports = ['soccer', 'basketball', 'baseball', 'football', 'volleyball', 'tennis', 'swimming'];
    if (!validSports.includes(sport)) {
      throw new Error(`Sport must be one of: ${validSports.join(', ')}`);
    }
    
    if (!ageGroup || typeof ageGroup !== 'string') {
      throw new Error('Age group is required and must be a string');
    }
    
    const validAgeGroups = ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18'];
    if (!validAgeGroups.includes(ageGroup)) {
      throw new Error(`Age group must be one of: ${validAgeGroups.join(', ')}`);
    }
    
    if (!maxTeams || typeof maxTeams !== 'number') {
      throw new Error('Maximum teams is required and must be a number');
    }
    
    if (maxTeams < 1 || maxTeams > 1000) {
      throw new Error('Maximum teams must be between 1 and 1000');
    }
    
    if (!maxPlayersPerTeam || typeof maxPlayersPerTeam !== 'number') {
      throw new Error('Maximum players per team is required and must be a number');
    }
    
    if (maxPlayersPerTeam < 1 || maxPlayersPerTeam > 100) {
      throw new Error('Maximum players per team must be between 1 and 100');
    }
    
    // Validate dates if provided
    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('Start date must be in YYYY-MM-DD format');
      }
    }
    
    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('End date must be in YYYY-MM-DD format');
      }
    }
    
    // Validate date range if both dates provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('Start date must be before or equal to end date');
    }
    
    // Validate venue ID if provided
    if (venueId !== undefined) {
      if (typeof venueId !== 'string') {
        throw new Error('Venue ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(venueId)) {
        throw new Error('Invalid venue ID format');
      }
    }
    
    // Validate description if provided
    if (description !== undefined) {
      if (typeof description !== 'string') {
        throw new Error('Description must be a string');
      }
      
      if (description.length > 1000) {
        throw new Error('Description must be no more than 1000 characters');
      }
    }
    
    // TODO: Add rate limiting for league submissions
    // TODO: Add validation that venue exists and is available
    // TODO: Add validation that user has permission to create leagues in this venue
    
    return {success: true, message: "League submitted successfully", data: {}};
  } catch (err) {
    logger.error("League submission error", err);
    return {success: false, message: "League submission failed", error: err};
  }
});

export const getWaitlist = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      leagueId, 
      status, 
      ageGroup, 
      startDate, 
      endDate, 
      limit, 
      offset 
    } = data as {
      leagueId?: string;
      status?: string;
      ageGroup?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    };
    
    // Validate league ID if provided
    if (leagueId !== undefined) {
      if (typeof leagueId !== 'string') {
        throw new Error('League ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(leagueId)) {
        throw new Error('Invalid league ID format');
      }
    }
    
    // Validate status if provided
    if (status !== undefined) {
      if (typeof status !== 'string') {
        throw new Error('Status must be a string');
      }
      
      const validStatuses = ['pending', 'approved', 'denied', 'promoted', 'withdrawn'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    // Validate age group if provided
    if (ageGroup !== undefined) {
      if (typeof ageGroup !== 'string') {
        throw new Error('Age group must be a string');
      }
      
      const validAgeGroups = ['u6', 'u8', 'u10', 'u12', 'u14', 'u16', 'u18'];
      if (!validAgeGroups.includes(ageGroup)) {
        throw new Error(`Age group must be one of: ${validAgeGroups.join(', ')}`);
      }
    }
    
    // Validate date formats if provided
    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('startDate must be in YYYY-MM-DD format');
      }
    }
    
    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('endDate must be in YYYY-MM-DD format');
      }
    }
    
    // Validate date range if both dates provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }
    
    // Validate pagination parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add rate limiting for waitlist requests
    // TODO: Add user permission filtering based on staff role
    // TODO: Add validation that league exists if leagueId provided
    
    return {success: true, message: "Waitlist retrieved", data: {}};
  } catch (err) {
    logger.error("Waitlist retrieval error", err);
    return {success: false, message: "Waitlist retrieval failed", error: err};
  }
});

export const processAgeOverride = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      requestId, 
      action, 
      reason, 
      notes, 
      effectiveDate 
    } = data as {
      requestId?: string;
      action?: string;
      reason?: string;
      notes?: string;
      effectiveDate?: string;
    };
    
    // Validate required fields
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Request ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      throw new Error('Invalid request ID format');
    }
    
    if (!action || typeof action !== 'string') {
      throw new Error('Action is required and must be a string');
    }
    
    const validActions = ['approve', 'deny', 'pending', 'withdraw'];
    if (!validActions.includes(action)) {
      throw new Error(`Action must be one of: ${validActions.join(', ')}`);
    }
    
    // Validate reason if provided
    if (reason !== undefined) {
      if (typeof reason !== 'string') {
        throw new Error('Reason must be a string');
      }
      
      if (reason.length < 1 || reason.length > 500) {
        throw new Error('Reason must be between 1 and 500 characters');
      }
    }
    
    // Validate notes if provided
    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        throw new Error('Notes must be a string');
      }
      
      if (notes.length > 1000) {
        throw new Error('Notes must be no more than 1,000 characters');
      }
    }
    
    // Validate effective date if provided
    if (effectiveDate !== undefined) {
      if (typeof effectiveDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
        throw new Error('Effective date must be in YYYY-MM-DD format');
      }
      
      // Ensure effective date is not in the past
      if (new Date(effectiveDate) < new Date()) {
        throw new Error('Effective date cannot be in the past');
      }
    }
    
    // TODO: Add rate limiting for age override processing
    // TODO: Add validation that request exists and is in pending status
    // TODO: Add audit logging for all override actions
    
    return {success: true, message: "Age override processed", data: {}};
  } catch (err) {
    logger.error("Age override error", err);
    return {success: false, message: "Age override failed", error: err};
  }
});

export const processSiblingPairing = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      pairingId, 
      action, 
      reason, 
      notes, 
      priority 
    } = data as {
      pairingId?: string;
      action?: string;
      reason?: string;
      notes?: string;
      priority?: string;
    };
    
    // Validate required fields
    if (!pairingId || typeof pairingId !== 'string') {
      throw new Error('Pairing ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pairingId)) {
      throw new Error('Invalid pairing ID format');
    }
    
    if (!action || typeof action !== 'string') {
      throw new Error('Action is required and must be a string');
    }
    
    const validActions = ['approve', 'deny', 'pending', 'modify', 'withdraw'];
    if (!validActions.includes(action)) {
      throw new Error(`Action must be one of: ${validActions.join(', ')}`);
    }
    
    // Validate reason if provided
    if (reason !== undefined) {
      if (typeof reason !== 'string') {
        throw new Error('Reason must be a string');
      }
      
      if (reason.length < 1 || reason.length > 500) {
        throw new Error('Reason must be between 1 and 500 characters');
      }
    }
    
    // Validate notes if provided
    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        throw new Error('Notes must be a string');
      }
      
      if (notes.length > 1000) {
        throw new Error('Notes must be no more than 1,000 characters');
      }
    }
    
    // Validate priority if provided
    if (priority !== undefined) {
      if (typeof priority !== 'string') {
        throw new Error('Priority must be a string');
      }
      
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
      }
    }
    
    // TODO: Add rate limiting for sibling pairing processing
    // TODO: Add validation that pairing exists and is in pending status
    // TODO: Add audit logging for all pairing actions
    // TODO: Add validation that siblings are actually related
    
    return {success: true, message: "Sibling pairing processed", data: {}};
  } catch (err) {
    logger.error("Sibling pairing error", err);
    return {success: false, message: "Sibling pairing failed", error: err};
  }
});

export const getAuditLogs = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      actionType, 
      userId, 
      resourceType, 
      resourceId, 
      startDate, 
      endDate, 
      limit, 
      offset 
    } = data as {
      actionType?: string;
      userId?: string;
      resourceType?: string;
      resourceId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    };
    
    // Validate action type if provided
    if (actionType !== undefined) {
      if (typeof actionType !== 'string') {
        throw new Error('Action type must be a string');
      }
      
      const validActionTypes = ['create', 'update', 'delete', 'approve', 'deny', 'login', 'logout'];
      if (!validActionTypes.includes(actionType)) {
        throw new Error(`Action type must be one of: ${validActionTypes.join(', ')}`);
      }
    }
    
    // Validate user ID if provided
    if (userId !== undefined) {
      if (typeof userId !== 'string') {
        throw new Error('User ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error('Invalid user ID format');
      }
    }
    
    // Validate resource type if provided
    if (resourceType !== undefined) {
      if (typeof resourceType !== 'string') {
        throw new Error('Resource type must be a string');
      }
      
      const validResourceTypes = ['player', 'league', 'event', 'venue', 'waitlist', 'override'];
      if (!validResourceTypes.includes(resourceType)) {
        throw new Error(`Resource type must be one of: ${validResourceTypes.join(', ')}`);
      }
    }
    
    // Validate resource ID if provided
    if (resourceId !== undefined) {
      if (typeof resourceId !== 'string') {
        throw new Error('Resource ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resourceId)) {
        throw new Error('Invalid resource ID format');
      }
    }
    
    // Validate date formats if provided
    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error('startDate must be in YYYY-MM-DD format');
      }
    }
    
    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('endDate must be in YYYY-MM-DD format');
      }
    }
    
    // Validate date range if both dates provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('startDate must be before or equal to endDate');
    }
    
    // Validate pagination parameters
    if (limit !== undefined) {
      if (typeof limit !== 'number' || limit < 1 || limit > 100) {
        throw new Error('Limit must be a number between 1 and 100');
      }
    }
    
    if (offset !== undefined) {
      if (typeof offset !== 'number' || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
    
    // TODO: Add rate limiting for audit log requests
    // TODO: Add user permission filtering based on staff role
    // TODO: Add data retention policy enforcement
    
    return {success: true, message: "Audit logs retrieved", data: {}};
  } catch (err) {
    logger.error("Audit logs error", err);
    return {success: false, message: "Audit logs failed", error: err};
  }
});

// ============================================================================
// SHARING ROUTES
// ============================================================================

export const shareEmail = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      recipientEmail, 
      subject, 
      content, 
      contentType, 
      attachments 
    } = data as {
      recipientEmail?: string;
      subject?: string;
      content?: string;
      contentType?: string;
      attachments?: string[];
    };
    
    // Validate required fields
    if (!recipientEmail || typeof recipientEmail !== 'string') {
      throw new Error('Recipient email is required and must be a string');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error('Invalid recipient email format');
    }
    
    if (recipientEmail.length > 254) {
      throw new Error('Recipient email is too long');
    }
    
    if (!subject || typeof subject !== 'string') {
      throw new Error('Subject is required and must be a string');
    }
    
    if (subject.length < 1 || subject.length > 200) {
      throw new Error('Subject must be between 1 and 200 characters');
    }
    
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }
    
    if (content.length < 1 || content.length > 10000) {
      throw new Error('Content must be between 1 and 10,000 characters');
    }
    
    // Validate content type if provided
    if (contentType !== undefined) {
      if (typeof contentType !== 'string') {
        throw new Error('Content type must be a string');
      }
      
      const validContentTypes = ['text', 'html', 'markdown'];
      if (!validContentTypes.includes(contentType)) {
        throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
      }
    }
    
    // Validate attachments if provided
    if (attachments !== undefined) {
      if (!Array.isArray(attachments)) {
        throw new Error('Attachments must be an array');
      }
      
      if (attachments.length > 10) {
        throw new Error('Maximum 10 attachments allowed');
      }
      
      for (const attachment of attachments) {
        if (typeof attachment !== 'string') {
          throw new Error('Each attachment must be a string');
        }
        
        // Validate attachment URL format
        try {
          new URL(attachment);
        } catch {
          throw new Error('Invalid attachment URL format');
        }
      }
    }
    
    // TODO: Add rate limiting for email sharing
    // TODO: Add spam protection
    // TODO: Add user permission check for sharing content
    
    return {success: true, message: "Email shared", data: {recipientEmail}};
  } catch (err) {
    logger.error("Email sharing error", err);
    return {success: false, message: "Email sharing failed", error: err};
  }
});

export const reportsShare = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      reportId, 
      shareType, 
      recipientEmail, 
      recipientUserId, 
      permissions, 
      expirationDate 
    } = data as {
      reportId?: string;
      shareType?: string;
      recipientEmail?: string;
      recipientUserId?: string;
      permissions?: string[];
      expirationDate?: string;
    };
    
    // Validate required fields
    if (!reportId || typeof reportId !== 'string') {
      throw new Error('Report ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      throw new Error('Invalid report ID format');
    }
    
    if (!shareType || typeof shareType !== 'string') {
      throw new Error('Share type is required and must be a string');
    }
    
    const validShareTypes = ['email', 'user', 'public', 'team'];
    if (!validShareTypes.includes(shareType)) {
      throw new Error(`Share type must be one of: ${validShareTypes.join(', ')}`);
    }
    
    // Validate recipient email if share type is email
    if (shareType === 'email') {
      if (!recipientEmail || typeof recipientEmail !== 'string') {
        throw new Error('Recipient email is required for email sharing');
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error('Invalid recipient email format');
      }
    }
    
    // Validate recipient user ID if share type is user
    if (shareType === 'user') {
      if (!recipientUserId || typeof recipientUserId !== 'string') {
        throw new Error('Recipient user ID is required for user sharing');
      }
      
      if (!uuidRegex.test(recipientUserId)) {
        throw new Error('Invalid recipient user ID format');
      }
    }
    
    // Validate permissions if provided
    if (permissions !== undefined) {
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }
      
      const validPermissions = ['view', 'download', 'print', 'comment', 'edit'];
      for (const permission of permissions) {
        if (typeof permission !== 'string' || !validPermissions.includes(permission)) {
          throw new Error(`Invalid permission: ${permission}. Must be one of: ${validPermissions.join(', ')}`);
        }
      }
    }
    
    // Validate expiration date if provided
    if (expirationDate !== undefined) {
      if (typeof expirationDate !== 'string') {
        throw new Error('Expiration date must be a string');
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) {
        throw new Error('Expiration date must be in YYYY-MM-DD format');
      }
      
      const expiration = new Date(expirationDate);
      if (isNaN(expiration.getTime())) {
        throw new Error('Invalid expiration date');
      }
      
      if (expiration <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
    }
    
    // TODO: Add user permission check to ensure user can share this report
    // TODO: Add rate limiting for report sharing
    // TODO: Add audit logging for report sharing
    
    return {success: true, message: "Report shared", data: {reportId}};
  } catch (err) {
    logger.error("Report sharing error", err);
    return {success: false, message: "Report sharing failed", error: err};
  }
});

// ============================================================================
// VIDEO ROUTES
// ============================================================================

export const videoInit = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      fileName, 
      fileSize, 
      fileType, 
      playerId, 
      sessionId, 
      metadata 
    } = data as {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      playerId?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    };
    
    // Validate required fields
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('File name is required and must be a string');
    }
    
    if (fileName.length < 1 || fileName.length > 255) {
      throw new Error('File name must be between 1 and 255 characters');
    }
    
    // Validate file name format (no path traversal)
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('Invalid file name format');
    }
    
    if (!fileSize || typeof fileSize !== 'number') {
      throw new Error('File size is required and must be a number');
    }
    
    // Validate file size (max 500MB for video)
    if (fileSize <= 0 || fileSize > 500 * 1024 * 1024) {
      throw new Error('File size must be between 1 byte and 500MB');
    }
    
    if (!fileType || typeof fileType !== 'string') {
      throw new Error('File type is required and must be a string');
    }
    
    // Validate video file types
    const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
    if (!validVideoTypes.includes(fileType)) {
      throw new Error(`File type must be one of: ${validVideoTypes.join(', ')}`);
    }
    
    // Validate player ID if provided
    if (playerId !== undefined) {
      if (typeof playerId !== 'string') {
        throw new Error('Player ID must be a string');
      }
      
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        throw new Error('Invalid player ID format');
      }
    }
    
    // Validate session ID if provided
    if (sessionId !== undefined) {
      if (typeof sessionId !== 'string') {
        throw new Error('Session ID must be a string');
      }
      
      if (sessionId.length < 1 || sessionId.length > 100) {
        throw new Error('Session ID must be between 1 and 100 characters');
      }
    }
    
    // Validate metadata if provided
    if (metadata !== undefined) {
      if (typeof metadata !== 'object' || metadata === null) {
        throw new Error('Metadata must be an object');
      }
      
      // Validate metadata keys and values
      for (const [key, value] of Object.entries(metadata)) {
        if (typeof key !== 'string' || key.length > 50) {
          throw new Error('Metadata keys must be strings no longer than 50 characters');
        }
        
        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
          throw new Error('Metadata values must be strings, numbers, or booleans');
        }
      }
    }
    
    // TODO: Add user permission check to ensure user can upload for this player
    // TODO: Add rate limiting for video initialization
    // TODO: Add storage quota checking
    
    return {success: true, message: "Video initialized", data: {fileName}};
  } catch (err) {
    logger.error("Video init error", err);
    return {success: false, message: "Video init failed", error: err};
  }
});

export const videoComplete = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { videoId, status, results, error } = data as {
      videoId?: string;
      status?: string;
      results?: Record<string, any>;
      error?: string;
    };
    
    // Validate required fields
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      throw new Error('Invalid video ID format');
    }
    
    // Validate status if provided
    if (status !== undefined) {
      if (typeof status !== 'string') {
        throw new Error('Status must be a string');
      }
      
      const validStatuses = ['processing', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
    }
    
    // Validate results if provided
    if (results !== undefined) {
      if (typeof results !== 'object' || results === null) {
        throw new Error('Results must be an object');
      }
      
      // Validate specific result fields
      if (results.analysisScore !== undefined) {
        if (typeof results.analysisScore !== 'number' || results.analysisScore < 0 || results.analysisScore > 100) {
          throw new Error('Analysis score must be a number between 0 and 100');
        }
      }
      
      if (results.keyPoints !== undefined) {
        if (!Array.isArray(results.keyPoints) || !results.keyPoints.every(point => typeof point === 'string')) {
          throw new Error('Key points must be an array of strings');
        }
      }
    }
    
    // Validate error if provided
    if (error !== undefined && typeof error !== 'string') {
      throw new Error('Error must be a string');
    }
    
    // TODO: Add user permission check to ensure user can update this video
    // TODO: Add rate limiting for video completion requests
    // TODO: Add validation that video exists and is in processing state
    
    return {success: true, message: "Video completed", data: {videoId}};
  } catch (err) {
    logger.error("Video completion error", err);
    return {success: false, message: "Video completion failed", error: err};
  }
});

export const videoAnalyze = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { videoId, analysisType, parameters, priority } = data as {
      videoId?: string;
      analysisType?: string;
      parameters?: Record<string, any>;
      priority?: string;
    };
    
    // Validate required fields
    if (!videoId || typeof videoId !== 'string') {
      throw new Error('Video ID is required and must be a string');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      throw new Error('Invalid video ID format');
    }
    
    // Validate analysis type
    if (!analysisType || typeof analysisType !== 'string') {
      throw new Error('Analysis type is required and must be a string');
    }
    
    const validAnalysisTypes = ['pose', 'performance', 'technique', 'movement', 'skill'];
    if (!validAnalysisTypes.includes(analysisType)) {
      throw new Error(`Analysis type must be one of: ${validAnalysisTypes.join(', ')}`);
    }
    
    // Validate parameters if provided
    if (parameters !== undefined) {
      if (typeof parameters !== 'object' || parameters === null) {
        throw new Error('Parameters must be an object');
      }
      
      // Validate specific parameters based on analysis type
      if (analysisType === 'pose') {
        if (parameters.confidence !== undefined) {
          if (typeof parameters.confidence !== 'number' || parameters.confidence < 0 || parameters.confidence > 1) {
            throw new Error('Confidence must be a number between 0 and 1');
          }
        }
      }
      
      if (parameters.includeHeatmap !== undefined && typeof parameters.includeHeatmap !== 'boolean') {
        throw new Error('includeHeatmap must be a boolean');
      }
    }
    
    // Validate priority if provided
    if (priority !== undefined) {
      if (typeof priority !== 'string') {
        throw new Error('Priority must be a string');
      }
      
      const validPriorities = ['low', 'medium', 'high'];
      if (!validPriorities.includes(priority)) {
        throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
      }
    }
    
    // TODO: Add user permission check to ensure user can access this video
    // TODO: Add rate limiting for video analysis requests
    // TODO: Add video file validation (size, format, etc.)
    
    return {success: true, message: "Video analyzed", data: {videoId}};
  } catch (err) {
    logger.error("Video analysis error", err);
    return {success: false, message: "Video analysis failed", error: err};
  }
});

// ============================================================================
// TIPS ROUTES
// ============================================================================

export const tipsCreate = onCall(async (data, context) => {
  try {
    await validateAuth(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      title, 
      content, 
      category, 
      difficulty, 
      targetAudience, 
      tags, 
      mediaUrls 
    } = data as {
      title?: string;
      content?: string;
      category?: string;
      difficulty?: string;
      targetAudience?: string[];
      tags?: string[];
      mediaUrls?: string[];
    };
    
    // Validate required fields
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    if (title.length < 1 || title.length > 200) {
      throw new Error('Title must be between 1 and 200 characters');
    }
    
    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }
    
    if (content.length < 10 || content.length > 10000) {
      throw new Error('Content must be between 10 and 10,000 characters');
    }
    
    // Validate category if provided
    if (category !== undefined) {
      if (typeof category !== 'string') {
        throw new Error('Category must be a string');
      }
      
      const validCategories = ['technique', 'strategy', 'fitness', 'mental', 'nutrition', 'recovery', 'equipment'];
      if (!validCategories.includes(category)) {
        throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
      }
    }
    
    // Validate difficulty if provided
    if (difficulty !== undefined) {
      if (typeof difficulty !== 'string') {
        throw new Error('Difficulty must be a string');
      }
      
      const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validDifficulties.includes(difficulty)) {
        throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
      }
    }
    
    // Validate target audience if provided
    if (targetAudience !== undefined) {
      if (!Array.isArray(targetAudience)) {
        throw new Error('Target audience must be an array');
      }
      
      const validAudiences = ['players', 'coaches', 'parents', 'administrators'];
      for (const audience of targetAudience) {
        if (typeof audience !== 'string' || !validAudiences.includes(audience)) {
          throw new Error(`Invalid target audience: ${audience}. Must be one of: ${validAudiences.join(', ')}`);
        }
      }
    }
    
    // Validate tags if provided
    if (tags !== undefined) {
      if (!Array.isArray(tags)) {
        throw new Error('Tags must be an array');
      }
      
      if (tags.length > 20) {
        throw new Error('Maximum 20 tags allowed');
      }
      
      for (const tag of tags) {
        if (typeof tag !== 'string') {
          throw new Error('Each tag must be a string');
        }
        
        if (tag.length < 1 || tag.length > 50) {
          throw new Error('Each tag must be between 1 and 50 characters');
        }
      }
    }
    
    // Validate media URLs if provided
    if (mediaUrls !== undefined) {
      if (!Array.isArray(mediaUrls)) {
        throw new Error('Media URLs must be an array');
      }
      
      if (mediaUrls.length > 10) {
        throw new Error('Maximum 10 media URLs allowed');
      }
      
      for (const url of mediaUrls) {
        if (typeof url !== 'string') {
          throw new Error('Each media URL must be a string');
        }
        
        // Validate URL format
        try {
          new URL(url);
        } catch {
          throw new Error('Invalid media URL format');
        }
      }
    }
    
    // TODO: Add content moderation for inappropriate content
    // TODO: Add rate limiting for tip creation
    // TODO: Add user permission check for tip creation
    
    return {success: true, message: "Tip created", data: {title}};
  } catch (err) {
    logger.error("Tip creation error", err);
    return {success: false, message: "Tip creation failed", error: err};
  }
});

// ============================================================================
// PLAYER ASSESSMENT ROUTES
// ============================================================================

export const playerAssessment = onCall(async (data, context) => {
  try {
    await validateTownStaff(context);
    
    // SECURITY FIX: Add comprehensive input validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request data');
    }
    
    const { 
      playerId, 
      assessmentType, 
      assessmentData, 
      evaluatorId, 
      date, 
      notes 
    } = data as {
      playerId?: string;
      assessmentType?: string;
      assessmentData?: Record<string, any>;
      evaluatorId?: string;
      date?: string;
      notes?: string;
    };
    
    // Validate required fields
    if (!playerId || typeof playerId !== 'string') {
      throw new Error('Player ID is required and must be a string');
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(playerId)) {
      throw new Error('Invalid player ID format');
    }
    
    if (!assessmentType || typeof assessmentType !== 'string') {
      throw new Error('Assessment type is required and must be a string');
    }
    
    const validAssessmentTypes = ['skills', 'fitness', 'performance'];
    if (!validAssessmentTypes.includes(assessmentType)) {
      throw new Error('Invalid assessment type');
    }
    
    if (!assessmentData || typeof assessmentData !== 'object') {
      throw new Error('Assessment data is required and must be an object');
    }
    
    // Validate assessment data based on type
    if (assessmentType === 'skills') {
      for (const [skill, score] of Object.entries(assessmentData)) {
        if (typeof skill !== 'string' || skill.length > 50) {
          throw new Error('Skill names must be strings no longer than 50 characters');
        }
        
        if (typeof score !== 'number' || score < 1 || score > 10) {
          throw new Error('Skill scores must be numbers between 1 and 10');
        }
      }
    }
    
    if (assessmentType === 'fitness') {
      const requiredFitnessFields = ['endurance', 'strength', 'speed', 'agility'];
      for (const field of requiredFitnessFields) {
        if (assessmentData[field] !== undefined) {
          if (typeof assessmentData[field] !== 'number' || assessmentData[field] < 0) {
            throw new Error(`${field} must be a non-negative number`);
          }
        }
      }
    }
    
    // Validate evaluator ID if provided
    if (evaluatorId !== undefined) {
      if (typeof evaluatorId !== 'string') {
        throw new Error('Evaluator ID must be a string');
      }
      
      if (!uuidRegex.test(evaluatorId)) {
        throw new Error('Invalid evaluator ID format');
      }
    }
    
    // Validate date if provided
    if (date !== undefined) {
      if (typeof date !== 'string') {
        throw new Error('Date must be a string');
      }
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Date must be in YYYY-MM-DD format');
      }
      
      const assessmentDate = new Date(date);
      if (isNaN(assessmentDate.getTime())) {
        throw new Error('Invalid date');
      }
    }
    
    // Validate notes if provided
    if (notes !== undefined) {
      if (typeof notes !== 'string') {
        throw new Error('Notes must be a string');
      }
      
      if (notes.length > 2000) {
        throw new Error('Notes must be no longer than 2,000 characters');
      }
    }
    
    // TODO: Add user permission check to ensure user can assess this player
    // TODO: Add rate limiting for assessment creation
    // TODO: Add validation that evaluator has proper credentials
    
    return {success: true, message: "Player assessment completed", data: {playerId}};
  } catch (err) {
    logger.error("Player assessment error", err);
    return {success: false, message: "Player assessment failed", error: err};
  }
});

// ============================================================================
// EMAIL ROUTES
// ============================================================================

export const emailsSendParentUpdate = onCall(async (_data, context) => {
  try {
    await validateTownStaff(context);
    return {success: true, message: "Parent update email sent", data: {}};
  } catch (err) {
    logger.error("Parent update email error", err);
    return {success: false, message: "Parent update email failed", error: err};
  }
});

// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================

export const onWaitlistCreated = onDocumentCreated("waitlists/{entryId}", (event) => {
  try {
    const data = event.data?.data();
    logger.info("Waitlist entry created", {entryId: event.params.entryId, data});
    // TODO: Implement waitlist creation logic
  } catch (err) {
    logger.error("Waitlist creation trigger error", err);
  }
});

// ============================================================================
// EXPRESS ROUTES (for REST API compatibility)
// ============================================================================

// Health check endpoint
app.get("/api/ping", (req: express.Request, res: express.Response) => {
  res.json({success: true, message: "Pong", timestamp: new Date().toISOString()});
});

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

// Export scheduled functions
export {
  waitlistDailyScan,
  weeklyDirectorDigest,
  parentFollowUpEmails,
  monthlyAnalyticsReport,
} from "./scheduled";

// Export trigger functions
export {
  onWaitlistEntryCreated,
  onAgeOverrideCreated,
  onSiblingPairingCreated,
  onRegistrationUpdated,
  onTownStaffSessionCreated,
  onNotificationCreated,
  onAuditLogCreated,
  onSiblingRequestCreated,
} from "./triggers";

// Export admin functions
export {
  adminGetLeagueStats,
  adminUpdateStaffRole,
  adminGenerateReport,
  adminUpdateConfig,
  adminBulkOperation,
  adminGetSystemHealth,
} from "./admin";

// Export voice functions
export {
  generateVoiceToken,
  revokeVoiceToken,
  handleVoiceCall,
  callStatusWebhook,
  getCallHistory,
  generateAudio,
} from "./voice";

// Export notification functions
export {
  triggerCoachNotifications,
  updateUserActivity,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  sendBulkNotifications,
  getNotificationHistory,
} from "./notifications";

// Export player functions
export {
  createPlayerProfile,
  updatePlayerProfile,
  getPlayerStatistics,
  getPlayerAchievements,
  awardAchievement,
  getPlayerSchedule,
  updatePlayerPerformance,
} from "./player";

// Export team functions
export {
  createTeam,
  updateTeam,
  getTeamRoster,
  addPlayerToTeam,
  removePlayerFromTeam,
  getTeamStatistics,
  getTeamSchedule,
  updateTeamPerformance,
} from "./team";

// Export league functions
export {
  createLeague,
  updateLeague,
  getLeagueOverview,
  getLeagueStandings,
  getLeagueSchedule,
  generateLeagueSchedule,
  getLeagueStatistics,
} from "./league";

// Export Express app for REST endpoints
export const api = onRequest(app);
