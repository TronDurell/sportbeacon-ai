import { Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { withSecurityGuards } from '../lib/http';
import { validateBody, authLoginSchema } from '../lib/validate';
import * as logger from 'firebase-functions/logger';

export const authLogin = onRequest(withSecurityGuards(async (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body
    const validatedData = validateBody(authLoginSchema, req.body);
    const { email, password } = validatedData;
    
    // TODO: Implement actual authentication logic
    // For now, return a demo response
    logger.info(`Auth login attempt for: ${email}`, { requestId });
    
    res.status(200).json({ 
      success: true,
      user: { email, id: 'demo-user-id' },
      token: 'demo-token',
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
    
    logger.error('Auth login error:', error, { requestId });
    res.status(500).json({ 
      error: 'Authentication failed',
      requestId
    });
  }
}));
