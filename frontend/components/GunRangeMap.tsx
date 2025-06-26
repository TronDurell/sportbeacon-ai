import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GunRange {
  id: string;
  name: string;
  type: 'indoor' | 'outdoor' | 'mixed';
  sports: ('precision_shooting' | 'trap_skeet' | 'practical_pistol')[];
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  phone: string;
  website?: string;
  hours: string;
  pricing: {
    hourly: number;
    daily: number;
    membership?: number;
  };
  amenities: string[];
  restrictions: string[];
  certifications: string[];
  rating: number;
  reviewCount: number;
  distance?: number;
}

interface FilterOptions {
  type: 'all' | 'indoor' | 'outdoor' | 'mixed';
  sport: 'all' | 'precision_shooting' | 'trap_skeet' | 'practical_pistol';
  maxPrice: number;
  maxDistance: number;
}

// Custom marker icons
const createCustomIcon = (type: string) => {
  const colors = {
    indoor: '#3b82f6',
    outdoor: '#10b981',
    mixed: '#f59e0b'
  };

  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${colors[type as keyof typeof colors]}" stroke="white" stroke-width="2"/>
        <path d="M12 6v12M8 10h8M8 14h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Mock gun range data
const mockGunRanges: GunRange[] = [
  {
    id: 'gr001',
    name: 'Precision Shooting Center',
    type: 'indoor',
    sports: ['precision_shooting'],
    coordinates: { lat: 35.782, lng: -78.820 },
    address: '1234 Shooting Lane, Raleigh, NC 27601',
    phone: '(919) 555-0123',
    website: 'https://precisioncenter.com',
    hours: 'Mon-Sat: 9AM-9PM, Sun: 10AM-6PM',
    pricing: {
      hourly: 25,
      daily: 75,
      membership: 150
    },
    amenities: ['25-yard lanes', 'climate controlled', 'rental firearms', 'pro shop', 'classroom'],
    restrictions: ['No steel core ammo', 'Eye and ear protection required'],
    certifications: ['NRA Certified', 'USPSA Affiliated'],
    rating: 4.8,
    reviewCount: 127
  },
  {
    id: 'gr002',
    name: 'Carolina Trap & Skeet Club',
    type: 'outdoor',
    sports: ['trap_skeet'],
    coordinates: { lat: 35.793, lng: -78.776 },
    address: '5678 Clay Target Road, Cary, NC 27513',
    phone: '(919) 555-0456',
    website: 'https://carolinatrap.com',
    hours: 'Wed-Sun: 8AM-6PM',
    pricing: {
      hourly: 35,
      daily: 100
    },
    amenities: ['5 trap fields', '3 skeet fields', 'sporting clays', 'clubhouse', 'pro shop'],
    restrictions: ['Shotgun only', 'Lead shot only'],
    certifications: ['NSSA Affiliated', 'ATA Affiliated'],
    rating: 4.6,
    reviewCount: 89
  },
  {
    id: 'gr003',
    name: 'Triangle Practical Shooters',
    type: 'mixed',
    sports: ['practical_pistol'],
    coordinates: { lat: 35.760, lng: -78.700 },
    address: '9012 Action Range Drive, Durham, NC 27701',
    phone: '(919) 555-0789',
    website: 'https://trianglepractical.com',
    hours: 'Tue-Sun: 7AM-7PM',
    pricing: {
      hourly: 30,
      daily: 85,
      membership: 200
    },
    amenities: ['USPSA bays', 'IDPA stages', 'training area', 'classroom', 'pro shop'],
    restrictions: ['Holster draw allowed', 'Movement allowed'],
    certifications: ['USPSA Affiliated', 'IDPA Affiliated'],
    rating: 4.9,
    reviewCount: 156
  },
  {
    id: 'gr004',
    name: 'Raleigh Indoor Range',
    type: 'indoor',
    sports: ['precision_shooting', 'practical_pistol'],
    coordinates: { lat: 35.780, lng: -78.640 },
    address: '3456 Indoor Range Blvd, Raleigh, NC 27605',
    phone: '(919) 555-0321',
    website: 'https://raleighindoor.com',
    hours: 'Mon-Sat: 8AM-10PM, Sun: 9AM-8PM',
    pricing: {
      hourly: 20,
      daily: 60,
      membership: 120
    },
    amenities: ['15-yard lanes', '25-yard lanes', 'rental firearms', 'pro shop', 'training room'],
    restrictions: ['No rifle calibers', 'Eye and ear protection required'],
    certifications: ['NRA Certified'],
    rating: 4.4,
    reviewCount: 203
  },
  {
    id: 'gr005',
    name: 'Wake County Shooting Complex',
    type: 'outdoor',
    sports: ['precision_shooting', 'trap_skeet', 'practical_pistol'],
    coordinates: { lat: 35.790, lng: -78.780 },
    address: '7890 County Range Road, Wake Forest, NC 27587',
    phone: '(919) 555-0654',
    website: 'https://wakecountyshooting.com',
    hours: 'Tue-Sun: 8AM-6PM',
    pricing: {
      hourly: 40,
      daily: 120,
      membership: 250
    },
    amenities: ['100-yard rifle range', 'pistol bays', 'trap fields', 'skeet fields', 'classroom'],
    restrictions: ['No steel targets', 'Eye and ear protection required'],
    certifications: ['NRA Certified', 'USPSA Affiliated', 'NSSA Affiliated'],
    rating: 4.7,
    reviewCount: 178
  }
];

const CustomMarker: React.FC<{ range: GunRange; onClick: () => void }> = ({ range, onClick }) => {
  const getMarkerIcon = (type: string, sports: string[]) => {
    const color = type === 'indoor' ? '#e74c3c' : '#27ae60';
    const size = sports.length > 1 ? 'large' : 'medium';
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: ${size === 'large' ? '24px' : '20px'};
          height: ${size === 'large' ? '24px' : '20px'};
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          🎯
        </div>
      `,
      iconSize: [size === 'large' ? 24 : 20, size === 'large' ? 24 : 20],
      iconAnchor: [size === 'large' ? 12 : 10, size === 'large' ? 12 : 10]
    });
  };

  return (
    <Marker
      position={[range.coordinates.lat, range.coordinates.lng]}
      icon={getMarkerIcon(range.type, range.sports)}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold text-lg mb-1">{range.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{range.address}</p>
          <div className="flex items-center mb-2">
            <span className="text-yellow-500">★</span>
            <span className="text-sm ml-1">{range.rating}</span>
            <span className="text-sm text-gray-500 ml-2">{range.priceRange}</span>
          </div>
          <div className="text-xs text-gray-600">
            <p><strong>Sports:</strong> {range.sports.map(s => s.replace('_', ' ')).join(', ')}</p>
            <p><strong>Hours:</strong> {range.hours}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const MapController: React.FC<{ userLocation?: { lat: number; lng: number } }> = ({ userLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 12);
    }
  }, [userLocation, map]);

  return null;
};

const MapBounds: React.FC<{ ranges: GunRange[] }> = ({ ranges }) => {
  const map = useMap();

  useEffect(() => {
    if (ranges.length > 0) {
      const bounds = ranges.map(range => [range.coordinates.lat, range.coordinates.lng]);
      map.fitBounds(bounds as any);
    }
  }, [ranges, map]);

  return null;
};

export const GunRangeMap: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<GunRange | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    sport: 'all',
    maxPrice: 50,
    maxDistance: 50
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null)
    );
  }, []);

  // Filter ranges based on criteria
  const filteredRanges = mockGunRanges.filter(range => {
    if (filters.type !== 'all' && range.type !== filters.type) return false;
    if (filters.sport !== 'all' && !range.sports.includes(filters.sport)) return false;
    if (range.pricing.hourly > filters.maxPrice) return false;
    return true;
  });

  // Calculate distances if user location is available
  const rangesWithDistance = filteredRanges.map(range => {
    if (userLocation) {
      const distance = Math.sqrt(
        Math.pow(range.coordinates.lat - userLocation.lat, 2) +
        Math.pow(range.coordinates.lng - userLocation.lng, 2)
      ) * 69; // Rough conversion to miles
      return { ...range, distance };
    }
    return range;
  }).filter(range => !range.distance || range.distance <= filters.maxDistance);

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'precision_shooting': return '🎯';
      case 'trap_skeet': return '🔫';
      case 'practical_pistol': return '🔫';
      default: return '🎯';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'indoor': return 'bg-blue-100 text-blue-800';
      case 'outdoor': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gun Ranges</h1>
          <p className="text-gray-600 text-sm">Find local shooting ranges and facilities</p>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Range Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              {/* Sport Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                <select
                  value={filters.sport}
                  onChange={(e) => setFilters({ ...filters, sport: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sports</option>
                  <option value="precision_shooting">Precision Shooting</option>
                  <option value="trap_skeet">Trap & Skeet</option>
                  <option value="practical_pistol">Practical Pistol</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price: ${filters.maxPrice}/hour
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Distance Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Distance: {filters.maxDistance} miles
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Range List */}
        <div className="p-4">
          <div className="text-sm text-gray-600 mb-3">
            {rangesWithDistance.length} range{rangesWithDistance.length !== 1 ? 's' : ''} found
          </div>
          
          <div className="space-y-3">
            {rangesWithDistance.map((range) => (
              <div
                key={range.id}
                onClick={() => setSelectedRange(range)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRange?.id === range.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{range.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(range.type)}`}>
                    {range.type}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{range.address}</p>
                
                <div className="flex items-center space-x-2 mb-2">
                  {range.sports.map((sport) => (
                    <span key={sport} className="text-lg">
                      {getSportIcon(sport)}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">${range.pricing.hourly}/hour</span>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-gray-600">{range.rating}</span>
                    <span className="ml-1 text-gray-500">({range.reviewCount})</span>
                  </div>
                </div>
                
                {range.distance && (
                  <div className="text-xs text-gray-500 mt-1">
                    {range.distance.toFixed(1)} miles away
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={userLocation || [35.78, -78.8]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds ranges={rangesWithDistance} />
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          
          {/* Range Markers */}
          {rangesWithDistance.map((range) => (
            <Marker
              key={range.id}
              position={[range.coordinates.lat, range.coordinates.lng]}
              icon={createCustomIcon(range.type)}
              eventHandlers={{
                click: () => setSelectedRange(range)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">{range.name}</h3>
                  <p className="text-sm text-gray-600">{range.address}</p>
                  <p className="text-sm text-gray-600">${range.pricing.hourly}/hour</p>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="ml-1 text-sm text-gray-600">{range.rating}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Range Details Modal */}
      {selectedRange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedRange.name}</h2>
                <button
                  onClick={() => setSelectedRange(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Address:</span> {selectedRange.address}</p>
                    <p><span className="font-medium">Phone:</span> {selectedRange.phone}</p>
                    <p><span className="font-medium">Hours:</span> {selectedRange.hours}</p>
                    {selectedRange.website && (
                      <p><span className="font-medium">Website:</span> <a href={selectedRange.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{selectedRange.website}</a></p>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Hourly:</span> ${selectedRange.pricing.hourly}</p>
                    <p><span className="font-medium">Daily:</span> ${selectedRange.pricing.daily}</p>
                    {selectedRange.pricing.membership && (
                      <p><span className="font-medium">Membership:</span> ${selectedRange.pricing.membership}/month</p>
                    )}
                  </div>
                </div>

                {/* Sports */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sports</h3>
                  <div className="flex space-x-2">
                    {selectedRange.sports.map((sport) => (
                      <span key={sport} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {getSportIcon(sport)} {sport.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRange.amenities.map((amenity) => (
                      <span key={amenity} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Restrictions */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Restrictions</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {selectedRange.restrictions.map((restriction) => (
                      <li key={restriction}>{restriction}</li>
                    ))}
                  </ul>
                </div>

                {/* Certifications */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRange.certifications.map((cert) => (
                      <span key={cert} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => window.open(`tel:${selectedRange.phone}`)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Call Now
                </button>
                {selectedRange.website && (
                  <button
                    onClick={() => window.open(selectedRange.website, '_blank')}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Visit Website
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 