import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve(__dirname, '../../agent-interactions.log');

export function logAgentInteraction(prompt: string, response: string, timestamp = Date.now()) {
  const entry = {
    timestamp,
    prompt,
    response,
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
} 