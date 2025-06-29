import { Platform } from 'react-native';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface SmartVenue {
  id: string;
  name: string;
  type: 'field' | 'gym' | 'pool' | 'track' | 'tennis' | 'basketball' | 'baseball' | 'soccer' | 'multi-purpose';
  location: {
    latitude: number;
    longitude: number;
    address: string;
    town: string;
    state: string;
    zipCode: string;
  };
  capacity: {
    maxParticipants: number;
    currentOccupancy: number;
    availableSpots: number;
  };
  amenities: {
    lighting: boolean;
    parking: boolean;
    restrooms: boolean;
    waterFountains: boolean;
    equipmentStorage: boolean;
    wifi: boolean;
    accessibility: boolean;
  };
  sensors: VenueSensors;
  weather: WeatherData;
  status: 'open' | 'closed' | 'maintenance' | 'reserved';
  currentEvents: VenueEvent[];
  operatingHours: OperatingHours;
  pricing: PricingInfo;
  maintenance: MaintenanceInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueSensors {
  occupancy: {
    current: number;
    max: number;
    lastUpdated: Date;
  };
  lighting: {
    status: 'on' | 'off' | 'dimmed';
    brightness: number; // 0-100
    lastUpdated: Date;
  };
  temperature: {
    current: number;
    target: number;
    lastUpdated: Date;
  };
  humidity: {
    current: number;
    target: number;
    lastUpdated: Date;
  };
  airQuality: {
    co2: number;
    pm25: number;
    lastUpdated: Date;
  };
  parking: {
    available: number;
    total: number;
    lastUpdated: Date;
  };
  equipment: {
    available: number;
    total: number;
    lastUpdated: Date;
  };
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  visibility: number;
  uvIndex: number;
  lastUpdated: Date;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  time: Date;
  temperature: number;
  condition: string;
  precipitation: number;
  windSpeed: number;
}

export interface VenueEvent {
  id: string;
  title: string;
  sportType: string;
  startTime: Date;
  endTime: Date;
  participants: number;
  maxParticipants: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  organizer: string;
}

export interface OperatingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface PricingInfo {
  hourlyRate: number;
  dailyRate: number;
  membershipDiscount: number;
  peakHourSurcharge: number;
  equipmentRental: number;
}

export interface MaintenanceInfo {
  lastInspection: Date;
  nextInspection: Date;
  issues: MaintenanceIssue[];
  scheduledMaintenance: MaintenanceSchedule[];
}

export interface MaintenanceIssue {
  id: string;
  type: 'lighting' | 'equipment' | 'surface' | 'facility' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedAt: Date;
  status: 'open' | 'in-progress' | 'resolved';
  estimatedResolution: Date;
}

export interface MaintenanceSchedule {
  id: string;
  type: string;
  description: string;
  scheduledDate: Date;
  duration: number; // hours
  affectedAreas: string[];
}

export interface MapLayer {
  id: string;
  name: string;
  type: 'venues' | 'weather' | 'traffic' | 'events' | 'maintenance' | 'availability';
  visible: boolean;
  opacity: number;
  data: any[];
}

export interface VenueFilter {
  sportTypes: string[];
  amenities: string[];
  availability: 'all' | 'available' | 'occupied';
  priceRange: { min: number; max: number };
  distance: number; // miles from user location
  rating: number;
}

export class SmartVenueManager {
  private static instance: SmartVenueManager;
  private venues: Map<string, SmartVenue> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private weatherApiKey: string;

  static getInstance(): SmartVenueManager {
    if (!SmartVenueManager.instance) {
      SmartVenueManager.instance = new SmartVenueManager();
    }
    return SmartVenueManager.instance;
  }

  constructor() {
    this.weatherApiKey = process.env.WEATHER_API_KEY || '';
  }

  // Initialize venue data and start real-time updates
  async initialize(): Promise<void> {
    try {
      // Load all venues
      await this.loadVenues();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      // Update weather data
      await this.updateWeatherData();
      
      // Start sensor polling
      this.startSensorPolling();
    } catch (error) {
      console.error('Failed to initialize SmartVenueManager:', error);
    }
  }

  // Load all venues from Firestore
  private async loadVenues(): Promise<void> {
    try {
      const venuesQuery = query(collection(db, 'venues'));
      const snapshot = await getDocs(venuesQuery);
      
      snapshot.docs.forEach(doc => {
        const venue = { id: doc.id, ...doc.data() } as SmartVenue;
        this.venues.set(venue.id, venue);
      });
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  }

  // Start real-time updates for venue data
  private startRealTimeUpdates(): void {
    const venuesQuery = query(collection(db, 'venues'));
    
    const unsubscribe = onSnapshot(venuesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const venue = { id: change.doc.id, ...change.doc.data() } as SmartVenue;
        
        if (change.type === 'added' || change.type === 'modified') {
          this.venues.set(venue.id, venue);
        } else if (change.type === 'removed') {
          this.venues.delete(venue.id);
        }
      });
    });

    this.listeners.set('venues', unsubscribe);
  }

  // Update weather data for all venues
  private async updateWeatherData(): Promise<void> {
    if (!this.weatherApiKey) {
      console.warn('Weather API key not configured');
      return;
    }

    for (const venue of this.venues.values()) {
      try {
        const weather = await this.fetchWeatherData(venue.location.latitude, venue.location.longitude);
        venue.weather = weather;
        
        // Update in Firestore
        await this.updateVenueWeather(venue.id, weather);
      } catch (error) {
        console.error(`Failed to update weather for venue ${venue.id}:`, error);
      }
    }
  }

  // Fetch weather data from API
  private async fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        precipitation: data.rain?.['1h'] || 0,
        visibility: data.visibility / 1000, // Convert to miles
        uvIndex: 0, // Would need separate UV API call
        lastUpdated: new Date(),
        forecast: [], // Would need forecast API call
      };
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return this.getDefaultWeatherData();
    }
  }

  // Get default weather data when API fails
  private getDefaultWeatherData(): WeatherData {
    return {
      temperature: 72,
      condition: 'Clear',
      humidity: 50,
      windSpeed: 5,
      windDirection: 180,
      precipitation: 0,
      visibility: 10,
      uvIndex: 5,
      lastUpdated: new Date(),
      forecast: [],
    };
  }

  // Update venue weather in Firestore
  private async updateVenueWeather(venueId: string, weather: WeatherData): Promise<void> {
    try {
      // This would update the venue document in Firestore
      // Implementation depends on your Firestore structure
      console.log(`Updated weather for venue ${venueId}:`, weather);
    } catch (error) {
      console.error(`Failed to update weather for venue ${venueId}:`, error);
    }
  }

  // Start sensor polling for real-time data
  private startSensorPolling(): void {
    // Poll sensors every 30 seconds
    setInterval(() => {
      this.updateSensorData();
    }, 30000);
  }

  // Update sensor data (simulated for now)
  private async updateSensorData(): Promise<void> {
    for (const venue of this.venues.values()) {
      // Simulate sensor updates
      venue.sensors.occupancy.current = Math.floor(Math.random() * venue.sensors.occupancy.max);
      venue.sensors.occupancy.lastUpdated = new Date();
      
      venue.sensors.lighting.brightness = Math.random() > 0.5 ? 100 : 0;
      venue.sensors.lighting.status = venue.sensors.lighting.brightness > 0 ? 'on' : 'off';
      venue.sensors.lighting.lastUpdated = new Date();
      
      venue.sensors.temperature.current = 70 + (Math.random() - 0.5) * 10;
      venue.sensors.temperature.lastUpdated = new Date();
      
      venue.sensors.parking.available = Math.floor(Math.random() * venue.sensors.parking.total);
      venue.sensors.parking.lastUpdated = new Date();
    }
  }

  // Get all venues
  getVenues(): SmartVenue[] {
    return Array.from(this.venues.values());
  }

  // Get venue by ID
  getVenue(id: string): SmartVenue | undefined {
    return this.venues.get(id);
  }

  // Get venues by town
  getVenuesByTown(town: string): SmartVenue[] {
    return this.getVenues().filter(venue => venue.location.town === town);
  }

  // Get venues by sport type
  getVenuesBySport(sportType: string): SmartVenue[] {
    return this.getVenues().filter(venue => venue.type === sportType);
  }

  // Get available venues
  getAvailableVenues(): SmartVenue[] {
    return this.getVenues().filter(venue => 
      venue.status === 'open' && 
      venue.sensors.occupancy.current < venue.sensors.occupancy.max
    );
  }

  // Filter venues based on criteria
  filterVenues(filter: VenueFilter, userLocation?: { latitude: number; longitude: number }): SmartVenue[] {
    let venues = this.getVenues();

    // Filter by sport types
    if (filter.sportTypes.length > 0) {
      venues = venues.filter(venue => filter.sportTypes.includes(venue.type));
    }

    // Filter by amenities
    if (filter.amenities.length > 0) {
      venues = venues.filter(venue => 
        filter.amenities.every(amenity => venue.amenities[amenity as keyof typeof venue.amenities])
      );
    }

    // Filter by availability
    if (filter.availability !== 'all') {
      venues = venues.filter(venue => {
        const isAvailable = venue.sensors.occupancy.current < venue.sensors.occupancy.max;
        return filter.availability === 'available' ? isAvailable : !isAvailable;
      });
    }

    // Filter by price range
    venues = venues.filter(venue => 
      venue.pricing.hourlyRate >= filter.priceRange.min && 
      venue.pricing.hourlyRate <= filter.priceRange.max
    );

    // Filter by distance
    if (userLocation && filter.distance > 0) {
      venues = venues.filter(venue => {
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          venue.location.latitude,
          venue.location.longitude
        );
        return distance <= filter.distance;
      });
    }

    return venues;
  }

  // Calculate distance between two points
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get map layers
  getMapLayers(): MapLayer[] {
    const venues = this.getVenues();
    
    return [
      {
        id: 'venues',
        name: 'Venues',
        type: 'venues',
        visible: true,
        opacity: 1,
        data: venues,
      },
      {
        id: 'weather',
        name: 'Weather',
        type: 'weather',
        visible: false,
        opacity: 0.7,
        data: venues.map(venue => ({
          id: venue.id,
          location: venue.location,
          weather: venue.weather,
        })),
      },
      {
        id: 'availability',
        name: 'Availability',
        type: 'availability',
        visible: false,
        opacity: 0.8,
        data: venues.map(venue => ({
          id: venue.id,
          location: venue.location,
          occupancy: venue.sensors.occupancy,
          status: venue.status,
        })),
      },
      {
        id: 'maintenance',
        name: 'Maintenance',
        type: 'maintenance',
        visible: false,
        opacity: 0.9,
        data: venues.filter(venue => venue.maintenance.issues.length > 0).map(venue => ({
          id: venue.id,
          location: venue.location,
          issues: venue.maintenance.issues,
        })),
      },
    ];
  }

  // Get venue analytics
  getVenueAnalytics(): {
    totalVenues: number;
    totalCapacity: number;
    averageOccupancy: number;
    totalRevenue: number;
    maintenanceIssues: number;
    weatherAlerts: number;
  } {
    const venues = this.getVenues();
    
    return {
      totalVenues: venues.length,
      totalCapacity: venues.reduce((sum, venue) => sum + venue.sensors.occupancy.max, 0),
      averageOccupancy: venues.reduce((sum, venue) => sum + venue.sensors.occupancy.current, 0) / venues.length,
      totalRevenue: venues.reduce((sum, venue) => sum + (venue.pricing.hourlyRate * venue.sensors.occupancy.current), 0),
      maintenanceIssues: venues.reduce((sum, venue) => sum + venue.maintenance.issues.length, 0),
      weatherAlerts: venues.filter(venue => 
        venue.weather.precipitation > 0.1 || venue.weather.windSpeed > 20
      ).length,
    };
  }

  // Cleanup listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export const smartVenueManager = SmartVenueManager.getInstance(); 