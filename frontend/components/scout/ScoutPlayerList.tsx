import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
} from '@mui/material';
import { Search, FilterList, Star, StarBorder } from '@mui/icons-material';
import { ScoutPlayer } from '../../types/player';

interface ScoutPlayerListProps {
  players: ScoutPlayer[];
  selectedPlayer: ScoutPlayer | null;
  searchQuery: string;
  starredPlayers: string[];
  onSearchChange: (query: string) => void;
  onPlayerSelect: (player: ScoutPlayer) => void;
  onStarPlayer: (playerId: string) => void;
  onFilterClick?: () => void;
}

export const ScoutPlayerList: React.FC<ScoutPlayerListProps> = ({
  players,
  selectedPlayer,
  searchQuery,
  starredPlayers,
  onSearchChange,
  onPlayerSelect,
  onStarPlayer,
  onFilterClick,
}) => {
  return (
    <Box sx={{ width: 320, p: 2 }}>
      <TextField
        fullWidth
        placeholder="Search players..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onFilterClick}>
                <FilterList />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <List sx={{ mt: 2 }}>
        {players.map((player) => (
          <ListItem
            key={player.id}
            button
            selected={selectedPlayer?.id === player.id}
            onClick={() => onPlayerSelect(player)}
          >
            <ListItemAvatar>
              <Avatar src={player.mediaUrls.profileImage} />
            </ListItemAvatar>
            <ListItemText
              primary={`${player.firstName} ${player.lastName}`}
              secondary={`${player.currentTeam.name} • ${player.primaryPosition}`}
            />
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onStarPlayer(player.id);
              }}
            >
              {starredPlayers.includes(player.id) ? (
                <Star color="primary" />
              ) : (
                <StarBorder />
              )}
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}; 