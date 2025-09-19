import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Clock, Users } from "lucide-react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
const Drills = () => {
    const { sendRequest } = useAgentOrchestration();
    const drills = [
        {
            id: "1",
            name: "Triangle Passing",
            category: "passing",
            duration: 15,
            difficulty: "intermediate",
            participants: 6,
            description: "Improve passing accuracy and team coordination",
            completed: false
        },
        {
            id: "2",
            name: "Shooting Practice",
            category: "shooting",
            duration: 20,
            difficulty: "beginner",
            participants: 4,
            description: "Focus on shooting technique and accuracy",
            completed: true
        },
        {
            id: "3",
            name: "Defensive Positioning",
            category: "defense",
            duration: 25,
            difficulty: "advanced",
            participants: 8,
            description: "Work on defensive formations and positioning",
            completed: false
        }
    ];
    const getCategoryColor = (category) => {
        switch (category) {
            case "passing": return "bg-blue-100 text-blue-800";
            case "shooting": return "bg-red-100 text-red-800";
            case "defense": return "bg-green-100 text-green-800";
            case "fitness": return "bg-yellow-100 text-yellow-800";
            case "tactics": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "beginner": return "bg-green-100 text-green-800";
            case "intermediate": return "bg-yellow-100 text-yellow-800";
            case "advanced": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const startDrill = async (drillId) => {
        await sendRequest({
            type: "start_drill",
            drillId,
            timestamp: new Date()
        });
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Training Drills" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsxs("span", { className: "text-sm text-gray-500", children: [drills.filter(d => d.completed).length, "/", drills.length, " completed"] }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: drills.map((drill) => (_jsxs("div", { className: `bg-white rounded-lg shadow p-6 border-2 ${drill.completed ? "border-green-200" : "border-gray-200"}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(drill.category)}`, children: drill.category }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(drill.difficulty)}`, children: drill.difficulty })] }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: drill.name }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: drill.description }), _jsxs("div", { className: "space-y-2 mb-4", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), drill.duration, " minutes"] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), drill.participants, " participants"] })] }), drill.completed ? (_jsx("div", { className: "text-center", children: _jsx("span", { className: "text-green-600 font-medium", children: "\u2713 Completed" }) })) : (_jsx("button", { onClick: () => startDrill(drill.id), className: "w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Start Drill" }))] }, drill.id))) })] }));
};
export default Drills;
