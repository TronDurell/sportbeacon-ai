export interface Venue {
  venue_id: string;
  name: string;
  type: 'court' | 'field' | 'gym' | 'trail' | 'lake' | 'pool';
  sport_tags: string[]; // e.g. ['basketball', 'track', 'triathlon']
  coordinates: {
    lat: number;
    lng: number;
  };
  surface: 'turf' | 'asphalt' | 'concrete' | 'grass' | 'water' | 'wood';
  capacity?: number;
  amenities?: string[]; // e.g. ['restrooms', 'lights', 'scoreboard']
  open_hours?: {
    start: string; // '08:00'
    end: string;   // '22:00'
  };
  accessibility?: {
    wheelchair: boolean;
    parking: boolean;
  };
} 