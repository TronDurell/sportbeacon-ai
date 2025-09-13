import React from 'react';
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Commented out - react-leaflet not installed
import 'leaflet/dist/leaflet.css';

const MapPage = () => {
  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div>
        <h1>Map Component</h1>
        <p>Map functionality will be implemented when react-leaflet is installed.</p>
      </div>
    </div>
  );
};

export default MapPage; 