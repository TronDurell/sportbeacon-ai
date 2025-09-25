import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export const WhyChip = ({ reason, contribution, className = '' }) => {
    const config = reasonConfig[reason];
    const contributionPercent = Math.round(contribution * 100);
    return (_jsxs("div", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} ${className}`, title: `${config.description} (${contributionPercent}% influence)`, children: [_jsx("span", { className: "mr-1", role: "img", "aria-label": config.label, children: config.icon }), config.label, contributionPercent > 50 && (_jsxs("span", { className: "ml-1 text-xs opacity-75", children: ["(", contributionPercent, "%)"] }))] }));
};
/**
 * Hook to determine which explainability chip to show
 */
export function useExplainabilityReason(selContribution, engagementContribution, recencyContribution, threshold = 0.3) {
    // Find the highest contributing factor above threshold
    const contributions = [
        { reason: 'resilience', value: selContribution },
        { reason: 'engagement', value: engagementContribution },
        { reason: 'recency', value: recencyContribution }
    ];
    const maxContribution = contributions.reduce((max, current) => current.value > max.value ? current : max);
    if (maxContribution.value > threshold) {
        return {
            reason: maxContribution.reason,
            contribution: maxContribution.value
        };
    }
    return { reason: null, contribution: 0 };
}
export const ExplainabilitySection = ({ post, weights, className = '' }) => {
    // Calculate contribution percentages
    const selContribution = ((post.resilienceScore ?? 0) * weights.sel) /
        ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
    const engagementContribution = (post.engagementScore * weights.engagement) /
        ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
    const recencyContribution = weights.recency /
        ((post.resilienceScore ?? 0) * weights.sel + post.engagementScore * weights.engagement + weights.recency);
    const { reason, contribution } = useExplainabilityReason(selContribution, engagementContribution, recencyContribution);
    if (!reason) {
        return null;
    }
    return (_jsx("div", { className: `mt-2 ${className}`, children: _jsx(WhyChip, { reason: reason, contribution: contribution }) }));
};
export default WhyChip;
