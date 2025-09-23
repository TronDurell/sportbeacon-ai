import { Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { withSecurityGuards } from '../lib/http';
import { validateBody } from '../lib/validate';
import { z } from 'zod';
import * as logger from 'firebase-functions/logger';

const schema = z.object({
  tid: z.string().min(1),
  videoUrl: z.string().url(),
  model: z.enum(['pose','speed','balance']).default('pose')
});

export const videoAnalyze = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    const { tid, videoUrl, model } = validateBody(schema, req.body);
    
    logger.info(`Video analysis request: ${tid}`, { requestId, tid, model });
    
    // TODO: Implement actual video analysis logic
    res.status(200).json({ 
      ok: true, 
      tid, 
      model,
      analysis: {
        pose: { score: 85, confidence: 0.9 },
        speed: { score: 78, confidence: 0.85 },
        balance: { score: 82, confidence: 0.88 }
      },
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
    
    logger.error('Video analysis error:', error, { requestId });
    res.status(500).json({ 
      ok: false, 
      error: error?.message ?? 'Internal error',
      requestId
    });
  }
}));
