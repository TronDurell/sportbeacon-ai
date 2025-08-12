# Todo2 Firestore Function Automation - SportBeaconAI

## 🎯 **Project Overview**
Automated Firestore function stub generation system for SportBeaconAI Town Rec module. This system organizes development tasks into structured Kanban boards with linked code context, smart notes, and test-driven development priorities.

---

## 🔥 **Firestore Triggers - High Priority (Critical Town Rec Flow)**

### 1. **onSiblingRequestCreated** ✅ COMPLETED
- **Status**: Implemented
- **File**: `functions/src/triggers/onSiblingRequestCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onSiblingRequestCreated.test.ts`
- **Firestore Path**: `towns/{townId}/siblingRequests/{requestId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🔴 **CRITICAL**

### 2. **onAgeOverrideCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 46-78)
- **Target**: `functions/src/triggers/onAgeOverrideCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onAgeOverrideCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `ageOverrides/{overrideId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🔴 **CRITICAL**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onAgeOverrideCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `In Progress`
  - **Priority**: `High`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Expand test suite for age override edge cases
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

### 3. **onWaitlistEntryCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 13-45)
- **Target**: `functions/src/triggers/onWaitlistEntryCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onWaitlistEntryCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `waitlists/{entryId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🔴 **CRITICAL**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onWaitlistEntryCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `In Progress`
  - **Priority**: `High`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Enhance waitlist entry test coverage
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

---

## 📄 **Function Stubs - Medium Priority (Core Operations)**

### 4. **onSiblingPairingCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 79-111)
- **Target**: `functions/src/triggers/onSiblingPairingCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onSiblingPairingCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `siblingPairings/{pairingId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🟡 **HIGH**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onSiblingPairingCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `High`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Add integration tests for sibling pairing workflows
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

### 5. **onRegistrationUpdated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 112-148)
- **Target**: `functions/src/triggers/onRegistrationUpdated.ts`
- **Test**: `functions/src/triggers/__tests__/onRegistrationUpdated.test.ts` ✅ EXISTS
- **Firestore Path**: `registrations/{registrationId}`
- **Trigger Type**: `onDocumentUpdated`
- **Priority**: 🟡 **HIGH**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onRegistrationUpdated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `High`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Test registration update edge cases and rollbacks
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

### 6. **onTownStaffSessionCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 149-180)
- **Target**: `functions/src/triggers/onTownStaffSessionCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onTownStaffSessionCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `townStaffSessions/{sessionId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🟡 **HIGH**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onTownStaffSessionCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `High`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Add session timeout and security tests
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

---

## 🧪 **Test Suites - Medium Priority (Quality Assurance)**

### 7. **onNotificationCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 181-210)
- **Target**: `functions/src/triggers/onNotificationCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onNotificationCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `notifications/{notificationId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🟢 **MEDIUM**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onNotificationCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Test notification delivery failures and retry logic
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `QA Team`

### 8. **onAuditLogCreated** 🔄 REFACTOR NEEDED
- **Status**: Inline implementation needs extraction
- **Current**: `functions/src/triggers/index.ts` (lines 211-237)
- **Target**: `functions/src/triggers/onAuditLogCreated.ts`
- **Test**: `functions/src/triggers/__tests__/onAuditLogCreated.test.ts` ✅ EXISTS
- **Firestore Path**: `townStaffAuditLogs/{logId}`
- **Trigger Type**: `onDocumentCreated`
- **Priority**: 🟢 **MEDIUM**

**Todo2 Tasks:**
- [ ] **Task**: Extract `onAuditLogCreated` from index.ts to standalone file
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Add audit log integrity and security tests
  - **Tag**: `#firebase_tests`
  - **Status**: `Backlog`
  - **Priority**: `Low`
  - **Assignee**: `QA Team`

---

## 📂 **Export Integration - Low Priority (Infrastructure)**

### 9. **Index File Refactoring** 🔄 NEEDED
- **Status**: Needs cleanup after function extraction
- **File**: `functions/src/triggers/index.ts`
- **Priority**: 🟢 **MEDIUM**

**Todo2 Tasks:**
- [ ] **Task**: Refactor triggers index.ts to use imports instead of inline functions
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `Medium`
  - **Assignee**: `Backend Team`

