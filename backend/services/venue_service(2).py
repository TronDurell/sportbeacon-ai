from typing import Dict, List, Optional
import os
import json
from datetime import datetime, timedelta
import aiohttp
import redis
from geohash import encode as geohash_encode
import logging
from firebase_admin import firestore

logger = logging.getLogger(__name__)

db = firestore.client()

class VenueService:
    def __init__(self, redis_client: redis.Redis):
        self.mapbox_token = os.getenv('MAPBOX_ACCESS_TOKEN')
        self.redis_client = redis_client
        self.cache_ttl = 60 * 60 * 24  # 24 hours
        self.geohash_precision = 6  # ~1km precision

    async def find_nearby_venues(
        self,
        lat: float,
        lng: float,
        venue_type: str,
        required_features: List[str],
        radius_meters: int = 5000
    ) -> List[Dict]:
        """Find nearby venues using Mapbox and cache results."""
        # Generate cache key using geohash for spatial locality
        geohash = geohash_encode(lat, lng, self.geohash_precision)
        cache_key = f"venues:{geohash}:{venue_type}"

        # Try to get from cache first
        cached_results = self.redis_client.get(cache_key)
        if cached_results:
            venues = json.loads(cached_results)
            # Filter cached results by required features
            return self._filter_venues_by_features(venues, required_features)

        # If not in cache, fetch from Mapbox
        try:
            venues = await self._fetch_from_mapbox(lat, lng, venue_type, radius_meters)
            
            # Cache the results
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(venues)
            )

            # Filter by required features
            return self._filter_venues_by_features(venues, required_features)

        except Exception as e:
            logger.error(f"Error fetching venues: {str(e)}")
            return []

    async def _fetch_from_mapbox(
        self,
        lat: float,
        lng: float,
        venue_type: str,
        radius_meters: int
    ) -> List[Dict]:
        """Fetch venues from Mapbox Places API."""
        # Convert venue type to Mapbox category
        category = self._get_mapbox_category(venue_type)
        
        # Build Mapbox API URL
        url = (
            f"https://api.mapbox.com/geocoding/v5/mapbox.places/"
            f"{category}.json"
            f"?proximity={lng},{lat}"
            f"&radius={radius_meters}"
            f"&types=poi"
            f"&limit=10"
            f"&access_token={self.mapbox_token}"
        )

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._parse_mapbox_response(data)
                else:
                    logger.error(f"Mapbox API error: {response.status}")
                    return []

    def _get_mapbox_category(self, venue_type: str) -> str:
        """Map venue types to Mapbox categories."""
        category_map = {
            "gym": "gym",
            "park": "park",
            "sports_center": "recreation ground",
            "fitness": "fitness"
        }
        return category_map.get(venue_type, "gym")

    def _parse_mapbox_response(self, response: Dict) -> List[Dict]:
        """Parse Mapbox response into venue objects."""
        venues = []
        for feature in response.get('features', []):
            venue = {
                'name': feature.get('text', ''),
                'place_id': feature.get('id', ''),
                'coordinates': {
                    'lat': feature['center'][1],
                    'lng': feature['center'][0]
                },
                'address': feature.get('place_name', ''),
                'category': feature.get('properties', {}).get('category', ''),
                'rating': None,  # Mapbox doesn't provide ratings
                'features': self._extract_venue_features(feature)
            }
            venues.append(venue)
        return venues

    def _extract_venue_features(self, feature: Dict) -> List[str]:
        """Extract relevant features from Mapbox place data."""
        features = []
        properties = feature.get('properties', {})
        
        # Map Mapbox properties to our feature system
        if properties.get('outdoor'):
            features.append('outdoor')
        if properties.get('indoor'):
            features.append('indoor')
        
        # Add category-based features
        category = properties.get('category', '').lower()
        if 'gym' in category:
            features.extend(['weights', 'equipment-rich'])
        elif 'park' in category:
            features.extend(['outdoor', 'free', 'calisthenics-friendly'])
        
        return features

    def _filter_venues_by_features(
        self,
        venues: List[Dict],
        required_features: List[str]
    ) -> List[Dict]:
        """Filter venues by required features."""
        if not required_features:
            return venues

        filtered_venues = []
        for venue in venues:
            if all(feature in venue['features'] for feature in required_features):
                filtered_venues.append(venue)
        
        return filtered_venues

    async def get_venue_details(self, place_id: str) -> Optional[Dict]:
        """Get detailed venue information using Mapbox Place Details API."""
        cache_key = f"venue_details:{place_id}"
        
        # Try cache first
        cached_details = self.redis_client.get(cache_key)
        if cached_details:
            return json.loads(cached_details)

        # Fetch from Mapbox if not cached
        url = (
            f"https://api.mapbox.com/geocoding/v5/mapbox.places/"
            f"{place_id}.json"
            f"?access_token={self.mapbox_token}"
        )

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data['features']:
                            details = self._parse_venue_details(data['features'][0])
                            
                            # Cache the details
                            self.redis_client.setex(
                                cache_key,
                                self.cache_ttl,
                                json.dumps(details)
                            )
                            
                            return details
        except Exception as e:
            logger.error(f"Error fetching venue details: {str(e)}")
            return None

    def _parse_venue_details(self, feature: Dict) -> Dict:
        """Parse detailed venue information from Mapbox feature."""
        return {
            'name': feature.get('text', ''),
            'place_id': feature.get('id', ''),
            'coordinates': {
                'lat': feature['center'][1],
                'lng': feature['center'][0]
            },
            'address': feature.get('place_name', ''),
            'category': feature.get('properties', {}).get('category', ''),
            'features': self._extract_venue_features(feature),
            'contact': {
                'phone': feature.get('properties', {}).get('tel', ''),
                'website': feature.get('properties', {}).get('website', '')
            },
            'hours': self._parse_opening_hours(feature.get('properties', {}).get('hours', {}))
        }

    def _parse_opening_hours(self, hours_data: Dict) -> Dict:
        """Parse opening hours from Mapbox data."""
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        parsed_hours = {}
        
        for day in days:
            if day in hours_data:
                parsed_hours[day] = hours_data[day]
            else:
                parsed_hours[day] = 'closed'
                
        return parsed_hours

def get_all_venues():
    venues_ref = db.collection("venues")
    docs = venues_ref.stream()
    return [doc.to_dict() for doc in docs]

def get_venue_by_id(venue_id: str):
    doc = db.collection("venues").document(venue_id).get()
    return doc.to_dict() if doc.exists else None 