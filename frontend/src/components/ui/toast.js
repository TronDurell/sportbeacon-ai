import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const ToastContext = createContext(undefined);
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const addToast = (message, type, duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, message, type, duration };
        setToasts(prev => [...prev, newToast]);
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };
    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };
    const toast = {
        success: (message, _duration) => {
            addToast(message, "success");
        },
        error: (message, _duration) => {
            addToast(message, "error");
        },
        warning: (message, _duration) => {
            addToast(message, "warning");
        },
        info: (message, _duration) => {
            addToast(message, "info");
        }
    };
    const value = {
        toasts,
        addToast,
        removeToast,
        ...toast
    };
    return (_jsxs(ToastContext.Provider, { value: value, children: [children, _jsx(ToastContainer, { toasts: toasts, onRemove: removeToast })] }));
};
const ToastContainer = ({ toasts, onRemove }) => {
    if (toasts.length === 0)
        return null;
    return (_jsx("div", { className: "fixed top-4 right-4 z-50 space-y-2", children: toasts.map(toast => (_jsx(ToastItem, { toast: toast, onRemove: onRemove }, toast.id))) }));
};
const ToastItem = ({ toast, onRemove }) => {
    const getToastStyles = (type) => {
        switch (type) {
            case "success":
                return "bg-green-500 text-white";
            case "error":
                return "bg-red-500 text-white";
            case "warning":
                return "bg-yellow-500 text-black";
            case "info":
                return "bg-blue-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };
    return (_jsx("div", { className: `px-4 py-3 rounded-lg shadow-lg max-w-sm ${getToastStyles(toast.type)}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: toast.message }), _jsx("button", { onClick: () => onRemove(toast.id), className: "ml-4 text-white hover:text-gray-200", children: "\u00D7" })] }) }));
};
