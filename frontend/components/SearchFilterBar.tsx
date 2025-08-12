// TODO: Phase 2 - Advanced Search Features
// - Add AI-powered search suggestions
// - Implement fuzzy search and typo tolerance
// - Add search analytics and trending searches

// TODO: Phase 2 - Real Backend Integration
// - Replace mock Firestore queries with real database queries
// - Add search result caching and optimization
// - Implement real-time search updates

// TODO: Phase 2 - Performance Optimization
// - Add search result pagination
// - Implement search result ranking algorithms
// - Add search history and personalization

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Typography,
  IconButton,
  Collapse,
  Grid,
  Slider,
  FormControlLabel,
  Switch,
  Autocomplete,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
  LocationOn,
  SportsSoccer,
  School,
  AccessTime
} from '@mui/icons-material';

interface SearchFilters {
  query: string;
  positions: string[];
  skillLevels: string[];
  locations: string[];
  teams: string[];
  schools: string[];
  availability: string[];
  ageRange: [number, number];
  experienceYears: [number, number];
  isActive: boolean;
  hasVideo: boolean;
  tags: string[];
}

interface SearchFilterBarProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  initialFilters?: Partial<SearchFilters>;
}

const positions = [
  'Point Guard', 'Shooting Guard', 'Small Forward', 
  'Power Forward', 'Center', 'Any Position'
];

const skillLevels = [
  'Beginner', 'Intermediate', 'Advanced', 'Elite'
];

const availabilityOptions = [
  'Weekdays', 'Weekends', 'Evenings', 'Mornings', 'Flexible'
];

const popularTags = [
  'Shooting', 'Defense', 'Playmaking', 'Rebounding', 'Leadership',
  'Team Player', 'Fast', 'Strong', 'Agile', 'Experienced'
];

