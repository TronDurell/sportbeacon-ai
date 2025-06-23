export interface VenueType {
  venue_id: string;
  name: string;
  type: 'gym' | 'court' | 'trail' | 'pool' | 'field' | 'lake';
  surface: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  amenities: string[];
} 