import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ============================================================================
// ERROR CODES
// ============================================================================
export const ERROR_CODES = {
    // Authentication Errors
    AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
    AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS",
    AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
    AUTH_ACCOUNT_DISABLED: "AUTH_ACCOUNT_DISABLED",
    // Validation Errors
    VALIDATION_FAILED: "VALIDATION_FAILED",
    VALIDATION_INVALID_EMAIL: "VALIDATION_INVALID_EMAIL",
    VALIDATION_INVALID_PASSWORD: "VALIDATION_INVALID_PASSWORD",
    VALIDATION_INVALID_INPUT: "VALIDATION_INVALID_INPUT",
    // Network Errors
    NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
    NETWORK_CONNECTION_FAILED: "NETWORK_CONNECTION_FAILED",
    NETWORK_SERVER_ERROR: "NETWORK_SERVER_ERROR",
    // Firebase Errors
    FIREBASE_PERMISSION_DENIED: "FIREBASE_PERMISSION_DENIED",
    FIREBASE_DOCUMENT_NOT_FOUND: "FIREBASE_DOCUMENT_NOT_FOUND",
    FIREBASE_QUOTA_EXCEEDED: "FIREBASE_QUOTA_EXCEEDED",
    // Business Logic Errors
    BUSINESS_INVALID_OPERATION: "BUSINESS_INVALID_OPERATION",
    BUSINESS_RESOURCE_NOT_FOUND: "BUSINESS_RESOURCE_NOT_FOUND",
    BUSINESS_CONFLICT: "BUSINESS_CONFLICT",
    // System Errors
    SYSTEM_UNKNOWN_ERROR: "SYSTEM_UNKNOWN_ERROR",
    SYSTEM_CONFIGURATION_ERROR: "SYSTEM_CONFIGURATION_ERROR",
};
// ============================================================================
// ERROR HANDLER CLASS
// ============================================================================
export class ErrorHandler {
    static instance;
    errorQueue = [];
    maxQueueSize = 100;
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    /**
     * Handle and process an error
     */
    handleError(error, context, severity = "medium") {
        const appError = {
            code: this.getErrorCode(error),
            message: this.getErrorMessage(error),
            details: this.extractErrorDetails(error),
            timestamp: new Date(),
            userId: this.getCurrentUserId(),
            context,
            severity
        };
        this.logError(appError);
        this.sendToMonitoring(appError);
        this.addToQueue(appError);
        return appError;
    }
    /**
     * Create a standardized error response
     */
    createErrorResponse(error) {
        return {
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        };
    }
    /**
     * Handle Firebase-specific errors
     */
    handleFirebaseError(error, context) {
        const firebaseError = error;
        let code = ERROR_CODES.FIREBASE_PERMISSION_DENIED;
        let message = "Firebase operation failed";
        if (firebaseError.code) {
            switch (firebaseError.code) {
                case "permission-denied":
                    code = ERROR_CODES.FIREBASE_PERMISSION_DENIED;
                    message = "Access denied. You do not have permission to perform this operation.";
                    break;
                case "not-found":
                    code = ERROR_CODES.FIREBASE_DOCUMENT_NOT_FOUND;
                    message = "The requested resource was not found.";
                    break;
                case "quota-exceeded":
                    code = ERROR_CODES.FIREBASE_QUOTA_EXCEEDED;
                    message = "Service quota exceeded. Please try again later.";
                    break;
                default:
                    code = ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
                    message = firebaseError.message || "An unexpected Firebase error occurred.";
            }
        }
        return this.handleError(error, context, "high");
    }
    /**
     * Handle network-related errors
     */
    handleNetworkError(error, context) {
        const networkError = error;
        let code = ERROR_CODES.NETWORK_SERVER_ERROR;
        let message = "Network request failed";
        if (networkError.status) {
            switch (networkError.status) {
                case 408:
                    code = ERROR_CODES.NETWORK_TIMEOUT;
                    message = "Request timed out. Please try again.";
                    break;
                case 500:
                    code = ERROR_CODES.NETWORK_SERVER_ERROR;
                    message = "Server error. Please try again later.";
                    break;
                default:
                    code = ERROR_CODES.NETWORK_CONNECTION_FAILED;
                    message = networkError.message || "Network connection failed.";
            }
        }
        return this.handleError(error, context, "medium");
    }
    /**
     * Handle validation errors
     */
    handleValidationError(errors, context) {
        const error = {
            code: ERROR_CODES.VALIDATION_FAILED,
            message: "Validation failed",
            details: { errors },
            timestamp: new Date(),
            userId: this.getCurrentUserId(),
            context,
            severity: "low"
        };
        this.logError(error);
        return error;
    }
    /**
     * Extract error code from various error types
     */
    getErrorCode(error) {
        if (typeof error === "object" && error !== null) {
            const errorObj = error;
            return errorObj.code || errorObj.name || ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
        }
        return ERROR_CODES.SYSTEM_UNKNOWN_ERROR;
    }
    /**
     * Extract error message from various error types
     */
    getErrorMessage(error) {
        if (typeof error === "string") {
            return error;
        }
        if (typeof error === "object" && error !== null) {
            const errorObj = error;
            return errorObj.message || errorObj.toString?.() || "An unknown error occurred";
        }
        return "An unknown error occurred";
    }
    /**
     * Extract additional error details
     */
    extractErrorDetails(error) {
        if (typeof error === "object" && error !== null) {
            const errorObj = error;
            const details = {};
            // Extract common error properties
            ["stack", "cause", "status", "statusText", "url"].forEach(key => {
                if (errorObj[key] !== undefined) {
                    details[key] = errorObj[key];
                }
            });
            return details;
        }
        return {};
    }
    /**
     * Get current user ID for error tracking
     */
    getCurrentUserId() {
        // TODO: Implement user ID retrieval from auth context
        return undefined;
    }
    /**
     * Log error to console and external services
     */
    logError(error) {
        // Console logging
        console.error("Application Error:", {
            code: error.code,
            message: error.message,
            context: error.context,
            severity: error.severity,
            timestamp: error.timestamp,
            userId: error.userId
        });
        // TODO: Send to external logging service (Sentry, LogRocket, etc.)
        if (error.severity === "critical" || error.severity === "high") {
            this.sendToMonitoring(error);
        }
    }
    /**
     * Send error to monitoring service
     */
    sendToMonitoring(error) {
        // TODO: Implement monitoring service integration
        // Example: Sentry.captureException(error);
        console.warn("Error monitoring not implemented:", error);
    }
    /**
     * Add error to queue for batch processing
     */
    addToQueue(error) {
        this.errorQueue.push(error);
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest error
        }
    }
    /**
     * Get all queued errors
     */
    getQueuedErrors() {
        return [...this.errorQueue];
    }
    /**
     * Clear error queue
     */
    clearErrorQueue() {
        this.errorQueue = [];
    }
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const getErrorHandler = () => ErrorHandler.getInstance();
/**
 * Convenience function to handle errors
 */
