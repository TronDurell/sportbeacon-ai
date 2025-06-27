// API route for Town Rec voice assistant
import type { NextApiRequest, NextApiResponse } from 'next';
import { TownRecAgent } from '../../../lib/ai/TownRecAgent';

const agent = new TownRecAgent();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // TODO: Accept audio input, transcribe with Whisper or browser-native
  // For now, accept { audio, context } and stub transcription
  const { audio, context } = req.body;
  // Stub: pretend Whisper returns this
  const transcript = 'Stubbed voice command';
  const response = await agent.handleQuery(transcript, context);
  res.status(200).json({ transcript, response });
} 