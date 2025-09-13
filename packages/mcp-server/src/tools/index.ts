/**
 * MCP Tools Index
 * Exports all available tools for the MCP server
 */

export { getPlayerStats } from './getPlayerStats.js';
export { listPendingSubmissions } from './listPendingSubmissions.js';
export { submitStat } from './submitStat.js';
export { verifyStat } from './verifyStat.js';
export { calculateKPI } from './calculateKPI.js';
export { exportDataset } from './exportDataset.js';
export { sendNotification } from './sendNotification.js';
export { updateMemory } from './updateMemory.js';

/**
 * Setup all tools with their configurations
 */
export function setupTools() {
  // This function can be used to initialize tool-specific configurations
  // For now, tools are self-contained and don't need additional setup
  console.log('✅ MCP Tools initialized');
}
