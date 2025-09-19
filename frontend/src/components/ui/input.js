import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
const Input = forwardRef(({ label, error, helperText, className = "", ...props }, ref) => {
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: label })), _jsx("input", { ref: ref, className: `
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? "border-red-300" : "border-gray-300"}
            ${className}
          `, ...props }), error && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: error })), helperText && !error && (_jsx("p", { className: "mt-1 text-sm text-gray-500", children: helperText }))] }));
});
Input.displayName = "Input";
export { Input };
