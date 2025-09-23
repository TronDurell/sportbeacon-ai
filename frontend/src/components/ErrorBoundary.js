import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
        // Log to external service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error reporting service
            console.error('Production error:', error, errorInfo);
        }
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { className: "error-boundary", children: [_jsx("h2", { children: "Something went wrong." }), _jsxs("details", { style: { whiteSpace: 'pre-wrap' }, children: [this.state.error && this.state.error.toString(), _jsx("br", {}), this.state.errorInfo?.componentStack] })] }));
        }
        return this.props.children;
    }
}
// Higher-order component for error boundaries
export function withErrorBoundary(Component, errorBoundaryProps) {
    const WrappedComponent = (props) => (_jsx(ErrorBoundary, { ...errorBoundaryProps, children: _jsx(Component, { ...props }) }));
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
// Hook for error boundary functionality
export function useErrorHandler() {
    return (error, errorInfo) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo);
        // You can add custom error handling logic here
        // For example, sending to an error reporting service
    };
}
