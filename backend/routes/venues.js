const express = require('express');
const router = express.Router();

// Mock venue data
const mockVenues = [
    {
        id: "v1",
        name: "Downtown Sports Complex",
        sport: ["basketball", "volleyball"],
        coordinates: {
            lat: 40.7128,
            lng: -74.0060
        },
        description: "Modern indoor facility with 4 basketball courts and 2 volleyball courts",
        images: [
            "https://example.com/venue1-1.jpg",
            "https://example.com/venue1-2.jpg"
        ],
        amenities: ["parking", "lockers", "showers"],
        capacity: 200,
        indoor: true
    },
    {
        id: "v2",
        name: "Riverside Soccer Fields",
        sport: ["soccer", "football"],
        coordinates: {
            lat: 40.7589,
            lng: -73.9851
        },
        description: "Three full-size soccer fields with night lighting",
        images: [
            "https://example.com/venue2-1.jpg",
            "https://example.com/venue2-2.jpg"
        ],
        amenities: ["parking", "bleachers", "concessions"],
        capacity: 500,
        indoor: false
    },
    {
        id: "v3",
        name: "Elite Training Center",
        sport: ["basketball", "weightlifting", "boxing"],
        coordinates: {
            lat: 40.7829,
            lng: -73.9654
        },
        description: "Professional training facility with state-of-the-art equipment",
        images: [
            "https://example.com/venue3-1.jpg",
            "https://example.com/venue3-2.jpg"
        ],
        amenities: ["parking", "lockers", "showers", "gym", "cafe"],
        capacity: 150,
        indoor: true
    }
];

// GET /api/venues
router.get('/', (req, res) => {
    // Add query parameter support for filtering
    const { sport, indoor } = req.query;
    
    let filteredVenues = [...mockVenues];
    
    if (sport) {
        filteredVenues = filteredVenues.filter(venue => 
            venue.sport.includes(sport.toLowerCase())
        );
    }
    
    if (indoor !== undefined) {
        const isIndoor = indoor === 'true';
        filteredVenues = filteredVenues.filter(venue => 
            venue.indoor === isIndoor
        );
    }
    
    res.json({
        success: true,
        count: filteredVenues.length,
        data: filteredVenues
    });
});

// GET /api/venues/:id
router.get('/:id', (req, res) => {
    const venue = mockVenues.find(v => v.id === req.params.id);
    
    if (!venue) {
        return res.status(404).json({
            success: false,
            error: 'Venue not found'
        });
    }
    
    res.json({
        success: true,
        data: venue
    });
});

module.exports = router; 