import React from 'react';
import { Trophy } from 'lucide-react';

interface League {
  id: string;
  name: string;
  sport: string;
  season: string;
  teamCount: number;
  status: 'active' | 'inactive' | 'draft';
  startDate: Date;
  endDate: Date;
}

const Leagues: React.FC = () => {
  const leagues: League[] = [
    {
      id: '1',
      name: 'Spring Soccer League',
      sport: 'Soccer',
      season: 'Spring 2024',
      teamCount: 12,
      status: 'active',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31')
    },
    {
      id: '2',
      name: 'Summer Basketball',
      sport: 'Basketball',
      season: 'Summer 2024',
      teamCount: 8,
      status: 'draft',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31')
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Leagues</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2">
          <Trophy className="w-4 h-4" />
          <span>Create League</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leagues.map((league) => (
          <div key={league.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                league.status === 'active' ? 'bg-green-100 text-green-800' :
                league.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {league.status}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{league.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{league.sport} • {league.season}</p>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Teams:</span>
                {league.teamCount} teams
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2">Season:</span>
                {league.startDate.toLocaleDateString()} - {league.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leagues; 