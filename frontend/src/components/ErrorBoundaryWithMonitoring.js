import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
class ErrorBoundaryWithMonitoring extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // Log error to console in development
        if (import.meta.env.DEV) {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }
        // Send error to monitoring service
        this.reportError(error, errorInfo);
        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }
    reportError = async (error, errorInfo) => {
        try {
            const errorReport = {
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId(),
            };
            // Send to error monitoring service
            if (import.meta.env.VITE_SENTRY_DSN) {
                await this.sendToSentry(errorReport);
            }
            // Send to custom endpoint
            if (import.meta.env.VITE_ERROR_REPORTING_ENDPOINT) {
                await this.sendToCustomEndpoint(errorReport);
            }
            // Store in localStorage for debugging
            this.storeErrorLocally(errorReport);
        }
        catch (reportingError) {
            console.error("Failed to report error:", reportingError);
        }
    };
    sendToSentry = async (errorReport) => {
        // This would integrate with Sentry
        console.log("Sending to Sentry:", errorReport);
    };
    sendToCustomEndpoint = async (errorReport) => {
        await fetch(import.meta.env.VITE_ERROR_REPORTING_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(errorReport),
        });
    };
    storeErrorLocally = (errorReport) => {
        try {
            const errors = JSON.parse(localStorage.getItem("app-errors") || "[]");
            errors.push(errorReport);
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            localStorage.setItem("app-errors", JSON.stringify(errors));
        }
        catch (e) {
            console.error("Failed to store error locally:", e);
        }
    };
    getCurrentUserId = () => {
        // This would get the current user ID from your auth context
        return localStorage.getItem("userId");
    };
    getSessionId = () => {
        let sessionId = sessionStorage.getItem("sessionId");
        if (!sessionId) {
            sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem("sessionId", sessionId);
        }
        return sessionId;
    };
    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };
    handleReload = () => {
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: _jsxs("div", { className: "max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("svg", { className: "h-8 w-8 text-red-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsx("div", { className: "ml-3", children: _jsx("h3", { className: "text-lg font-medium text-gray-900 dark:text-white", children: "Something went wrong" }) })] }), _jsx("div", { className: "mb-4", children: _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "We're sorry, but something unexpected happened. Our team has been notified." }) }), import.meta.env.DEV && this.state.error && (_jsxs("details", { className: "mb-4", children: [_jsx("summary", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer", children: "Error Details (Development)" }), _jsxs("div", { className: "mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32", children: [_jsxs("div", { className: "mb-2", children: [_jsx("strong", { children: "Error:" }), " ", this.state.error.message] }), _jsxs("div", { className: "mb-2", children: [_jsx("strong", { children: "Stack:" }), _jsx("pre", { className: "whitespace-pre-wrap", children: this.state.error.stack })] }), this.state.errorInfo && (_jsxs("div", { children: [_jsx("strong", { children: "Component Stack:" }), _jsx("pre", { className: "whitespace-pre-wrap", children: this.state.errorInfo.componentStack })] }))] })] })), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: this.handleRetry, className: "flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors", children: "Try Again" }), _jsx("button", { onClick: this.handleReload, className: "flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors", children: "Reload Page" })] })] }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundaryWithMonitoring;
