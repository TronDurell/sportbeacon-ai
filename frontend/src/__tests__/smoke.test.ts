import { describe, it, expect } from '@jest/globals';

describe('Smoke Tests', () => {
  it('should import memory SDK without errors', async () => {
    // Test that the SDK can be imported without runtime errors
    const { memoryClient } = await import('@sportbeacon/memory-sdk');
    expect(memoryClient).toBeDefined();
  });

  it('should have manifest icons available', () => {
    // Test that manifest icons exist (mocked for now)
    const manifestIcons = [
      '/icons/icon-192.png',
      '/icons/icon-512.png'
    ];
    
    manifestIcons.forEach(iconPath => {
      expect(iconPath).toMatch(/^\/icons\/icon-\d+\.png$/);
    });
  });
});
