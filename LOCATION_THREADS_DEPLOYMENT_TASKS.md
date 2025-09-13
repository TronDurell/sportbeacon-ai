# 🚀 Location Threads Deployment Readiness Tasks

## 🎯 Objective
Make SportBeaconAI monorepo deployment-ready with Location Threads V1 complete, zero TS/ESLint errors, passing tests, and valid Firestore configuration.

## 📋 Task Breakdown

### Phase 1: Fix Deployment Blockers (Critical)
- [ ] **Task 1.1**: Create ESLint flat configs and remove legacy .eslintrc*
- [ ] **Task 1.2**: Fix TypeScript build errors across all packages
- [ ] **Task 1.3**: Install missing dependencies and dedupe versions
- [ ] **Task 1.4**: Add CI scripts to root package.json

### Phase 2: Complete Location Threads V1 (High Priority)
- [ ] **Task 2.1**: Create Place Profile Screen with tabs
- [ ] **Task 2.2**: Implement Follow/Feed Components
- [ ] **Task 2.3**: Create Home Feed Integration
- [ ] **Task 2.4**: Complete useLocations hooks with infinite scroll

### Phase 3: Testing Suite (Medium Priority)
- [ ] **Task 3.1**: Firestore rules tests
- [ ] **Task 3.2**: Cloud Functions tests
- [ ] **Task 3.3**: Frontend component tests

### Phase 4: Security & Configuration (Medium Priority)
- [ ] **Task 4.1**: Validate Firestore rules coverage
- [ ] **Task 4.2**: Export/confirm firestore.indexes.json
- [ ] **Task 4.3**: Create environment example files

### Phase 5: Documentation & Deployment (Low Priority)
- [ ] **Task 5.1**: Update README with Location Threads section
- [ ] **Task 5.2**: Add local run and deploy steps
- [ ] **Task 5.3**: Final validation and acceptance criteria

## 🚨 Acceptance Criteria (Hard Gates)
- [ ] `pnpm -w check:all` succeeds (lint, type, test, build)
- [ ] Place Profile renders tabs; Composer posts to location; Follow works
- [ ] New location posts fan-out to followers' home feeds ranked
- [ ] Security rules tests pass; Functions tests pass
- [ ] No ESLint flat-config errors; no TS errors
- [ ] README & env examples updated

## 📁 Files to Generate/Update
- `frontend/eslint.config.js` (flat config)
- `functions/eslint.config.js` (flat config)
- `frontend/app/(places)/[locationId]/index.tsx`
- `frontend/app/home/PlacesFeedSection.tsx`
- `frontend/src/components/{FollowLocationButton,LocationComposer,LocationPostCard,PlaceHeader}.tsx`
- `frontend/src/hooks/useLocations.ts` (complete)
- `frontend/src/__tests__/LocationThread.test.tsx`
- `tests/firestore.rules.test.ts`
- `functions/test/{fanout.test.ts,digest.test.ts,moderation.test.ts}`
- Update `firestore.rules`, `firestore.indexes.json`
- Update `package.json` scripts (root, frontend, functions)
- `frontend/.env.example`, `functions/.env.example`
- `README.md` updates

## 🔄 Work Plan (Execute in Order)
1. Fix ESLint flat configs → run `pnpm -w lint:all` until clean
2. Fix TS errors → `pnpm -w typecheck` green
3. Implement missing UI + hooks + feed
4. Confirm functions fan-out/digest and write tests
5. Run rules tests; export indexes
6. `pnpm -w check:all` → green
7. Update README & env examples
