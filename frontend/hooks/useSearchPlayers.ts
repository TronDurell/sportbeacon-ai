import { useState, useEffect } from 'react';

export default function useSearchPlayers(query: string) {
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (!query) return;
    // Firestore tag/regex search logic will be implemented here
  }, [query]);
  return results;
} 