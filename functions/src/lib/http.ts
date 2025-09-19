import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import * as functions from 'firebase-functions';

export const withGuards = (app: Express) => {
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: true }));                 // tighten to prod domains later
  app.use(rateLimit({ windowMs: 60_000, max: 60 }));
};

functions.setGlobalOptions({
  region: 'us-central1',
  timeoutSeconds: 60,
  memory: '256MiB',
  maxInstances: 5,
});
