import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { ErrorHandler } from "../utils/errorHandler";
// ============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// ============================================================================
export const DefaultErrorFallback = ({ error, resetError, context = "Application" }) => {
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg border border-red-200", children: [_jsx("div", { className: "text-red-600 mb-4", children: _jsx("svg", { className: "w-16 h-16 mx-auto", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" }) }) }), _jsxs("h1", { className: "text-xl font-semibold text-gray-900 mb-2", children: [context, " Error"] }), _jsx("p", { className: "text-gray-600 mb-4", children: "Something went wrong. We've been notified and are working to fix the issue." }), process.env.NODE_ENV === "development" && (_jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 text-left", children: [_jsx("p", { className: "text-sm text-gray-800 font-mono break-all", children: error.message }), error.stack && (_jsxs("details", { className: "mt-2", children: [_jsx("summary", { className: "text-sm text-gray-600 cursor-pointer", children: "Stack Trace" }), _jsx("pre", { className: "text-xs text-gray-600 mt-2 whitespace-pre-wrap", children: error.stack })] }))] })), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: resetError, className: "flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors", children: "Try Again" }), _jsx("button", { onClick: () => window.location.reload(), className: "flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors", children: "Reload Page" })] }), _jsx("div", { className: "mt-4 text-sm text-gray-500", children: _jsx("p", { children: "If the problem persists, please contact support." }) })] }) }));
};
// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================
export class ErrorBoundary extends Component {
    errorHandler;
    constructor(props) {
        super(props);
        this.state = { hasError: false };
        this.errorHandler = ErrorHandler.getInstance();
    }
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        // Log the error to our error handling service
        const appError = this.errorHandler.handleError(error, this.props.context || "ErrorBoundary", "high");
        // Update state with error information
        this.setState({
            errorInfo,
            appError
        });
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // Log to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }
    }
    componentDidUpdate(prevProps) {
        // Reset error state when resetKeys change
        if (this.state.hasError && this.props.resetKeys !== prevProps.resetKeys) {
            this.resetError();
        }
    }
    resetError = () => {
        this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            appError: undefined
        });
    };
    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return (_jsx(FallbackComponent, { error: this.state.error, errorInfo: this.state.errorInfo, appError: this.state.appError, resetError: this.resetError, context: this.props.context }));
        }
        return this.props.children;
    }
}
// ============================================================================
// HIGHER-ORDER COMPONENT FOR ERROR BOUNDARIES
// ============================================================================
export const withErrorBoundary = (Component, fallback, context) => {
    const WrappedComponent = (props) => (_jsx(ErrorBoundary, { fallback: fallback, context: context, children: _jsx(Component, { ...props }) }));
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
};
// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================
// Admin-specific error boundary
export const AdminErrorBoundary = ({ children }) => (_jsx(ErrorBoundary, { context: "Admin Interface", fallback: ({ error, resetError }) => (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-medium text-red-800 mb-2", children: "Admin Interface Error" }), _jsx("p", { className: "text-red-700 mb-3", children: error.message }), _jsx("button", { onClick: resetError, className: "bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700", children: "Retry" })] })), children: children }));
// Coach-specific error boundary
export const CoachErrorBoundary = ({ children }) => (_jsx(ErrorBoundary, { context: "Coach Interface", fallback: ({ error, resetError }) => (_jsxs("div", { className: "bg-orange-50 border border-orange-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-medium text-orange-800 mb-2", children: "Coach Interface Error" }), _jsx("p", { className: "text-orange-700 mb-3", children: error.message }), _jsx("button", { onClick: resetError, className: "bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700", children: "Retry" })] })), children: children }));
// Player-specific error boundary
export const PlayerErrorBoundary = ({ children }) => (_jsx(ErrorBoundary, { context: "Player Interface", fallback: ({ error, resetError }) => (_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-medium text-blue-800 mb-2", children: "Player Interface Error" }), _jsx("p", { className: "text-blue-700 mb-3", children: error.message }), _jsx("button", { onClick: resetError, className: "bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700", children: "Retry" })] })), children: children }));
// ============================================================================
// EXPORTS
// ============================================================================
export default ErrorBoundary;
