import { jsx as _jsx } from "react/jsx-runtime";
const LoadingSpinner = ({ size = "md", className = "" }) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };
    return (_jsx("div", { className: `flex justify-center items-center ${className}`, children: _jsx("div", { className: `${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-blue-600`, role: "status", "aria-label": "Loading", children: _jsx("span", { className: "sr-only", children: "Loading..." }) }) }));
};
export default LoadingSpinner;
