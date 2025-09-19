import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users, Plus, Calendar } from "lucide-react";
const Teams = () => {
    const teams = [
        {
            id: "1",
            name: "Thunder Hawks",
            sport: "Soccer",
            ageGroup: "U14",
            coach: "Coach Smith",
            playerCount: 12,
            maxPlayers: 15,
            status: "active",
            nextGame: new Date("2024-01-27T14:00:00")
        },
        {
            id: "2",
            name: "Lightning Bolts",
            sport: "Basketball",
            ageGroup: "U16",
            coach: "Coach Johnson",
            playerCount: 10,
            maxPlayers: 12,
            status: "active",
            nextGame: new Date("2024-01-28T16:00:00")
        },
        {
            id: "3",
            name: "Storm Riders",
            sport: "Soccer",
            ageGroup: "U12",
            coach: "Coach Wilson",
            playerCount: 15,
            maxPlayers: 15,
            status: "full"
        }
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800";
            case "inactive": return "bg-red-100 text-red-800";
            case "full": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const getPlayerCountColor = (current, max) => {
        const percentage = (current / max) * 100;
        if (percentage >= 90)
            return "text-red-600";
        if (percentage >= 75)
            return "text-yellow-600";
        return "text-green-600";
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Teams" }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Create Team" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: teams.map((team) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: team.name }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(team.status)}`, children: team.status })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Sport:" }), _jsx("span", { className: "ml-2", children: team.sport })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Age Group:" }), _jsx("span", { className: "ml-2", children: team.ageGroup })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx("span", { className: "font-medium", children: "Coach:" }), _jsx("span", { className: "ml-2", children: team.coach })] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "font-medium", children: "Players:" }), _jsxs("span", { className: `ml-2 ${getPlayerCountColor(team.playerCount, team.maxPlayers)}`, children: [team.playerCount, "/", team.maxPlayers] })] }), team.nextGame && (_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "font-medium", children: "Next Game:" }), _jsx("span", { className: "ml-2", children: team.nextGame.toLocaleDateString() })] }))] }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("button", { className: "text-blue-600 hover:text-blue-800 text-sm font-medium", children: "View Details" }), _jsx("button", { className: "text-green-600 hover:text-green-800 text-sm font-medium", children: "Manage Team" })] }) })] }, team.id))) })] }));
};
export default Teams;
