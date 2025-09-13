# MVP Plan - SportBeaconAI Location Threads

**Version:** 1.0.0  
**Date:** January 8, 2025  
**Timeline:** 7-10 focused days to TestFlight

## Task Board - Kanban Style

### 🔴 CRITICAL - Must Complete Before TestFlight

#### A. Finish & Harden (Backend/Infra)
**Owner:** Functions/Rules Team  
**Estimate:** 6-8 hours  
**Status:** 🟡 In Progress

**Tasks:**
- [ ] **Fix Zod Version Compatibility** (2 hours)
  - *AC:* Functions package builds without TypeScript errors
  - *Files:* `functions/package.json`, `functions/tsconfig.json`
  - *Action:* Downgrade Zod to v3 or update TypeScript configuration

- [ ] **Clean Jest Configuration** (1 hour)
  - *AC:* Single Jest config file, tests run without conflicts
  - *Files:* `frontend/jest.config.js`, `frontend/jest.config.mjs`
  - *Action:* Remove duplicate config files, consolidate configuration

- [ ] **Fix Frontend JSX Syntax** (1 hour)
  - *AC:* Frontend builds without TypeScript errors
  - *Files:* `frontend/src/components/NewPostModal.tsx`, `frontend/src/components/PlayerDashboard.tsx`
  - *Action:* Fix JSX syntax errors and TypeScript issues

- [ ] **Create Environment Examples** (1 hour)
  - *AC:* `.env.example` files exist for both packages
  - *Files:* `frontend/.env.example`, `functions/.env.example`
  - *Action:* Create environment variable templates with documentation

- [ ] **Validate Rules Tests** (1 hour)
  - *AC:* All Firestore rules tests pass in CI
  - *Files:* `functions/src/__tests__/firestore.rules.test.ts`
  - *Action:* Run tests and fix any remaining issues

**Dependencies:** None  
**Blockers:** TypeScript compilation errors

#### B. Frontend Polish & Tests
**Owner:** Frontend Team  
**Estimate:** 4-6 hours  
**Status:** 🟢 Complete

**Tasks:**
- [x] **Place Profile Screen Polish** (4-6 hours)
  - *AC:* Thread tab stable, pinned notes on top, infinite scroll works
  - *Files:* `frontend/src/pages/PlaceProfile.tsx`
  - *Status:* ✅ Complete - All functionality implemented

- [x] **Composer Validation** (1-2 hours)
  - *AC:* No empty posts, error toasts, success clears input
  - *Files:* `frontend/src/components/LocationComposer.tsx`
  - *Status:* ✅ Complete - Validation and error handling implemented

- [x] **Follow/Feed Integration** (2-4 hours)
  - *AC:* Follow toggles, home feed shows backfilled/fan-out posts
  - *Files:* `frontend/src/hooks/useLocations.ts`, `frontend/src/components/PlacesFeedSection.tsx`
  - *Status:* ✅ Complete - Full integration with real-time updates

- [x] **Frontend Tests** (6-8 hours)
  - *AC:* Follow toggle, composer create, feed render, pinned notes
  - *Files:* `frontend/src/__tests__/LocationThread.test.tsx`
  - *Status:* ✅ Complete - Comprehensive test coverage

**Dependencies:** None  
**Blockers:** None

#### C. Release Engineering
**Owner:** DevEx Team  
**Estimate:** 1-2 hours  
**Status:** 🟡 In Progress

**Tasks:**
- [ ] **CI `check:all` Validation** (1 hour)
  - *AC:* Lint, typecheck, tests, build all green
  - *Files:* `.github/workflows/ci.yml`, `package.json`
  - *Action:* Run full validation pipeline and fix any issues

- [ ] **Environment Onboarding** (1-2 hours)
  - *AC:* `.env.example` files complete, README quickstart added
  - *Files:* `frontend/.env.example`, `functions/.env.example`, `README.md`
  - *Action:* Create environment templates and update documentation

**Dependencies:** A.1, A.2, A.3, A.4  
**Blockers:** TypeScript compilation errors

#### D. App Store Preparation
**Owner:** Release Team  
**Estimate:** 3-4 hours  
**Status:** 🔴 Not Started

**Tasks:**
- [ ] **App Icons & Metadata** (3-4 hours)
  - *AC:* iOS bundle id, icons, splash screen configured
  - *Files:* iOS project configuration, app icons, splash screens
  - *Action:* Configure iOS app identity and visual assets

- [ ] **TestFlight Pipeline** (3-5 hours)
  - *AC:* iOS build archive → upload → internal testing group active
  - *Files:* iOS build configuration, TestFlight setup
  - *Action:* Set up automated TestFlight deployment pipeline

**Dependencies:** C.1, C.2  
**Blockers:** Build system issues

