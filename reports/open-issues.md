# Open Issues & Technical Debt

**Date:** January 8, 2025  
**Version:** MVP Location Threads  

## 🚨 Blocking Issues (Must Fix)

### 1. Firebase Test Environment Configuration
- **File:** `functions/src/__tests__/setup.ts`
- **Error:** "Unable to detect a Project Id in the current environment"
- **Impact:** All 60 tests failing
- **Solution:** Set FIREBASE_PROJECT_ID environment variable
- **Effort:** 2 hours

### 2. Test Setup Scripts
- **File:** `functions/src/__tests__/setup.ts:59`
- **Error:** clearFirestoreData function failing
- **Impact:** Test cleanup not working
- **Solution:** Fix Firebase emulator connection in tests
- **Effort:** 1 hour

### 3. CI Pipeline Failures
- **File:** `.github/workflows/ci.yml`
- **Error:** Pipeline will fail on lint and test stages
- **Impact:** CI/CD not functional
- **Solution:** Make lint warnings non-blocking, skip tests temporarily
- **Effort:** 1 hour

## ⚠️ High Priority Issues (Should Fix)

### 4. Firebase API Version Mismatches
- **Files:** `frontend/src/hooks/useLocations.ts`
- **Error:** Using Firebase v8 API (getDocs, getDoc, set, delete, update) instead of v9
- **Impact:** TypeScript errors, potential runtime issues
- **Solution:** Migrate to Firebase v9 modular API
- **Effort:** 4 hours

### 5. Missing Type Exports
- **Files:** 
  - `frontend/src/services/monetizationService.ts`
  - `frontend/src/services/tipService.ts`
  - `frontend/src/services/videoService.ts`
- **Error:** Missing type exports (EarningsSummary, TipResponse, VideoMetadata, etc.)
- **Impact:** TypeScript compilation errors
- **Solution:** Add missing type exports to firebase/types.ts
- **Effort:** 2 hours

### 6. Property Name Mismatches
- **File:** `frontend/src/pages/Winners.tsx`
- **Error:** Using player_id, player_name, total_wins, average_points instead of id, name, win_rate, avg_points
- **Impact:** Runtime errors, incorrect data display
- **Solution:** Update API response interface or fix property names
- **Effort:** 1 hour

### 7. Function Signature Mismatches
- **File:** `frontend/src/services/realApiService.ts`
- **Error:** withErrorMonitoring function signature issues, captureDBError parameter count mismatches
- **Impact:** TypeScript errors, potential runtime issues
- **Solution:** Fix function signatures and parameter counts
- **Effort:** 3 hours

## 🔧 Medium Priority Issues (Nice to Fix)

### 8. Unused Variables and Imports
- **Files:** Multiple files across both packages
- **Error:** 945 lint errors in frontend, 68 in functions
- **Impact:** Code quality, bundle size
- **Solution:** Remove unused imports and variables
- **Effort:** 3 hours

### 9. Empty Catch Blocks
- **Files:** Multiple files across both packages
- **Error:** Empty catch blocks with unused error variables
- **Impact:** Poor error handling
- **Solution:** Add proper error handling or remove unused error variables
- **Effort:** 2 hours

### 10. Explicit Any Types
- **Files:** Multiple files across both packages
- **Error:** 825 warnings about explicit any types
- **Impact:** Type safety
- **Solution:** Replace with proper types
- **Effort:** 4 hours

### 11. React Hook Dependencies
- **Files:** Multiple React components
- **Error:** Missing dependencies in useEffect and useCallback hooks
- **Impact:** Potential bugs, stale closures
- **Solution:** Add missing dependencies or use useCallback/useMemo
- **Effort:** 2 hours

### 12. Line Length Violations
- **Files:** Multiple files across both packages
- **Error:** Lines exceeding 120 character limit
- **Impact:** Code readability
- **Solution:** Break long lines
- **Effort:** 1 hour

## 📝 Low Priority Issues (Technical Debt)

### 13. Jest Configuration Issues
- **File:** `functions/jest.config.js`
- **Error:** 'module' is not defined, ESLint expecting ES modules
- **Impact:** Lint warnings
- **Solution:** Add proper ESLint configuration for CommonJS files
- **Effort:** 30 minutes

### 14. Test Files with Unused Expressions
- **Files:** Multiple test files in functions package
- **Error:** Expected assignment or function call instead of expression
- **Impact:** Lint errors
- **Solution:** Fix test assertions
- **Effort:** 1 hour

### 15. Duplicate Export Declarations
- **File:** `frontend/src/services/realApiService.ts`
- **Error:** Export declaration conflicts
- **Impact:** TypeScript errors
- **Solution:** Remove duplicate exports
- **Effort:** 30 minutes

### 16. Missing Properties on Types
- **Files:** Multiple files
- **Error:** Properties like skills, achievements, xp, stats missing on PlayerProfile
- **Impact:** TypeScript errors
- **Solution:** Add missing properties to type definitions
- **Effort:** 1 hour

### 17. Security Config Issues
- **File:** `frontend/src/services/securityService.ts`
- **Error:** SECURITY_EVENTS exported as type but used as value
- **Impact:** TypeScript errors
- **Solution:** Fix export/import of SECURITY_EVENTS
- **Effort:** 30 minutes

## 🎯 Priority Summary

### Immediate (Blocking Deployment)
1. Firebase test environment configuration (2h)
2. Test setup scripts (1h)
3. CI pipeline fixes (1h)

### Short Term (Post-MVP)
4. Firebase API version mismatches (4h)
5. Missing type exports (2h)
6. Property name mismatches (1h)
7. Function signature mismatches (3h)

### Medium Term (Technical Debt)
8. Unused variables and imports (3h)
9. Empty catch blocks (2h)
10. Explicit any types (4h)
11. React hook dependencies (2h)
12. Line length violations (1h)

### Long Term (Code Quality)
13. Jest configuration issues (30m)
14. Test files with unused expressions (1h)
15. Duplicate export declarations (30m)
16. Missing properties on types (1h)
17. Security config issues (30m)

## 📊 Effort Estimation

- **Total Blocking Issues:** 4 hours
- **Total High Priority Issues:** 10 hours
- **Total Medium Priority Issues:** 12 hours
- **Total Low Priority Issues:** 4.5 hours
- **Grand Total:** 30.5 hours

## 🚀 Recommended Approach

1. **Fix blocking issues first** (4h) - Required for deployment
2. **Address high priority issues** (10h) - Required for production stability
3. **Plan medium priority cleanup sprint** (12h) - Technical debt reduction
4. **Address low priority issues** (4.5h) - Code quality improvements

---

*This report was generated from lint, typecheck, and test analysis.*
