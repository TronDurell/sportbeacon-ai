import React, { useState } from 'react';
import { Player, League, Payment } from '../../lib/models/townRecTypes';
import { usePlayerRegistrationStatus } from '../../hooks/usePlayerRegistrationStatus';
import { Button } from 'shadcn/ui/button';

// Dummy data
const leagues: League[] = [
  { id: '1', name: 'Spring Soccer', season: 'Spring 2024', townId: 'cary', teams: [], schedule: [], registrationOpen: true, paymentTier: 'resident' },
];
const players: Player[] = [
  { id: '1', name: 'Alex Smith', email: 'alex@email.com', leagues: ['1'], teams: ['1'], resident: true },
];
const payments: Payment[] = [
  { id: 'pay1', playerId: '1', leagueId: '1', amount: 50, status: 'completed', timestamp: '2024-04-01T10:00:00Z' },
];

const RegistrationReview: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const status = selectedPlayer ? usePlayerRegistrationStatus(selectedPlayer.id, leagues, payments) : [];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Registration Review</h2>
      <ul className="divide-y mb-4">
        {players.map(player => (
          <li key={player.id} className="py-2 flex justify-between items-center">
            <span>{player.name} ({player.resident ? 'Resident' : 'Non-Resident'})</span>
            <Button size="sm" onClick={() => setSelectedPlayer(player)}>View Status</Button>
          </li>
        ))}
      </ul>
      {selectedPlayer && (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-xl">
          <h3 className="font-semibold mb-2">Registration for {selectedPlayer.name}</h3>
          <ul>
            {status.map(s => (
              <li key={s.league.id}>
                {s.league.name}: {s.paid ? 'Paid' : 'Unpaid'}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <Button variant="success">Approve</Button>
            <Button variant="destructive">Reject</Button>
            <Button variant="secondary" onClick={() => setSelectedPlayer(null)}>Back</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationReview; 