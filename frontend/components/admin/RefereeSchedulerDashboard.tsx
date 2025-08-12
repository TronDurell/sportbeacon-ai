import React, { useState, useEffect } from 'react';
// import { useRefereeScheduler } from '../../hooks/useRefereeScheduler';
import { Referee, GameSchedule, RefereeAssignment } from '../../types/admin';

interface RefereeSchedulerDashboardProps {
  leagueId?: string;
}

export const RefereeSchedulerDashboard: React.FC<RefereeSchedulerDashboardProps> = ({ 
  leagueId 
}) => {
  // Stub implementation for missing useRefereeScheduler hook
  const referees: Referee[] = [];
  const games: GameSchedule[] = [];
  const assignments: RefereeAssignment[] = [];
  const loading = false;
  const error = null;
  const assignReferee = async (gameId: string, refereeId: string, role: string) => ({ success: true } as any);
  const unassignReferee = async (assignmentId: string) => ({ success: true } as any);
  const getReferees = (leagueId?: string) => {};
  const getGames = (leagueId?: string) => {};
  const getAssignments = (leagueId?: string) => {};
  const autoAssignReferees = async (leagueId?: string, week?: Date) => {};

  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameSchedule | null>(null);
  const [filterSkill, setFilterSkill] = useState<string>('all');

  useEffect(() => {
    if (selectedLeague) {
      getReferees(selectedLeague);
      getGames(selectedLeague);
      getAssignments(selectedLeague);
    }
  }, [selectedLeague]);

  const handleAssignReferee = async (gameId: string, refereeId: string, role: string) => {
    try {
      await assignReferee(gameId, refereeId, role);
      getAssignments(selectedLeague);
    } catch (error) {
      console.error('Failed to assign referee:', error);
    }
  };

  const handleUnassignReferee = async (assignmentId: string) => {
    try {
      await unassignReferee(assignmentId);
      getAssignments(selectedLeague);
    } catch (error) {
      console.error('Failed to unassign referee:', error);
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignReferees(selectedLeague, selectedWeek);
      getAssignments(selectedLeague);
    } catch (error) {
      console.error('Failed to auto-assign referees:', error);
    }
  };

  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const getGamesForDate = (date: Date) => {
    return games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate.toDateString() === date.toDateString();
    });
  };

  const getAssignmentForGame = (gameId: string) => {
    return assignments.find(assignment => assignment.gameId === gameId);
  };

  const getRefereeById = (refereeId: string) => {
    return referees.find(referee => referee.id === refereeId);
  };

  const getAvailableReferees = (gameDate: Date, gameTime: string) => {
    // Stub implementation - return all referees
    return referees;
  };

  const getSkillColor = (skill: string) => {
    switch (skill.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-blue-100 text-blue-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h3 className="text-sm font-medium text-red-800">Error loading referee data</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(selectedWeek);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referee Scheduler</h1>
          <p className="text-gray-600">Manage referee assignments and scheduling</p>
        </div>
        <button
          onClick={handleAutoAssign}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Auto-Assign Referees
        </button>
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
          <option value="league-1">Spring Soccer League</option>
          <option value="league-2">Summer Baseball League</option>
          <option value="league-3">Fall Football League</option>
        </select>
      </div>

      {selectedLeague && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Referees</p>
                  <p className="text-2xl font-semibold text-gray-900">{referees.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Assigned Games</p>
                  <p className="text-2xl font-semibold text-gray-900">{assignments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unassigned Games</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {games.filter(game => !assignments.find(a => a.gameId === game.id)).length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">This Week</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {games.filter(game => {
                      const gameDate = new Date(game.date);
                      const weekStart = new Date(selectedWeek);
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      return gameDate >= weekStart && gameDate <= weekEnd;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const prevWeek = new Date(selectedWeek);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setSelectedWeek(prevWeek);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-medium text-gray-900">
                Week of {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  const nextWeek = new Date(selectedWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setSelectedWeek(nextWeek);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="grid grid-cols-8 gap-px bg-gray-200">
              {/* Header */}
              <div className="bg-gray-50 p-4"></div>
              {weekDates.map((date, index) => (
                <div key={index} className="bg-gray-50 p-4">
                  <div className="text-sm font-medium text-gray-900">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'].map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-8 gap-px bg-gray-200">
                <div className="bg-gray-50 p-4 flex items-center">
                  <span className="text-sm font-medium text-gray-900">{timeSlot}</span>
                </div>
                {weekDates.map((date, dateIndex) => {
                  const gamesForSlot = getGamesForDate(date).filter(game => game.time === timeSlot);
                  return (
                    <div key={dateIndex} className="bg-white p-2 min-h-[120px]">
                      {gamesForSlot.map((game) => {
                        const assignment = getAssignmentForGame(game.id);
                        return (
                          <div key={game.id} className="mb-2 p-2 border rounded-lg bg-blue-50">
                            <div className="text-xs font-medium text-gray-900">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="text-xs text-gray-500">
                              {game.location}
                            </div>
                            {assignment ? (
                              <div className="mt-1">
                                <div className="text-xs text-green-600">
                                  ✓ {getRefereeById(assignment.refereeId)?.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignment.role}
                                </div>
                                <button
                                  onClick={() => handleUnassignReferee(assignment.id)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Unassign
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedGame(game);
                                  setShowAssignmentModal(true);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Assign Referee
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Referee List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Available Referees</h3>
                <select
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Skills</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skill Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Games
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referees
                    .map((referee) => (
                    <tr key={referee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {referee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {referee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillColor(referee.rating.toString())}`}>
                          Rating: {referee.rating}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {/* Stub: Availability data would be displayed here */}
                          <div className="text-xs">Available for scheduling</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignments.filter(a => a.refereeId === referee.id).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedGame && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Assign Referee</h3>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedGame(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Game</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGame.homeTeam} vs {selectedGame.awayTeam}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedGame.date).toLocaleDateString()} at {selectedGame.time}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Referees</label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {getAvailableReferees(new Date(selectedGame.date), selectedGame.time).map((referee) => (
                      <div key={referee.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{referee.name}</div>
                          <div className="text-xs text-gray-500">Rating: {referee.rating}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAssignReferee(selectedGame.id, referee.id, 'Center')}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Center
                          </button>
                          <button
                            onClick={() => handleAssignReferee(selectedGame.id, referee.id, 'Assistant')}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Assistant
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 