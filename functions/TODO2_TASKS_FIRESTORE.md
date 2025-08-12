# Todo2 Tasks - Firestore Function Automation

## 🔥 **Firestore Triggers - Critical Priority**

### Task: Extract `onAgeOverrideCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_001`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `In Progress`  
**Assignee**: `Backend Team`  
**Priority**: `High`  
**Due Date**: `2024-02-10`  

**Description**: Extract the inline `onAgeOverrideCreated` function from `functions/src/triggers/index.ts` (lines 46-78) into a standalone file `functions/src/triggers/onAgeOverrideCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 46-78)
- **Target**: `functions/src/triggers/onAgeOverrideCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onAgeOverrideCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `ageOverrides/{overrideId}`
- **Latency**: Critical for age override approval workflows
- **Edge Cases**: Age difference policy violations, league restrictions, parent consent
- **Test Strategy**: Focus on validation logic and approval workflows

---

### Task: Extract `onWaitlistEntryCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_002`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `In Progress`  
**Assignee**: `Backend Team`  
**Priority**: `High`  
**Due Date**: `2024-02-10`  

**Description**: Extract the inline `onWaitlistEntryCreated` function from `functions/src/triggers/index.ts` (lines 13-45) into a standalone file `functions/src/triggers/onWaitlistEntryCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 13-45)
- **Target**: `functions/src/triggers/onWaitlistEntryCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onWaitlistEntryCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `waitlists/{entryId}`
- **Latency**: Critical for waitlist management and parent notifications
- **Edge Cases**: Duplicate entries, capacity management, priority queues
- **Test Strategy**: Focus on entry validation and notification workflows

---

## 📄 **Function Stubs - High Priority**

### Task: Extract `onSiblingPairingCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_003`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `High`  
**Due Date**: `2024-02-15`  

**Description**: Extract the inline `onSiblingPairingCreated` function from `functions/src/triggers/index.ts` (lines 79-111) into a standalone file `functions/src/triggers/onSiblingPairingCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 79-111)
- **Target**: `functions/src/triggers/onSiblingPairingCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onSiblingPairingCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `siblingPairings/{pairingId}`
- **Latency**: Important for sibling team assignment workflows
- **Edge Cases**: League availability, team capacity, age group compatibility
- **Test Strategy**: Focus on pairing logic and team assignment workflows

---

### Task: Extract `onRegistrationUpdated` from index.ts to standalone file
**Task ID**: `firestore_refactor_004`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `High`  
**Due Date**: `2024-02-15`  

