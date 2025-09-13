import React from "react";
import { Users, Plus, Calendar } from "lucide-react";

interface Team {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  coach: string;
  playerCount: number;
  maxPlayers: number;
  status: "active" | "inactive" | "full";
  nextGame?: Date;
}

const Teams: React.FC = () => {
  const teams: Team[] = [
    {
      id: "1",
      name: "Thunder Hawks",
      sport: "Soccer",
      ageGroup: "U14",
      coach: "Coach Smith",
      playerCount: 12,
      maxPlayers: 15,
      status: "active",
      nextGame: new Date("2024-01-27T14:00:00")
    },
    {
      id: "2",
      name: "Lightning Bolts",
      sport: "Basketball",
      ageGroup: "U16",
      coach: "Coach Johnson",
      playerCount: 10,
      maxPlayers: 12,
      status: "active",
      nextGame: new Date("2024-01-28T16:00:00")
    },
    {
      id: "3",
      name: "Storm Riders",
      sport: "Soccer",
      ageGroup: "U12",
      coach: "Coach Wilson",
      playerCount: 15,
      maxPlayers: 15,
      status: "full"
    }
  ];

  const getStatusColor = (status: Team["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "full": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlayerCountColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(team.status)}`}>
                {team.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Sport:</span>
                <span className="ml-2">{team.sport}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Age Group:</span>
                <span className="ml-2">{team.ageGroup}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">Coach:</span>
                <span className="ml-2">{team.coach}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span className="font-medium">Players:</span>
                <span className={`ml-2 ${getPlayerCountColor(team.playerCount, team.maxPlayers)}`}>
                  {team.playerCount}/{team.maxPlayers}
                </span>
              </div>

              {team.nextGame && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">Next Game:</span>
                  <span className="ml-2">{team.nextGame.toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </button>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Manage Team
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teams; 