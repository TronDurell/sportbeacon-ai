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
// TYPES
// ============================================================================

export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
  CRITICAL: 4;
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  context?: string;
  userId?: string;
  sessionId?: string;
  error?: Error;
}

export interface LoggerConfig {
  level: keyof LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  maxLocalStorageEntries: number;
  remoteEndpoint?: string;
  appName: string;
  version: string;
}

// ============================================================================
// LOG LEVELS
// ============================================================================

export const LOG_LEVELS: LogLevel = {
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
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private isProduction: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      level: this.isProduction ? 'WARN' : 'DEBUG',
      enableConsole: !this.isProduction,
      enableRemote: this.isProduction,
      enableLocalStorage: !this.isProduction,
      maxLocalStorageEntries: 100,
      appName: 'SportBeaconAI',
      version: '1.0.0',
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

  debug(message: string, data?: unknown, context?: string): void {
    this.log('DEBUG', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('INFO', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('WARN', message, data, context);
  }

  error(message: string, error?: Error, data?: unknown, context?: string): void {
    this.log('ERROR', message, data, context, error);
  }

  critical(message: string, error?: Error, data?: unknown, context?: string): void {
    this.log('CRITICAL', message, data, context, error);
  }

  // ============================================================================
  // PRIVATE LOGGING LOGIC
  // ============================================================================

  private log(
    level: keyof LogLevel,
    message: string,
    data?: unknown,
    context?: string,
    error?: Error
  ): void {
    // Check if we should log this level
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const logEntry: LogEntry = {
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

  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}]`;
    const context = entry.context ? ` [${entry.context}]` : '';

    switch (entry.level) {
      case 'DEBUG':
        console.debug(`${prefix}${context} ${entry.message}`, entry.data || '');
        break;
      case 'INFO':
        console.info(`${prefix}${context} ${entry.message}`, entry.data || '');
        break;
      case 'WARN':
        console.warn(`${prefix}${context} ${entry.message}`, entry.data || '');
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(`${prefix}${context} ${entry.message}`, entry.error || entry.data || '');
        break;
    }
  }

  // ============================================================================
  // REMOTE LOGGING
  // ============================================================================

  private logToRemote(entry: LogEntry): void {
    if (!this.config.remoteEndpoint) return;

    // Send to remote logging service (e.g., Sentry, LogRocket, etc.)
    try {
      fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          appName: this.config.appName,
          version: this.config.version,
          environment: this.isProduction ? 'production' : 'development',
        }),
      }).catch(() => {
        // Silently fail for remote logging to avoid breaking the app
      });
    } catch (error) {
      // Silently fail for remote logging
    }
  }

  // ============================================================================
  // LOCAL STORAGE LOGGING
  // ============================================================================

  private logToLocalStorage(entry: LogEntry): void {
    try {
      const logs = this.getLocalStorageLogs();
      logs.push(entry);

      // Keep only the most recent logs
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs.splice(0, logs.length - this.config.maxLocalStorageEntries);
      }

      localStorage.setItem('sportbeacon_logs', JSON.stringify(logs));
    } catch (error) {
      // Silently fail for local storage logging
    }
  }

  private getLocalStorageLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem('sportbeacon_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getUserId(): string | undefined {
    try {
      // Get user ID from auth context or localStorage
      return localStorage.getItem('user_id') || undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    try {
      // Get session ID from localStorage or generate one
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    } catch {
      return undefined;
    }
  }

  private processLogBuffer(): void {
    // Process buffered logs in batches
    if (this.logBuffer.length >= 10) {
      // Send batch to remote logging
      if (this.config.enableRemote) {
        this.sendBatchToRemote(this.logBuffer);
      }
      this.logBuffer = [];
    }
  }

  private sendBatchToRemote(logs: LogEntry[]): void {
    if (!this.config.remoteEndpoint) return;

    try {
      fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs,
          appName: this.config.appName,
          version: this.config.version,
          environment: this.isProduction ? 'production' : 'development',
        }),
      }).catch(() => {
        // Silently fail for batch logging
      });
    } catch (error) {
      // Silently fail for batch logging
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeRemoteLogging(): void {
    // Initialize remote logging service (e.g., Sentry)
    // This would typically be done in the app initialization
  }

  private initializeLocalStorageLogging(): void {
    // Clear old logs on app start
    try {
      const logs = this.getLocalStorageLogs();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => new Date(log.timestamp) > oneDayAgo);
      localStorage.setItem('sportbeacon_logs', JSON.stringify(recentLogs));
    } catch {
      // Silently fail
    }
  }

  // ============================================================================
  // PUBLIC UTILITY METHODS
  // ============================================================================

  getLogs(): LogEntry[] {
    return this.getLocalStorageLogs();
  }

  clearLogs(): void {
    try {
      localStorage.removeItem('sportbeacon_logs');
    } catch {
      // Silently fail
    }
  }

  setLevel(level: keyof LogLevel): void {
    this.config.level = level;
  }

  setContext(context: string): void {
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

import { useCallback } from 'react';

export const useLogger = (context?: string) => {
  const logDebug = useCallback((message: string, data?: unknown) => {
    logger.debug(message, data, context);
  }, [context]);

  const logInfo = useCallback((message: string, data?: unknown) => {
    logger.info(message, data, context);
  }, [context]);

  const logWarn = useCallback((message: string, data?: unknown) => {
    logger.warn(message, data, context);
  }, [context]);

  const logError = useCallback((message: string, error?: Error, data?: unknown) => {
    logger.error(message, error, data, context);
  }, [context]);

  const logCritical = useCallback((message: string, error?: Error, data?: unknown) => {
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