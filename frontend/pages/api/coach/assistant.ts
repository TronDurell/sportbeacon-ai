import type { NextApiRequest, NextApiResponse } from 'next';
import { TownRecAgent } from '../../../lib/ai/TownRecAgent';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { message, userId = 'demo' } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });
  const db = getFirestore(app);

  // Load player/team/league data for context
  const [playersSnap, teamsSnap, leaguesSnap] = await Promise.all([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'leagues')),
  ]);
  const data = {
    players: playersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    teams: teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    leagues: leaguesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };

  // Use TownRecAgent for drill suggestions and chat
  const agent = new TownRecAgent({ userRole: 'coach', sessionMemory: {} });
  const result = agent.answer(message, data);
  res.json(result);
} 