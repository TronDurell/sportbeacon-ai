import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const ScheduleBuilder = ({ className = "" }) => {
    const { triggerScheduleOptimization } = useAgentOrchestration();
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [selectedFacility, setSelectedFacility] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [leagueId, setLeagueId] = useState("");
    const [loading, setLoading] = useState(false);
    // Mock data
    const [teams] = useState([
        { id: "1", name: "Team Alpha", league: "League 1", leagueId: "1", coachId: "1", players: [], coaches: ["1"], createdAt: new Date(), updatedAt: new Date() },
        { id: "2", name: "Team Beta", league: "League 1", leagueId: "1", coachId: "2", players: [], coaches: ["2"], createdAt: new Date(), updatedAt: new Date() },
        { id: "3", name: "Team Gamma", league: "League 1", leagueId: "1", coachId: "3", players: [], coaches: ["3"], createdAt: new Date(), updatedAt: new Date() }
    ]);
    const [facilities] = useState([
        {
            id: "1",
            name: "Main Sports Complex",
            address: "123 Sports Ave",
            fields: [
                { id: "1", name: "Field 1", facilityId: "1", type: "soccer", capacity: 100, createdAt: new Date(), updatedAt: new Date() },
                { id: "2", name: "Field 2", facilityId: "1", type: "basketball", capacity: 50, createdAt: new Date(), updatedAt: new Date() }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "2",
            name: "Community Center",
            address: "456 Community St",
            fields: [
                { id: "3", name: "Indoor Court", facilityId: "2", type: "basketball", capacity: 75, createdAt: new Date(), updatedAt: new Date() }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
    const [games, setGames] = useState([]);
    const handleTeamToggle = (teamId) => {
        setSelectedTeams(prev => prev.includes(teamId)
            ? prev.filter(id => id !== teamId)
            : [...prev, teamId]);
    };
    const handleCreateGame = async () => {
        if (selectedTeams.length < 2 || !selectedFacility || !selectedDate || !selectedTime) {
            alert("Please select at least 2 teams, a facility, date, and time.");
            return;
        }
        setLoading(true);
        try {
            const newGame = {
                id: Date.now().toString(),
                homeTeam: getTeamName(selectedTeams[0] || ''),
                awayTeam: getTeamName(selectedTeams[1] || ''),
                homeTeamId: selectedTeams[0] || '',
                awayTeamId: selectedTeams[1] || '',
                date: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
                location: getFieldName(selectedFacility),
                status: "scheduled",
                createdAt: new Date(),
                updatedAt: new Date()
            };
            setGames(prev => [...prev, newGame]);
            // Reset form
            setSelectedTeams([]);
            setSelectedFacility("");
            setSelectedDate("");
            setSelectedTime("");
        }
        catch (error) {
        }
        finally {
            setLoading(false);
        }
    };
    const handleOptimizeSchedule = async () => {
        if (selectedTeams.length < 2) {
            alert("Please select at least 2 teams for optimization.");
            return;
        }
        setLoading(true);
        try {
            await triggerScheduleOptimization();
            alert("Schedule optimization completed!");
        }
        catch (error) {
            alert("Failed to optimize schedule. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    const getFieldName = (fieldId) => {
        const facility = facilities.find(f => f.fields.some(field => field.id === fieldId));
        return facility?.fields.find(f => f.id === fieldId)?.name || "Unknown Field";
    };
    const getTeamName = (teamId) => {
        return teams.find(t => t.id === teamId)?.name || "Unknown Team";
    };
    const formatDate = (date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };
    return (_jsxs("div", { className: `bg-white rounded-lg shadow-sm border ${className}`, children: [_jsxs("div", { className: "p-6 border-b", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Schedule Builder" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Create and manage game schedules for your teams." })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Select Teams" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: teams.map((team) => (_jsxs("div", { className: `p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedTeams.includes(team.id)
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"}`, onClick: () => handleTeamToggle(team.id), children: [_jsx("h4", { className: "font-semibold text-gray-900", children: team.name }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Coach ID: ", team.coachId] })] }, team.id))) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Facility" }), _jsxs("select", { value: selectedFacility, onChange: (e) => setSelectedFacility(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select a facility" }), facilities.map((facility) => (_jsx("optgroup", { label: facility.name, children: facility.fields.map((field) => (_jsxs("option", { value: field.id, children: [field.name, " (", field.type, ")"] }, field.id))) }, facility.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Date" }), _jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Time" }), _jsx("input", { type: "time", value: selectedTime, onChange: (e) => setSelectedTime(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "League ID" }), _jsx("input", { type: "text", value: leagueId, onChange: (e) => setLeagueId(e.target.value), className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "Enter league ID" })] })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { onClick: handleCreateGame, disabled: loading || selectedTeams.length < 2 || !selectedFacility || !selectedDate || !selectedTime, className: "px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? "Creating..." : "Create Game" }), _jsx("button", { onClick: handleOptimizeSchedule, disabled: loading || selectedTeams.length < 2, className: "px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? "Optimizing..." : "Optimize Schedule" })] }), games.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Scheduled Games" }), _jsx("div", { className: "space-y-3", children: games.map((game) => {
                                    const homeTeam = teams.find(t => t.id === game.homeTeamId);
                                    const awayTeam = teams.find(t => t.id === game.awayTeamId);
                                    return (_jsx("div", { className: "p-4 border border-gray-200 rounded-lg", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold text-gray-900", children: [homeTeam?.name, " vs ", awayTeam?.name] }), _jsxs("p", { className: "text-sm text-gray-600", children: [formatDate(game.date), " \u2022 ", game.location] })] }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${game.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                                                        game.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                                                            game.status === "completed" ? "bg-green-100 text-green-800" :
                                                                "bg-red-100 text-red-800"}`, children: game.status.replace("_", " ") })] }) }, game.id));
                                }) })] }))] })] }));
};
export default ScheduleBuilder;
