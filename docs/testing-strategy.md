# SportBeaconAI Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the SportBeaconAI frontend, including unit tests, integration tests, and form validation tests.

## Test Structure

```
frontend/src/__tests__/
├── setup/
│   └── test-utils.tsx          # Test utilities and mocks
├── auth/
│   └── AdminLogin.test.tsx     # Authentication flow tests
├── forms/
│   ├── PlayUpOverrideForm.test.tsx    # TownRec form validation
│   └── LeagueRegistration.test.tsx    # Registration form tests
├── integration/
│   └── FormValidation.test.tsx # Cross-component validation tests
└── unit/                       # Individual component tests
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual components in isolation
- **Coverage**: Component rendering, props, state management
- **Location**: `src/__tests__/unit/`

### 2. Integration Tests
- **Purpose**: Test component interactions and data flow
- **Coverage**: Form validation across components, API integration
- **Location**: `src/__tests__/integration/`

### 3. Form Validation Tests
- **Purpose**: Comprehensive form input validation
- **Coverage**: All form inputs, error states, submission logic
- **Location**: `src/__tests__/forms/`

### 4. Authentication Tests
- **Purpose**: Test auth flows and security
- **Coverage**: Login, signup, password reset, role-based access
- **Location**: `src/__tests__/auth/`

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:forms
npm run test:auth
npm run test:validation
```

### CI/CD Commands
```bash
# Run tests for CI (no watch mode, with coverage)
npm run test:ci

# Debug tests (with open handles detection)
npm run test:debug

# Update snapshots
npm run test:update

# Clear Jest cache
npm run test:clear
```

## Test Utilities

### Custom Render Function
```typescript
import { render } from '@tests/setup/test-utils';

// Renders component with all providers
render(<MyComponent />, {
  route: '/test-route',
  initialAuthState: { user: mockUser, isAuthenticated: true }
});
```

### Form Testing Helpers
```typescript
import { fillFormField, selectOption, checkCheckbox, submitForm } from '@tests/setup/test-utils';

// Fill form fields
await fillFormField(/email/i, 'test@example.com');

// Select dropdown options
await selectOption(/country/i, 'United States');

// Check checkboxes
await checkCheckbox(/terms and conditions/i);

// Submit forms
await submitForm('Submit Registration');
```

### Validation Testing Helpers
```typescript
import { expectFieldError, expectNoFieldError, expectFormError } from '@tests/setup/test-utils';

// Check for field-specific errors
expectFieldError('email', 'Invalid email format');

// Check for no errors
expectNoFieldError('email');

// Check for form-level errors
expectFormError('Submission failed');
```

## Mocking Strategy

### Firebase Mocks
```typescript
// Firebase Auth
mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue(userCredential);

// Firestore
mockFirestore.collection.mockReturnValue({
  doc: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ exists: true, data: () => mockData })
  })
});

// Firebase Storage
mockFirebaseStorage.uploadBytes.mockResolvedValue(snapshot);
```

### Context Mocks
```typescript
// Mock AdminAuthContext
jest.spyOn(require('@contexts/AdminAuthContext'), 'useAdminAuth').mockReturnValue({
  login: mockLogin,
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
});
```

## Test Coverage Requirements

### Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage Reports
- **HTML**: `coverage/lcov-report/index.html`
- **LCOV**: `coverage/lcov.info`
- **Text**: Console output

## Form Validation Testing

### Required Fields
```typescript
it('shows error for empty required field', async () => {
  render(<MyForm />);
  await submitForm();
  
  await waitFor(() => {
    expect(screen.getByText(/field is required/i)).toBeInTheDocument();
  });
});
```

### Email Validation
```typescript
it('validates email format', async () => {
  render(<MyForm />);
  
  const validEmails = ['test@example.com', 'user+tag@domain.co.uk'];
  const invalidEmails = ['invalid-email', '@domain.com', 'user@'];
  
  for (const email of validEmails) {
    await fillFormField(/email/i, email);
    await submitForm();
    expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
  }
  
  for (const email of invalidEmails) {
    await fillFormField(/email/i, email);
    await submitForm();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  }
});
```

### Age Validation
```typescript
it('validates age range', async () => {
  render(<MyForm />);
  
  // Test valid ages
  await fillFormField(/age/i, '12');
  await submitForm();
  expect(screen.queryByText(/age must be between/i)).not.toBeInTheDocument();
  
  // Test invalid ages
  await fillFormField(/age/i, '3');
  await submitForm();
  expect(screen.getByText(/age must be between 4 and 18/i)).toBeInTheDocument();
});
```

## Edge Cases Testing

### Long Inputs
```typescript
it('handles very long inputs', async () => {
  render(<MyForm />);
  
  const longInput = 'A'.repeat(1000);
  await fillFormField(/name/i, longInput);
  
  expect(screen.getByLabelText(/name/i)).toHaveValue(longInput);
});
```

