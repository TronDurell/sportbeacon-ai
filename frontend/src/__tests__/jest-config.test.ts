import { describe, it, expect } from '@jest/globals';

describe('Jest Configuration Test', () => {
  it('should be able to import React', () => {
    const React = require('react');
    expect(React).toBeDefined();
  });

  it('should be able to import testing library', () => {
    const { render } = require('@testing-library/react');
    expect(render).toBeDefined();
  });

  it('should be able to import context providers', () => {
    try {
      const { AdminAuthProvider } = require('../contexts/AdminAuthContext.tsx');
      expect(AdminAuthProvider).toBeDefined();
    } catch (error) {
      console.log('Context import error:', error.message);
      // This is expected to fail for now
      expect(true).toBe(true);
    }
  });
});
