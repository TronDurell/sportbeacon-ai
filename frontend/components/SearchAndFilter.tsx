import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem } from '@mui/material';

export default function SearchAndFilter({ onFilter }: { onFilter: (filters: any) => void }) {
  const [tag, setTag] = useState('');
  const [location, setLocation] = useState('');
  const [postType, setPostType] = useState('');

  const handleFilter = () => {
    onFilter({ tag, location, postType });
  };

  return (
    <div className="w-full" role="region" aria-label="Search and filter" tabIndex={0}>
      <TextField label="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
      <TextField label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Select value={postType} onChange={(e) => setPostType(e.target.value)}>
        <MenuItem value="">None</MenuItem>
        <MenuItem value="type1">Type 1</MenuItem>
        <MenuItem value="type2">Type 2</MenuItem>
      </Select>
      <Button onClick={handleFilter}>Filter</Button>
    </div>
  );
} 