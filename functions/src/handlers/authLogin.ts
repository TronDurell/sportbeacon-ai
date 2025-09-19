import express from 'express';
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { withGuards } from '../lib/http';
import { validateBody } from '../lib/validate';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional().default(false)
});

const app = express();
withGuards(app);

app.post('/', async (req, res) => {
  try {
    const { email, password, rememberMe } = validateBody(schema, req.body);
    // TODO: business logic - authenticate user
    res.status(200).json({ 
      ok: true, 
      user: { email, id: 'demo-user-id' },
      token: 'demo-token'
    });
  } catch (e: any) {
    const status = e?.status ?? 500;
    functions.logger.error('authLogin error', { msg: e?.message });
    res.status(status).json({ ok: false, error: e?.message ?? 'Internal error' });
  }
});

export const authLogin = functions.https.onRequest(app);
