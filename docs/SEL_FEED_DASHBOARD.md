# SEL-Highlight Blended Feed Dashboard

## Overview
This document provides access to the analytics dashboard for the SEL-Highlight blended feed system.

## Dashboard Access
- **Production Dashboard**: [https://sportbeacon-ai.web.app/dashboard/sel-feed](https://sportbeacon-ai.web.app/dashboard/sel-feed)
- **Analytics API**: `/api/analytics/sel-feed`
- **A/B Testing Results**: `/api/analytics/ab-testing`

## Key Metrics

### A/B Testing Cohorts
- **Variant A (30%)**: Highlights-heavy (SEL=0.20, Engagement=0.70, Recency=0.10)
- **Variant B (30%)**: SEL-heavy (SEL=0.50, Engagement=0.40, Recency=0.10)
- **Variant C (40%)**: Blended (SEL=0.35, Engagement=0.55, Recency=0.10)

### Performance Metrics
- **Session Duration**: Average time spent in feed
- **Engagement Rate**: Interactions per session
- **Content Diversity**: SEL vs highlight content distribution
- **User Satisfaction**: Measured via feedback and retention

### Technical Metrics
- **Feed Load Time**: Time to first content render
- **Score Calculation**: Average time for ranking computation
- **Cache Hit Rate**: PWA caching effectiveness
- **Bundle Size**: Chunk sizes and loading performance

## Environment Configuration

### Production Settings
```bash
VITE_SEL_WEIGHT=0.35
VITE_ENGAGEMENT_WEIGHT=0.55
VITE_RECENCY_HALF_LIFE_HOURS=24
VITE_SEL_BLEND_ENABLED=true
```

### A/B Testing Configuration
```javascript
// Remote Config variants
window.__config = {
  'feed.selBlend.v1': true,
  'SEL_WEIGHT_DEFAULT': '0.35',
  'HIGHLIGHT_WEIGHT_DEFAULT': '0.55'
}
```

## Monitoring Alerts
- **High Error Rate**: >5% feed loading failures
- **Performance Regression**: >2s feed load time
- **A/B Test Significance**: Statistical significance thresholds
- **Bundle Size Increase**: >10% chunk size growth

## Troubleshooting
- **Feed Not Loading**: Check feature flag `feed.selBlend.v1`
- **Incorrect Ranking**: Verify environment variables
- **Analytics Missing**: Check telemetry endpoint connectivity
- **A/B Assignment Issues**: Verify user ID consistency

## Contact
- **Technical Issues**: [engineering@sportbeacon.ai](mailto:engineering@sportbeacon.ai)
- **Analytics Questions**: [data@sportbeacon.ai](mailto:data@sportbeacon.ai)
- **Product Feedback**: [product@sportbeacon.ai](mailto:product@sportbeacon.ai)
