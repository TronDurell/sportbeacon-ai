import React, { useState, useEffect } from 'react';
import { useAgeExceptions } from '../../hooks/useAgeExceptions';
import { AgeException, AgeExceptionStatus } from '../../types/admin';

interface AgeExceptionRequestsPanelProps {
  leagueId?: string;
}

export const AgeExceptionRequestsPanel: React.FC<AgeExceptionRequestsPanelProps> = ({ 
  leagueId 
}) => {
  const {
    ageExceptions,
    loading,
    error,
    approveException,
    rejectException,
    getAgeExceptions,
    bulkApprove,
    bulkReject
  } = useAgeExceptions();

  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [filterStatus, setFilterStatus] = useState<AgeExceptionStatus | 'all'>('all');
  const [selectedExceptions, setSelectedExceptions] = useState<string[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedException, setSelectedException] = useState<AgeException | null>(null);

  useEffect(() => {
    if (selectedLeague) {
      getAgeExceptions(selectedLeague);
    }
  }, [selectedLeague]);

  const handleApprove = async (exceptionId: string, reason?: string) => {
    try {
      await approveException(exceptionId, reason);
      getAgeExceptions(selectedLeague);
    } catch (error) {
      console.error('Failed to approve exception:', error);
    }
  };

  const handleReject = async (exceptionId: string, reason: string) => {
    try {
      await rejectException(exceptionId, reason);
      getAgeExceptions(selectedLeague);
    } catch (error) {
      console.error('Failed to reject exception:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedExceptions.length === 0) return;
    
    try {
      await bulkApprove(selectedExceptions);
      setSelectedExceptions([]);
      getAgeExceptions(selectedLeague);
    } catch (error) {
      console.error('Failed to bulk approve exceptions:', error);
    }
  };

  const handleBulkReject = async (reason: string) => {
    if (selectedExceptions.length === 0) return;
    
    try {
      await bulkReject(selectedExceptions, reason);
      setSelectedExceptions([]);
      getAgeExceptions(selectedLeague);
    } catch (error) {
      console.error('Failed to bulk reject exceptions:', error);
    }
  };

  const handleSelectException = (exceptionId: string) => {
    setSelectedExceptions(prev => 
      prev.includes(exceptionId) 
        ? prev.filter(id => id !== exceptionId)
        : [...prev, exceptionId]
    );
  };

  const handleSelectAll = () => {
    const filteredExceptions = ageExceptions.filter(exception => 
      filterStatus === 'all' || exception.status === filterStatus
    );
    setSelectedExceptions(filteredExceptions.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedExceptions([]);
  };

  const filteredExceptions = ageExceptions.filter(exception => 
    filterStatus === 'all' || exception.status === filterStatus
  );

  const getStatusColor = (status: AgeExceptionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgeDifference = (playerAge: number, cutoffAge: number) => {
    const diff = playerAge - cutoffAge;
    return diff > 0 ? `+${diff} years` : `${diff} years`;
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
            <h3 className="text-sm font-medium text-red-800">Error loading age exceptions</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Age Exception Requests</h1>
          <p className="text-gray-600">Review and manage age exception requests for league participation</p>
        </div>
        {selectedExceptions.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={handleBulkApprove}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Selected ({selectedExceptions.length})
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter rejection reason:');
                if (reason) handleBulkReject(reason);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Selected ({selectedExceptions.length})
            </button>
          </div>
        )}
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
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ageExceptions.filter(e => e.status === 'pending').length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ageExceptions.filter(e => e.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ageExceptions.filter(e => e.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Coach Overrides</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {ageExceptions.filter(e => e.coachOverride).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Bulk Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                    Filter by Status
                  </label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as AgeExceptionStatus | 'all')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-gray-600 hover:text-gray-500"
                >
                  Deselect All
                </button>
              </div>
            </div>
          </div>

          {/* Age Exceptions List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Age Exception Requests</h3>
            </div>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedExceptions.length === filteredExceptions.length && filteredExceptions.length > 0}
                        onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExceptions.map((exception) => (
                    <tr key={exception.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedExceptions.includes(exception.id)}
                          onChange={() => handleSelectException(exception.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {exception.playerName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {exception.playerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exception.guardianName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Player Age: {exception.playerAge}</div>
                          <div>Cutoff Age: {exception.cutoffAge}</div>
                          <div className={`font-medium ${
                            exception.playerAge > exception.cutoffAge ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {getAgeDifference(exception.playerAge, exception.cutoffAge)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{exception.requestReason}</div>
                          {exception.coachOverride && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Coach Override
                              </span>
                            </div>
                          )}
                          <div className="mt-1 text-sm text-gray-500">
                            Requested: {new Date(exception.requestDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exception.status)}`}>
                          {exception.status}
                        </span>
                        {exception.status !== 'pending' && (
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(exception.reviewDate || '').toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {exception.status === 'pending' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApprove(exception.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) handleReject(exception.id, reason);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedException(exception);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Details
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedException(exception);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedException && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Exception Details</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedException(null);
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
                    <label className="block text-sm font-medium text-gray-700">Player Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedException.playerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Guardian</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedException.guardianName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Player Age</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedException.playerAge}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cutoff Age</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedException.cutoffAge}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedException.requestReason}</p>
                </div>
                
                {selectedException.coachOverride && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Coach Override</label>
                    <p className="mt-1 text-sm text-gray-900">This request was overridden by a coach</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedException.status)}`}>
                    {selectedException.status}
                  </span>
                </div>
                
                {selectedException.status !== 'pending' && selectedException.reviewNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Review Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedException.reviewNotes}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Request Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedException.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedException.reviewDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedException.reviewDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedException.status === 'pending' && (
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => handleApprove(selectedException.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) handleReject(selectedException.id, reason);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 