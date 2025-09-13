import { useState, useEffect } from 'react';

export function useVenues() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/venues')
      .then(res => res.json())
      .then(setData)
      .catch(setError);
  }, []);
  return {
    venues: data,
    isLoading: !error && !data,
    isError: error
  }
}

export function useDrillSuggestions(playerId: string, venueType?: string) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/drills?playerId=${playerId}&venueType=${venueType}`)
      .then(res => res.json())
      .then(setData)
      .catch(setError);
  }, [playerId, venueType]);

  const filteredDrills = data ? (data as any[]).filter((drill: any) => {
    if (venueType === 'trail') {
      return !drill.tags.includes('water')
    }
    return true
  }) : []
  
  return {
    drills: filteredDrills,
    isLoading: !error && !data,
    isError: error
  }
} 