const initialFilters: SearchFilters = {
  query: '',
  positions: [],
  skillLevels: [],
  locations: [],
  teams: [],
  schools: [],
  availability: [],
  ageRange: [12, 18],
  experienceYears: [0, 10],
  isActive: true,
  hasVideo: false,
  tags: []
};

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  onSearch,
  onClear,
  initialFilters: userInitialFilters
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ...initialFilters,
    ...userInitialFilters
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    locations: [] as string[],
    teams: [] as string[],
    schools: [] as string[]
  });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      // Mock API call - replace with actual Firestore queries
      const data = await fetchSearchSuggestions();
      setSuggestions(data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const fetchSearchSuggestions = async () => {
    // Mock API call - replace with actual Firestore integration
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      locations: ['Cary, NC', 'Raleigh, NC', 'Durham, NC', 'Chapel Hill, NC'],
      teams: ['Varsity Hawks', 'Junior Eagles', 'Senior Lions', 'Elite Warriors'],
      schools: ['Central High', 'North High', 'South High', 'East High']
    };
  };

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Validate filters
      if (!filters.query.trim() && 
          filters.positions.length === 0 && 
          filters.skillLevels.length === 0 &&
          filters.locations.length === 0) {
        throw new Error('Please enter a search query or select at least one filter');
      }

      await onSearch(filters);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFilters(initialFilters);
    onClear();
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query.trim()) count++;
    if (filters.positions.length > 0) count++;
    if (filters.skillLevels.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.teams.length > 0) count++;
    if (filters.schools.length > 0) count++;
    if (filters.availability.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.ageRange[0] !== 12 || filters.ageRange[1] !== 18) count++;
    if (filters.experienceYears[0] !== 0 || filters.experienceYears[1] !== 10) count++;
    if (!filters.isActive) count++;
    if (filters.hasVideo) count++;
    return count;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">Search Players</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<FilterList />}
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outlined"
            size="small"
          >
            {showAdvanced ? 'Hide' : 'Show'} Filters
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={getActiveFiltersCount()}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Button>
        </Box>

        {/* Basic Search */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name, skills, or keywords..."
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isLoading}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            startIcon={<Clear />}
          >
            Clear
          </Button>
        </Box>

        {/* Quick Tags */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Quick Filters
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {popularTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                clickable
                color={filters.tags.includes(tag) ? 'primary' : 'default'}
                onClick={() => handleTagToggle(tag)}
              />
            ))}
          </Box>
        </Box>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={3}>
            {/* Positions */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Positions</InputLabel>
                <Select
                  multiple
                  value={filters.positions}
                  onChange={(e) => handleFilterChange('positions', e.target.value)}
                  input={<OutlinedInput label="Positions" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {positions.map((position) => (
                    <MenuItem key={position} value={position}>
                      <Checkbox checked={filters.positions.indexOf(position) > -1} />
                      <ListItemText primary={position} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Skill Levels */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Skill Levels</InputLabel>
                <Select
                  multiple
                  value={filters.skillLevels}
                  onChange={(e) => handleFilterChange('skillLevels', e.target.value)}
                  input={<OutlinedInput label="Skill Levels" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {skillLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      <Checkbox checked={filters.skillLevels.indexOf(level) > -1} />
                      <ListItemText primary={level} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Locations */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={suggestions.locations}
                value={filters.locations}
                onChange={(_, newValue) => handleFilterChange('locations', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Locations"
                    placeholder="Select locations"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Teams */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={suggestions.teams}
                value={filters.teams}
                onChange={(_, newValue) => handleFilterChange('teams', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Teams"
                    placeholder="Select teams"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Schools */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                multiple
                options={suggestions.schools}
                value={filters.schools}
                onChange={(_, newValue) => handleFilterChange('schools', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Schools"
                    placeholder="Select schools"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>

            {/* Availability */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  multiple
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  input={<OutlinedInput label="Availability" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availabilityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox checked={filters.availability.indexOf(option) > -1} />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Age Range */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years
              </Typography>
              <Slider
                value={filters.ageRange}
                onChange={(_, value) => handleFilterChange('ageRange', value)}
                valueLabelDisplay="auto"
                min={8}
                max={25}
                step={1}
              />
            </Grid>

            {/* Experience Years */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" gutterBottom>
                Experience: {filters.experienceYears[0]} - {filters.experienceYears[1]} years
              </Typography>
              <Slider
                value={filters.experienceYears}
                onChange={(_, value) => handleFilterChange('experienceYears', value)}
                valueLabelDisplay="auto"
                min={0}
                max={15}
                step={1}
              />
            </Grid>

            {/* Boolean Filters */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isActive}
                      onChange={(e) => handleFilterChange('isActive', e.target.checked)}
                    />
                  }
                  label="Active Players Only"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.hasVideo}
                      onChange={(e) => handleFilterChange('hasVideo', e.target.checked)}
                    />
                  }
                  label="Has Video Content"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Filters:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {filters.query && (
                  <Chip
                    label={`Search: "${filters.query}"`}
                    size="small"
                    onDelete={() => handleFilterChange('query', '')}
                  />
                )}
                {filters.positions.map(pos => (
                  <Chip
                    key={pos}
                    label={`Position: ${pos}`}
                    size="small"
                    onDelete={() => handleFilterChange('positions', filters.positions.filter(p => p !== pos))}
                  />
                ))}
                {filters.skillLevels.map(level => (
                  <Chip
                    key={level}
                    label={`Skill: ${level}`}
                    size="small"
                    onDelete={() => handleFilterChange('skillLevels', filters.skillLevels.filter(s => s !== level))}
                  />
                ))}
                {filters.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={`Tag: ${tag}`}
                    size="small"
                    onDelete={() => handleTagToggle(tag)}
                  />
                ))}
                {!filters.isActive && (
                  <Chip
                    label="Inactive Players"
                    size="small"
                    onDelete={() => handleFilterChange('isActive', true)}
                  />
                )}
                {filters.hasVideo && (
                  <Chip
                    label="Has Video"
                    size="small"
                    onDelete={() => handleFilterChange('hasVideo', false)}
                  />
                )}
              </Box>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}; 