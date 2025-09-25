/**
 * A/B Testing Framework for Feed Ranking
 * Assigns users to different ranking variants for experimentation
 */

export type AbVariant = 'A' | 'B' | 'C';

export interface AbAssignment {
  variant: AbVariant;
  userId: string;
  assignedAt: number;
}

/**
 * Get A/B test assignment for user
 * Uses consistent hash-based assignment for user stability
 */
export function getAbAssignment(userId: string): AbAssignment {
  // Simple hash-based assignment for consistency
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const bucket = Math.abs(hash) % 100;
  
  // A: highlights (30%), B: SEL (30%), C: blended (40%)
  let variant: AbVariant;
  if (bucket < 30) {
    variant = 'A';
  } else if (bucket < 60) {
    variant = 'B';
  } else {
    variant = 'C';
  }
  
  return {
    variant,
    userId,
    assignedAt: Date.now()
  };
}

/**
 * Log A/B assignment to analytics
 */
export function logAbAssignment(assignment: AbAssignment): void {
  // Check if analytics is available
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track('ab_assign', {
      variant: assignment.variant,
      userId: assignment.userId,
      assignedAt: assignment.assignedAt,
      experiment: 'feed_ranking_v1'
    });
  }
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[A/B] User ${assignment.userId} assigned to variant ${assignment.variant}`);
  }
}

/**
 * Get ranking configuration based on A/B variant
 */
export function getVariantConfig(variant: AbVariant): {
  selWeight: number;
  engagementWeight: number;
  recencyWeight: number;
  description: string;
} {
  switch (variant) {
    case 'A': // Highlights-focused
      return {
        selWeight: 0.1,
        engagementWeight: 0.8,
        recencyWeight: 0.1,
        description: 'Highlights-focused ranking'
      };
      
    case 'B': // SEL-focused
      return {
        selWeight: 0.7,
        engagementWeight: 0.2,
        recencyWeight: 0.1,
        description: 'SEL-focused ranking'
      };
      
    case 'C': // Blended (default)
    default:
      return {
        selWeight: 0.35,
        engagementWeight: 0.5,
        recencyWeight: 0.15,
        description: 'Blended SEL-engagement ranking'
      };
  }
}

/**
 * Initialize A/B testing for user
 * Gets assignment and logs it to analytics
 */
export function initializeAbTesting(userId: string): AbAssignment {
  const assignment = getAbAssignment(userId);
  logAbAssignment(assignment);
  
  // Store assignment in localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('ab_assignment', JSON.stringify(assignment));
  }
  
  return assignment;
}

/**
 * Get cached A/B assignment or create new one
 */
export function getCachedAbAssignment(userId: string): AbAssignment {
  if (typeof window === 'undefined') {
    return getAbAssignment(userId);
  }
  
  try {
    const cached = localStorage.getItem('ab_assignment');
    if (cached) {
      const assignment = JSON.parse(cached);
      // Verify the assignment is for the current user
      if (assignment.userId === userId) {
        return assignment;
      }
    }
  } catch (error) {
    console.warn('Failed to parse cached A/B assignment:', error);
  }
  
  // Create new assignment if cache is invalid
  return initializeAbTesting(userId);
}

/**
 * Check if user should see explainability features
 */
export function shouldShowExplainability(variant: AbVariant): boolean {
  // Show explainability for SEL-focused and blended variants
  return variant === 'B' || variant === 'C';
}

/**
 * Get experiment metadata for reporting
 */
export function getExperimentMetadata(): {
  name: string;
  version: string;
  variants: AbVariant[];
  startDate: string;
} {
  return {
    name: 'feed_ranking_v1',
    version: '1.0.0',
    variants: ['A', 'B', 'C'],
    startDate: '2025-01-08'
  };
}
