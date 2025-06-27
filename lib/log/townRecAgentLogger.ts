import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join(process.cwd(), 'logs', 'townRecAgent.log');

export function logTownRecAgentInteraction(entry: {
  userId: string;
  query: string;
  response: string;
  timestamp?: string;
}) {
  const logEntry = {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  const line = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(LOG_PATH, line, 'utf8');
} 