# GitHub Follow-up Issues for SportBeaconAI Stabilization

## Issue 1: TypeScript Signature Fixes

**Title:** `fix(ts): resolve remaining 7 signature mismatches`

**Body:**
```markdown
## Objective
Fix remaining TypeScript signature mismatches to achieve 0 TypeScript errors.

## Checklist
- [ ] Align AuthUser vs User types in DailyDigest
- [ ] TriageAssistant `onDecision` signature match
- [ ] UserWritingStyle types in `useComposerAssist`
- [ ] Drills: `captureEvent` / `captureFeedback` parameter types
- [ ] Add/adjust exported types in Memory SDK if needed
- [ ] Typecheck passes with 0 errors

## Acceptance Criteria
- [ ] `npm run typecheck` passes with 0 errors
- [ ] All function signatures properly typed
- [ ] No implicit `any` types in critical paths

## Priority: High 🔴
```

---

## Issue 2: ESLint App-Only Cleanup

**Title:** `chore(lint): clean app sources; keep scripts/tools ignored`

**Body:**
```markdown
## Objective
Clean up ESLint issues in application source code while maintaining ignore patterns for build artifacts.

## Checklist
- [ ] Remove unused imports/vars from app code
- [ ] Replace `any` hotspots with concrete types
- [ ] Keep scripts/tools/storybook ignored
- [ ] Lint CI remains non-blocking for now
- [ ] Add TypeScript ESLint plugin for better type checking

## Acceptance Criteria
- [ ] ESLint passes on `frontend/src/**/*.{ts,tsx}`
- [ ] ESLint passes on `functions/src/**/*.ts`
- [ ] ESLint passes on `packages/*/src/**/*.ts`
- [ ] No false positives from build artifacts

## Priority: Medium 🟡
```

---

## Issue 3: Node Version Enforcement

**Title:** `build: enforce Node 18.20.x locally & in CI`

**Body:**
```markdown
## Objective
Ensure Node.js 18.20.x is consistently used across all development environments and CI.

## Checklist
- [ ] `.nvmrc` committed ✅
- [ ] `engines.node` present in root ✅
- [ ] Actions pinned to 18.20.x ✅
- [ ] Docs note for devs
- [ ] Update README with Node version requirements
- [ ] Add Node version check to pre-commit hooks

## Acceptance Criteria
- [ ] All developers use Node 18.20.x locally
- [ ] CI consistently uses Node 18.20.x
- [ ] Documentation clearly states Node requirements
- [ ] Pre-commit hooks validate Node version

## Priority: High 🔴
```

---

## Issue 4: Security Updates

**Title:** `sec: patch 5 moderate npm advisories`

**Body:**
```markdown
## Objective
Patch 5 moderate npm security advisories to improve security posture.

## Checklist
- [ ] Run `npm audit` for exact packages
- [ ] Patch or pin safely to non-vulnerable versions
- [ ] Rebuild + smoke verify after updates
- [ ] Update SECURITY_AUDIT.md with resolution details
- [ ] Test affected functionality thoroughly

## Acceptance Criteria
- [ ] `npm audit` shows 0 moderate/high vulnerabilities
- [ ] All builds pass after security updates
- [ ] No functionality regressions
- [ ] Security audit report updated

## Priority: High 🔴
```

---

## Issue 5: Accessibility Improvements

**Title:** `a11y: WCAG AA quick pass`

**Body:**
```markdown
## Objective
Implement quick accessibility wins to improve WCAG AA compliance.

## Checklist
- [ ] Labels for inputs & aria where needed
- [ ] Keyboard focus outlines visible
- [ ] Contrast fixes for text/background
- [ ] Axe run clean on key pages
- [ ] Screen reader compatibility testing
- [ ] Keyboard navigation testing

## Acceptance Criteria
- [ ] Axe-core audit passes on main pages
- [ ] All interactive elements have proper labels
- [ ] Keyboard navigation works throughout app
- [ ] Color contrast meets WCAG AA standards

## Priority: Medium 🟡
```

---

## Issue 6: Bundle Optimization

**Title:** `perf: enforce size budgets & PR diff comments`

**Body:**
```markdown
## Objective
Implement bundle size monitoring and enforcement to prevent regressions.

## Checklist
- [ ] Lock size-limit budgets per critical chunks
- [ ] Add CI step to comment size diff on PR
- [ ] Alert on regressions; block if > threshold
- [ ] Set up bundle analysis reporting
- [ ] Configure size-limit for all workspaces

## Acceptance Criteria
- [ ] Size budgets enforced in CI
- [ ] PR comments show bundle size changes
- [ ] Automatic alerts for size regressions
- [ ] Bundle analysis reports available

## Priority: Medium 🟡
```

---

## Issue 7: Frontend Build Resolution

**Title:** `build: resolve frontend dependency conflicts and build issues`

**Body:**
```markdown
## Objective
Fix frontend build issues and dependency conflicts to enable successful builds.

## Checklist
- [ ] Resolve Vite/React dependency conflicts
- [ ] Fix PostCSS/Tailwind configuration
- [ ] Update frontend package.json dependencies
- [ ] Ensure frontend builds successfully
- [ ] Verify PWA generation works
- [ ] Test frontend build in CI

## Acceptance Criteria
- [ ] `npm -w frontend run build` passes
- [ ] No dependency conflicts in frontend
- [ ] PWA manifest and service worker generated
- [ ] Frontend build works in CI pipeline

## Priority: High 🔴
```

---

## Issue 8: Functions Workspace Setup

**Title:** `build: create functions workspace package.json and build setup`

**Body:**
```markdown
## Objective
Create proper workspace setup for functions directory to enable builds.

## Checklist
- [ ] Create functions/package.json with proper dependencies
- [ ] Set up TypeScript build configuration
- [ ] Configure Firebase Functions build process
- [ ] Add functions to workspace build pipeline
- [ ] Test functions build and deployment

## Acceptance Criteria
- [ ] `npm -w functions run build` passes
- [ ] Functions workspace properly configured
- [ ] Firebase Functions deploy successfully
- [ ] Functions included in CI build pipeline

## Priority: High 🔴
```

---

## Summary
- **Total Issues**: 8
- **High Priority**: 5 issues (TS fixes, Node enforcement, Security, Frontend build, Functions setup)
- **Medium Priority**: 3 issues (ESLint cleanup, A11y, Bundle optimization)
- **Estimated Completion**: 2-3 days for high priority items
