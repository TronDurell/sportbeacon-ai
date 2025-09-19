import express from 'express';
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { withGuards } from '../lib/http';
import { validateBody } from '../lib/validate';

const schema = z.object({
  tid: z.string().min(1),
  videoUrl: z.string().url(),
  model: z.enum(['pose','speed','balance']).default('pose')
});

const app = express();
withGuards(app);

app.post('/', async (req, res) => {
  try {
    const { tid, videoUrl, model } = validateBody(schema, req.body);
    // TODO: business logic
    res.status(200).json({ ok: true, tid, model });
  } catch (e: any) {
    const status = e?.status ?? 500;
    functions.logger.error('videoAnalyze error', { msg: e?.message });
    res.status(status).json({ ok: false, error: e?.message ?? 'Internal error' });
  }
});

export const videoAnalyze = functions.https.onRequest(app);
