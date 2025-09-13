import React, { useState } from "react";
import { useAgentOrchestration } from "../../contexts/AgentOrchestrationContext";
import { Game, Team, Facility } from "../../types";

interface ScheduleBuilderProps {
  className?: string;
}

const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({ className = "" }) => {
  const { triggerScheduleOptimization } = useAgentOrchestration();
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [leagueId, setLeagueId] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock data
  const [teams] = useState<Team[]>([
    { id: "1", name: "Team Alpha", league: "League 1", leagueId: "1", coachId: "1", players: [], coaches: ["1"], createdAt: new Date(), updatedAt: new Date() },
    { id: "2", name: "Team Beta", league: "League 1", leagueId: "1", coachId: "2", players: [], coaches: ["2"], createdAt: new Date(), updatedAt: new Date() },
    { id: "3", name: "Team Gamma", league: "League 1", leagueId: "1", coachId: "3", players: [], coaches: ["3"], createdAt: new Date(), updatedAt: new Date() }
  ]);

  const [facilities] = useState<Facility[]>([
    {
      id: "1",
      name: "Main Sports Complex",
      address: "123 Sports Ave",
      fields: [
        { id: "1", name: "Field 1", facilityId: "1", type: "soccer", capacity: 100, createdAt: new Date(), updatedAt: new Date() },
        { id: "2", name: "Field 2", facilityId: "1", type: "basketball", capacity: 50, createdAt: new Date(), updatedAt: new Date() }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "2",
      name: "Community Center",
      address: "456 Community St",
      fields: [
        { id: "3", name: "Indoor Court", facilityId: "2", type: "basketball", capacity: 75, createdAt: new Date(), updatedAt: new Date() }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [games, setGames] = useState<Game[]>([]);

  const handleTeamToggle = (teamId: string) => {
    setSelectedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  const handleCreateGame = async () => {
    if (selectedTeams.length < 2 || !selectedFacility || !selectedDate || !selectedTime) {
      alert("Please select at least 2 teams, a facility, date, and time.");
      return;
    }

    setLoading(true);
    try {
      const newGame: Game = {
        id: Date.now().toString(),
        homeTeam: getTeamName(selectedTeams[0]),
        awayTeam: getTeamName(selectedTeams[1]),
        homeTeamId: selectedTeams[0],
        awayTeamId: selectedTeams[1],
        date: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
        location: getFieldName(selectedFacility),
        status: "scheduled",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setGames(prev => [...prev, newGame]);
      
      // Reset form
      setSelectedTeams([]);
      setSelectedFacility("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSchedule = async () => {
    if (selectedTeams.length < 2) {
      alert("Please select at least 2 teams for optimization.");
      return;
    }

    setLoading(true);
    try {
      await triggerScheduleOptimization();
      alert("Schedule optimization completed!");
    } catch (error) {
      alert("Failed to optimize schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getFieldName = (fieldId: string) => {
    const facility = facilities.find(f => f.fields.some(field => field.id === fieldId));
    return facility?.fields.find(f => f.id === fieldId)?.name || "Unknown Field";
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || "Unknown Team";
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Builder</h2>
        <p className="text-gray-600 mt-1">
          Create and manage game schedules for your teams.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Team Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedTeams.includes(team.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleTeamToggle(team.id)}
              >
                <h4 className="font-semibold text-gray-900">{team.name}</h4>
                <p className="text-sm text-gray-600">Coach ID: {team.coachId}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Game Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Facility
            </label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a facility</option>
              {facilities.map((facility) => (
                <optgroup key={facility.id} label={facility.name}>
                  {facility.fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              League ID
            </label>
            <input
              type="text"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter league ID"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleCreateGame}
            disabled={loading || selectedTeams.length < 2 || !selectedFacility || !selectedDate || !selectedTime}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Game"}
          </button>

          <button
            onClick={handleOptimizeSchedule}
            disabled={loading || selectedTeams.length < 2}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Optimizing..." : "Optimize Schedule"}
          </button>
        </div>

        {/* Games List */}
        {games.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Games</h3>
            <div className="space-y-3">
              {games.map((game) => {
                const homeTeam = teams.find(t => t.id === game.homeTeamId);
                const awayTeam = teams.find(t => t.id === game.awayTeamId);
                
                return (
                  <div key={game.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {homeTeam?.name} vs {awayTeam?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(game.date)} • {game.location}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        game.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                        game.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                        game.status === "completed" ? "bg-green-100 text-green-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {game.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleBuilder; 