import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const SkeletonLoader = ({ type = "text", className = "", lines = 1 }) => {
    const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";
    const renderSkeleton = () => {
        switch (type) {
            case "text":
                return (_jsx("div", { className: `${baseClasses} h-4 ${className}` }));
            case "card":
                return (_jsxs("div", { className: `${baseClasses} p-4 ${className}`, children: [_jsx("div", { className: "h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2" }), _jsx("div", { className: "h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4" }), _jsx("div", { className: "h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" })] }));
            case "feed":
                return (_jsxs("div", { className: `${baseClasses} p-4 mb-4 ${className}`, children: [_jsxs("div", { className: "flex items-center mb-3", children: [_jsx("div", { className: "w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full mr-3" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "h-4 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-1/3" }), _jsx("div", { className: "h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-300 dark:bg-gray-600 rounded" }), _jsx("div", { className: "h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6" }), _jsx("div", { className: "h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6" })] })] }));
            case "image":
                return (_jsx("div", { className: `${baseClasses} aspect-video ${className}` }));
            default:
                return (_jsx("div", { className: `${baseClasses} h-4 ${className}` }));
        }
    };
    if (type === "text" && lines > 1) {
        return (_jsx("div", { className: "space-y-2", children: Array.from({ length: lines }).map((_, index) => (_jsx("div", { className: `${baseClasses} h-4 ${index === lines - 1 ? "w-3/4" : ""} ${className}` }, index))) }));
    }
    return renderSkeleton();
};
export default SkeletonLoader;
