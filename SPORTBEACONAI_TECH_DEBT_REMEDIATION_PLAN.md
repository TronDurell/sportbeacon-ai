# SportBeaconAI Tech Debt Remediation Plan

**Plan Date:** December 2024  
**Based On:** SPORTBEACONAI_COMPREHENSIVE_AUDIT_REPORT.md  
**Priority Focus:** Security → Testing → Performance → Architecture → Code Quality  
**Estimated Timeline:** 6-8 weeks (Critical Path: 2-3 weeks)

---

## 📋 TASK BOARD OVERVIEW

### **Kanban Status Categories:**
- **🔴 Backlog** - New tasks requiring assignment
- **🟡 In Progress** - Currently being worked on
- **🟢 Ready for Review** - Awaiting PR review and merge
- **✅ Done** - Completed and deployed

### **Priority Levels:**
- **🔴 CRITICAL** - Blocking production deployment, security vulnerabilities
- **🟡 HIGH** - Performance issues, architectural problems
- **🟢 MEDIUM** - Code quality, maintainability
- **📋 LOW** - Nice-to-have improvements

---

## 🔐 SECURITY FIXES (Priority: Critical)

### **Backlog Tasks**

#### **SEC-001: Remove Hardcoded API Keys and Tokens**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `lib/firebase/index.ts:6-12`, `lib/townRec/emailTemplates.ts:226`
- **Issue:** Hardcoded fallback tokens create security vulnerabilities
- **Fix:** Replace with proper environment validation
```typescript
// TODO: SEC-001 - Remove hardcoded fallback
apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
// Replace with:
apiKey: process.env.VITE_FIREBASE_API_KEY || (() => {
  throw new Error('VITE_FIREBASE_API_KEY environment variable is required');
})(),
```
- **Tags:** #security, #auth_hardening, #env_validation

#### **SEC-002: Implement CSRF Protection**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `frontend/services/`, `backend/api.py`
- **Issue:** API endpoints lack CSRF protection
- **Fix:** Add CSRF tokens to all state-changing operations
```typescript
// TODO: SEC-002 - Add CSRF protection to API calls
const response = await fetch('/api/town-rec/sibling-pairing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': getCsrfToken(), // TODO: Implement CSRF token
  },
  body: JSON.stringify(data)
});
```
- **Tags:** #security, #csrf_protection, #api_security

#### **SEC-003: Harden JWT Validation Logic**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `lib/firebase/index.ts`, `backend/middleware/auth.js`
- **Issue:** Weak JWT validation and secret reuse
- **Fix:** Implement proper JWT validation with refresh tokens
```typescript
// TODO: SEC-003 - Implement proper JWT validation
const validateJWT = (token: string) => {
  // TODO: Add proper JWT validation with refresh token logic
  // TODO: Implement token rotation
  // TODO: Add audience and issuer validation
};
```
- **Tags:** #security, #jwt_validation, #token_rotation

#### **SEC-004: Sanitize User Input**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `frontend/components/`, `backend/models.py`
- **Issue:** XSS vulnerabilities from unsanitized input
- **Fix:** Implement input sanitization and output encoding
```typescript
// TODO: SEC-004 - Sanitize user input before rendering
const sanitizeInput = (input: string): string => {
  // TODO: Implement DOMPurify or similar sanitization
  return DOMPurify.sanitize(input);
};
```
- **Tags:** #security, #xss_prevention, #input_validation

#### **SEC-005: Convert Raw SQL to Parameterized Queries**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `backend/models.py`, `backend/drill_log.py`
- **Issue:** SQL injection vulnerabilities
- **Fix:** Use parameterized queries and input validation
```python
# TODO: SEC-005 - Convert raw SQL to parameterized queries
# Current: f"SELECT * FROM players WHERE id = {player_id}"
# Fix: "SELECT * FROM players WHERE id = %s", (player_id,)
```
- **Tags:** #security, #sql_injection, #parameterized_queries

#### **SEC-006: Complete Firestore RBAC Rules**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 3-4 days
- **Files:** `firestore.rules`, `townRec/inclusionPolicy/firestore.rules`
- **Issue:** Incomplete role-based access control
- **Fix:** Implement comprehensive RBAC for all roles
```javascript
// TODO: SEC-006 - Complete RBAC rules for all roles
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TODO: Add comprehensive rules for admin, director, coach, parent, player roles
    // TODO: Implement proper data ownership validation
    // TODO: Add audit logging for sensitive operations
  }
}
```
- **Tags:** #security, #rbac, #firestore_rules, #access_control

---

## 🧪 TESTING & QA FIXES (Priority: Critical)

### **Backlog Tasks**

