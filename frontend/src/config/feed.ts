/**
 * Feed Configuration and Feature Flags
 * Handles SEL-Highlight blended ranking with configurable weights
 */

// Feature flag interface
declare global {
  interface Window {
    __flags?: Record<string, boolean>;
    __config?: Record<string, string | number>;
  }
}

/**
 * Check if SEL blend feature is enabled
 */
export function isSelBlendEnabled(): boolean {
  return window.__flags?.['feed.selBlend.v1'] === true;
}

/**
 * Get default weights for blended ranking
 * Combines remote config defaults with user preferences
 */
export function getDefaultWeights(userSelWeight?: number): {
  sel: number;
  engagement: number;
  recency: number;
} {
  // Remote config defaults (fallback to sensible defaults)
  const selDefault = Number(window.__config?.SEL_WEIGHT_DEFAULT ?? 0.35);
  const engDefault = Number(window.__config?.HIGHLIGHT_WEIGHT_DEFAULT ?? 0.65);
  
  // User override bias (how much user preference overrides default)
  const bias = 0.5;
  
  // Calculate final SEL weight
  const sel = userSelWeight != null 
    ? (selDefault * (1 - bias) + userSelWeight * bias)
    : selDefault;
    
  // Ensure weights sum to 1
  const engagement = Math.max(0, 1 - sel - 0.15); // Reserve 15% for recency
  const recency = 0.15;
  
  return { sel, engagement, recency };
}

/**
 * Get A/B test assignment for user
 */
export function getAbAssignment(userId: string): 'A' | 'B' | 'C' {
  // Simple hash-based assignment for consistency
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const bucket = Math.abs(hash) % 100;
  
  // A: highlights (30%), B: SEL (30%), C: blended (40%)
  if (bucket < 30) return 'A';
  if (bucket < 60) return 'B';
  return 'C';
}

/**
 * Check if user should see explainability chip
 */
export function shouldShowExplainability(selContribution: number): boolean {
  return selContribution > 0.3; // Show if SEL contributed >30% of score
}
