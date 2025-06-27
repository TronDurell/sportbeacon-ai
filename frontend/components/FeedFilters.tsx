import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function FeedFilters({ statFilter, setStatFilter, roleFilter, setRoleFilter }) {
  return (
    <div className="w-full" role="region" aria-label="Feed filters" tabIndex={0}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel>Stat</InputLabel>
          <Select
            value={statFilter}
            onChange={(e) => setStatFilter(e.target.value)}
            label="Stat"
          >
            <MenuItem value="speed">Speed</MenuItem>
            <MenuItem value="strength">Strength</MenuItem>
            <MenuItem value="agility">Agility</MenuItem>
            {/* Add more stat options as needed */}
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            label="Role"
          >
            <MenuItem value="forward">Forward</MenuItem>
            <MenuItem value="defender">Defender</MenuItem>
            <MenuItem value="goalkeeper">Goalkeeper</MenuItem>
            {/* Add more role options as needed */}
          </Select>
        </FormControl>
      </Box>
    </div>
  );
} 