#### **TEST-001: Fix Jest Configuration**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `jest.setup.js:27`, `package.json`
- **Issue:** All test suites failing due to Jest config
- **Fix:** Resolve document property redefinition and TypeScript issues
```javascript
// TODO: TEST-001 - Fix Jest document mock
// Replace problematic Object.defineProperty with proper mock
if (typeof global.document === 'undefined') {
  global.document = {
    createElement: jest.fn().mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockWebGLContext)
    })
  };
}
```
- **Tags:** #tests, #jest_fix, #test_infrastructure

#### **TEST-002: Rebuild Unit Test Suites**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 1-2 weeks
- **Files:** `__tests__/`, `functions/src/__tests__/`
- **Issue:** 0% test coverage across all modules
- **Fix:** Implement comprehensive unit tests for all critical modules
```typescript
// TODO: TEST-002 - Add unit tests for Town Rec workflows
describe('TownRecSiblingPairing', () => {
  it('should validate sibling pairing requests', async () => {
    // TODO: Test sibling pairing validation logic
  });
  
  it('should handle age override requests', async () => {
    // TODO: Test age override workflow
  });
});
```
- **Tags:** #tests, #unit_tests, #coverage

#### **TEST-003: E2E Tests for Town Rec Workflows**
- **Priority:** 🔴 CRITICAL
- **Status:** 🔴 Backlog
- **Effort:** 3-4 days
- **Files:** `cypress/e2e/`, `__tests__/townRec/integration/`
- **Issue:** No end-to-end testing for critical workflows
- **Fix:** Implement E2E tests for complete user journeys
```typescript
// TODO: TEST-003 - E2E test for sibling pairing workflow
describe('Town Rec Sibling Pairing E2E', () => {
  it('should complete full sibling pairing workflow', () => {
    // TODO: Test complete workflow from request to approval
    // TODO: Test age override exception handling
    // TODO: Test waitlist management
  });
});
```
- **Tags:** #tests, #e2e_coverage, #workflow_testing

#### **TEST-004: Mock Firestore and Network Calls**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `__mocks__/`, `jest.setup.js`
- **Issue:** Tests failing due to missing mocks
- **Fix:** Implement comprehensive mocks for external dependencies
```typescript
// TODO: TEST-004 - Add Firestore mocks
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  // TODO: Add all Firestore methods used in tests
}));
```
- **Tags:** #tests, #mocking, #firestore_mocks

#### **TEST-005: Performance Test Coverage**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `__tests__/performance/`
- **Issue:** No performance benchmarking for AI features
- **Fix:** Add performance tests for critical AI modules
```typescript
// TODO: TEST-005 - Performance tests for AI modules
describe('AI Module Performance', () => {
  it('should process scout evaluation within 2 seconds', async () => {
    const startTime = performance.now();
    await scoutEval.processEvaluation(mockData);
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(2000);
  });
});
```
- **Tags:** #tests, #performance_tests, #ai_testing

---

## 🚀 PERFORMANCE OPTIMIZATION (Priority: High)

### **Backlog Tasks**

#### **PERF-001: Fix Memory Leaks in React Components**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `frontend/components/accessibility/AccessibilityManager.tsx:106-458`
- **Issue:** Unmanaged subscriptions and event listeners
- **Fix:** Implement proper cleanup in useEffect hooks
```typescript
// TODO: PERF-001 - Fix memory leaks in AccessibilityManager
useEffect(() => {
  const subscription = accessibilityService.subscribe();
  
  return () => {
    // TODO: Properly unsubscribe to prevent memory leaks
    subscription.unsubscribe();
  };
}, []);
```
- **Tags:** #performance, #memory_leaks, #react_cleanup

#### **PERF-002: Remove Debounce Conflicts**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `lib/townRec/recStaffCentral.ts:153-200`
- **Issue:** Redundant realtime watchers and debounce conflicts
- **Fix:** Consolidate watchers and optimize debounce logic
```typescript
// TODO: PERF-002 - Consolidate redundant watchers
const useOptimizedWatcher = (path: string) => {
  // TODO: Implement single watcher with proper cleanup
  // TODO: Remove duplicate watchers for same data
};
```
- **Tags:** #performance, #debounce_optimization, #firebase_watchers

#### **PERF-003: AI Module Performance Benchmarks**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `lib/ai/`, `backend/coach_assistant_engine.py`
- **Issue:** No performance monitoring for AI modules
- **Fix:** Add performance.mark() and performance.measure()
```typescript
// TODO: PERF-003 - Add performance benchmarks to AI modules
const processAIRequest = async (data: any) => {
  performance.mark('ai-process-start');
  
  const result = await aiModule.process(data);
  
  performance.mark('ai-process-end');
  performance.measure('ai-processing', 'ai-process-start', 'ai-process-end');
  
  return result;
};
```
- **Tags:** #performance, #ai_latency, #benchmarking

