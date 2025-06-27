import React, { useState } from 'react';
import { League, Facility, Game, Practice } from '../../lib/models/townRecTypes';
import { getFacilitySchedule } from '../../lib/models/townRecUtils';
import { Button } from 'shadcn/ui/button';

// Dummy data
const leagues: League[] = [
  { id: '1', name: 'Spring Soccer', season: 'Spring 2024', townId: 'cary', teams: [], schedule: ['g1'], registrationOpen: true, paymentTier: 'resident' },
];
const facilities: Facility[] = [
  { id: '1', name: 'Bond Park Field 1', address: '801 High House Rd', zoneId: 'z1', type: 'field', capacity: 100, schedule: ['g1', 'p1'] },
];
const games: Game[] = [
  { id: 'g1', leagueId: '1', homeTeamId: '1', awayTeamId: '2', facilityId: '1', date: '2024-05-10', time: '18:00' },
];
const practices: Practice[] = [
  { id: 'p1', leagueId: '1', teamId: '1', facilityId: '1', date: '2024-05-09', time: '17:00' },
];

const ScheduleViewer: React.FC = () => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const schedule = selectedFacility ? getFacilitySchedule(selectedFacility.id, games, practices) : [];

  return (
    <div className="w-full" role="region" aria-label="Schedule viewer" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Public Schedule Viewer</h2>
        <ul className="divide-y mb-4">
          {facilities.map(facility => (
            <li key={facility.id} className="py-2 flex justify-between items-center">
              <span>{facility.name}</span>
              <Button size="sm" onClick={() => setSelectedFacility(facility)}>View Schedule</Button>
            </li>
          ))}
        </ul>
        {selectedFacility && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
            <h3 className="font-semibold mb-2">Schedule for {selectedFacility.name}</h3>
            <ul>
              {schedule.map(item => (
                <li key={item.id}>
                  {('homeTeamId' in item)
                    ? `Game: ${item.date} ${item.time} (Home: ${item.homeTeamId}, Away: ${item.awayTeamId})`
                    : `Practice: ${item.date} ${item.time} (Team: ${item.teamId})`}
                </li>
              ))}
            </ul>
            <Button className="mt-2 w-full" variant="secondary" onClick={() => setSelectedFacility(null)}>Back</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleViewer; 