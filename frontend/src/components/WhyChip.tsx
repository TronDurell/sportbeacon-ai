/**
 * Explainability Chip Component
 * Shows users why they're seeing specific content in their feed
 */

import React from 'react';

export interface WhyChipProps {
  reason: 'resilience' | 'engagement' | 'recency' | 'trending';
  contribution: number; // 0-1, how much this factor contributed to ranking
  className?: string;
}

const reasonConfig = {
  resilience: {
    label: 'Promoting resilience',
    icon: '🌱',
    color: 'bg-green-100 text-green-800',
    description: 'This content supports social-emotional learning and resilience building'
  },
  engagement: {
    label: 'Popular content',
    icon: '🔥',
    color: 'bg-orange-100 text-orange-800',
    description: 'This content is getting lots of engagement from the community'
  },
  recency: {
    label: 'Fresh content',
    icon: '🆕',
    color: 'bg-blue-100 text-blue-800',
    description: 'This is recent content to keep your feed up-to-date'
  },
  trending: {
    label: 'Trending now',
    icon: '📈',
    color: 'bg-purple-100 text-purple-800',
    description: 'This content is trending in your community'
  }
};

export const WhyChip: React.FC<WhyChipProps> = ({ 
  reason, 
  contribution, 
  className = '' 
}) => {
  const config = reasonConfig[reason];
  const contributionPercent = Math.round(contribution * 100);
  
  return (
    <div 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}
      title={`${config.description} (${contributionPercent}% influence)`}
    >
      <span className="mr-1" role="img" aria-label={config.label}>
        {config.icon}
      </span>
      {config.label}
      {contributionPercent > 50 && (
        <span className="ml-1 text-xs opacity-75">
          ({contributionPercent}%)
        </span>
      )}
    </div>
  );
};

/**
 * Hook to determine which explainability chip to show
 */
export function useExplainabilityReason(
  selContribution: number,
  engagementContribution: number,
  recencyContribution: number,
  threshold: number = 0.3
): { reason: WhyChipProps['reason'] | null; contribution: number } {
  // Find the highest contributing factor above threshold
  const contributions = [
    { reason: 'resilience' as const, value: selContribution },
    { reason: 'engagement' as const, value: engagementContribution },
    { reason: 'recency' as const, value: recencyContribution }
  ];
  
  const maxContribution = contributions.reduce((max, current) => 
    current.value > max.value ? current : max
  );
  
  if (maxContribution.value > threshold) {
    return {
      reason: maxContribution.reason,
      contribution: maxContribution.value
    };
  }
  
  return { reason: null, contribution: 0 };
}

/**
 * Explainability section for feed items
 */
export interface ExplainabilitySectionProps {
  post: {
    resilienceScore?: number;
    engagementScore: number;
    ts: number;
  };
  weights: {
    sel: number;
    engagement: number;
    recency: number;
  };
  className?: string;
}

export const ExplainabilitySection: React.FC<ExplainabilitySectionProps> = ({
  post,
  weights,
  className = ''
}) => {
  // Calculate contribution percentages
  const selContribution = ((post.resilienceScore ?? 0) * weights.sel) / 
    ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
  
  const engagementContribution = (post.engagementScore * weights.engagement) / 
    ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
  
  const recencyContribution = weights.recency / 
    ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
  
  const { reason, contribution } = useExplainabilityReason(
    selContribution,
    engagementContribution,
    recencyContribution
  );
  
  if (!reason) {
    return null;
  }
  
  return (
    <div className={`mt-2 ${className}`}>
      <WhyChip reason={reason} contribution={contribution} />
    </div>
  );
};

export default WhyChip;
