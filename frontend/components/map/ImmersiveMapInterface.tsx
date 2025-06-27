import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFirestore, collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { app } from '../../lib/firebase';

const venueIcon = new L.Icon({ iconUrl: '/icons/venue.svg', iconSize: [32, 32], iconAnchor: [16, 32] });
const playerIcon = new L.Icon({ iconUrl: '/icons/player.svg', iconSize: [28, 28], iconAnchor: [14, 28] });
const highlightIcon = new L.Icon({ iconUrl: '/icons/highlight.svg', iconSize: [28, 28], iconAnchor: [14, 28] });

interface Venue {
  id: string;
  name: string;
  coordinates: [number, number];
  description?: string;
  images?: string[];
  bIsIndoor?: boolean;
}
interface Player {
  id: string;
  name: string;
  coordinates: [number, number];
  avatarUrl?: string;
  sport?: string;
  status?: string;
}
interface Highlight {
  id: string;
  playerId: string;
  coordinates: [number, number];
  highlightType: string;
  description?: string;
}

const ImmersiveMapInterface: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    setLoading(true);
    const unsubVenues = onSnapshot(collection(db, 'facilities'), snap => {
      setVenues(snap.docs.map(d => ({ id: d.id, ...d.data() } as Venue)));
      setLoading(false);
    });
    const unsubPlayers = onSnapshot(collection(db, 'players'), snap => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Player)));
    });
    const unsubHighlights = onSnapshot(collection(db, 'highlights'), snap => {
      setHighlights(snap.docs.map(d => ({ id: d.id, ...d.data() } as Highlight)));
    });
    return () => { unsubVenues(); unsubPlayers(); unsubHighlights(); };
  }, [db]);

  return (
    <div className="w-full h-[70vh] rounded-xl overflow-hidden shadow-lg relative" role="region" aria-label="Immersive Map">
      {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div></div>}
      <MapContainer center={[35.7915, -78.7811]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {venues.map(v => (
          <Marker key={v.id} position={v.coordinates} icon={venueIcon}>
            <Popup>
              <div className="font-bold">{v.name}</div>
              <div className="text-xs text-gray-500">{v.description}</div>
            </Popup>
          </Marker>
        ))}
        {players.map(p => (
          <Marker key={p.id} position={p.coordinates} icon={playerIcon}>
            <Popup>
              <div className="font-bold">{p.name}</div>
              <div className="text-xs">{p.sport} {p.status}</div>
            </Popup>
          </Marker>
        ))}
        {highlights.filter(h => !filter || h.highlightType === filter).map(h => (
          <Marker key={h.id} position={h.coordinates} icon={highlightIcon}>
            <Popup>
              <div className="font-bold">Highlight: {h.highlightType}</div>
              <div className="text-xs">{h.description}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow p-2 flex gap-2 z-20" aria-label="Highlight Filter Controls">
        <label htmlFor="highlight-filter" className="text-xs">Highlight Filter:</label>
        <select id="highlight-filter" value={filter} onChange={e => setFilter(e.target.value)} className="rounded border p-1">
          <option value="">All</option>
          <option value="ClutchPlay">Clutch Play</option>
          <option value="HotStreak">Hot Streak</option>
          <option value="MomentumShift">Momentum Shift</option>
          <option value="ImpactPlay">Impact Play</option>
        </select>
      </div>
    </div>
  );
};

// Firestore sync function for Unreal (to be called from Unreal or via API)
export async function syncUnrealGameState({ venues, players, highlights }: { venues?: Venue[]; players?: Player[]; highlights?: Highlight[] }) {
  const db = getFirestore(app);
  if (venues) {
    for (const v of venues) {
      await setDoc(doc(db, 'facilities', v.id), v, { merge: true });
    }
  }
  if (players) {
    for (const p of players) {
      await setDoc(doc(db, 'players', p.id), p, { merge: true });
    }
  }
  if (highlights) {
    for (const h of highlights) {
      await setDoc(doc(db, 'highlights', h.id), h, { merge: true });
    }
  }
}

// Firestore schema:
// - facilities/{venueId}: { id, name, coordinates, ... }
// - players/{playerId}: { id, name, coordinates, ... }
// - highlights/{highlightId}: { id, playerId, coordinates, highlightType, ... }
// Unreal should call syncUnrealGameState to push updates.

export default ImmersiveMapInterface; 