export const handleError = (error, context) => {
    return getErrorHandler().handleError(error, context);
};
/**
 * Convenience function to create error responses
 */
export const createErrorResponse = (error) => {
    return getErrorHandler().createErrorResponse(error);
};
/**
 * Convenience function to handle Firebase errors
 */
export const handleFirebaseError = (error, context) => {
    return getErrorHandler().handleFirebaseError(error, context);
};
/**
 * Convenience function to handle network errors
 */
export const handleNetworkError = (error, context) => {
    return getErrorHandler().handleNetworkError(error, context);
};
/**
 * Convenience function to handle validation errors
 */
export const handleValidationError = (errors, context) => {
    return getErrorHandler().handleValidationError(errors, context);
};
// ============================================================================
// REACT ERROR BOUNDARY
// ============================================================================
import React from "react";
/**
 * Default error fallback component
 */
export const DefaultErrorFallback = ({ error, resetError }) => {
    return (_jsxs("div", { className: "error-fallback", children: [_jsx("h2", { children: "Something went wrong" }), _jsx("p", { children: error.message }), _jsx("button", { onClick: resetError, children: "Try again" })] }));
};
/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = (Component, FallbackComponent = DefaultErrorFallback) => {
    return class ErrorBoundary extends React.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false };
        }
        static getDerivedStateFromError(error) {
            const appError = handleError(error, "ErrorBoundary");
            return { hasError: true, error: appError };
        }
        componentDidCatch(error, errorInfo) {
            handleError(error, "ErrorBoundary");
        }
        resetError = () => {
            this.setState({ hasError: false, error: undefined });
        };
        render() {
            if (this.state.hasError && this.state.error) {
                return _jsx(FallbackComponent, { error: this.state.error, resetError: this.resetError });
            }
            return _jsx(Component, { ...this.props });
        }
    };
};
