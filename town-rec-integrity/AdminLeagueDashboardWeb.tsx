import React, { useState, useEffect } from 'react';
import { LeagueCreationModal } from './LeagueCreationModal';
import { ExceptionRequestModal } from './ExceptionRequestModal';

interface League {
  id: string;
  name: string;
  genderPolicy: string;
  ageGroup: string;
  skillLevel: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'active' | 'inactive' | 'full';
}

interface ExceptionRequest {
  id: string;
  userId: string;
  leagueId: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  additionalInfo?: string;
}

export const AdminLeagueDashboardWeb: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [exceptionRequests, setExceptionRequests] = useState<ExceptionRequest[]>([]);
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExceptionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Mock data loading - replace with actual API calls
      const mockLeagues: League[] = [
        {
          id: 'league-1',
          name: 'U12 Boys Recreational',
          genderPolicy: 'boys-only',
          ageGroup: 'U12',
          skillLevel: 'beginner',
          maxPlayers: 20,
          currentPlayers: 18,
          status: 'active',
        },
        {
          id: 'league-2',
          name: 'U14 Girls Competitive',
          genderPolicy: 'girls-only',
          ageGroup: 'U14',
          skillLevel: 'competitive',
          maxPlayers: 18,
          currentPlayers: 18,
          status: 'full',
        },
      ];

      const mockRequests: ExceptionRequest[] = [
        {
          id: 'req-1',
          userId: 'user-123',
          leagueId: 'league-1',
          reason: 'age-exception',
          urgency: 'medium',
          status: 'pending',
          createdAt: new Date(),
          additionalInfo: 'Player is 11 but turns 12 before season starts',
        },
      ];

      setLeagues(mockLeagues);
      setExceptionRequests(mockRequests);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLeague = async (leagueData: any) => {
    try {
      // Mock league creation - replace with actual API call
      const newLeague: League = {
        id: `league-${Date.now()}`,
        ...leagueData,
        currentPlayers: 0,
        status: 'active',
      };
      setLeagues(prev => [...prev, newLeague]);
    } catch (error) {
      console.error('Failed to create league:', error);
      throw error;
    }
  };

  const handleExceptionRequest = async (requestData: any) => {
    try {
      // Mock exception request submission - replace with actual API call
      const newRequest: ExceptionRequest = {
        id: `req-${Date.now()}`,
        ...requestData,
        status: 'pending',
        createdAt: new Date(),
      };
      setExceptionRequests(prev => [...prev, newRequest]);
    } catch (error) {
      console.error('Failed to submit exception request:', error);
      throw error;
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setExceptionRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      )
    );
  };

  const handleRejectRequest = async (requestId: string) => {
    setExceptionRequests(prev =>
      prev.map(req =>
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">League Administration Dashboard</h1>
        <button
          onClick={() => setIsLeagueModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New League
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leagues Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Leagues</h2>
          <div className="space-y-3">
            {leagues.map(league => (
              <div key={league.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{league.name}</h3>
                    <p className="text-sm text-gray-600">
                      {league.ageGroup} • {league.skillLevel} • {league.genderPolicy}
                    </p>
                    <p className="text-sm text-gray-600">
                      Players: {league.currentPlayers}/{league.maxPlayers}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    league.status === 'active' ? 'bg-green-100 text-green-800' :
                    league.status === 'full' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {league.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exception Requests Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Exception Requests</h2>
          <div className="space-y-3">
            {exceptionRequests.map(request => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">Request #{request.id}</h3>
                    <p className="text-sm text-gray-600">Reason: {request.reason}</p>
                    <p className="text-sm text-gray-600">
                      Urgency: {request.urgency} • Status: {request.status}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    request.urgency === 'high' ? 'bg-red-100 text-red-800' :
                    request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {request.urgency}
                  </span>
                </div>
                {request.status === 'pending' && (
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LeagueCreationModal
        isOpen={isLeagueModalOpen}
        onClose={() => setIsLeagueModalOpen(false)}
        onSubmit={handleCreateLeague}
      />

      {selectedRequest && (
        <ExceptionRequestModal
          isOpen={isExceptionModalOpen}
          onClose={() => {
            setIsExceptionModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleExceptionRequest}
          userId={selectedRequest.userId}
          leagueId={selectedRequest.leagueId}
        />
      )}
    </div>
  );
}; 