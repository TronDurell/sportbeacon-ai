import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, Clock, MapPin } from "lucide-react";
const Calendar = () => {
    const events = [
        {
            id: "1",
            title: "Team Practice",
            type: "practice",
            startTime: new Date("2024-01-25T16:00:00"),
            endTime: new Date("2024-01-25T18:00:00"),
            location: "Main Field",
            description: "Regular team practice session"
        },
        {
            id: "2",
            title: "Game vs Eagles",
            type: "game",
            startTime: new Date("2024-01-27T14:00:00"),
            endTime: new Date("2024-01-27T16:00:00"),
            location: "Stadium Complex",
            description: "Home game against Eagles"
        },
        {
            id: "3",
            title: "Team Meeting",
            type: "meeting",
            startTime: new Date("2024-01-26T18:00:00"),
            endTime: new Date("2024-01-26T19:00:00"),
            location: "Team Room",
            description: "Weekly team strategy meeting"
        }
    ];
    const getEventTypeIcon = (type) => {
        switch (type) {
            case "game": return "🏆";
            case "practice": return "⚽";
            case "meeting": return "📋";
            default: return "📅";
        }
    };
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Calendar" }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add Event" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "January 2024" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "p-2 hover:bg-gray-100 rounded-md", children: "\u2190" }), _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-md", children: "\u2192" })] })] }), _jsxs("div", { className: "grid grid-cols-7 gap-1 mb-4", children: [["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (_jsx("div", { className: "p-2 text-center text-sm font-medium text-gray-500", children: day }, day))), Array.from({ length: 31 }, (_, i) => (_jsx("div", { className: "p-2 text-center text-sm border border-gray-200 min-h-[60px] hover:bg-gray-50 cursor-pointer", children: _jsx("span", { className: "text-gray-900", children: i + 1 }) }, i + 1)))] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Upcoming Events" }), _jsx("div", { className: "space-y-4", children: events.slice(0, 5).map((event) => (_jsx("div", { className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "text-2xl", children: getEventTypeIcon(event.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-1", children: event.title }), _jsxs("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsx("span", { children: formatTime(event.startTime) })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(MapPin, { className: "w-4 h-4" }), _jsx("span", { children: event.location })] })] }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: event.description })] })] }) }, event.id))) })] }), _jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "This Week" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Games" }), _jsx("span", { className: "font-medium", children: events.filter(e => e.type === "game").length })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Practices" }), _jsx("span", { className: "font-medium", children: events.filter(e => e.type === "practice").length })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Meetings" }), _jsx("span", { className: "font-medium", children: events.filter(e => e.type === "meeting").length })] })] })] })] })] })] }));
};
export default Calendar;
