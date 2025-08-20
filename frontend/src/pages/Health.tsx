import React, { useEffect, useState } from 'react';
import { getHealth } from '@/services/api';

const Health: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setData)
      .catch((e) => setError(e.message || 'Failed'));
  }, []);

  return (
    <div>
      <h2>Health</h2>
      {error && <pre style={{ color: 'red' }}>{error}</pre>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default Health;