- [ ] **Task**: Update main index.ts exports for all extracted functions
  - **Tag**: `#firestore_refactor`
  - **Status**: `Backlog`
  - **Priority**: `Low`
  - **Assignee**: `Backend Team`

---

## 🧠 **Smart Notes & Technical Context**

### **Firestore Trigger Latency Sensitivity**
All Firestore triggers must be optimized for:
- **Sub-second response times** (< 1000ms)
- **Proper async/await patterns** to avoid blocking
- **Batch operations** for multiple Firestore writes
- **Retry mechanisms** for transient failures
- **Timeout handling** for external service calls
- **Error recovery** with graceful fallbacks

### **Test-Driven Development Strategy**
Each function should follow:
1. **Unit Tests**: Isolated function testing with mocks
2. **Integration Tests**: Real Firestore emulator testing
3. **Edge Case Coverage**: Age limits, capacity constraints, validation failures
4. **Performance Tests**: Concurrent requests, large datasets
5. **Error Scenarios**: Service failures, timeout conditions

### **Mocking Plan**
- **Firestore**: Use Firebase Functions Test SDK
- **External Services**: Mock notification, email, SMS services
- **Authentication**: Mock Firebase Auth
- **Storage**: Mock Firebase Storage operations
- **Analytics**: Mock Firebase Analytics

### **Known Edge Cases by Function**

#### **onSiblingRequestCreated**
- Age group mismatches between siblings
- League availability conflicts
- Team capacity constraints
- Special needs accommodations
- Geographic location differences
- Schedule conflicts
- Waitlist position variations

#### **onAgeOverrideCreated**
- Age difference policy violations
- League age group restrictions
- Parent consent requirements
- Staff approval workflows
- Automatic vs manual review criteria
- Appeal process handling

#### **onWaitlistEntryCreated**
- Duplicate entry prevention
- League capacity management
- Priority queue handling
- Parent notification timing
- Automatic promotion triggers
- Waitlist cleanup processes

#### **onRegistrationUpdated**
- Status change validations
- Payment processing integration
- Team assignment conflicts
- Waitlist promotion logic
- Parent communication workflows
- Audit trail completeness

---

## 📊 **Kanban Board Organization**

### **🔴 CRITICAL (High Priority)**
- `onSiblingRequestCreated` ✅ COMPLETED
- `onAgeOverrideCreated` 🔄 REFACTOR NEEDED
- `onWaitlistEntryCreated` 🔄 REFACTOR NEEDED

### **🟡 HIGH (Medium Priority)**
- `onSiblingPairingCreated` 🔄 REFACTOR NEEDED
- `onRegistrationUpdated` 🔄 REFACTOR NEEDED
- `onTownStaffSessionCreated` 🔄 REFACTOR NEEDED

### **🟢 MEDIUM (Low Priority)**
- `onNotificationCreated` 🔄 REFACTOR NEEDED
- `onAuditLogCreated` 🔄 REFACTOR NEEDED
- Index file refactoring

### **📋 BACKLOG**
- Additional edge case tests
- Performance optimization
- Integration test expansion
- Documentation updates

---

## 🎯 **Automation Scripts**

### **Function Extraction Script**
```bash
# Extract inline functions to standalone files
npm run extract-firestore-functions
```

### **Test Generation Script**
```bash
# Generate test stubs for new functions
npm run generate-firestore-tests
```

### **Export Update Script**
```bash
# Update index files with new exports
npm run update-firestore-exports
```

---

## 📈 **Progress Tracking**

- **Total Functions**: 8
- **Completed**: 1 (12.5%)
- **Needs Refactoring**: 7 (87.5%)
- **Test Coverage**: 100% (all functions have test files)
- **Priority Distribution**: 3 Critical, 3 High, 2 Medium

---

## 🔗 **Related Documentation**
- [Firebase Functions Testing Guide](https://firebase.google.com/docs/functions/unit-testing)
- [Firestore Triggers Best Practices](https://firebase.google.com/docs/functions/firestore-events)
- [SportBeaconAI Testing README](functions/TESTING_README.md)
- [Town Rec Module Documentation](docs/town-rec/) 