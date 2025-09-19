import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PlaceHeader = ({ location }) => {
    const getSportIcon = (sport) => {
        switch (sport) {
            case "basketball": return "🏀";
            case "soccer": return "⚽";
            case "tennis": return "🎾";
            case "pickleball": return "🏓";
            case "baseball": return "⚾";
            case "volleyball": return "🏐";
            default: return "🏟️";
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "open": return "text-green-600 bg-green-100";
            case "closed": return "text-red-600 bg-red-100";
            case "limited": return "text-yellow-600 bg-yellow-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };
    return (_jsx("div", { className: "bg-white border-b border-gray-200", children: _jsx("div", { className: "max-w-4xl mx-auto px-4 py-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("span", { className: "text-4xl", children: getSportIcon(location.sport) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: location.name }), _jsx("p", { className: "text-gray-600", children: location.address })] })] }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600 mb-4", children: [_jsxs("span", { children: [location.city, ", ", location.state] }), location.hours && (_jsxs("span", { children: ["\u2022 ", JSON.stringify(location.hours)] }))] }), location.amenities && location.amenities.length > 0 && (_jsxs("div", { className: "flex items-center space-x-2 mb-4", children: [_jsx("span", { className: "text-sm font-medium text-gray-700", children: "Amenities:" }), _jsx("div", { className: "flex space-x-1", children: location.amenities.map((amenity, index) => (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: [amenity === "lights" && "💡", amenity === "restrooms" && "🚻", amenity === "parking" && "🅿️", amenity === "water" && "💧", amenity === "shade" && "🌳", amenity] }, index))) })] })), _jsxs("div", { className: "flex items-center space-x-6 text-sm", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-gray-500", children: "Followers:" }), _jsx("span", { className: "font-semibold text-gray-900", children: location.stats.followers })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-gray-500", children: "Posts:" }), _jsx("span", { className: "font-semibold text-gray-900", children: location.stats.posts })] }), location.stats.lastPostAt && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("span", { className: "text-gray-500", children: "Last post:" }), _jsx("span", { className: "font-semibold text-gray-900", children: new Date(location.stats.lastPostAt).toLocaleDateString() })] }))] })] }), _jsx("div", { className: "ml-6", children: _jsxs("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(location.status)}`, children: [location.status === "open" && "🟢", location.status === "closed" && "🔴", location.status === "limited" && "🟡", _jsx("span", { className: "ml-1 capitalize", children: location.status })] }) })] }) }) }));
};