#### **PERF-004: Firebase Function Latency Optimization**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `functions/src/`, `backend/api.py`
- **Issue:** Cold start latency and inefficient routing
- **Fix:** Implement cold start triggers and regional routing
```typescript
// TODO: PERF-004 - Optimize Firebase function latency
export const optimizedFunction = functions
  .region('us-central1') // TODO: Use optimal region
  .runWith({
    memory: '256MB', // TODO: Optimize memory allocation
    timeoutSeconds: 30 // TODO: Set appropriate timeout
  })
  .https.onCall(async (data, context) => {
    // TODO: Implement caching for repeated operations
  });
```
- **Tags:** #performance, #firebase_optimization, #cold_start

---

## 🧼 CODE QUALITY & REFACTORING (Priority: Medium)

### **Backlog Tasks**

#### **QUAL-001: Delete Unused Exports**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 1-2 days
- **Files:** `frontend/tsprune-unused.txt` (75+ unused exports)
- **Issue:** Bundle bloat from unused code
- **Fix:** Remove all unused exports identified by tsprune
```typescript
// TODO: QUAL-001 - Remove unused exports
// Files to clean:
// - AchievementsView.tsx:31 - AchievementsView
// - PlayerDashboard.tsx:51 - PlayerDashboard
// - ScoutDashboard.tsx:66 - ScoutDashboard
// - aiAssistant.ts:205 - aiAssistant
// - authService.ts:145 - authService
```
- **Tags:** #refactor, #unused_code, #bundle_optimization

#### **QUAL-002: Consolidate Duplicate Engine Files**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `backend/coach_assistant_engine 2.py`, `backend/drill_recommendation_engine 2.py`
- **Issue:** Multiple versions of same functionality
- **Fix:** Consolidate into single, well-tested implementations
```python
# TODO: QUAL-002 - Consolidate duplicate engine files
# Merge coach_assistant_engine.py and coach_assistant_engine 2.py
# Merge drill_recommendation_engine.py and drill_recommendation_engine 2.py
# Remove duplicate functionality and maintain single source of truth
```
- **Tags:** #refactor, #code_consolidation, #duplicate_removal

#### **QUAL-003: Break Up Large Files**
- **Priority:** 🟢 MEDIUM
- **Status:** 🔴 Backlog
- **Effort:** 3-4 days
- **Files:** `backend/coach_assistant.py` (561 lines), `backend/drill_recommendation_engine.py` (717 lines)
- **Issue:** Violation of single responsibility principle
- **Fix:** Split into smaller, focused modules
```python
# TODO: QUAL-003 - Break up large files
# Split coach_assistant.py into:
# - coach_assistant_core.py (core logic)
# - coach_assistant_api.py (API endpoints)
# - coach_assistant_models.py (data models)
# - coach_assistant_utils.py (utilities)
```
- **Tags:** #refactor, #srp_violation, #large_files

#### **QUAL-004: Normalize Naming Conventions**
- **Priority:** 🟢 MEDIUM
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** Multiple files across codebase
- **Issue:** Mixed camelCase, snake_case, and kebab-case usage
- **Fix:** Standardize on camelCase for TypeScript/JavaScript, snake_case for Python
```typescript
// TODO: QUAL-004 - Normalize naming conventions
// Standardize on camelCase for TypeScript/JavaScript
// Standardize on snake_case for Python
// Update all variable names, function names, and file names
```
- **Tags:** #refactor, #naming_consistency, #code_standards

#### **QUAL-005: Strip Console Logs from Production**
- **Priority:** 🟢 MEDIUM
- **Status:** 🔴 Backlog
- **Effort:** 1 day
- **Files:** Multiple files with console.log statements
- **Issue:** Debug logs in production code
- **Fix:** Remove or replace with proper logging
```typescript
// TODO: QUAL-005 - Remove console.log from production
// Replace with proper logging service
// Files to clean:
// - agents/townRecParentAgent.ts (15+ console.log statements)
// - townRec/inclusionPolicy/AdminLeagueDashboardNative.tsx (6+ console.error statements)
```
- **Tags:** #refactor, #logging, #production_cleanup

---

## 🧱 ARCHITECTURAL STANDARDIZATION (Priority: Medium)

### **Backlog Tasks**

#### **ARCH-001: Split Monolithic Modules**
- **Priority:** 🟡 HIGH
- **Status:** 🔴 Backlog
- **Effort:** 2-3 weeks
- **Files:** `lib/townRec/`, `backend/`
- **Issue:** Monolithic modules violate separation of concerns
- **Fix:** Split into focused modules with clear boundaries
```
// TODO: ARCH-001 - Split monolithic modules
lib/townRec/
├── core/                       # Core business logic
├── workflows/                  # Business workflows
├── components/                 # UI components
├── services/                   # External service integrations
└── types/                      # TypeScript definitions
```
- **Tags:** #architecture, #monolith_breakup, #module_organization