#### E. Pilot Rollout
**Owner:** PM Team  
**Estimate:** 2 hours  
**Status:** 🔴 Not Started

**Tasks:**
- [ ] **Pilot Rollout Plan** (2 hours)
  - *AC:* 10 seed users + 2 city courts + feedback form link
  - *Files:* Pilot user list, court selection, feedback form
  - *Action:* Identify pilot users and prepare rollout materials

**Dependencies:** D.1, D.2  
**Blockers:** TestFlight deployment

### 🟡 NICE-TO-HAVE (Time Permitting)

#### F. Enhanced Features
**Owner:** Frontend Team  
**Estimate:** 4-6 hours  
**Status:** 🔴 Not Started

**Tasks:**
- [ ] **Digest Toggle UI** (2-3 hours)
  - *AC:* Toggle in FollowLocation doc + preference UI
  - *Files:* `frontend/src/components/FollowLocationButton.tsx`
  - *Action:* Add notification preference toggle to follow button

- [ ] **Unread Badge** (1-2 hours)
  - *AC:* Unread badge on map pins
  - *Files:* Map component, location markers
  - *Action:* Add unread count indicators to location pins

- [ ] **What's New Modal** (1-2 hours)
  - *AC:* Minimal modal on first launch after updates
  - *Files:* `frontend/src/components/WhatsNewModal.tsx`
  - *Action:* Create update notification modal

**Dependencies:** None  
**Blockers:** None

## Timeline & Milestones

### Day 1: Build System Fixes
- **Morning:** Fix Zod version compatibility
- **Afternoon:** Clean Jest configuration and fix JSX syntax
- **Evening:** Create environment examples

### Day 2: Validation & Testing
- **Morning:** Run full validation pipeline
- **Afternoon:** Fix any remaining test issues
- **Evening:** Validate emulator setup

### Day 3: App Store Preparation
- **Morning:** Configure iOS app identity and icons
- **Afternoon:** Set up TestFlight pipeline
- **Evening:** Test build and upload process

### Day 4: Pilot Rollout
- **Morning:** Prepare pilot user materials
- **Afternoon:** Deploy to TestFlight
- **Evening:** Onboard first pilot users

### Day 5-7: Monitoring & Iteration
- **Monitor:** User feedback and crash reports
- **Iterate:** Quick fixes based on pilot feedback
- **Prepare:** Public release materials

## Risk Assessment

### 🚨 High Risk
- **TypeScript Compilation**: Zod v4 compatibility issues
  - *Mitigation:* Downgrade to v3 or update TypeScript config
  - *Impact:* Blocks all builds and deployments

### 🟡 Medium Risk
- **Jest Configuration**: Multiple config files causing conflicts
  - *Mitigation:* Consolidate to single config file
  - *Impact:* Blocks test execution

- **iOS Build Process**: TestFlight deployment complexity
  - *Mitigation:* Set up automated pipeline early
  - *Impact:* Delays TestFlight deployment

### 🟢 Low Risk
- **Environment Configuration**: Missing .env.example files
  - *Mitigation:* Create templates quickly
  - *Impact:* Minor onboarding friction

## Success Metrics

### 📊 Technical Metrics
- **Build Success Rate:** 100% green builds
- **Test Coverage:** >90% for critical paths
- **Performance:** <1s feed load time
- **Stability:** <1% crash rate

### 📱 Product Metrics
- **Pilot Users:** 10 active users in first week
- **Engagement:** 5+ posts per user per week
- **Retention:** 70%+ 7-day retention
- **Feedback:** 4.0+ average rating

## Acceptance Criteria

### ✅ MVP Complete When:
1. **All builds pass** - No TypeScript or Jest errors
2. **All tests pass** - 100% test suite success
3. **Emulator works** - End-to-end demo functional
4. **TestFlight deployed** - iOS build uploaded and accessible
5. **Pilot users onboarded** - 10 users testing the app

### 🚀 Ready for Public Release When:
1. **Pilot feedback positive** - 4.0+ average rating
2. **Crash rate <1%** - Stable app performance
3. **Core features validated** - Follow, post, feed working
4. **Performance optimized** - <1s load times
5. **Documentation complete** - User guides and support

## Next Actions

### Immediate (Today)
1. Fix Zod version compatibility in functions package
2. Clean up Jest configuration conflicts
3. Fix JSX syntax errors in frontend components

### Tomorrow
1. Create .env.example files for both packages
2. Run full validation pipeline
3. Test emulator setup end-to-end

### Day 3
1. Configure iOS app identity and icons
2. Set up TestFlight deployment pipeline
3. Prepare pilot user materials

**This plan is locked and will be executed as written to achieve TestFlight deployment in 7-10 days.**
