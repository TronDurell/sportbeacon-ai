import React, { useState } from 'react';
import { Button } from 'shadcn/ui/button';

const dummyTowns = [
  { id: '1', name: 'Cary' },
  { id: '2', name: 'Apex' },
  { id: '3', name: 'Morrisville' },
];

const TownSelector: React.FC<{ selected: string[]; onChange: (ids: string[]) => void }> = ({ selected, onChange }) => {
  const [search, setSearch] = useState('');
  const filtered = dummyTowns.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="w-full" role="region" aria-label="Town selector" tabIndex={0}>
      <div className="space-y-2">
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-2"
          placeholder="Search towns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search towns"
        />
        <ul className="divide-y">
          {filtered.map(town => (
            <li key={town.id} className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                checked={selected.includes(town.id)}
                onChange={() => {
                  if (selected.includes(town.id)) {
                    onChange(selected.filter(id => id !== town.id));
                  } else {
                    onChange([...selected, town.id]);
                  }
                }}
                id={`town-${town.id}`}
              />
              <label htmlFor={`town-${town.id}`}>{town.name}</label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TownSelector; 