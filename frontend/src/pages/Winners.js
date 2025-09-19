import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
const Winners = () => {
    const [timePeriodDays, setTimePeriodDays] = useState(30);
    const [limit, setLimit] = useState(10);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);
        try {
            const requestData = {
                time_period_days: timePeriodDays,
                limit: limit
            };
            const data = await api.getTopWinners(requestData);
            setResponse(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to get top winners");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Top Winners" }), _jsxs("form", { onSubmit: handleSubmit, className: "mb-6", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 text-sm font-bold mb-2", htmlFor: "time-period", children: "Time Period (Days)" }), _jsx("input", { id: "time-period", type: "number", min: "1", max: "365", value: timePeriodDays, onChange: (e) => setTimePeriodDays(parseInt(e.target.value) || 30), className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", placeholder: "30" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 text-sm font-bold mb-2", htmlFor: "limit", children: "Number of Winners" }), _jsx("input", { id: "limit", type: "number", min: "1", max: "50", value: limit, onChange: (e) => setLimit(parseInt(e.target.value) || 10), className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", placeholder: "10" })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50", children: loading ? "Loading Winners..." : "Get Top Winners" })] }), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: [_jsx("strong", { children: "Error:" }), " ", error] })), response && (_jsxs("div", { className: "bg-gray-100 p-4 rounded", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Top Winners" }), _jsx("div", { className: "mb-4", children: _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Time Period:" }), " ", timePeriodDays, " days | ", _jsx("strong", { children: "Total Found:" }), " ", response.total_found] }) }), _jsx("div", { className: "bg-white rounded shadow overflow-hidden", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Rank" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Player" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Wins" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Win Rate" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Avg Points" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Top Skills" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: response.winners.map((winner, index) => (_jsxs("tr", { className: index % 2 === 0 ? "bg-white" : "bg-gray-50", children: [_jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: ["#", index + 1] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: winner.name }), _jsxs("div", { className: "text-sm text-gray-500", children: ["ID: ", winner.id] })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: winner.games_played }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: [(winner.win_rate * 100).toFixed(1), "%"] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: winner.avg_points?.toFixed(1) || "N/A" }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: _jsx("div", { className: "flex flex-wrap gap-1", children: winner.top_skills?.slice(0, 3).map((skill, skillIndex) => (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800", children: skill }, skillIndex))) }) })] }, winner.id))) })] }) }), response.winners.length > 0 && (_jsxs("div", { className: "mt-6 bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-3", children: "Player Insights" }), _jsx("div", { className: "grid gap-4", children: response.winners.slice(0, 3).map((winner) => (_jsxs("div", { className: "border-l-4 border-purple-500 pl-4", children: [_jsx("h4", { className: "font-medium text-gray-900", children: winner.name }), _jsx("div", { className: "text-sm text-gray-600 mt-1", children: winner.insights?.map((insight, insightIndex) => (_jsxs("div", { className: "mb-1", children: ["\u2022 ", insight] }, insightIndex))) })] }, winner.id))) })] })), _jsxs("div", { className: "mt-4 bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Raw Response:" }), _jsx("pre", { className: "text-sm overflow-auto", children: JSON.stringify(response, null, 2) })] })] }))] }));
};
export default Winners;
