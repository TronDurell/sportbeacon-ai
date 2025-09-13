import React, { useState } from "react";
import { api, PlayerAnalysisRequest, PlayerAnalysisResponse } from "../services/api";

const Insights: React.FC = () => {
  const [formData, setFormData] = useState<PlayerAnalysisRequest>({
    user_id: "",
    question: "",
    include_stats: true,
  });
  const [response, setResponse] = useState<PlayerAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await api.analyzePlayer(formData);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze player");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Player Insights</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="user_id">
            User ID
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="user_id"
            name="user_id"
            type="text"
            value={formData.user_id}
            onChange={handleInputChange}
            placeholder="Enter user ID"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="question">
            Question
          </label>
          <textarea
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="question"
            name="question"
            value={formData.question}
            onChange={handleInputChange}
            placeholder="Ask a question about player performance..."
            rows={4}
            required
          />
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="include_stats"
              checked={formData.include_stats}
              onChange={handleInputChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Include statistics in analysis</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Player"}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded">
              <h3 className="font-semibold mb-2">Player: {response.player_name}</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Top Skills:</strong> {response.top_skills.join(", ")}</p>
                <p><strong>Growth Areas:</strong> {response.growth_areas.join(", ")}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded">
              <h3 className="font-semibold mb-2">Recent Trends</h3>
              <div className="text-sm">
                {Object.entries(response.recent_trends).map(([key, value]) => (
                  <p key={key}><strong>{key}:</strong> {value.toFixed(2)}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded">
            <h3 className="font-semibold mb-2">Normalized Stats</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(response.normalized_stats, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
