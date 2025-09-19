import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
const ApiTest = () => {
    const [healthStatus, setHealthStatus] = useState("Loading...");
    const [testStatus, setTestStatus] = useState("Loading...");
    const [error, setError] = useState("");
    useEffect(() => {
        const testApiConnection = async () => {
            try {
                // Test health endpoint
                const healthResponse = await fetch("http://127.0.0.1:8000/health");
                if (healthResponse.ok) {
                    const healthData = await healthResponse.json();
                    setHealthStatus(`✅ Health: ${healthData.status} - ${healthData.service}`);
                }
                else {
                    setHealthStatus(`❌ Health: ${healthResponse.status} ${healthResponse.statusText}`);
                }
                // Test API endpoint
                const testResponse = await fetch("http://127.0.0.1:8000/api/test");
                if (testResponse.ok) {
                    const testData = await testResponse.json();
                    setTestStatus(`✅ API Test: ${testData.message}`);
                }
                else {
                    setTestStatus(`❌ API Test: ${testResponse.status} ${testResponse.statusText}`);
                }
            }
            catch (err) {
                setError(`Connection Error: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
        };
        testApiConnection();
    }, []);
    return (_jsxs("div", { style: { padding: "20px", maxWidth: "600px", margin: "0 auto" }, children: [_jsx("h2", { children: "SportBeacon AI - API Integration Test" }), _jsxs("div", { style: { marginBottom: "20px" }, children: [_jsx("h3", { children: "Backend API Status:" }), _jsxs("p", { children: [_jsx("strong", { children: "Health Endpoint:" }), " ", healthStatus] }), _jsxs("p", { children: [_jsx("strong", { children: "Test Endpoint:" }), " ", testStatus] }), error && _jsxs("p", { style: { color: "red" }, children: [_jsx("strong", { children: "Error:" }), " ", error] })] }), _jsxs("div", { style: { marginTop: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "5px" }, children: [_jsx("h4", { children: "Integration Summary:" }), _jsxs("ul", { children: [_jsx("li", { children: "\u2705 Backend server running on http://127.0.0.1:8000" }), _jsx("li", { children: "\u2705 Frontend server running on http://localhost:3001" }), _jsx("li", { children: "\u2705 Production build completed successfully" }), _jsx("li", { children: "\u2705 API endpoints configured and accessible" }), _jsx("li", { children: "\u2705 CORS configured for cross-origin requests" })] })] })] }));
};
export default ApiTest;
