import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Star } from "lucide-react";
const Evaluations = () => {
    const evaluations = [
        {
            id: "1",
            title: "Technical Skills Assessment",
            evaluator: "Coach Smith",
            date: new Date("2024-01-20"),
            category: "technical",
            score: 8,
            maxScore: 10,
            comments: "Excellent ball control and passing accuracy. Needs improvement in shooting technique.",
            status: "completed"
        },
        {
            id: "2",
            title: "Tactical Understanding",
            evaluator: "Coach Johnson",
            date: new Date("2024-01-18"),
            category: "tactical",
            score: 7,
            maxScore: 10,
            comments: "Good understanding of team formations. Could improve decision-making under pressure.",
            status: "reviewed"
        },
        {
            id: "3",
            title: "Physical Fitness Test",
            evaluator: "Trainer Wilson",
            date: new Date("2024-01-22"),
            category: "physical",
            score: 9,
            maxScore: 10,
            comments: "Outstanding endurance and speed. Maintains high performance throughout the game.",
            status: "pending"
        }
    ];
    const getCategoryColor = (category) => {
        switch (category) {
            case "technical": return "bg-blue-100 text-blue-800";
            case "tactical": return "bg-green-100 text-green-800";
            case "physical": return "bg-red-100 text-red-800";
            case "mental": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "completed": return "text-green-600";
            case "reviewed": return "text-blue-600";
            case "pending": return "text-yellow-600";
            default: return "text-gray-600";
        }
    };
    const getScoreColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 90)
            return "text-green-600";
        if (percentage >= 80)
            return "text-blue-600";
        if (percentage >= 70)
            return "text-yellow-600";
        return "text-red-600";
    };
    const renderStars = (score, maxScore) => {
        const percentage = (score / maxScore) * 5;
        const fullStars = Math.floor(percentage);
        const hasHalfStar = percentage % 1 >= 0.5;
        return (_jsx("div", { className: "flex items-center space-x-1", children: Array.from({ length: 5 }, (_, i) => (_jsx(Star, { className: `w-4 h-4 ${i < fullStars
                    ? "text-yellow-400 fill-current"
                    : i === fullStars && hasHalfStar
                        ? "text-yellow-400 fill-current opacity-50"
                        : "text-gray-300"}` }, i))) }));
    };
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Evaluations & Assessments" }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("span", { className: "text-sm text-gray-500", children: "Average Score: 8.0/10" }) })] }), _jsx("div", { className: "space-y-6", children: evaluations.map((evaluation) => (_jsxs("div", { className: "bg-white rounded-lg shadow p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: evaluation.title }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(evaluation.category)}`, children: evaluation.category }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(evaluation.status)}`, children: evaluation.status })] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Evaluated by ", evaluation.evaluator, " on ", evaluation.date.toLocaleDateString()] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: `text-2xl font-bold ${getScoreColor(evaluation.score, evaluation.maxScore)}`, children: [evaluation.score, "/", evaluation.maxScore] }), renderStars(evaluation.score, evaluation.maxScore)] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4 mb-4", children: [_jsx("h4", { className: "font-medium text-gray-900 mb-2", children: "Comments" }), _jsx("p", { className: "text-sm text-gray-700", children: evaluation.comments })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("span", { className: "text-sm text-gray-600", children: ["Category: ", evaluation.category] }), _jsxs("span", { className: "text-sm text-gray-600", children: ["Date: ", evaluation.date.toLocaleDateString()] })] }), _jsx("button", { className: "text-blue-600 hover:text-blue-800 text-sm font-medium", children: "View Details" })] })] }, evaluation.id))) })] }));
};
export default Evaluations;
