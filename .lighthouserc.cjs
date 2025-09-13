module.exports = {
  ci: {
    collect: {
      staticDistDir: './frontend/dist',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'installable-manifest': 'error',
        'service-worker': 'error',
        'color-contrast': 'warn',
        'content-width': 'warn',
        'csp-xss': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
