import { useState, useEffect } from 'react';

export default function useNearbyLeagues(geoPoint) {
  const [leagues, setLeagues] = useState([]);
  useEffect(() => {
    if (!geoPoint) return;
    // Firestore query to fetch leagues within 25mi radius
    // Example: query(collection(db, 'leagues'), where('isPublic', '==', true), where('location', 'near', geoPoint))
  }, [geoPoint]);
  return leagues;
} 