import React, { useState } from 'react';
// import { useWaitlistManager } from '../../hooks/useTownRec';

const WaitlistManager: React.FC = () => {
  // Stub implementation for missing useWaitlistManager hook
  const waitlistEntries: any[] = [];
  const loading = false;
  const error = null;
  const assignPlayerToTeam = async (playerId: string, teamId: string) => ({ success: true } as any);
  const runAutoFill = async (leagueId: string) => ({ result: 'mock' } as any);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const filteredWaitlist = waitlistEntries.filter(entry => 
    !selectedLeague || entry.leagueId === selectedLeague
  );

  const handleAutoFill = async () => {
    if (!selectedLeague) {
      alert('Please select a league first');
      return;
    }

    setProcessing(true);
    try {
      const result = await runAutoFill(selectedLeague);
      setAutoFillResult(result);
      setShowAutoFillModal(true);
    } catch (err) {
      console.error('Error running auto-fill:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignPlayer = async (playerId: string, teamId: string) => {
    try {
      const result = await assignPlayerToTeam(playerId, teamId);
      if (result.success) {
        console.log('Player assigned successfully');
      } else {
        console.error('Failed to assign player:', result.error);
      }
    } catch (err) {
      console.error('Error assigning player:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      waiting: { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting' },
      invited: { color: 'bg-blue-100 text-blue-800', label: 'Invited' },
      accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
      declined: { color: 'bg-red-100 text-red-800', label: 'Declined' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.waiting;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
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
            <h3 className="text-sm font-medium text-red-800">Error loading waitlist</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist Manager</h1>
          <p className="text-gray-600 mt-1">
            Manage waitlists and assign players to teams
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleAutoFill}
            disabled={processing || !selectedLeague}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running Auto-Fill...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Auto-Fill
              </>
            )}
          </button>
        </div>
      </div>

      {/* League Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">League Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select League
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Leagues</option>
              <option value="league1">Spring Soccer U10</option>
              <option value="league2">Fall Basketball U12</option>
              <option value="league3">Summer Baseball U8</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              {filteredWaitlist.length} player{filteredWaitlist.length !== 1 ? 's' : ''} on waitlist
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Waiting</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredWaitlist.filter(w => w.status === 'waiting').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Invited</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredWaitlist.filter(w => w.status === 'invited').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Accepted</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredWaitlist.filter(w => w.status === 'accepted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Declined</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredWaitlist.filter(w => w.status === 'declined').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Waitlist Entries</h3>
        </div>
        
        {filteredWaitlist.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No waitlist entries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedLeague ? 'No players are currently on the waitlist for this league.' : 'Select a league to view waitlist entries.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    League
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferences
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWaitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              Player {entry.playerId.slice(-2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Player {entry.playerId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Guardian {entry.guardianId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Spring Soccer U10</div>
                      <div className="text-sm text-gray-500">Recreational</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{entry.priority}</span>
                        {entry.priority === 1 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.preferences.preferredTimeSlots.length > 0 && (
                          <div className="mb-1">
                            <span className="text-xs text-gray-500">Times: </span>
                            {entry.preferences.preferredTimeSlots.slice(0, 2).join(', ')}
                            {entry.preferences.preferredTimeSlots.length > 2 && '...'}
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-gray-500">Max Distance: </span>
                          {entry.preferences.maxTravelDistance} miles
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {entry.status === 'waiting' && (
                          <>
                            <select
                              onChange={(e) => handleAssignPlayer(entry.playerId, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Assign to...</option>
                              <option value="team1">Tigers</option>
                              <option value="team2">Lions</option>
                              <option value="team3">Bears</option>
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Fill Results Modal */}
      {showAutoFillModal && autoFillResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    autoFillResult.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {autoFillResult.success ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Auto-Fill Results
                    </h3>
                    <div className="mt-2">
                      {autoFillResult.success ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            Successfully filled {autoFillResult.filledPositions} out of {autoFillResult.totalPositions} positions.
                          </p>
                          {autoFillResult.assignments.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Assignments:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {autoFillResult.assignments.map((assignment: any, index: number) => (
                                  <li key={index}>
                                    Player {assignment.playerId} → {assignment.teamId} ({assignment.position})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-500">
                            Auto-fill failed. Please try again or assign players manually.
                          </p>
                          {autoFillResult.errors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-red-700 mb-1">Errors:</p>
                              <ul className="text-sm text-red-600 space-y-1">
                                {autoFillResult.errors.map((error: string, index: number) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowAutoFillModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistManager; 