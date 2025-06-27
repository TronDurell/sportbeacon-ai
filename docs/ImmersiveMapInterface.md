# ImmersiveMapInterface

## Usage
```tsx
import ImmersiveMapInterface from '../components/map/ImmersiveMapInterface';

<ImmersiveMapInterface />
```

## Features
- Real-time Firestore sync for venues, highlights, and player locations
- Live marker rendering with Leaflet/Mapbox
- Real-time Unreal <-> Web sync via Firestore
- ARIA roles, keyboard navigation, mobile polish

## Flows
1. Firestore listeners fetch venues, highlights, and player locations.
2. Markers are rendered on the map and update in real time.
3. Unreal game state changes are reflected via Firestore updates.

## Error Handling
- Fallback UI for Firestore errors or missing data
- Loading spinner and status messages

## Accessibility
- ARIA roles for map and controls
- Keyboard navigation and focus management

--- 