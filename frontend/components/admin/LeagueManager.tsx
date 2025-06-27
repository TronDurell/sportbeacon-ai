import React, { useState } from 'react';
import { League } from '../../lib/models/townRecTypes';
import LeagueForm from './forms/LeagueForm';
import { Button } from 'shadcn/ui/button';

// Dummy data for now
const initialLeagues: League[] = [
  { id: '1', name: 'Spring Soccer', season: 'Spring 2024', townId: 'cary', teams: [], schedule: [], registrationOpen: true, paymentTier: 'resident' },
];

const LeagueManager: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>(initialLeagues);
  const [editing, setEditing] = useState<League | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSave = (data: any) => {
    if (editing) {
      setLeagues(leagues.map(l => l.id === editing.id ? { ...editing, ...data } : l));
    } else {
      setLeagues([...leagues, { ...data, id: Date.now().toString(), townId: 'cary', teams: [], schedule: [], registrationOpen: true }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="w-full" role="region" aria-label="League manager" tabIndex={0}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Leagues</h2>
          <Button onClick={() => { setShowForm(true); setEditing(null); }}>Add League</Button>
        </div>
        <ul className="divide-y">
          {leagues.map(league => (
            <li key={league.id} className="py-2 flex justify-between items-center">
              <span>{league.name} ({league.season})</span>
              <div className="space-x-2">
                <Button size="sm" onClick={() => { setEditing(league); setShowForm(true); }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setLeagues(leagues.filter(l => l.id !== league.id))}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-md">
              <LeagueForm onSubmit={handleSave} />
              <Button className="mt-2 w-full" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueManager; 