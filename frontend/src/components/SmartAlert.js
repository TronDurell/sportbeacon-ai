import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { X, Bot } from "lucide-react";
const statusColors = {
    info: "border-blue-300 bg-blue-50",
    warning: "border-yellow-300 bg-yellow-50",
    error: "border-red-300 bg-red-50",
    success: "border-green-300 bg-green-50",
};
const SmartAlert = ({ id, title, message, icon, status = "info", onDismiss, actions = [], }) => {
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 30 }, layout: true, className: `relative p-4 rounded-xl border shadow-md flex items-start gap-4 mb-3 ${statusColors[status]}`, children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: icon || _jsx(Bot, { className: "w-6 h-6 text-blue-500" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-semibold text-gray-900 text-base", children: title }), _jsx("button", { className: "ml-2 p-1 rounded hover:bg-gray-200", onClick: () => onDismiss(id), "aria-label": "Dismiss alert", children: _jsx(X, { className: "w-4 h-4 text-gray-500" }) })] }), _jsx("p", { className: "text-sm text-gray-700 mt-1 mb-2", children: message }), actions.length > 0 && (_jsx("div", { className: "flex gap-2 mt-2", children: actions.map((action, idx) => (_jsx("button", { onClick: action.onClick, className: `px-3 py-1.5 text-xs rounded-md font-medium transition-colors
                  ${action.variant === "primary" ? "bg-blue-600 text-white hover:bg-blue-700" :
                                action.variant === "secondary" ? "bg-gray-100 text-gray-700 hover:bg-gray-200" :
                                    "text-blue-600 hover:bg-blue-50"}
                `, children: action.label }, idx))) }))] })] }));
};
export default SmartAlert;
