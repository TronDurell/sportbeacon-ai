const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// In-memory cache for highlights
const highlightStore = new Map();

// Helper function to run Python highlight tagging engine
async function generateHighlights(gameLog) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, '..', 'highlight_tagging_engine.py')
        ]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.stdin.write(JSON.stringify(gameLog));
        pythonProcess.stdin.end();

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python process exited with code ${code}: ${errorData}`));
                return;
            }
            try {
                const highlights = JSON.parse(outputData);
                resolve(highlights);
            } catch (error) {
                reject(new Error(`Failed to parse Python output: ${error.message}`));
            }
        });
    });
}

// POST /api/highlights/generate
router.post('/generate', async (req, res) => {
    const { game_id, actions } = req.body;
    
    if (!game_id || !actions || !Array.isArray(actions)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid request body. Required: game_id and actions array'
        });
    }
    
    try {
        // Process actions through highlight tagging engine
        const highlights = await generateHighlights(actions);
        
        // Store highlights with game_id
        if (!highlightStore.has(game_id)) {
            highlightStore.set(game_id, []);
        }
        highlightStore.get(game_id).push(...highlights);
        
        res.json({
            success: true,
            count: highlights.length,
            data: highlights
        });
    } catch (error) {
        console.error('Error generating highlights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate highlights'
        });
    }
});

// GET /api/highlights/:player_id
router.get('/:player_id', (req, res) => {
    const { player_id } = req.params;
    const { 
        type,
        team_id,
        game_id,
        limit = 10,
        sort = 'recent'  // 'recent' or 'impact'
    } = req.query;
    
    try {
        // Collect all highlights for the player
        let playerHighlights = [];
        for (const [gameId, gameHighlights] of highlightStore.entries()) {
            // Filter by game if specified
            if (game_id && gameId !== game_id) continue;
            
            // Add matching highlights
            playerHighlights.push(
                ...gameHighlights.filter(h => h.player_id === player_id)
            );
        }
        
        // Apply filters
        if (type) {
            playerHighlights = playerHighlights.filter(h => h.highlight_type === type);
        }
        
        if (team_id) {
            playerHighlights = playerHighlights.filter(h => h.team_id === team_id);
        }
        
        // Sort highlights
        if (sort === 'impact') {
            playerHighlights.sort((a, b) => 
                (b.score_impact * b.confidence_score) - 
                (a.score_impact * a.confidence_score)
            );
        } else {
            // Default to recent
            playerHighlights.sort((a, b) => {
                const aTime = new Date(`2024-01-01T${a.game_time}`);
                const bTime = new Date(`2024-01-01T${b.game_time}`);
                return bTime - aTime;
            });
        }
        
        // Apply limit
        playerHighlights = playerHighlights.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            count: playerHighlights.length,
            data: playerHighlights
        });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch highlights'
        });
    }
});

// GET /api/highlights/game/:game_id
router.get('/game/:game_id', (req, res) => {
    const { game_id } = req.params;
    const { 
        type,
        player_id,
        team_id,
        sort = 'time'  // 'time', 'impact', or 'confidence'
    } = req.query;
    
    try {
        let gameHighlights = highlightStore.get(game_id) || [];
        
        // Apply filters
        if (type) {
            gameHighlights = gameHighlights.filter(h => h.highlight_type === type);
        }
        
        if (player_id) {
            gameHighlights = gameHighlights.filter(h => h.player_id === player_id);
        }
        
        if (team_id) {
            gameHighlights = gameHighlights.filter(h => h.team_id === team_id);
        }
        
        // Sort highlights
        switch (sort) {
            case 'impact':
                gameHighlights.sort((a, b) => b.score_impact - a.score_impact);
                break;
            case 'confidence':
                gameHighlights.sort((a, b) => b.confidence_score - a.confidence_score);
                break;
            default:
                // Sort by game time
                gameHighlights.sort((a, b) => {
                    const aTime = new Date(`2024-01-01T${a.game_time}`);
                    const bTime = new Date(`2024-01-01T${b.game_time}`);
                    return bTime - aTime;
                });
        }
        
        res.json({
            success: true,
            count: gameHighlights.length,
            data: gameHighlights
        });
    } catch (error) {
        console.error('Error fetching game highlights:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch game highlights'
        });
    }
});

module.exports = router; 