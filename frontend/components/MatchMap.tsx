import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

export default function MatchMap({ matches }) {
  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const center = {
    lat: matches.length ? matches[0].location.lat : 0,
    lng: matches.length ? matches[0].location.lng : 0,
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={10}>
        {matches.map((match, index) => (
          <Marker key={index} position={{ lat: match.location.lat, lng: match.location.lng }} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
} 