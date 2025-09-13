import React, { useState } from "react";
import { api, DrillRecommendationRequest, DrillRecommendationResponse } from "../services/api";
import { useMemory } from "../hooks/useMemory";

const Drills: React.FC = () => {
  const { captureFeedback, captureEvent } = useMemory({ enabled: true, autoCapture: false });
  const [requestJson, setRequestJson] = useState<string>(`{
  "user_id": "test_user",
  "top_skills": ["scoring", "playmaking"],
  "growth_areas": ["defense", "rebounding"],
  "skill_levels": {
    "points": 0.7,
    "assists": 0.6,
    "rebounds": 0.4,
    "steals": 0.3,
    "blocks": 0.5,
    "field_goal_percentage": 0.6,
    "three_point_percentage": 0.5
  },
  "min_difficulty": 1,
  "max_difficulty": 3,
  "max_recommendations": 5
}`);

  const [response, setResponse] = useState<DrillRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestData: DrillRecommendationRequest = JSON.parse(requestJson);
      const data = await api.getDrillRecommendations(requestData);
      setResponse(data);
      
      // Capture successful drill recommendation
      captureEvent('result', {
        type: 'drill_recommendation',
        userId: requestData.user_id,
        recommendationsCount: data.recommendations?.length || 0,
        skills: requestData.top_skills
      }, ['drills', 'success'], 'drill-recommendation');
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid JSON format. Please check your input.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to get drill recommendations");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Drill Recommendations</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="request-json">
            Request JSON
          </label>
          <textarea
            id="request-json"
            value={requestJson}
            onChange={(e) => setRequestJson(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
            rows={15}
            placeholder="Enter drill recommendation request JSON..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? "Getting Recommendations..." : "Get Drill Recommendations"}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Recommended Drills</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Player ID:</strong> {response.player_id}
            </p>
          </div>

          <div className="grid gap-4">
            {response.recommended_drills.map((drill, index) => (
              <div key={drill.id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{drill.name}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Difficulty: {drill.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{drill.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Duration:</strong> {drill.duration} minutes
                  </div>
                  <div>
                    <strong>Target Skills:</strong> {drill.target_skills.join(", ")}
                  </div>
                  <div>
                    <strong>Equipment Needed:</strong> {drill.equipment_needed.join(", ")}
                  </div>
                </div>

                {response.training_notes[index] && (
                  <div className="mt-3 p-3 bg-blue-50 rounded">
                    <strong>Training Note:</strong> {response.training_notes[index]}
                  </div>
                )}

                {/* Feedback buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => captureFeedback(`Helpful drill: ${drill.name}`, ['drills', 'helpful'], 'drill-feedback')}
                    className="bg-green-100 hover:bg-green-200 text-green-800 text-xs px-3 py-1 rounded"
                  >
                    👍 Helpful
                  </button>
                  <button
                    onClick={() => captureFeedback(`Not helpful drill: ${drill.name}`, ['drills', 'not-helpful'], 'drill-feedback')}
                    className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded"
                  >
                    👎 Not Helpful
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-white p-4 rounded">
            <h3 className="font-semibold mb-2">Raw Response:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drills;
