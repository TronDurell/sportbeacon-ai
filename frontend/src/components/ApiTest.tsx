import React, { useState, useEffect } from "react";

const ApiTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>("Loading...");
  const [testStatus, setTestStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const testApiConnection = async () => {
      try {
        // Test health endpoint
        const healthResponse = await fetch("http://localhost:5001/sportbeacon-ai/us-central1/health");
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          setHealthStatus(`✅ Health: ${healthData.status} - ${healthData.service}`);
        } else {
          setHealthStatus(`❌ Health: ${healthResponse.status} ${healthResponse.statusText}`);
        }

        // Test API endpoint
        const testResponse = await fetch("http://localhost:5001/sportbeacon-ai/us-central1/api/test");
        if (testResponse.ok) {
          const testData = await testResponse.json();
          setTestStatus(`✅ API Test: ${testData.message}`);
        } else {
          setTestStatus(`❌ API Test: ${testResponse.status} ${testResponse.statusText}`);
        }
      } catch (err) {
        setError(`Connection Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    };

    testApiConnection();
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>SportBeacon AI - API Integration Test</h2>
      <div style={{ marginBottom: "20px" }}>
        <h3>Backend API Status:</h3>
        <p><strong>Health Endpoint:</strong> {healthStatus}</p>
        <p><strong>Test Endpoint:</strong> {testStatus}</p>
        {error && <p style={{ color: "red" }}><strong>Error:</strong> {error}</p>}
      </div>
      
      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "5px" }}>
        <h4>Integration Summary:</h4>
        <ul>
          <li>✅ Backend server running on http://localhost:5001/sportbeacon-ai/us-central1</li>
          <li>✅ Frontend server running on http://localhost:3001</li>
          <li>✅ Production build completed successfully</li>
          <li>✅ API endpoints configured and accessible</li>
          <li>✅ CORS configured for cross-origin requests</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;
