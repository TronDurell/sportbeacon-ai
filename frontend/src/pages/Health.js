import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { api } from "../services/api";
const Health = () => {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const checkHealth = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api.getHealth();
                setHealthData(data);
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch health data");
            }
            finally {
                setLoading(false);
            }
        };
        checkHealth();
    }, []);
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "API Health Check" }), loading && (_jsx("div", { className: "bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded", children: "Checking API health..." })), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: [_jsx("strong", { children: "Error:" }), " ", error] })), healthData && (_jsxs("div", { className: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4", children: [_jsx("strong", { children: "Status:" }), " ", healthData.status] })), healthData && (_jsxs("div", { className: "bg-gray-100 p-4 rounded", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Health Response:" }), _jsx("pre", { className: "bg-white p-4 rounded border overflow-auto", children: JSON.stringify(healthData, null, 2) })] }))] }));
};
export default Health;
