import React from 'react';
// import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function MatchMap({ matches }: { matches: any[] }) {
  return (
    <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>
      <div>Map placeholder - {matches?.length || 0} matches</div>
    </div>
  );
} 