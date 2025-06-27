import type { NextApiRequest, NextApiResponse } from 'next';
import { createStripeCheckoutSession } from '../../../../lib/payments/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerId, leagueId, amount, successUrl, cancelUrl, email } = req.body;
  if (!playerId || !leagueId || !amount || !successUrl || !cancelUrl) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const session = await createStripeCheckoutSession(playerId, leagueId, amount, successUrl, cancelUrl, email);
    res.status(200).json(session);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
} 