**Description**: Extract the inline `onRegistrationUpdated` function from `functions/src/triggers/index.ts` (lines 112-148) into a standalone file `functions/src/triggers/onRegistrationUpdated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 112-148)
- **Target**: `functions/src/triggers/onRegistrationUpdated.ts`
- **Test**: `functions/src/triggers/__tests__/onRegistrationUpdated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentUpdated`
- **Firestore Path**: `registrations/{registrationId}`
- **Latency**: Important for registration status change workflows
- **Edge Cases**: Status validation, payment processing, waitlist promotion
- **Test Strategy**: Focus on status change logic and notification workflows

---

### Task: Extract `onTownStaffSessionCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_005`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `High`  
**Due Date**: `2024-02-15`  

**Description**: Extract the inline `onTownStaffSessionCreated` function from `functions/src/triggers/index.ts` (lines 149-180) into a standalone file `functions/src/triggers/onTownStaffSessionCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 149-180)
- **Target**: `functions/src/triggers/onTownStaffSessionCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onTownStaffSessionCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `townStaffSessions/{sessionId}`
- **Latency**: Important for staff activity tracking and security
- **Edge Cases**: Session timeouts, permission validation, activity logging
- **Test Strategy**: Focus on session management and security workflows

---

## 🧪 **Test Suites - Medium Priority**

### Task: Extract `onNotificationCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_006`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `Medium`  
**Due Date**: `2024-02-20`  

**Description**: Extract the inline `onNotificationCreated` function from `functions/src/triggers/index.ts` (lines 181-210) into a standalone file `functions/src/triggers/onNotificationCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 181-210)
- **Target**: `functions/src/triggers/onNotificationCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onNotificationCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `notifications/{notificationId}`
- **Latency**: Important for timely parent and staff communications
- **Edge Cases**: Delivery failures, retry logic, notification preferences
- **Test Strategy**: Focus on delivery mechanisms and retry workflows

---

### Task: Extract `onAuditLogCreated` from index.ts to standalone file
**Task ID**: `firestore_refactor_007`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `Medium`  
**Due Date**: `2024-02-20`  

**Description**: Extract the inline `onAuditLogCreated` function from `functions/src/triggers/index.ts` (lines 211-237) into a standalone file `functions/src/triggers/onAuditLogCreated.ts` for better maintainability and testing.

**File Paths**:
- **Source**: `functions/src/triggers/index.ts` (lines 211-237)
- **Target**: `functions/src/triggers/onAuditLogCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onAuditLogCreated.test.ts` ✅ EXISTS
- **Export**: Update `functions/src/triggers/index.ts` and `functions/src/index.ts`

**Smart Notes**:
- **Trigger Type**: `onDocumentCreated`
- **Firestore Path**: `townStaffAuditLogs/{logId}`
- **Latency**: Important for compliance and security monitoring
- **Edge Cases**: Log integrity, suspicious activity detection, archiving
- **Test Strategy**: Focus on log validation and security workflows

---

## 📂 **Export Integration - Low Priority**

### Task: Refactor triggers index.ts to use imports instead of inline functions
**Task ID**: `firestore_refactor_008`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `Medium`  
**Due Date**: `2024-02-25`  

**Description**: After extracting all inline functions, refactor `functions/src/triggers/index.ts` to use import statements instead of inline function definitions for better code organization and maintainability.

**File Paths**:
- **Target**: `functions/src/triggers/index.ts`
- **Dependencies**: All extracted function files must be completed first

**Smart Notes**:
- **Impact**: Improves code maintainability and testing isolation
- **Dependencies**: Requires completion of all function extraction tasks
- **Test Strategy**: Ensure all imports work correctly and exports are maintained

---

### Task: Update main index.ts exports for all extracted functions
**Task ID**: `firestore_refactor_009`  
**Tags**: `#firestore_refactor` `#backend`  
**Status**: `Backlog`  
**Assignee**: `Backend Team`  
**Priority**: `Low`  
**Due Date**: `2024-02-25`  

**Description**: Update `functions/src/index.ts` to properly export all extracted Firestore trigger functions for deployment and external access.

**File Paths**:
- **Target**: `functions/src/index.ts`
- **Dependencies**: All function extraction and index refactoring must be completed

**Smart Notes**:
- **Impact**: Ensures proper function deployment and external access
- **Dependencies**: Requires completion of all extraction and refactoring tasks
- **Test Strategy**: Verify all functions are properly exported and accessible

---

## 🧪 **QA + Testing Tasks**

### Task: Expand test suite for age override edge cases
**Task ID**: `firebase_tests_001`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-02-28`  

**Description**: Expand the existing test suite for `onAgeOverrideCreated` to include comprehensive edge case testing for age difference policy violations, league restrictions, and approval workflows.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onAgeOverrideCreated.test.ts`
- **Function**: `functions/src/triggers/onAgeOverrideCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on age validation logic and approval workflows
- **Edge Cases**: Policy violations, league restrictions, parent consent
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Enhance waitlist entry test coverage
**Task ID**: `firebase_tests_002`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-02-28`  

