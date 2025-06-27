import React from 'react';
import { RegionalLeague } from '../../lib/models/townRecTypes';
import { Button } from 'shadcn/ui/button';

// Dummy data
const regionalLeagues: RegionalLeague[] = [
  { id: '1', name: 'Triangle Youth Soccer', sport: 'Soccer', ageRange: 'U12', adminTowns: ['1', '2'], teamLimit: 12, sharedSchedule: true },
];

const RegionalDashboard: React.FC = () => {
  return (
    <div className="w-full" role="region" aria-label="Regional dashboard" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">Regional Leagues</h2>
        <ul className="divide-y mb-4">
          {regionalLeagues.map(league => (
            <li key={league.id} className="py-2 flex justify-between items-center">
              <span>{league.name} ({league.sport}, {league.ageRange})</span>
              <Button size="sm">View Details</Button>
            </li>
          ))}
        </ul>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
          <h3 className="font-semibold mb-2">Neutral Venue Usage</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Coming soon: Multi-town schedules, results, and venue analytics.</p>
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboard; 