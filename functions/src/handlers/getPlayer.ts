import { Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { withSecurityGuards } from '../lib/http';
import { validateBody, playerQuerySchema } from '../lib/validate';
import * as logger from 'firebase-functions/logger';

export const getPlayer = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(playerQuerySchema, req.body);
    const { playerId, includeStats } = validatedData;
    
    // TODO: Implement actual player fetching logic
    logger.info(`Fetching player: ${playerId}`, { requestId, playerId });
    
    res.status(200).json({ 
      success: true, 
      playerId, 
      includeStats,
      player: { id: playerId, name: 'Demo Player' },
      requestId
    });
  } catch (error: any) {
    if (error.name === 'BadRequest') {
      res.status(400).json({ 
        error: error.message,
        requestId
      });
      return;
    }
    
    logger.error('Get player error:', error, { requestId });
    res.status(500).json({ 
      error: 'Failed to fetch player',
      requestId
    });
  }
}));