### Special Characters
```typescript
it('handles special characters', async () => {
  render(<MyForm />);
  
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  await fillFormField(/name/i, `User${specialChars}`);
  
  // Should accept special characters in names
  expect(screen.getByLabelText(/name/i)).toHaveValue(`User${specialChars}`);
});
```

### Whitespace Handling
```typescript
it('handles whitespace correctly', async () => {
  render(<MyForm />);
  
  await fillFormField(/email/i, '  test@example.com  ');
  await submitForm();
  
  // Should show validation error for whitespace
  expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
});
```

## Accessibility Testing

### ARIA Attributes
```typescript
it('has proper ARIA attributes', () => {
  render(<MyForm />);
  
  const emailField = screen.getByLabelText(/email/i);
  expect(emailField).toHaveAttribute('aria-invalid', 'false');
  expect(emailField).toHaveAttribute('type', 'email');
});
```

### Error States
```typescript
it('shows error states with proper ARIA attributes', async () => {
  render(<MyForm />);
  
  await submitForm();
  
  await waitFor(() => {
    const emailField = screen.getByLabelText(/email/i);
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
  });
});
```

## Async Testing

### Loading States
```typescript
it('shows loading state during submission', async () => {
  const mockSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
  
  render(<MyForm onSubmit={mockSubmit} />);
  
  await submitForm();
  
  expect(screen.getByText(/submitting/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
});
```

### Multiple Submissions
```typescript
it('prevents multiple submissions', async () => {
  const mockSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
  
  render(<MyForm onSubmit={mockSubmit} />);
  
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  await userEvent.click(submitButton);
  await userEvent.click(submitButton);
  await userEvent.click(submitButton);
  
  expect(mockSubmit).toHaveBeenCalledTimes(1);
});
```

## CI/CD Integration

### GitHub Actions
The CI/CD pipeline includes comprehensive testing:

1. **Lint and Type Check**: ESLint and TypeScript validation
2. **Unit Tests**: Individual component tests
3. **Integration Tests**: Cross-component validation
4. **Form Tests**: Form validation and submission
5. **Auth Tests**: Authentication flow testing
6. **Coverage Check**: Ensures 80% coverage threshold
7. **Security Audit**: npm audit for vulnerabilities
8. **Performance Check**: Lighthouse CI audit
9. **Health Check**: Deployment readiness validation

### Test Matrix
```yaml
strategy:
  matrix:
    test-type: [unit, integration, forms, auth, validation]
```

### Coverage Upload
```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    directory: frontend/coverage
    flags: ${{ matrix.test-type }}
    name: ${{ matrix.test-type }}-coverage
```

## Best Practices

### Test Organization
1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the behavior
3. **Test one thing per test** for clarity
4. **Use setup and teardown** with `beforeEach` and `afterEach`

### Mocking Guidelines
1. **Mock external dependencies** (Firebase, APIs)
2. **Use realistic mock data** that matches production
3. **Reset mocks** between tests
4. **Test both success and failure scenarios**

### Assertion Patterns
1. **Use semantic queries** (getByRole, getByLabelText)
2. **Test user interactions** not implementation details
3. **Wait for async operations** with `waitFor`
4. **Check error states** and loading states

### Performance Considerations
1. **Use `screen` queries** for better performance
2. **Avoid unnecessary re-renders** in tests
3. **Clean up resources** after tests
4. **Use `jest.clearAllMocks()`** in `beforeEach`

## Troubleshooting

### Common Issues

#### Test Timeouts
```typescript
// Increase timeout for slow tests
jest.setTimeout(10000);

// Or use waitFor with custom timeout
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });
```

#### Mock Not Working
```typescript
// Ensure mock is set up before render
jest.spyOn(require('@contexts/AdminAuthContext'), 'useAdminAuth').mockReturnValue({
  login: mockLogin,
  user: null,
  isAuthenticated: false,
  isLoading: false,
});

render(<MyComponent />);
```

#### Async Test Failures
```typescript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
}, { timeout: 3000 });
```

### Debug Commands
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific test file
npm test -- MyComponent.test.tsx

# Run tests with coverage for specific file
npm run test:coverage -- --collectCoverageFrom="src/components/MyComponent.tsx"

# Debug tests with Node inspector
npm run test:debug -- --inspect-brk
```

## Future Enhancements

### Planned Improvements
1. **E2E Testing**: Add Cypress tests for critical user flows
2. **Visual Regression**: Add visual testing with Percy
3. **Performance Testing**: Add performance benchmarks
4. **Accessibility Testing**: Add axe-core integration
5. **Contract Testing**: Add API contract testing

### Test Automation
1. **Auto-generate tests** for new components
2. **Test coverage badges** in README
3. **Automated test review** in PRs
4. **Performance regression** detection

## Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://github.com/testing-library/jest-dom#custom-matchers) 