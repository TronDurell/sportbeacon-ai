import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
const Insights = () => {
    const [formData, setFormData] = useState({
        user_id: "",
        question: "",
        include_stats: true,
    });
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);
        try {
            const data = await api.analyzePlayer(formData);
            setResponse(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to analyze player");
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? e.target.checked : value,
        }));
    };
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Player Insights" }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4", children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-gray-700 text-sm font-bold mb-2", htmlFor: "user_id", children: "User ID" }), _jsx("input", { className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", id: "user_id", name: "user_id", type: "text", value: formData.user_id, onChange: handleInputChange, placeholder: "Enter user ID", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-gray-700 text-sm font-bold mb-2", htmlFor: "question", children: "Question" }), _jsx("textarea", { className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", id: "question", name: "question", value: formData.question, onChange: handleInputChange, placeholder: "Ask a question about player performance...", rows: 4, required: true })] }), _jsx("div", { className: "mb-6", children: _jsxs("label", { className: "flex items-center", children: [_jsx("input", { type: "checkbox", name: "include_stats", checked: formData.include_stats, onChange: handleInputChange, className: "mr-2" }), _jsx("span", { className: "text-sm text-gray-700", children: "Include statistics in analysis" })] }) }), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50", children: loading ? "Analyzing..." : "Analyze Player" })] }), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: [_jsx("strong", { children: "Error:" }), " ", error] })), response && (_jsxs("div", { className: "bg-gray-100 p-4 rounded", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Analysis Results" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { className: "bg-white p-4 rounded", children: [_jsxs("h3", { className: "font-semibold mb-2", children: ["Player: ", response.player_name] }), _jsxs("div", { className: "text-sm text-gray-600", children: [_jsxs("p", { children: [_jsx("strong", { children: "Top Skills:" }), " ", response.top_skills.join(", ")] }), _jsxs("p", { children: [_jsx("strong", { children: "Growth Areas:" }), " ", response.growth_areas.join(", ")] })] })] }), _jsxs("div", { className: "bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Recent Trends" }), _jsx("div", { className: "text-sm", children: Object.entries(response.recent_trends).map(([key, value]) => (_jsxs("p", { children: [_jsxs("strong", { children: [key, ":"] }), " ", value.toFixed(2)] }, key))) })] })] }), _jsxs("div", { className: "bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Normalized Stats" }), _jsx("pre", { className: "text-sm overflow-auto", children: JSON.stringify(response.normalized_stats, null, 2) })] })] }))] }));
};
export default Insights;
