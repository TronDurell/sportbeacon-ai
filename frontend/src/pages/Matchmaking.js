import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { api } from "../services/api";
const Matchmaking = () => {
    const [requestJson, setRequestJson] = useState(`{
  "players": [
    {
      "id": "player1",
      "name": "John Doe",
      "skill_levels": {
        "points": 0.8,
        "assists": 0.6,
        "rebounds": 0.4,
        "steals": 0.5,
        "blocks": 0.3,
        "field_goal_percentage": 0.7,
        "three_point_percentage": 0.6
      },
      "recent_games": [
        {
          "game_id": "game1",
          "points": 18,
          "assists": 5,
          "rebounds": 3,
          "steals": 2,
          "blocks": 1,
          "field_goal_percentage": 0.65,
          "three_point_percentage": 0.5,
          "game_date": "2024-01-15"
        }
      ]
    },
    {
      "id": "player2",
      "name": "Jane Smith",
      "skill_levels": {
        "points": 0.6,
        "assists": 0.8,
        "rebounds": 0.5,
        "steals": 0.7,
        "blocks": 0.2,
        "field_goal_percentage": 0.6,
        "three_point_percentage": 0.7
      },
      "recent_games": [
        {
          "game_id": "game2",
          "points": 12,
          "assists": 8,
          "rebounds": 4,
          "steals": 3,
          "blocks": 0,
          "field_goal_percentage": 0.55,
          "three_point_percentage": 0.6,
          "game_date": "2024-01-15"
        }
      ]
    },
    {
      "id": "player3",
      "name": "Mike Johnson",
      "skill_levels": {
        "points": 0.7,
        "assists": 0.4,
        "rebounds": 0.8,
        "steals": 0.3,
        "blocks": 0.9,
        "field_goal_percentage": 0.7,
        "three_point_percentage": 0.4
      },
      "recent_games": [
        {
          "game_id": "game3",
          "points": 20,
          "assists": 2,
          "rebounds": 10,
          "steals": 1,
          "blocks": 4,
          "field_goal_percentage": 0.7,
          "three_point_percentage": 0.3,
          "game_date": "2024-01-15"
        }
      ]
    },
    {
      "id": "player4",
      "name": "Sarah Wilson",
      "skill_levels": {
        "points": 0.5,
        "assists": 0.7,
        "rebounds": 0.6,
        "steals": 0.8,
        "blocks": 0.4,
        "field_goal_percentage": 0.5,
        "three_point_percentage": 0.5
      },
      "recent_games": [
        {
          "game_id": "game4",
          "points": 8,
          "assists": 6,
          "rebounds": 5,
          "steals": 4,
          "blocks": 2,
          "field_goal_percentage": 0.5,
          "three_point_percentage": 0.4,
          "game_date": "2024-01-15"
        }
      ]
    },
    {
      "id": "player5",
      "name": "Tom Brown",
      "skill_levels": {
        "points": 0.9,
        "assists": 0.5,
        "rebounds": 0.3,
        "steals": 0.6,
        "blocks": 0.2,
        "field_goal_percentage": 0.8,
        "three_point_percentage": 0.8
      },
      "recent_games": [
        {
          "game_id": "game5",
          "points": 25,
          "assists": 3,
          "rebounds": 2,
          "steals": 3,
          "blocks": 1,
          "field_goal_percentage": 0.8,
          "three_point_percentage": 0.7,
          "game_date": "2024-01-15"
        }
      ]
    },
    {
      "id": "player6",
      "name": "Lisa Davis",
      "skill_levels": {
        "points": 0.4,
        "assists": 0.6,
        "rebounds": 0.9,
        "steals": 0.4,
        "blocks": 0.8,
        "field_goal_percentage": 0.4,
        "three_point_percentage": 0.3
      },
      "recent_games": [
        {
          "game_id": "game6",
          "points": 6,
          "assists": 4,
          "rebounds": 12,
          "steals": 2,
          "blocks": 3,
          "field_goal_percentage": 0.4,
          "three_point_percentage": 0.2,
          "game_date": "2024-01-15"
        }
      ]
    }
  ],
  "team_size": 3,
  "preferred_game_time": "2024-01-20T18:00:00"
}`);
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);
        try {
            const requestData = JSON.parse(requestJson);
            const data = await api.createTeams(requestData);
            setResponse(data);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                setError("Invalid JSON format. Please check your input.");
            }
            else {
                setError(err instanceof Error ? err.message : "Failed to create teams");
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-3xl font-bold mb-6", children: "Team Matchmaking" }), _jsxs("form", { onSubmit: handleSubmit, className: "mb-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-gray-700 text-sm font-bold mb-2", htmlFor: "request-json", children: "Player Data JSON" }), _jsx("textarea", { id: "request-json", value: requestJson, onChange: (e) => setRequestJson(e.target.value), className: "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm", rows: 20, placeholder: "Enter player data and matchmaking request JSON..." })] }), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50", children: loading ? "Creating Teams..." : "Create Balanced Teams" })] }), error && (_jsxs("div", { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4", children: [_jsx("strong", { children: "Error:" }), " ", error] })), response && (_jsxs("div", { className: "bg-gray-100 p-4 rounded", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Matchmaking Results" }), _jsx("div", { className: "mb-4", children: _jsxs("p", { className: "text-sm text-gray-600", children: [_jsx("strong", { children: "Suggested Game Time:" }), " ", response.suggested_game_time] }) }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("h3", { className: "text-lg font-semibold mb-3 text-blue-600", children: "Team A" }), _jsx("div", { className: "space-y-2", children: response.team_a.map((player) => (_jsxs("div", { className: "border-l-4 border-blue-500 pl-3", children: [_jsx("div", { className: "font-medium", children: player.name }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Position: ", player.position] }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Overall Rating: ", player.overall_rating?.toFixed(2)] })] }, player.id))) })] }), _jsxs("div", { className: "bg-white p-4 rounded shadow", children: [_jsx("h3", { className: "text-lg font-semibold mb-3 text-red-600", children: "Team B" }), _jsx("div", { className: "space-y-2", children: response.team_b.map((player) => (_jsxs("div", { className: "border-l-4 border-red-500 pl-3", children: [_jsx("div", { className: "font-medium", children: player.name }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Position: ", player.position] }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Overall Rating: ", player.overall_rating?.toFixed(2)] })] }, player.id))) })] })] }), _jsxs("div", { className: "mt-6 bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-3", children: "Team Balance Analysis" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("strong", { children: "Team A Average Rating:" }), _jsx("span", { className: "ml-2", children: (response.team_a.reduce((sum, p) => sum + (p.overall_rating || 0), 0) / response.team_a.length).toFixed(2) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Team B Average Rating:" }), _jsx("span", { className: "ml-2", children: (response.team_b.reduce((sum, p) => sum + (p.overall_rating || 0), 0) / response.team_b.length).toFixed(2) })] }), _jsxs("div", { children: [_jsx("strong", { children: "Balance Score:" }), _jsx("span", { className: "ml-2", children: response.balance_score?.toFixed(2) || "N/A" })] })] })] }), _jsxs("div", { className: "mt-4 bg-white p-4 rounded", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Raw Response:" }), _jsx("pre", { className: "text-sm overflow-auto", children: JSON.stringify(response, null, 2) })] })] }))] }));
};
export default Matchmaking;
