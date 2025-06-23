import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { venues } from '../../mock/venues';

export default function TrainingMap() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null)
    );
  }, []);

  return (
    <div className="w-full h-screen">
      <MapContainer center={userLocation || [35.78, -78.8]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Your Current Location</Popup>
          </Marker>
        )}
        {venues.map((venue) => (
          <Marker key={venue.venue_id} position={[venue.coordinates.lat, venue.coordinates.lng]}>
            <Popup>
              <strong>{venue.name}</strong><br />
              Recommended Drill: Lateral Shuffle
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 