#### **ARCH-002: Unify Folder Structures**
- **Priority:** 🟢 MEDIUM
- **Status:** 🔴 Backlog
- **Effort:** 1-2 weeks
- **Files:** All directories across codebase
- **Issue:** Inconsistent folder structures
- **Fix:** Standardize folder structures for hooks, components, types, and services
```
// TODO: ARCH-002 - Unify folder structures
// Standardize across all modules:
// - hooks/ (React hooks)
// - components/ (UI components)
// - types/ (TypeScript definitions)
// - services/ (API and business logic)
// - utils/ (Utility functions)
```
- **Tags:** #architecture, #folder_structure, #consistency

#### **ARCH-003: Promote Shared Firestore Logic**
- **Priority:** 🟢 MEDIUM
- **Status:** 🔴 Backlog
- **Effort:** 2-3 days
- **Files:** `lib/townRec/`, `functions/src/`
- **Issue:** Duplicate Firestore logic across modules
- **Fix:** Create centralized `lib/dbHelpers.ts` for shared database operations
```typescript
// TODO: ARCH-003 - Create shared database helpers
// lib/dbHelpers.ts
export const dbHelpers = {
  // TODO: Centralize all Firestore operations
  createDocument: async (collection: string, data: any) => {},
  updateDocument: async (collection: string, id: string, data: any) => {},
  deleteDocument: async (collection: string, id: string) => {},
  // TODO: Add transaction helpers, batch operations, etc.
};
```
- **Tags:** #architecture, #shared_logic, #database_helpers

---

## 📊 TASK TRACKING METRICS

### **Priority Distribution:**
- **🔴 CRITICAL:** 11 tasks (Security & Testing)
- **🟡 HIGH:** 8 tasks (Performance & Architecture)
- **🟢 MEDIUM:** 6 tasks (Code Quality)
- **📋 LOW:** 2 tasks (Documentation)

### **Effort Estimation:**
- **Total Effort:** 6-8 weeks
- **Critical Path:** 2-3 weeks
- **Security Tasks:** 1-2 weeks
- **Testing Tasks:** 1-2 weeks
- **Performance Tasks:** 1-2 weeks
- **Architecture Tasks:** 2-4 weeks
- **Code Quality Tasks:** 1-2 weeks

### **Resource Allocation:**
- **Security Engineer:** SEC-001 through SEC-006
- **QA Engineer:** TEST-001 through TEST-005
- **Performance Engineer:** PERF-001 through PERF-004
- **Senior Developer:** QUAL-001 through QUAL-005
- **Architect:** ARCH-001 through ARCH-003

---

## 🎯 SUCCESS CRITERIA

### **Security Milestones:**
- ✅ All hardcoded secrets removed
- ✅ CSRF protection implemented
- ✅ JWT validation hardened
- ✅ Input sanitization complete
- ✅ RBAC rules comprehensive
- ✅ SQL injection prevention

### **Testing Milestones:**
- ✅ Jest configuration fixed
- ✅ 80% test coverage achieved
- ✅ E2E tests for critical workflows
- ✅ Performance tests implemented
- ✅ CI/CD pipeline automated

### **Performance Milestones:**
- ✅ Memory leaks eliminated
- ✅ AI module latency < 2 seconds
- ✅ Firebase function optimization
- ✅ Bundle size reduced by 30%

### **Code Quality Milestones:**
- ✅ Unused code removed
- ✅ Duplicate files consolidated
- ✅ Large files broken up
- ✅ Naming conventions standardized
- ✅ Console logs removed from production

---

## 🔗 RELATED DOCUMENTS

- **Audit Report:** `SPORTBEACONAI_COMPREHENSIVE_AUDIT_REPORT.md`
- **DevOps Task Board:** `TODO2_TASK_BOARD_DEVOPS_QA.md`
- **Environment Config:** `env.example`
- **Firestore Rules:** `firestore.rules`
- **Jest Config:** `jest.setup.js`

---

## 📝 NOTES

### **Blocking Issues for Town Rec Deployment:**
1. **SEC-001:** Hardcoded API keys must be removed before production
2. **TEST-001:** Jest configuration must be fixed to enable testing
3. **SEC-006:** RBAC rules must be complete for data security
4. **TEST-003:** E2E tests must be implemented for critical workflows

### **Smart Implementation Notes:**
- Start with security tasks as they block production deployment
- Fix Jest configuration first to enable all other testing
- Implement tasks in parallel where possible (e.g., security + testing)
- Use feature flags for gradual rollout of architectural changes
- Maintain backward compatibility during refactoring

### **Risk Mitigation:**
- Create comprehensive rollback plans for each major change
- Implement feature flags for gradual deployment
- Maintain separate staging environment for testing changes
- Document all changes for future reference and maintenance 