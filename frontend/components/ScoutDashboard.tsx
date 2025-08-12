import React, { useState, useEffect } from 'react';
import { PlayerAPI } from '../services/playerAPI';
import { PlayerProfile, ScoutNote, PlayerEvaluation } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PerformanceChart } from './PerformanceChart';

interface ScoutDashboardProps {
  scoutId: string;
}

export const ScoutDashboard: React.FC<ScoutDashboardProps> = ({ scoutId }) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    ageRange: [0, 100] as [number, number],
    positions: [] as string[],
    skills: [] as string[],
    minRating: 0
  });

  const playerAPI = new PlayerAPI();

  const addScoutNote = async (note: Omit<ScoutNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await playerAPI.addScoutNote({
        ...note,
        scoutId: scoutId,
        visibility: 'private'
      });
    } catch (error) {
      console.error('Failed to add scout note:', error);
    }
  };

  const updatePlayerEvaluation = async (playerId: string, evaluation: PlayerEvaluation) => {
    try {
      await playerAPI.updatePlayerEvaluation(playerId, {
        ...evaluation,
        overallPotential: evaluation.overallPotential || 0,
        lastUpdated: new Date(),
        evaluatorId: scoutId
      });
    } catch (error) {
      console.error('Failed to update player evaluation:', error);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = !searchQuery || 
      player.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAge = filters.ageRange.length === 2 && 
      player.age !== undefined &&
      filters.ageRange.every(([min, max]) => player.age! >= min && player.age! <= max);

    const matchesPosition = filters.positions.length === 0 ||
      (player.position && filters.positions.includes(player.position));

    const matchesSkills = filters.skills.length === 0 ||
      (player.skills && player.skills.some((s: any) => s.name && filters.skills.includes(s.name) && s.level >= 7));

    const matchesRating = player.scoutRating !== undefined && 
      player.scoutRating >= filters.minRating;

    return matchesSearch && matchesAge && matchesPosition && matchesSkills && matchesRating;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (filters.minRating > 0) {
      return (b.scoutRating || 0) - (a.scoutRating || 0);
    }
    if (filters.ageRange.length === 2) {
      return (a.age || 0) - (b.age || 0);
    }
    return 0;
  });

  return (
    <div className="scout-dashboard">
      <div className="header">
        <h1>Scout Dashboard</h1>
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="players-grid">
        {sortedPlayers.map(player => (
          <div key={player.id} className="player-card">
            <div className="player-info">
              <h3>{player.firstName} {player.lastName}</h3>
              <div className="rating">
                <span>Rating: {(player.scoutRating || 0) / 2}/5</span>
              </div>
              <p>
                {player.age || 'N/A'} years • {player.position || 'N/A'} • {player.team?.name || 'No Team'}
              </p>
              {player.skills && (
                <div className="skills">
                  {player.skills.map((skill: any) => (
                    <span key={skill.name} className="skill-tag">
                      {skill.name}: {skill.level}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 