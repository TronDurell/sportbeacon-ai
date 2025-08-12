# SportBeaconAI Firebase Functions Testing Guide

## 🧪 Overview

This directory contains comprehensive test suites for all Firebase Cloud Functions in the SportBeaconAI project. The testing infrastructure uses Jest with Firebase Functions Test SDK and Firestore emulator for isolated, reliable testing.

## 📁 Test Structure

```
functions/
├── jest.config.js                    # Jest configuration
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                  # Global test setup
│   │   └── test-utils.ts             # Shared test utilities
│   ├── triggers/
│   │   └── __tests__/
│   │       ├── onWaitlistEntryCreated.test.ts
│   │       ├── onAgeOverrideCreated.test.ts
│   │       ├── onSiblingPairingCreated.test.ts
│   │       ├── onRegistrationUpdated.test.ts
│   │       ├── onTownStaffSessionCreated.test.ts
│   │       ├── onNotificationCreated.test.ts
│   │       └── onAuditLogCreated.test.ts
│   └── scheduled/
│       └── __tests__/
│           ├── waitlistDailyScan.test.ts
│           ├── weeklyDirectorDigest.test.ts
│           ├── parentFollowUpEmails.test.ts
│           └── monthlyAnalyticsReport.test.ts
```

## 🚀 Quick Start

### Prerequisites

1. **Firebase CLI**: Install globally
   ```bash
   npm install -g firebase-tools
   ```

2. **Dependencies**: Install project dependencies
   ```bash
   cd functions
   npm install
   ```

### Running Tests

#### 1. Start Firestore Emulator
```bash
firebase emulators:start --only firestore
```

#### 2. Run All Tests
```bash
npm test
```

#### 3. Run Tests in Watch Mode
```bash
npm run test:watch
```

#### 4. Run Tests with Coverage
```bash
npm run test:coverage
```

#### 5. Run Tests in CI Mode
```bash
npm run test:ci
```

## 🧩 Test Categories

### Trigger Functions (`onDocumentCreated`, `onDocumentUpdated`)

Test files for Firestore trigger functions that respond to document changes:

- **`onWaitlistEntryCreated.test.ts`**: Tests waitlist entry processing
- **`onAgeOverrideCreated.test.ts`**: Tests age override request handling
- **`onSiblingPairingCreated.test.ts`**: Tests sibling pairing request processing
- **`onRegistrationUpdated.test.ts`**: Tests registration update workflows
- **`onTownStaffSessionCreated.test.ts`**: Tests staff session tracking
- **`onNotificationCreated.test.ts`**: Tests notification sending workflows
- **`onAuditLogCreated.test.ts`**: Tests audit log validation

### Scheduled Functions (`onSchedule`)

Test files for scheduled/cron functions:

- **`waitlistDailyScan.test.ts`**: Tests daily waitlist processing
- **`weeklyDirectorDigest.test.ts`**: Tests weekly director reports
- **`parentFollowUpEmails.test.ts`**: Tests parent follow-up workflows
- **`monthlyAnalyticsReport.test.ts`**: Tests monthly analytics generation

## 🛠️ Test Utilities

### `test-utils.ts`

Provides shared utilities for all test files:

- **Mock Event Creators**: `createMockDocumentCreatedEvent`, `createMockDocumentUpdatedEvent`, `createMockScheduledEvent`
- **Data Helpers**: `seedTestData`, `getDocumentData`, `countDocuments`
- **Verification Helpers**: `verifyAuditLogEntry`, `verifyDocumentExists`
- **Mock Data**: Predefined test data for common scenarios

### `setup.ts`

Global test configuration:

- Firebase emulator connection
- External service mocking (email, Stripe, logging)
- Test environment setup
- Data cleanup utilities

## 📊 Test Coverage

Each test suite includes:

### ✅ Basic Functionality Tests
- Happy path scenarios
- Empty data handling
- Complete data processing
- Concurrent operations

