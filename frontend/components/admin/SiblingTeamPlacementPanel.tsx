import React, { useState, useEffect } from 'react';
import { useSiblingPlacement } from '../../hooks/useSiblingPlacement';
import { SiblingGroup, TeamPlacement } from '../../types/admin';

interface SiblingTeamPlacementPanelProps {
  leagueId?: string;
}

export const SiblingTeamPlacementPanel: React.FC<SiblingTeamPlacementPanelProps> = ({ 
  leagueId 
}) => {
  const {
    siblingGroups,
    teams,
    loading,
    error,
    placeSiblings,
    overridePlacement,
    generateAISuggestions,
    getSiblingGroups,
    getTeams
  } = useSiblingPlacement();

  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState<{
    groupId: string;
    teamId: string;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (selectedLeague) {
      getSiblingGroups(selectedLeague);
      getTeams(selectedLeague);
    }
  }, [selectedLeague]);

  const handlePlaceSiblings = async (groupId: string, teamId: string) => {
    try {
      await placeSiblings(groupId, teamId);
      // Refresh data
      getSiblingGroups(selectedLeague);
    } catch (error) {
      console.error('Failed to place siblings:', error);
    }
  };

  const handleOverridePlacement = async () => {
    if (!overrideData) return;
    
    try {
      await overridePlacement(
        overrideData.groupId,
        overrideData.teamId,
        overrideData.reason
      );
      setShowOverrideModal(false);
      setOverrideData(null);
      getSiblingGroups(selectedLeague);
    } catch (error) {
      console.error('Failed to override placement:', error);
    }
  };

  const handleAISuggestions = async () => {
    try {
      await generateAISuggestions(selectedLeague);
      getSiblingGroups(selectedLeague);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
  };

  const getGroupById = (groupId: string): SiblingGroup | undefined => {
    return siblingGroups.find(group => group.id === groupId);
  };

  const getTeamById = (teamId: string) => {
    return teams.find(team => team.id === teamId);
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
            <h3 className="text-sm font-medium text-red-800">Error loading sibling data</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Sibling Team Placement</h1>
          <p className="text-gray-600">Manage sibling groups and team assignments</p>
        </div>
        <button
          onClick={handleAISuggestions}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate AI Suggestions
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sibling Groups</p>
                  <p className="text-2xl font-semibold text-gray-900">{siblingGroups.length}</p>
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
                  <p className="text-sm font-medium text-gray-500">Placed Groups</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {siblingGroups.filter(group => group.placement).length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">Pending Placement</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {siblingGroups.filter(group => !group.placement).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Available Teams</p>
                  <p className="text-2xl font-semibold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sibling Groups */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Sibling Groups</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {siblingGroups.map((group) => (
                <div key={group.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            Group {group.id} - {group.siblings.length} siblings
                          </h4>
                          <p className="text-sm text-gray-500">
                            Guardian: {group.guardianName} • Phone: {group.guardianPhone}
                          </p>
                        </div>
                      </div>

                      {/* Sibling Details */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.siblings.map((sibling) => (
                          <div key={sibling.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{sibling.name}</p>
                                <p className="text-sm text-gray-500">
                                  Age: {sibling.age} • Grade: {sibling.grade}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Experience: {sibling.experienceLevel}
                                </p>
                              </div>
                              {sibling.currentTeam && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {sibling.currentTeam}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* AI Suggestions */}
                      {group.aiSuggestions && group.aiSuggestions.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions</h5>
                          <div className="flex space-x-2">
                            {group.aiSuggestions.map((suggestion, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {suggestion.teamName} ({suggestion.confidence}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {group.placement ? (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Placed on {getTeamById(group.placement.teamId)?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {group.placement.reason}
                          </p>
                          <button
                            onClick={() => {
                              setOverrideData({
                                groupId: group.id,
                                teamId: '',
                                reason: ''
                              });
                              setShowOverrideModal(true);
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                          >
                            Override
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            onChange={(e) => {
                              if (e.target.value) {
                                handlePlaceSiblings(group.id, e.target.value);
                              }
                            }}
                          >
                            <option value="">Select team...</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name} ({team.currentSize}/{team.maxSize})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              setOverrideData({
                                groupId: group.id,
                                teamId: '',
                                reason: ''
                              });
                              setShowOverrideModal(true);
                            }}
                            className="text-sm text-gray-600 hover:text-gray-500"
                          >
                            Manual Override
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Override Placement</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Team
                  </label>
                  <select
                    value={overrideData?.teamId || ''}
                    onChange={(e) => setOverrideData(prev => prev ? {...prev, teamId: e.target.value} : null)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select team...</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.currentSize}/{team.maxSize})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Override
                  </label>
                  <textarea
                    value={overrideData?.reason || ''}
                    onChange={(e) => setOverrideData(prev => prev ? {...prev, reason: e.target.value} : null)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Explain why this override is necessary..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideData(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverridePlacement}
                  disabled={!overrideData?.teamId || !overrideData?.reason}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 