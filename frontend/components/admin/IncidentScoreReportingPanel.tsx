import React, { useState, useEffect } from 'react';
import { useIncidentReports } from '../../hooks/useIncidentReports';
import { IncidentReport, ScoreReport, ReportStatus } from '../../types/admin';

interface IncidentScoreReportingPanelProps {
  leagueId?: string;
}

export const IncidentScoreReportingPanel: React.FC<IncidentScoreReportingPanelProps> = ({ 
  leagueId 
}) => {
  const {
    incidentReports,
    scoreReports,
    loading,
    error,
    resolveIncident,
    updateScore,
    addComment,
    getIncidentReports,
    getScoreReports,
    bulkResolveIncidents,
    bulkUpdateScores
  } = useIncidentReports();

  const [selectedLeague, setSelectedLeague] = useState(leagueId || '');
  const [activeTab, setActiveTab] = useState<'incidents' | 'scores'>('incidents');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | ScoreReport | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (selectedLeague) {
      getIncidentReports(selectedLeague);
      getScoreReports(selectedLeague);
    }
  }, [selectedLeague]);

  const handleResolveIncident = async (incidentId: string, resolution: string, severity: string) => {
    try {
      await resolveIncident(incidentId, resolution, severity);
      getIncidentReports(selectedLeague);
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  const handleUpdateScore = async (scoreId: string, homeScore: number, awayScore: number, notes?: string) => {
    try {
      await updateScore(scoreId, homeScore, awayScore, notes);
      getScoreReports(selectedLeague);
    } catch (error) {
      console.error('Failed to update score:', error);
    }
  };

  const handleAddComment = async (reportId: string, comment: string) => {
    try {
      await addComment(reportId, comment);
      setNewComment('');
      if (activeTab === 'incidents') {
        getIncidentReports(selectedLeague);
      } else {
        getScoreReports(selectedLeague);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleBulkResolve = async (resolution: string, severity: string) => {
    if (selectedReports.length === 0) return;
    
    try {
      await bulkResolveIncidents(selectedReports, resolution, severity);
      setSelectedReports([]);
      getIncidentReports(selectedLeague);
    } catch (error) {
      console.error('Failed to bulk resolve incidents:', error);
    }
  };

  const handleBulkUpdateScores = async (homeScore: number, awayScore: number, notes?: string) => {
    if (selectedReports.length === 0) return;
    
    try {
      await bulkUpdateScores(selectedReports, homeScore, awayScore, notes);
      setSelectedReports([]);
      getScoreReports(selectedLeague);
    } catch (error) {
      console.error('Failed to bulk update scores:', error);
    }
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    const currentReports = activeTab === 'incidents' ? incidentReports : scoreReports;
    const filteredReports = currentReports.filter(report => 
      filterStatus === 'all' || report.status === filterStatus
    );
    setSelectedReports(filteredReports.map(r => r.id));
  };

  const handleDeselectAll = () => {
    setSelectedReports([]);
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
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
            <h3 className="text-sm font-medium text-red-800">Error loading reports</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Incident & Score Reporting</h1>
          <p className="text-gray-600">Review and manage incident reports and score submissions</p>
        </div>
        {selectedReports.length > 0 && (
          <div className="flex space-x-2">
            {activeTab === 'incidents' ? (
              <button
                onClick={() => {
                  const resolution = prompt('Enter resolution:');
                  const severity = prompt('Enter severity (low/medium/high):');
                  if (resolution && severity) handleBulkResolve(resolution, severity);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Resolve Selected ({selectedReports.length})
              </button>
            ) : (
              <button
                onClick={() => {
                  const homeScore = prompt('Enter home score:');
                  const awayScore = prompt('Enter away score:');
                  const notes = prompt('Enter notes (optional):');
                  if (homeScore && awayScore) {
                    handleBulkUpdateScores(parseInt(homeScore), parseInt(awayScore), notes || undefined);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Selected ({selectedReports.length})
              </button>
            )}
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
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Incidents</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {incidentReports.filter(r => r.status === 'pending').length}
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
                  <p className="text-sm font-medium text-gray-500">Pending Scores</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {scoreReports.filter(r => r.status === 'pending').length}
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
                  <p className="text-sm font-medium text-gray-500">Resolved Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {[...incidentReports, ...scoreReports].filter(r => 
                      r.status === 'resolved' && 
                      new Date(r.resolutionDate || '').toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Comments</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {[...incidentReports, ...scoreReports].reduce((total, report) => 
                      total + (report.comments?.length || 0), 0
                    )}
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
                  onClick={() => setActiveTab('incidents')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'incidents'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Incident Reports ({incidentReports.length})
                </button>
                <button
                  onClick={() => setActiveTab('scores')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'scores'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Score Reports ({scoreReports.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Filters and Bulk Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      Filter by Status
                    </label>
                    <select
                      id="status-filter"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                      <option value="under_review">Under Review</option>
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

              {/* Reports List */}
              {activeTab === 'incidents' ? (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedReports.length === incidentReports.filter(r => 
                              filterStatus === 'all' || r.status === filterStatus
                            ).length && incidentReports.length > 0}
                            onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Incident
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teams
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Severity
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
                      {incidentReports
                        .filter(report => filterStatus === 'all' || report.status === filterStatus)
                        .map((incident) => (
                        <tr key={incident.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedReports.includes(incident.id)}
                              onChange={() => handleSelectReport(incident.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {incident.type}
                            </div>
                            <div className="text-sm text-gray-500">
                              {incident.description}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(incident.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {incident.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {incident.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                              {incident.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {incident.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const resolution = prompt('Enter resolution:');
                                    const severity = prompt('Enter severity (low/medium/high):');
                                    if (resolution && severity) {
                                      handleResolveIncident(incident.id, resolution, severity);
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReport(incident);
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
                                  setSelectedReport(incident);
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
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedReports.length === scoreReports.filter(r => 
                              filterStatus === 'all' || r.status === filterStatus
                            ).length && scoreReports.length > 0}
                            onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Game
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reported By
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
                      {scoreReports
                        .filter(report => filterStatus === 'all' || report.status === filterStatus)
                        .map((score) => (
                        <tr key={score.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedReports.includes(score.id)}
                              onChange={() => handleSelectReport(score.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {score.homeTeam} vs {score.awayTeam}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(score.gameDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {score.homeScore} - {score.awayScore}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{(selectedReport as ScoreReport).submittedBy}</div>
                            <div className="text-sm text-gray-500">{score.reportDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(score.status)}`}>
                              {score.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {score.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    const homeScore = prompt('Enter home score:');
                                    const awayScore = prompt('Enter away score:');
                                    const notes = prompt('Enter notes (optional):');
                                    if (homeScore && awayScore) {
                                      handleUpdateScore(score.id, parseInt(homeScore), parseInt(awayScore), notes || undefined);
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReport(score);
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
                                  setSelectedReport(score);
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
              )}
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {activeTab === 'incidents' ? 'Incident Details' : 'Score Report Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedReport(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {activeTab === 'incidents' ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Incident Type</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedReport as IncidentReport).type}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor((selectedReport as IncidentReport).status)}`}>
                          {(selectedReport as IncidentReport).status}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="mt-1 text-sm text-gray-900">{(selectedReport as IncidentReport).description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teams</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {(selectedReport as IncidentReport).title}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reported By</label>
                        <p className="mt-1 text-sm text-gray-900">System</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teams</label>
                        <p className="mt-1 text-sm text-gray-900">
                          Game ID: {(selectedReport as ScoreReport).gameId}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Score</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {(selectedReport as ScoreReport).homeScore} - {(selectedReport as ScoreReport).awayScore}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Game Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date((selectedReport as ScoreReport).submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reported By</label>
                        <p className="mt-1 text-sm text-gray-900">{(selectedReport as ScoreReport).submittedBy}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                
                {/* Comments Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comments</label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {/* {selectedReport.comments?.map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="text-sm text-gray-900">{comment.text}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">by {comment.author}</div>
                      </div>
                    ))} */}
                  </div>
                  
                  {/* Add Comment */}
                  <div className="mt-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleAddComment(selectedReport.id, newComment)}
                      disabled={!newComment.trim()}
                      className="mt-2 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
              
              {selectedReport.status === 'pending' && (
                <div className="flex justify-end space-x-3 mt-6">
                  {activeTab === 'incidents' ? (
                    <button
                      onClick={() => {
                        const resolution = prompt('Enter resolution:');
                        const severity = prompt('Enter severity (low/medium/high):');
                        if (resolution && severity) {
                          handleResolveIncident(selectedReport.id, resolution, severity);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const homeScore = prompt('Enter home score:');
                        const awayScore = prompt('Enter away score:');
                        const notes = prompt('Enter notes (optional):');
                        if (homeScore && awayScore) {
                          handleUpdateScore(selectedReport.id, parseInt(homeScore), parseInt(awayScore), notes || undefined);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Update Score
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 