import React from 'react';
import { Player } from '../lib/models/townRecTypes';

const PlayerCard: React.FC<{ player: Player; status?: string }> = ({ player, status }) => (
  <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow flex flex-col items-start w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500" role="region" aria-label={`Player card for ${player.name}`} tabIndex={0}>
    <div className="font-bold text-lg mb-1">{player.name}</div>
    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{player.email}</div>
    <div className="text-xs mb-1">{player.resident ? 'Resident' : 'Non-Resident'}</div>
    {status && <div className="text-xs font-semibold mb-1">Status: {status}</div>}
  </div>
);

export default PlayerCard;
