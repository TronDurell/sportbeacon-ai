/**
 * Production-Ready Logging Utility
 *
 * This module provides environment-aware logging that:
 * - Allows console.log in development
 * - Removes console.log in production
 * - Provides proper error logging for production
 * - Integrates with error monitoring services
 */
// ============================================================================
// LOG LEVELS
// ============================================================================
export const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4,
};
// ============================================================================
// LOGGER CLASS
// ============================================================================
class Logger {
    config;
    logBuffer = [];
    isProduction;
    constructor(config = {}) {
        this.isProduction = process.env.NODE_ENV === "production";
        this.config = {
            level: this.isProduction ? "WARN" : "DEBUG",
            enableConsole: !this.isProduction,
            enableRemote: this.isProduction,
            enableLocalStorage: !this.isProduction,
            maxLocalStorageEntries: 100,
            appName: "SportBeaconAI",
            version: "1.0.0",
            ...config,
        };
        // Initialize remote logging if enabled
        if (this.config.enableRemote && this.config.remoteEndpoint) {
            this.initializeRemoteLogging();
        }
        // Initialize local storage logging if enabled
        if (this.config.enableLocalStorage) {
            this.initializeLocalStorageLogging();
        }
    }
    // ============================================================================
    // PUBLIC LOGGING METHODS
    // ============================================================================
    debug(message, data, context) {
        this.log("DEBUG", message, data, context);
    }
    info(message, data, context) {
        this.log("INFO", message, data, context);
    }
    warn(message, data, context) {
        this.log("WARN", message, data, context);
    }
    error(message, error, data, context) {
        this.log("ERROR", message, data, context, error);
    }
    critical(message, error, data, context) {
        this.log("CRITICAL", message, data, context, error);
    }
    // ============================================================================
    // PRIVATE LOGGING LOGIC
    // ============================================================================
    log(level, message, data, context, error) {
        // Check if we should log this level
        if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
            return;
        }
        const logEntry = {
            level,
            message,
            data,
            timestamp: new Date(),
            context,
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            error,
        };
        // Console logging (development only)
        if (this.config.enableConsole) {
            this.logToConsole(logEntry);
        }
        // Remote logging (production)
        if (this.config.enableRemote) {
            this.logToRemote(logEntry);
        }
        // Local storage logging (development)
        if (this.config.enableLocalStorage) {
            this.logToLocalStorage(logEntry);
        }
        // Buffer for batch processing
        this.logBuffer.push(logEntry);
        this.processLogBuffer();
    }
    // ============================================================================
    // CONSOLE LOGGING
    // ============================================================================
    logToConsole(entry) {
        const timestamp = entry.timestamp.toISOString();
        const prefix = `[${timestamp}] [${entry.level}]`;
        const context = entry.context ? ` [${entry.context}]` : "";
        switch (entry.level) {
            case "DEBUG":
                console.debug(`${prefix}${context} ${entry.message}`, entry.data || "");
                break;
            case "INFO":
                console.info(`${prefix}${context} ${entry.message}`, entry.data || "");
                break;
            case "WARN":
                console.warn(`${prefix}${context} ${entry.message}`, entry.data || "");
                break;
            case "ERROR":
            case "CRITICAL":
                console.error(`${prefix}${context} ${entry.message}`, entry.error || entry.data || "");
                break;
        }
    }
    // ============================================================================
    // REMOTE LOGGING
    // ============================================================================
    logToRemote(entry) {
        if (!this.config.remoteEndpoint)
            return;
        // Send to remote logging service (e.g., Sentry, LogRocket, etc.)
        try {
            fetch(this.config.remoteEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...entry,
                    appName: this.config.appName,
                    version: this.config.version,
                    environment: this.isProduction ? "production" : "development",
                }),
            }).catch(() => {
                // Silently fail for remote logging to avoid breaking the app
            });
        }
        catch (error) {
            // Silently fail for remote logging
        }
    }
    // ============================================================================
    // LOCAL STORAGE LOGGING
    // ============================================================================
    logToLocalStorage(entry) {
        try {
            const logs = this.getLocalStorageLogs();
            logs.push(entry);
            // Keep only the most recent logs
            if (logs.length > this.config.maxLocalStorageEntries) {
                logs.splice(0, logs.length - this.config.maxLocalStorageEntries);
            }
            localStorage.setItem("sportbeacon_logs", JSON.stringify(logs));
        }
        catch (error) {
            // Silently fail for local storage logging
        }
    }
    getLocalStorageLogs() {
        try {
            const logs = localStorage.getItem("sportbeacon_logs");
            return logs ? JSON.parse(logs) : [];
        }
        catch {
            return [];
        }
    }
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    getUserId() {
        try {
            // Get user ID from auth context or localStorage
            return localStorage.getItem("user_id") || undefined;
        }
        catch {
            return undefined;
        }
    }
    getSessionId() {
        try {
            // Get session ID from localStorage or generate one
            let sessionId = localStorage.getItem("session_id");
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem("session_id", sessionId);
            }
            return sessionId;
        }
        catch {
            return undefined;
        }
    }
    processLogBuffer() {
        // Process buffered logs in batches
        if (this.logBuffer.length >= 10) {
            // Send batch to remote logging
            if (this.config.enableRemote) {
                this.sendBatchToRemote(this.logBuffer);
            }
            this.logBuffer = [];
        }
    }
    sendBatchToRemote(logs) {
        if (!this.config.remoteEndpoint)
            return;
        try {
            fetch(this.config.remoteEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    logs,
                    appName: this.config.appName,
                    version: this.config.version,
                    environment: this.isProduction ? "production" : "development",
                }),
            }).catch(() => {
                // Silently fail for batch logging
            });
        }
        catch (error) {
            // Silently fail for batch logging
        }
    }
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    initializeRemoteLogging() {
        // Initialize remote logging service (e.g., Sentry)
        // This would typically be done in the app initialization
    }
    initializeLocalStorageLogging() {
        // Clear old logs on app start
        try {
            const logs = this.getLocalStorageLogs();
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentLogs = logs.filter(log => new Date(log.timestamp) > oneDayAgo);
            localStorage.setItem("sportbeacon_logs", JSON.stringify(recentLogs));
        }
        catch {
            // Silently fail
        }
    }
    // ============================================================================
    // PUBLIC UTILITY METHODS
    // ============================================================================
    getLogs() {
        return this.getLocalStorageLogs();
    }
    clearLogs() {
        try {
            localStorage.removeItem("sportbeacon_logs");
        }
        catch {
            // Silently fail
        }
    }
    setLevel(level) {
        this.config.level = level;
    }
    setContext(context) {
        this.config = { ...this.config, appName: context };
    }
}
// ============================================================================
// DEFAULT LOGGER INSTANCE
// ============================================================================
export const logger = new Logger();
// ============================================================================
// REACT HOOK FOR LOGGING
// ============================================================================
import { useCallback } from "react";
export const useLogger = (context) => {
    const logDebug = useCallback((message, data) => {
        logger.debug(message, data, context);
    }, [context]);
    const logInfo = useCallback((message, data) => {
        logger.info(message, data, context);
    }, [context]);
    const logWarn = useCallback((message, data) => {
        logger.warn(message, data, context);
    }, [context]);
    const logError = useCallback((message, error, data) => {
        logger.error(message, error, data, context);
    }, [context]);
    const logCritical = useCallback((message, error, data) => {
        logger.critical(message, error, data, context);
    }, [context]);
    return {
        debug: logDebug,
        info: logInfo,
        warn: logWarn,
        error: logError,
        critical: logCritical,
    };
};
// ============================================================================
// EXPORTS
// ============================================================================
export default Logger;
