const express = require('express');
const router = express.Router();

// Mock player data
const mockPlayers = [
    {
        id: "p1",
        name: "John Smith",
        coordinates: {
            lat: 40.7128,
            lng: -74.0060
        },
        avatar_url: "https://example.com/avatars/john.jpg",
        sport: "basketball",
        status: "active",
        last_active: new Date().toISOString(),
        venue_id: "v1"
    },
    {
        id: "p2",
        name: "Sarah Johnson",
        coordinates: {
            lat: 40.7589,
            lng: -73.9851
        },
        avatar_url: "https://example.com/avatars/sarah.jpg",
        sport: "soccer",
        status: "watching",
        last_active: new Date().toISOString(),
        venue_id: "v2"
    }
];

// GET /api/player-locations
router.get('/', (req, res) => {
    const { sport, status, venue_id } = req.query;
    
    let filteredPlayers = [...mockPlayers];
    
    if (sport) {
        filteredPlayers = filteredPlayers.filter(player => 
            player.sport.toLowerCase() === sport.toLowerCase()
        );
    }
    
    if (status) {
        filteredPlayers = filteredPlayers.filter(player => 
            player.status === status
        );
    }
    
    if (venue_id) {
        filteredPlayers = filteredPlayers.filter(player => 
            player.venue_id === venue_id
        );
    }
    
    res.json({
        success: true,
        count: filteredPlayers.length,
        data: filteredPlayers
    });
});

module.exports = router; 