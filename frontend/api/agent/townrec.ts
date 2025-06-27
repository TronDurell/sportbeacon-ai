// API route for Town Rec agent chat
import type { NextApiRequest, NextApiResponse } from 'next';
import { TownRecAgent } from '../../../lib/ai/TownRecAgent';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { query, userRole = 'coordinator' } = req.body;
  const db = getFirestore(app);

  // Load all relevant data for context
  const [leaguesSnap, teamsSnap, playersSnap, coachesSnap, gamesSnap, practicesSnap, facilitiesSnap, paymentsSnap, regionalLeaguesSnap, schoolsSnap] = await Promise.all([
    getDocs(collection(db, 'leagues')),
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'coaches')),
    getDocs(collection(db, 'games')),
    getDocs(collection(db, 'practices')),
    getDocs(collection(db, 'facilities')),
    getDocs(collection(db, 'payments')),
    getDocs(collection(db, 'regionalLeagues')),
    getDocs(collection(db, 'schools')),
  ]);

  const data = {
    leagues: leaguesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    teams: teamsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    players: playersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    coaches: coachesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    games: gamesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    practices: practicesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    facilities: facilitiesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    payments: paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    regionalLeagues: regionalLeaguesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    schools: schoolsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  };

  const agent = new TownRecAgent({ userRole, sessionMemory: {} });
  const result = agent.answer(query, data);
  res.json(result);
} 