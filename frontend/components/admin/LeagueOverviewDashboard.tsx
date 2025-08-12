import React, { useState, useEffect } from 'react';
// import { useLeagueDashboard } from '../../hooks/useLeagueDashboard';
import { League, Team, Player, Referee, GameSchedule } from '../../types/admin';

interface LeagueOverviewDashboardProps {
  leagueId?: string;
}

export const LeagueOverviewDashboard: React.FC<LeagueOverviewDashboardProps> = ({ 
  leagueId 
}) => {
  // Stub implementation for missing useLeagueDashboard hook
  const leagues: League[] = [];
  const teams: Team[] = [];
  const players: Player[] = [];
  const coaches: Referee[] = [];
  const games: GameSchedule[] = [];
  const loading = false;
  const error = null;
  const getLeagues = () => {};
  const getTeams = (leagueId: string) => {};
  const getPlayers = (leagueId: string) => {};
  const getCoaches = (leagueId: string) => {};
  const getGames = (leagueId: string) => {};

  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'schedule' | 'stats'>('overview');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    getLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      getTeams(selectedLeague);
      getPlayers(selectedLeague);
      getCoaches(selectedLeague);
      getGames(selectedLeague);
    }
  }, [selectedLeague]);

  const currentLeague = leagues.find(league => league.id === selectedLeague);
  const currentTeams = teams.filter(team => team.leagueId === selectedLeague);
  const currentPlayers = players.filter(player => {
    const playerTeam = currentTeams.find(team => team.id === player.teamId);
    return playerTeam && playerTeam.leagueId === selectedLeague;
  });
  const currentCoaches = coaches; // Referees don't have leagueId, so show all
  const currentGames = games; // GameSchedule doesn't have leagueId, so show all

  const getTeamById = (teamId: string) => {
    return currentTeams.find(team => team.id === teamId);
  };

  const getPlayersForTeam = (teamId: string) => {
    return currentPlayers.filter(player => player.teamId === teamId);
  };

  const getCoachForTeam = (teamId: string) => {
    // Referees don't have teamId, so return null for now
    return null;
  };

  const getGamesForTeam = (teamId: string) => {
    return currentGames.filter(game => 
      game.homeTeam === teamId || game.awayTeam === teamId
    );
  };

  const getTeamStats = (teamId: string) => {
    const teamGames = getGamesForTeam(teamId);
    // Since GameSchedule doesn't have scores, return placeholder stats
    return { wins: 0, losses: 0, ties: 0, totalGames: teamGames.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading league data</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">League Overview Dashboard</h1>
          <p className="text-gray-600">Comprehensive view of league operations and statistics</p>
        </div>
      </div>

      {/* League Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label htmlFor="league-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select League
        </label>
        <select
          id="league-select"
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a league...</option>
          {leagues.map((league) => (
            <option key={league.id} value={league.id}>
              {league.name}
            </option>
          ))}
        </select>
      </div>

      {selectedLeague && currentLeague && (
        <>
          {/* League Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{currentLeague.name}</h2>
                <p className="text-gray-600">{currentLeague.description}</p>
                <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                  <span>Season: {currentLeague.season}</span>
                  <span>Status: {currentLeague.status}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{currentTeams.length}</div>
                <div className="text-sm text-gray-500">Teams</div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Players</p>
                  <p className="text-2xl font-semibold text-gray-900">{currentPlayers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Coaches</p>
                  <p className="text-2xl font-semibold text-gray-900">{currentCoaches.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Games Scheduled</p>
                  <p className="text-2xl font-semibold text-gray-900">{currentGames.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Team Size</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {currentTeams.length > 0 ? Math.round(currentPlayers.length / currentTeams.length) : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'teams'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Teams & Rosters
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'schedule'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Statistics
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Games */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Games</h3>
                      <div className="space-y-3">
                        {currentGames
                          .filter(game => new Date(game.date) < new Date())
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .slice(0, 5)
                          .map((game) => (
                          <div key={game.id} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div>
                              <div className="font-medium text-gray-900">
                                {game.homeTeam} vs {game.awayTeam}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(game.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                TBD
                              </div>
                              <div className="text-sm text-gray-500">{game.location}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Games */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Games</h3>
                      <div className="space-y-3">
                        {currentGames
                          .filter(game => new Date(game.date) >= new Date())
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 5)
                          .map((game) => (
                          <div key={game.id} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div>
                              <div className="font-medium text-gray-900">
                                {game.homeTeam} vs {game.awayTeam}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(game.date).toLocaleDateString()} at {game.time}
                              </div>
                            </div>
                                                          <div className="text-right">
                                <div className="text-sm text-gray-500">{game.location}</div>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* League Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">League Status</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm font-medium text-gray-500">Registration Status</div>
                        <div className="text-2xl font-bold text-green-600">Open</div>
                        <div className="text-sm text-gray-500">{currentPlayers.length} players registered</div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm font-medium text-gray-500">Season Progress</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((currentGames.filter(g => new Date(g.date) < new Date()).length / currentGames.length) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Complete</div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm font-medium text-gray-500">Next Game</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {currentGames
                            .filter(game => new Date(game.date) >= new Date())
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date 
                            ? new Date(currentGames
                                .filter(game => new Date(game.date) >= new Date())
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
                              ).toLocaleDateString()
                            : 'TBD'
                          }
                        </div>
                        <div className="text-sm text-gray-500">Scheduled</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {currentTeams.map((team) => {
                      const teamPlayers = getPlayersForTeam(team.id);
                      const teamCoach = getCoachForTeam(team.id);
                      const teamStats = getTeamStats(team.id);
                      
                      return (
                        <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                              <p className="text-sm text-gray-500">Team</p>
                            </div>
                            <button
                              onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {selectedTeam === team.id ? 'Hide Roster' : 'View Roster'}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Coach</div>
                              <div className="text-sm text-gray-900">Unassigned</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Players</div>
                              <div className="text-sm text-gray-900">{teamPlayers.length}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Record</div>
                              <div className="text-sm text-gray-900">
                                {teamStats.wins}-{teamStats.losses}-{teamStats.ties}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Games Played</div>
                              <div className="text-sm text-gray-900">{teamStats.totalGames}</div>
                            </div>
                          </div>
                          
                          {selectedTeam === team.id && (
                            <div className="bg-white rounded border p-4">
                              <h4 className="font-medium text-gray-900 mb-3">Roster</h4>
                              <div className="space-y-2">
                                {teamPlayers.map((player) => (
                                  <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                                      <div className="text-xs text-gray-500">
                                        Age: {player.age} • Position: {player.position}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedPlayer(player);
                                        setShowPlayerModal(true);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      Details
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Home Team
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Away Team
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Venue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentGames
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((game) => (
                          <tr key={game.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(game.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {game.time}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {game.homeTeam}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {game.awayTeam}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {game.location}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              TBD
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Team Standings */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Team Standings</h3>
                      <div className="space-y-2">
                        {currentTeams
                          .map(team => ({ ...team, stats: getTeamStats(team.id) }))
                          .sort((a, b) => (b.stats.wins - a.stats.wins) || (a.stats.losses - b.stats.losses))
                          .map((team, index) => (
                          <div key={team.id} className="flex justify-between items-center p-3 bg-white rounded border">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{team.name}</div>
                                <div className="text-sm text-gray-500">Team</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {team.stats.wins}-{team.stats.losses}-{team.stats.ties}
                              </div>
                              <div className="text-sm text-gray-500">
                                {team.stats.totalGames} games
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Player Statistics */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Player Statistics</h3>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded border">
                          <div className="text-sm font-medium text-gray-500">Total Players</div>
                          <div className="text-2xl font-bold text-blue-600">{currentPlayers.length}</div>
                        </div>
                        <div className="bg-white p-4 rounded border">
                          <div className="text-sm font-medium text-gray-500">Average Age</div>
                          <div className="text-2xl font-bold text-green-600">
                            {currentPlayers.length > 0 
                              ? Math.round(currentPlayers.reduce((sum, p) => sum + p.age, 0) / currentPlayers.length)
                              : 0
                            }
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded border">
                          <div className="text-sm font-medium text-gray-500">Experience Levels</div>
                          <div className="mt-2 space-y-1">
                            {['Beginner', 'Intermediate', 'Advanced'].map(level => {
                              const count = currentPlayers.filter(p => p.position === level).length;
                              return (
                                <div key={level} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{level}</span>
                                  <span className="font-medium text-gray-900">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Player Details Modal */}
      {showPlayerModal && selectedPlayer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Player Details</h3>
                <button
                  onClick={() => {
                    setShowPlayerModal(false);
                    setSelectedPlayer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlayer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlayer.age}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grade</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPlayer.position}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                                                <p className="mt-1 text-sm text-gray-900">{selectedPlayer.position}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getTeamById(selectedPlayer.teamId)?.name || 'Unassigned'}
                  </p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 