### 🔄 Edge Case Tests (TODO)
- Malformed data handling
- Missing required fields
- Invalid input validation
- Processing timeouts
- Database connection failures

### 🔗 Integration Tests (TODO)
- Real Firestore emulator testing
- External service integration
- End-to-end workflows
- Performance benchmarks
- Error recovery scenarios

## 🎯 Test Patterns

### Trigger Function Tests
```typescript
describe('onWaitlistEntryCreated', () => {
  beforeEach(async () => {
    await clearFirestoreData();
  });

  it('should process a new waitlist entry and create audit log', async () => {
    // Arrange
    const event = createMockDocumentCreatedEvent('waitlists/{entryId}', 'entry-123', mockData);
    
    // Act
    await onWaitlistEntryCreated(event as any);
    
    // Assert
    const auditLogExists = await verifyAuditLogEntry('waitlist_entry_created', 'entry-123');
    expect(auditLogExists).toBe(true);
  });
});
```

### Scheduled Function Tests
```typescript
describe('waitlistDailyScan', () => {
  it('should process daily waitlist scan successfully', async () => {
    // Arrange
    const event = createMockScheduledEvent();
    await seedTestData('waitlists', testData);
    
    // Act
    await waitlistDailyScan(event as any);
    
    // Assert
    const waitlistCount = await countDocuments('waitlists');
    expect(waitlistCount).toBe(3);
  });
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with `ts-jest`
- Firebase emulator integration
- Coverage reporting
- Test timeout settings
- Mock restoration

### Package Scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --ci --coverage --watchAll=false"
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Firestore Emulator Not Running**
   ```bash
   Error: Failed to connect to Firestore emulator
   ```
   **Solution**: Start the emulator with `firebase emulators:start --only firestore`

2. **Test Timeouts**
   ```bash
   Timeout - Async callback was not invoked within the 5000ms timeout
   ```
   **Solution**: Increase timeout in `jest.config.js` or add `waitForAsync()` calls

3. **Mock Data Issues**
   ```bash
   Error: Cannot read property 'data' of undefined
   ```
   **Solution**: Ensure mock events are properly structured using test utilities

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose
```

Run specific test file:
```bash
npm test -- onWaitlistEntryCreated.test.ts
```

## 📈 Best Practices

### Test Organization
- **Arrange**: Set up test data and mocks
- **Act**: Execute the function under test
- **Assert**: Verify expected outcomes
- **Cleanup**: Reset state between tests

### Data Management
- Use `clearFirestoreData()` in `beforeEach`/`afterEach`
- Seed test data with `seedTestData()`
- Use predefined mock data from `test-utils.ts`

### Async Handling
- Always await function calls
- Use `waitForAsync()` for Firestore operations
- Handle promises properly in concurrent tests

### Mocking Strategy
- Mock external services (email, Stripe)
- Use realistic test data
- Test both success and failure scenarios

## 🔮 Future Enhancements

### Planned Test Expansions
- [ ] Edge case test implementations
- [ ] Integration test suites
- [ ] Performance benchmarking
- [ ] Load testing scenarios
- [ ] Security testing
- [ ] Accessibility testing

### Monitoring & Alerting
- [ ] Test result reporting
- [ ] Coverage thresholds
- [ ] Performance regression detection
- [ ] Automated test execution

## 📚 Additional Resources

- [Firebase Functions Testing Guide](https://firebase.google.com/docs/functions/unit-testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite/install_and_configure)
- [TypeScript Testing](https://www.typescriptlang.org/docs/handbook/testing.html)

## 🤝 Contributing

When adding new functions:

1. Create corresponding test file in appropriate `__tests__` directory
2. Follow established test patterns
3. Include comprehensive test scenarios
4. Add TODO comments for future enhancements
5. Update this README with new test information

---

**Note**: This testing infrastructure ensures reliable, maintainable Firebase Functions with comprehensive coverage and isolation from external dependencies. 