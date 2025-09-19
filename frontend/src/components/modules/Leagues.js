import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Trophy } from "lucide-react";
const Leagues = () => {
    const leagues = [
        {
            id: "1",
            name: "Spring Soccer League",
            sport: "Soccer",
            season: "Spring 2024",
            teamCount: 12,
            status: "active",
            startDate: new Date("2024-03-01"),
            endDate: new Date("2024-05-31")
        },
        {
            id: "2",
            name: "Summer Basketball",
            sport: "Basketball",
            season: "Summer 2024",
            teamCount: 8,
            status: "draft",
            startDate: new Date("2024-06-01"),
            endDate: new Date("2024-08-31")
        }
    ];
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Leagues" }), _jsxs("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx(Trophy, { className: "w-4 h-4" }), _jsx("span", { children: "Create League" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: leagues.map((league) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx(Trophy, { className: "w-8 h-8 text-yellow-500" }), _jsx("span", { className: `px-2 py-1 text-xs font-semibold rounded-full ${league.status === "active" ? "bg-green-100 text-green-800" :
                                        league.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                                            "bg-red-100 text-red-800"}`, children: league.status })] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: league.name }), _jsxs("p", { className: "text-sm text-gray-600 mb-4", children: [league.sport, " \u2022 ", league.season] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx("span", { className: "mr-2", children: "Teams:" }), league.teamCount, " teams"] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx("span", { className: "mr-2", children: "Season:" }), league.startDate.toLocaleDateString(), " - ", league.endDate.toLocaleDateString()] })] })] }, league.id))) })] }));
};
export default Leagues;