**Description**: Enhance the existing test suite for `onWaitlistEntryCreated` to include comprehensive testing for duplicate entry prevention, capacity management, and notification workflows.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onWaitlistEntryCreated.test.ts`
- **Function**: `functions/src/triggers/onWaitlistEntryCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on entry validation and capacity management
- **Edge Cases**: Duplicate entries, capacity limits, priority queues
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Add integration tests for sibling pairing workflows
**Task ID**: `firebase_tests_003`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-03-05`  

**Description**: Add comprehensive integration tests for `onSiblingPairingCreated` to test real-world sibling pairing scenarios with team assignment and league compatibility.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onSiblingPairingCreated.test.ts`
- **Function**: `functions/src/triggers/onSiblingPairingCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on pairing logic and team assignment workflows
- **Edge Cases**: League availability, team capacity, age group compatibility
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Test registration update edge cases and rollbacks
**Task ID**: `firebase_tests_004`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-03-05`  

**Description**: Add comprehensive tests for `onRegistrationUpdated` to cover status change validations, payment processing integration, and rollback scenarios.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onRegistrationUpdated.test.ts`
- **Function**: `functions/src/triggers/onRegistrationUpdated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on status validation and payment workflows
- **Edge Cases**: Status changes, payment failures, rollback scenarios
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Add session timeout and security tests
**Task ID**: `firebase_tests_005`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-03-05`  

**Description**: Add comprehensive security and timeout tests for `onTownStaffSessionCreated` to ensure proper session management and security validation.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onTownStaffSessionCreated.test.ts`
- **Function**: `functions/src/triggers/onTownStaffSessionCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on session security and timeout management
- **Edge Cases**: Session timeouts, permission violations, security breaches
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Test notification delivery failures and retry logic
**Task ID**: `firebase_tests_006`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Medium`  
**Due Date**: `2024-03-10`  

**Description**: Add comprehensive tests for `onNotificationCreated` to cover delivery failure scenarios, retry logic, and notification preference handling.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onNotificationCreated.test.ts`
- **Function**: `functions/src/triggers/onNotificationCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on delivery mechanisms and retry workflows
- **Edge Cases**: Delivery failures, retry limits, notification preferences
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

### Task: Add audit log integrity and security tests
**Task ID**: `firebase_tests_007`  
**Tags**: `#firebase_tests` `#qa`  
**Status**: `Backlog`  
**Assignee**: `QA Team`  
**Priority**: `Low`  
**Due Date**: `2024-03-10`  

**Description**: Add comprehensive tests for `onAuditLogCreated` to ensure log integrity, security validation, and suspicious activity detection.

**File Paths**:
- **Test Suite**: `functions/src/triggers/__tests__/onAuditLogCreated.test.ts`
- **Function**: `functions/src/triggers/onAuditLogCreated.ts` (after extraction)

**Smart Notes**:
- **Test Strategy**: Focus on log validation and security workflows
- **Edge Cases**: Log tampering, suspicious activities, integrity violations
- **Async Control**: Firestore triggers are latency-sensitive and need proper async control

---

## 🧠 **Smart Notes Summary**

### **Firestore Trigger Latency Sensitivity**
All Firestore triggers in SportBeaconAI must be optimized for:
- **Sub-second response times** (< 1000ms)
- **Proper async/await patterns** to avoid blocking operations
- **Batch operations** for multiple Firestore writes
- **Retry mechanisms** for transient failures
- **Timeout handling** for external service calls
- **Error recovery** with graceful fallbacks

### **Test-Driven Development Strategy**
Each function follows:
1. **Unit Tests**: Isolated function testing with mocks
2. **Integration Tests**: Real Firestore emulator testing
3. **Edge Case Coverage**: Age limits, capacity constraints, validation failures
4. **Performance Tests**: Concurrent requests, large datasets
5. **Error Scenarios**: Service failures, timeout conditions

### **Priority Distribution**
- **🔴 CRITICAL**: 2 tasks (age override, waitlist entry)
- **🟡 HIGH**: 3 tasks (sibling pairing, registration, staff session)
- **🟢 MEDIUM**: 4 tasks (notification, audit log, index refactoring)
- **📋 LOW**: 1 task (main index exports)

### **Progress Tracking**
- **Total Tasks**: 16 (8 Backend + 8 QA)
- **In Progress**: 2 (12.5%)
- **Backlog**: 14 (87.5%)
- **Test Coverage**: 100% (all functions have existing test files)
- **Estimated Completion**: March 2024 