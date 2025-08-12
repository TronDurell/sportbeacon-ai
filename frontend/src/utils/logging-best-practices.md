# Logging Best Practices - Console.log Cleanup Guide

This document provides comprehensive guidelines for proper logging in the SportBeaconAI application, including console.log cleanup and production-ready logging practices.

## Table of Contents

1. [Console.log Cleanup](#consolelog-cleanup)
2. [Production Logging System](#production-logging-system)
3. [Development vs Production Logging](#development-vs-production-logging)
4. [ESLint Configuration](#eslint-configuration)
5. [Build Process Configuration](#build-process-configuration)
6. [Best Practices](#best-practices)
7. [Migration Guide](#migration-guide)

## Console.log Cleanup

### ✅ Good Practices

```typescript
// ✅ Use the logger utility
import { logger } from '../utils/logger';

// Development logging
logger.debug('User clicked button', { buttonId: 'submit', userId: '123' });

// Production error logging
logger.error('Failed to save user data', error, { userId: '123' });

// Critical errors
logger.critical('Database connection failed', error, { 
  connectionString: '***', 
  timestamp: new Date() 
});
```

### ❌ Bad Practices

```typescript
// ❌ Direct console.log usage
console.log('User clicked button'); // Will be removed in production

// ❌ Console.error without proper context
console.error('Error occurred', error); // No user context or structured data

// ❌ Debug information in production
console.log('API Response:', response); // Exposes sensitive data
```

## Production Logging System

### Logger Utility Features

The `logger` utility provides:

- **Environment-aware logging**: Different behavior in development vs production
- **Structured logging**: Consistent format with timestamps and context
- **Remote logging**: Integration with error monitoring services
- **Local storage**: Development logging with persistence
- **Log levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Batch processing**: Efficient remote logging with buffering

### Usage Examples

```typescript
import { logger, useLogger } from '../utils/logger';

// Basic logging
logger.info('Application started');
logger.warn('API rate limit approaching', { requests: 95, limit: 100 });
logger.error('Authentication failed', error, { userId: '123' });

// React component logging
const MyComponent = () => {
  const log = useLogger('MyComponent');
  
  const handleClick = () => {
    log.info('Button clicked', { buttonType: 'submit' });
    // ... rest of the logic
  };
  
  return <button onClick={handleClick}>Submit</button>;
};
```

## Development vs Production Logging

### Development Environment

```typescript
// Development logging - full console output
logger.debug('Component rendered', { props, state });
logger.info('API call started', { endpoint: '/api/users' });
logger.warn('Deprecated method called', { method: 'oldFunction' });

// Console output:
// [2025-01-16T10:30:00.000Z] [DEBUG] [MyComponent] Component rendered { props: {...}, state: {...} }
// [2025-01-16T10:30:01.000Z] [INFO] [API] API call started { endpoint: '/api/users' }
// [2025-01-16T10:30:02.000Z] [WARN] [Utils] Deprecated method called { method: 'oldFunction' }
```

### Production Environment

```typescript
// Production logging - only WARN, ERROR, CRITICAL
logger.warn('API rate limit approaching', { requests: 95, limit: 100 });
logger.error('Database connection failed', error, { 
  connectionId: 'db-123',
  retryCount: 3 
});

// Remote logging (no console output):
// Sent to error monitoring service with structured data
```

## ESLint Configuration

### Current Configuration

```javascript
// frontend/eslint.config.js
{
  rules: {
    // Environment-aware console rules
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': 'error',
  }
}
```

### Allowed Console Methods

In development:
- `console.log` - General debugging
- `console.info` - Informational messages
- `console.warn` - Warning messages
- `console.error` - Error messages
- `console.debug` - Debug messages

In production:
- `console.error` - Critical errors only (via logger)
- All other console methods are blocked

## Build Process Configuration

### Vite Configuration

```typescript
// frontend/vite.config.ts
export default defineConfig(({ mode }) => ({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console statements in production
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
    },
  },
  esbuild: {
    // Remove console statements in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
```

### Automatic Console Removal

The build process automatically:

1. **Removes console.log statements** in production builds
2. **Removes debugger statements** in production builds
3. **Optimizes bundle size** by eliminating debug code
4. **Maintains source maps** for development debugging

## Best Practices

### 1. Use Structured Logging

```typescript
// ✅ Good - Structured data
logger.info('User action completed', {
  action: 'profile_update',
  userId: '123',
  duration: 1500,
  success: true
});

// ❌ Bad - Unstructured logging
console.log('User updated profile'); // No context or data
```

### 2. Include Context

```typescript
// ✅ Good - Rich context
logger.error('API request failed', error, {
  endpoint: '/api/users',
  method: 'POST',
  userId: '123',
  requestId: 'req-456',
  timestamp: new Date().toISOString()
});

// ❌ Bad - Minimal context
console.error('API failed', error);
```

### 3. Use Appropriate Log Levels

```typescript
// DEBUG - Detailed debugging information
logger.debug('Component state changed', { prevState, newState });

// INFO - General application flow
logger.info('User logged in', { userId: '123', method: 'email' });

// WARN - Potential issues
logger.warn('API response time slow', { duration: 5000, threshold: 3000 });

// ERROR - Error conditions
logger.error('Database query failed', error, { query: 'SELECT * FROM users' });

// CRITICAL - Application-breaking issues
logger.critical('Database connection lost', error, { 
  connectionString: '***',
  retryAttempts: 5 
});
```

### 4. Handle Sensitive Data

```typescript
// ✅ Good - Sanitized data
logger.info('User authentication', {
  userId: '123',
  method: 'email',
  success: true,
  // Don't log passwords, tokens, or sensitive data
});

// ❌ Bad - Exposing sensitive data
console.log('User login:', { email: 'user@example.com', password: 'secret123' });
```

### 5. Use React Hook for Components

```typescript
// ✅ Good - Component-specific logging
const UserProfile = () => {
  const log = useLogger('UserProfile');
  
  const handleSave = async () => {
    log.info('Saving user profile', { userId: '123' });
    try {
      await saveProfile(data);
      log.info('Profile saved successfully', { userId: '123' });
    } catch (error) {
      log.error('Failed to save profile', error, { userId: '123' });
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
};
```

## Migration Guide

### Step 1: Replace Console.log with Logger

```typescript
// Before
console.log('User clicked button');

// After
import { logger } from '../utils/logger';
logger.info('User clicked button', { buttonId: 'submit' });
```

### Step 2: Replace Console.error with Logger

```typescript
// Before
console.error('API failed', error);

// After
logger.error('API request failed', error, { 
  endpoint: '/api/users',
  method: 'POST' 
});
```

### Step 3: Add Context to Logs

```typescript
// Before
logger.info('User action');

// After
logger.info('User profile updated', {
  userId: '123',
  fields: ['name', 'email'],
  timestamp: new Date().toISOString()
});
```

### Step 4: Use React Hook in Components

```typescript
// Before
import { logger } from '../utils/logger';

const MyComponent = () => {
  const handleClick = () => {
    logger.info('Button clicked');
  };
};

// After
import { useLogger } from '../utils/logger';

const MyComponent = () => {
  const log = useLogger('MyComponent');
  
  const handleClick = () => {
    log.info('Button clicked', { buttonType: 'submit' });
  };
};
```

## CI/CD Integration

### Pre-deployment Checks

The CI/CD pipeline includes:

```yaml
# .github/workflows/full-frontend-deploy.yml
- name: Check for console.log statements
  run: |
    CONSOLE_LOG_COUNT=$(grep -r "console\.log" frontend/src --include="*.ts" --include="*.tsx" | wc -l)
    if [ $CONSOLE_LOG_COUNT -gt 0 ]; then
      echo "❌ Found $CONSOLE_LOG_COUNT console.log statements in production code"
      exit 1
    fi
```

### Automated Cleanup

```bash
# Run console cleanup script
npm run cleanup:console

# Check for console statements
npm run lint:console
```

## Testing

### Unit Tests

```typescript
import { logger } from '../utils/logger';

// Mock logger for testing
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

test('logs user action', () => {
  const { logger } = require('../utils/logger');
  
  // Trigger action that should log
  handleUserAction();
  
  expect(logger.info).toHaveBeenCalledWith(
    'User action completed',
    expect.objectContaining({ action: 'test' })
  );
});
```

### Integration Tests

```typescript
// Test that console.log statements are not in production build
test('production build has no console.log', () => {
  const buildOutput = fs.readFileSync('dist/main.js', 'utf8');
  expect(buildOutput).not.toContain('console.log');
});
```

## Summary

### Key Benefits

1. **Performance**: No console overhead in production
2. **Security**: No sensitive data in console logs
3. **Monitoring**: Structured logging for error tracking
4. **Debugging**: Rich context for development debugging
5. **Compliance**: Proper error logging for production monitoring

### Implementation Checklist

- [ ] Replace all `console.log` with `logger.info`
- [ ] Replace all `console.error` with `logger.error`
- [ ] Add context to all log statements
- [ ] Use `useLogger` hook in React components
- [ ] Configure ESLint for production console blocking
- [ ] Set up build process for automatic console removal
- [ ] Add CI/CD checks for console statements
- [ ] Test logging in development and production
- [ ] Document logging patterns for team

### Maintenance

- **Regular audits**: Check for new console.log statements
- **Log level review**: Ensure appropriate log levels are used
- **Performance monitoring**: Monitor logging impact on performance
- **Error tracking**: Review error logs for patterns and issues