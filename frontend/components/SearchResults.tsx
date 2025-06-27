import React from 'react';
import { Grid } from '@mui/material';
import { PlayerCard } from './PlayerCard'; // Correct import for PlayerCard
import TeamInsightsCard from './TeamInsightsCard';

interface Player {
  id: string;
  name: string;
  avatar: string;
  sport: string;
  level: string;
  weeklyProgress: {
    drillsCompleted: number;
    totalDrills: number;
    performance: number;
  };
}

interface Team {
  id: string;
  name: string;
  stats: any; // Replace 'any' with the actual type
  topPlayers: Player[];
}

interface SearchResultsProps {
  players: Player[];
  teams?: Team[];
}

export default function SearchResults({ players, teams }: SearchResultsProps) {
  return (
    <div className="w-full" role="region" aria-label="Search results" tabIndex={0}>
      <Grid container spacing={2}>
        {players.map((p: Player) => (
          <Grid item key={p.id} xs={12} sm={6} md={4}>
            <PlayerCard player={p} onViewDetails={() => {}} />
          </Grid>
        ))}
        {teams && teams.map((t: Team) => (
          <Grid item key={t.id} xs={12} sm={6} md={4}>
            <TeamInsightsCard team={t} teamStats={t.stats} topPlayers={t.topPlayers} />
          </Grid>
        ))}
      </Grid>
    </div>
  );
} 