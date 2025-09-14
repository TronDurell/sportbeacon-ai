# Phase H Security Remediation - Rollback Guide

**Date:** September 13, 2025  
**Branch:** `chore/phase-h-security-remediation`

## Rollback Instructions

If rollback is needed, execute these commands:

```bash
# 1. Switch back to main branch
git checkout main

# 2. Delete the security remediation branch
git branch -D chore/phase-h-security-remediation

# 3. Restore previous package versions (if needed)
# The following versions were upgraded during Phase H:

## Root package.json overrides (REMOVE):
{
  "overrides": {
    "axios": "^1.7.7",
    "ws": "^8.18.0", 
    "tar-fs": "^3.0.0",
    "undici": "^6.0.0",
    "esbuild": "^0.25.0",
    "vite": "^5.0.0",
    "cookie": "^0.7.0",
    "tmp": "^0.2.4"
  }
}

## MCP Server package.json (REVERT):
- vitest: "^3.2.4" → "^1.0.0"
- vite: "^5.0.0" → (remove)

## Files to DELETE:
- .github/workflows/security.yml
- .github/dependabot.yml
- frontend/src/lib/http.ts
- frontend/env.d.ts
- .eslintignore

## Files to RESTORE:
- functions/src/index.ts (remove agent import comments)
- functions/postcss.config.cjs (remove eslint-env comment)

## Security Impact of Rollback:
- Will restore 5 high-severity vulnerabilities
- Will restore 4 moderate-severity vulnerabilities  
- Production dependencies will have vulnerabilities again
- No CI security gates will be in place

## Recommended Alternative:
Instead of full rollback, consider:
1. Keep security overrides and CI workflows
2. Address TypeScript errors incrementally
3. Maintain security posture while fixing build issues
