import React, { useState } from "react";
import { api, TopWinnersRequest, TopWinnersResponse } from "../services/api";

const Winners: React.FC = () => {
  const [timePeriodDays, setTimePeriodDays] = useState<number>(30);
  const [limit, setLimit] = useState<number>(10);
  const [response, setResponse] = useState<TopWinnersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const requestData: TopWinnersRequest = {
        time_period_days: timePeriodDays,
        limit: limit
      };
      const data = await api.getTopWinners(requestData);
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get top winners");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Top Winners</h1>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="time-period">
              Time Period (Days)
            </label>
            <input
              id="time-period"
              type="number"
              min="1"
              max="365"
              value={timePeriodDays}
              onChange={(e) => setTimePeriodDays(parseInt(e.target.value) || 30)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="limit">
              Number of Winners
            </label>
            <input
              id="limit"
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {loading ? "Loading Winners..." : "Get Top Winners"}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Top Winners</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Time Period:</strong> {timePeriodDays} days | <strong>Total Found:</strong> {response.total_found}
            </p>
          </div>

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Skills
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {response.winners.map((winner, index) => (
                  <tr key={winner.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{winner.name}</div>
                      <div className="text-sm text-gray-500">ID: {winner.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {winner.games_played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(winner.win_rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {winner.avg_points?.toFixed(1) || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {winner.top_skills?.slice(0, 3).map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Player Insights */}
          {response.winners.length > 0 && (
            <div className="mt-6 bg-white p-4 rounded">
              <h3 className="font-semibold mb-3">Player Insights</h3>
              <div className="grid gap-4">
                {response.winners.slice(0, 3).map((winner) => (
                  <div key={winner.id} className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-900">{winner.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {winner.insights?.map((insight, insightIndex) => (
                        <div key={insightIndex} className="mb-1">
                          • {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Response */}
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

export default Winners;
