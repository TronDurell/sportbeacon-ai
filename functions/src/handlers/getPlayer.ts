import express from 'express';
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { withGuards } from '../lib/http';
import { validateBody } from '../lib/validate';

const schema = z.object({
  playerId: z.string().uuid(),
  includeStats: z.boolean().optional().default(false)
});

const app = express();
withGuards(app);

app.post('/', async (req, res) => {
  try {
    const { playerId, includeStats } = validateBody(schema, req.body);
    // TODO: business logic - fetch player data
    res.status(200).json({ 
      ok: true, 
      playerId, 
      includeStats,
      player: { id: playerId, name: 'Demo Player' }
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    functions.logger.error('getPlayer error', { msg: e?.message });
    res.status(status).json({ ok: false, error: e?.message ?? 'Internal error' });
  }
});

export const getPlayer = functions.https.onRequest(app);
